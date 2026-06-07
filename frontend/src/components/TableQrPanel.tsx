import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import type { RestaurantTable } from '../api/types'
import { getTableOrderUrl } from '../api/tableOrder'
import Button from './Button'

interface TableQrPanelProps {
  table: RestaurantTable
}

export default function TableQrPanel({ table }: TableQrPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const orderUrl = getTableOrderUrl(table.qr_token)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(orderUrl)
      window.alert('Masa sipariş linki kopyalandı.')
    } catch {
      window.prompt('Masa sipariş linkini kopyalayın:', orderUrl)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-amber-900">QR Sipariş</p>
        <Button type="button" variant="secondary" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Gizle' : 'QR Göster'}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-amber-100">
            <QRCodeSVG value={orderUrl} size={160} level="M" includeMargin />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-xs text-stone-600">
              Müşteriler bu QR kodu okutarak menüyü görür ve siparişlerini doğrudan mutfağa iletir.
            </p>
            <p className="break-all rounded-lg bg-white px-3 py-2 text-xs text-stone-700 ring-1 ring-amber-100">
              {orderUrl}
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/order/${table.qr_token}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-800"
              >
                Sayfayı Aç
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800 hover:bg-stone-50"
              >
                Linki Kopyala
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
