import { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

export default function Textarea({ label, id, className = '', ...props }: TextareaProps) {
  const textareaId = id || props.name

  return (
    <div className="space-y-1.5">
      <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea id={textareaId} className={`input-field resize-y ${className}`} {...props} />
    </div>
  )
}
