import { useEffect } from 'react'
import { useDocumentStore } from './store'

export type HistoryHotkey = 'undo' | 'redo'

export function historyHotkey(event: {
  code: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}): HistoryHotkey | null {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) {
    return null
  }
  if (event.code === 'KeyZ' && event.shiftKey) {
    return 'redo'
  }
  if (event.code === 'KeyZ') {
    return 'undo'
  }
  if (event.code === 'KeyY') {
    return 'redo'
  }
  return null
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

export function useDocumentHotkeys(): void {
  const undo = useDocumentStore((state) => state.undo)
  const redo = useDocumentStore((state) => state.redo)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return
      }
      const action = historyHotkey(event)
      if (action === 'undo') {
        event.preventDefault()
        undo()
        return
      }
      if (action === 'redo') {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])
}
