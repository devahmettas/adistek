import { useCallback, useEffect, useRef, useState } from 'react'
import type { RestaurantTable } from '../api/types'
import {
  playKitchenNotificationSound,
  unlockKitchenNotificationSound,
} from '../utils/kitchenNotificationSound'

export interface WaiterReadyNotification {
  id: string
  tableId: number
  tableName: string
  productName: string
  quantity: number
  note: string | null
}

function createNotificationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function isRelevantTable(table: RestaurantTable, waiterId?: number): boolean {
  if (!waiterId) {
    return true
  }

  if (!table.assigned_waiter_id) {
    return true
  }

  return table.assigned_waiter_id === waiterId
}

function getReadyItems(tables: RestaurantTable[], waiterId?: number) {
  return tables.flatMap((table) => {
    if (!isRelevantTable(table, waiterId)) {
      return []
    }

    return (table.products ?? [])
      .filter((product) => product.pivot?.kitchen_status === 'ready')
      .map((product) => ({
        pivotId: product.pivot!.id,
        tableId: table.id,
        tableName: table.name,
        productName: product.name,
        quantity: product.pivot?.quantity ?? 1,
        note: product.pivot?.note ?? null,
      }))
  })
}

function showBrowserNotification(items: WaiterReadyNotification[]): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return
  }

  if (items.length === 1) {
    const item = items[0]

    new Notification(`Sipariş hazır · ${item.tableName}`, {
      body: `${item.productName} masaya teslim edilmeye hazır.`,
      tag: `waiter-ready-${item.id}`,
    })

    return
  }

  new Notification(`${items.length} sipariş hazır`, {
    body: items
      .map((item) => `${item.tableName}: ${item.productName} masaya teslim edilmeye hazır`)
      .join('\n'),
    tag: `waiter-ready-batch-${Date.now()}`,
  })
}

export function useWaiterReadyNotifications(tables: RestaurantTable[], waiterId?: number) {
  const knownReadyIdsRef = useRef<Set<number> | null>(null)
  const [notifications, setNotifications] = useState<WaiterReadyNotification[]>([])
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
    const readyItems = getReadyItems(tables, waiterId)
    const currentIds = new Set(readyItems.map((item) => item.pivotId))

    if (knownReadyIdsRef.current === null) {
      knownReadyIdsRef.current = currentIds
      return
    }

    const newItems = readyItems.filter((item) => !knownReadyIdsRef.current!.has(item.pivotId))

    if (newItems.length > 0) {
      const incoming = newItems.map((item) => ({
        id: createNotificationId(),
        tableId: item.tableId,
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

    knownReadyIdsRef.current = currentIds
  }, [tables, waiterId])

  return {
    notifications,
    dismissNotification,
    needsSoundUnlock,
    enableSound,
  }
}
