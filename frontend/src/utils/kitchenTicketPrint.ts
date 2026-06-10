export interface KitchenTicketItem {
  productName: string
  quantity: number
  note: string | null
}

export interface KitchenTicket {
  tableName: string
  restaurantName?: string
  items: KitchenTicketItem[]
  printedAt?: Date
}

export const KITCHEN_AUTO_PRINT_KEY = 'adistek_kitchen_auto_print'

export function isKitchenAutoPrintEnabled(): boolean {
  return localStorage.getItem(KITCHEN_AUTO_PRINT_KEY) === 'true'
}

export function setKitchenAutoPrintEnabled(enabled: boolean): void {
  localStorage.setItem(KITCHEN_AUTO_PRINT_KEY, enabled ? 'true' : 'false')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildTicketHtml(ticket: KitchenTicket): string {
  const printedAt = ticket.printedAt ?? new Date()
  const restaurantLine = ticket.restaurantName
    ? `<p class="restaurant">${escapeHtml(ticket.restaurantName)}</p>`
    : ''

  const itemRows = ticket.items
    .map((item) => {
      const noteLine = item.note
        ? `<div class="note">↳ Not: ${escapeHtml(item.note)}</div>`
        : ''

      return `
        <div class="item">
          <div class="item-row">
            <span class="qty">${item.quantity}x</span>
            <span class="name">${escapeHtml(item.productName)}</span>
          </div>
          ${noteLine}
        </div>
      `
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Mutfak Adisyonu · ${escapeHtml(ticket.tableName)}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    body {
      width: 80mm;
      margin: 0;
      padding: 4mm 3mm;
      color: #000;
      font-family: "Courier New", Courier, monospace;
      font-size: 13px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .center {
      text-align: center;
    }

    .restaurant {
      margin: 0 0 2mm;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .title {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .subtitle {
      margin: 1mm 0 0;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .divider {
      margin: 3mm 0;
      border-top: 1px dashed #000;
    }

    .divider-bold {
      margin: 3mm 0;
      border-top: 2px solid #000;
    }

    .meta {
      margin: 0;
      font-size: 12px;
    }

    .meta strong {
      font-size: 18px;
      letter-spacing: 0.02em;
    }

    .datetime {
      margin: 1.5mm 0 0;
      font-size: 11px;
    }

    .item {
      margin-bottom: 2.5mm;
    }

    .item-row {
      display: flex;
      gap: 2mm;
      align-items: flex-start;
    }

    .qty {
      min-width: 7mm;
      font-size: 15px;
      font-weight: 700;
    }

    .name {
      flex: 1;
      font-size: 14px;
      font-weight: 700;
      word-break: break-word;
    }

    .note {
      margin: 1mm 0 0 9mm;
      font-size: 11px;
      font-weight: 700;
    }

    .footer {
      margin: 0;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
    }

    .count {
      margin: 1mm 0 0;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="center">
    ${restaurantLine}
    <h1 class="title">MUTFAK ADİSYONU</h1>
    <p class="subtitle">Yeni Sipariş</p>
  </div>

  <div class="divider-bold"></div>

  <p class="meta">Masa: <strong>${escapeHtml(ticket.tableName)}</strong></p>
  <p class="datetime">${escapeHtml(formatDateTime(printedAt))}</p>

  <div class="divider"></div>

  ${itemRows}

  <div class="divider-bold"></div>

  <div class="center">
    <p class="footer">HAZIRLANACAK</p>
    <p class="count">${ticket.items.length} kalem · ${ticket.items.reduce((sum, item) => sum + item.quantity, 0)} adet</p>
  </div>
</body>
</html>`
}

function printHtml(html: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const frameWindow = iframe.contentWindow
    const doc = frameWindow?.document

    if (!doc || !frameWindow) {
      document.body.removeChild(iframe)
      resolve()
      return
    }

    doc.open()
    doc.write(html)
    doc.close()

    const cleanup = () => {
      window.setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe)
        }
        resolve()
      }, 300)
    }

    frameWindow.onafterprint = cleanup

    window.setTimeout(() => {
      frameWindow.focus()
      frameWindow.print()

      window.setTimeout(() => {
        if (iframe.parentNode) {
          cleanup()
        }
      }, 5000)
    }, 150)
  })
}

export async function printKitchenTicket(ticket: KitchenTicket): Promise<void> {
  await printHtml(buildTicketHtml(ticket))
}

export async function printKitchenTickets(tickets: KitchenTicket[]): Promise<void> {
  for (const ticket of tickets) {
    await printKitchenTicket(ticket)
    if (tickets.length > 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 400))
    }
  }
}

export function printKitchenTicketSample(restaurantName?: string): Promise<void> {
  return printKitchenTicket({
    restaurantName,
    tableName: 'Masa 3',
    printedAt: new Date(),
    items: [
      { productName: 'Latte', quantity: 2, note: 'Az şekerli' },
      { productName: 'Cheesecake', quantity: 1, note: null },
    ],
  })
}

export function buildTicketsFromOrderItems(
  items: Array<{
    tableName: string
    productName: string
    quantity: number
    note: string | null
  }>,
  restaurantName?: string,
): KitchenTicket[] {
  const grouped = new Map<string, KitchenTicketItem[]>()

  for (const item of items) {
    const existing = grouped.get(item.tableName) ?? []
    existing.push({
      productName: item.productName,
      quantity: item.quantity,
      note: item.note,
    })
    grouped.set(item.tableName, existing)
  }

  return Array.from(grouped.entries()).map(([tableName, ticketItems]) => ({
    tableName,
    restaurantName,
    items: ticketItems,
    printedAt: new Date(),
  }))
}
