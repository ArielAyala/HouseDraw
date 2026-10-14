export function formatLengthMm(mm: number, locale = 'en'): string {
  const abs = Math.abs(mm)
  if (abs >= 1000) {
    return `${formatNumber(mm / 1000, locale)} m`
  }
  return `${formatNumber(mm / 10, locale)} cm`
}

/** Live wall dimension, e.g. `3.20 m`. */
export function formatDimensionMm(mm: number, locale = 'en'): string {
  const abs = Math.abs(mm)
  if (abs >= 1000) {
    return `${formatNumber(mm / 1000, locale, 2)} m`
  }
  return `${formatNumber(mm / 10, locale)} cm`
}

export function formatZoomPercent(percent: number): string {
  return `${Math.round(percent)}%`
}

function formatNumber(
  value: number,
  locale: string,
  minimumFractionDigits = 0,
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(value)
}
