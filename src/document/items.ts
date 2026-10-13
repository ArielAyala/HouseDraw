import type { Item, PlanDocument, PointMm } from './types'

export const ITEM_ROTATION_STEP_DEG = 90

export type ItemDraft = Omit<Item, 'id'>

/** Item at `center` (x, y are the item center in mm). */
export function createItemDraft(
  catalogId: string,
  widthMm: number,
  heightMm: number,
  center: PointMm,
  rotationDeg = 0,
): ItemDraft {
  return {
    catalogId,
    x: Math.round(center.x),
    y: Math.round(center.y),
    widthMm,
    heightMm,
    rotationDeg,
  }
}

export function pointInItem(
  point: PointMm,
  item: Pick<Item, 'x' | 'y' | 'widthMm' | 'heightMm' | 'rotationDeg'>,
  extraMm: number,
): boolean {
  const theta = (-item.rotationDeg * Math.PI) / 180
  const dx = point.x - item.x
  const dy = point.y - item.y
  const localX = dx * Math.cos(theta) - dy * Math.sin(theta)
  const localY = dx * Math.sin(theta) + dy * Math.cos(theta)
  return (
    Math.abs(localX) <= item.widthMm / 2 + extraMm &&
    Math.abs(localY) <= item.heightMm / 2 + extraMm
  )
}

/** Topmost item under `point` (last drawn wins). */
export function itemAtPoint(
  point: PointMm,
  items: Item[],
  extraMm: number,
): Item | null {
  let found: Item | null = null
  for (const item of items) {
    if (pointInItem(point, item, extraMm)) {
      found = item
    }
  }
  return found
}

export function addItemToDocument(
  document: PlanDocument,
  item: Item,
): PlanDocument {
  return { ...document, items: [...document.items, item] }
}

export function moveItemsById(
  document: PlanDocument,
  ids: readonly string[],
  delta: PointMm,
): PlanDocument {
  const idSet = new Set(ids)
  return {
    ...document,
    items: document.items.map((item) =>
      idSet.has(item.id)
        ? { ...item, x: item.x + delta.x, y: item.y + delta.y }
        : item,
    ),
  }
}

export function rotateItemsById(
  document: PlanDocument,
  ids: readonly string[],
): PlanDocument {
  const idSet = new Set(ids)
  return {
    ...document,
    items: document.items.map((item) =>
      idSet.has(item.id)
        ? {
            ...item,
            rotationDeg: (item.rotationDeg + ITEM_ROTATION_STEP_DEG) % 360,
          }
        : item,
    ),
  }
}

export function deleteItemsById(
  document: PlanDocument,
  ids: readonly string[],
): PlanDocument {
  const idSet = new Set(ids)
  return {
    ...document,
    items: document.items.filter((item) => !idSet.has(item.id)),
  }
}
