import { type FormEvent, useEffect, useState } from 'react'
import { formatDimensionMm } from '../canvas/units'
import { useDocumentStore } from '../document/store'
import {
  setWallLengthMm,
  setWallThicknessMm,
  updateWallById,
} from '../tools/edit'
import { useEditorStore } from '../tools/editor'
import { distanceMm } from '../tools/geometry'
import { parseLengthInput, parseThicknessInput } from '../tools/length'
import styles from './Inspector.module.css'

export default function Inspector() {
  const plan = useDocumentStore((state) => state.document)
  const apply = useDocumentStore((state) => state.apply)
  const selectedWallIds = useEditorStore((state) => state.selectedWallIds)
  const selected = plan.walls.filter((wall) =>
    selectedWallIds.includes(wall.id),
  )
  const wall = selected.length === 1 ? selected[0] : undefined

  const [lengthInput, setLengthInput] = useState('')
  const [thicknessInput, setThicknessInput] = useState('')

  useEffect(() => {
    if (!wall) {
      setLengthInput('')
      setThicknessInput('')
      return
    }
    setLengthInput(formatDimensionMm(distanceMm(wall.a, wall.b)))
    setThicknessInput(String(wall.thicknessMm))
  }, [wall])

  if (selected.length === 0) {
    return null
  }

  if (!wall) {
    return (
      <aside className={styles.panel} aria-label="Inspector">
        <h2 className={styles.title}>{selected.length} walls</h2>
        <p className={styles.hint}>Delete or Backspace to remove</p>
      </aside>
    )
  }

  const lengthMm = distanceMm(wall.a, wall.b)

  const commitLength = () => {
    const mm = parseLengthInput(lengthInput)
    if (mm === null) {
      setLengthInput(formatDimensionMm(lengthMm))
      return
    }
    const next = setWallLengthMm(wall, mm)
    if (next === wall) {
      setLengthInput(formatDimensionMm(lengthMm))
      return
    }
    apply((document) =>
      updateWallById(document, wall.id, (current) =>
        setWallLengthMm(current, mm),
      ),
    )
  }

  const commitThickness = () => {
    const mm = parseThicknessInput(thicknessInput)
    if (mm === null) {
      setThicknessInput(String(wall.thicknessMm))
      return
    }
    const next = setWallThicknessMm(wall, mm)
    if (next === wall) {
      setThicknessInput(String(wall.thicknessMm))
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
    <aside className={styles.panel} aria-label="Inspector">
      <h2 className={styles.title}>Wall</h2>
      <form className={styles.field} onSubmit={onLengthSubmit}>
        <label className={styles.label} htmlFor="wall-length">
          Length
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
          Thickness
        </label>
        <input
          id="wall-thickness"
          className={styles.input}
          value={thicknessInput}
          onChange={(event) => setThicknessInput(event.target.value)}
          onBlur={commitThickness}
        />
        <span className={styles.meta}>mm</span>
      </form>
    </aside>
  )
}
