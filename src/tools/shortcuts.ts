import { useEffect } from 'react'
import { isTypingTarget } from '../document/hotkeys'
import { type EditorTool, useEditorStore } from './editor'

const TOOL_KEYS: Partial<Record<string, EditorTool>> = {
  KeyV: 'select',
  KeyW: 'wall',
  KeyH: 'pan',
}

export function toolHotkey(event: {
  code: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}): EditorTool | null {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
    return null
  }
  return TOOL_KEYS[event.code] ?? null
}

export function useToolHotkeys(): void {
  const setTool = useEditorStore((state) => state.setTool)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return
      }
      const tool = toolHotkey(event)
      if (tool) {
        setTool(tool)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setTool])
}
