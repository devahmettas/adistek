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
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildTicketHtml(ticket: KitchenTicket): string {
  const printedAt = ticket.printedAt ?? new Date()
  const totalQty = ticket.items.reduce((sum, item) => sum + item.quantity, 0)
  const restaurantLine = ticket.restaurantName
    ? `<p class="restaurant">${escapeHtml(ticket.restaurantName)}</p>`
    : ''

  const itemRows = ticket.items
    .map((item, index) => {
      const noteLine = item.note
        ? `<div class="note"><span class="note-label">Not</span>${escapeHtml(item.note)}</div>`
        : ''

      return `
        <div class="item${index < ticket.items.length - 1 ? ' item-border' : ''}">
          <div class="item-row">
            <span class="qty">${item.quantity}×</span>
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
      padding: 5mm 4mm 6mm;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .header {
      text-align: center;
      padding-bottom: 3mm;
      border-bottom: 2px solid #000;
    }

    .restaurant {
      margin: 0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .title {
      margin: 2mm 0 0;
      font-size: 13px;
      font-weight: 400;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #333;
    }

    .table-block {
      margin: 4mm 0;
      padding: 3.5mm 2mm;
      border: 2.5px solid #000;
      border-radius: 2mm;
      text-align: center;
    }

    .table-label {
      margin: 0;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }

    .table-name {
      margin: 1.5mm 0 0;
      font-size: 26px;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: 0.02em;
    }

    .datetime {
      margin: 0 0 4mm;
      text-align: center;
      font-size: 10px;
      letter-spacing: 0.04em;
      color: #444;
    }

    .items-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2mm;
      padding-bottom: 1.5mm;
      border-bottom: 1px solid #000;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    .item {
      padding: 3mm 0;
    }

    .item-border {
      border-bottom: 1px dashed #888;
    }

    .item-row {
      display: flex;
      gap: 3mm;
      align-items: flex-start;
    }

    .qty {
      flex-shrink: 0;
      min-width: 9mm;
      font-size: 18px;
      font-weight: 800;
      line-height: 1.2;
    }

    .name {
      flex: 1;
      padding-top: 1px;
      font-size: 15px;
      font-weight: 700;
      line-height: 1.25;
      word-break: break-word;
    }

    .note {
      display: flex;
      gap: 2mm;
      margin: 2mm 0 0 12mm;
      padding: 1.5mm 2mm;
      border-left: 2px solid #000;
      font-size: 11px;
      line-height: 1.35;
    }

    .note-label {
      flex-shrink: 0;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .footer {
      margin-top: 4mm;
      padding-top: 3mm;
      border-top: 2px solid #000;
      text-align: center;
    }

    .summary {
      margin: 0;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
    }

    .summary strong {
      font-size: 13px;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <header class="header">
    ${restaurantLine}
    <h1 class="title">Mutfak Adisyonu</h1>
  </header>

  <div class="table-block">
    <p class="table-label">Masa</p>
    <p class="table-name">${escapeHtml(ticket.tableName)}</p>
  </div>

  <p class="datetime">${escapeHtml(formatDateTime(printedAt))}</p>

  <div class="items-header">
    <span>Sipariş</span>
    <span>${ticket.items.length} kalem</span>
  </div>

  ${itemRows}

  <footer class="footer">
    <p class="summary">
      Toplam <strong>${totalQty}</strong> adet
    </p>
  </footer>
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
