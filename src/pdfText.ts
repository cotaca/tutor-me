import type { PDFDocumentProxy } from 'pdfjs-dist'

type TextPiece = { str: string; transform: number[] }

export async function readPages(doc: PDFDocumentProxy) {
  const pages: { title: string; text: string }[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const items = content.items.flatMap((it) => ('str' in it ? [it] : []))
    const [, bottom, , top] = page.view
    pages.push({
      text: items.map((it) => it.str + (it.hasEOL ? '\n' : '')).join(''),
      title: guessTitle(items, bottom, top),
    })
  }
  return pages
}

// Größte Schrift im oberen Folienbereich; ohne Text dort die größte Schrift der ganzen Folie.
// transform[5] ist die y-Position (von unten), transform[2..3] ergeben die Schriftgröße.
export function guessTitle(items: TextPiece[], bottom: number, top: number) {
  const words = items.filter((it) => it.str.trim())
  const upper = words.filter((it) => it.transform[5] > bottom + (top - bottom) * 0.6)
  const pool = upper.length ? upper : words
  const size = (it: TextPiece) => Math.hypot(it.transform[2], it.transform[3])
  const max = Math.max(...pool.map(size))
  return pool
    .filter((it) => size(it) >= max * 0.9)
    .map((it) => it.str.trim())
    .join(' ')
    .replace(/\s+/g, ' ')
}
