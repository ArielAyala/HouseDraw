import { Download, FolderOpen, Save } from 'lucide-react'
import { useEffect } from 'react'
import { useTheme } from '../app/ThemeProvider'
import { useDocumentStore } from '../document/store'
import type { PlanDocument } from '../document/types'
import { exportPlanPng } from '../file/exportPng'
import { openPlanFile, savePlanFile } from '../file/fileIO'
import { useEditorStore } from '../tools/editor'
import styles from './FileActions.module.css'

export default function FileActions() {
  const { theme } = useTheme()

  const onSave = async () => {
    try {
      await savePlanFile(useDocumentStore.getState().document)
    } catch (error) {
      window.alert(errorMessage(error, 'Could not save the plan.'))
    }
  }

  const onOpen = async () => {
    if (
      hasContent(useDocumentStore.getState().document) &&
      !window.confirm('Replace the current plan with the file you open?')
    ) {
      return
    }
    try {
      const result = await openPlanFile()
      if (result.status === 'invalid') {
        window.alert(result.error)
      }
      if (result.status === 'opened') {
        useDocumentStore.getState().replaceDocument(result.document)
        useEditorStore.getState().clearSelection()
      }
    } catch (error) {
      window.alert(errorMessage(error, 'Could not open the plan.'))
    }
  }

  const onExport = async () => {
    try {
      await exportPlanPng(useDocumentStore.getState().document, theme)
    } catch (error) {
      window.alert(errorMessage(error, 'Could not export the PNG.'))
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
        return
      }
      if (event.code === 'KeyS') {
        event.preventDefault()
        void onSave()
      } else if (event.code === 'KeyO') {
        event.preventDefault()
        void onOpen()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className={styles.bar} role="toolbar" aria-label="File">
      <button
        type="button"
        className={styles.button}
        aria-label="Open plan"
        title="Open plan (Ctrl+O)"
        onClick={() => void onOpen()}
      >
        <FolderOpen size={16} />
      </button>
      <button
        type="button"
        className={styles.button}
        aria-label="Save plan"
        title="Save plan (Ctrl+S)"
        onClick={() => void onSave()}
      >
        <Save size={16} />
      </button>
      <button
        type="button"
        className={styles.button}
        aria-label="Export PNG"
        title="Export PNG"
        onClick={() => void onExport()}
      >
        <Download size={16} />
      </button>
    </div>
  )
}

function hasContent(plan: PlanDocument): boolean {
  return (
    plan.walls.length +
      plan.openings.length +
      plan.items.length +
      plan.labels.length >
    0
  )
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}
