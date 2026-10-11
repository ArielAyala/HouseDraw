import { describe, expect, it } from 'vitest'
import {
  clampScale,
  createCamera,
  DEFAULT_SCALE,
  MAX_SCALE,
  MIN_SCALE,
  panCamera,
  recenterOnResize,
  screenToWorld,
  wheelZoomFactor,
  worldToScreen,
  zoomCameraAt,
  zoomPercent,
} from './camera'

describe('camera', () => {
  it('places the world origin at the view center', () => {
    const camera = createCamera({ width: 800, height: 600 })
    const screen = worldToScreen(camera, { x: 0, y: 0 })
    expect(screen.x).toBe(400)
    expect(screen.y).toBe(300)
  })

  it('round-trips screen and world coordinates', () => {
    const camera = createCamera({ width: 1000, height: 800 })
    const world = { x: 3500, y: -1200 }
    const screen = worldToScreen(camera, world)
    const back = screenToWorld(camera, screen)
    expect(back.x).toBeCloseTo(world.x)
    expect(back.y).toBeCloseTo(world.y)
  })

  it('keeps the world point under the cursor when zooming', () => {
    const camera = createCamera({ width: 1000, height: 800 })
    const cursor = worldToScreen(camera, { x: 1000, y: 1000 })
    const before = screenToWorld(camera, cursor)
    const zoomed = zoomCameraAt(camera, cursor, 1.4)
    const after = screenToWorld(zoomed, cursor)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
    expect(zoomed.scale).toBeGreaterThan(camera.scale)
  })

  it('pans in screen space without changing scale', () => {
    const camera = createCamera({ width: 400, height: 400 })
    const panned = panCamera(camera, 40, -15)
    expect(panned.scale).toBe(camera.scale)
    expect(panned.x).toBe(camera.x + 40)
    expect(panned.y).toBe(camera.y - 15)
  })

  it('clamps zoom to the allowed range', () => {
    expect(clampScale(0)).toBe(MIN_SCALE)
    expect(clampScale(99)).toBe(MAX_SCALE)
    const camera = createCamera({ width: 200, height: 200 })
    const minZoom = zoomCameraAt(camera, { x: 100, y: 100 }, 0.0001)
    const maxZoom = zoomCameraAt(camera, { x: 100, y: 100 }, 10_000)
    expect(minZoom.scale).toBe(MIN_SCALE)
    expect(maxZoom.scale).toBe(MAX_SCALE)
  })

  it('reports 100% at the default scale', () => {
    expect(zoomPercent({ x: 0, y: 0, scale: DEFAULT_SCALE })).toBe(100)
  })

  it('keeps the world center stable across resize', () => {
    const camera = createCamera({ width: 400, height: 300 })
    const panned = panCamera(camera, 80, 40)
    const center = screenToWorld(panned, { x: 200, y: 150 })
    const resized = recenterOnResize(
      panned,
      { width: 400, height: 300 },
      { width: 800, height: 600 },
    )
    const newCenter = screenToWorld(resized, { x: 400, y: 300 })
    expect(newCenter.x).toBeCloseTo(center.x)
    expect(newCenter.y).toBeCloseTo(center.y)
  })

  it('zooms out for positive wheel delta', () => {
    expect(wheelZoomFactor(100, 0)).toBeLessThan(1)
    expect(wheelZoomFactor(-100, 0)).toBeGreaterThan(1)
  })
})
