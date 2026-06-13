export function formatMoneyInputWhileTyping(input: string): string {
  let cleaned = input.replace(/[^\d,]/g, '')

  const commaIndex = cleaned.indexOf(',')
  if (commaIndex !== -1) {
    const before = cleaned.slice(0, commaIndex + 1)
    const after = cleaned.slice(commaIndex + 1).replace(/,/g, '').slice(0, 2)
    cleaned = before + after
  }

  const parts = cleaned.split(',')
  const intPart = parts[0] ?? ''
  const decPart = parts[1]
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  if (decPart !== undefined) {
    return `${formattedInt},${decPart}`
  }

  if (cleaned.endsWith(',')) {
    return `${formattedInt},`
  }

  return formattedInt
}

export function parseMoneyInput(value: string): number {
  if (!value.trim()) {
    return Number.NaN
  }

  const normalized = value.replace(/\./g, '').replace(',', '.')
  return Number(normalized)
}

export function formatMoneyInputFromNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) {
    return ''
  }

  const [intPart, decPart] = num.toFixed(2).split('.')
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${formattedInt},${decPart}`
}
