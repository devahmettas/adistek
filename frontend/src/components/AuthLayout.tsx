import { ReactNode } from 'react'
import AuthBrandPanel from './AuthBrandPanel'

interface AuthLayoutProps {
  title: string
  description: string
  badge?: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthLayout({ title, description, badge, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-split">
      <aside className="auth-split__brand-desktop">
        <AuthBrandPanel logoSize="lg" />
      </aside>

      <div className="auth-split__main">
        <div className="auth-split__mobile-hero lg:hidden">
          <AuthBrandPanel logoSize="md" compact />
        </div>

        <div className="auth-split__form">
          <div className="auth-split__form-inner">
            {badge && (
              <span className="mb-2 inline-flex rounded-full border border-brand-200/60 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
                {badge}
              </span>
            )}
            <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>

            {children}

            {footer && <div className="text-sm text-slate-500">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
