import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from '../document/empty'
import type { PlanDocument } from '../document/types'
import {
  buildSceneBoxes,
  ITEM_HEIGHT_MM,
  sceneFraming,
  WALL_HEIGHT_MM,
} from './model'

function planWithWall(): PlanDocument {
  const plan = createEmptyDocument()
  plan.walls.push({
    id: 'wall-1',
    a: { x: 0, y: 0 },
    b: { x: 4000, y: 0 },
    thicknessMm: 150,
  })
  return plan
}

describe('buildSceneBoxes', () => {
  it('extrudes a wall without openings into one full-height box', () => {
    expect(buildSceneBoxes(planWithWall())).toEqual([
      {
        id: 'wall-1:solid@0',
        kind: 'wall',
        x: 2000,
        y: 0,
        z: WALL_HEIGHT_MM / 2,
        lengthMm: 4000,
        thicknessMm: 150,
        heightMm: WALL_HEIGHT_MM,
        rotationDeg: 0,
      },
    ])
  })

  it('cuts a door void and adds a lintel above it', () => {
    const plan = planWithWall()
    plan.openings.push({
      id: 'door-1',
      type: 'door',
      wallId: 'wall-1',
      offsetMm: 1000,
      widthMm: 800,
    })
    const boxes = buildSceneBoxes(plan)
    expect(boxes).toHaveLength(3)
    expect(
      boxes.map((box) => [box.x, box.lengthMm, box.z, box.heightMm]),
    ).toEqual([
      [500, 1000, 1200, 2400],
      [2900, 2200, 1200, 2400],
      [1400, 800, 2250, 300],
    ])
  })

  it('adds a sill under a window, in addition to the lintel', () => {
    const plan = planWithWall()
    plan.openings.push({
      id: 'window-1',
      type: 'window',
      wallId: 'wall-1',
      offsetMm: 1000,
      widthMm: 1200,
    })
    const boxes = buildSceneBoxes(plan)
    expect(boxes).toHaveLength(4)
    const sill = boxes.find((box) => box.z === 450)
    expect(sill).toMatchObject({ x: 1600, lengthMm: 1200, heightMm: 900 })
  })

  it('ignores openings on other walls and clamps openings that overhang the wall', () => {
    const plan = planWithWall()
    plan.walls.push({
      id: 'wall-2',
      a: { x: 0, y: 0 },
      b: { x: 0, y: 3000 },
      thicknessMm: 150,
    })
    plan.openings.push(
      {
        id: 'door-1',
        type: 'door',
        wallId: 'wall-2',
        offsetMm: 0,
        widthMm: 800,
      },
      {
        id: 'door-2',
        type: 'door',
        wallId: 'wall-1',
        offsetMm: 3500,
        widthMm: 1000,
      },
    )
    const boxes = buildSceneBoxes(plan)
    const wall1 = boxes.filter((box) => box.y === 0)
    expect(wall1).toHaveLength(2)
    expect(wall1.find((box) => box.z === 2250)).toMatchObject({
      x: 3750,
      lengthMm: 500,
    })
    expect(wall1.find((box) => box.lengthMm === 3500)).toBeDefined()
  })

  it('rotates a vertical wall to follow its direction', () => {
    const plan = createEmptyDocument()
    plan.walls.push({
      id: 'wall-1',
      a: { x: 0, y: 0 },
      b: { x: 0, y: 3000 },
      thicknessMm: 100,
    })
    expect(buildSceneBoxes(plan)[0]).toMatchObject({
      x: 0,
      y: 1500,
      lengthMm: 3000,
      rotationDeg: 90,
    })
  })

  it('turns catalog items into boxes with their footprint and rotation', () => {
    const plan = createEmptyDocument()
    plan.items.push({
      id: 'item-1',
      catalogId: 'sofa',
      x: 1000,
      y: 2000,
      widthMm: 2000,
      heightMm: 900,
      rotationDeg: 90,
    })
    expect(buildSceneBoxes(plan)).toEqual([
      {
        id: 'item:item-1',
        kind: 'item',
        x: 1000,
        y: 2000,
        z: ITEM_HEIGHT_MM / 2,
        lengthMm: 2000,
        thicknessMm: 900,
        heightMm: ITEM_HEIGHT_MM,
        rotationDeg: 90,
      },
    ])
  })

  it('returns no boxes for an empty plan', () => {
    expect(buildSceneBoxes(createEmptyDocument())).toEqual([])
  })
})

describe('sceneFraming', () => {
  it('falls back to a default view for an empty plan', () => {
    expect(sceneFraming([])).toMatchObject({ target: [0, 1, 0] })
  })

  it('targets the center of the model in meters', () => {
    const framing = sceneFraming(buildSceneBoxes(planWithWall()))
    expect(framing.target[0]).toBeCloseTo(2)
    expect(framing.target[1]).toBeCloseTo(1.2)
    expect(framing.target[2]).toBeCloseTo(0)
    expect(framing.distanceM).toBeGreaterThan(4)
  })
})
