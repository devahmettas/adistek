import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  getMenuLanguage,
  setMenuLanguage,
  type MenuLanguage,
} from '../../i18n'

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = (getMenuLanguage() ?? i18n.language) as MenuLanguage

  const handleSelect = (lang: MenuLanguage) => {
    setMenuLanguage(lang)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-brand-300 hover:text-brand-800"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('language.switchLabel')}
      >
        <svg
          className="h-3.5 w-3.5 text-brand-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 5h12M9 3v2m4.5 9a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM21 19l-3-3m0 0l-3 3m3-3v6"
          />
        </svg>
        <span>{LANGUAGE_LABELS[current] ?? current.toUpperCase()}</span>
        <svg
          className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label={t('common.close')}
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute right-0 z-40 mt-2 min-w-[9rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <li key={lang}>
                <button
                  type="button"
                  role="option"
                  aria-selected={lang === current}
                  onClick={() => handleSelect(lang)}
                  className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition hover:bg-brand-50 ${
                    lang === current ? 'font-bold text-brand-800' : 'text-slate-700'
                  }`}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
