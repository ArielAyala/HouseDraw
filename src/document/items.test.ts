import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from './empty'
import {
  createItemDraft,
  deleteItemsById,
  itemAtPoint,
  moveItemsById,
  pointInItem,
  rotateItemsById,
} from './items'
import type { Item, PlanDocument } from './types'

const bed: Item = {
  id: 'i1',
  catalogId: 'double-bed',
  x: 1000,
  y: 1000,
  widthMm: 1600,
  heightMm: 2000,
  rotationDeg: 0,
}

function documentWith(items: Item[]): PlanDocument {
  return { ...createEmptyDocument(), items }
}

describe('item placement', () => {
  it('creates a draft centered on the given point', () => {
    expect(
      createItemDraft('double-bed', 1600, 2000, { x: 1200.4, y: 800 }),
    ).toEqual({
      catalogId: 'double-bed',
      x: 1200,
      y: 800,
      widthMm: 1600,
      heightMm: 2000,
      rotationDeg: 0,
    })
  })
})

describe('item hit test', () => {
  it('hits inside the unrotated footprint', () => {
    expect(pointInItem({ x: 1700, y: 1900 }, bed, 0)).toBe(true)
  })

  it('misses outside the footprint', () => {
    expect(pointInItem({ x: 1900, y: 1000 }, bed, 0)).toBe(false)
  })

  it('uses the rotated footprint', () => {
    const rotated = { ...bed, rotationDeg: 90 }
    expect(pointInItem({ x: 1900, y: 1000 }, rotated, 0)).toBe(true)
    expect(pointInItem({ x: 1000, y: 1900 }, rotated, 0)).toBe(false)
  })

  it('returns the topmost item under the point', () => {
    const under: Item = { ...bed, id: 'i0' }
    expect(itemAtPoint({ x: 1000, y: 1000 }, [under, bed], 0)?.id).toBe('i1')
  })
})

describe('item edits', () => {
  it('moves selected items and leaves others in place', () => {
    const other: Item = { ...bed, id: 'i2', x: 5000 }
    const next = moveItemsById(documentWith([bed, other]), ['i1'], {
      x: 100,
      y: -50,
    })
    expect(next.items[0]).toEqual({ ...bed, x: 1100, y: 950 })
    expect(next.items[1]).toEqual(other)
  })

  it('rotates by 90 degrees and wraps at 360', () => {
    const once = rotateItemsById(documentWith([bed]), ['i1'])
    expect(once.items[0]?.rotationDeg).toBe(90)
    const back = rotateItemsById(
      rotateItemsById(rotateItemsById(once, ['i1']), ['i1']),
      ['i1'],
    )
    expect(back.items[0]?.rotationDeg).toBe(0)
  })

  it('deletes selected items', () => {
    expect(deleteItemsById(documentWith([bed]), ['i1']).items).toEqual([])
  })
})
