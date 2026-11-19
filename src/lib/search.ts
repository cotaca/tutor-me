import type { Data, Slide } from './db'

export const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

// scope: ids der zu durchsuchenden Foliensätze, in Anzeigereihenfolge.
export function search(data: Data, scope: string[], query: string) {
  const q = normalize(query)
  if (!q) return []
  const order = rank(scope)
  return data.pages
    .filter(
      (p) => scope.includes(p.slidesId) && normalize(`${p.title} ${p.text ?? ''}`).includes(q),
    )
    .sort((a, b) => order(a) - order(b))
}

// Position der aktuellen Folie in den Treffern sowie vorheriger/nächster Treffer (mit Umlauf).
export function hitNavigation(hits: Slide[], current: Slide | undefined, scope: string[]) {
  const order = rank(scope)
  const here = current ? order(current) : -1
  return {
    index: hits.findIndex((h) => order(h) === here),
    prev: hits.findLast((h) => order(h) < here) ?? hits.at(-1),
    next: hits.find((h) => order(h) > here) ?? hits[0],
  }
}

export function snippet(text: string, query: string) {
  const q = normalize(query)
  const flat = text.replace(/\s+/g, ' ')
  const i = flat.toLowerCase().indexOf(q)
  if (!q || i < 0) return ''
  return (i > 40 ? '…' : '') + flat.slice(Math.max(0, i - 40), i + q.length + 40) + '…'
}

const rank = (scope: string[]) => (p: Slide) => scope.indexOf(p.slidesId) * 100000 + p.page
