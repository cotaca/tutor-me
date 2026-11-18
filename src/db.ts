import { get, set, del } from 'idb-keyval'

export type Semester = { id: string; program: string; name: string }
export type Module = {
  id: string
  semesterId: string
  short: string
  name: string
  lecturer: string
}
export type Slides = { id: string; moduleId: string; lectureNum: string }
export type Slide = {
  slidesId: string
  page: number
  title: string
  hidden: boolean
  note?: string
}
export type Topic = { slidesId: string; onPage: number; title: string; level: 1 | 2 | 3 }
export type Card = {
  id: string
  moduleId: string
  question: string
  answer: string
  link?: { slidesId: string; page: number }
}

export type Data = {
  semesters: Semester[]
  modules: Module[]
  slides: Slides[]
  pages: Slide[]
  topics: Topic[]
  cards: Card[]
}

export async function loadData(): Promise<Data> {
  const empty: Data = { semesters: [], modules: [], slides: [], pages: [], topics: [], cards: [] }
  return { ...empty, ...(await get<Data>('data')) }
}

export const saveData = (data: Data) => set('data', data)

// PDFs liegen unter eigenem Key, damit saveData nicht bei jeder Änderung alle PDFs neu schreibt.
export const loadPdf = (slidesId: string) => get<Blob>(`pdf:${slidesId}`)
export const savePdf = (slidesId: string, pdf: Blob) => set(`pdf:${slidesId}`, pdf)
export const deletePdf = (slidesId: string) => del(`pdf:${slidesId}`)
