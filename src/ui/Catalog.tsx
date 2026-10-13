import type { DragEvent } from 'react'
import { formatDimensionMm } from '../canvas/units'
import {
  CATALOG,
  CATALOG_DRAG_TYPE,
  CATALOG_GROUPS,
  type CatalogEntry,
} from '../catalog/catalog'
import { useEditorStore } from '../tools/editor'
import styles from './Catalog.module.css'

export default function Catalog() {
  const tool = useEditorStore((state) => state.tool)
  const stampId = useEditorStore((state) => state.stampId)
  const setStampId = useEditorStore((state) => state.setStampId)

  return (
    <aside className={styles.panel} aria-label="Catalog">
      <h2 className={styles.title}>Catalog</h2>
      {CATALOG_GROUPS.map((group) => (
        <section key={group.id} className={styles.group}>
          <h3 className={styles.groupTitle}>{group.label}</h3>
          <ul className={styles.list}>
            {CATALOG.filter((entry) => entry.group === group.id).map(
              (entry) => (
                <li key={entry.id}>
                  <CatalogButton
                    entry={entry}
                    active={tool === 'stamp' && stampId === entry.id}
                    onSelect={() => setStampId(entry.id)}
                  />
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </aside>
  )
}

function CatalogButton(props: {
  entry: CatalogEntry
  active: boolean
  onSelect: () => void
}) {
  const { entry, active, onSelect } = props
  const setStampId = useEditorStore((state) => state.setStampId)
  const onDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData(CATALOG_DRAG_TYPE, entry.id)
    event.dataTransfer.effectAllowed = 'copy'
    setStampId(entry.id)
  }
  return (
    <button
      type="button"
      draggable
      className={active ? `${styles.item} ${styles.active}` : styles.item}
      aria-pressed={active}
      onClick={onSelect}
      onDragStart={onDragStart}
      title={`${entry.label} · ${formatDimensionMm(entry.widthMm)} × ${formatDimensionMm(entry.heightMm)}`}
    >
      <span>{entry.label}</span>
      <span className={styles.size}>
        {formatDimensionMm(entry.widthMm)} × {formatDimensionMm(entry.heightMm)}
      </span>
    </button>
  )
}
