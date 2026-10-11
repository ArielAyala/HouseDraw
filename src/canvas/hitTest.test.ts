import { describe, expect, it } from 'vitest'
import type { Wall } from '../document/types'
import { hitTestWall } from './hitTest'

const wall: Wall = {
  id: 'w1',
  a: { x: 0, y: 0 },
  b: { x: 4000, y: 0 },
  thicknessMm: 150,
}

describe('hitTestWall', () => {
  it('hits a point on the wall centerline', () => {
    expect(hitTestWall({ x: 2000, y: 0 }, [wall], 0)?.id).toBe('w1')
  })

  it('hits within half thickness plus padding', () => {
    expect(hitTestWall({ x: 2000, y: 70 }, [wall], 10)?.id).toBe('w1')
  })

  it('misses a point well off the wall', () => {
    expect(hitTestWall({ x: 2000, y: 400 }, [wall], 10)).toBeNull()
  })
})
