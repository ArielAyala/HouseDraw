import { hitTestWall } from '../canvas/hitTest'
import {
  clampOpeningOffsetMm,
  wallCoordinateMm,
  wallLengthMm,
} from '../document/openings'
import type {
  Opening,
  OpeningKind,
  PlanDocument,
  PointMm,
} from '../document/types'

export type OpeningDraft = Omit<Opening, 'id'>

/**
 * Where an opening of `widthMm` would be placed under `point`: centered on the
 * nearest wall, clamped to stay inside it. Null when no wall is hit or the
 * opening does not fit on that wall.
 */
export function openingDraftAt(
  document: PlanDocument,
  kind: OpeningKind,
  widthMm: number,
  point: PointMm,
  extraMm: number,
): OpeningDraft | null {
  const wall = hitTestWall(point, document.walls, extraMm)
  if (!wall) {
    return null
  }
  const offsetMm = clampOpeningOffsetMm(
    Math.round(wallCoordinateMm(point, wall) - widthMm / 2),
    widthMm,
    wallLengthMm(wall),
  )
  if (offsetMm === null) {
    return null
  }
  return { type: kind, wallId: wall.id, offsetMm, widthMm }
}
