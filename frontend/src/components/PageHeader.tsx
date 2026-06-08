import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  dark?: boolean
}

export default function PageHeader({ title, description, actions, dark = false }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className={dark ? 'text-2xl font-bold tracking-tight text-white' : 'page-title'}>
          {title}
        </h1>
        {description && (
          <p className={dark ? 'mt-1 max-w-2xl text-sm text-slate-400' : 'page-subtitle'}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
