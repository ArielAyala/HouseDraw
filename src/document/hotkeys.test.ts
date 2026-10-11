import { describe, expect, it } from 'vitest'
import { historyHotkey } from './hotkeys'

function key(
  code: string,
  mods: Partial<{
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
    altKey: boolean
  }> = {},
) {
  return {
    code,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...mods,
  }
}

describe('historyHotkey', () => {
  it('maps Ctrl+Z to undo', () => {
    expect(historyHotkey(key('KeyZ', { ctrlKey: true }))).toBe('undo')
  })

  it('maps Ctrl+Y and Ctrl+Shift+Z to redo', () => {
    expect(historyHotkey(key('KeyY', { ctrlKey: true }))).toBe('redo')
    expect(historyHotkey(key('KeyZ', { ctrlKey: true, shiftKey: true }))).toBe(
      'redo',
    )
  })

  it('accepts the Meta modifier', () => {
    expect(historyHotkey(key('KeyZ', { metaKey: true }))).toBe('undo')
    expect(historyHotkey(key('KeyZ', { metaKey: true, shiftKey: true }))).toBe(
      'redo',
    )
  })

  it('ignores keys without a modifier and Alt combinations', () => {
    expect(historyHotkey(key('KeyZ'))).toBeNull()
    expect(
      historyHotkey(key('KeyZ', { ctrlKey: true, altKey: true })),
    ).toBeNull()
  })
})
