import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60'
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
