import type { Opening, OpeningKind, PlanDocument, PointMm, Wall } from './types'

export const DEFAULT_OPENING_WIDTH_MM: Record<OpeningKind, number> = {
  door: 800,
  window: 1200,
}

export function wallLengthMm(wall: Wall): number {
  return Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y)
}

/** Distance in mm from endpoint `a` along the wall to the projection of `point`. Unclamped. */
export function wallCoordinateMm(point: PointMm, wall: Wall): number {
  const length = wallLengthMm(wall)
  if (length < 1e-9) {
    return 0
  }
  const dx = wall.b.x - wall.a.x
  const dy = wall.b.y - wall.a.y
  return ((point.x - wall.a.x) * dx + (point.y - wall.a.y) * dy) / length
}

/** Perpendicular distance in mm from `point` to the wall centerline. */
export function wallCrossDistanceMm(point: PointMm, wall: Wall): number {
  const length = wallLengthMm(wall)
  if (length < 1e-9) {
    return Math.hypot(point.x - wall.a.x, point.y - wall.a.y)
  }
  const dx = wall.b.x - wall.a.x
  const dy = wall.b.y - wall.a.y
  return (
    Math.abs((point.x - wall.a.x) * dy - (point.y - wall.a.y) * dx) / length
  )
}

/**
 * Clamp an opening offset so the whole opening lies inside the wall.
 * Returns null when the opening is wider than the wall.
 */
export function clampOpeningOffsetMm(
  offsetMm: number,
  widthMm: number,
  wallLength: number,
): number | null {
  if (widthMm > wallLength) {
    return null
  }
  const max = wallLength - widthMm
  return Math.round(Math.min(Math.max(offsetMm, 0), max))
}

/** World-space start and end of an opening along its wall. */
export function openingSpan(
  wall: Wall,
  opening: Pick<Opening, 'offsetMm' | 'widthMm'>,
): { a: PointMm; b: PointMm } {
  const length = wallLengthMm(wall)
  if (length < 1e-9) {
    return { a: { ...wall.a }, b: { ...wall.a } }
  }
  const ux = (wall.b.x - wall.a.x) / length
  const uy = (wall.b.y - wall.a.y) / length
  const at = (distance: number): PointMm => ({
    x: wall.a.x + ux * distance,
    y: wall.a.y + uy * distance,
  })
  return {
    a: at(opening.offsetMm),
    b: at(opening.offsetMm + opening.widthMm),
  }
}

export function addOpeningToDocument(
  document: PlanDocument,
  opening: Opening,
): PlanDocument {
  return { ...document, openings: [...document.openings, opening] }
}

export function removeOpeningById(
  document: PlanDocument,
  id: string,
): PlanDocument {
  return {
    ...document,
    openings: document.openings.filter((opening) => opening.id !== id),
  }
}

/**
 * Keep openings on a wall valid after its length changes.
 * Openings that no longer fit are removed; others are clamped inside the wall.
 */
export function fitOpeningsToWall(
  document: PlanDocument,
  wallId: string,
): PlanDocument {
  const wall = document.walls.find((item) => item.id === wallId)
  if (!wall) {
    return document
  }
  const length = wallLengthMm(wall)
  const openings: Opening[] = []
  for (const opening of document.openings) {
    if (opening.wallId !== wallId) {
      openings.push(opening)
      continue
    }
    const offsetMm = clampOpeningOffsetMm(
      opening.offsetMm,
      opening.widthMm,
      length,
    )
    if (offsetMm !== null) {
      openings.push({ ...opening, offsetMm })
    }
  }
  return { ...document, openings }
}

/** Opening under `point`, checked after walls so the last drawn opening wins ties. */
export function openingAtPoint(
  point: PointMm,
  document: PlanDocument,
  extraMm: number,
): Opening | null {
  let found: Opening | null = null
  for (const opening of document.openings) {
    const wall = document.walls.find((item) => item.id === opening.wallId)
    if (!wall) {
      continue
    }
    const along = wallCoordinateMm(point, wall)
    const across = wallCrossDistanceMm(point, wall)
    if (
      along >= opening.offsetMm - extraMm &&
      along <= opening.offsetMm + opening.widthMm + extraMm &&
      across <= wall.thicknessMm / 2 + extraMm
    ) {
      found = opening
    }
  }
  return found
}
