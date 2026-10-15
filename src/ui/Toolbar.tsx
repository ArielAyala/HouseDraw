import {
  DoorOpen,
  GripHorizontal,
  GripVertical,
  Hand,
  Minus,
  MousePointer2,
  RectangleHorizontal,
  Sofa,
  Square,
} from 'lucide-react'
import {
  type PointerEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { type EditorTool, useEditorStore } from '../tools/editor'
import styles from './Toolbar.module.css'
import {
  isHorizontalPlacement,
  readToolbarPlacement,
  resolveToolbarLayout,
  type Size,
  snapPlacement,
  type ToolbarPlacement,
  writeToolbarPlacement,
} from './toolbarPlacement'

const TOOLS: Array<{
  id: EditorTool
  shortcut?: string
  icon: typeof Minus
}> = [
  { id: 'pan', shortcut: 'H', icon: Hand },
  { id: 'select', shortcut: 'V', icon: MousePointer2 },
  { id: 'wall', shortcut: 'W', icon: Minus },
  { id: 'room', icon: Square },
  { id: 'door', icon: DoorOpen },
  { id: 'window', icon: RectangleHorizontal },
  { id: 'stamp', icon: Sofa },
]

type DragSession = {
  pointerId: number
  offsetX: number
  offsetY: number
  stageLeft: number
  stageTop: number
  x: number | null
  y: number | null
}

type Metrics = { stage: Size; bar: Size }

function sameMetrics(a: Metrics | null, b: Metrics): boolean {
  return (
    a !== null &&
    a.stage.width === b.stage.width &&
    a.stage.height === b.stage.height &&
    a.bar.width === b.bar.width &&
    a.bar.height === b.bar.height
  )
}

export default function Toolbar() {
  const { t } = useTranslation()
  const tool = useEditorStore((state) => state.tool)
  const setTool = useEditorStore((state) => state.setTool)
  const barRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragSession | null>(null)
  const [placement, setPlacement] = useState<ToolbarPlacement | null>(
    readToolbarPlacement,
  )
  const [preview, setPreview] = useState<{ x: number; y: number } | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  const measure = useCallback(() => {
    const bar = barRef.current
    const stage = bar?.parentElement
    if (!bar || !stage) return
    const next: Metrics = {
      stage: { width: stage.clientWidth, height: stage.clientHeight },
      bar: { width: bar.offsetWidth, height: bar.offsetHeight },
    }
    setMetrics((prev) => (sameMetrics(prev, next) ? prev : next))
  }, [])

  useLayoutEffect(() => {
    measure()
  })

  useLayoutEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const active: ToolbarPlacement | null = preview
    ? { edge: 'free', x: preview.x, y: preview.y }
    : placement
  const layout =
    active && metrics
      ? resolveToolbarLayout(active, metrics.stage, metrics.bar)
      : null
  const horizontal = active ? isHorizontalPlacement(active) : false

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const bar = barRef.current
    const stage = bar?.parentElement
    if (!bar || !stage) return
    const barRect = bar.getBoundingClientRect()
    const stageRect = stage.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - barRect.left,
      offsetY: event.clientY - barRect.top,
      stageLeft: stageRect.left,
      stageTop: stageRect.top,
      x: null,
      y: null,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const x = event.clientX - drag.stageLeft - drag.offsetX
    const y = event.clientY - drag.stageTop - drag.offsetY
    drag.x = x
    drag.y = y
    setPreview({ x, y })
  }

  const handlePointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
    setPreview(null)
    const bar = barRef.current
    const stage = bar?.parentElement
    if (!bar || !stage || drag.x === null || drag.y === null) return
    const next = snapPlacement(
      drag.x,
      drag.y,
      { width: stage.clientWidth, height: stage.clientHeight },
      { width: bar.offsetWidth, height: bar.offsetHeight },
    )
    setPlacement(next)
    writeToolbarPlacement(next)
  }

  const GripIcon = horizontal ? GripVertical : GripHorizontal
  const gripLabel = t('tools.moveToolbar')

  return (
    <div
      ref={barRef}
      className={[
        styles.bar,
        horizontal ? styles.horizontal : '',
        preview ? styles.dragging : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={layout ? { ...layout, transform: 'none' } : undefined}
      role="toolbar"
      aria-label={t('tools.label')}
    >
      <button
        type="button"
        className={horizontal ? styles.gripHorizontal : styles.grip}
        aria-label={gripLabel}
        title={gripLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <GripIcon size={16} />
      </button>
      {TOOLS.map((item) => {
        const Icon = item.icon
        const pressed = tool === item.id
        const label = t(`tools.${item.id}`)
        const title = item.shortcut
          ? t('tools.withShortcut', { label, key: item.shortcut })
          : item.id === 'stamp'
            ? t('tools.stampHint')
            : label
        return (
          <button
            key={item.id}
            type="button"
            className={
              pressed ? `${styles.button} ${styles.active}` : styles.button
            }
            aria-label={label}
            aria-pressed={pressed}
            title={title}
            onClick={() => setTool(item.id)}
          >
            <Icon size={16} />
          </button>
        )
      })}
    </div>
  )
}
