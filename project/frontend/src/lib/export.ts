type ExportCell = string | number | boolean | null | undefined
type ExportRow = Record<string, ExportCell>

const escapeHtml = (value: ExportCell) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const getHeaders = (rows: ExportRow[]) => rows.length > 0 ? Object.keys(rows[0]) : []

export const exportRowsToCSV = (
  rows: ExportRow[],
  filename: string
) => {
  if (rows.length === 0) return
  const headers = getHeaders(rows)
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export const exportRowsToPrintablePDF = (title: string, rows: ExportRow[]) => {
  if (rows.length === 0) return
  const headers = getHeaders(rows)
  exportTableToPrintablePDF(
    title,
    headers,
    rows.map((row) => headers.map((header) => escapeHtml(row[header]))),
  )
}

const exportTableToPrintablePDF = (title: string, headers: string[], rows: string[][]) => {
  const htmlRows = rows
    .map((row) => `<tr>${row.map((cell) => `<td style="border:1px solid #ccc;padding:6px;">${cell}</td>`).join('')}</tr>`)
    .join('')

  const html = `
    <html>
      <head>
        <title>${title}</title>
      </head>
      <body>
        <h2>${title}</h2>
        <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:12px;">
          <thead>
            <tr>${headers.map((h) => `<th style="border:1px solid #ccc;padding:6px;background:#f0f0f0;text-align:left;">${h}</th>`).join('')}</tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
      </body>
    </html>
  `

  const win = window.open('', '_blank')
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}
