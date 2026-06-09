import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './locales/de.json'
import en from './locales/en.json'
import ru from './locales/ru.json'
import tr from './locales/tr.json'

export const MENU_LANG_STORAGE_KEY = 'adistek-menu-lang'

export const SUPPORTED_LANGUAGES = ['tr', 'en', 'de', 'ru'] as const
export type MenuLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<MenuLanguage, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  ru: 'Русский',
}

export const LANGUAGE_LOCALES: Record<MenuLanguage, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
  ru: 'ru-RU',
}

function isMenuLanguage(value: string | null): value is MenuLanguage {
  return value !== null && SUPPORTED_LANGUAGES.includes(value as MenuLanguage)
}

export function getMenuLanguage(): MenuLanguage | null {
  const saved = localStorage.getItem(MENU_LANG_STORAGE_KEY)
  return isMenuLanguage(saved) ? saved : null
}

export function hasMenuLanguageSelected(): boolean {
  return getMenuLanguage() !== null
}

export function setMenuLanguage(lang: MenuLanguage): void {
  localStorage.setItem(MENU_LANG_STORAGE_KEY, lang)
  void i18n.changeLanguage(lang)
}

const savedLanguage = getMenuLanguage()

void i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
    de: { translation: de },
    ru: { translation: ru },
  },
  lng: savedLanguage ?? 'tr',
  fallbackLng: 'tr',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
