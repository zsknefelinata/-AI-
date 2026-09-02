export function formatNumber(value: number, digits = 0): string {
  if (Number.isNaN(value)) return '-'
  return value.toLocaleString('zh-CN', { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

export function formatPct(value: number, digits = 1): string {
  return `${formatNumber(value, digits)}%`
}

export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`
  const lines = [headers.map(escape).join(',')]
  rows.forEach((row) => lines.push(headers.map((key) => escape(row[key])).join(',')))
  downloadMockFile(filename, lines.join('\n'), 'text/csv;charset=utf-8')
}

export function downloadMockFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([`\uFEFF${content}`], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function randomId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}
