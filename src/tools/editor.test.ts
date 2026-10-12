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
})
