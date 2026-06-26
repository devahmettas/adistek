import { InputHTMLAttributes, useState } from 'react'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export default function PasswordField({ label, id, className = '', ...props }: PasswordFieldProps) {
  const inputId = id || props.name
  const [visible, setVisible] = useState(false)

  return (
    <div className="auth-field">
      <label htmlFor={inputId} className="auth-field__label">
        {label}
      </label>
      <div className="auth-field__wrap">
        <span className="auth-field__icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path strokeLinecap="round" d="M8 11V8a4 4 0 1 1 8 0v3" />
          </svg>
        </span>
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`auth-field__input auth-field__input--icon ${className}`}
          {...props}
        />
        <button
          type="button"
          className="auth-field__toggle"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" d="M3 3l18 18M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58M9.88 5.1A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 8-1.02 2.84-3.14 5.15-5.88 6.5M6.11 6.11C4.06 7.45 2.44 9.58 1 12c1.73 4.89 6 8 11 8 1.38 0 2.7-.24 3.9-.68" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
