import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PublicMenuSlide } from '../../api/publicMenu'
import { MENU_HERO_FALLBACK_IMAGES } from '../../constants/menuImagery'
import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'

interface MenuHeroSliderProps {
  slides: PublicMenuSlide[]
  restaurantName: string
}

function HeroFrame({ children }: { children: ReactNode }) {
  return <div className="menu-hero-frame">{children}</div>
}

function HeroSlideVisual({
  imageSrc,
  alt,
  eager = false,
}: {
  imageSrc: string
  alt: string
  eager?: boolean
}) {
  return (
    <>
      <img
        src={imageSrc}
        alt={alt}
        className="menu-hero__image"
        loading={eager ? 'eager' : 'lazy'}
      />
      <div className="menu-hero__overlay" />
    </>
  )
}

export default function MenuHeroSlider({ slides, restaurantName }: MenuHeroSliderProps) {
  const { t } = useTranslation()
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
    }, 6000)

    return () => window.clearInterval(timer)
  }, [slides.length, isPaused])

  if (slides.length === 0) {
    const fallbackImage = MENU_HERO_FALLBACK_IMAGES[0]

    return (
      <HeroFrame>
        <div className="menu-hero menu-hero--fallback">
          <HeroSlideVisual imageSrc={fallbackImage} alt="" />
          <div className="menu-hero__content menu-hero__content--centered">
            <p className="menu-hero__kicker">{t('hero.digitalMenu')}</p>
            <h2 className="menu-hero__headline">{restaurantName}</h2>
            <p className="menu-hero__lede">{t('hero.fallbackDescription')}</p>
          </div>
        </div>
      </HeroFrame>
    )
  }

  return (
    <HeroFrame>
      <div
        className="menu-hero menu-hero--slider"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        <div
          className="menu-slider-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, index) => {
            const slideImage = resolveMenuAssetUrl(slide.image_url, slide.image_path)
            const imageSrc =
              slideImage ?? MENU_HERO_FALLBACK_IMAGES[slide.id % MENU_HERO_FALLBACK_IMAGES.length]

            const content = (
              <div className="menu-hero__slide">
                <HeroSlideVisual imageSrc={imageSrc} alt={slide.title} eager={index === 0} />
                <div className="menu-hero__content">
                  {slide.subtitle && <p className="menu-hero__kicker">{slide.subtitle}</p>}
                  <h2 className="menu-hero__headline">{slide.title}</h2>
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
                  className="menu-hero__link"
                >
                  {content}
                </a>
              )
            }

            return (
              <div key={slide.id} className="menu-hero__link">
                {content}
              </div>
            )
          })}
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label={t('hero.prevSlide')}
              onClick={() => goTo(activeIndex - 1)}
              className="menu-hero__nav menu-hero__nav--prev"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label={t('hero.nextSlide')}
              onClick={() => goTo(activeIndex + 1)}
              className="menu-hero__nav menu-hero__nav--next"
            >
              ›
            </button>

            <div className="menu-hero__dots">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={t('hero.slide', { number: index + 1 })}
                  onClick={() => goTo(index)}
                  className={`menu-hero__dot ${index === activeIndex ? 'menu-hero__dot--active' : ''}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </HeroFrame>
  )
}
