import type { Camera, Size, WorldView } from '../canvas/camera'
import type { PlanDocument } from '../document/types'

/** Keeps tiny plans (one short wall, a single label) from rendering at absurd zoom. */
export const MIN_EXPORT_SPAN_MM = 2000

export function contentBoundsMm(plan: PlanDocument): WorldView | null {
  const points: Array<{ x: number; y: number; radiusMm: number }> = []

  for (const wall of plan.walls) {
    const half = wall.thicknessMm / 2
    points.push({ ...wall.a, radiusMm: half }, { ...wall.b, radiusMm: half })
  }
  for (const item of plan.items) {
    const radiusMm = Math.hypot(item.widthMm, item.heightMm) / 2
    points.push({ x: item.x, y: item.y, radiusMm })
  }
  for (const label of plan.labels) {
    points.push({ x: label.x, y: label.y, radiusMm: 0 })
  }

  const first = points[0]
  if (!first) {
    return null
  }
  const bounds: WorldView = {
    minX: first.x - first.radiusMm,
    maxX: first.x + first.radiusMm,
    minY: first.y - first.radiusMm,
    maxY: first.y + first.radiusMm,
  }
  for (const point of points) {
    bounds.minX = Math.min(bounds.minX, point.x - point.radiusMm)
    bounds.maxX = Math.max(bounds.maxX, point.x + point.radiusMm)
    bounds.minY = Math.min(bounds.minY, point.y - point.radiusMm)
    bounds.maxY = Math.max(bounds.maxY, point.y + point.radiusMm)
  }
  return bounds
}

/** Bounds to export: the content, or a default square around the origin when empty. */
export function exportBoundsMm(plan: PlanDocument): WorldView {
  const content = contentBoundsMm(plan) ?? {
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
  }
  const centerX = (content.minX + content.maxX) / 2
  const centerY = (content.minY + content.maxY) / 2
  const half = Math.max(
    MIN_EXPORT_SPAN_MM / 2,
    (content.maxX - content.minX) / 2,
    (content.maxY - content.minY) / 2,
  )
  return {
    minX: centerX - half,
    maxX: centerX + half,
    minY: centerY - half,
    maxY: centerY + half,
  }
}

/** Pixel size whose longest side is `longestPx`, padding included. */
export function exportSizeFor(
  bounds: WorldView,
  longestPx: number,
  paddingPx: number,
): Size {
  const widthMm = bounds.maxX - bounds.minX
  const heightMm = bounds.maxY - bounds.minY
  const scale = (longestPx - paddingPx * 2) / Math.max(widthMm, heightMm)
  return {
    width: Math.ceil(widthMm * scale + paddingPx * 2),
    height: Math.ceil(heightMm * scale + paddingPx * 2),
  }
}

/** Camera that centers `bounds` in `size` with the largest scale that still fits. */
export function fitCameraToBounds(
  bounds: WorldView,
  size: Size,
  paddingPx: number,
): Camera {
  const widthMm = bounds.maxX - bounds.minX
  const heightMm = bounds.maxY - bounds.minY
  const scale = Math.min(
    (size.width - paddingPx * 2) / widthMm,
    (size.height - paddingPx * 2) / heightMm,
  )
  return {
    scale,
    x: size.width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale,
    y: size.height / 2 - ((bounds.minY + bounds.maxY) / 2) * scale,
  }
}
