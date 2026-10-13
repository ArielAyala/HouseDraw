import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyDocument } from '../document/empty'
import { fixtureDocument } from '../document/fixture'
import {
  AUTOSAVE_STORAGE_KEY,
  readAutosavedDocument,
  writeAutosavedDocument,
} from './autosave'

describe('autosave storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing was saved', () => {
    expect(readAutosavedDocument()).toBeNull()
  })

  it('round-trips the document through localStorage', () => {
    writeAutosavedDocument(fixtureDocument)
    expect(readAutosavedDocument()).toEqual({
      ok: true,
      document: fixtureDocument,
    })
  })

  it('reports a stored file it cannot read', () => {
    localStorage.setItem(
      AUTOSAVE_STORAGE_KEY,
      JSON.stringify({ ...createEmptyDocument(), version: 9 }),
    )
    const result = readAutosavedDocument()
    expect(result?.ok).toBe(false)
  })
})
