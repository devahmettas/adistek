import { useState } from 'react'
import Button from '../Button'
import {
  isKitchenAutoPrintEnabled,
  printKitchenTicketSample,
  setKitchenAutoPrintEnabled,
} from '../../utils/kitchenTicketPrint'

interface KitchenPrintSettingsProps {
  restaurantName?: string
}

export default function KitchenPrintSettings({ restaurantName }: KitchenPrintSettingsProps) {
  const [autoPrint, setAutoPrint] = useState(isKitchenAutoPrintEnabled)
  const [testing, setTesting] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const handleToggle = () => {
    const next = !autoPrint
    setAutoPrint(next)
    setKitchenAutoPrintEnabled(next)
  }

  const handleTestPrint = async () => {
    setTesting(true)
    try {
      await printKitchenTicketSample(restaurantName)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">Mutfak Yazıcısı</p>
        <p className="mt-1 text-sm text-slate-600">
          Garson sipariş verdiğinde mutfak ekranından adisyon fişi yazdırılır.
        </p>
      </div>

      <div className="space-y-4 px-5 py-4">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <input
            type="checkbox"
            checked={autoPrint}
            onChange={handleToggle}
            className="mt-1 rounded border-slate-300"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Yeni siparişte otomatik yazdır
            </span>
            <span className="mt-0.5 block text-xs text-slate-600">
              Mutfak paneli açıkken gelen her yeni sipariş için adisyon fişi çıkar.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={testing} onClick={handleTestPrint}>
            {testing ? 'Yazdırılıyor...' : 'Test Fişi Yazdır'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setShowGuide((current) => !current)}>
            {showGuide ? 'Kurulumu Gizle' : 'Kurulum Rehberi'}
          </Button>
        </div>

        {showGuide && (
          <div className="space-y-4 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-4 text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-900">Nasıl çalışır?</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                <li>Mutfak bilgisayarı veya tablette mutfak panelini açık tutun.</li>
                <li>Yazıcıyı bu cihaza bağlayın (USB veya ağ üzerinden).</li>
                <li>
                  Windows&apos;ta yazıcıyı <strong>varsayılan yazıcı</strong> olarak ayarlayın.
                </li>
                <li>Yukarıdaki &quot;Otomatik yazdır&quot; seçeneğini açın.</li>
                <li>Garson sipariş girdiğinde fiş otomatik yazdırılır.</li>
              </ol>
            </div>

            <div>
              <p className="font-semibold text-slate-900">Hangi yazıcılar uygun?</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong>80 mm termal yazıcı</strong> (Epson, Xprinter, Bixolon vb.) — en uygun
                  seçenek, adisyon kağıdı boyutuna göre tasarlandı.
                </li>
                <li>Normal masaüstü yazıcı — çalışır, ancak fiş A4 sayfada ortalanır.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-slate-900">Doğrudan bağlayınca çıkar mı?</p>
              <p className="mt-2 leading-relaxed">
                Yazıcıyı mutfak bilgisayarına bağlamanız yeterli değil; mutfak panelinin o
                bilgisayarın tarayıcısında açık olması gerekir. Sipariş sunucuya gider, mutfak
                ekranı 5 saniyede bir yenilenir ve yeni sipariş geldiğinde fiş yazdırılır.
              </p>
              <p className="mt-2 leading-relaxed">
                Tarayıcı güvenliği nedeniyle ilk yazdırmada onay penceresi çıkabilir. Tamamen
                sessiz (pencere açılmadan) yazdırmak için Chrome&apos;u{' '}
                <strong>kiosk printing</strong> modunda başlatın:
              </p>
              <code className="mt-2 block overflow-x-auto rounded-lg bg-white px-3 py-2 text-xs text-slate-800">
                chrome.exe --kiosk --kiosk-printing http://localhost:5173/kitchen
              </code>
              <p className="mt-2 text-xs text-slate-600">
                Bu modda yazıcı varsayılan olarak ayarlıysa fiş doğrudan çıkar, onay penceresi
                gelmez.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-900">Ağ yazıcısı (Wi-Fi / Ethernet)</p>
              <p className="mt-2 leading-relaxed">
                Yazıcıyı mutfak bilgisayarına ağ üzerinden ekleyin, varsayılan yazıcı yapın ve
                mutfak panelini o bilgisayarda açık tutun. USB bağlantısı gerekmez; önemli olan
                yazdırma komutunun mutfak ekranının çalıştığı cihazdan gitmesidir.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
