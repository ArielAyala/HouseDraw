import { create } from 'zustand'
import { DEFAULT_OPENING_WIDTH_MM } from '../document/openings'
import type { OpeningKind } from '../document/types'

export type EditorTool = 'select' | 'wall' | 'room' | 'door' | 'window'

export type EditorStore = {
  tool: EditorTool
  selectedWallIds: string[]
  openingWidthMm: Record<OpeningKind, number>
  setTool: (tool: EditorTool) => void
  setOpeningWidthMm: (kind: OpeningKind, widthMm: number) => void
  setSelectedWallIds: (ids: string[]) => void
  selectWall: (id: string | null) => void
  toggleWall: (id: string) => void
  clearSelection: () => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  tool: 'select',
  selectedWallIds: [],
  openingWidthMm: { ...DEFAULT_OPENING_WIDTH_MM },
  setTool: (tool) => set({ tool }),
  setOpeningWidthMm: (kind, widthMm) =>
    set((state) => ({
      openingWidthMm: { ...state.openingWidthMm, [kind]: widthMm },
    })),
  setSelectedWallIds: (ids) => set({ selectedWallIds: uniqueIds(ids) }),
  selectWall: (id) => set({ selectedWallIds: id ? [id] : [] }),
  toggleWall: (id) =>
    set((state) => ({
      selectedWallIds: state.selectedWallIds.includes(id)
        ? state.selectedWallIds.filter((item) => item !== id)
        : [...state.selectedWallIds, id],
    })),
  clearSelection: () => set({ selectedWallIds: [] }),
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
