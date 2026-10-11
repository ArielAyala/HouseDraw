import { DOCUMENT_VERSION, type PlanDocument } from './types'

/** Tiny sample plan: one 4 m wall. Not loaded by the app. */
export const fixtureDocument: PlanDocument = {
  version: DOCUMENT_VERSION,
  unit: 'mm',
  settings: {
    gridMm: 100,
    wallThicknessMm: 150,
    theme: 'dark',
  },
  walls: [
    {
      id: 'wall-1',
      a: { x: 0, y: 0 },
      b: { x: 4000, y: 0 },
      thicknessMm: 150,
    },
  ],
  openings: [],
  items: [],
  labels: [],
}
