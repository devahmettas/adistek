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
    <div className="menu-lang-switcher">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="menu-lang-switcher__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('language.switchLabel')}
      >
        <svg
          className="menu-lang-switcher__icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.8 3.4 5.8 3.4 9s-1.2 6.2-3.4 9c-2.2-2.8-3.4-5.8-3.4-9s1.2-6.2 3.4-9z"
          />
        </svg>
        <span>{LANGUAGE_LABELS[current] ?? current.toUpperCase()}</span>
        <svg
          className={`menu-lang-switcher__chevron ${open ? 'menu-lang-switcher__chevron--open' : ''}`}
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
            className="menu-lang-switcher__backdrop"
            aria-label={t('common.close')}
            onClick={() => setOpen(false)}
          />
          <ul role="listbox" className="menu-lang-switcher__menu">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <li key={lang}>
                <button
                  type="button"
                  role="option"
                  aria-selected={lang === current}
                  onClick={() => handleSelect(lang)}
                  className={`menu-lang-switcher__option ${
                    lang === current ? 'menu-lang-switcher__option--active' : ''
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
