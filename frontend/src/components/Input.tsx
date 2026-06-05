import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function Input({ label, id, className = '', ...props }: InputProps) {
  const inputId = id || props.name

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`}
        {...props}
      />
    </div>
  )
}
