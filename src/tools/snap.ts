import type { PointMm, Wall } from '../document/types'
import {
  distanceMm,
  perpendicularFootOnSegment,
  roundPointMm,
} from './geometry'
import {
  type Axis,
  isOnOrthogonalAxis,
  lockOrthogonal,
  orthogonalAxis,
} from './orthogonal'

export const SNAP_RADIUS_PX = 12

export type SnapKind = 'endpoint' | 'perpendicular' | 'grid'

export type SnapResult = {
  point: PointMm
  kind: SnapKind
}

export type SnapInput = {
  raw: PointMm
  start: PointMm | null
  walls: Wall[]
  gridMm: number
  radiusMm: number
  ortho: boolean
}

const PRIORITY: Record<SnapKind, number> = {
  endpoint: 0,
  perpendicular: 1,
  grid: 2,
}

export function snapToGrid(point: PointMm, gridMm: number): PointMm {
  if (gridMm <= 0) {
    return roundPointMm(point)
  }
  return roundPointMm({
    x: Math.round(point.x / gridMm) * gridMm,
    y: Math.round(point.y / gridMm) * gridMm,
  })
}

export function snapPoint(input: SnapInput): SnapResult {
  const { raw, start, walls, gridMm, radiusMm, ortho } = input
  const useOrtho = Boolean(start && ortho)
  const constrained = start && useOrtho ? lockOrthogonal(start, raw) : raw
  const axis: Axis | null =
    start && useOrtho ? orthogonalAxis(start, constrained) : null

  const candidates: Array<{ point: PointMm; kind: SnapKind; dist: number }> = []

  for (const wall of walls) {
    for (const endpoint of [wall.a, wall.b]) {
      if (start && axis && !isOnOrthogonalAxis(start, endpoint, axis)) {
        continue
      }
      const dist = distanceMm(constrained, endpoint)
      if (dist <= radiusMm) {
        candidates.push({ point: endpoint, kind: 'endpoint', dist })
      }
    }
  }

  if (start) {
    for (const wall of walls) {
      const foot = perpendicularFootOnSegment(start, wall.a, wall.b)
      if (!foot) {
        continue
      }
      if (axis && !isOnOrthogonalAxis(start, foot, axis)) {
        continue
      }
      const dist = distanceMm(constrained, foot)
      if (dist <= radiusMm) {
        candidates.push({
          point: roundPointMm(foot),
          kind: 'perpendicular',
          dist,
        })
      }
    }
  }

  candidates.sort(
    (a, b) => PRIORITY[a.kind] - PRIORITY[b.kind] || a.dist - b.dist,
  )
  const best = candidates[0]
  if (best) {
    return { point: roundPointMm(best.point), kind: best.kind }
  }

  const gridPoint = snapToGrid(constrained, gridMm)
  if (start && axis === 'h') {
    gridPoint.y = start.y
  } else if (start && axis === 'v') {
    gridPoint.x = start.x
  }
  return { point: roundPointMm(gridPoint), kind: 'grid' }
}
