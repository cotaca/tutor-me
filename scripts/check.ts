import assert from 'node:assert'
import type { Data } from '../src/lib/db.ts'
import { guessTitle } from '../src/lib/pdfText.ts'
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

console.log('check ok')
