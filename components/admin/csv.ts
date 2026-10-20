/** Download rows as a CSV file (quoted, UTF-8 with BOM so spreadsheets read accents). */
export function downloadCsv(filename: string, rows: Record<string, string | number | null | undefined>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const body = [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\r\n")
  const url = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
