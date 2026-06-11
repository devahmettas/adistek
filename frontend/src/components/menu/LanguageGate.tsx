import { useTranslation } from 'react-i18next'
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  setMenuLanguage,
  type MenuLanguage,
} from '../../i18n'

interface LanguageGateProps {
  onSelect: () => void
}

const LANGUAGE_FLAGS: Record<MenuLanguage, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  de: '🇩🇪',
  ru: '🇷🇺',
}

export default function LanguageGate({ onSelect }: LanguageGateProps) {
  const { t } = useTranslation()

  const handleSelect = (lang: MenuLanguage) => {
    setMenuLanguage(lang)
    onSelect()
  }

  return (
    <div className="menu-theme menu-gate">
      <div className="menu-page-bg" aria-hidden />
      <div className="menu-gate__glow menu-gate__glow--top" aria-hidden />
      <div className="menu-gate__glow menu-gate__glow--bottom" aria-hidden />

      <div className="menu-gate__card">
        <div className="menu-gate__emblem" aria-hidden>
          <span />
          <span />
          <span />
        </div>

        <p className="menu-gate__brand">Adistek</p>
        <h1 className="menu-gate__title">{t('language.gateTitle')}</h1>
        <p className="menu-gate__subtitle">{t('language.gateSubtitle')}</p>

        <div className="menu-gate__grid">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleSelect(lang)}
              className="menu-gate__lang"
            >
              <span className="menu-gate__flag" aria-hidden>
                {LANGUAGE_FLAGS[lang]}
              </span>
              <span className="menu-gate__lang-label">{LANGUAGE_LABELS[lang]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
