import { InputHTMLAttributes } from 'react'
import Input from './Input'
import { formatMoneyInputWhileTyping } from '../utils/moneyInput'

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label: string
  value: string
  onValueChange: (value: string) => void
}

export default function MoneyInput({
  label,
  value,
  onValueChange,
  className = '',
  placeholder = '0',
  onFocus,
  ...props
}: MoneyInputProps) {
  return (
    <Input
      label={label}
      type="text"
      inputMode="decimal"
      pattern="[0-9.,]*"
      autoComplete="off"
      enterKeyHint="done"
      value={value}
      onChange={(event) => onValueChange(formatMoneyInputWhileTyping(event.target.value))}
      onFocus={(event) => {
        onFocus?.(event)
        window.requestAnimationFrame(() => {
          event.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })
        })
      }}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  )
}
