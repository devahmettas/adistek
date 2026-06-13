import Button from '../Button'
import { useJewelrySaleCart } from '../../context/JewelrySaleCartContext'

export default function JewelrySaleCartButton() {
  const { itemCount, openCheckout } = useJewelrySaleCart()

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={openCheckout}
      className="relative"
      aria-label={`Satış sepeti, ${itemCount} ürün`}
    >
      <span className="mr-1.5">🛒</span>
      Sepet
      {itemCount > 0 && (
        <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {itemCount}
        </span>
      )}
    </Button>
  )
}
