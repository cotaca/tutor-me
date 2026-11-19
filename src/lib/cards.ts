import type { Card, Data } from './db.ts'

export const today = () => new Date().toISOString().slice(0, 10)

// Neue Karten starten in Leitner-Fach 1 und sind sofort fällig.
export function addCard(
  data: Data,
  card: Pick<Card, 'id' | 'moduleId' | 'question' | 'answer' | 'link'>,
): Data {
  return { ...data, cards: [...data.cards, { ...card, box: 1, due: today() }] }
}

export const removeCard = (data: Data, id: string): Data => ({
  ...data,
  cards: data.cards.filter((c) => c.id !== id),
})

export const linkLabel = (data: Data, card: Card) => {
  if (!card.link) return ''
  const lecture = data.slides.find((s) => s.id === card.link!.slidesId)?.lectureNum
  return `${lecture} · Folie ${card.link.page}`
}
