import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import { ThemeProvider } from './app/ThemeProvider.tsx'
import { useDocumentStore } from './document/store.ts'
import { readAutosavedDocument } from './file/autosave.ts'
import i18n from './i18n'
import './index.css'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found')
}

const autosaved = readAutosavedDocument()
if (autosaved?.ok) {
  useDocumentStore.getState().replaceDocument(autosaved.document)
} else if (autosaved) {
  window.alert(i18n.t('errors.autosaveRestore', { detail: autosaved.error }))
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
