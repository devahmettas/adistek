interface LoadingStateProps {
  label?: string
  fullScreen?: boolean
  dark?: boolean
}

export default function LoadingState({
  label = 'Yükleniyor...',
  fullScreen = false,
  dark = false,
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-10 w-10" role="status" aria-label={label}>
        <div
          className={`absolute inset-0 rounded-full border-2 ${
            dark ? 'border-white/10' : 'border-slate-200'
          }`}
        />
        <div
          className={`absolute inset-0 animate-spin rounded-full border-2 border-t-transparent ${
            dark ? 'border-brand-400' : 'border-brand-600'
          }`}
        />
      </div>
      <p className={`text-sm font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          dark ? 'bg-slate-950' : 'app-canvas'
        }`}
      >
        {content}
      </div>
    )
  }

  return <div className="py-10">{content}</div>
}
