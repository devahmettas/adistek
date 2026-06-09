import { useCallback, useEffect, useState } from 'react'
import type { PublicMenuSlide } from '../../api/publicMenu'
import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'

interface MenuHeroSliderProps {
  slides: PublicMenuSlide[]
  restaurantName: string
}

export default function MenuHeroSlider({ slides, restaurantName }: MenuHeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const goTo = useCallback(
    (index: number) => {
      if (slides.length === 0) {
        return
      }
      setActiveIndex((index + slides.length) % slides.length)
    },
    [slides.length],
  )

  useEffect(() => {
    if (slides.length <= 1 || isPaused) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [slides.length, isPaused])

  if (slides.length === 0) {
    return (
      <div className="menu-hero-fallback relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 px-6 py-12 text-white shadow-panel">
        <div className="menu-hero-glow pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="menu-hero-glow pointer-events-none absolute -bottom-8 left-8 h-32 w-32 rounded-full bg-brand-300/20 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-100">Dijital Menü</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">{restaurantName}</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-100">
          Lezzetleri keşfedin, alerjen ve kalori bilgileriyle güvenle seçim yapın.
        </p>
      </div>
    )
  }

  return (
    <div
      className="menu-slider relative overflow-hidden rounded-3xl shadow-panel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div
        className="menu-slider-track flex transition-transform duration-700 ease-out will-change-transform motion-reduce:transition-none"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((slide) => {
          const slideImage = resolveMenuAssetUrl(slide.image_url, slide.image_path)
          const content = (
            <div className="relative h-56 w-full shrink-0 sm:h-64">
              {slideImage ? (
                <img
                  src={slideImage}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                  loading={slide.id === slides[0]?.id ? 'eager' : 'lazy'}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-brand-700 to-brand-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                {slide.subtitle && (
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
                    {slide.subtitle}
                  </p>
                )}
                <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{slide.title}</h2>
              </div>
            </div>
          )

          if (slide.link_url) {
            return (
              <a
                key={slide.id}
                href={slide.link_url}
                target="_blank"
                rel="noreferrer"
                className="block w-full shrink-0"
              >
                {content}
              </a>
            )
          }

          return (
            <div key={slide.id} className="w-full shrink-0">
              {content}
            </div>
          )
        })}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Önceki slayt"
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Sonraki slayt"
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
          >
            ›
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Slayt ${index + 1}`}
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all ${
                  index === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
