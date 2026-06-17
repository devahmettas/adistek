import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  dark?: boolean
}

export default function PageHeader({ title, description, actions, dark = false }: PageHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className={dark ? 'text-xl font-bold tracking-tight text-white sm:text-2xl' : 'page-title'}>
          {title}
        </h1>
        {description && (
          <p className={dark ? 'mt-1 max-w-2xl text-sm text-slate-400' : 'page-subtitle'}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
