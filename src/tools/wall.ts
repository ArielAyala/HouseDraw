import type { PlanDocument, PointMm, Wall } from '../document/types'
import { distanceMm, pointAtDistanceMm, roundPointMm } from './geometry'
import { isLengthBufferKey, parseLengthInput } from './length'
import { type SnapInput, snapPoint } from './snap'

export const MIN_WALL_LENGTH_MM = 1

export type WallSession = {
  start: PointMm | null
  /** Last snapped pointer position (not the typed-length end). */
  cursor: PointMm | null
  selectedWallId: string | null
  typed: string
}

export type PointerContext = Omit<SnapInput, 'start'>

export type WallCommit = {
  a: PointMm
  b: PointMm
}

export function createWallSession(): WallSession {
  return {
    start: null,
    cursor: null,
    selectedWallId: null,
    typed: '',
  }
}

export function createWallEntity(
  id: string,
  a: PointMm,
  b: PointMm,
  thicknessMm: number,
): Wall {
  return {
    id,
    a: roundPointMm(a),
    b: roundPointMm(b),
    thicknessMm,
  }
}

export function addWallToDocument(
  document: PlanDocument,
  wall: Wall,
): PlanDocument {
  return { ...document, walls: [...document.walls, wall] }
}

export function effectiveEnd(
  start: PointMm,
  snapped: PointMm,
  typed: string,
): PointMm {
  const mm = parseLengthInput(typed)
  if (mm === null) {
    return snapped
  }
  return pointAtDistanceMm(start, snapped, mm)
}

export function wallPreview(session: WallSession): PointMm | null {
  if (!session.cursor) {
    return null
  }
  if (!session.start) {
    return session.cursor
  }
  return effectiveEnd(session.start, session.cursor, session.typed)
}

export function handleWallMove(
  session: WallSession,
  ctx: PointerContext,
): WallSession {
  const snapped = snapPoint({ ...ctx, start: session.start })
  return { ...session, cursor: snapped.point }
}

export function handleWallClick(
  session: WallSession,
  ctx: PointerContext,
  hitWallId: string | null,
): { session: WallSession; commit: WallCommit | null } {
  const snapped = snapPoint({ ...ctx, start: session.start })

  if (session.start === null) {
    if (snapped.kind !== 'endpoint' && hitWallId) {
      return {
        session: {
          start: null,
          cursor: snapped.point,
          selectedWallId: hitWallId,
          typed: '',
        },
        commit: null,
      }
    }
    return {
      session: {
        start: snapped.point,
        cursor: snapped.point,
        selectedWallId: null,
        typed: '',
      },
      commit: null,
    }
  }

  const end = effectiveEnd(session.start, snapped.point, session.typed)
  if (distanceMm(session.start, end) < MIN_WALL_LENGTH_MM) {
    return { session: { ...session, cursor: snapped.point }, commit: null }
  }
  return {
    session: {
      start: null,
      cursor: snapped.point,
      selectedWallId: null,
      typed: '',
    },
    commit: { a: session.start, b: end },
  }
}

export function cancelWallDraft(session: WallSession): WallSession {
  return { ...session, start: null, typed: '' }
}

export type WallKeyResult = {
  session: WallSession
  commit: WallCommit | null
  handled: boolean
}

export function handleWallKey(
  session: WallSession,
  key: string,
): WallKeyResult {
  if (key === 'Escape') {
    if (session.typed) {
      return {
        session: { ...session, typed: '' },
        commit: null,
        handled: true,
      }
    }
    if (session.start) {
      return {
        session: { ...session, start: null, typed: '' },
        commit: null,
        handled: true,
      }
    }
    if (session.selectedWallId) {
      return {
        session: { ...session, selectedWallId: null },
        commit: null,
        handled: true,
      }
    }
    return { session, commit: null, handled: false }
  }

  if (!session.start) {
    return { session, commit: null, handled: false }
  }

  if (key === 'Enter') {
    const toward = session.cursor ?? session.start
    const end = effectiveEnd(session.start, toward, session.typed)
    if (
      parseLengthInput(session.typed) === null ||
      distanceMm(session.start, end) < MIN_WALL_LENGTH_MM
    ) {
      return { session, commit: null, handled: true }
    }
    return {
      session: {
        start: null,
        cursor: toward,
        selectedWallId: null,
        typed: '',
      },
      commit: { a: session.start, b: end },
      handled: true,
    }
  }

  if (key === 'Backspace') {
    if (!session.typed) {
      return { session, commit: null, handled: false }
    }
    return {
      session: { ...session, typed: session.typed.slice(0, -1) },
      commit: null,
      handled: true,
    }
  }

  if (isLengthBufferKey(key)) {
    return {
      session: { ...session, typed: session.typed + key },
      commit: null,
      handled: true,
    }
  }

  return { session, commit: null, handled: false }
}
