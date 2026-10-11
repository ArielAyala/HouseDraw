import { describe, expect, it } from 'vitest'
import { formatDimensionMm, formatLengthMm, formatZoomPercent } from './units'

describe('units', () => {
  it('formats centimeters below one meter', () => {
    expect(formatLengthMm(100)).toBe('10 cm')
    expect(formatLengthMm(50)).toBe('5 cm')
  })

  it('formats meters at one meter and above', () => {
    expect(formatLengthMm(1000)).toBe('1 m')
    expect(formatLengthMm(5000)).toBe('5 m')
    expect(formatLengthMm(3500)).toBe('3.5 m')
  })

  it('formats live wall dimensions with two meter decimals', () => {
    expect(formatDimensionMm(3200)).toBe('3.20 m')
    expect(formatDimensionMm(4000)).toBe('4.00 m')
    expect(formatDimensionMm(800)).toBe('80 cm')
  })

  it('rounds zoom for the status bar', () => {
    expect(formatZoomPercent(100)).toBe('100%')
    expect(formatZoomPercent(142.4)).toBe('142%')
  })
})
