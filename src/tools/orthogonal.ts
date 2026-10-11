import type { PointMm } from '../document/types'

export type Axis = 'h' | 'v'

export function orthogonalAxis(start: PointMm, raw: PointMm): Axis {
  return Math.abs(raw.x - start.x) >= Math.abs(raw.y - start.y) ? 'h' : 'v'
}

/** Constrain `raw` to a horizontal or vertical segment from `start`. */
export function lockOrthogonal(start: PointMm, raw: PointMm): PointMm {
  const axis = orthogonalAxis(start, raw)
  if (axis === 'h') {
    return { x: raw.x, y: start.y }
  }
  return { x: start.x, y: raw.y }
}

export function isOnOrthogonalAxis(
  start: PointMm,
  point: PointMm,
  axis: Axis,
  toleranceMm = 0.5,
): boolean {
  if (axis === 'h') {
    return Math.abs(point.y - start.y) <= toleranceMm
  }
  return Math.abs(point.x - start.x) <= toleranceMm
}
