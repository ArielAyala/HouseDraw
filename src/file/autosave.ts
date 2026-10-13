import type { PlanDocument } from '../document/types'
import {
  type ParseDocumentResult,
  parseDocument,
  serializeDocument,
} from './documentFile'

export const AUTOSAVE_STORAGE_KEY = 'housedraw.document'

export function readAutosavedDocument(): ParseDocumentResult | null {
  try {
    const text = localStorage.getItem(AUTOSAVE_STORAGE_KEY)
    if (text === null) {
      return null
    }
    return parseDocument(text)
  } catch {
    return null
  }
}

export function writeAutosavedDocument(plan: PlanDocument): void {
  try {
    localStorage.setItem(AUTOSAVE_STORAGE_KEY, serializeDocument(plan))
  } catch {
    // quota exceeded / private mode: the plan stays in memory only
  }
}
