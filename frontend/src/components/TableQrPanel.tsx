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
    <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-900">QR Sipariş</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Gizle' : 'QR Göster'}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card">
            <QRCodeSVG value={orderUrl} size={160} level="M" includeMargin />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-xs leading-relaxed text-slate-600">
              Müşteriler bu QR kodu okutarak menüyü görür. Sipariş verebilmeleri için önce masayı
              aktif (dolu) duruma getirmeniz gerekir.
            </p>
            <p className="break-all rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
              {orderUrl}
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={`/order/${table.qr_token}`} target="_blank" rel="noreferrer">
                <Button size="sm">Sayfayı Aç</Button>
              </a>
              <Button type="button" variant="secondary" size="sm" onClick={copyLink}>
                Linki Kopyala
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
