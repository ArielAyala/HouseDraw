import { beforeEach, describe, expect, it } from 'vitest'
import { pruneSelectedWallIds, useEditorStore } from './editor'

describe('editor store', () => {
  beforeEach(() => {
    useEditorStore.setState({ tool: 'select', selectedWallIds: [] })
  })

  it('selects a single wall', () => {
    useEditorStore.getState().selectWall('w1')
    expect(useEditorStore.getState().selectedWallIds).toEqual(['w1'])
  })

  it('toggles walls in the selection', () => {
    const { toggleWall } = useEditorStore.getState()
    toggleWall('w1')
    toggleWall('w2')
    toggleWall('w1')
    expect(useEditorStore.getState().selectedWallIds).toEqual(['w2'])
  })

  it('prunes ids that are no longer in the document', () => {
    expect(pruneSelectedWallIds(['w1', 'gone'], ['w1', 'w2'])).toEqual(['w1'])
  })

  it('keeps wall and item selection exclusive', () => {
    const store = useEditorStore.getState()
    store.selectWall('w1')
    store.selectItem('i1')
    expect(useEditorStore.getState().selectedWallIds).toEqual([])
    expect(useEditorStore.getState().selectedItemIds).toEqual(['i1'])
    store.toggleWall('w2')
    expect(useEditorStore.getState().selectedItemIds).toEqual([])
  })

  it('switches to the stamp tool when a catalog entry is chosen', () => {
    useEditorStore.getState().setStampId('bed')
    expect(useEditorStore.getState().tool).toBe('stamp')
    expect(useEditorStore.getState().stampId).toBe('bed')
  })
})
