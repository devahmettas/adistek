interface NavIconProps {
  name: string
  className?: string
}

const iconClass = 'h-[18px] w-[18px] shrink-0'

export default function NavIcon({ name, className = '' }: NavIconProps) {
  const cls = `${iconClass} ${className}`

  switch (name) {
    case '⌂':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5Z" />
        </svg>
      )
    case '◫':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="5" width="8" height="8" rx="1.5" />
          <rect x="13" y="5" width="8" height="8" rx="1.5" />
          <rect x="3" y="15" width="8" height="6" rx="1.5" />
          <rect x="13" y="15" width="8" height="6" rx="1.5" />
        </svg>
      )
    case '▤':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path strokeLinecap="round" d="M4 19V5M4 19h16M8 15v4M12 11v8M16 7v12" />
        </svg>
      )
    case '◷':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 7v5l3 2" />
        </svg>
      )
    case '▦':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case '▣':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path strokeLinecap="round" d="M8 9h8M8 13h5" />
        </svg>
      )
    case '◆':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path strokeLinejoin="round" d="M12 3 20 12l-8 9-8-9 8-9Z" />
        </svg>
      )
    case '⇅':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V8m0 0-3 3m3-3 3 3M17 8v8m0 0 3-3m-3 3-3-3" />
        </svg>
      )
    case '☰':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      )
    case '▧':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path strokeLinecap="round" d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      )
    case '◉':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="8" r="3.5" />
          <path strokeLinecap="round" d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" />
        </svg>
      )
    case '▥':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path strokeLinecap="round" d="M4 7h2v10H4zM8 7h2v10H8zM12 7h2v10h-2zM16 7h4v10h-4z" />
        </svg>
      )
    case '★':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path strokeLinejoin="round" d="m12 3 2.2 5.2L20 9l-4.2 3.6L17 18l-5-3-5 3 1.2-5.4L4 9l5.8-.8L12 3Z" />
        </svg>
      )
    case '⚙':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )
    case '⬚':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="5" y="5" width="14" height="14" rx="2" strokeDasharray="3 3" />
        </svg>
      )
    case '◎':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case '🔒':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path strokeLinecap="round" d="M8 11V8a4 4 0 1 1 8 0v3" />
        </svg>
      )
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="2" />
        </svg>
      )
  }
}
