import type { DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation()
  const tool = useEditorStore((state) => state.tool)
  const stampId = useEditorStore((state) => state.stampId)
  const setStampId = useEditorStore((state) => state.setStampId)

  return (
    <aside className={styles.panel} aria-label={t('catalog.label')}>
      <h2 className={styles.title}>{t('catalog.title')}</h2>
      {CATALOG_GROUPS.map((group) => (
        <section key={group} className={styles.group}>
          <h3 className={styles.groupTitle}>{t(`catalog.groups.${group}`)}</h3>
          <ul className={styles.list}>
            {CATALOG.filter((entry) => entry.group === group).map((entry) => (
              <li key={entry.id}>
                <CatalogButton
                  entry={entry}
                  active={tool === 'stamp' && stampId === entry.id}
                  locale={i18n.language}
                  onSelect={() => setStampId(entry.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </aside>
  )
}

function CatalogButton(props: {
  entry: CatalogEntry
  active: boolean
  locale: string
  onSelect: () => void
}) {
  const { entry, active, locale, onSelect } = props
  const { t } = useTranslation()
  const setStampId = useEditorStore((state) => state.setStampId)
  const label = t(`catalog.items.${entry.id}`)
  const size = `${formatDimensionMm(entry.widthMm, locale)} × ${formatDimensionMm(entry.heightMm, locale)}`
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
      title={`${label} · ${size}`}
    >
      <span>{label}</span>
      <span className={styles.size}>{size}</span>
    </button>
  )
}
