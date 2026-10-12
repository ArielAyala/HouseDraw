import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from '../document/empty'
import {
  applyDocumentChange,
  createHistory,
  undoDocument,
} from '../document/history'
import type { PlanDocument, Wall } from '../document/types'
import {
  deleteWallsById,
  isZeroDelta,
  moveWallsById,
  setWallLengthMm,
  setWallThicknessMm,
  translateWall,
} from './edit'

const wall: Wall = {
  id: 'w1',
  a: { x: 0, y: 0 },
  b: { x: 4000, y: 0 },
  thicknessMm: 150,
}

function documentWithWalls(walls: Wall[]): PlanDocument {
  return { ...createEmptyDocument(), walls }
}

describe('edit walls', () => {
  it('translates both endpoints by the same delta', () => {
    expect(translateWall(wall, { x: 100, y: -50 })).toEqual({
      ...wall,
      a: { x: 100, y: -50 },
      b: { x: 4100, y: -50 },
    })
  })

  it('moves selected walls and leaves others in place', () => {
    const other: Wall = {
      id: 'w2',
      a: { x: 0, y: 2000 },
      b: { x: 1000, y: 2000 },
      thicknessMm: 150,
    }
    const next = moveWallsById(documentWithWalls([wall, other]), ['w1'], {
      x: 250,
      y: 100,
    })
    expect(next.walls[0]).toEqual({
      ...wall,
      a: { x: 250, y: 100 },
      b: { x: 4250, y: 100 },
    })
    expect(next.walls[1]).toEqual(other)
  })

  it('deletes selected walls and openings on those walls', () => {
    const document: PlanDocument = {
      ...createEmptyDocument(),
      walls: [wall],
      openings: [
        {
          id: 'o1',
          type: 'door',
          wallId: 'w1',
          offsetMm: 800,
          widthMm: 900,
        },
      ],
    }
    const next = deleteWallsById(document, ['w1'])
    expect(next.walls).toEqual([])
    expect(next.openings).toEqual([])
  })

  it('sets length from endpoint a along the current direction', () => {
    const next = setWallLengthMm(wall, 2500)
    expect(next.a).toEqual(wall.a)
    expect(next.b).toEqual({ x: 2500, y: 0 })
  })

  it('rejects a zero length', () => {
    expect(setWallLengthMm(wall, 0)).toBe(wall)
  })

  it('sets thickness in millimeters', () => {
    expect(setWallThicknessMm(wall, 200).thicknessMm).toBe(200)
    expect(setWallThicknessMm(wall, 0)).toBe(wall)
  })

  it('treats a rounded-zero delta as no movement', () => {
    expect(isZeroDelta({ x: 0, y: 0 })).toBe(true)
    expect(isZeroDelta({ x: 0.4, y: -0.4 })).toBe(true)
    expect(isZeroDelta({ x: 1, y: 0 })).toBe(false)
  })

  it('undo restores previous endpoints after a move', () => {
    let history = createHistory(documentWithWalls([wall]))
    history = applyDocumentChange(history, (document) =>
      moveWallsById(document, ['w1'], { x: 500, y: 200 }),
    )
    expect(history.document.walls[0]?.a).toEqual({ x: 500, y: 200 })
    expect(history.document.walls[0]?.b).toEqual({ x: 4500, y: 200 })

    history = undoDocument(history)
    expect(history.document.walls[0]?.a).toEqual({ x: 0, y: 0 })
    expect(history.document.walls[0]?.b).toEqual({ x: 4000, y: 0 })
  })
})
