import { InputHTMLAttributes } from 'react'

interface EmailFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function EmailField({ label, id, className = '', ...props }: EmailFieldProps) {
  const inputId = id || props.name

  return (
    <div className="auth-field">
      <label htmlFor={inputId} className="auth-field__label">
        {label}
      </label>
      <div className="auth-field__wrap">
        <span className="auth-field__icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path strokeLinecap="round" d="m3 7 9 6 9-6" />
          </svg>
        </span>
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          className={`auth-field__input auth-field__input--icon ${className}`}
          {...props}
        />
      </div>
    </div>
  )
}
