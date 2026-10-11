import { useCallback, useEffect, useRef, useState } from 'react'
import { HIT_PADDING_PX, hitTestWall } from '../canvas/hitTest'
import { historyHotkey, isTypingTarget } from '../document/hotkeys'
import { useDocumentStore } from '../document/store'
import type { PointMm } from '../document/types'
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

export type WallPointer = {
  world: PointMm
  shiftKey: boolean
  scale: number
}

export function useWallTool() {
  const apply = useDocumentStore((state) => state.apply)
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
      setSession({ ...next, selectedWallId: id })
    },
    [apply],
  )

  const pointerContext = useCallback((pointer: WallPointer): PointerContext => {
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
    (pointer: WallPointer) => {
      const ctx = pointerContext(pointer)
      lastCtxRef.current = ctx
      setSession((current) => handleWallMove(current, ctx))
    },
    [pointerContext],
  )

  const onClick = useCallback(
    (pointer: WallPointer) => {
      const ctx = pointerContext(pointer)
      lastCtxRef.current = ctx
      const extraMm = HIT_PADDING_PX / pointer.scale
      const hit = hitTestWall(pointer.world, ctx.walls, extraMm)
      const { session: next, commit } = handleWallClick(
        sessionRef.current,
        ctx,
        hit?.id ?? null,
      )
      if (commit) {
        commitWall(commit, next)
        return
      }
      setSession(next)
    },
    [commitWall, pointerContext],
  )

  const onCancel = useCallback(() => {
    setSession((current) => cancelWallDraft(current))
  }, [])

  useEffect(() => {
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
      if (!handled) {
        return
      }
      event.preventDefault()
      if (commit) {
        commitWall(commit, next)
        return
      }
      setSession(next)
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
  }, [commitWall])

  return { session, onMove, onClick, onCancel }
}
