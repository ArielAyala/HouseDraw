import {
  DoorOpen,
  Hand,
  Minus,
  MousePointer2,
  RectangleHorizontal,
  Sofa,
  Square,
} from 'lucide-react'
import { type EditorTool, useEditorStore } from '../tools/editor'
import styles from './Toolbar.module.css'

const TOOLS: Array<{
  id: EditorTool
  label: string
  shortcut?: string
  icon: typeof Minus
}> = [
  { id: 'pan', label: 'Pan', shortcut: 'H', icon: Hand },
  { id: 'select', label: 'Select', shortcut: 'V', icon: MousePointer2 },
  { id: 'wall', label: 'Wall', shortcut: 'W', icon: Minus },
  { id: 'room', label: 'Room', icon: Square },
  { id: 'door', label: 'Door', icon: DoorOpen },
  { id: 'window', label: 'Window', icon: RectangleHorizontal },
  { id: 'stamp', label: 'Stamp', icon: Sofa },
]

export default function Toolbar() {
  const tool = useEditorStore((state) => state.tool)
  const setTool = useEditorStore((state) => state.setTool)

  return (
    <div className={styles.bar} role="toolbar" aria-label="Tools">
      {TOOLS.map((item) => {
        const Icon = item.icon
        const pressed = tool === item.id
        const title = item.shortcut
          ? `${item.label} (${item.shortcut})`
          : item.id === 'stamp'
            ? 'Stamp (pick an item from the catalog)'
            : item.label
        return (
          <button
            key={item.id}
            type="button"
            className={
              pressed ? `${styles.button} ${styles.active}` : styles.button
            }
            aria-label={item.label}
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
