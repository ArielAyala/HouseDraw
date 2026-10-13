import { useEffect } from 'react'
import { useDocumentStore } from '../document/store'
import { writeAutosavedDocument } from './autosave'

export const AUTOSAVE_DELAY_MS = 400

export function useAutosave(): void {
  useEffect(() => {
    let timer: number | undefined

    const flush = () => {
      window.clearTimeout(timer)
      timer = undefined
      writeAutosavedDocument(useDocumentStore.getState().document)
    }

    const unsubscribe = useDocumentStore.subscribe((state, previous) => {
      if (state.document === previous.document) {
        return
      }
      window.clearTimeout(timer)
      timer = window.setTimeout(flush, AUTOSAVE_DELAY_MS)
    })
    window.addEventListener('pagehide', flush)

    return () => {
      unsubscribe()
      window.removeEventListener('pagehide', flush)
      window.clearTimeout(timer)
    }
  }, [])
}
