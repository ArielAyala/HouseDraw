export const TOOLBAR_STORAGE_KEY = 'housedraw.toolbar'

export const SNAP_THRESHOLD = 24
export const EDGE_MARGIN = 12

export type ToolbarEdge = 'left' | 'right' | 'top' | 'bottom' | 'free'

export type ToolbarPlacement = {
  edge: ToolbarEdge
  x: number
  y: number
}

export type Size = { width: number; height: number }

export type ToolbarLayout = {
  left: number
  top: number
}

export function isHorizontalPlacement(placement: ToolbarPlacement): boolean {
  return placement.edge === 'top' || placement.edge === 'bottom'
}

export function snapPlacement(
  x: number,
  y: number,
  stage: Size,
  bar: Size,
): ToolbarPlacement {
  const maxX = Math.max(0, stage.width - bar.width)
  const maxY = Math.max(0, stage.height - bar.height)
  const freeX = clamp(x, 0, maxX)
  const freeY = clamp(y, 0, maxY)

  const distances: Array<{ edge: ToolbarEdge; distance: number }> = [
    { edge: 'left', distance: freeX },
    { edge: 'right', distance: maxX - freeX },
    { edge: 'top', distance: freeY },
    { edge: 'bottom', distance: maxY - freeY },
  ]

  let nearest: { edge: ToolbarEdge; distance: number } | null = null
  for (const candidate of distances) {
    if (candidate.distance > SNAP_THRESHOLD) continue
    if (nearest === null || candidate.distance < nearest.distance) {
      nearest = candidate
    }
  }

  return { edge: nearest?.edge ?? 'free', x: freeX, y: freeY }
}

export function resolveToolbarLayout(
  placement: ToolbarPlacement,
  stage: Size,
  bar: Size,
): ToolbarLayout {
  const maxX = Math.max(0, stage.width - bar.width)
  const maxY = Math.max(0, stage.height - bar.height)
  const x = clamp(placement.x, 0, maxX)
  const y = clamp(placement.y, 0, maxY)

  switch (placement.edge) {
    case 'left':
      return { left: EDGE_MARGIN, top: y }
    case 'right':
      return { left: Math.max(0, maxX - EDGE_MARGIN), top: y }
    case 'top':
      return { left: x, top: EDGE_MARGIN }
    case 'bottom':
      return { left: x, top: Math.max(0, maxY - EDGE_MARGIN) }
    case 'free':
      return { left: x, top: y }
  }
}

export function parseToolbarPlacement(
  text: string | null,
): ToolbarPlacement | null {
  if (text === null) return null
  try {
    const value: unknown = JSON.parse(text)
    if (typeof value !== 'object' || value === null) return null
    const { edge, x, y } = value as Record<string, unknown>
    if (!isEdge(edge)) return null
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null
    return { edge, x, y }
  } catch {
    return null
  }
}

export function readToolbarPlacement(): ToolbarPlacement | null {
  try {
    return parseToolbarPlacement(localStorage.getItem(TOOLBAR_STORAGE_KEY))
  } catch {
    return null
  }
}

export function writeToolbarPlacement(placement: ToolbarPlacement): void {
  try {
    localStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(placement))
  } catch {
    // quota exceeded / private mode: the position is kept in memory only
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function isEdge(value: unknown): value is ToolbarEdge {
  return (
    value === 'left' ||
    value === 'right' ||
    value === 'top' ||
    value === 'bottom' ||
    value === 'free'
  )
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
