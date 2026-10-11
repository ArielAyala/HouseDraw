import { describe, expect, it } from 'vitest'
import { DEFAULT_SCALE } from './camera'
import {
  activeGridStepMm,
  gridLines,
  isMajorLine,
  MAJOR_GRID_MM,
  MINOR_GRID_MM,
  planGrid,
} from './grid'

describe('grid', () => {
  it('shows 10 cm minors at default zoom', () => {
    const plan = planGrid(DEFAULT_SCALE)
    expect(plan.minorMm).toBe(MINOR_GRID_MM)
    expect(plan.majorMm).toBe(MAJOR_GRID_MM)
    expect(activeGridStepMm(plan)).toBe(100)
  })

  it('skips minor lines when they would be denser than 8 px', () => {
    const plan = planGrid(0.05)
    expect(plan.minorMm).toBeNull()
    expect(plan.majorMm).toBe(MAJOR_GRID_MM)
    expect(activeGridStepMm(plan)).toBe(1000)
  })

  it('widens major spacing when fully zoomed out', () => {
    const plan = planGrid(0.004)
    expect(plan.minorMm).toBeNull()
    expect(plan.majorMm).toBeGreaterThan(MAJOR_GRID_MM)
  })

  it('emits inclusive world-space steps', () => {
    expect(gridLines(-50, 250, 100)).toEqual([-100, 0, 100, 200])
  })

  it('detects meter majors on a 10 cm grid', () => {
    expect(isMajorLine(0, 1000)).toBe(true)
    expect(isMajorLine(1000, 1000)).toBe(true)
    expect(isMajorLine(-2000, 1000)).toBe(true)
    expect(isMajorLine(300, 1000)).toBe(false)
  })
})
