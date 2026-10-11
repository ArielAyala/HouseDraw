export type Point = {
  x: number
  y: number
}

export type Size = {
  width: number
  height: number
}

export type Camera = {
  /** Screen X of world origin (0 mm), in CSS pixels. */
  x: number
  /** Screen Y of world origin (0 mm), in CSS pixels. */
  y: number
  /** CSS pixels per millimeter. */
  scale: number
}

export type WorldView = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** 1 m ≈ 80 CSS pixels at 100% zoom. */
export const DEFAULT_SCALE = 0.08
export const MIN_SCALE = 0.004
export const MAX_SCALE = 2

export function createCamera(view: Size): Camera {
  return {
    x: view.width / 2,
    y: view.height / 2,
    scale: DEFAULT_SCALE,
  }
}

export function worldToScreen(camera: Camera, world: Point): Point {
  return {
    x: world.x * camera.scale + camera.x,
    y: world.y * camera.scale + camera.y,
  }
}

export function screenToWorld(camera: Camera, screen: Point): Point {
  return {
    x: (screen.x - camera.x) / camera.scale,
    y: (screen.y - camera.y) / camera.scale,
  }
}

export function panCamera(camera: Camera, dx: number, dy: number): Camera {
  return { ...camera, x: camera.x + dx, y: camera.y + dy }
}

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

export function zoomCameraAt(
  camera: Camera,
  screenPoint: Point,
  factor: number,
): Camera {
  const world = screenToWorld(camera, screenPoint)
  const scale = clampScale(camera.scale * factor)
  if (scale === camera.scale) {
    return camera
  }
  return {
    scale,
    x: screenPoint.x - world.x * scale,
    y: screenPoint.y - world.y * scale,
  }
}

export function zoomPercent(camera: Camera): number {
  return (camera.scale / DEFAULT_SCALE) * 100
}

export function visibleWorld(camera: Camera, size: Size): WorldView {
  const a = screenToWorld(camera, { x: 0, y: 0 })
  const b = screenToWorld(camera, { x: size.width, y: size.height })
  return {
    minX: Math.min(a.x, b.x),
    maxX: Math.max(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxY: Math.max(a.y, b.y),
  }
}

export function recenterOnResize(
  camera: Camera,
  prev: Size,
  next: Size,
): Camera {
  if (prev.width <= 0 || prev.height <= 0) {
    return createCamera(next)
  }
  const worldCenter = screenToWorld(camera, {
    x: prev.width / 2,
    y: prev.height / 2,
  })
  return {
    ...camera,
    x: next.width / 2 - worldCenter.x * camera.scale,
    y: next.height / 2 - worldCenter.y * camera.scale,
  }
}

export function wheelZoomFactor(deltaY: number, deltaMode: number): number {
  const pixels = deltaMode === 1 ? deltaY * 16 : deltaY
  return Math.exp(-pixels * 0.0015)
}
