import type { PointMm, Wall } from '../document/types'
import { distanceMm, roundPointMm } from './geometry'
import { snapToGrid } from './snap'

export type RectMm = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export type Marquee = {
  start: PointMm
  end: PointMm
}

export type DragState = {
  wallIds: string[]
  origin: PointMm
  originals: Wall[]
  delta: PointMm
}

export type ItemDragState = {
  itemIds: string[]
  origin: PointMm
  delta: PointMm
}

export type SelectSession = {
  marquee: Marquee | null
  drag: DragState | null
  itemDrag: ItemDragState | null
}

export type SnapMoveInput = {
  origin: PointMm
  raw: PointMm
  movingEndpoints: PointMm[]
  staticEndpoints: PointMm[]
  gridMm: number
  radiusMm: number
}

export function createSelectSession(): SelectSession {
  return { marquee: null, drag: null, itemDrag: null }
}

export function rectFromPoints(a: PointMm, b: PointMm): RectMm {
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  }
}

export function pointInRect(point: PointMm, rect: RectMm): boolean {
  return (
    point.x >= rect.minX &&
    point.x <= rect.maxX &&
    point.y >= rect.minY &&
    point.y <= rect.maxY
  )
}

export function segmentIntersectsRect(
  a: PointMm,
  b: PointMm,
  rect: RectMm,
): boolean {
  if (pointInRect(a, rect) || pointInRect(b, rect)) {
    return true
  }
  let t0 = 0
  let t1 = 1
  const dx = b.x - a.x
  const dy = b.y - a.y
  const clips = [
    { p: -dx, q: a.x - rect.minX },
    { p: dx, q: rect.maxX - a.x },
    { p: -dy, q: a.y - rect.minY },
    { p: dy, q: rect.maxY - a.y },
  ]
  for (const clip of clips) {
    if (clip.p === 0) {
      if (clip.q < 0) {
        return false
      }
      continue
    }
    const r = clip.q / clip.p
    if (clip.p < 0) {
      if (r > t1) {
        return false
      }
      if (r > t0) {
        t0 = r
      }
    } else {
      if (r < t0) {
        return false
      }
      if (r < t1) {
        t1 = r
      }
    }
  }
  return t0 <= t1
}

export function wallsInRect(
  walls: Wall[],
  start: PointMm,
  end: PointMm,
): Wall[] {
  const rect = rectFromPoints(start, end)
  return walls.filter((wall) => segmentIntersectsRect(wall.a, wall.b, rect))
}

export function marqueeSelection(walls: Wall[], marquee: Marquee): string[] {
  return wallsInRect(walls, marquee.start, marquee.end).map((wall) => wall.id)
}

export function snapDeltaToGrid(delta: PointMm, gridMm: number): PointMm {
  if (gridMm <= 0) {
    return roundPointMm(delta)
  }
  return snapToGrid(delta, gridMm)
}

export function snapMoveDelta(input: SnapMoveInput): PointMm {
  const rawDelta = {
    x: input.raw.x - input.origin.x,
    y: input.raw.y - input.origin.y,
  }
  let best = snapDeltaToGrid(rawDelta, input.gridMm)
  let bestDist = distanceMm(rawDelta, best)

  for (const endpoint of input.movingEndpoints) {
    for (const target of input.staticEndpoints) {
      const candidate = {
        x: target.x - endpoint.x,
        y: target.y - endpoint.y,
      }
      const dist = distanceMm(rawDelta, candidate)
      if (dist <= input.radiusMm && dist < bestDist) {
        best = candidate
        bestDist = dist
      }
    }
  }

  return roundPointMm(best)
}

export function beginDrag(
  wallIds: string[],
  origin: PointMm,
  walls: Wall[],
): DragState {
  const idSet = new Set(wallIds)
  return {
    wallIds,
    origin,
    originals: walls.filter((wall) => idSet.has(wall.id)),
    delta: { x: 0, y: 0 },
  }
}

export function beginMarquee(point: PointMm): Marquee {
  return { start: point, end: point }
}

export function updateMarquee(marquee: Marquee, point: PointMm): Marquee {
  return { ...marquee, end: point }
}

export function wallEndpoints(walls: Wall[]): PointMm[] {
  const points: PointMm[] = []
  for (const wall of walls) {
    points.push(wall.a, wall.b)
  }
  return points
}
