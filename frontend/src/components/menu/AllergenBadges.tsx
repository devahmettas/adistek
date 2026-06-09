import { useTranslation } from 'react-i18next'
import { ALLERGEN_MAP } from '../../constants/allergens'
import type { AllergenKey } from '../../constants/allergens'
import AllergenIcon from './AllergenIcon'

interface AllergenBadgesProps {
  allergens: AllergenKey[]
  compact?: boolean
}

export default function AllergenBadges({ allergens, compact = false }: AllergenBadgesProps) {
  const { t } = useTranslation()

  if (!allergens.length) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'mt-3'}`}>
      {allergens.map((key) => {
        const definition = ALLERGEN_MAP[key]
        if (!definition) {
          return null
        }

        const label = t(`allergens.${key}.label`)
        const shortLabel = t(`allergens.${key}.short`)

        return (
          <span
            key={key}
            title={label}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${definition.color}`}
          >
            <AllergenIcon allergen={key} className="h-3.5 w-3.5" />
            {compact ? shortLabel : label}
          </span>
        )
      })}
    </div>
  )
}
