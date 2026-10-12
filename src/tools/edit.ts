import type { PlanDocument, PointMm, Wall } from '../document/types'
import {
  distanceMm,
  pointAtDistanceMm,
  roundMm,
  roundPointMm,
} from './geometry'
import { MIN_WALL_LENGTH_MM } from './wall'

export const MIN_WALL_THICKNESS_MM = 1

export function translatePointMm(point: PointMm, delta: PointMm): PointMm {
  return roundPointMm({ x: point.x + delta.x, y: point.y + delta.y })
}

export function translateWall(wall: Wall, delta: PointMm): Wall {
  return {
    ...wall,
    a: translatePointMm(wall.a, delta),
    b: translatePointMm(wall.b, delta),
  }
}

export function moveWallsById(
  document: PlanDocument,
  ids: readonly string[],
  delta: PointMm,
): PlanDocument {
  const idSet = new Set(ids)
  return {
    ...document,
    walls: document.walls.map((wall) =>
      idSet.has(wall.id) ? translateWall(wall, delta) : wall,
    ),
  }
}

export function deleteWallsById(
  document: PlanDocument,
  ids: readonly string[],
): PlanDocument {
  const idSet = new Set(ids)
  return {
    ...document,
    walls: document.walls.filter((wall) => !idSet.has(wall.id)),
    openings: document.openings.filter((opening) => !idSet.has(opening.wallId)),
  }
}

export function updateWallById(
  document: PlanDocument,
  id: string,
  mutate: (wall: Wall) => Wall,
): PlanDocument {
  return {
    ...document,
    walls: document.walls.map((wall) => (wall.id === id ? mutate(wall) : wall)),
  }
}

export function setWallLengthMm(wall: Wall, lengthMm: number): Wall {
  const rounded = roundMm(lengthMm)
  if (rounded < MIN_WALL_LENGTH_MM) {
    return wall
  }
  if (roundMm(distanceMm(wall.a, wall.b)) === rounded) {
    return wall
  }
  return { ...wall, b: pointAtDistanceMm(wall.a, wall.b, rounded) }
}

export function setWallThicknessMm(wall: Wall, thicknessMm: number): Wall {
  const rounded = roundMm(thicknessMm)
  if (rounded < MIN_WALL_THICKNESS_MM) {
    return wall
  }
  if (wall.thicknessMm === rounded) {
    return wall
  }
  return { ...wall, thicknessMm: rounded }
}

export function isZeroDelta(delta: PointMm): boolean {
  return roundMm(delta.x) === 0 && roundMm(delta.y) === 0
}
