import { describe, expect, it } from 'vitest'
import { toolHotkey } from './shortcuts'

const plain = { ctrlKey: false, metaKey: false, altKey: false, shiftKey: false }

describe('toolHotkey', () => {
  it('maps V, W and H to select, wall and pan', () => {
    expect(toolHotkey({ code: 'KeyV', ...plain })).toBe('select')
    expect(toolHotkey({ code: 'KeyW', ...plain })).toBe('wall')
    expect(toolHotkey({ code: 'KeyH', ...plain })).toBe('pan')
  })

  it('ignores other keys', () => {
    expect(toolHotkey({ code: 'KeyQ', ...plain })).toBeNull()
    expect(toolHotkey({ code: 'Space', ...plain })).toBeNull()
  })

  it('ignores shortcuts with modifiers so Ctrl+S and friends keep working', () => {
    expect(toolHotkey({ code: 'KeyS', ...plain, ctrlKey: true })).toBeNull()
    expect(toolHotkey({ code: 'KeyW', ...plain, metaKey: true })).toBeNull()
    expect(toolHotkey({ code: 'KeyV', ...plain, shiftKey: true })).toBeNull()
    expect(toolHotkey({ code: 'KeyH', ...plain, altKey: true })).toBeNull()
  })
})
