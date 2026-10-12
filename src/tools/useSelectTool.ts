import { useCallback, useEffect, useRef, useState } from 'react'
import { HIT_PADDING_PX, hitTestWall } from '../canvas/hitTest'
import { historyHotkey, isTypingTarget } from '../document/hotkeys'
import { useDocumentStore } from '../document/store'
import type { PlanDocument } from '../document/types'
import { deleteWallsById, isZeroDelta, moveWallsById } from './edit'
import { useEditorStore } from './editor'
import type { ToolPointer } from './pointer'
import {
  beginDrag,
  beginMarquee,
  createSelectSession,
  type DragState,
  marqueeSelection,
  type SelectSession,
  snapMoveDelta,
  updateMarquee,
  wallEndpoints,
} from './select'
import { SNAP_RADIUS_PX } from './snap'

const MARQUEE_MIN_PX = 4

export function useSelectTool(active: boolean) {
  const apply = useDocumentStore((state) => state.apply)
  const selectedWallIds = useEditorStore((state) => state.selectedWallIds)
  const setSelectedWallIds = useEditorStore((state) => state.setSelectedWallIds)
  const selectWall = useEditorStore((state) => state.selectWall)
  const toggleWall = useEditorStore((state) => state.toggleWall)
  const clearSelection = useEditorStore((state) => state.clearSelection)
  const [session, setSession] = useState<SelectSession>(createSelectSession)
  const sessionRef = useRef(session)
  const selectedRef = useRef(selectedWallIds)
  const downScreenRef = useRef<ToolPointer['screen'] | null>(null)
  sessionRef.current = session
  selectedRef.current = selectedWallIds

  const onPointerDown = useCallback(
    (pointer: ToolPointer) => {
      const document = useDocumentStore.getState().document
      const extraMm = HIT_PADDING_PX / pointer.scale
      const hit = hitTestWall(pointer.world, document.walls, extraMm)
      downScreenRef.current = pointer.screen

      if (hit) {
        let ids = selectedRef.current
        if (pointer.shiftKey) {
          toggleWall(hit.id)
          ids = ids.includes(hit.id)
            ? ids.filter((id) => id !== hit.id)
            : [...ids, hit.id]
        } else if (!ids.includes(hit.id)) {
          selectWall(hit.id)
          ids = [hit.id]
        }
        if (ids.length === 0) {
          setSession(createSelectSession())
          return
        }
        setSession({
          marquee: null,
          drag: beginDrag(ids, pointer.world, document.walls),
        })
        return
      }

      if (!pointer.shiftKey) {
        clearSelection()
      }
      setSession({
        marquee: beginMarquee(pointer.world),
        drag: null,
      })
    },
    [clearSelection, selectWall, toggleWall],
  )

  const onPointerMove = useCallback((pointer: ToolPointer) => {
    const current = sessionRef.current
    if (current.drag) {
      const document = useDocumentStore.getState().document
      const moving = new Set(current.drag.wallIds)
      const delta = snapMoveDelta({
        origin: current.drag.origin,
        raw: pointer.world,
        movingEndpoints: wallEndpoints(current.drag.originals),
        staticEndpoints: wallEndpoints(
          document.walls.filter((wall) => !moving.has(wall.id)),
        ),
        gridMm: document.settings.gridMm,
        radiusMm: SNAP_RADIUS_PX / pointer.scale,
      })
      setSession({
        marquee: null,
        drag: { ...current.drag, delta },
      })
      return
    }
    if (current.marquee) {
      setSession({
        marquee: updateMarquee(current.marquee, pointer.world),
        drag: null,
      })
    }
  }, [])

  const onPointerUp = useCallback(
    (pointer: ToolPointer) => {
      const current = sessionRef.current
      const down = downScreenRef.current
      downScreenRef.current = null
      if (current.drag) {
        commitDrag(current.drag, apply)
        setSession(createSelectSession())
        return
      }
      if (!current.marquee) {
        return
      }
      const pixelDelta = down
        ? Math.hypot(pointer.screen.x - down.x, pointer.screen.y - down.y)
        : 0
      if (pixelDelta >= MARQUEE_MIN_PX) {
        const ids = marqueeSelection(
          useDocumentStore.getState().document.walls,
          current.marquee,
        )
        if (pointer.shiftKey) {
          setSelectedWallIds([...selectedRef.current, ...ids])
        } else {
          setSelectedWallIds(ids)
        }
      }
      setSession(createSelectSession())
    },
    [apply, setSelectedWallIds],
  )

  const onCancel = useCallback(() => {
    downScreenRef.current = null
    if (sessionRef.current.drag || sessionRef.current.marquee) {
      setSession(createSelectSession())
      return
    }
    clearSelection()
  }, [clearSelection])

  useEffect(() => {
    if (!active) {
      setSession(createSelectSession())
      downScreenRef.current = null
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || historyHotkey(event)) {
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return
      }
      if (sessionRef.current.drag || sessionRef.current.marquee) {
        return
      }
      const ids = selectedRef.current
      if (ids.length === 0) {
        return
      }
      event.preventDefault()
      apply((document) => deleteWallsById(document, ids))
      clearSelection()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, apply, clearSelection, onCancel])

  return { session, onPointerDown, onPointerMove, onPointerUp, onCancel }
}

function commitDrag(
  drag: DragState,
  apply: (mutate: (document: PlanDocument) => PlanDocument) => void,
): void {
  if (isZeroDelta(drag.delta)) {
    return
  }
  apply((document) => moveWallsById(document, drag.wallIds, drag.delta))
}
