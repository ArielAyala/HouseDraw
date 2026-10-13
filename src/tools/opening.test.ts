import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from '../document/empty'
import type { PlanDocument, Wall } from '../document/types'
import { parseOpeningWidthInput } from './length'
import { openingDraftAt } from './opening'

const wall: Wall = {
  id: 'w1',
  a: { x: 0, y: 0 },
  b: { x: 4000, y: 0 },
  thicknessMm: 150,
}

function documentWithWalls(walls: Wall[]): PlanDocument {
  return { ...createEmptyDocument(), walls }
}

describe('opening placement', () => {
  it('centers the opening under the pointer on the wall', () => {
    const draft = openingDraftAt(
      documentWithWalls([wall]),
      'door',
      800,
      { x: 2000, y: 20 },
      4,
    )
    expect(draft).toEqual({
      type: 'door',
      wallId: 'w1',
      offsetMm: 1600,
      widthMm: 800,
    })
  })

  it('clamps the opening so it stays inside the wall near the start', () => {
    const draft = openingDraftAt(
      documentWithWalls([wall]),
      'window',
      1200,
      { x: 100, y: 0 },
      4,
    )
    expect(draft?.offsetMm).toBe(0)
  })

  it('clamps the opening so it stays inside the wall near the end', () => {
    const draft = openingDraftAt(
      documentWithWalls([wall]),
      'window',
      1200,
      { x: 3950, y: 0 },
      4,
    )
    expect(draft?.offsetMm).toBe(2800)
  })

  it('refuses to place an opening wider than the wall', () => {
    const short: Wall = { ...wall, b: { x: 600, y: 0 } }
    expect(
      openingDraftAt(
        documentWithWalls([short]),
        'door',
        800,
        { x: 300, y: 0 },
        4,
      ),
    ).toBeNull()
  })

  it('does nothing when the pointer is away from every wall', () => {
    expect(
      openingDraftAt(
        documentWithWalls([wall]),
        'door',
        800,
        { x: 500, y: 900 },
        4,
      ),
    ).toBeNull()
  })
})

describe('opening width input', () => {
  it('treats bare numbers as millimeters', () => {
    expect(parseOpeningWidthInput('900')).toBe(900)
  })

  it('accepts meters and centimeters', () => {
    expect(parseOpeningWidthInput('0.9m')).toBe(900)
    expect(parseOpeningWidthInput('90cm')).toBe(900)
  })

  it('rejects zero and garbage', () => {
    expect(parseOpeningWidthInput('0')).toBeNull()
    expect(parseOpeningWidthInput('abc')).toBeNull()
  })
})
