import type { ItemDraft } from '../document/items'
import { openingSpan } from '../document/openings'
import {
  detectRooms,
  formatAreaMm2,
  pointInPolygon,
  type Room,
} from '../document/rooms'
import type { Opening, PlanDocument, PointMm, Wall } from '../document/types'
import type { OpeningDraft } from '../tools/opening'
import type { Marquee } from '../tools/select'
import { type Camera, type Size, visibleWorld, worldToScreen } from './camera'
import { gridLines, isMajorLine, planGrid } from './grid'
import { drawItem } from './itemRender'
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
  marqueeFill: string
  marqueeStroke: string
  roomFill: string
  item: string
  itemFill: string
}

export type RenderText = {
  locale: string
  defaultRoomName: string
}

export type PlanOverlay = {
  selectedWallIds: string[]
  draft: { a: PointMm; b: PointMm; thicknessMm: number } | null
  marquee: Marquee | null
  roomDraft?: { a: PointMm; b: PointMm } | null
  openingPreview?: OpeningDraft | null
  selectedItemIds?: string[]
  itemPreview?: ItemDraft | null
  hoverWallId?: string | null
  hoverItemId?: string | null
}

export function renderPlan(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  size: Size,
  colors: CanvasColors,
  plan: PlanDocument,
  copy: RenderText,
  overlay: PlanOverlay = { selectedWallIds: [], draft: null, marquee: null },
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

  const rooms = detectRooms(plan.walls, plan.labels)
  for (const room of rooms) {
    fillRoom(ctx, camera, room, colors)
  }

  const selectedIds = new Set(overlay.selectedWallIds)
  const selected = plan.walls.filter((wall) => selectedIds.has(wall.id))

  for (const wall of plan.walls) {
    if (selectedIds.has(wall.id)) {
      continue
    }
    strokeWall(
      ctx,
      camera,
      wall,
      wall.id === overlay.hoverWallId ? colors.wallDraft : colors.wall,
    )
  }

  for (const wall of selected) {
    strokeWall(ctx, camera, wall, colors.wallSelected)
  }

  for (const opening of plan.openings) {
    const wall = plan.walls.find((item) => item.id === opening.wallId)
    if (wall) {
      drawOpening(ctx, camera, wall, opening, colors)
    }
  }

  if (overlay.openingPreview) {
    const wall = plan.walls.find(
      (item) => item.id === overlay.openingPreview?.wallId,
    )
    if (wall) {
      ctx.save()
      ctx.globalAlpha = 0.5
      drawOpening(ctx, camera, wall, overlay.openingPreview, colors)
      ctx.restore()
    }
  }

  const selectedItems = new Set(overlay.selectedItemIds ?? [])
  for (const item of plan.items) {
    const selectedItem = selectedItems.has(item.id)
    const hovered = item.id === overlay.hoverItemId
    let color = colors.item
    if (selectedItem) {
      color = colors.wallSelected
    } else if (hovered) {
      color = colors.wallDraft
    }
    drawItem(ctx, camera, item, color, colors.itemFill)
  }

  if (overlay.itemPreview) {
    ctx.save()
    ctx.globalAlpha = 0.5
    drawItem(ctx, camera, overlay.itemPreview, colors.item, colors.itemFill)
    ctx.restore()
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
      copy,
    )
  } else if (selected.length === 1) {
    const wall = selected[0]
    if (wall) {
      drawLengthLabel(
        ctx,
        camera,
        wall.a,
        wall.b,
        wall.thicknessMm,
        colors,
        copy,
      )
    }
  }

  for (const room of rooms) {
    drawRoomLabel(ctx, camera, room, colors, copy)
  }

  if (overlay.roomDraft) {
    strokeRoomDraft(ctx, camera, overlay.roomDraft, colors, copy)
  }

  if (overlay.draft) {
    drawDraftHandle(ctx, camera, overlay.draft.a, colors.wallDraft)
  }

  if (overlay.marquee) {
    strokeMarquee(ctx, camera, overlay.marquee, colors)
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

function drawOpening(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  wall: Wall,
  opening: Pick<Opening, 'type' | 'offsetMm' | 'widthMm'>,
  colors: CanvasColors,
): void {
  const span = openingSpan(wall, opening)
  strokeWall(
    ctx,
    camera,
    { a: span.a, b: span.b, thicknessMm: wall.thicknessMm },
    colors.background,
  )

  const a = worldToScreen(camera, span.a)
  const b = worldToScreen(camera, span.b)
  ctx.save()
  ctx.strokeStyle = colors.wall
  ctx.lineWidth = 1
  if (opening.type === 'window') {
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.restore()
    return
  }

  const angle = Math.atan2(b.y - a.y, b.x - a.x)
  const radius = Math.hypot(b.x - a.x, b.y - a.y)
  const leafX = a.x + Math.cos(angle + Math.PI / 2) * radius
  const leafY = a.y + Math.sin(angle + Math.PI / 2) * radius
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(leafX, leafY)
  ctx.stroke()
  ctx.strokeStyle = colors.wallDraft
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.arc(a.x, a.y, radius, angle, angle + Math.PI / 2)
  ctx.stroke()
  ctx.restore()
}

function fillRoom(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  room: Room,
  colors: CanvasColors,
): void {
  ctx.save()
  ctx.fillStyle = colors.roomFill
  ctx.beginPath()
  room.polygon.forEach((point, i) => {
    const s = worldToScreen(camera, point)
    if (i === 0) {
      ctx.moveTo(s.x, s.y)
    } else {
      ctx.lineTo(s.x, s.y)
    }
  })
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawRoomLabel(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  room: Room,
  colors: CanvasColors,
  copy: RenderText,
): void {
  const at = pointInPolygon(room.centroid, room.polygon)
    ? room.centroid
    : (room.polygon[0] ?? room.centroid)
  const s = worldToScreen(camera, at)
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = colors.labelText
  ctx.font = '600 13px system-ui, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(room.name || copy.defaultRoomName, s.x, s.y - 8)
  ctx.font = '12px system-ui, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(formatAreaMm2(room.areaMm2, copy.locale), s.x, s.y + 8)
  ctx.restore()
}

function strokeRoomDraft(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  draft: { a: PointMm; b: PointMm },
  colors: CanvasColors,
  copy: RenderText,
): void {
  const a = worldToScreen(camera, draft.a)
  const b = worldToScreen(camera, draft.b)
  ctx.save()
  ctx.fillStyle = colors.roomFill
  ctx.strokeStyle = colors.wallDraft
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y)
  ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y)
  ctx.restore()
  ctx.save()
  ctx.fillStyle = colors.labelText
  ctx.font = '12px system-ui, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const w = Math.abs(draft.b.x - draft.a.x)
  const h = Math.abs(draft.b.y - draft.a.y)
  ctx.fillText(
    `${formatDimensionMm(w, copy.locale)} × ${formatDimensionMm(h, copy.locale)}`,
    (a.x + b.x) / 2,
    (a.y + b.y) / 2,
  )
  ctx.restore()
}

function strokeMarquee(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  marquee: Marquee,
  colors: CanvasColors,
): void {
  const a = worldToScreen(camera, marquee.start)
  const b = worldToScreen(camera, marquee.end)
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const w = Math.abs(b.x - a.x)
  const h = Math.abs(b.y - a.y)
  if (w < 1 && h < 1) {
    return
  }
  ctx.save()
  ctx.fillStyle = colors.marqueeFill
  ctx.strokeStyle = colors.marqueeStroke
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.fillRect(x, y, w, h)
  ctx.strokeRect(x + 0.5, y + 0.5, w, h)
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
  copy: RenderText,
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
  const text = formatDimensionMm(length, copy.locale)

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
