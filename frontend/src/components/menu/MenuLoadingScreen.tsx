interface MenuLoadingScreenProps {
  label?: string
}

export default function MenuLoadingScreen({ label = 'Menü yükleniyor...' }: MenuLoadingScreenProps) {
  return (
    <div className="menu-theme menu-loading">
      <div className="menu-loading__glow menu-loading__glow--left" />
      <div className="menu-loading__glow menu-loading__glow--right" />
      <div className="menu-loading__content">
        <div className="menu-loading__emblem" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <p className="menu-loading__label">{label}</p>
      </div>
    </div>
  )
}
