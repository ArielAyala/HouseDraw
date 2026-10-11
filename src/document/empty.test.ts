import { describe, expect, it } from 'vitest'
import { cloneDocument, createEmptyDocument } from './empty'
import { fixtureDocument } from './fixture'

describe('createEmptyDocument', () => {
  it('returns a versioned empty plan', () => {
    expect(createEmptyDocument()).toEqual({
      version: 1,
      unit: 'mm',
      settings: { gridMm: 100, wallThicknessMm: 150, theme: 'dark' },
      walls: [],
      openings: [],
      items: [],
      labels: [],
    })
  })

  it('returns a fresh object each time', () => {
    const a = createEmptyDocument()
    const b = createEmptyDocument()
    expect(a).not.toBe(b)
    expect(a.walls).not.toBe(b.walls)
    a.walls.push({
      id: 'w',
      a: { x: 0, y: 0 },
      b: { x: 1000, y: 0 },
      thicknessMm: 150,
    })
    expect(b.walls).toEqual([])
  })
})

describe('fixtureDocument', () => {
  it('is a tiny plan with one 4 m wall', () => {
    expect(fixtureDocument.version).toBe(1)
    expect(fixtureDocument.walls).toHaveLength(1)
    const wall = fixtureDocument.walls[0]
    expect(wall).toBeDefined()
    if (!wall) {
      return
    }
    expect(wall.b.x - wall.a.x).toBe(4000)
    expect(wall.thicknessMm).toBe(150)
  })
})

describe('cloneDocument', () => {
  it('deep-copies so mutations do not leak', () => {
    const copy = cloneDocument(fixtureDocument)
    expect(copy).toEqual(fixtureDocument)
    expect(copy).not.toBe(fixtureDocument)
    const wall = copy.walls[0]
    expect(wall).toBeDefined()
    if (wall) {
      wall.a.x = 99
    }
    expect(fixtureDocument.walls[0]?.a.x).toBe(0)
  })
})
