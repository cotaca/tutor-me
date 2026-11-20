// Folienausschnitte in Karten: Markdown-Bild mit eigener Adresse statt gespeicherter Bilddatei,
// z. B. ![Folie 14](slide:<slidesId>/14#0.12,0.3,0.55,0.4). Der Rahmen (x, y, Breite, Höhe)
// ist als Anteil der Seite angegeben und wird beim Anzeigen direkt aus der PDF gerendert.

export type Rect = [x: number, y: number, w: number, h: number]
export type SlideRef = { slidesId: string; page: number; rect: Rect }

const round = (n: number) => Math.round(n * 1000) / 1000

export const slideUrl = (ref: SlideRef) =>
  `slide:${ref.slidesId}/${ref.page}#${ref.rect.map(round).join(',')}`

export const slideImage = (ref: SlideRef) => `![Folie ${ref.page}](${slideUrl(ref)})`

export function parseSlideUrl(url: string): SlideRef | undefined {
  const m = /^slide:([\w-]+)\/(\d+)#([\d.]+),([\d.]+),([\d.]+),([\d.]+)$/.exec(url)
  if (!m) return
  const rect = m.slice(3).map(Number) as Rect
  const [x, y, w, h] = rect
  if (w <= 0 || h <= 0 || x + w > 1.001 || y + h > 1.001) return
  return { slidesId: m[1], page: Number(m[2]), rect }
}

// Rahmen aus zwei Eckpunkten (Anteile der Seite), auf die Seite begrenzt.
export function rectFrom(a: [number, number], b: [number, number]): Rect {
  const clamp = (n: number) => Math.min(1, Math.max(0, n))
  const [x0, x1] = [clamp(Math.min(a[0], b[0])), clamp(Math.max(a[0], b[0]))]
  const [y0, y1] = [clamp(Math.min(a[1], b[1])), clamp(Math.max(a[1], b[1]))]
  return [x0, y0, x1 - x0, y1 - y0]
}
