import { useCallback, useEffect, useRef, useState } from 'react'
import { historyHotkey, isTypingTarget } from '../document/hotkeys'
import { useDocumentStore } from '../document/store'
import type { PointMm } from '../document/types'
import type { ToolPointer } from './pointer'
import {
  addRoomToDocument,
  createRoomSession,
  createRoomWalls,
  isValidRoomRect,
  type RoomSession,
} from './room'
import { SNAP_RADIUS_PX, snapPoint } from './snap'

/** Minimum drag (screen px) for a press-drag-release to commit a room. */
const DRAG_COMMIT_PX = 6

export function useRoomTool(active: boolean) {
  const apply = useDocumentStore((state) => state.apply)
  const [session, setSession] = useState<RoomSession>(createRoomSession)
  const sessionRef = useRef(session)
  const downScreenRef = useRef<PointMm | null>(null)
  sessionRef.current = session

  const snap = useCallback((pointer: ToolPointer): PointMm => {
    const document = useDocumentStore.getState().document
    return snapPoint({
      raw: pointer.world,
      start: null,
      walls: document.walls,
      gridMm: document.settings.gridMm,
      radiusMm: SNAP_RADIUS_PX / pointer.scale,
      ortho: false,
    }).point
  }, [])

  const commit = useCallback(
    (a: PointMm, b: PointMm) => {
      if (!isValidRoomRect(a, b)) {
        return false
      }
      const ids = [0, 1, 2, 3].map(() => crypto.randomUUID())
      const labelId = crypto.randomUUID()
      apply((document) =>
        addRoomToDocument(
          document,
          createRoomWalls(ids, a, b, document.settings.wallThicknessMm),
          labelId,
          a,
          b,
        ),
      )
      return true
    },
    [apply],
  )

  const onMove = useCallback(
    (pointer: ToolPointer) => {
      const cursor = snap(pointer)
      setSession((current) => ({ ...current, cursor }))
    },
    [snap],
  )

  const onPointerDown = useCallback(
    (pointer: ToolPointer) => {
      const point = snap(pointer)
      const current = sessionRef.current
      if (current.start) {
        if (commit(current.start, point)) {
          setSession(createRoomSession())
        }
        return
      }
      downScreenRef.current = pointer.screen
      setSession({ start: point, cursor: point, pressing: true })
    },
    [commit, snap],
  )

  const onPointerUp = useCallback(
    (pointer: ToolPointer) => {
      const current = sessionRef.current
      const down = downScreenRef.current
      downScreenRef.current = null
      if (!current.start || !current.pressing) {
        return
      }
      const dragged =
        down !== null &&
        Math.hypot(pointer.screen.x - down.x, pointer.screen.y - down.y) >=
          DRAG_COMMIT_PX
      if (dragged && commit(current.start, snap(pointer))) {
        setSession(createRoomSession())
        return
      }
      // Treat as the first click of a two-click gesture.
      setSession({ ...current, pressing: false })
    },
    [commit, snap],
  )

  const onCancel = useCallback(() => {
    downScreenRef.current = null
    setSession(createRoomSession())
  }, [])

  useEffect(() => {
    if (!active) {
      downScreenRef.current = null
      setSession(createRoomSession())
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !isTypingTarget(event.target) &&
        !historyHotkey(event)
      ) {
        event.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, onCancel])

  return { session, onMove, onPointerDown, onPointerUp, onCancel }
}
