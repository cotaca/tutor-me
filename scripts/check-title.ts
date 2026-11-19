import assert from 'node:assert'
import { guessTitle } from '../src/pdfText.ts'

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

console.log('check-title ok')
