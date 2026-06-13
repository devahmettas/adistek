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
  ...props
}: MoneyInputProps) {
  return (
    <Input
      label={label}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value}
      onChange={(event) => onValueChange(formatMoneyInputWhileTyping(event.target.value))}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  )
}
