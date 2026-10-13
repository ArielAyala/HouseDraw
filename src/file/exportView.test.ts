import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from '../document/empty'
import { fixtureDocument } from '../document/fixture'
import {
  contentBoundsMm,
  exportBoundsMm,
  exportSizeFor,
  fitCameraToBounds,
  MIN_EXPORT_SPAN_MM,
} from './exportView'

describe('contentBoundsMm', () => {
  it('returns null for an empty plan', () => {
    expect(contentBoundsMm(createEmptyDocument())).toBeNull()
  })

  it('includes wall thickness around the wall ends', () => {
    expect(contentBoundsMm(fixtureDocument)).toEqual({
      minX: -75,
      maxX: 4075,
      minY: -75,
      maxY: 75,
    })
  })

  it('includes items by their rotation-safe radius and labels as points', () => {
    const plan = createEmptyDocument()
    plan.items.push({
      id: 'item-1',
      catalogId: 'sofa',
      x: 0,
      y: 0,
      widthMm: 600,
      heightMm: 800,
      rotationDeg: 45,
    })
    plan.labels.push({ id: 'label-1', text: 'Hall', x: 2000, y: -500 })
    expect(contentBoundsMm(plan)).toEqual({
      minX: -500,
      maxX: 2000,
      minY: -500,
      maxY: 500,
    })
  })
})

describe('exportBoundsMm', () => {
  it('centers a minimum square on the origin for an empty plan', () => {
    expect(exportBoundsMm(createEmptyDocument())).toEqual({
      minX: -MIN_EXPORT_SPAN_MM / 2,
      maxX: MIN_EXPORT_SPAN_MM / 2,
      minY: -MIN_EXPORT_SPAN_MM / 2,
      maxY: MIN_EXPORT_SPAN_MM / 2,
    })
  })

  it('keeps the content span when it is larger than the minimum', () => {
    const bounds = exportBoundsMm(fixtureDocument)
    expect(bounds.maxX - bounds.minX).toBe(4150)
    expect(bounds.maxY - bounds.minY).toBe(4150)
  })
})

describe('exportSizeFor and fitCameraToBounds', () => {
  it('fits the content inside the padded image with the longest side as requested', () => {
    const bounds = { minX: 0, maxX: 4000, minY: 0, maxY: 2000 }
    const size = exportSizeFor(bounds, 1000, 50)
    expect(size).toEqual({ width: 1000, height: 550 })

    const camera = fitCameraToBounds(bounds, size, 50)
    expect(camera.scale).toBeCloseTo(0.225)
    expect(camera.x).toBeCloseTo(500 - 2000 * 0.225)
    expect(camera.y).toBeCloseTo(275 - 1000 * 0.225)
  })

  it('maps the bounds corners to the padded edges', () => {
    const bounds = { minX: -1000, maxX: 3000, minY: -500, maxY: 1500 }
    const size = exportSizeFor(bounds, 800, 40)
    const camera = fitCameraToBounds(bounds, size, 40)
    const topLeft = {
      x: bounds.minX * camera.scale + camera.x,
      y: bounds.minY * camera.scale + camera.y,
    }
    const bottomRight = {
      x: bounds.maxX * camera.scale + camera.x,
      y: bounds.maxY * camera.scale + camera.y,
    }
    expect(topLeft.x).toBeCloseTo(40)
    expect(topLeft.y).toBeCloseTo(40)
    expect(bottomRight.x).toBeCloseTo(size.width - 40)
    expect(bottomRight.y).toBeCloseTo(size.height - 40)
  })
})
