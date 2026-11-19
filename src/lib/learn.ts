import type { Card } from './db.ts'

// Tage bis zur nächsten Abfrage, je Leitner-Fach (Fach 1 = Index 0).
export const INTERVALS = [1, 2, 4, 8, 16]

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const isDue = (card: Card, today: string) => card.due <= today

// Gewusst: ein Fach weiter (höchstens 5), nächste Abfrage nach dessen Intervall.
// Nicht gewusst: zurück in Fach 1, heute noch einmal fällig.
export function review(card: Card, known: boolean, today: string): Pick<Card, 'box' | 'due'> {
  if (!known) return { box: 1, due: today }
  const box = Math.min(card.box + 1, INTERVALS.length)
  return { box, due: addDays(today, INTERVALS[box - 1]) }
}
