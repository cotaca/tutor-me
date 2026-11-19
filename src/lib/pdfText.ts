import type { PDFDocumentProxy } from 'pdfjs-dist'

type TextPiece = { str: string; transform: number[] }

export async function readPages(doc: PDFDocumentProxy) {
  const pages: { title: string; text: string; task: boolean }[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const items = content.items.flatMap((it) => ('str' in it ? [it] : []))
    const [, bottom, , top] = page.view
    const text = items.map((it) => it.str + (it.hasEOL ? '\n' : '')).join('')
    const title = guessTitle(items, bottom, top)
    pages.push({ text, title, task: isTask(title, text) })
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

// Nur Titel und erste Textzeile prüfen: Fußzeilen wie "Vorlesung und Übung" stehen sonst auf jeder Folie.
const TASK_WORD = /(^|[^\p{L}])(aufgabe|übung|exercise|task|quiz)/iu
export function isTask(title: string, text: string) {
  const firstLine = text.split('\n').find((l) => l.trim()) ?? ''
  return TASK_WORD.test(title) || TASK_WORD.test(firstLine)
}

// Rechtecke (PDF-Koordinaten x1, y1, x2, y2) aller Treffer des Suchbegriffs.
// ponytail: nur Treffer innerhalb eines Textstücks; Treffer über Stückgrenzen hinweg werden nicht markiert.
// Die x-Position im Stück wird über den Zeichenanteil geschätzt (bei Proportionalschrift leicht ungenau).
export function matchRects(items: (TextPiece & { width: number })[], query: string) {
  const q = query.toLowerCase().replace(/\s+/g, ' ').trim()
  const rects: number[][] = []
  if (!q) return rects
  for (const it of items) {
    const str = it.str.toLowerCase()
    const size = Math.hypot(it.transform[2], it.transform[3])
    const [x, y] = [it.transform[4], it.transform[5]]
    for (let i = str.indexOf(q); i >= 0; i = str.indexOf(q, i + q.length)) {
      const from = x + (it.width * i) / str.length
      const to = x + (it.width * (i + q.length)) / str.length
      rects.push([from, y - size * 0.25, to, y + size * 0.85])
    }
  }
  return rects
}
