export const MINOR_GRID_MM = 100
export const MAJOR_GRID_MM = 1000

const MIN_LINE_PX = 8
const FADE_START_PX = 16
const MAX_LINES = 2000

export type GridPlan = {
  minorMm: number | null
  majorMm: number
  minorAlpha: number
}

export function planGrid(scale: number): GridPlan {
  const minorPx = MINOR_GRID_MM * scale
  const majorPx = MAJOR_GRID_MM * scale

  let majorMm = MAJOR_GRID_MM
  if (majorPx < MIN_LINE_PX) {
    if (5000 * scale >= MIN_LINE_PX) {
      majorMm = 5000
    } else if (10000 * scale >= MIN_LINE_PX) {
      majorMm = 10000
    } else {
      majorMm = 20000
    }
  }

  if (minorPx < MIN_LINE_PX) {
    return { minorMm: null, majorMm, minorAlpha: 0 }
  }

  const minorAlpha =
    minorPx >= FADE_START_PX
      ? 1
      : Math.max(0, (minorPx - MIN_LINE_PX) / (FADE_START_PX - MIN_LINE_PX))

  return { minorMm: MINOR_GRID_MM, majorMm, minorAlpha }
}

export function activeGridStepMm(plan: GridPlan): number {
  return plan.minorMm ?? plan.majorMm
}

export function gridLines(min: number, max: number, step: number): number[] {
  if (step <= 0 || max < min) {
    return []
  }
  const start = Math.floor(min / step) * step
  const lines: number[] = []
  for (let value = start, i = 0; value <= max && i < MAX_LINES; value += step) {
    lines.push(value)
    i += 1
  }
  return lines
}

export function isMajorLine(valueMm: number, majorMm: number): boolean {
  return Math.abs(valueMm) % majorMm < 1e-6
}
