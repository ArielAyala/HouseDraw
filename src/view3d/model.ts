import { wallLengthMm } from '../document/openings'
import type { Item, Opening, PlanDocument, Wall } from '../document/types'

export const WALL_HEIGHT_MM = 2400
export const MM_PER_M = 1000
export const OPENING_HEAD_MM = 2100
export const WINDOW_SILL_MM = 900
export const ITEM_HEIGHT_MM = 900

/** Axis-aligned-in-plan box. (x, y) is the plan center; z is the vertical center. */
export type SceneBox = {
  id: string
  kind: 'wall' | 'item'
  x: number
  y: number
  z: number
  /** Along the box's local X axis, which follows `rotationDeg` in plan. */
  lengthMm: number
  thicknessMm: number
  heightMm: number
  rotationDeg: number
}

export type SceneFraming = {
  target: [number, number, number]
  distanceM: number
  groundSizeM: number
}

export function buildSceneBoxes(plan: PlanDocument): SceneBox[] {
  const boxes: SceneBox[] = []
  for (const wall of plan.walls) {
    boxes.push(...wallBoxes(wall, plan.openings))
  }
  for (const item of plan.items) {
    boxes.push(itemBox(item))
  }
  return boxes
}

/**
 * Splits a wall around its openings. Solid pieces run full height; each opening
 * leaves a lintel above it, and a window also leaves a sill below it.
 */
function wallBoxes(wall: Wall, openings: Opening[]): SceneBox[] {
  const length = wallLengthMm(wall)
  if (length < 1) {
    return []
  }
  const dx = wall.b.x - wall.a.x
  const dy = wall.b.y - wall.a.y
  const ux = dx / length
  const uy = dy / length
  const rotationDeg = (Math.atan2(dy, dx) * 180) / Math.PI

  const piece = (
    part: string,
    start: number,
    end: number,
    bottom: number,
    top: number,
  ) => {
    const mid = (start + end) / 2
    return {
      id: `${wall.id}:${part}`,
      kind: 'wall' as const,
      x: wall.a.x + ux * mid,
      y: wall.a.y + uy * mid,
      z: (bottom + top) / 2,
      lengthMm: end - start,
      thicknessMm: wall.thicknessMm,
      heightMm: top - bottom,
      rotationDeg,
    }
  }

  const clamp = (value: number) => Math.min(Math.max(value, 0), length)
  const spans = openings
    .filter((opening) => opening.wallId === wall.id)
    .map((opening) => ({
      id: opening.id,
      type: opening.type,
      start: clamp(opening.offsetMm),
      end: clamp(opening.offsetMm + opening.widthMm),
    }))
    .filter((span) => span.end > span.start)
    .sort((a, b) => a.start - b.start)

  const boxes: SceneBox[] = []
  let cursor = 0
  for (const span of spans) {
    if (span.start > cursor) {
      boxes.push(
        piece(`solid@${cursor}`, cursor, span.start, 0, WALL_HEIGHT_MM),
      )
    }
    cursor = Math.max(cursor, span.end)
  }
  if (cursor < length) {
    boxes.push(piece(`solid@${cursor}`, cursor, length, 0, WALL_HEIGHT_MM))
  }

  for (const span of spans) {
    boxes.push(
      piece(
        `lintel:${span.id}`,
        span.start,
        span.end,
        OPENING_HEAD_MM,
        WALL_HEIGHT_MM,
      ),
    )
    if (span.type === 'window') {
      boxes.push(
        piece(`sill:${span.id}`, span.start, span.end, 0, WINDOW_SILL_MM),
      )
    }
  }
  return boxes
}

function itemBox(item: Item): SceneBox {
  return {
    id: `item:${item.id}`,
    kind: 'item',
    x: item.x,
    y: item.y,
    z: ITEM_HEIGHT_MM / 2,
    lengthMm: item.widthMm,
    thicknessMm: item.heightMm,
    heightMm: ITEM_HEIGHT_MM,
    rotationDeg: item.rotationDeg,
  }
}

/** Camera target and ground size in meters, framed around all boxes. */
export function sceneFraming(boxes: SceneBox[]): SceneFraming {
  if (boxes.length === 0) {
    return { target: [0, 1, 0], distanceM: 8, groundSizeM: 10 }
  }
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let maxTop = 0
  for (const box of boxes) {
    const reach = Math.max(box.lengthMm, box.thicknessMm) / 2
    minX = Math.min(minX, box.x - reach)
    maxX = Math.max(maxX, box.x + reach)
    minY = Math.min(minY, box.y - reach)
    maxY = Math.max(maxY, box.y + reach)
    maxTop = Math.max(maxTop, box.z + box.heightMm / 2)
  }
  const spanMm = Math.max(maxX - minX, maxY - minY, WALL_HEIGHT_MM)
  return {
    target: [
      (minX + maxX) / 2 / MM_PER_M,
      maxTop / 2 / MM_PER_M,
      (minY + maxY) / 2 / MM_PER_M,
    ],
    distanceM: (spanMm / MM_PER_M) * 1.4 + 2,
    groundSizeM: Math.ceil((spanMm / MM_PER_M) * 1.5) + 2,
  }
}
