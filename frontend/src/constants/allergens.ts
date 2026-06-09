export type AllergenKey =
  | 'gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soy'
  | 'dairy'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulfites'
  | 'lupin'
  | 'mollusks'

export interface AllergenDefinition {
  key: AllergenKey
  label: string
  shortLabel: string
  color: string
}

export const ALLERGENS: AllergenDefinition[] = [
  { key: 'gluten', label: 'Gluten', shortLabel: 'Gluten', color: 'bg-amber-100 text-amber-800' },
  { key: 'crustaceans', label: 'Kabuklu Deniz Ürünleri', shortLabel: 'Kabuklu', color: 'bg-orange-100 text-orange-800' },
  { key: 'eggs', label: 'Yumurta', shortLabel: 'Yumurta', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'fish', label: 'Balık', shortLabel: 'Balık', color: 'bg-sky-100 text-sky-800' },
  { key: 'peanuts', label: 'Fıstık', shortLabel: 'Fıstık', color: 'bg-amber-100 text-amber-900' },
  { key: 'soy', label: 'Soya', shortLabel: 'Soya', color: 'bg-lime-100 text-lime-800' },
  { key: 'dairy', label: 'Süt', shortLabel: 'Süt', color: 'bg-blue-100 text-blue-800' },
  { key: 'nuts', label: 'Kuruyemiş', shortLabel: 'Kuruyemiş', color: 'bg-stone-100 text-stone-800' },
  { key: 'celery', label: 'Kereviz', shortLabel: 'Kereviz', color: 'bg-green-100 text-green-800' },
  { key: 'mustard', label: 'Hardal', shortLabel: 'Hardal', color: 'bg-yellow-100 text-yellow-900' },
  { key: 'sesame', label: 'Susam', shortLabel: 'Susam', color: 'bg-stone-100 text-stone-700' },
  { key: 'sulfites', label: 'Sülfit', shortLabel: 'Sülfit', color: 'bg-purple-100 text-purple-800' },
  { key: 'lupin', label: 'Acı Bakla', shortLabel: 'Acı Bakla', color: 'bg-rose-100 text-rose-800' },
  { key: 'mollusks', label: 'Yumuşakçalar', shortLabel: 'Yumuşakça', color: 'bg-cyan-100 text-cyan-800' },
]

export const ALLERGEN_MAP = Object.fromEntries(
  ALLERGENS.map((item) => [item.key, item]),
) as Record<AllergenKey, AllergenDefinition>
