import { useCallback, useEffect, useState } from 'react'
import { findCatalogEntry } from '../catalog/catalog'
import {
  addItemToDocument,
  createItemDraft,
  type ItemDraft,
} from '../document/items'
import { useDocumentStore } from '../document/store'
import type { PointMm } from '../document/types'
import { useEditorStore } from './editor'
import type { ToolPointer } from './pointer'
import { snapToGrid } from './snap'

export function useStampTool(active: boolean) {
  const apply = useDocumentStore((state) => state.apply)
  const stampId = useEditorStore((state) => state.stampId)
  const setTool = useEditorStore((state) => state.setTool)
  const setStampId = useEditorStore((state) => state.setStampId)
  const [preview, setPreview] = useState<ItemDraft | null>(null)

  const place = useCallback(
    (catalogId: string, world: PointMm) => {
      const entry = findCatalogEntry(catalogId)
      if (!entry) {
        return
      }
      const gridMm = useDocumentStore.getState().document.settings.gridMm
      const draft = createItemDraft(
        entry.id,
        entry.widthMm,
        entry.heightMm,
        snapToGrid(world, gridMm),
      )
      const id = crypto.randomUUID()
      apply((document) => addItemToDocument(document, { id, ...draft }))
    },
    [apply],
  )

  const onMove = useCallback(
    (pointer: ToolPointer) => {
      const entry = stampId ? findCatalogEntry(stampId) : undefined
      if (!entry) {
        setPreview(null)
        return
      }
      const gridMm = useDocumentStore.getState().document.settings.gridMm
      setPreview(
        createItemDraft(
          entry.id,
          entry.widthMm,
          entry.heightMm,
          snapToGrid(pointer.world, gridMm),
        ),
      )
    },
    [stampId],
  )

  const onPointerDown = useCallback(
    (pointer: ToolPointer) => {
      if (stampId) {
        place(stampId, pointer.world)
      }
    },
    [place, stampId],
  )

  useEffect(() => {
    if (!active) {
      setPreview(null)
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setStampId(null)
        setTool('select')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, setStampId, setTool])

  return { preview, place, onMove, onPointerDown }
}
