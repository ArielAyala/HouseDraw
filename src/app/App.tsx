import { Moon, Sun } from 'lucide-react'
import PlanCanvas from '../canvas/PlanCanvas'
import { useDocumentHotkeys } from '../document/hotkeys'
import { useAutosave } from '../file/useAutosave'
import Catalog from '../ui/Catalog'
import FileActions from '../ui/FileActions'
import Inspector from '../ui/Inspector'
import Toolbar from '../ui/Toolbar'
import styles from './App.module.css'
import { useTheme } from './ThemeProvider'

export default function App() {
  useDocumentHotkeys()
  useAutosave()
  const { theme, toggleTheme } = useTheme()

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
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>
      <main className={styles.stage}>
        <PlanCanvas />
        <Catalog />
        <Toolbar />
        <Inspector />
      </main>
    </div>
  )
}
