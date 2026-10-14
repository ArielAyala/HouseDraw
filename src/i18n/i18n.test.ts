import { describe, expect, it } from 'vitest'
import { en } from './en'
import { es } from './es'
import { nextLanguage } from './index'

function keysOf(dictionary: object, prefix = ''): string[] {
  return Object.entries(dictionary).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'object' && value !== null
      ? keysOf(value, path)
      : [path]
  })
}

describe('translations', () => {
  it('have the same keys in English and Spanish', () => {
    expect(keysOf(es).sort()).toEqual(keysOf(en).sort())
  })

  it('have no empty strings', () => {
    for (const key of keysOf(es)) {
      const value = key
        .split('.')
        .reduce<unknown>(
          (node, part) => (node as Record<string, unknown>)[part],
          es,
        )
      expect(value, key).not.toBe('')
    }
  })

  it('toggles between English and Spanish', () => {
    expect(nextLanguage('en')).toBe('es')
    expect(nextLanguage('es')).toBe('en')
  })
})
