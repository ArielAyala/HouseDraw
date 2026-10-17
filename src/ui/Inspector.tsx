import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCmValueMm, formatDimensionMm } from '../canvas/units'
import { findCatalogEntry } from '../catalog/catalog'
import { deleteItemsById, rotateItemsById } from '../document/items'
import { fitOpeningsToWall } from '../document/openings'
import { detectRooms, formatAreaMm2, renameRoom } from '../document/rooms'
import { useDocumentStore } from '../document/store'
import type { Item, OpeningKind } from '../document/types'
import {
  setWallLengthMm,
  setWallThicknessMm,
  updateWallById,
} from '../tools/edit'
import { useEditorStore } from '../tools/editor'
import { distanceMm } from '../tools/geometry'
import {
  parseLengthInput,
  parseOpeningWidthInput,
  parseThicknessInput,
} from '../tools/length'
import styles from './Inspector.module.css'

export default function Inspector() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const plan = useDocumentStore((state) => state.document)
  const apply = useDocumentStore((state) => state.apply)
  const tool = useEditorStore((state) => state.tool)
  const selectedWallIds = useEditorStore((state) => state.selectedWallIds)
  const selected = plan.walls.filter((wall) =>
    selectedWallIds.includes(wall.id),
  )
  const wall = selected.length === 1 ? selected[0] : undefined

  const selectedItemIds = useEditorStore((state) => state.selectedItemIds)
  const selectedItem =
    selectedItemIds.length === 1
      ? plan.items.find((item) => item.id === selectedItemIds[0])
      : undefined

  const [lengthInput, setLengthInput] = useState('')
  const [thicknessInput, setThicknessInput] = useState('')

  useEffect(() => {
    if (!wall) {
      setLengthInput('')
      setThicknessInput('')
      return
    }
    setLengthInput(formatDimensionMm(distanceMm(wall.a, wall.b), locale))
    setThicknessInput(formatCmValueMm(wall.thicknessMm, locale))
  }, [wall, locale])

  if (selectedItem) {
    return <ItemPanel item={selectedItem} />
  }

  if (selected.length === 0) {
    if (tool === 'door' || tool === 'window') {
      return <OpeningPanel kind={tool} />
    }
    return <RoomsPanel />
  }

  if (!wall) {
    return (
      <aside className={styles.panel} aria-label={t('inspector.label')}>
        <h2 className={styles.title}>
          {t('inspector.walls', { count: selected.length })}
        </h2>
        <p className={styles.hint}>{t('inspector.deleteHint')}</p>
      </aside>
    )
  }

  const lengthMm = distanceMm(wall.a, wall.b)

  const commitLength = () => {
    const mm = parseLengthInput(lengthInput)
    if (mm === null) {
      setLengthInput(formatDimensionMm(lengthMm, locale))
      return
    }
    const next = setWallLengthMm(wall, mm)
    if (next === wall) {
      setLengthInput(formatDimensionMm(lengthMm, locale))
      return
    }
    apply((document) =>
      fitOpeningsToWall(
        updateWallById(document, wall.id, (current) =>
          setWallLengthMm(current, mm),
        ),
        wall.id,
      ),
    )
  }

  const commitThickness = () => {
    const mm = parseThicknessInput(thicknessInput)
    if (mm === null) {
      setThicknessInput(formatCmValueMm(wall.thicknessMm, locale))
      return
    }
    const next = setWallThicknessMm(wall, mm)
    if (next === wall) {
      setThicknessInput(formatCmValueMm(wall.thicknessMm, locale))
      return
    }
    apply((document) =>
      updateWallById(document, wall.id, (current) =>
        setWallThicknessMm(current, mm),
      ),
    )
  }

  const onLengthSubmit = (event: FormEvent) => {
    event.preventDefault()
    commitLength()
  }

  const onThicknessSubmit = (event: FormEvent) => {
    event.preventDefault()
    commitThickness()
  }

  return (
    <aside className={styles.panel} aria-label={t('inspector.label')}>
      <h2 className={styles.title}>{t('inspector.wallTitle')}</h2>
      <form className={styles.field} onSubmit={onLengthSubmit}>
        <label className={styles.label} htmlFor="wall-length">
          {t('inspector.length')}
        </label>
        <input
          id="wall-length"
          className={styles.input}
          value={lengthInput}
          onChange={(event) => setLengthInput(event.target.value)}
          onBlur={commitLength}
        />
        <span className={styles.meta}>{Math.round(lengthMm)} mm</span>
      </form>
      <form className={styles.field} onSubmit={onThicknessSubmit}>
        <label className={styles.label} htmlFor="wall-thickness">
          {t('inspector.thickness')}
        </label>
        <input
          id="wall-thickness"
          className={styles.input}
          value={thicknessInput}
          onChange={(event) => setThicknessInput(event.target.value)}
          onBlur={commitThickness}
        />
        <span className={styles.meta}>cm</span>
      </form>
    </aside>
  )
}

