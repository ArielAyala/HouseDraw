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
import { moveWallsById } from '../tools/edit'
import { pruneSelectedWallIds, useEditorStore } from '../tools/editor'
import { distanceMm } from '../tools/geometry'
import type { ToolPointer } from '../tools/pointer'
import { useSelectTool } from '../tools/useSelectTool'
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
  const tool = useEditorStore((state) => state.tool)
  const selectedWallIds = useEditorStore((state) => state.selectedWallIds)
  const setSelectedWallIds = useEditorStore((state) => state.setSelectedWallIds)
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
  const wallTool = useWallTool(tool === 'wall')
  const selectTool = useSelectTool(tool === 'select')

  const commitCamera = useCallback((next: Camera) => {
    cameraRef.current = next
    setCamera(next)
  }, [])

  useEffect(() => {
    const wallIds = plan.walls.map((wall) => wall.id)
    const pruned = pruneSelectedWallIds(selectedWallIds, wallIds)
    if (pruned.length !== selectedWallIds.length) {
      setSelectedWallIds(pruned)
    }
  }, [plan.walls, selectedWallIds, setSelectedWallIds])

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

  const displayPlan = useMemo(() => {
    const drag = selectTool.session.drag
    if (!drag) {
      return plan
    }
    return moveWallsById(plan, drag.wallIds, drag.delta)
  }, [plan, selectTool.session.drag])

  const overlay = useMemo<PlanOverlay>(() => {
    const end = wallPreview(wallTool.session)
    return {
      selectedWallIds,
      draft:
        tool === 'wall' && wallTool.session.start && end
          ? {
              a: wallTool.session.start,
              b: end,
              thicknessMm: plan.settings.wallThicknessMm,
            }
          : null,
      marquee: tool === 'select' ? selectTool.session.marquee : null,
    }
  }, [
    plan.settings.wallThicknessMm,
    selectTool.session.marquee,
    selectedWallIds,
    tool,
    wallTool.session,
  ])

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
    renderPlan(ctx, camera, { width, height }, colors, displayPlan, overlay)
  }, [camera, colors, displayPlan, overlay])

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

  const toToolPointer = (event: {
    clientX: number
    clientY: number
    shiftKey: boolean
  }): ToolPointer | null => {
    const canvas = canvasRef.current
    if (!canvas) {
      return null
    }
    const screen = clientToCanvas(event, canvas)
    return {
      world: screenToWorld(cameraRef.current, screen),
      screen,
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
      if (tool === 'wall') {
        wallTool.onCancel()
      } else {
        selectTool.onCancel()
      }
      return
    }
    if (event.button !== 0) {
      return
    }
    const pointer = toToolPointer(event)
    if (!pointer) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    if (tool === 'wall') {
      wallTool.onClick(pointer)
      return
    }
    selectTool.onPointerDown(pointer)
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
    const pointer = toToolPointer(event)
    if (!pointer) {
      return
    }
    if (tool === 'wall') {
      wallTool.onMove(pointer)
      return
    }
    selectTool.onPointerMove(pointer)
  }

  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (panRef.current) {
      panRef.current = null
      setPanning(false)
      return
    }
    if (tool !== 'select') {
      return
    }
    const pointer = toToolPointer(event)
    if (pointer) {
      selectTool.onPointerUp(pointer)
    }
  }

  const gridStep = activeGridStepMm(planGrid(camera.scale))
  const cursorClass = panning
    ? styles.panning
    : spaceDown
      ? styles.grab
      : tool === 'select'
        ? styles.select
        : styles.crosshair

  const selectedWall =
    selectedWallIds.length === 1
      ? displayPlan.walls.find((wall) => wall.id === selectedWallIds[0])
      : undefined
  const preview = wallPreview(wallTool.session)
  const statusLength =
    tool === 'wall' && wallTool.session.start && preview
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
        <span>{tool === 'select' ? 'Select' : 'Wall'}</span>
        {statusLength ? (
          <>
            <span className={styles.dot} aria-hidden="true">
              ·
            </span>
            <span>{statusLength}</span>
          </>
        ) : null}
        {tool === 'wall' && wallTool.session.typed ? (
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
