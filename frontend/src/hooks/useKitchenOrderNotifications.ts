import { useCallback, useEffect, useRef, useState } from 'react'
import type { KitchenOrder } from '../api/types'
import {
  playKitchenNotificationSound,
  unlockKitchenNotificationSound,
} from '../utils/kitchenNotificationSound'

export interface KitchenNotification {
  id: string
  tableName: string
  productName: string
  quantity: number
  note: string | null
}

function createNotificationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getPendingItems(orders: KitchenOrder[]) {
  return orders.flatMap((order) =>
    order.items
      .filter((item) => item.kitchen_status === 'pending')
      .map((item) => ({
        pivotId: item.pivot_id,
        tableName: order.table_name,
        productName: item.product_name,
        quantity: item.quantity,
        note: item.note,
      })),
  )
}

function showBrowserNotification(items: KitchenNotification[]): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return
  }

  if (items.length === 1) {
    const item = items[0]
    const body = [
      item.quantity > 1 ? `${item.quantity} adet` : null,
      item.note ? `Not: ${item.note}` : null,
    ]
      .filter(Boolean)
      .join(' · ')

    new Notification(`Yeni sipariş · ${item.tableName}`, {
      body: body ? `${item.productName} · ${body}` : item.productName,
      tag: `kitchen-order-${item.id}`,
    })

    return
  }

  new Notification(`${items.length} yeni sipariş`, {
    body: items.map((item) => `${item.tableName}: ${item.productName}`).join('\n'),
    tag: `kitchen-order-batch-${Date.now()}`,
  })
}

export function useKitchenOrderNotifications(orders: KitchenOrder[]) {
  const knownPendingIdsRef = useRef<Set<number> | null>(null)
  const [notifications, setNotifications] = useState<KitchenNotification[]>([])
  const [needsSoundUnlock, setNeedsSoundUnlock] = useState(false)

  const dismissNotification = useCallback((id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id))
  }, [])

  const enableSound = useCallback(async () => {
    await unlockKitchenNotificationSound()
    const played = await playKitchenNotificationSound()
    if (played) {
      setNeedsSoundUnlock(false)
    }
  }, [])

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    const pendingItems = getPendingItems(orders)
    const currentIds = new Set(pendingItems.map((item) => item.pivotId))

    if (knownPendingIdsRef.current === null) {
      knownPendingIdsRef.current = currentIds
      return
    }

    const newItems = pendingItems.filter((item) => !knownPendingIdsRef.current!.has(item.pivotId))

    if (newItems.length > 0) {
      const incoming = newItems.map((item) => ({
        id: createNotificationId(),
        tableName: item.tableName,
        productName: item.productName,
        quantity: item.quantity,
        note: item.note,
      }))

      setNotifications((current) => [...incoming, ...current].slice(0, 8))
      showBrowserNotification(incoming)

      void playKitchenNotificationSound().then((played) => {
        if (!played) {
          setNeedsSoundUnlock(true)
        }
      })
    }

    knownPendingIdsRef.current = currentIds
  }, [orders])

  return {
    notifications,
    dismissNotification,
    needsSoundUnlock,
    enableSound,
  }
}
