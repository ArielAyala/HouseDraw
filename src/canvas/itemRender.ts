import { findCatalogEntry } from '../catalog/catalog'
import type { Item } from '../document/types'
import { type Camera, worldToScreen } from './camera'

export type ItemDrawable = Pick<
  Item,
  'catalogId' | 'x' | 'y' | 'widthMm' | 'heightMm' | 'rotationDeg'
>

/** Draws a catalog symbol at its world position, scaled and rotated. */
export function drawItem(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  item: ItemDrawable,
  stroke: string,
  fill: string,
): void {
  const entry = findCatalogEntry(item.catalogId)
  if (!entry) {
    return
  }
  const center = worldToScreen(camera, { x: item.x, y: item.y })
  const w = item.widthMm * camera.scale
  const h = item.heightMm * camera.scale

  ctx.save()
  ctx.translate(center.x, center.y)
  ctx.rotate((item.rotationDeg * Math.PI) / 180)
  ctx.translate(-w / 2, -h / 2)
  ctx.strokeStyle = stroke
  ctx.fillStyle = fill
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'

  for (const shape of entry.symbol) {
    if (shape.kind === 'rect') {
      const x = shape.x * w
      const y = shape.y * h
      if (shape.fill) {
        ctx.fillRect(x, y, shape.w * w, shape.h * h)
      } else {
        ctx.strokeRect(x, y, shape.w * w, shape.h * h)
      }
    } else if (shape.kind === 'circle') {
      ctx.beginPath()
      ctx.arc(
        shape.cx * w,
        shape.cy * h,
        shape.r * Math.min(w, h),
        0,
        Math.PI * 2,
      )
      if (shape.fill) {
        ctx.fill()
      } else {
        ctx.stroke()
      }
    } else {
      ctx.beginPath()
      ctx.moveTo(shape.x1 * w, shape.y1 * h)
      ctx.lineTo(shape.x2 * w, shape.y2 * h)
      ctx.stroke()
    }
  }
  ctx.restore()
}
