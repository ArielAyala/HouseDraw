export type CatalogGroup =
  | 'bathroom'
  | 'kitchen'
  | 'living'
  | 'bedroom'
  | 'garden'

/** MIME type used for dragging catalog entries onto the canvas. */
export const CATALOG_DRAG_TYPE = 'application/x-housedraw-stamp'

/** Shape in normalized item space: 0..1 on both axes, origin top-left. */
export type SymbolShape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill?: boolean }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill?: boolean }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }

export type CatalogEntry = {
  id: string
  group: CatalogGroup
  widthMm: number
  heightMm: number
  symbol: SymbolShape[]
}

export const CATALOG_GROUPS: CatalogGroup[] = [
  'bathroom',
  'kitchen',
  'living',
  'bedroom',
  'garden',
]

const FRAME: SymbolShape = { kind: 'rect', x: 0, y: 0, w: 1, h: 1 }

export const CATALOG: CatalogEntry[] = [
  {
    id: 'toilet',
    group: 'bathroom',
    widthMm: 400,
    heightMm: 700,
    symbol: [FRAME, { kind: 'circle', cx: 0.5, cy: 0.62, r: 0.3 }],
  },
  {
    id: 'bathroom-sink',
    group: 'bathroom',
    widthMm: 600,
    heightMm: 450,
    symbol: [FRAME, { kind: 'circle', cx: 0.5, cy: 0.55, r: 0.26 }],
  },
  {
    id: 'shower',
    group: 'bathroom',
    widthMm: 800,
    heightMm: 800,
    symbol: [
      FRAME,
      { kind: 'line', x1: 0, y1: 0, x2: 1, y2: 1 },
      { kind: 'line', x1: 1, y1: 0, x2: 0, y2: 1 },
    ],
  },
  {
    id: 'bathtub',
    group: 'bathroom',
    widthMm: 700,
    heightMm: 1700,
    symbol: [
      { kind: 'rect', x: 0, y: 0, w: 1, h: 1 },
      { kind: 'rect', x: 0.12, y: 0.08, w: 0.76, h: 0.84 },
    ],
  },
  {
    id: 'kitchen-sink',
    group: 'kitchen',
    widthMm: 800,
    heightMm: 600,
    symbol: [FRAME, { kind: 'rect', x: 0.1, y: 0.15, w: 0.8, h: 0.7 }],
  },
  {
    id: 'stove',
    group: 'kitchen',
    widthMm: 600,
    heightMm: 600,
    symbol: [
      FRAME,
      { kind: 'circle', cx: 0.3, cy: 0.3, r: 0.12 },
      { kind: 'circle', cx: 0.7, cy: 0.3, r: 0.12 },
      { kind: 'circle', cx: 0.3, cy: 0.7, r: 0.12 },
      { kind: 'circle', cx: 0.7, cy: 0.7, r: 0.12 },
    ],
  },
  {
    id: 'fridge',
    group: 'kitchen',
    widthMm: 600,
    heightMm: 650,
    symbol: [FRAME, { kind: 'line', x1: 0, y1: 0.4, x2: 1, y2: 0.4 }],
  },
  {
    id: 'counter',
    group: 'kitchen',
    widthMm: 1200,
    heightMm: 600,
    symbol: [FRAME],
  },
  {
    id: 'sofa',
    group: 'living',
    widthMm: 2000,
    heightMm: 900,
    symbol: [
      FRAME,
      { kind: 'rect', x: 0.04, y: 0.04, w: 0.92, h: 0.2 },
      { kind: 'rect', x: 0.04, y: 0.3, w: 0.92, h: 0.66 },
    ],
  },
  {
    id: 'table',
    group: 'living',
    widthMm: 1200,
    heightMm: 800,
    symbol: [FRAME],
  },
  {
    id: 'chair',
    group: 'living',
    widthMm: 500,
    heightMm: 500,
    symbol: [FRAME, { kind: 'rect', x: 0.1, y: 0.1, w: 0.8, h: 0.25 }],
  },
  {
    id: 'tv',
    group: 'living',
    widthMm: 1200,
    heightMm: 100,
    symbol: [FRAME],
  },
  {
    id: 'single-bed',
    group: 'bedroom',
    widthMm: 900,
    heightMm: 2000,
    symbol: [FRAME, { kind: 'rect', x: 0.08, y: 0.04, w: 0.84, h: 0.22 }],
  },
  {
    id: 'double-bed',
    group: 'bedroom',
    widthMm: 1600,
    heightMm: 2000,
    symbol: [
      FRAME,
      { kind: 'rect', x: 0.06, y: 0.04, w: 0.4, h: 0.2 },
      { kind: 'rect', x: 0.54, y: 0.04, w: 0.4, h: 0.2 },
    ],
  },
  {
    id: 'nightstand',
    group: 'bedroom',
    widthMm: 500,
    heightMm: 400,
    symbol: [FRAME],
  },
  {
    id: 'wardrobe',
    group: 'bedroom',
    widthMm: 1200,
    heightMm: 600,
    symbol: [FRAME, { kind: 'line', x1: 0.5, y1: 0, x2: 0.5, y2: 1 }],
  },
  {
    id: 'grass',
    group: 'garden',
    widthMm: 1000,
    heightMm: 1000,
    symbol: [{ kind: 'rect', x: 0, y: 0, w: 1, h: 1, fill: true }],
  },
  {
    id: 'tree',
    group: 'garden',
    widthMm: 2000,
    heightMm: 2000,
    symbol: [{ kind: 'circle', cx: 0.5, cy: 0.5, r: 0.5, fill: true }],
  },
  {
    id: 'fence',
    group: 'garden',
    widthMm: 2000,
    heightMm: 100,
    symbol: [FRAME],
  },
]

export function findCatalogEntry(id: string): CatalogEntry | undefined {
  return CATALOG.find((entry) => entry.id === id)
}
