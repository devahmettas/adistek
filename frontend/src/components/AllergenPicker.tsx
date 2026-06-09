import { ALLERGENS } from '../constants/allergens'
import type { AllergenKey } from '../constants/allergens'
import AllergenIcon from './menu/AllergenIcon'

interface AllergenPickerProps {
  value: AllergenKey[]
  onChange: (value: AllergenKey[]) => void
}

export default function AllergenPicker({ value, onChange }: AllergenPickerProps) {
  const toggle = (key: AllergenKey) => {
    if (value.includes(key)) {
      onChange(value.filter((item) => item !== key))
      return
    }
    onChange([...value, key])
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">Alerjen Bilgileri</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {ALLERGENS.map((allergen) => {
          const selected = value.includes(allergen.key)

          return (
            <button
              key={allergen.key}
              type="button"
              onClick={() => toggle(allergen.key)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                selected
                  ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <AllergenIcon allergen={allergen.key} className="h-4 w-4" />
              <span>{allergen.shortLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
