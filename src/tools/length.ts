const LENGTH_RE = /^([0-9]+(?:\.[0-9]+)?)\s*(mm|cm|m)?$/i

/**
 * Parse a typed wall length. Bare numbers are meters.
 * Returns integer millimeters, or null if the input is invalid.
 */
export function parseLengthInput(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }
  const match = LENGTH_RE.exec(trimmed)
  if (!match) {
    return null
  }
  const raw = match[1]
  const unit = match[2]?.toLowerCase() ?? 'm'
  if (raw === undefined) {
    return null
  }
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    return null
  }
  let mm: number
  if (unit === 'mm') {
    mm = value
  } else if (unit === 'cm') {
    mm = value * 10
  } else {
    mm = value * 1000
  }
  const rounded = Math.round(mm)
  if (rounded <= 0) {
    return null
  }
  return rounded
}

export function isLengthBufferKey(key: string): boolean {
  return /^[0-9.cCmM]$/.test(key)
}
