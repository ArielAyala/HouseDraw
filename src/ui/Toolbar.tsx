import {
  DoorOpen,
  Hand,
  Minus,
  MousePointer2,
  RectangleHorizontal,
  Sofa,
  Square,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type EditorTool, useEditorStore } from '../tools/editor'
import styles from './Toolbar.module.css'

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

export default function Toolbar() {
  const { t } = useTranslation()
  const tool = useEditorStore((state) => state.tool)
  const setTool = useEditorStore((state) => state.setTool)

  return (
    <div className={styles.bar} role="toolbar" aria-label={t('tools.label')}>
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
