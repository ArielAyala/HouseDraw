import type { Label, PlanDocument, PointMm, Wall } from './types'

export const DEFAULT_ROOM_NAME = 'Room'

export type Room = {
  /** Stable id derived from the walls that bound the room. */
  id: string
  name: string
  polygon: PointMm[]
  wallIds: string[]
  areaMm2: number
  centroid: PointMm
  /** Label that stores the user-defined name, if any. */
  labelId: string | null
}

type HalfEdge = {
  from: string
  to: string
  wallId: string
  angle: number
}

const key = (p: PointMm): string => `${p.x},${p.y}`

export function polygonAreaMm2(polygon: readonly PointMm[]): number {
  let sum = 0
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    if (a && b) {
      sum += a.x * b.y - b.x * a.y
    }
  }
  return sum / 2
}

export function polygonCentroid(polygon: readonly PointMm[]): PointMm {
  const area = polygonAreaMm2(polygon)
  if (Math.abs(area) < 1e-9) {
    const n = polygon.length || 1
    return {
      x: polygon.reduce((s, p) => s + p.x, 0) / n,
      y: polygon.reduce((s, p) => s + p.y, 0) / n,
    }
  }
  let cx = 0
  let cy = 0
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    if (a && b) {
      const cross = a.x * b.y - b.x * a.y
      cx += (a.x + b.x) * cross
      cy += (a.y + b.y) * cross
    }
  }
  return { x: cx / (6 * area), y: cy / (6 * area) }
}

export function pointInPolygon(
  point: PointMm,
  polygon: readonly PointMm[],
): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    if (!a || !b) {
      continue
    }
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside
    }
  }
  return inside
}

export function formatAreaMm2(areaMm2: number): string {
  return `${(areaMm2 / 1_000_000).toFixed(2)} m²`
}

/**
 * Bounded faces of the planar graph formed by walls (joined at shared
 * endpoints). Area uses wall centerlines.
 */
export function detectRooms(
  walls: readonly Wall[],
  labels: readonly Label[] = [],
): Room[] {
  const points = new Map<string, PointMm>()
  const outgoing = new Map<string, HalfEdge[]>()

  const addHalf = (from: PointMm, to: PointMm, wallId: string) => {
    const edge: HalfEdge = {
      from: key(from),
      to: key(to),
      wallId,
      angle: Math.atan2(to.y - from.y, to.x - from.x),
    }
    const list = outgoing.get(edge.from) ?? []
    list.push(edge)
    outgoing.set(edge.from, list)
  }

  for (const wall of walls) {
    if (wall.a.x === wall.b.x && wall.a.y === wall.b.y) {
      continue
    }
    points.set(key(wall.a), wall.a)
    points.set(key(wall.b), wall.b)
    addHalf(wall.a, wall.b, wall.id)
    addHalf(wall.b, wall.a, wall.id)
  }
  for (const list of outgoing.values()) {
    list.sort((p, q) => p.angle - q.angle)
  }

  const visited = new Set<HalfEdge>()
  const rooms: Room[] = []

  for (const list of outgoing.values()) {
    for (const start of list) {
      if (visited.has(start)) {
        continue
      }
      const face: HalfEdge[] = []
      let current: HalfEdge | undefined = start
      while (current && !visited.has(current)) {
        visited.add(current)
        face.push(current)
        const edge: HalfEdge = current
        const atEnd: HalfEdge[] = outgoing.get(edge.to) ?? []
        const twinIndex: number = atEnd.findIndex(
          (e) => e.to === edge.from && e.wallId === edge.wallId,
        )
        if (twinIndex < 0) {
          break
        }
        current = atEnd[(twinIndex - 1 + atEnd.length) % atEnd.length]
      }
      const polygon = face
        .map((e) => points.get(e.from))
        .filter((p): p is PointMm => p !== undefined)
      if (polygon.length < 3 || polygonAreaMm2(polygon) <= 0) {
        continue
      }
      rooms.push(buildRoom(polygon, face, labels))
    }
  }

  return rooms
}

function buildRoom(
  polygon: PointMm[],
  face: HalfEdge[],
  labels: readonly Label[],
): Room {
  const wallIds = [...new Set(face.map((e) => e.wallId))].sort()
  const centroid = polygonCentroid(polygon)
  const label = labels.find((l) => pointInPolygon(l, polygon))
  return {
    id: wallIds.join('+'),
    name: label?.text || DEFAULT_ROOM_NAME,
    polygon,
    wallIds,
    areaMm2: polygonAreaMm2(polygon),
    centroid,
    labelId: label?.id ?? null,
  }
}

/** Rename a room by updating (or creating) the label inside it. */
export function renameRoom(
  document: PlanDocument,
  roomId: string,
  name: string,
  newLabelId: string,
): PlanDocument {
  const room = detectRooms(document.walls, document.labels).find(
    (r) => r.id === roomId,
  )
  if (!room) {
    return document
  }
  const text = name.trim() || DEFAULT_ROOM_NAME
  if (room.labelId) {
    return {
      ...document,
      labels: document.labels.map((l) =>
        l.id === room.labelId ? { ...l, text } : l,
      ),
    }
  }
  const at = pointInPolygon(room.centroid, room.polygon)
    ? room.centroid
    : (room.polygon[0] ?? room.centroid)
  return {
    ...document,
    labels: [
      ...document.labels,
      {
        id: newLabelId,
        text,
        x: Math.round(at.x),
        y: Math.round(at.y),
      },
    ],
  }
}
