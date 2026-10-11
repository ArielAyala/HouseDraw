import { DOCUMENT_VERSION, type PlanDocument } from './types'

export const DEFAULT_GRID_MM = 100
export const DEFAULT_WALL_THICKNESS_MM = 150

export function createEmptyDocument(): PlanDocument {
  return {
    version: DOCUMENT_VERSION,
    unit: 'mm',
    settings: {
      gridMm: DEFAULT_GRID_MM,
      wallThicknessMm: DEFAULT_WALL_THICKNESS_MM,
      theme: 'dark',
    },
    walls: [],
    openings: [],
    items: [],
    labels: [],
  }
}

export function cloneDocument(document: PlanDocument): PlanDocument {
  return structuredClone(document)
}
