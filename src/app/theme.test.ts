import { afterEach, describe, expect, it } from 'vitest'
import {
  applyTheme,
  isTheme,
  persistTheme,
  readStoredTheme,
  THEME_STORAGE_KEY,
} from './theme'

describe('theme', () => {
  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY)
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.colorScheme = ''
  })

  it('accepts only dark and light', () => {
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('light')).toBe(true)
    expect(isTheme('system')).toBe(false)
    expect(isTheme(null)).toBe(false)
  })

  it('defaults to dark when nothing is stored', () => {
    expect(readStoredTheme()).toBe('dark')
  })

  it('reads a persisted theme', () => {
    persistTheme('light')
    expect(readStoredTheme()).toBe('light')
  })

  it('applies data-theme and color-scheme', () => {
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })
})
