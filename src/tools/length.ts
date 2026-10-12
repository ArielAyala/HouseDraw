const LENGTH_RE = /^([0-9]+(?:\.[0-9]+)?)\s*(mm|cm|m)?$/i

function toMillimeters(value: number, unit: string): number {
  if (unit === 'mm') {
    return value
  }
  if (unit === 'cm') {
    return value * 10
  }
  return value * 1000
}

function parseMeasuredInput(input: string, defaultUnit: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }
  const match = LENGTH_RE.exec(trimmed)
  if (!match) {
    return null
  }
  const raw = match[1]
  const unit = match[2]?.toLowerCase() ?? defaultUnit
  if (raw === undefined) {
    return null
  }
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    return null
  }
  const rounded = Math.round(toMillimeters(value, unit))
  if (rounded <= 0) {
    return null
  }
  return rounded
}

/**
 * Parse a typed wall length. Bare numbers are meters.
 * Returns integer millimeters, or null if the input is invalid.
 */
export function parseLengthInput(input: string): number | null {
  return parseMeasuredInput(input, 'm')
}

/** Parse wall thickness. Bare numbers are millimeters. */
export function parseThicknessInput(input: string): number | null {
  return parseMeasuredInput(input, 'mm')
}

export function isLengthBufferKey(key: string): boolean {
  return /^[0-9.cCmM]$/.test(key)
}
