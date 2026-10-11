import { Moon, Sun } from 'lucide-react'
import styles from './App.module.css'
import { useTheme } from './ThemeProvider'

export default function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true" />
          <h1 className={styles.title}>HouseDraw</h1>
        </div>
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
      </header>
      <main className={styles.stage}>
        <p className={styles.placeholder}>
          Floor-plan canvas arrives in phase 02
        </p>
      </main>
    </div>
  )
}
