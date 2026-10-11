import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyDocument } from './empty'
import { createHistory } from './history'
import { useDocumentStore } from './store'
import type { PlanDocument } from './types'

function resetStore(document: PlanDocument = createEmptyDocument()): void {
  useDocumentStore.setState({
    ...createHistory(document),
  })
}

function addDummyWall(document: PlanDocument): PlanDocument {
  return {
    ...document,
    walls: [
      ...document.walls,
      {
        id: 'wall-test',
        a: { x: 0, y: 0 },
        b: { x: 4000, y: 0 },
        thicknessMm: 150,
      },
    ],
  }
}

describe('document store', () => {
  beforeEach(() => {
    resetStore()
  })

  it('starts from an empty document', () => {
    expect(useDocumentStore.getState().document).toEqual(createEmptyDocument())
    expect(useDocumentStore.getState().past).toEqual([])
    expect(useDocumentStore.getState().future).toEqual([])
  })

  it('applies a dummy mutation, undoes, and redoes', () => {
    const { apply, undo, redo } = useDocumentStore.getState()

    apply(addDummyWall)
    expect(useDocumentStore.getState().document.walls).toHaveLength(1)
    expect(useDocumentStore.getState().document.walls[0]?.id).toBe('wall-test')

    undo()
    expect(useDocumentStore.getState().document.walls).toEqual([])

    redo()
    expect(useDocumentStore.getState().document.walls[0]?.b.x).toBe(4000)
  })
})
