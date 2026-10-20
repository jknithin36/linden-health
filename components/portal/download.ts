/**
 * Saves a text file in the browser (visit summaries, statements, .ics invites).
 * A real portal would link to a server-generated PDF instead, e.g. `/api/records/:id.pdf`.
 */
export function download(filename: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }))
  Object.assign(document.createElement("a"), { href: url, download: filename }).click()
  URL.revokeObjectURL(url)
}
