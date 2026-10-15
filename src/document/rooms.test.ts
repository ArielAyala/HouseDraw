import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from './empty'
import { detectRooms, formatAreaMm2, polygonAreaMm2, renameRoom } from './rooms'
import type { PointMm, Wall } from './types'

function loop(points: PointMm[]): Wall[] {
  return points.map((a, i) => ({
    id: `w${i}`,
    a,
    b: points[(i + 1) % points.length] as PointMm,
    thicknessMm: 150,
  }))
}

const rect = loop([
  { x: 0, y: 0 },
  { x: 4000, y: 0 },
  { x: 4000, y: 5000 },
  { x: 0, y: 5000 },
])

describe('rooms', () => {
  it('computes polygon area', () => {
    expect(
      polygonAreaMm2([
        { x: 0, y: 0 },
        { x: 4000, y: 0 },
        { x: 4000, y: 5000 },
        { x: 0, y: 5000 },
      ]),
    ).toBe(20_000_000)
  })

  it('reports 20.00 m² for a 4 x 5 m rectangle', () => {
    const rooms = detectRooms(rect)
    expect(rooms).toHaveLength(1)
    expect(formatAreaMm2(rooms[0]?.areaMm2 ?? 0)).toBe('20.00 m²')
    expect(rooms[0]?.name).toBe('')
  })

  it('detects both rooms when two rooms share a wall', () => {
    const walls: Wall[] = [
      ...loop([
        { x: 0, y: 0 },
        { x: 4000, y: 0 },
        { x: 4000, y: 3000 },
        { x: 0, y: 3000 },
      ]),
      ...loop([
        { x: 4000, y: 0 },
        { x: 8000, y: 0 },
        { x: 8000, y: 3000 },
        { x: 4000, y: 3000 },
      ]).map((w) => ({ ...w, id: `b${w.id}` })),
    ]
    const rooms = detectRooms(walls)
    expect(rooms).toHaveLength(2)
    expect(rooms.map((r) => formatAreaMm2(r.areaMm2)).sort()).toEqual([
      '12.00 m²',
      '12.00 m²',
    ])
  })

  it('detects both rooms when a shared wall ends mid-edge (T-junction)', () => {
    const walls: Wall[] = [
      ...loop([
        { x: 0, y: 0 },
        { x: 4000, y: 0 },
        { x: 4000, y: 3000 },
        { x: 0, y: 3000 },
      ]),
      ...loop([
        { x: 4000, y: 0 },
        { x: 8000, y: 0 },
        { x: 8000, y: 2000 },
        { x: 4000, y: 2000 },
      ]).map((w) => ({ ...w, id: `b${w.id}` })),
    ]
    const rooms = detectRooms(walls)
    expect(rooms).toHaveLength(2)
    expect(rooms.map((r) => formatAreaMm2(r.areaMm2)).sort()).toEqual([
      '12.00 m²',
      '8.00 m²',
    ])
  })

  it('detects an L-shaped polygon', () => {
    const rooms = detectRooms(
      loop([
        { x: 0, y: 0 },
        { x: 4000, y: 0 },
        { x: 4000, y: 2000 },
        { x: 2000, y: 2000 },
        { x: 2000, y: 4000 },
        { x: 0, y: 4000 },
      ]),
    )
    expect(rooms).toHaveLength(1)
    expect(rooms[0]?.areaMm2).toBe(12_000_000)
  })

  it('ignores open chains and dangling walls', () => {
    expect(detectRooms(rect.slice(0, 3))).toEqual([])
    const spur: Wall = {
      id: 'spur',
      a: { x: 4000, y: 0 },
      b: { x: 6000, y: 0 },
      thicknessMm: 150,
    }
    const rooms = detectRooms([...rect, spur])
    expect(rooms).toHaveLength(1)
    expect(rooms[0]?.areaMm2).toBe(20_000_000)
  })

  it('finds two rooms sharing a wall', () => {
    const walls: Wall[] = [
      ...rect,
      {
        id: 'mid',
        a: { x: 0, y: 0 },
        b: { x: 4000, y: 5000 },
        thicknessMm: 150,
      },
    ]
    const rooms = detectRooms(walls)
    expect(rooms).toHaveLength(2)
    expect(rooms.reduce((s, r) => s + r.areaMm2, 0)).toBe(20_000_000)
  })

  it('renames a room via a label', () => {
    const doc = { ...createEmptyDocument(), walls: rect }
    const id = detectRooms(rect)[0]?.id ?? ''
    const named = renameRoom(doc, id, ' Kitchen ', 'l1')
    expect(detectRooms(named.walls, named.labels)[0]?.name).toBe('Kitchen')
    const again = renameRoom(named, id, 'Bath', 'l2')
    expect(again.labels).toHaveLength(1)
    expect(detectRooms(again.walls, again.labels)[0]?.name).toBe('Bath')
  })
})
