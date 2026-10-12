import { create } from 'zustand'

export type EditorTool = 'select' | 'wall' | 'room'

export type EditorStore = {
  tool: EditorTool
  selectedWallIds: string[]
  setTool: (tool: EditorTool) => void
  setSelectedWallIds: (ids: string[]) => void
  selectWall: (id: string | null) => void
  toggleWall: (id: string) => void
  clearSelection: () => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  tool: 'select',
  selectedWallIds: [],
  setTool: (tool) => set({ tool }),
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
