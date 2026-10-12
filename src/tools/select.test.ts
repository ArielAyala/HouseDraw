import { describe, expect, it } from 'vitest'
import type { Wall } from '../document/types'
import {
  beginDrag,
  marqueeSelection,
  snapMoveDelta,
  wallsInRect,
} from './select'

const horizontal: Wall = {
  id: 'h',
  a: { x: 0, y: 0 },
  b: { x: 4000, y: 0 },
  thicknessMm: 150,
}

const vertical: Wall = {
  id: 'v',
  a: { x: 2000, y: 0 },
  b: { x: 2000, y: 3000 },
  thicknessMm: 150,
}

describe('select geometry', () => {
  it('selects walls that cross a marquee', () => {
    const ids = marqueeSelection([horizontal, vertical], {
      start: { x: 1500, y: -200 },
      end: { x: 2500, y: 200 },
    })
    expect(ids.sort()).toEqual(['h', 'v'])
  })

  it('does not select a wall outside the marquee', () => {
    expect(
      wallsInRect([horizontal], { x: 0, y: 1000 }, { x: 500, y: 1500 }),
    ).toEqual([])
  })

  it('snaps a move onto a nearby static endpoint', () => {
    const delta = snapMoveDelta({
      origin: { x: 0, y: 0 },
      raw: { x: 980, y: 10 },
      movingEndpoints: [{ x: 0, y: 0 }],
      staticEndpoints: [{ x: 1000, y: 0 }],
      gridMm: 100,
      radiusMm: 50,
    })
    expect(delta).toEqual({ x: 1000, y: 0 })
  })

  it('falls back to grid when no endpoint is in range', () => {
    const delta = snapMoveDelta({
      origin: { x: 0, y: 0 },
      raw: { x: 240, y: 80 },
      movingEndpoints: [{ x: 0, y: 0 }],
      staticEndpoints: [{ x: 4000, y: 4000 }],
      gridMm: 100,
      radiusMm: 50,
    })
    expect(delta).toEqual({ x: 200, y: 100 })
  })

  it('records originals when a drag starts', () => {
    const drag = beginDrag(['h'], { x: 100, y: 0 }, [horizontal, vertical])
    expect(drag.wallIds).toEqual(['h'])
    expect(drag.originals).toEqual([horizontal])
    expect(drag.delta).toEqual({ x: 0, y: 0 })
  })
})
