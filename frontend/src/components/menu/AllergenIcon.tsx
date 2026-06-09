import type { AllergenKey } from '../../constants/allergens'

interface AllergenIconProps {
  allergen: AllergenKey
  className?: string
}

export default function AllergenIcon({ allergen, className = 'h-4 w-4' }: AllergenIconProps) {
  const shared = `${className} shrink-0`

  switch (allergen) {
    case 'gluten':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <path d="M6 18c2-4 4-8 6-10 2 2 4 6 6 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 14h8M10 10h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'dairy':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <path d="M8 4h8l1 4v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8l1-4z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'eggs':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <ellipse cx="12" cy="13" rx="5" ry="7" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'fish':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <path d="M4 12c4-2 8-2 12 0 4 2 8 2 4 0-2 2-4 2-4-2-8-2-12 0z" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="8" cy="12" r="1" fill="currentColor" />
        </svg>
      )
    case 'nuts':
    case 'peanuts':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <path d="M12 4c3 2 5 5 5 8a5 5 0 01-10 0c0-3 2-6 5-8z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'soy':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <circle cx="8" cy="10" r="2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="14" cy="8" r="2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="14" r="2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="10" cy="16" r="2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      )
    case 'crustaceans':
    case 'mollusks':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <path d="M6 14c2-4 4-6 6-6s4 2 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 14l-2 4M16 14l2 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'sesame':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <circle cx="8" cy="10" r="1.2" fill="currentColor" />
          <circle cx="12" cy="8" r="1.2" fill="currentColor" />
          <circle cx="16" cy="10" r="1.2" fill="currentColor" />
          <circle cx="10" cy="14" r="1.2" fill="currentColor" />
          <circle cx="14" cy="14" r="1.2" fill="currentColor" />
        </svg>
      )
    case 'celery':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <path d="M12 4v16M9 8l3-2 3 2M9 12l3-2 3 2M9 16l3-2 3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'mustard':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <path d="M10 6h4l1 3H9l1-3zM9 9h6v10H9V9z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'sulfites':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <path d="M8 8h8v8H8z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'lupin':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <path d="M8 16c0-4 2-8 4-10 2 2 4 6 4 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
  }
}
