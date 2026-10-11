export function formatLengthMm(mm: number): string {
  const abs = Math.abs(mm)
  if (abs >= 1000) {
    return `${formatQuantity(mm / 1000)} m`
  }
  return `${formatQuantity(mm / 10)} cm`
}

/** Live wall dimension, e.g. `3.20 m`. */
export function formatDimensionMm(mm: number): string {
  const abs = Math.abs(mm)
  if (abs >= 1000) {
    return `${(mm / 1000).toFixed(2)} m`
  }
  return `${formatQuantity(mm / 10)} cm`
}

export function formatZoomPercent(percent: number): string {
  return `${Math.round(percent)}%`
}

function formatQuantity(value: number): string {
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) {
    return String(rounded)
  }
  return String(rounded)
}
