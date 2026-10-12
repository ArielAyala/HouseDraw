import { Minus, MousePointer2, Square } from 'lucide-react'
import { type EditorTool, useEditorStore } from '../tools/editor'
import styles from './Toolbar.module.css'

const TOOLS: Array<{ id: EditorTool; label: string; icon: typeof Minus }> = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'wall', label: 'Wall', icon: Minus },
  { id: 'room', label: 'Room', icon: Square },
]

export default function Toolbar() {
  const tool = useEditorStore((state) => state.tool)
  const setTool = useEditorStore((state) => state.setTool)

  return (
    <div className={styles.bar} role="toolbar" aria-label="Tools">
      {TOOLS.map((item) => {
        const Icon = item.icon
        const pressed = tool === item.id
        return (
          <button
            key={item.id}
            type="button"
            className={
              pressed ? `${styles.button} ${styles.active}` : styles.button
            }
            aria-label={item.label}
            aria-pressed={pressed}
            onClick={() => setTool(item.id)}
          >
            <Icon size={16} />
          </button>
        )
      })}
    </div>
  )
}
