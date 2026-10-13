import { describe, expect, it } from 'vitest'
import { fixtureDocument } from '../document/fixture'
import type { PlanDocument } from '../document/types'
import { parseDocument, serializeDocument } from './documentFile'

const richDocument: PlanDocument = {
  ...fixtureDocument,
  walls: [
    ...fixtureDocument.walls,
    {
      id: 'wall-2',
      a: { x: 4000, y: 0 },
      b: { x: 4000, y: -3000 },
      thicknessMm: 100,
    },
  ],
  openings: [
    {
      id: 'door-1',
      type: 'door',
      wallId: 'wall-1',
      offsetMm: 500,
      widthMm: 900,
    },
  ],
  items: [
    {
      id: 'item-1',
      catalogId: 'sofa',
      x: 1200,
      y: -800,
      widthMm: 2000,
      heightMm: 900,
      rotationDeg: 90,
    },
  ],
  labels: [{ id: 'label-1', text: 'Kitchen', x: 2000, y: -1500 }],
}

function parsedJson(patch: (raw: Record<string, unknown>) => void): string {
  const raw = JSON.parse(serializeDocument(richDocument)) as Record<
    string,
    unknown
  >
  patch(raw)
  return JSON.stringify(raw)
}

describe('serializeDocument / parseDocument', () => {
  it('round-trips a document with the same coordinates', () => {
    const result = parseDocument(serializeDocument(richDocument))
    expect(result).toEqual({ ok: true, document: richDocument })
  })

  it('serializes a stable, human-readable JSON file', () => {
    const text = serializeDocument(fixtureDocument)
    expect(text.endsWith('\n')).toBe(true)
    expect(text).toContain('"version": 1')
    expect(JSON.parse(text)).toEqual(fixtureDocument)
  })

  it('accepts the fixture document', () => {
    expect(parseDocument(serializeDocument(fixtureDocument))).toEqual({
      ok: true,
      document: fixtureDocument,
    })
  })

  it('drops unknown extra keys', () => {
    const text = parsedJson((raw) => {
      raw.extra = 'ignored'
    })
    const result = parseDocument(text)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.document).toEqual(richDocument)
    }
  })

  it('rejects text that is not JSON', () => {
    const result = parseDocument('{ nope')
    expect(result).toEqual({
      ok: false,
      error: 'The file is not valid JSON.',
    })
  })

  it('rejects a missing or invalid version', () => {
    const missing = parseDocument(
      parsedJson((raw) => {
        delete raw.version
      }),
    )
    expect(missing.ok).toBe(false)

    const fractional = parseDocument(
      parsedJson((raw) => {
        raw.version = 1.5
      }),
    )
    expect(fractional.ok).toBe(false)
  })

  it('rejects a future version explicitly', () => {
    const result = parseDocument(
      parsedJson((raw) => {
        raw.version = 2
      }),
    )
    expect(result).toEqual({
      ok: false,
      error:
        'This plan uses format version 2, but this app reads up to version 1. Update HouseDraw to open it.',
    })
  })

  it('rejects a wall with non-numeric coordinates', () => {
    const result = parseDocument(
      parsedJson((raw) => {
        const walls = raw.walls as Array<{ a: { x: unknown } }>
        const wall = walls[0]
        if (wall) {
          wall.a.x = '0'
        }
      }),
    )
    expect(result).toEqual({
      ok: false,
      error: 'Invalid plan file: walls[0].a.x must be a finite number.',
    })
  })

  it('rejects an unknown opening type', () => {
    const result = parseDocument(
      parsedJson((raw) => {
        const openings = raw.openings as Array<{ type: unknown }>
        const opening = openings[0]
        if (opening) {
          opening.type = 'gate'
        }
      }),
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('openings[0].type')
    }
  })

  it('rejects a missing section', () => {
    const result = parseDocument(
      parsedJson((raw) => {
        delete raw.labels
      }),
    )
    expect(result).toEqual({
      ok: false,
      error: 'Invalid plan file: labels must be an array.',
    })
  })

  it('rejects a non-object root', () => {
    expect(parseDocument('[]').ok).toBe(false)
    expect(parseDocument('null').ok).toBe(false)
  })
})
