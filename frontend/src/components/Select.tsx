import { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string | number; label: string }[]
}

export default function Select({ label, id, options, className = '', ...props }: SelectProps) {
  const selectId = id || props.name

  return (
    <div className="space-y-1">
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
