import type { PlanDocument, PointMm } from '../document/types'
import { type Camera, type Size, visibleWorld, worldToScreen } from './camera'
import { gridLines, isMajorLine, planGrid } from './grid'
import { formatDimensionMm } from './units'

export type CanvasColors = {
  background: string
  minor: string
  major: string
  origin: string
  wall: string
  wallSelected: string
  wallDraft: string
  labelFill: string
  labelText: string
}

export type PlanOverlay = {
  selectedWallId: string | null
  draft: { a: PointMm; b: PointMm; thicknessMm: number } | null
}

export function renderPlan(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  size: Size,
  colors: CanvasColors,
  plan: PlanDocument,
  overlay: PlanOverlay = { selectedWallId: null, draft: null },
): void {
  ctx.save()
  ctx.clearRect(0, 0, size.width, size.height)
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, size.width, size.height)

  const view = visibleWorld(camera, size)
  const grid = planGrid(camera.scale)

  if (grid.minorMm !== null && grid.minorAlpha > 0) {
    strokeGrid(
      ctx,
      camera,
      view,
      size,
      grid.minorMm,
      colors.minor,
      grid.minorAlpha,
      grid.majorMm,
    )
  }

  strokeGrid(ctx, camera, view, size, grid.majorMm, colors.major, 1, null)
  strokeOrigin(ctx, camera, size, colors.origin)

  for (const wall of plan.walls) {
    if (wall.id === overlay.selectedWallId) {
      continue
    }
    strokeWall(ctx, camera, wall, colors.wall)
  }

  const selected = plan.walls.find((wall) => wall.id === overlay.selectedWallId)
  if (selected) {
    strokeWall(ctx, camera, selected, colors.wallSelected)
  }

  if (overlay.draft && segmentLengthMm(overlay.draft.a, overlay.draft.b) >= 1) {
    strokeWall(ctx, camera, overlay.draft, colors.wallDraft)
    drawLengthLabel(
      ctx,
      camera,
      overlay.draft.a,
      overlay.draft.b,
      overlay.draft.thicknessMm,
      colors,
    )
  } else if (selected) {
    drawLengthLabel(
      ctx,
      camera,
      selected.a,
      selected.b,
      selected.thicknessMm,
      colors,
    )
  }

  if (overlay.draft) {
    drawDraftHandle(ctx, camera, overlay.draft.a, colors.wallDraft)
  }

  ctx.restore()
}

function strokeGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  view: ReturnType<typeof visibleWorld>,
  size: Size,
  stepMm: number,
  color: string,
  alpha: number,
  skipMajorMm: number | null,
): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()

  for (const x of gridLines(view.minX, view.maxX, stepMm)) {
    if (skipMajorMm !== null && isMajorLine(x, skipMajorMm)) {
      continue
    }
    const sx = Math.round(worldToScreen(camera, { x, y: 0 }).x) + 0.5
    ctx.moveTo(sx, 0)
    ctx.lineTo(sx, size.height)
  }

  for (const y of gridLines(view.minY, view.maxY, stepMm)) {
    if (skipMajorMm !== null && isMajorLine(y, skipMajorMm)) {
      continue
    }
    const sy = Math.round(worldToScreen(camera, { x: 0, y }).y) + 0.5
    ctx.moveTo(0, sy)
    ctx.lineTo(size.width, sy)
  }

  ctx.stroke()
  ctx.restore()
}

function strokeOrigin(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  size: Size,
  color: string,
): void {
  const origin = worldToScreen(camera, { x: 0, y: 0 })
  const sx = Math.round(origin.x) + 0.5
  const sy = Math.round(origin.y) + 0.5

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(sx, 0)
  ctx.lineTo(sx, size.height)
  ctx.moveTo(0, sy)
  ctx.lineTo(size.width, sy)
  ctx.stroke()
  ctx.restore()
}

function strokeWall(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  wall: { a: PointMm; b: PointMm; thicknessMm: number },
  color: string,
): void {
  const a = worldToScreen(camera, wall.a)
  const b = worldToScreen(camera, wall.b)
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineCap = 'butt'
  ctx.lineWidth = Math.max(2, wall.thicknessMm * camera.scale)
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.restore()
}

function drawDraftHandle(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  point: PointMm,
  color: string,
): void {
  const screen = worldToScreen(camera, point)
  const x = Math.round(screen.x)
  const y = Math.round(screen.y)
  ctx.save()
  ctx.fillStyle = color
  ctx.fillRect(x - 3, y - 3, 6, 6)
  ctx.restore()
}

function drawLengthLabel(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  a: PointMm,
  b: PointMm,
  thicknessMm: number,
  colors: CanvasColors,
): void {
  const length = segmentLengthMm(a, b)
  if (length < 1) {
    return
  }
  const sa = worldToScreen(camera, a)
  const sb = worldToScreen(camera, b)
  const dx = sb.x - sa.x
  const dy = sb.y - sa.y
  const len = Math.hypot(dx, dy) || 1
  let angle = Math.atan2(dy, dx)
  if (angle > Math.PI / 2) {
    angle -= Math.PI
  } else if (angle < -Math.PI / 2) {
    angle += Math.PI
  }
  const nx = -dy / len
  const ny = dx / len
  const offset = (thicknessMm * camera.scale) / 2 + 14
  const x = (sa.x + sb.x) / 2 + nx * offset
  const y = (sa.y + sb.y) / 2 + ny * offset
  const text = formatDimensionMm(length)

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.font = '11px system-ui, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const width = ctx.measureText(text).width
  const padX = 6
  const h = 16
  const w = width + padX * 2
  ctx.fillStyle = colors.labelFill
  roundRect(ctx, -w / 2, -h / 2, w, h, 4)
  ctx.fill()
  ctx.fillStyle = colors.labelText
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function segmentLengthMm(a: PointMm, b: PointMm): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}
