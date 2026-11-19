import assert from 'node:assert'
import type { Data } from '../src/lib/db.ts'
import { guessTitle, isTask, matchRects } from '../src/lib/pdfText.ts'
import { buildSheet } from '../src/lib/sheet.ts'
import { addTopic, chain, hueOf, moveTopic, removeTopic } from '../src/lib/topics.ts'

// Titel-Heuristik
const piece = (str: string, size: number, y: number) => ({
  str,
  transform: [size, 0, 0, size, 0, y],
})

assert.equal(
  guessTitle(
    [piece('Big Data', 28, 480), piece('Inhalt', 18, 300), piece('Seite 3', 10, 20)],
    0,
    540,
  ),
  'Big Data',
)
assert.equal(
  guessTitle(
    [piece('Zweizeiliger', 28, 480), piece('Titel', 28, 450), piece('Text', 18, 300)],
    0,
    540,
  ),
  'Zweizeiliger Titel',
)
assert.equal(guessTitle([piece('Nur unten', 12, 50)], 0, 540), 'Nur unten')
assert.equal(guessTitle([], 0, 540), '')

// Themen: Kette, Farben, Löschen mit Nachrücken
const data: Data = {
  semesters: [],
  modules: [],
  slides: [],
  cards: [],
  topics: [
    { id: 'a', moduleId: 'm', title: 'Big Data' },
    { id: 'b', moduleId: 'm', parentId: 'a', title: 'Hadoop' },
    { id: 'c', moduleId: 'm', parentId: 'b', title: 'HDFS' },
    { id: 'd', moduleId: 'm', title: 'Cloud', color: 'red' },
  ],
  pages: [{ slidesId: 's', page: 1, title: '', text: '', hidden: false, topicId: 'b' }],
}
assert.deepEqual(
  chain(data.topics, 'c').map((t) => t.id),
  ['a', 'b', 'c'],
)
const [a, , c, d] = data.topics
assert.equal(hueOf(data.topics, c), hueOf(data.topics, a))
assert.equal(hueOf(data.topics, d), 'red')
assert.equal(hueOf(moveTopic(data, 'd', -1).topics, a), hueOf(data.topics, a))

const removed = removeTopic(data, 'b')
assert.equal(removed.topics.find((t) => t.id === 'c')?.parentId, 'a')
assert.equal(removed.pages[0].topicId, 'a')

const ids = (d: Data) => d.topics.map((t) => t.id)
assert.deepEqual(ids(moveTopic(data, 'd', -1)), ['d', 'b', 'c', 'a'])
assert.deepEqual(ids(moveTopic(data, 'a', -1)), ids(data))
assert.deepEqual(ids(moveTopic(data, 'b', 1)), ids(data))
assert.equal(addTopic(data, 'e', 'm').topics.at(-1)?.color, 'blue')

// Treffer-Markierung: Position über den Zeichenanteil, mehrere Treffer pro Textstück
const line = { str: 'Big Data und big data', transform: [10, 0, 0, 10, 100, 200], width: 210 }
assert.deepEqual(matchRects([line], 'BIG data'), [
  [100, 197.5, 180, 208.5],
  [230, 197.5, 310, 208.5],
])
assert.deepEqual(matchRects([line], '  '), [])

// Aufgaben-Erkennung
assert.equal(isTask('Exercise: Big Data Sources', ''), true)
assert.equal(isTask('Übungsblatt 3', ''), true)
assert.equal(isTask('Big Data', 'Aufgabe 2\nBeschreiben Sie ...'), true)
assert.equal(isTask('Big Data', 'Intro\nVorlesung und Übung SE'), false)
assert.equal(isTask('Multitasking', ''), false)

// Tabellenmodell: VL über ihre Folien verbunden, Themen über Vorlesungsgrenzen hinweg
const mod = { id: 'm', semesterId: 'x', short: 'DABD', name: 'Data', lecturer: 'Frenz' }
const page = (slidesId: string, n: number, topicId?: string) => ({
  slidesId,
  page: n,
  title: `T${n}`,
  text: '',
  hidden: false,
  topicId,
})
const sheet = buildSheet(
  {
    ...data,
    modules: [mod],
    slides: [
      { id: 's1', moduleId: 'm', lectureNum: 'VL1' },
      { id: 's2', moduleId: 'm', lectureNum: 'VL2' },
    ],
    pages: [page('s1', 1, 'a'), page('s1', 2, 'c'), page('s2', 1, 'c'), page('s2', 2, 'd')],
  },
  mod,
)
const spans = (col: number) => sheet.rows.map((r) => r.cells[col]?.rowSpan ?? 0)
assert.equal(sheet.levels, 3)
assert.deepEqual(spans(0), [2, 0, 2, 0]) // VL1, VL2
assert.deepEqual(spans(1), [3, 0, 0, 1]) // Big Data über VL-Grenze, dann Cloud
assert.deepEqual(spans(3), [1, 2, 0, 0]) // HDFS auf Folie 2 und 3, Cloud deckt ab
assert.equal(sheet.rows[3].cells[1]?.colSpan, 3) // Cloud ohne Unterthema: waagerecht verbunden
assert.equal(sheet.rows[0].cells[1]?.colSpan, 1) // Big Data hat Unterthemen: nicht waagerecht
assert.deepEqual(
  sheet.rows.map((r) => r.cells[4]?.text),
  ['1', '2', '1', '2'],
)

console.log('check ok')
