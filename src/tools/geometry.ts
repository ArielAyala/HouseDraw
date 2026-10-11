import type { PointMm } from '../document/types'

export function roundMm(value: number): number {
  const rounded = Math.round(value)
  return rounded === 0 ? 0 : rounded
}

export function roundPointMm(point: PointMm): PointMm {
  return { x: roundMm(point.x), y: roundMm(point.y) }
}

export function distanceMm(a: PointMm, b: PointMm): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function pointAtDistanceMm(
  start: PointMm,
  toward: PointMm,
  lengthMm: number,
): PointMm {
  const dx = toward.x - start.x
  const dy = toward.y - start.y
  const current = Math.hypot(dx, dy)
  if (current < 1e-9) {
    return roundPointMm({ x: start.x + lengthMm, y: start.y })
  }
  const scale = lengthMm / current
  return roundPointMm({
    x: start.x + dx * scale,
    y: start.y + dy * scale,
  })
}

export function closestPointOnSegment(
  point: PointMm,
  a: PointMm,
  b: PointMm,
): { point: PointMm; t: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) {
    return { point: { x: a.x, y: a.y }, t: 0 }
  }
  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len2),
  )
  return { point: { x: a.x + t * dx, y: a.y + t * dy }, t }
}

/** Perpendicular from `start` onto segment `a`–`b`, excluding endpoints. */
export function perpendicularFootOnSegment(
  start: PointMm,
  a: PointMm,
  b: PointMm,
): PointMm | null {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) {
    return null
  }
  const t = ((start.x - a.x) * dx + (start.y - a.y) * dy) / len2
  if (t <= 1e-6 || t >= 1 - 1e-6) {
    return null
  }
  return { x: a.x + t * dx, y: a.y + t * dy }
}
