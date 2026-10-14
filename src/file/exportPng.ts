import type { Theme } from '../app/theme'
import { canvasColorsFromTheme } from '../canvas/colors'
import { renderPlan } from '../canvas/render'
import type { PlanDocument } from '../document/types'
import i18n from '../i18n'
import { downloadBlob } from './download'
import { exportBoundsMm, exportSizeFor, fitCameraToBounds } from './exportView'

export const PLAN_PNG_FILE_NAME = 'plan.png'

const EXPORT_LONGEST_SIDE_PX = 2400
const EXPORT_PADDING_PX = 48
const EXPORT_PIXEL_RATIO = 2

export async function exportPlanPng(
  plan: PlanDocument,
  theme: Theme,
): Promise<void> {
  const bounds = exportBoundsMm(plan)
  const size = exportSizeFor(bounds, EXPORT_LONGEST_SIDE_PX, EXPORT_PADDING_PX)
  const camera = fitCameraToBounds(bounds, size, EXPORT_PADDING_PX)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(size.width * EXPORT_PIXEL_RATIO)
  canvas.height = Math.round(size.height * EXPORT_PIXEL_RATIO)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D is not available in this browser.')
  }
  ctx.setTransform(EXPORT_PIXEL_RATIO, 0, 0, EXPORT_PIXEL_RATIO, 0, 0)
  renderPlan(ctx, camera, size, canvasColorsFromTheme(theme), plan, {
    locale: i18n.language,
    defaultRoomName: i18n.t('rooms.defaultName'),
  })

  const blob = await canvasToPng(canvas)
  downloadBlob(blob, PLAN_PNG_FILE_NAME)
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('PNG encoding failed.'))
      }
    }, 'image/png')
  })
}
