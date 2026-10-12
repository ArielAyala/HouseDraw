import type { PointMm } from '../document/types'

export type ToolPointer = {
  world: PointMm
  screen: PointMm
  shiftKey: boolean
  scale: number
}
