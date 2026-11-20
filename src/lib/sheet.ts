import type { Data, Module } from './db.ts'
import { chain } from './topics.ts'

// Was eine Zelle beim Bearbeiten in den App-Daten ändert.
export type Edit =
  | { kind: 'module'; id: string; field: 'short' | 'name' | 'lecturer' }
  | { kind: 'slides'; id: string }
  | { kind: 'topic'; id: string }
  | { kind: 'title' | 'note'; slidesId: string; page: number }

export type Cell = {
  text: string
  rowSpan: number
  colSpan?: number
  edit?: Edit
  editValue?: string // falls sich der bearbeitete Wert vom angezeigten Text unterscheidet
  hidden?: boolean // grau/kursiv: alle Folien, über die sich die Zelle erstreckt, sind ausgeblendet
}

export type Row = {
  slidesId: string
  page: number
  hidden: boolean
  task: boolean
  cells: (Cell | null)[]
}

// Hintergrund für Aufgaben-Zeilen (hellorange, passend zur Markierung in der App), als Hex ohne #.
export const TASK_FILL = 'FFE8CC'

// Eingefärbt werden nur Zellen, die allein zu dieser Zeile gehören; verbundene Zellen
// über mehrere Zeilen (Vorlesung, Themen) bleiben weiß.
export const isTaskCell = (row: Row, cell: Cell) => row.task && cell.rowSpan === 1

export type Sheet = {
  name: string
  module: Module
  levels: number
  columns: string[]
  rows: Row[]
}

// Gemeinsame Grundlage für Vorschau und Excel-Export eines Moduls.
// null in cells heißt: von einer verbundenen Zelle darüber oder links davon abgedeckt.
export function buildSheet(data: Data, module: Module): Sheet {
  const slides = data.slides.filter((s) => s.moduleId === module.id)
  const topics = data.topics.filter((t) => t.moduleId === module.id)
  const pages = slides.flatMap((s) =>
    data.pages.filter((p) => p.slidesId === s.id).sort((a, b) => a.page - b.page),
  )
  const chains = pages.map((p) => chain(topics, p.topicId))
  const levels = Math.max(1, ...chains.map((c) => c.length))

  const rows: Row[] = pages.map((p) => ({
    slidesId: p.slidesId,
    page: p.page,
    hidden: p.hidden,
    task: !!p.task,
    cells: [],
  }))

  // Fügt eine Spalte hinzu; aufeinanderfolgende Zeilen mit gleichem key teilen sich eine Zelle.
  function column(key: (i: number) => string, cell: (i: number) => Omit<Cell, 'rowSpan'>) {
    let start = 0
    rows.forEach((row, i) => {
      if (i > 0 && key(i) === key(start)) {
        row.cells.push(null)
        rows[start].cells.at(-1)!.rowSpan++
      } else {
        start = i
        row.cells.push({ ...cell(i), rowSpan: 1 })
      }
    })
  }

  column(
    (i) => pages[i].slidesId,
    (i) => {
      const s = slides.find((x) => x.id === pages[i].slidesId)!
      return { text: s.lectureNum, edit: { kind: 'slides', id: s.id } }
    },
  )
  // Themenspalten: senkrecht verbunden über aufeinanderfolgende Folien mit demselben Thema.
  // Hat keine dieser Folien ein Unterthema, reicht die Zelle zusätzlich waagerecht bis zur
  // letzten Themenspalte. filled[i] = Anzahl Themenspalten, die in Zeile i schon belegt sind.
  const filled = rows.map(() => 0)
  for (let level = 0; level < levels; level++) {
    let i = 0
    while (i < rows.length) {
      if (filled[i] > level) {
        rows[i++].cells.push(null)
        continue
      }
      const t = chains[i][level]
      let end = i + 1
      while (end < rows.length && t && filled[end] <= level && chains[end][level]?.id === t.id)
        end++
      const run = chains.slice(i, end)
      const colSpan = t && run.every((c) => c.length === level + 1) ? levels - level : 1
      rows[i].cells.push({
        text: t?.title ?? '',
        rowSpan: end - i,
        colSpan,
        edit: t && { kind: 'topic', id: t.id },
      })
      for (let k = i; k < end; k++) {
        if (k > i) rows[k].cells.push(null)
        filled[k] = level + colSpan
      }
      i = end
    }
  }
  pages.forEach((p, i) => {
    const at = { slidesId: p.slidesId, page: p.page }
    rows[i].cells.push(
      { text: String(p.page), rowSpan: 1 },
      { text: p.title, rowSpan: 1, edit: { kind: 'title', ...at } },
      {
        text: [p.task && 'Aufgabe', p.note].filter(Boolean).join(' – '),
        rowSpan: 1,
        edit: { kind: 'note', ...at },
        editValue: p.note ?? '',
      },
    )
  })

  // Verbundene Zellen (Vorlesung, Themen) nur ausgrauen, wenn jede ihrer Folien ausgeblendet ist.
  rows.forEach((row, i) =>
    row.cells.forEach((cell) => {
      if (cell) cell.hidden = rows.slice(i, i + cell.rowSpan).every((r) => r.hidden)
    }),
  )

  return {
    name: module.short || module.name,
    module,
    levels,
    columns: [
      '#',
      ...Array.from({ length: levels }, () => 'Thema'),
      'Folie',
      'Inhalt',
      'Sonstiges',
    ],
    rows,
  }
}
