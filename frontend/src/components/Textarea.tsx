import { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

export default function Textarea({ label, id, className = '', ...props }: TextareaProps) {
  const textareaId = id || props.name

  return (
    <div className="space-y-1">
      <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={textareaId}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`}
        {...props}
      />
    </div>
  )
}
