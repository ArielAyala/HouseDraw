import { create } from 'zustand'
import { createEmptyDocument } from './empty'
import {
  applyDocumentChange,
  createHistory,
  redoDocument,
  undoDocument,
} from './history'
import type { PlanDocument } from './types'

export type DocumentStore = {
  document: PlanDocument
  past: PlanDocument[]
  future: PlanDocument[]
  apply: (mutate: (document: PlanDocument) => PlanDocument) => void
  undo: () => void
  redo: () => void
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  ...createHistory(createEmptyDocument()),
  apply: (mutate) => {
    const { document, past, future } = get()
    set(applyDocumentChange({ document, past, future }, mutate))
  },
  undo: () => {
    const { document, past, future } = get()
    set(undoDocument({ document, past, future }))
  },
  redo: () => {
    const { document, past, future } = get()
    set(redoDocument({ document, past, future }))
  },
}))
