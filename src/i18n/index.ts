import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './en'
import { es } from './es'

export type Language = 'en' | 'es'

export const LANGUAGE_STORAGE_KEY = 'housedraw.language'

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'es'
}

export function readStoredLanguage(): Language {
  try {
    const value = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isLanguage(value)) {
      return value
    }
  } catch {
    // private mode / disabled storage
  }
  return 'en'
}

export function persistLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // ignore quota / private mode
  }
}

export function nextLanguage(language: Language): Language {
  return language === 'en' ? 'es' : 'en'
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: readStoredLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
  if (isLanguage(language)) {
    persistLanguage(language)
  }
})

export default i18n
