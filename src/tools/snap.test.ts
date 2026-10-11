import { describe, expect, it } from 'vitest'
import type { Wall } from '../document/types'
import { snapPoint, snapToGrid } from './snap'

function wall(
  id: string,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): Wall {
  return {
    id,
    a: { x: ax, y: ay },
    b: { x: bx, y: by },
    thicknessMm: 150,
  }
}

describe('snapToGrid', () => {
  it('rounds to the nearest grid step', () => {
    expect(snapToGrid({ x: 149, y: 51 }, 100)).toEqual({ x: 100, y: 100 })
    expect(snapToGrid({ x: 4000, y: 0 }, 100)).toEqual({ x: 4000, y: 0 })
  })
})

describe('snapPoint', () => {
  it('snaps to the grid when nothing else is in range', () => {
    const result = snapPoint({
      raw: { x: 3960, y: 40 },
      start: { x: 0, y: 0 },
      walls: [],
      gridMm: 100,
      radiusMm: 50,
      ortho: true,
    })
    expect(result.kind).toBe('grid')
    expect(result.point).toEqual({ x: 4000, y: 0 })
  })

  it('prefers a wall endpoint over the grid', () => {
    const result = snapPoint({
      raw: { x: 1040, y: 10 },
      start: { x: 0, y: 0 },
      walls: [wall('w1', 1050, 0, 3000, 0)],
      gridMm: 100,
      radiusMm: 40,
      ortho: true,
    })
    expect(result.kind).toBe('endpoint')
    expect(result.point).toEqual({ x: 1050, y: 0 })
  })

  it('snaps to the perpendicular foot on an existing wall', () => {
    const result = snapPoint({
      raw: { x: 2000, y: 1200 },
      start: { x: 2000, y: 0 },
      walls: [wall('w1', 0, 1234, 4000, 1234)],
      gridMm: 100,
      radiusMm: 50,
      ortho: true,
    })
    expect(result.kind).toBe('perpendicular')
    expect(result.point).toEqual({ x: 2000, y: 1234 })
  })

  it('does not snap to off-axis endpoints while orthogonal lock is on', () => {
    const result = snapPoint({
      raw: { x: 4000, y: 80 },
      start: { x: 0, y: 0 },
      walls: [wall('w1', 4000, 800, 4000, 2000)],
      gridMm: 100,
      radiusMm: 200,
      ortho: true,
    })
    expect(result.kind).toBe('grid')
    expect(result.point).toEqual({ x: 4000, y: 0 })
  })

  it('allows free-angle endpoint snap when ortho is off', () => {
    const result = snapPoint({
      raw: { x: 3980, y: 760 },
      start: { x: 0, y: 0 },
      walls: [wall('w1', 4000, 800, 4000, 2000)],
      gridMm: 100,
      radiusMm: 80,
      ortho: false,
    })
    expect(result.kind).toBe('endpoint')
    expect(result.point).toEqual({ x: 4000, y: 800 })
  })
})
