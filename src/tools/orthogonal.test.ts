import { describe, expect, it } from 'vitest'
import { lockOrthogonal, orthogonalAxis } from './orthogonal'

describe('orthogonal lock', () => {
  const start = { x: 1000, y: 2000 }

  it('locks to horizontal when |dx| is larger', () => {
    const raw = { x: 5000, y: 2080 }
    expect(orthogonalAxis(start, raw)).toBe('h')
    expect(lockOrthogonal(start, raw)).toEqual({ x: 5000, y: 2000 })
  })

  it('locks to vertical when |dy| is larger', () => {
    const raw = { x: 1100, y: 6000 }
    expect(orthogonalAxis(start, raw)).toBe('v')
    expect(lockOrthogonal(start, raw)).toEqual({ x: 1000, y: 6000 })
  })

  it('prefers horizontal on a tie', () => {
    const raw = { x: 1400, y: 2400 }
    expect(orthogonalAxis(start, raw)).toBe('h')
    expect(lockOrthogonal(start, raw)).toEqual({ x: 1400, y: 2000 })
  })
})
