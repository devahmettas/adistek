import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PublicMenuProduct } from '../../api/publicMenu'
import { getMenuLanguage } from '../../i18n'
import { formatMenuPrice } from '../../utils/formatMenuPrice'
import AllergenBadges from './AllergenBadges'
import CalorieBadge from './CalorieBadge'
import MenuProductImage from './MenuProductImage'

interface ProductOrderModalProps {
  product: PublicMenuProduct
  submitting: boolean
  onClose: () => void
  onConfirm: (quantity: number, note: string) => void
}

export default function ProductOrderModal({
  product,
  submitting,
  onClose,
  onConfirm,
}: ProductOrderModalProps) {
  const { t, i18n } = useTranslation()
  const language = getMenuLanguage() ?? (i18n.language as 'tr')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const hasCalories = product.calories != null && product.calories > 0
  const hasAllergens = product.allergens.length > 0
  const hasNutritionInfo = hasCalories || hasAllergens

  return (
    <div className="menu-modal-backdrop">
      <div className="menu-order-modal">
        <div className="menu-order-modal__scroll">
          <div className="menu-order-modal__hero">
            <MenuProductImage
              name={product.name}
              imageUrl={product.image_url}
              imagePath={product.image_path}
              variant="menu"
              eager
              className="menu-order-modal__image"
            />
            <div className="menu-order-modal__hero-shade" />
            <button
              type="button"
              onClick={onClose}
              className="menu-order-modal__close"
              aria-label={t('common.close')}
            >
              ×
            </button>
          </div>

          <div className="menu-order-modal__head">
            <h2 className="menu-order-modal__title">{product.name}</h2>
            <p className="menu-order-modal__price">{formatMenuPrice(product.price, language)}</p>

            {hasNutritionInfo && (
              <div className="menu-order-modal__nutrition">
                {hasCalories && (
                  <div className="menu-order-modal__nutrition-row">
                    <span>{t('common.calories')}</span>
                    <CalorieBadge calories={product.calories!} compact />
                  </div>
                )}
                {hasAllergens && (
                  <div className="menu-order-modal__nutrition-row">
                    <span>{t('common.allergens')}</span>
                    <AllergenBadges allergens={product.allergens} compact />
                  </div>
                )}
              </div>
            )}

            {product.description && (
              <p className="menu-order-modal__description">{product.description}</p>
            )}
          </div>

          <div className="menu-order-modal__form">
            <div>
              <label htmlFor="add-quantity" className="menu-order-modal__label">
                {t('common.quantity')}
              </label>
              <div className="menu-qty-control">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="menu-qty-control__btn menu-qty-control__btn--ghost"
                >
                  −
                </button>
                <span className="menu-qty-control__value">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                  className="menu-qty-control__btn menu-qty-control__btn--accent"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="add-note" className="menu-order-modal__label">
                {t('order.orderNote')}
              </label>
              <textarea
                id="add-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t('order.orderNotePlaceholder')}
                rows={3}
                maxLength={255}
                className="menu-input"
              />
            </div>
          </div>

          <div className="menu-order-modal__actions">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="menu-btn menu-btn--ghost"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => onConfirm(quantity, note)}
              disabled={submitting}
              className="menu-btn menu-btn--primary"
            >
              {t('order.addToCart')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
