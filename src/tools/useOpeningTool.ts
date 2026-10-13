import { useCallback, useEffect, useState } from 'react'
import { HIT_PADDING_PX } from '../canvas/hitTest'
import {
  addOpeningToDocument,
  openingAtPoint,
  removeOpeningById,
} from '../document/openings'
import { useDocumentStore } from '../document/store'
import type { OpeningKind } from '../document/types'
import { useEditorStore } from './editor'
import { type OpeningDraft, openingDraftAt } from './opening'
import type { ToolPointer } from './pointer'

/** Pass `null` when the opening tool is not active. */
export function useOpeningTool(kind: OpeningKind | null) {
  const apply = useDocumentStore((state) => state.apply)
  const widthMm = useEditorStore((state) =>
    kind ? state.openingWidthMm[kind] : 0,
  )
  const [preview, setPreview] = useState<OpeningDraft | null>(null)

  const onMove = useCallback(
    (pointer: ToolPointer) => {
      if (!kind) {
        return
      }
      const document = useDocumentStore.getState().document
      setPreview(
        openingDraftAt(
          document,
          kind,
          widthMm,
          pointer.world,
          HIT_PADDING_PX / pointer.scale,
        ),
      )
    },
    [kind, widthMm],
  )

  const onPointerDown = useCallback(
    (pointer: ToolPointer) => {
      if (!kind) {
        return
      }
      const document = useDocumentStore.getState().document
      const existing = openingAtPoint(
        pointer.world,
        document,
        HIT_PADDING_PX / pointer.scale,
      )
      if (existing) {
        apply((current) => removeOpeningById(current, existing.id))
        return
      }
      const draft = openingDraftAt(
        document,
        kind,
        widthMm,
        pointer.world,
        HIT_PADDING_PX / pointer.scale,
      )
      if (!draft) {
        return
      }
      const id = crypto.randomUUID()
      apply((current) => addOpeningToDocument(current, { id, ...draft }))
    },
    [apply, kind, widthMm],
  )

  useEffect(() => {
    if (!kind) {
      setPreview(null)
    }
  }, [kind])

  return { preview, onMove, onPointerDown }
}
