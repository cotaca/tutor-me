import { normalize } from './search'

// Rechtecke (left, top, width, height relativ zu box) aller Treffer im Text der pdf.js-Textebene.
// Gesucht wird im zusammengesetzten Text aller Textstücke, so werden auch Treffer über
// Stückgrenzen gefunden; die Flächen liefert der Browser exakt über Range.getClientRects.
export function highlightRects(layer: HTMLElement, box: HTMLElement, query: string) {
  const q = normalize(query)
  if (!q) return []

  // Kleingeschriebener Text mit zusammengefassten Leerräumen, dazu für jedes Zeichen seine Stelle im DOM.
  let text = ''
  const at: [Text, number][] = []
  const add = (char: string, node: Text, offset: number) => {
    const space = /\s/.test(char)
    if (space && (!text || text.endsWith(' '))) return
    text += space ? ' ' : char.toLowerCase()
    at.push([node, offset])
  }
  for (const span of layer.querySelectorAll('span')) {
    const node = span.firstChild
    if (!(node instanceof Text)) continue
    for (let i = 0; i < node.data.length; i++) add(node.data[i], node, i)
    // Zeilenumbruch (pdf.js setzt danach ein <br>) zählt wie bei der Suche als Leerraum.
    if (span.nextSibling?.nodeName === 'BR') add(' ', node, node.data.length)
  }

  const origin = box.getBoundingClientRect()
  const rects: number[][] = []
  for (let i = text.indexOf(q); i >= 0; i = text.indexOf(q, i + q.length)) {
    const [startNode, start] = at[i]
    const [endNode, end] = at[i + q.length - 1]
    const range = document.createRange()
    range.setStart(startNode, start)
    range.setEnd(endNode, Math.min(end + 1, endNode.length))
    for (const r of range.getClientRects())
      rects.push([r.left - origin.left, r.top - origin.top, r.width, r.height])
  }
  return rects
}
