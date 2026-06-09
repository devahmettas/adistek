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
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-panel">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">
            Adistek
          </p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
            {t('language.gateTitle')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {t('language.gateSubtitle')}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleSelect(lang)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-center transition hover:border-brand-300 hover:bg-brand-50 active:scale-[0.98]"
            >
              <span className="text-3xl" aria-hidden>
                {LANGUAGE_FLAGS[lang]}
              </span>
              <span className="text-sm font-bold text-slate-900">{LANGUAGE_LABELS[lang]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
