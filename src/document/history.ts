import { cloneDocument } from './empty'
import type { PlanDocument } from './types'

export const MAX_HISTORY = 100

export type DocumentHistory = {
  document: PlanDocument
  past: PlanDocument[]
  future: PlanDocument[]
}

export function createHistory(document: PlanDocument): DocumentHistory {
  return { document, past: [], future: [] }
}

export function applyDocumentChange(
  history: DocumentHistory,
  mutate: (document: PlanDocument) => PlanDocument,
): DocumentHistory {
  const snapshot = cloneDocument(history.document)
  const document = mutate(cloneDocument(history.document))
  const past = [...history.past, snapshot]
  if (past.length > MAX_HISTORY) {
    past.splice(0, past.length - MAX_HISTORY)
  }
  return { document, past, future: [] }
}

export function undoDocument(history: DocumentHistory): DocumentHistory {
  const previous = history.past.at(-1)
  if (!previous) {
    return history
  }
  return {
    document: previous,
    past: history.past.slice(0, -1),
    future: [history.document, ...history.future],
  }
}

export function redoDocument(history: DocumentHistory): DocumentHistory {
  const next = history.future[0]
  if (!next) {
    return history
  }
  return {
    document: next,
    past: [...history.past, history.document],
    future: history.future.slice(1),
  }
}
