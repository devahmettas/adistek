import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { JewelryProduct } from '../api/jeweler'

export interface JewelrySaleCartLine {
  id: string
  product_id: number
  product_name: string
  weight_gram: number
  labor_cost: number
  karat: number
  catalog_price: number
  purchase_price: number
  category_name?: string
  stock_quantity: number
  quantity: number
  unit_price: number
  image_path: string | null
}

interface AddCartItemInput {
  product: JewelryProduct
  quantity: number
  unit_price: number
  payment_method?: string
}

interface JewelrySaleCartContextValue {
  items: JewelrySaleCartLine[]
  itemCount: number
  saleVersion: number
  saleMessage: string
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  isCheckoutOpen: boolean
  openCheckout: () => void
  closeCheckout: () => void
  addItem: (input: AddCartItemInput) => string | null
  updateItem: (id: string, patch: Partial<Pick<JewelrySaleCartLine, 'quantity' | 'unit_price'>>) => string | null
  removeItem: (id: string) => void
  clearCart: () => void
  getReservedQuantity: (productId: number, excludeLineId?: string) => number
  notifySaleCompleted: (message?: string) => void
}

const JewelrySaleCartContext = createContext<JewelrySaleCartContextValue | null>(null)

function createLineId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getReservedQuantity(
  items: JewelrySaleCartLine[],
  productId: number,
  excludeLineId?: string,
): number {
  return items
    .filter((item) => item.product_id === productId && item.id !== excludeLineId)
    .reduce((sum, item) => sum + item.quantity, 0)
}

function validateQuantity(
  items: JewelrySaleCartLine[],
  productId: number,
  stockQuantity: number,
  quantity: number,
  excludeLineId?: string,
): string | null {
  const reserved = getReservedQuantity(items, productId, excludeLineId)
  if (quantity < 1) {
    return 'Adet en az 1 olmalı.'
  }
  if (reserved + quantity > stockQuantity) {
    const available = Math.max(0, stockQuantity - reserved)
    return available > 0
      ? `Yetersiz stok. Sepete en fazla ${available} adet eklenebilir.`
      : 'Bu ürün için stok kalmadı veya sepette zaten mevcut.'
  }
  return null
}

export function JewelrySaleCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<JewelrySaleCartLine[]>([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [saleVersion, setSaleVersion] = useState(0)
  const [saleMessage, setSaleMessage] = useState('Satış yapıldı.')

  const getReservedQuantityForProduct = useCallback(
    (productId: number, excludeLineId?: string) => getReservedQuantity(items, productId, excludeLineId),
    [items],
  )

  const addItem = useCallback((input: AddCartItemInput): string | null => {
    const { product, quantity, unit_price, payment_method } = input
    const qty = Math.max(1, quantity)

    if (payment_method) {
      setPaymentMethod(payment_method)
    }

    const stockError = validateQuantity(items, product.id, product.stock_quantity, qty)
    if (stockError) {
      return stockError
    }

    const existing = items.find(
      (item) => item.product_id === product.id && item.unit_price === unit_price,
    )

    if (existing) {
      const mergedQty = existing.quantity + qty
      const mergeError = validateQuantity(items, product.id, product.stock_quantity, mergedQty, existing.id)
      if (mergeError) {
        return mergeError
      }

      setItems((current) => current.map((item) => (
        item.id === existing.id
          ? { ...item, quantity: mergedQty }
          : item
      )))
      return null
    }

    setItems((current) => [
      ...current,
      {
        id: createLineId(),
        product_id: product.id,
        product_name: product.name,
        weight_gram: Number(product.weight_gram),
        labor_cost: Number(product.labor_cost),
        karat: product.karat ?? 22,
        catalog_price: Number(product.sale_price),
        purchase_price: Number(product.purchase_price) || 0,
        category_name: product.category?.name,
        stock_quantity: product.stock_quantity,
        quantity: qty,
        unit_price,
        image_path: product.image_path,
      },
    ])

    return null
  }, [items])

  const updateItem = useCallback((
    id: string,
    patch: Partial<Pick<JewelrySaleCartLine, 'quantity' | 'unit_price'>>,
  ): string | null => {
    const target = items.find((item) => item.id === id)
    if (!target) {
      return 'Sepet kalemi bulunamadı.'
    }

    const nextQuantity = patch.quantity ?? target.quantity
    const nextUnitPrice = patch.unit_price ?? target.unit_price

    if (patch.quantity !== undefined) {
      const stockError = validateQuantity(
        items,
        target.product_id,
        target.stock_quantity,
        nextQuantity,
        id,
      )
      if (stockError) {
        return stockError
      }
    }

    if (nextUnitPrice < 0) {
      return 'Geçerli bir satış fiyatı girin.'
    }

    setItems((current) => current.map((item) => (
      item.id === id
        ? { ...item, quantity: nextQuantity, unit_price: nextUnitPrice }
        : item
    )))

    return null
  }, [items])

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setPaymentMethod('cash')
  }, [])

  const openCheckout = useCallback(() => {
    setIsCheckoutOpen(true)
  }, [])

  const closeCheckout = useCallback(() => {
    setIsCheckoutOpen(false)
  }, [])

  const notifySaleCompleted = useCallback((message = 'Satış yapıldı.') => {
    setSaleMessage(message)
    setSaleVersion((value) => value + 1)
  }, [])

  const value = useMemo<JewelrySaleCartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    saleVersion,
    saleMessage,
    paymentMethod,
    setPaymentMethod,
    isCheckoutOpen,
    openCheckout,
    closeCheckout,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    getReservedQuantity: getReservedQuantityForProduct,
    notifySaleCompleted,
  }), [
    items,
    saleVersion,
    saleMessage,
    paymentMethod,
    isCheckoutOpen,
    openCheckout,
    closeCheckout,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    getReservedQuantityForProduct,
    notifySaleCompleted,
  ])

  return (
    <JewelrySaleCartContext.Provider value={value}>
      {children}
    </JewelrySaleCartContext.Provider>
  )
}

export function useJewelrySaleCart(): JewelrySaleCartContextValue {
  const context = useContext(JewelrySaleCartContext)
  if (!context) {
    throw new Error('useJewelrySaleCart must be used within JewelrySaleCartProvider')
  }
  return context
}
