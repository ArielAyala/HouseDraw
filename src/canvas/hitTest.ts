import type { PointMm, Wall } from '../document/types'

export const HIT_PADDING_PX = 4

function distanceToSegmentMm(point: PointMm, a: PointMm, b: PointMm): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) {
    return Math.hypot(point.x - a.x, point.y - a.y)
  }
  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len2),
  )
  const x = a.x + t * dx
  const y = a.y + t * dy
  return Math.hypot(point.x - x, point.y - y)
}

/** Nearest wall whose thickness (plus padding) contains `point`. Last drawn wins ties. */
export function hitTestWall(
  point: PointMm,
  walls: Wall[],
  extraMm: number,
): Wall | null {
  let best: Wall | null = null
  let bestDist = Infinity
  for (const wall of walls) {
    const dist = distanceToSegmentMm(point, wall.a, wall.b)
    const threshold = wall.thicknessMm / 2 + extraMm
    if (dist <= threshold && dist <= bestDist) {
      best = wall
      bestDist = dist
    }
  }
  return best
}
