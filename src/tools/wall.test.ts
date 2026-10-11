import { describe, expect, it } from 'vitest'
import type { Wall } from '../document/types'
import { distanceMm } from './geometry'
import {
  createWallEntity,
  createWallSession,
  handleWallClick,
  handleWallKey,
  handleWallMove,
  type PointerContext,
} from './wall'

function ctx(
  raw: { x: number; y: number },
  extra: Partial<PointerContext> = {},
): PointerContext {
  return {
    raw,
    walls: extra.walls ?? [],
    gridMm: extra.gridMm ?? 100,
    radiusMm: extra.radiusMm ?? 50,
    ortho: extra.ortho ?? true,
  }
}

function sampleWall(): Wall {
  return {
    id: 'existing',
    a: { x: 0, y: 2000 },
    b: { x: 3000, y: 2000 },
    thicknessMm: 150,
  }
}

describe('wall tool', () => {
  it('stores a 4 m horizontal wall with a/b 4000 mm apart', () => {
    const idle = createWallSession()
    const { session: started } = handleWallClick(
      idle,
      ctx({ x: 12, y: -8 }),
      null,
    )
    expect(started.start).toEqual({ x: 0, y: 0 })

    const { session: done, commit } = handleWallClick(
      started,
      ctx({ x: 4000, y: 30 }),
      null,
    )
    expect(commit).not.toBeNull()
    if (!commit) {
      return
    }
    expect(commit.a).toEqual({ x: 0, y: 0 })
    expect(commit.b).toEqual({ x: 4000, y: 0 })
    expect(distanceMm(commit.a, commit.b)).toBe(4000)
    expect(done.start).toBeNull()

    const wall = createWallEntity('wall-1', commit.a, commit.b, 150)
    expect(wall.thicknessMm).toBe(150)
    expect(wall.b.x - wall.a.x).toBe(4000)
    expect(wall.a.y).toBe(wall.b.y)
  })

  it('commits a typed 4 m length along the current direction', () => {
    let session = createWallSession()
    session = handleWallClick(session, ctx({ x: 0, y: 0 }), null).session
    session = handleWallMove(session, ctx({ x: 1200, y: 40 }))
    expect(session.cursor).toEqual({ x: 1200, y: 0 })

    for (const key of ['4', 'm']) {
      const result = handleWallKey(session, key)
      session = result.session
    }
    const result = handleWallKey(session, 'Enter')
    expect(result.commit).not.toBeNull()
    if (!result.commit) {
      return
    }
    expect(result.commit.a).toEqual({ x: 0, y: 0 })
    expect(result.commit.b).toEqual({ x: 4000, y: 0 })
    expect(distanceMm(result.commit.a, result.commit.b)).toBe(4000)
  })

  it('does not commit a zero-length segment', () => {
    const started = handleWallClick(
      createWallSession(),
      ctx({ x: 0, y: 0 }),
      null,
    ).session
    const { commit } = handleWallClick(started, ctx({ x: 20, y: 10 }), null)
    expect(commit).toBeNull()
  })

  it('selects an existing wall on click when not drafting', () => {
    const walls = [sampleWall()]
    const { session, commit } = handleWallClick(
      createWallSession(),
      ctx({ x: 1500, y: 2000 }, { walls }),
      'existing',
    )
    expect(commit).toBeNull()
    expect(session.start).toBeNull()
    expect(session.selectedWallId).toBe('existing')
  })

  it('starts from an endpoint instead of selecting that wall', () => {
    const walls = [sampleWall()]
    const { session } = handleWallClick(
      createWallSession(),
      ctx({ x: 10, y: 2010 }, { walls, radiusMm: 80 }),
      'existing',
    )
    expect(session.start).toEqual({ x: 0, y: 2000 })
    expect(session.selectedWallId).toBeNull()
  })

  it('cancels an in-progress wall on Escape', () => {
    const started = handleWallClick(
      createWallSession(),
      ctx({ x: 0, y: 0 }),
      null,
    ).session
    const result = handleWallKey(started, 'Escape')
    expect(result.handled).toBe(true)
    expect(result.session.start).toBeNull()
    expect(result.commit).toBeNull()
  })
})
