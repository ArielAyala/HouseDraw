import { describe, expect, it } from 'vitest'
import { parseLengthInput, parseThicknessInput } from './length'

describe('parseLengthInput', () => {
  it('treats bare numbers as meters', () => {
    expect(parseLengthInput('3.5')).toBe(3500)
    expect(parseLengthInput('4')).toBe(4000)
  })

  it('parses meters and centimeters', () => {
    expect(parseLengthInput('3.5m')).toBe(3500)
    expect(parseLengthInput('3.5 m')).toBe(3500)
    expect(parseLengthInput('350cm')).toBe(3500)
    expect(parseLengthInput('350 cm')).toBe(3500)
  })

  it('parses millimeters when the unit is explicit', () => {
    expect(parseLengthInput('3500mm')).toBe(3500)
  })

  it('rejects empty, zero, and non-length input', () => {
    expect(parseLengthInput('')).toBeNull()
    expect(parseLengthInput('   ')).toBeNull()
    expect(parseLengthInput('0')).toBeNull()
    expect(parseLengthInput('0m')).toBeNull()
    expect(parseLengthInput('nope')).toBeNull()
    expect(parseLengthInput('-3m')).toBeNull()
  })
})

describe('parseThicknessInput', () => {
  it('treats bare numbers as centimeters', () => {
    expect(parseThicknessInput('15')).toBe(150)
    expect(parseThicknessInput('12.5')).toBe(125)
    expect(parseThicknessInput('12,5')).toBe(125)
  })

  it('parses explicit millimeters and meters', () => {
    expect(parseThicknessInput('200mm')).toBe(200)
    expect(parseThicknessInput('0.15m')).toBe(150)
    expect(parseThicknessInput('15 cm')).toBe(150)
  })

  it('rounds to whole millimeters', () => {
    expect(parseThicknessInput('12.54')).toBe(125)
    expect(parseThicknessInput('0.04')).toBeNull()
  })
})
