/** File format version. Unknown future versions are rejected in phase 09. */
export const DOCUMENT_VERSION = 1

export type PointMm = {
  x: number
  y: number
}

export type DocumentTheme = 'dark' | 'light'

export type DocumentSettings = {
  gridMm: number
  wallThicknessMm: number
  theme: DocumentTheme
}

export type Wall = {
  id: string
  a: PointMm
  b: PointMm
  thicknessMm: number
}

export type OpeningKind = 'door' | 'window'

export type Opening = {
  id: string
  type: OpeningKind
  wallId: string
  offsetMm: number
  widthMm: number
}

export type Item = {
  id: string
  catalogId: string
  x: number
  y: number
  widthMm: number
  heightMm: number
  rotationDeg: number
}

export type Label = {
  id: string
  text: string
  x: number
  y: number
}

export type PlanDocument = {
  version: typeof DOCUMENT_VERSION
  unit: 'mm'
  settings: DocumentSettings
  walls: Wall[]
  openings: Opening[]
  items: Item[]
  labels: Label[]
}
