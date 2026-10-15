import type { Label, PlanDocument, PointMm, Wall } from './types'

export type Room = {
  /** Stable id derived from the walls that bound the room. */
  id: string
  /** User-defined name, or an empty string when the room is unnamed. */
  name: string
  polygon: PointMm[]
  wallIds: string[]
  areaMm2: number
  centroid: PointMm
  /** Label that stores the user-defined name, if any. */
  labelId: string | null
}

type PlanarSegment = {
  a: PointMm
  b: PointMm
  wallIds: string[]
}

type HalfEdge = {
  from: string
  to: string
  segment: number
  angle: number
}

/** Max distance (mm) for a wall endpoint to count as lying on another wall. */
const ON_WALL_TOLERANCE_MM = 0.5

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

export function formatAreaMm2(areaMm2: number, locale = 'en'): string {
  const value = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(areaMm2 / 1_000_000)
  return `${value} m²`
}

/**
 * Bounded faces of the planar graph formed by walls (joined at shared
 * endpoints). Area uses wall centerlines.
 */
/**
 * Returns the position of `p` along segment `a→b` in [0, 1] when `p` lies on
 * it (within tolerance), otherwise null.
 */
function projectOnSegment(p: PointMm, a: PointMm, b: PointMm): number | null {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSq = dx * dx + dy * dy
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq
  if (t < 0 || t > 1) {
    return null
  }
  const distance =
    Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / Math.sqrt(lengthSq)
  return distance <= ON_WALL_TOLERANCE_MM ? t : null
}

/**
 * Splits walls wherever another wall endpoint touches them (T-junctions) and
 * merges coincident pieces. Two rooms that share an edge then share one
 * planar edge instead of two overlapping walls, which would break face tracing.
 */
function planarSegments(walls: readonly Wall[]): PlanarSegment[] {
  const endpoints = new Map<string, PointMm>()
  for (const wall of walls) {
    if (wall.a.x === wall.b.x && wall.a.y === wall.b.y) {
      continue
    }
    endpoints.set(key(wall.a), wall.a)
    endpoints.set(key(wall.b), wall.b)
  }

  const merged = new Map<string, PlanarSegment>()
  for (const wall of walls) {
    if (wall.a.x === wall.b.x && wall.a.y === wall.b.y) {
      continue
    }
    const chain = [...endpoints.values()]
      .map((p) => ({ p, t: projectOnSegment(p, wall.a, wall.b) }))
      .filter((item): item is { p: PointMm; t: number } => item.t !== null)
      .sort((p, q) => p.t - q.t)
      .map((item) => item.p)

    for (let i = 0; i + 1 < chain.length; i++) {
      const a = chain[i]
      const b = chain[i + 1]
      if (!a || !b) {
        continue
      }
      const ka = key(a)
      const kb = key(b)
      const id = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
      const existing = merged.get(id)
      if (existing) {
        if (!existing.wallIds.includes(wall.id)) {
          existing.wallIds.push(wall.id)
        }
      } else {
        merged.set(id, { a, b, wallIds: [wall.id] })
      }
    }
  }
  return [...merged.values()]
}

export function detectRooms(
  walls: readonly Wall[],
  labels: readonly Label[] = [],
): Room[] {
  const segments = planarSegments(walls)
  const points = new Map<string, PointMm>()
  const outgoing = new Map<string, HalfEdge[]>()

  const addHalf = (from: PointMm, to: PointMm, segment: number) => {
    const edge: HalfEdge = {
      from: key(from),
      to: key(to),
      segment,
      angle: Math.atan2(to.y - from.y, to.x - from.x),
    }
    const list = outgoing.get(edge.from) ?? []
    list.push(edge)
    outgoing.set(edge.from, list)
  }

  segments.forEach((segment, index) => {
    points.set(key(segment.a), segment.a)
    points.set(key(segment.b), segment.b)
    addHalf(segment.a, segment.b, index)
    addHalf(segment.b, segment.a, index)
  })
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
          (e) => e.to === edge.from && e.segment === edge.segment,
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
      const wallIds = face.flatMap((e) => segments[e.segment]?.wallIds ?? [])
      rooms.push(buildRoom(polygon, wallIds, labels))
    }
  }

  return rooms
}

function buildRoom(
  polygon: PointMm[],
  wallIdsInFace: readonly string[],
  labels: readonly Label[],
): Room {
  const wallIds = [...new Set(wallIdsInFace)].sort()
  const centroid = polygonCentroid(polygon)
  const label = labels.find((l) => pointInPolygon(l, polygon))
  return {
    id: wallIds.join('+'),
    name: label?.text ?? '',
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
  const text = name.trim()
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
