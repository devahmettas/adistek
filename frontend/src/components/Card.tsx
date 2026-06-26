import { ReactNode } from 'react'

interface CardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export default function Card({ title, description, children, className = '' }: CardProps) {
  return (
    <section className={`panel-surface p-5 sm:p-6 ${className}`}>
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  )
}
