import { Box, Moon, Sun } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import PlanCanvas from '../canvas/PlanCanvas'
import { useDocumentHotkeys } from '../document/hotkeys'
import { useAutosave } from '../file/useAutosave'
import { nextLanguage } from '../i18n'
import { useEditorStore } from '../tools/editor'
import { useToolHotkeys } from '../tools/shortcuts'
import Catalog from '../ui/Catalog'
import FileActions from '../ui/FileActions'
import Inspector from '../ui/Inspector'
import Toolbar from '../ui/Toolbar'
import styles from './App.module.css'
import { useTheme } from './ThemeProvider'

const Preview3D = lazy(() => import('../view3d/Preview3D'))

export default function App() {
  useDocumentHotkeys()
  useAutosave()
  useToolHotkeys()
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const viewMode = useEditorStore((state) => state.viewMode)
  const setViewMode = useEditorStore((state) => state.setViewMode)
  const showing3d = viewMode === 'model'
  const language = i18n.language === 'es' ? 'es' : 'en'

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true" />
          <h1 className={styles.title}>{t('app.name')}</h1>
        </div>
        <div className={styles.actions}>
          <FileActions />
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setViewMode(showing3d ? 'plan' : 'model')}
            aria-pressed={showing3d}
            title={showing3d ? t('view.back2d') : t('view.show3d')}
            aria-label={showing3d ? t('view.back2d') : t('view.show3d')}
          >
            <Box size={16} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={toggleTheme}
            title={t('theme.toggle')}
            aria-label={
              theme === 'dark' ? t('theme.toLight') : t('theme.toDark')
            }
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.langButton}`}
            onClick={() => void i18n.changeLanguage(nextLanguage(language))}
            title={t('language.change')}
            aria-label={t('language.change')}
          >
            {language.toUpperCase()}
          </button>
        </div>
      </header>
      <main className={styles.stage}>
        {showing3d ? (
          <Suspense fallback={null}>
            <Preview3D />
          </Suspense>
        ) : (
          <>
            <PlanCanvas />
            <Catalog />
            <Toolbar />
            <Inspector />
          </>
        )}
      </main>
    </div>
  )
}
