export function isUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-'
  }

  if (typeof value === 'boolean') {
    return value ? 'Ano' : 'Ne'
  }

  if (typeof value === 'number') {
    return String(value)
  }

  const text = String(value)
  if (isUuid(text)) {
    return ''
  }

  const asDate = new Date(text)
  if (!Number.isNaN(asDate.getTime()) && text.includes('T')) {
    return asDate.toLocaleString('cs-CZ')
  }

  return text
}
