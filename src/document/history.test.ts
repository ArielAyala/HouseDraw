import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from './empty'
import {
  applyDocumentChange,
  createHistory,
  MAX_HISTORY,
  redoDocument,
  undoDocument,
} from './history'
import type { PlanDocument, Wall } from './types'

const dummyWall: Wall = {
  id: 'wall-test',
  a: { x: 0, y: 0 },
  b: { x: 4000, y: 0 },
  thicknessMm: 150,
}

function addDummyWall(document: PlanDocument): PlanDocument {
  return { ...document, walls: [...document.walls, dummyWall] }
}

describe('document history', () => {
  it('applies a dummy mutation, then undoes and redoes it', () => {
    let history = createHistory(createEmptyDocument())
    expect(history.document.walls).toEqual([])

    history = applyDocumentChange(history, addDummyWall)
    expect(history.document.walls).toEqual([dummyWall])
    expect(history.future).toEqual([])

    history = undoDocument(history)
    expect(history.document.walls).toEqual([])

    history = redoDocument(history)
    expect(history.document.walls).toEqual([dummyWall])
  })

  it('undo and redo are no-ops at the ends of the stack', () => {
    const empty = createHistory(createEmptyDocument())
    expect(undoDocument(empty)).toBe(empty)

    const applied = applyDocumentChange(empty, addDummyWall)
    expect(redoDocument(applied)).toBe(applied)
  })

  it('a new change clears the redo stack', () => {
    let history = createHistory(createEmptyDocument())
    history = applyDocumentChange(history, addDummyWall)
    history = undoDocument(history)
    history = applyDocumentChange(history, (document) => ({
      ...document,
      labels: [{ id: 'label-1', text: 'Room', x: 0, y: 0 }],
    }))
    expect(history.document.walls).toEqual([])
    expect(history.document.labels).toHaveLength(1)
    expect(history.future).toEqual([])
    expect(redoDocument(history).document.labels).toHaveLength(1)
  })

  it('clones before mutating so in-place edits cannot corrupt undo', () => {
    let history = createHistory(createEmptyDocument())
    history = applyDocumentChange(history, (document) => {
      document.walls.push(dummyWall)
      return document
    })
    history = undoDocument(history)
    expect(history.document.walls).toEqual([])
  })

  it('caps the undo stack', () => {
    let history = createHistory(createEmptyDocument())
    for (let i = 0; i < MAX_HISTORY + 5; i += 1) {
      const n = i
      history = applyDocumentChange(history, (document) => ({
        ...document,
        labels: [{ id: `label-${n}`, text: `${n}`, x: n, y: 0 }],
      }))
    }
    expect(history.past).toHaveLength(MAX_HISTORY)
  })
})
