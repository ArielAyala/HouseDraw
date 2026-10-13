import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from '../document/empty'
import { detectRooms, formatAreaMm2 } from '../document/rooms'
import { addRoomToDocument, createRoomWalls, isValidRoomRect } from './room'

describe('room tool', () => {
  const a = { x: 0, y: 0 }
  const b = { x: 4000, y: 5000 }

  it('rejects tiny rectangles', () => {
    expect(isValidRoomRect(a, { x: 50, y: 5000 })).toBe(false)
    expect(isValidRoomRect(a, b)).toBe(true)
  })

  it('creates four walls that form a 20.00 m² room', () => {
    const walls = createRoomWalls(['1', '2', '3', '4'], a, b, 150)
    expect(walls).toHaveLength(4)
    const doc = addRoomToDocument(createEmptyDocument(), walls, 'l', a, b)
    const rooms = detectRooms(doc.walls, doc.labels)
    expect(rooms).toHaveLength(1)
    expect(formatAreaMm2(rooms[0]?.areaMm2 ?? 0)).toBe('20.00 m²')
    expect(rooms[0]?.name).toBe('Room')
  })

  it('works when dragged in any direction', () => {
    const walls = createRoomWalls(['1', '2', '3', '4'], b, a, 150)
    const rooms = detectRooms(walls)
    expect(rooms[0]?.areaMm2).toBe(20_000_000)
  })
})
