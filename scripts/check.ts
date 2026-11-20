import assert from 'node:assert'
import type { Data } from '../src/lib/db.ts'
import { guessTitle, isTask } from '../src/lib/pdfText.ts'
import { buildSheet } from '../src/lib/sheet.ts'
import { addDays, isDue, review } from '../src/lib/learn.ts'
import { makeBackup, parseBackup } from '../src/lib/backup.ts'
import { addTopic, chain, hueOf, moveTopic, removeTopic } from '../src/lib/topics.ts'
import { parseSlideUrl, rectFrom, slideImage, slideUrl } from '../src/lib/slideRef.ts'

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

// Ausgeblendete Folien: verbundene Zellen nur grau, wenn alle ihre Folien ausgeblendet sind.
const partly = buildSheet(
  {
    ...data,
    modules: [mod],
    slides: [{ id: 's1', moduleId: 'm', lectureNum: 'VL1' }],
    pages: [
      { ...page('s1', 1, 'a'), hidden: true },
      page('s1', 2, 'a'),
      { ...page('s1', 3, 'd'), hidden: true },
    ],
  },
  mod,
)
const hiddenCells = (r: number) => partly.rows[r].cells.filter(Boolean).map((c) => !!c!.hidden)
assert.deepEqual(hiddenCells(0), [false, false, true, true, true]) // VL1, Big Data, Folie 1 grau
assert.deepEqual(hiddenCells(2), [true, true, true, true]) // Cloud nur auf ausgeblendeter Folie 3

// Leitner: gewusst = ein Fach weiter mit dessen Intervall, nicht gewusst = Fach 1, heute fällig
const card = { id: 'k', moduleId: 'm', question: '', answer: '', box: 1, due: '2026-01-30' }
assert.equal(addDays('2026-01-30', 2), '2026-02-01')
assert.deepEqual(review(card, true, '2026-01-30'), { box: 2, due: '2026-02-01' })
assert.deepEqual(review({ ...card, box: 5 }, true, '2026-01-30'), { box: 5, due: '2026-02-15' })
assert.deepEqual(review({ ...card, box: 4 }, false, '2026-01-30'), { box: 1, due: '2026-01-30' })
assert.equal(isDue(card, '2026-01-29'), false)
assert.equal(isDue(card, '2026-01-30'), true)

// Backup: Rundweg, Ablehnung fremder oder unvollständiger Dateien
const backupData = { ...data, slides: [{ id: 's1', moduleId: 'm', lectureNum: 'VL1' }] }
const roundtrip = parseBackup(JSON.stringify(makeBackup(backupData, { s1: 'QUJD' })))
assert.deepEqual(roundtrip.data, backupData)
assert.throws(() => parseBackup('kein json'), /kein gültiges JSON/)
assert.throws(() => parseBackup('{"app":"andere"}'), /kein TutorMe-Backup/)
assert.throws(() => parseBackup(JSON.stringify(makeBackup(backupData, {}))), /fehlen 1 PDF/)
const old = parseBackup(JSON.stringify({ app: 'tutor-me', data: { semesters: [] }, pdfs: {} }))
assert.deepEqual(old.data.cards, []) // fehlende Listen aus älteren Backups werden ergänzt

// Folienausschnitte
const crop = {
  slidesId: '3f2a-b9',
  page: 14,
  rect: [0.12345, 0.3, 0.55, 0.4] as [number, number, number, number],
}
assert.equal(slideUrl(crop), 'slide:3f2a-b9/14#0.123,0.3,0.55,0.4')
assert.equal(slideImage(crop), '![Folie 14](slide:3f2a-b9/14#0.123,0.3,0.55,0.4)')
assert.deepEqual(parseSlideUrl(slideUrl(crop)), { ...crop, rect: [0.123, 0.3, 0.55, 0.4] })
assert.equal(parseSlideUrl('https://example.com/a.png'), undefined)
assert.equal(parseSlideUrl('slide:x/1#0.5,0,0.6,1'), undefined) // ragt über den Rand
assert.equal(parseSlideUrl('slide:x/1#0,0,0,1'), undefined) // leerer Rahmen
const r6 = (r: number[]) => r.map((n) => Math.round(n * 1e6) / 1e6)
assert.deepEqual(r6(rectFrom([0.8, 0.9], [0.2, 0.1])), [0.2, 0.1, 0.6, 0.8]) // beliebige Zugrichtung
assert.deepEqual(rectFrom([-0.5, 0.5], [0.5, 1.5]), [0, 0.5, 0.5, 0.5]) // auf die Folie begrenzt

console.log('check ok')
