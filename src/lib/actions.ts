import * as pdfjs from 'pdfjs-dist'
import { savePdf, type Data, type Slide } from './db'
import type { Edit } from './sheet'
import { readPages } from './pdfText'

export type Selection =
  | { kind: 'program'; name: string }
  | { kind: 'semester'; id: string }
  | { kind: 'module'; id: string }
  | { kind: 'slides'; id: string }

export function patchById<K extends 'semesters' | 'modules' | 'slides' | 'topics'>(
  data: Data,
  key: K,
  id: string,
  change: Partial<Data[K][number]>,
): Data {
  const list = data[key] as { id: string }[]
  return { ...data, [key]: list.map((x) => (x.id === id ? { ...x, ...change } : x)) }
}

export function patchPages(
  data: Data,
  slidesId: string,
  pages: number[],
  change: Partial<Slide>,
): Data {
  return {
    ...data,
    pages: data.pages.map((p) =>
      p.slidesId === slidesId && pages.includes(p.page) ? { ...p, ...change } : p,
    ),
  }
}

export function renameProgram(data: Data, from: string, to: string): Data {
  return {
    ...data,
    semesters: data.semesters.map((s) => (s.program === from ? { ...s, program: to } : s)),
  }
}

export async function importPdfs(data: Data, moduleId: string, files: File[]): Promise<Data> {
  let next = data
  for (const file of files) {
    let read
    try {
      const task = pdfjs.getDocument({ data: await file.arrayBuffer() })
      read = await readPages(await task.promise)
      await task.destroy()
    } catch {
      alert(`${file.name} konnte nicht als PDF gelesen werden.`)
      continue
    }
    const id = crypto.randomUUID()
    const count = next.slides.filter((s) => s.moduleId === moduleId).length
    await savePdf(id, file)
    next = {
      ...next,
      slides: [...next.slides, { id, moduleId, lectureNum: `VL${count}` }],
      pages: [
        ...next.pages,
        ...read.map((r, i) => ({ slidesId: id, page: i + 1, ...r, hidden: false })),
      ],
    }
  }
  return next
}

// Entfernt den Eintrag samt allem darunter. Karteikarten eines gelöschten Foliensatzes
// bleiben erhalten, verlieren aber ihren Link. pdfIds sind die danach zu löschenden PDFs.
export function removeTarget(data: Data, target: Selection) {
  const semesterIds =
    target.kind === 'program'
      ? data.semesters.filter((s) => s.program === target.name).map((s) => s.id)
      : target.kind === 'semester'
        ? [target.id]
        : []
  const moduleIds =
    target.kind === 'module'
      ? [target.id]
      : data.modules.filter((m) => semesterIds.includes(m.semesterId)).map((m) => m.id)
  const pdfIds =
    target.kind === 'slides'
      ? [target.id]
      : data.slides.filter((s) => moduleIds.includes(s.moduleId)).map((s) => s.id)

  const next: Data = {
    ...data,
    semesters: data.semesters.filter((s) => !semesterIds.includes(s.id)),
    modules: data.modules.filter((m) => !moduleIds.includes(m.id)),
    slides: data.slides.filter((s) => !pdfIds.includes(s.id)),
    pages: data.pages.filter((p) => !pdfIds.includes(p.slidesId)),
    topics: data.topics.filter((t) => !moduleIds.includes(t.moduleId)),
    cards: data.cards
      .filter((c) => !moduleIds.includes(c.moduleId))
      .map((c) => (c.link && pdfIds.includes(c.link.slidesId) ? { ...c, link: undefined } : c)),
  }
  return { data: next, pdfIds }
}

// Schreibt eine Textänderung aus der Excel-Vorschau zurück in die App-Daten.
export function applyEdit(data: Data, edit: Edit, value: string): Data {
  switch (edit.kind) {
    case 'module':
      return patchById(data, 'modules', edit.id, { [edit.field]: value })
    case 'slides':
      return patchById(data, 'slides', edit.id, { lectureNum: value })
    case 'topic':
      return patchById(data, 'topics', edit.id, { title: value })
    case 'title':
    case 'note':
      return patchPages(data, edit.slidesId, [edit.page], { [edit.kind]: value })
  }
}
