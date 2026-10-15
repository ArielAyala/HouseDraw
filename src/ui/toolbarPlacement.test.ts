import { describe, expect, it } from 'vitest'
import {
  EDGE_MARGIN,
  isHorizontalPlacement,
  parseToolbarPlacement,
  resolveToolbarLayout,
  snapPlacement,
} from './toolbarPlacement'

const stage = { width: 1000, height: 600 }
const bar = { width: 40, height: 300 }

describe('snapPlacement', () => {
  it('snaps to the left edge when close to it', () => {
    expect(snapPlacement(10, 100, stage, bar).edge).toBe('left')
  })

  it('snaps to the right edge when close to it', () => {
    expect(snapPlacement(952, 100, stage, bar).edge).toBe('right')
  })

  it('snaps to the top edge when close to it', () => {
    const horizontal = { width: 300, height: 40 }
    expect(snapPlacement(300, 5, stage, horizontal).edge).toBe('top')
  })

  it('snaps to the bottom edge when close to it', () => {
    const horizontal = { width: 300, height: 40 }
    expect(snapPlacement(300, 555, stage, horizontal).edge).toBe('bottom')
  })

  it('stays free when far from every edge', () => {
    expect(snapPlacement(400, 150, stage, bar)).toEqual({
      edge: 'free',
      x: 400,
      y: 150,
    })
  })

  it('clamps the position inside the stage', () => {
    expect(snapPlacement(-50, 900, stage, bar)).toEqual({
      edge: 'left',
      x: 0,
      y: 300,
    })
  })
})

describe('isHorizontalPlacement', () => {
  it('is horizontal only on top and bottom edges', () => {
    expect(isHorizontalPlacement({ edge: 'top', x: 0, y: 0 })).toBe(true)
    expect(isHorizontalPlacement({ edge: 'bottom', x: 0, y: 0 })).toBe(true)
    expect(isHorizontalPlacement({ edge: 'left', x: 0, y: 0 })).toBe(false)
    expect(isHorizontalPlacement({ edge: 'right', x: 0, y: 0 })).toBe(false)
    expect(isHorizontalPlacement({ edge: 'free', x: 0, y: 0 })).toBe(false)
  })
})

describe('resolveToolbarLayout', () => {
  it('pins to the left edge with a margin', () => {
    expect(
      resolveToolbarLayout({ edge: 'left', x: 0, y: 100 }, stage, bar),
    ).toEqual({ left: EDGE_MARGIN, top: 100 })
  })

  it('pins to the right edge', () => {
    expect(
      resolveToolbarLayout({ edge: 'right', x: 0, y: 100 }, stage, bar),
    ).toEqual({ left: 1000 - 40 - EDGE_MARGIN, top: 100 })
  })

  it('pins to the top and bottom edges', () => {
    const horizontal = { width: 300, height: 40 }
    expect(
      resolveToolbarLayout({ edge: 'top', x: 200, y: 0 }, stage, horizontal),
    ).toEqual({ left: 200, top: EDGE_MARGIN })
    expect(
      resolveToolbarLayout({ edge: 'bottom', x: 200, y: 0 }, stage, horizontal),
    ).toEqual({ left: 200, top: 600 - 40 - EDGE_MARGIN })
  })

  it('re-clamps a stored position when the stage is smaller', () => {
    expect(
      resolveToolbarLayout({ edge: 'free', x: 900, y: 500 }, stage, {
        width: 40,
        height: 300,
      }),
    ).toEqual({ left: 900, top: 300 })
    expect(
      resolveToolbarLayout(
        { edge: 'free', x: 900, y: 500 },
        { width: 500, height: 200 },
        bar,
      ),
    ).toEqual({ left: 460, top: 0 })
  })
})

describe('parseToolbarPlacement', () => {
  it('returns null for missing or invalid values', () => {
    expect(parseToolbarPlacement(null)).toBeNull()
    expect(parseToolbarPlacement('not json')).toBeNull()
    expect(parseToolbarPlacement('null')).toBeNull()
    expect(parseToolbarPlacement('{"edge":"center","x":1,"y":2}')).toBeNull()
    expect(parseToolbarPlacement('{"edge":"free","x":"1","y":2}')).toBeNull()
  })

  it('accepts a valid stored placement', () => {
    expect(parseToolbarPlacement('{"edge":"left","x":0,"y":120}')).toEqual({
      edge: 'left',
      x: 0,
      y: 120,
    })
  })
})
