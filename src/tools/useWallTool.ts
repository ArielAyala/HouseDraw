import { useCallback, useEffect, useRef, useState } from 'react'
import { HIT_PADDING_PX, hitTestWall } from '../canvas/hitTest'
import { historyHotkey, isTypingTarget } from '../document/hotkeys'
import { useDocumentStore } from '../document/store'
import { deleteWallsById } from './edit'
import { useEditorStore } from './editor'
import type { ToolPointer } from './pointer'
import { SNAP_RADIUS_PX } from './snap'
import {
  addWallToDocument,
  cancelWallDraft,
  createWallEntity,
  createWallSession,
  handleWallClick,
  handleWallKey,
  handleWallMove,
  type PointerContext,
  type WallCommit,
  type WallSession,
} from './wall'

export function useWallTool(active: boolean) {
  const apply = useDocumentStore((state) => state.apply)
  const selectWall = useEditorStore((state) => state.selectWall)
  const clearSelection = useEditorStore((state) => state.clearSelection)
  const [session, setSession] = useState<WallSession>(createWallSession)
  const sessionRef = useRef(session)
  const lastCtxRef = useRef<PointerContext | null>(null)
  sessionRef.current = session

  const commitWall = useCallback(
    (commit: WallCommit, next: WallSession) => {
      const id = crypto.randomUUID()
      apply((document) =>
        addWallToDocument(
          document,
          createWallEntity(
            id,
            commit.a,
            commit.b,
            document.settings.wallThicknessMm,
          ),
        ),
      )
      setSession(next)
      selectWall(id)
    },
    [apply, selectWall],
  )

  const pointerContext = useCallback((pointer: ToolPointer): PointerContext => {
    const document = useDocumentStore.getState().document
    return {
      raw: pointer.world,
      walls: document.walls,
      gridMm: document.settings.gridMm,
      radiusMm: SNAP_RADIUS_PX / pointer.scale,
      ortho: !pointer.shiftKey,
    }
  }, [])

  const onMove = useCallback(
    (pointer: ToolPointer) => {
      const ctx = pointerContext(pointer)
      lastCtxRef.current = ctx
      setSession((current) => handleWallMove(current, ctx))
    },
    [pointerContext],
  )

  const onClick = useCallback(
    (pointer: ToolPointer) => {
      const ctx = pointerContext(pointer)
      lastCtxRef.current = ctx
      const extraMm = HIT_PADDING_PX / pointer.scale
      const hit = hitTestWall(pointer.world, ctx.walls, extraMm)
      const {
        session: next,
        commit,
        selectId,
      } = handleWallClick(sessionRef.current, ctx, hit?.id ?? null)
      if (commit) {
        commitWall(commit, next)
        return
      }
      setSession(next)
      if (selectId) {
        selectWall(selectId)
      } else {
        clearSelection()
      }
    },
    [clearSelection, commitWall, pointerContext, selectWall],
  )

  const onCancel = useCallback(() => {
    setSession((current) => cancelWallDraft(current))
  }, [])

  useEffect(() => {
    if (!active) {
      setSession(createWallSession())
      lastCtxRef.current = null
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || historyHotkey(event)) {
        return
      }
      if (event.key === 'Shift') {
        const last = lastCtxRef.current
        if (last) {
          const ctx = { ...last, ortho: false }
          lastCtxRef.current = ctx
          setSession((current) => handleWallMove(current, ctx))
        }
        return
      }
      const {
        session: next,
        commit,
        handled,
      } = handleWallKey(sessionRef.current, event.key)
      if (handled) {
        event.preventDefault()
        if (commit) {
          commitWall(commit, next)
          return
        }
        setSession(next)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        clearSelection()
        return
      }
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return
      }
      const ids = useEditorStore.getState().selectedWallIds
      if (ids.length === 0) {
        return
      }
      event.preventDefault()
      apply((document) => deleteWallsById(document, ids))
      clearSelection()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== 'Shift') {
        return
      }
      const last = lastCtxRef.current
      if (!last) {
        return
      }
      const ctx = { ...last, ortho: true }
      lastCtxRef.current = ctx
      setSession((current) => handleWallMove(current, ctx))
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [active, apply, clearSelection, commitWall])

  return { session, onMove, onClick, onCancel }
}
