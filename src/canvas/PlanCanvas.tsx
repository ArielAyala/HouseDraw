import {
  type PointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTheme } from '../app/ThemeProvider'
import { useDocumentStore } from '../document/store'
import { distanceMm } from '../tools/geometry'
import { useWallTool } from '../tools/useWallTool'
import { wallPreview } from '../tools/wall'
import {
  type Camera,
  createCamera,
  panCamera,
  recenterOnResize,
  type Size,
  screenToWorld,
  wheelZoomFactor,
  zoomCameraAt,
  zoomPercent,
} from './camera'
import { canvasColorsFromTheme } from './colors'
import { activeGridStepMm, planGrid } from './grid'
import styles from './PlanCanvas.module.css'
import { type PlanOverlay, renderPlan } from './render'
import { formatDimensionMm, formatLengthMm, formatZoomPercent } from './units'

export default function PlanCanvas() {
  const { theme } = useTheme()
  const plan = useDocumentStore((state) => state.document)
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cameraRef = useRef<Camera>(createCamera({ width: 0, height: 0 }))
  const sizeRef = useRef<Size>({ width: 0, height: 0 })
  const spaceRef = useRef(false)
  const panRef = useRef<{ lastX: number; lastY: number } | null>(null)

  const [camera, setCamera] = useState<Camera>(cameraRef.current)
  const [spaceDown, setSpaceDown] = useState(false)
  const [panning, setPanning] = useState(false)
  const colors = canvasColorsFromTheme(theme)
  const wallTool = useWallTool()

  const commitCamera = useCallback((next: Camera) => {
    cameraRef.current = next
    setCamera(next)
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }
      const next = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }
      if (next.width <= 0 || next.height <= 0) {
        return
      }
      const prev = sizeRef.current
      sizeRef.current = next
      commitCamera(recenterOnResize(cameraRef.current, prev, next))
    })

    observer.observe(wrap)
    return () => observer.disconnect()
  }, [commitCamera])

  const preview = wallPreview(wallTool.session)
  const overlay = useMemo<PlanOverlay>(() => {
    const end = wallPreview(wallTool.session)
    return {
      selectedWallId: wallTool.session.selectedWallId,
      draft:
        wallTool.session.start && end
          ? {
              a: wallTool.session.start,
              b: end,
              thicknessMm: plan.settings.wallThicknessMm,
            }
          : null,
    }
  }, [plan.settings.wallThicknessMm, wallTool.session])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    const { width, height } = sizeRef.current
    if (width <= 0 || height <= 0) {
      return
    }
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    renderPlan(ctx, camera, { width, height }, colors, plan, overlay)
  }, [camera, colors, overlay, plan])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const point = clientToCanvas(event, canvas)
      const factor = wheelZoomFactor(event.deltaY, event.deltaMode)
      commitCamera(zoomCameraAt(cameraRef.current, point, factor))
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [commitCamera])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== 'Space' ||
        event.repeat ||
        isTypingTarget(event.target)
      ) {
        return
      }
      event.preventDefault()
      spaceRef.current = true
      setSpaceDown(true)
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') {
        return
      }
      spaceRef.current = false
      setSpaceDown(false)
    }

    const onBlur = () => {
      spaceRef.current = false
      setSpaceDown(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  const toWallPointer = (event: {
    clientX: number
    clientY: number
    shiftKey: boolean
  }) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return null
    }
    const screen = clientToCanvas(event, canvas)
    return {
      world: screenToWorld(cameraRef.current, screen),
      shiftKey: event.shiftKey,
      scale: cameraRef.current.scale,
    }
  }

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const panWithLeft = event.button === 0 && spaceRef.current
    const panWithMiddle = event.button === 1
    if (panWithLeft || panWithMiddle) {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      panRef.current = { lastX: event.clientX, lastY: event.clientY }
      setPanning(true)
      return
    }
    if (event.button === 2) {
      event.preventDefault()
      wallTool.onCancel()
      return
    }
    if (event.button !== 0) {
      return
    }
    const pointer = toWallPointer(event)
    if (pointer) {
      wallTool.onClick(pointer)
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const pan = panRef.current
    if (pan) {
      const dx = event.clientX - pan.lastX
      const dy = event.clientY - pan.lastY
      pan.lastX = event.clientX
      pan.lastY = event.clientY
      commitCamera(panCamera(cameraRef.current, dx, dy))
      return
    }
    const pointer = toWallPointer(event)
    if (pointer) {
      wallTool.onMove(pointer)
    }
  }

  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!panRef.current) {
      return
    }
    panRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setPanning(false)
  }

  const gridStep = activeGridStepMm(planGrid(camera.scale))
  const cursorClass = panning
    ? styles.panning
    : spaceDown
      ? styles.grab
      : styles.crosshair

  const selectedWall = plan.walls.find(
    (wall) => wall.id === wallTool.session.selectedWallId,
  )
  const statusLength =
    wallTool.session.start && preview
      ? formatDimensionMm(distanceMm(wallTool.session.start, preview))
      : selectedWall
        ? formatDimensionMm(distanceMm(selectedWall.a, selectedWall.b))
        : null

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} ${cursorClass}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(event) => event.preventDefault()}
      />
      <div className={styles.status}>
        <span>{formatZoomPercent(zoomPercent(camera))}</span>
        <span className={styles.dot} aria-hidden="true">
          ·
        </span>
        <span>Grid {formatLengthMm(gridStep)}</span>
        <span className={styles.dot} aria-hidden="true">
          ·
        </span>
        <span>Wall</span>
        {statusLength ? (
          <>
            <span className={styles.dot} aria-hidden="true">
              ·
            </span>
            <span>{statusLength}</span>
          </>
        ) : null}
        {wallTool.session.typed ? (
          <>
            <span className={styles.dot} aria-hidden="true">
              ·
            </span>
            <span>{wallTool.session.typed}</span>
          </>
        ) : null}
      </div>
    </div>
  )
}

function clientToCanvas(
  event: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}
