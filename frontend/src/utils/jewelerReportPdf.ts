import html2pdf from 'html2pdf.js'
import type { JewelerStats } from '../api/jeweler'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Nakit',
  card: 'Kart',
  transfer: 'Havale/EFT',
  gold_exchange: 'Altın Takas',
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatMoney(value: number): string {
  return `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
}

function formatDateRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const startDate = formatter.format(new Date(`${start}T00:00:00`))
  const endDate = formatter.format(new Date(`${end}T00:00:00`))
  return start === end ? startDate : `${startDate} – ${endDate}`
}

function formatGeneratedAt(): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

function formatDateTimeForPdf(value: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function statCard(label: string, value: string, hint?: string): string {
  return `
    <div class="stat-card">
      <p class="stat-label">${escapeHtml(label)}</p>
      <p class="stat-value">${escapeHtml(value)}</p>
      ${hint ? `<p class="stat-hint">${escapeHtml(hint)}</p>` : ''}
    </div>
  `
}

function barRow(label: string, value: string, hint: string, width: number): string {
  return `
    <div class="bar-row">
      <div class="bar-meta">
        <span class="bar-label">${escapeHtml(label)}</span>
        <span class="bar-hint">${escapeHtml(hint)}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${Math.max(width, 4)}%"></div>
      </div>
      <span class="bar-value">${escapeHtml(value)}</span>
    </div>
  `
}

export interface JewelerReportPdfOptions {
  companyName?: string | null
  restaurantName?: string | null
}

function buildReportHtml(stats: JewelerStats, options: JewelerReportPdfOptions): string {
  const businessName = options.companyName?.trim() || options.restaurantName?.trim() || 'Kuyumcu'
  const period = stats.period_summary
  const dateRange = formatDateRange(stats.date_range.start, stats.date_range.end)

  const topProductMax = Math.max(...stats.top_products.map((p) => p.revenue), 1)
  const topProductsHtml =
    stats.top_products.length === 0
      ? '<p class="empty">Bu dönemde satış kaydı yok.</p>'
      : stats.top_products
          .map((product) =>
            barRow(
              product.product_name,
              formatMoney(product.revenue),
              `${product.quantity} adet`,
              (product.revenue / topProductMax) * 100,
            ),
          )
          .join('')

  const categoryMax = Math.max(...stats.category_breakdown.map((c) => c.revenue), 1)
  const categoriesHtml =
    stats.category_breakdown.length === 0
      ? '<p class="empty">Kategori verisi yok.</p>'
      : stats.category_breakdown
          .map((row) =>
            barRow(
              row.category_name,
              formatMoney(row.revenue),
              `${row.quantity} adet`,
              (row.revenue / categoryMax) * 100,
            ),
          )
          .join('')

  const paymentMax = Math.max(...stats.payment_breakdown.map((p) => p.total), 1)
  const paymentsHtml =
    stats.payment_breakdown.length === 0
      ? '<p class="empty">Ödeme verisi yok.</p>'
      : stats.payment_breakdown
          .map((row) =>
            barRow(
              PAYMENT_LABELS[row.payment_method] ?? row.payment_method,
              formatMoney(row.total),
              `${row.count} işlem`,
              (row.total / paymentMax) * 100,
            ),
          )
          .join('')

  const productRows = stats.all_products
    .slice(0, 25)
    .map(
      (product) => `
      <tr>
        <td>${escapeHtml(product.name)}</td>
        <td>${escapeHtml(product.category_name)}</td>
        <td class="num">${product.karat ? `${product.karat} ayar` : '—'}</td>
        <td class="num">${product.stock_quantity}</td>
        <td class="num">${formatMoney(product.stock_value)}</td>
      </tr>
    `,
    )
    .join('')

  const moreProductsNote =
    stats.all_products.length > 25
      ? `<p class="table-note">+ ${stats.all_products.length - 25} ürün daha (tam liste sistemde)</p>`
      : ''

  const stockCounts = stats.stock_counts
  const cashSessions = stats.cash_sessions

  const stockCountRows = (stockCounts?.recent ?? [])
    .slice(0, 8)
    .map(
      (count) => `
      <tr>
        <td>${escapeHtml(formatDateTimeForPdf(count.completed_at))}</td>
        <td class="num">${count.item_count}</td>
        <td class="num">${count.discrepancy_count}</td>
        <td class="num">${count.cash_difference !== null ? formatMoney(count.cash_difference) : '—'}</td>
      </tr>
    `,
    )
    .join('')

  const cashSessionRows = (cashSessions?.recent ?? [])
    .map(
      (session) => `
      <tr>
        <td>${escapeHtml(formatDateTimeForPdf(session.closed_at))}</td>
        <td class="num">${formatMoney(session.opening_balance)}</td>
        <td class="num">${session.expected_balance !== null ? formatMoney(session.expected_balance) : '—'}</td>
        <td class="num">${session.counted_balance !== null ? formatMoney(session.counted_balance) : '—'}</td>
        <td class="num">${session.cash_difference !== null ? formatMoney(session.cash_difference) : '—'}</td>
      </tr>
    `,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: #fff;
      font-size: 11px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { padding: 28px 32px 36px; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 18px;
      border-bottom: 3px solid #0f766e;
      margin-bottom: 22px;
    }
    .brand-block { flex: 1; }
    .brand-tag {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      background: #ccfbf1;
      color: #0f766e;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .business-name {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .report-title {
      margin-top: 4px;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }
    .meta-block { text-align: right; min-width: 160px; }
    .period-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 10px;
      background: #0f766e;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .meta-line { font-size: 10px; color: #64748b; margin-top: 3px; }
    .section { margin-bottom: 22px; }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .stats-grid-3 { grid-template-columns: repeat(3, 1fr); }
    .stat-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      background: #f8fafc;
    }
    .stat-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
    .stat-value { margin-top: 4px; font-size: 16px; font-weight: 800; color: #0f172a; }
    .stat-hint { margin-top: 4px; font-size: 9px; color: #64748b; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .panel {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px;
      background: #fff;
    }
    .panel-title { font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
    .bar-row { display: grid; grid-template-columns: 1fr 80px; gap: 6px; margin-bottom: 10px; align-items: center; }
    .bar-meta { grid-column: 1 / -1; display: flex; justify-content: space-between; gap: 8px; }
    .bar-label { font-size: 10px; font-weight: 600; color: #0f172a; }
    .bar-hint { font-size: 9px; color: #64748b; }
    .bar-track { grid-column: 1; height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, #14b8a6, #0f766e); border-radius: 999px; }
    .bar-value { font-size: 10px; font-weight: 700; color: #0f766e; text-align: right; }
    .empty { font-size: 10px; color: #94a3b8; font-style: italic; }
    .repair-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
    .repair-item {
      text-align: center;
      padding: 10px 6px;
      border-radius: 10px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
    }
    .repair-label { font-size: 8px; color: #64748b; font-weight: 600; }
    .repair-value { margin-top: 4px; font-size: 16px; font-weight: 800; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th {
      text-align: left;
      padding: 8px 6px;
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #e2e8f0;
    }
    td { padding: 7px 6px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    td.num { text-align: right; white-space: nowrap; }
    .table-note { margin-top: 8px; font-size: 9px; color: #64748b; }
    .footer {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #94a3b8;
    }
    .footer-brand { font-weight: 800; color: #0f766e; letter-spacing: 0.06em; }
    .note-box {
      margin-top: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      font-size: 9px;
      color: #115e59;
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="header">
      <div class="brand-block">
        <span class="brand-tag">AdiStek Kuyumcu</span>
        <h1 class="business-name">${escapeHtml(businessName)}</h1>
        <p class="report-title">Satış & İşletme Raporu</p>
      </div>
      <div class="meta-block">
        <div class="period-badge">${escapeHtml(stats.period_label)} Rapor</div>
        <p class="meta-line">${escapeHtml(dateRange)}</p>
        <p class="meta-line">Oluşturulma: ${escapeHtml(formatGeneratedAt())}</p>
      </div>
    </header>

    <section class="section">
      <h2 class="section-title">Satış Özeti</h2>
      <div class="stats-grid">
        ${statCard('Ciro', formatMoney(period.revenue), `${period.sales_count} satış`)}
        ${statCard('Ortalama Satış', formatMoney(period.average_sale))}
        ${statCard('Müşterili Satış', String(period.sales_with_customer), `Toplam ${stats.customers.total_count} müşteri`)}
        ${statCard('Stok Değeri', formatMoney(stats.inventory.inventory_sale_value), `${stats.inventory.total_stock_units} adet`)}
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Karlılık Analizi</h2>
      <div class="stats-grid stats-grid-3">
        ${statCard('Net Kar', formatMoney(period.profit), `Marj %${period.profit_margin}`)}
        ${statCard('Maliyet', formatMoney(period.cost))}
        ${statCard('Ciro', formatMoney(period.revenue), `${period.sales_count} satış`)}
      </div>
      <p class="note-box">Kar hesabı FIFO alış maliyetine göre yapılır. Aynı ürün farklı fiyatlardan alındıysa en eski lot önceliklidir.</p>
    </section>

    <section class="section two-col">
      <div class="panel">
        <h3 class="panel-title">En Çok Satan Ürünler</h3>
        ${topProductsHtml}
      </div>
      <div class="panel">
        <h3 class="panel-title">Kategori Bazlı Satış</h3>
        ${categoriesHtml}
      </div>
    </section>

    <section class="section two-col">
      <div class="panel">
        <h3 class="panel-title">Ödeme Dağılımı</h3>
        ${paymentsHtml}
      </div>
      <div class="panel">
        <h3 class="panel-title">Stok & Envanter</h3>
        <div class="stats-grid stats-grid-3" style="margin-bottom:10px">
          ${statCard('Ürün', String(stats.inventory.total_products), `${stats.inventory.total_stock_units} adet`)}
          ${statCard('Toplam Gram', `${stats.inventory.total_weight_gram.toLocaleString('tr-TR')} gr`)}
          ${statCard('Düşük / Tükenen', `${stats.inventory.low_stock_count} / ${stats.inventory.out_of_stock_count}`)}
        </div>
        <h3 class="panel-title" style="margin-top:12px">Tamir Durumu</h3>
        <div class="repair-grid">
          <div class="repair-item"><p class="repair-label">Aktif</p><p class="repair-value">${stats.repairs.active_count}</p></div>
          <div class="repair-item"><p class="repair-label">Alındı</p><p class="repair-value">${stats.repairs.received_count}</p></div>
          <div class="repair-item"><p class="repair-label">İşlemde</p><p class="repair-value">${stats.repairs.in_progress_count}</p></div>
          <div class="repair-item"><p class="repair-label">Tamam</p><p class="repair-value">${stats.repairs.completed_count}</p></div>
          <div class="repair-item"><p class="repair-label">Teslim</p><p class="repair-value">${stats.repairs.delivered_count}</p></div>
        </div>
      </div>
    </section>

    <section class="section two-col">
      <div class="panel">
        <h3 class="panel-title">Stok Takip İstatistikleri</h3>
        <div class="stats-grid stats-grid-3" style="margin-bottom:10px">
          ${statCard('Tamamlanan', String(stockCounts?.summary.completed_count ?? 0))}
          ${statCard('Uyum Oranı', `%${stockCounts?.summary.accuracy_rate ?? 100}`)}
          ${statCard('Nakit Fark', formatMoney(stockCounts?.summary.cash_discrepancy_total ?? 0))}
        </div>
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th class="num">Kalem</th>
              <th class="num">Fark</th>
              <th class="num">Nakit Fark</th>
            </tr>
          </thead>
          <tbody>
            ${stockCountRows || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:12px">Kayıt yok</td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="panel">
        <h3 class="panel-title">Gün Sonu Kasa Raporu</h3>
        <div class="stats-grid stats-grid-3" style="margin-bottom:10px">
          ${statCard('Kapanış', String(cashSessions?.summary.closed_count ?? 0), cashSessions?.is_open ? 'Kasa açık' : 'Kasa kapalı')}
          ${statCard('Nakit Satış', formatMoney(cashSessions?.summary.total_cash_sales ?? 0))}
          ${statCard('Toplam Fark', formatMoney(cashSessions?.summary.total_cash_difference ?? 0))}
        </div>
        <table>
          <thead>
            <tr>
              <th>Kapanış</th>
              <th class="num">Açılış</th>
              <th class="num">Beklenen</th>
              <th class="num">Sayılan</th>
              <th class="num">Fark</th>
            </tr>
          </thead>
          <tbody>
            ${cashSessionRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:12px">Kayıt yok</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Stoktaki Ürünler</h2>
      <table>
        <thead>
          <tr>
            <th>Ürün</th>
            <th>Kategori</th>
            <th class="num">Ayar</th>
            <th class="num">Stok</th>
            <th class="num">Değer</th>
          </tr>
        </thead>
        <tbody>
          ${productRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:16px">Ürün kaydı yok</td></tr>'}
        </tbody>
      </table>
      ${moreProductsNote}
    </section>

    <footer class="footer">
      <span>Bu rapor <span class="footer-brand">AdiStek</span> kuyumcu yönetim sistemi tarafından oluşturulmuştur.</span>
      <span>${escapeHtml(stats.period_label)} · ${escapeHtml(dateRange)}</span>
    </footer>
  </div>
</body>
</html>`
}

function buildFilename(stats: JewelerStats, companyName?: string | null): string {
  const slug = (companyName ?? 'rapor')
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç]+/gi, '-')
    .replace(/^-|-$/g, '')
  const periodSlug = stats.period === 'day' ? 'gunluk' : stats.period === 'week' ? 'haftalik' : 'aylik'
  const date = stats.date_range.start
  return `${slug || 'rapor'}-${periodSlug}-${date}.pdf`
}

export async function downloadJewelerReportPdf(
  stats: JewelerStats,
  options: JewelerReportPdfOptions = {},
): Promise<void> {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '794px'
  container.innerHTML = buildReportHtml(stats, options)
  document.body.appendChild(container)

  const page = container.querySelector('.page') as HTMLElement

  try {
    await html2pdf()
      .set({
        margin: [8, 8, 12, 8],
        filename: buildFilename(stats, options.companyName ?? options.restaurantName),
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(page)
      .save()
  } finally {
    document.body.removeChild(container)
  }
}
