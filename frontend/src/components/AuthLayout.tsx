import { ReactNode } from 'react'
import BrandLogo from './BrandLogo'

interface AuthLayoutProps {
  title: string
  description: string
  badge?: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthLayout({ title, description, badge, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-clip px-4 py-8 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-brand-50" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-slate-200/50 blur-3xl" />

      <div className="relative w-full min-w-0 max-w-md space-y-6">
        <div className="text-center">
          <div className="mb-5 flex justify-center">
            <BrandLogo size="lg" />
          </div>
          {badge && (
            <span className="mb-3 inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
              {badge}
            </span>
          )}
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
        </div>

        {children}

        {footer && <div className="text-center text-sm text-slate-500">{footer}</div>}
      </div>
    </div>
  )
}
