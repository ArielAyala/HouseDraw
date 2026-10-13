import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from './empty'
import {
  addOpeningToDocument,
  clampOpeningOffsetMm,
  fitOpeningsToWall,
  openingAtPoint,
  openingSpan,
  removeOpeningById,
} from './openings'
import type { Opening, PlanDocument, Wall } from './types'

const wall: Wall = {
  id: 'w1',
  a: { x: 0, y: 0 },
  b: { x: 4000, y: 0 },
  thicknessMm: 150,
}

const door: Opening = {
  id: 'o1',
  type: 'door',
  wallId: 'w1',
  offsetMm: 1000,
  widthMm: 800,
}

function documentWith(
  openings: Opening[],
  walls: Wall[] = [wall],
): PlanDocument {
  return { ...createEmptyDocument(), walls, openings }
}

describe('opening offsets', () => {
  it('keeps an offset that already fits', () => {
    expect(clampOpeningOffsetMm(1000, 800, 4000)).toBe(1000)
  })

  it('clamps offsets before the wall start to zero', () => {
    expect(clampOpeningOffsetMm(-300, 800, 4000)).toBe(0)
  })

  it('clamps offsets past the wall end so the opening stays inside', () => {
    expect(clampOpeningOffsetMm(3900, 800, 4000)).toBe(3200)
  })

  it('rounds the offset to integer millimeters', () => {
    expect(clampOpeningOffsetMm(1000.4, 800, 4000)).toBe(1000)
  })

  it('rejects an opening wider than the wall', () => {
    expect(clampOpeningOffsetMm(0, 4100, 4000)).toBeNull()
  })

  it('accepts an opening exactly as wide as the wall', () => {
    expect(clampOpeningOffsetMm(0, 4000, 4000)).toBe(0)
  })
})

describe('opening geometry', () => {
  it('places the span along the wall from its offset', () => {
    expect(openingSpan(wall, door)).toEqual({
      a: { x: 1000, y: 0 },
      b: { x: 1800, y: 0 },
    })
  })

  it('stays glued to the wall when the wall moves', () => {
    const moved: Wall = {
      ...wall,
      a: { x: 500, y: 200 },
      b: { x: 4500, y: 200 },
    }
    expect(openingSpan(moved, door)).toEqual({
      a: { x: 1500, y: 200 },
      b: { x: 2300, y: 200 },
    })
  })
})

describe('opening document edits', () => {
  it('adds and removes openings by id', () => {
    const added = addOpeningToDocument(documentWith([]), door)
    expect(added.openings).toEqual([door])
    expect(removeOpeningById(added, 'o1').openings).toEqual([])
  })

  it('clamps openings when the wall shrinks', () => {
    const next = fitOpeningsToWall(
      documentWith([door], [{ ...wall, b: { x: 1500, y: 0 } }]),
      'w1',
    )
    expect(next.openings[0]?.offsetMm).toBe(700)
  })

  it('removes openings that no longer fit on a shorter wall', () => {
    const next = fitOpeningsToWall(
      documentWith([door], [{ ...wall, b: { x: 700, y: 0 } }]),
      'w1',
    )
    expect(next.openings).toEqual([])
  })

  it('leaves openings on other walls untouched', () => {
    const other: Opening = { ...door, id: 'o2', wallId: 'w2' }
    const next = fitOpeningsToWall(
      documentWith([other], [{ ...wall, b: { x: 700, y: 0 } }]),
      'w1',
    )
    expect(next.openings).toEqual([other])
  })
})

describe('opening hit test', () => {
  it('finds the opening under a point on the wall', () => {
    const document = documentWith([door])
    expect(openingAtPoint({ x: 1400, y: 0 }, document, 4)?.id).toBe('o1')
  })

  it('ignores points beside the opening span', () => {
    const document = documentWith([door])
    expect(openingAtPoint({ x: 2500, y: 0 }, document, 4)).toBeNull()
  })

  it('ignores points far from the wall', () => {
    const document = documentWith([door])
    expect(openingAtPoint({ x: 1400, y: 500 }, document, 4)).toBeNull()
  })
})
