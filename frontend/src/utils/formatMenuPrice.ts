import { LANGUAGE_LOCALES, type MenuLanguage } from '../i18n'

export function formatMenuPrice(price: string | number, language: MenuLanguage = 'tr'): string {
  const amount = typeof price === 'string' ? Number(price) : price

  return new Intl.NumberFormat(LANGUAGE_LOCALES[language], {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
