import { Download, FolderOpen, Save } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../app/ThemeProvider'
import { useDocumentStore } from '../document/store'
import type { PlanDocument } from '../document/types'
import { exportPlanPng } from '../file/exportPng'
import { openPlanFile, savePlanFile } from '../file/fileIO'
import { useEditorStore } from '../tools/editor'
import styles from './FileActions.module.css'

export default function FileActions() {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const onSave = async () => {
    try {
      await savePlanFile(useDocumentStore.getState().document)
    } catch (error) {
      window.alert(errorMessage(error, t('file.saveError')))
    }
  }

  const onOpen = async () => {
    if (
      hasContent(useDocumentStore.getState().document) &&
      !window.confirm(t('file.confirmReplace'))
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
      window.alert(errorMessage(error, t('file.openError')))
    }
  }

  const onExport = async () => {
    try {
      await exportPlanPng(useDocumentStore.getState().document, theme)
    } catch (error) {
      window.alert(errorMessage(error, t('file.exportError')))
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
    <div className={styles.bar} role="toolbar" aria-label={t('file.label')}>
      <button
        type="button"
        className={styles.button}
        aria-label={t('file.open')}
        title={t('file.openShortcut')}
        onClick={() => void onOpen()}
      >
        <FolderOpen size={16} />
      </button>
      <button
        type="button"
        className={styles.button}
        aria-label={t('file.save')}
        title={t('file.saveShortcut')}
        onClick={() => void onSave()}
      >
        <Save size={16} />
      </button>
      <button
        type="button"
        className={styles.button}
        aria-label={t('file.export')}
        title={t('file.export')}
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
