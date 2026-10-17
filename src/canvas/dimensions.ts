import type { Room } from '../document/rooms'

export type DimensionVisibility = {
  showAll: boolean
  wallIds: readonly string[]
  roomIds: readonly string[]
}

export const NO_DIMENSIONS: DimensionVisibility = {
  showAll: false,
  wallIds: [],
  roomIds: [],
}

/**
 * Walls whose length label is shown. A wall is shown when the global toggle is
 * on, when it was marked directly, or when it bounds a room that was marked.
 */
export function visibleDimensionWallIds(
  walls: readonly { id: string }[],
  rooms: readonly Room[],
  visibility: DimensionVisibility,
): Set<string> {
  if (visibility.showAll) {
    return new Set(walls.map((wall) => wall.id))
  }
  const ids = new Set(visibility.wallIds)
  const roomIds = new Set(visibility.roomIds)
  for (const room of rooms) {
    if (roomIds.has(room.id)) {
      for (const wallId of room.wallIds) {
        ids.add(wallId)
      }
    }
  }
  return ids
}
