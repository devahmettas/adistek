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
    <div className="flex flex-col items-center gap-3">
      <div
        className={`h-8 w-8 animate-spin rounded-full border-2 border-t-transparent ${
          dark ? 'border-brand-400' : 'border-brand-600'
        }`}
      />
      <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          dark ? 'bg-slate-950' : 'bg-slate-50'
        }`}
      >
        {content}
      </div>
    )
  }

  return <div className="py-8">{content}</div>
}
