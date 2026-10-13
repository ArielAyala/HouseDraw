import { Box, Moon, Sun } from 'lucide-react'
import { lazy, Suspense } from 'react'
import PlanCanvas from '../canvas/PlanCanvas'
import { useDocumentHotkeys } from '../document/hotkeys'
import { useAutosave } from '../file/useAutosave'
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
  const { theme, toggleTheme } = useTheme()
  const viewMode = useEditorStore((state) => state.viewMode)
  const setViewMode = useEditorStore((state) => state.setViewMode)
  const showing3d = viewMode === 'model'

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true" />
          <h1 className={styles.title}>HouseDraw</h1>
        </div>
        <div className={styles.actions}>
          <FileActions />
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setViewMode(showing3d ? 'plan' : 'model')}
            aria-pressed={showing3d}
            title={showing3d ? 'Back to 2D plan' : '3D preview'}
            aria-label={showing3d ? 'Back to 2D plan' : 'Show 3D preview'}
          >
            <Box size={16} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
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
