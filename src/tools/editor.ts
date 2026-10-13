import { create } from 'zustand'
import { DEFAULT_OPENING_WIDTH_MM } from '../document/openings'
import type { OpeningKind } from '../document/types'

export type EditorTool =
  | 'select'
  | 'pan'
  | 'wall'
  | 'room'
  | 'door'
  | 'window'
  | 'stamp'

export type EditorStore = {
  tool: EditorTool
  selectedWallIds: string[]
  selectedItemIds: string[]
  stampId: string | null
  openingWidthMm: Record<OpeningKind, number>
  setTool: (tool: EditorTool) => void
  setStampId: (catalogId: string | null) => void
  setOpeningWidthMm: (kind: OpeningKind, widthMm: number) => void
  setSelectedWallIds: (ids: string[]) => void
  setSelectedItemIds: (ids: string[]) => void
  selectWall: (id: string | null) => void
  toggleWall: (id: string) => void
  selectItem: (id: string | null) => void
  toggleItem: (id: string) => void
  clearSelection: () => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  tool: 'select',
  selectedWallIds: [],
  selectedItemIds: [],
  stampId: null,
  openingWidthMm: { ...DEFAULT_OPENING_WIDTH_MM },
  setTool: (tool) => set({ tool }),
  setStampId: (catalogId) => set({ stampId: catalogId, tool: 'stamp' }),
  setOpeningWidthMm: (kind, widthMm) =>
    set((state) => ({
      openingWidthMm: { ...state.openingWidthMm, [kind]: widthMm },
    })),
  setSelectedWallIds: (ids) =>
    set({ selectedWallIds: uniqueIds(ids), selectedItemIds: [] }),
  setSelectedItemIds: (ids) =>
    set({ selectedItemIds: uniqueIds(ids), selectedWallIds: [] }),
  selectWall: (id) =>
    set({ selectedWallIds: id ? [id] : [], selectedItemIds: [] }),
  toggleWall: (id) =>
    set((state) => ({
      selectedWallIds: state.selectedWallIds.includes(id)
        ? state.selectedWallIds.filter((item) => item !== id)
        : [...state.selectedWallIds, id],
      selectedItemIds: [],
    })),
  selectItem: (id) =>
    set({ selectedItemIds: id ? [id] : [], selectedWallIds: [] }),
  toggleItem: (id) =>
    set((state) => ({
      selectedItemIds: state.selectedItemIds.includes(id)
        ? state.selectedItemIds.filter((item) => item !== id)
        : [...state.selectedItemIds, id],
      selectedWallIds: [],
    })),
  clearSelection: () => set({ selectedWallIds: [], selectedItemIds: [] }),
}))

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)]
}

export function pruneSelectedWallIds(
  selectedWallIds: string[],
  wallIds: readonly string[],
): string[] {
  const existing = new Set(wallIds)
  return selectedWallIds.filter((id) => existing.has(id))
}

export function pruneSelectedItemIds(
  selectedItemIds: string[],
  itemIds: readonly string[],
): string[] {
  const existing = new Set(itemIds)
  return selectedItemIds.filter((id) => existing.has(id))
}