function ItemPanel(props: { item: Item }) {
  const { item } = props
  const { t, i18n } = useTranslation()
  const apply = useDocumentStore((state) => state.apply)
  const clearSelection = useEditorStore((state) => state.clearSelection)
  const entry = findCatalogEntry(item.catalogId)
  const locale = i18n.language
  return (
    <aside className={styles.panel} aria-label={t('inspector.item')}>
      <h2 className={styles.title}>
        {entry ? t(`catalog.items.${entry.id}`) : t('inspector.itemFallback')}
      </h2>
      <div className={styles.field}>
        <span className={styles.label}>{t('inspector.size')}</span>
        <span className={styles.meta}>
          {formatDimensionMm(item.widthMm, locale)} ×{' '}
          {formatDimensionMm(item.heightMm, locale)}
        </span>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>{t('inspector.rotation')}</span>
        <span className={styles.meta}>{item.rotationDeg}°</span>
      </div>
      <button
        type="button"
        className={styles.button}
        onClick={() =>
          apply((document) => rotateItemsById(document, [item.id]))
        }
      >
        {t('inspector.rotate')}
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={() => {
          apply((document) => deleteItemsById(document, [item.id]))
          clearSelection()
        }}
      >
        {t('inspector.delete')}
      </button>
    </aside>
  )
}

function OpeningPanel(props: { kind: OpeningKind }) {
  const { kind } = props
  const { t } = useTranslation()
  const widthMm = useEditorStore((state) => state.openingWidthMm[kind])
  const setOpeningWidthMm = useEditorStore((state) => state.setOpeningWidthMm)
  const label = t(`tools.${kind}`)
  const [value, setValue] = useState(String(widthMm))
  useEffect(() => setValue(String(widthMm)), [widthMm])
  const commit = () => {
    const mm = parseOpeningWidthInput(value)
    if (mm === null) {
      setValue(String(widthMm))
      return
    }
    setOpeningWidthMm(kind, mm)
  }
  return (
    <aside className={styles.panel} aria-label={label}>
      <h2 className={styles.title}>{label}</h2>
      <form
        className={styles.field}
        onSubmit={(event) => {
          event.preventDefault()
          commit()
        }}
      >
        <label className={styles.label} htmlFor={`${kind}-width`}>
          {t('inspector.width')}
        </label>
        <input
          id={`${kind}-width`}
          className={styles.input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={commit}
        />
        <span className={styles.meta}>mm</span>
      </form>
    </aside>
  )
}

function RoomsPanel() {
  const { t, i18n } = useTranslation()
  const plan = useDocumentStore((state) => state.document)
  const apply = useDocumentStore((state) => state.apply)
  const rooms = useMemo(
    () => detectRooms(plan.walls, plan.labels),
    [plan.walls, plan.labels],
  )
  if (rooms.length === 0) {
    return null
  }
  return (
    <aside className={styles.panel} aria-label={t('rooms.title')}>
      <h2 className={styles.title}>{t('rooms.title')}</h2>
      {rooms.map((room) => (
        <RoomRow
          key={room.id}
          name={room.name}
          placeholder={t('rooms.defaultName')}
          area={formatAreaMm2(room.areaMm2, i18n.language)}
          onRename={(name) =>
            apply((document) =>
              renameRoom(document, room.id, name, crypto.randomUUID()),
            )
          }
        />
      ))}
    </aside>
  )
}

function RoomRow(props: {
  name: string
  placeholder: string
  area: string
  onRename: (name: string) => void
}) {
  const { name, placeholder, area, onRename } = props
  const { t } = useTranslation()
  const [value, setValue] = useState(name)
  useEffect(() => setValue(name), [name])
  const commit = () => {
    const next = value.trim()
    if (next === '' || next === name) {
      setValue(name)
      return
    }
    onRename(next)
  }
  return (
    <form
      className={styles.field}
      onSubmit={(event) => {
        event.preventDefault()
        commit()
      }}
    >
      <input
        className={styles.input}
        aria-label={t('rooms.name')}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
      />
      <span className={styles.meta}>{area}</span>
    </form>
  )
}
