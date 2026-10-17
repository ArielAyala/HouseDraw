import { describe, expect, it } from 'vitest'
import type { Room } from '../document/rooms'
import { NO_DIMENSIONS, visibleDimensionWallIds } from './dimensions'

const walls = [{ id: 'w1' }, { id: 'w2' }, { id: 'w3' }]

const rooms = [
  { id: 'r1', wallIds: ['w1', 'w2'] },
  { id: 'r2', wallIds: ['w2', 'w3'] },
] as Room[]

describe('visibleDimensionWallIds', () => {
  it('shows no walls by default', () => {
    expect([...visibleDimensionWallIds(walls, rooms, NO_DIMENSIONS)]).toEqual(
      [],
    )
  })

  it('shows every wall when the global toggle is on', () => {
    const ids = visibleDimensionWallIds(walls, rooms, {
      ...NO_DIMENSIONS,
      showAll: true,
    })
    expect([...ids].sort()).toEqual(['w1', 'w2', 'w3'])
  })

  it('shows individually marked walls', () => {
    const ids = visibleDimensionWallIds(walls, rooms, {
      ...NO_DIMENSIONS,
      wallIds: ['w3'],
    })
    expect([...ids]).toEqual(['w3'])
  })

  it('shows the walls that bound a marked room, without duplicates', () => {
    const ids = visibleDimensionWallIds(walls, rooms, {
      ...NO_DIMENSIONS,
      roomIds: ['r1', 'r2'],
    })
    expect([...ids].sort()).toEqual(['w1', 'w2', 'w3'])
  })

  it('ignores marked ids that no longer exist', () => {
    const ids = visibleDimensionWallIds(walls, rooms, {
      ...NO_DIMENSIONS,
      roomIds: ['gone'],
    })
    expect([...ids]).toEqual([])
  })
})
