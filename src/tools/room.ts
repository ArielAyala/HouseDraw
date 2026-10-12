import { DEFAULT_ROOM_NAME } from '../document/rooms'
import type { PlanDocument, PointMm, Wall } from '../document/types'
import { createWallEntity } from './wall'

export const MIN_ROOM_SIZE_MM = 100

export type RoomSession = {
  start: PointMm | null
  cursor: PointMm | null
  /** True while the first press is still held (drag gesture). */
  pressing: boolean
}

export function createRoomSession(): RoomSession {
  return { start: null, cursor: null, pressing: false }
}

export function isValidRoomRect(a: PointMm, b: PointMm): boolean {
  return (
    Math.abs(b.x - a.x) >= MIN_ROOM_SIZE_MM &&
    Math.abs(b.y - a.y) >= MIN_ROOM_SIZE_MM
  )
}

export function rectangleCorners(a: PointMm, b: PointMm): PointMm[] {
  return [
    { x: a.x, y: a.y },
    { x: b.x, y: a.y },
    { x: b.x, y: b.y },
    { x: a.x, y: b.y },
  ]
}

export function createRoomWalls(
  ids: readonly string[],
  a: PointMm,
  b: PointMm,
  thicknessMm: number,
): Wall[] {
  const corners = rectangleCorners(a, b)
  return corners.map((corner, i) =>
    createWallEntity(
      ids[i] ?? `room-wall-${i}`,
      corner,
      corners[(i + 1) % 4] as PointMm,
      thicknessMm,
    ),
  )
}

/** Adds four walls and a name label at the centre of the rectangle. */
export function addRoomToDocument(
  document: PlanDocument,
  walls: Wall[],
  labelId: string,
  a: PointMm,
  b: PointMm,
): PlanDocument {
  return {
    ...document,
    walls: [...document.walls, ...walls],
    labels: [
      ...document.labels,
      {
        id: labelId,
        text: DEFAULT_ROOM_NAME,
        x: Math.round((a.x + b.x) / 2),
        y: Math.round((a.y + b.y) / 2),
      },
    ],
  }
}
