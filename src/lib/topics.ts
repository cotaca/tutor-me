import type { Data, Topic } from './db.ts'

export const PALETTE = [
  'blue',
  'teal',
  'orange',
  'grape',
  'lime',
  'pink',
  'cyan',
  'yellow',
  'violet',
  'red',
]

// Thema mit allen Oberthemen, vom obersten bis zum Thema selbst.
export function chain(topics: Topic[], id?: string) {
  const path: Topic[] = []
  let t = topics.find((x) => x.id === id)
  while (t) {
    path.unshift(t)
    const parentId: string | undefined = t.parentId
    t = topics.find((x) => x.id === parentId)
  }
  return path
}

// Eigene Farbe, sonst die des nächsten Oberthemas. Oberthemen ohne gespeicherte Farbe
// (ältere Daten) bekommen eine aus ihrer id abgeleitete, damit Verschieben und Löschen nichts ändern.
export function hueOf(topics: Topic[], topic: Topic) {
  const path = chain(topics, topic.id)
  const own = path.findLast((t) => t.color)?.color
  if (own) return own
  const hash = [...path[0].id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return PALETTE[hash % PALETTE.length]
}

// Oberthemen pastell, jede tiefere Ebene etwas kräftiger.
export function colorOf(topics: Topic[], topic: Topic) {
  const depth = chain(topics, topic.id).length - 1
  const shade = [2, 4, 6, 8][Math.min(depth, 3)]
  return `var(--mantine-color-${hueOf(topics, topic)}-${shade})`
}

export const stripes = (topics: Topic[], id?: string) =>
  chain(topics, id).map((t) => colorOf(topics, t))

export const pathLabel = (topics: Topic[], id?: string) =>
  chain(topics, id)
    .map((t) => t.title)
    .join(' › ')

// Neue Oberthemen bekommen die nächste Palettenfarbe fest, damit Verschieben die Farben nicht ändert.
export function addTopic(data: Data, id: string, moduleId: string, parentId?: string): Data {
  const roots = data.topics.filter((t) => t.moduleId === moduleId && !t.parentId)
  const used = roots.map((t) => hueOf(data.topics, t))
  const free = PALETTE.find((h) => !used.includes(h)) ?? PALETTE[roots.length % PALETTE.length]
  const topic: Topic = {
    id,
    moduleId,
    parentId,
    title: parentId ? 'Neues Unterthema' : 'Neues Thema',
    color: parentId ? undefined : free,
  }
  return { ...data, topics: [...data.topics, topic] }
}

// Unterthemen und Folien des gelöschten Themas rutschen eine Ebene nach oben.
export function removeTopic(data: Data, id: string): Data {
  const parentId = data.topics.find((t) => t.id === id)?.parentId
  return {
    ...data,
    topics: data.topics
      .filter((t) => t.id !== id)
      .map((t) => (t.parentId === id ? { ...t, parentId } : t)),
    pages: data.pages.map((p) => (p.topicId === id ? { ...p, topicId: parentId } : p)),
  }
}

export function assignTopic(data: Data, slidesId: string, pages: number[], topicId?: string): Data {
  return {
    ...data,
    pages: data.pages.map((p) =>
      p.slidesId === slidesId && pages.includes(p.page) ? { ...p, topicId } : p,
    ),
  }
}

// Tauscht das Thema mit dem vorherigen (-1) oder nächsten (1) Thema derselben Ebene.
export function moveTopic(data: Data, id: string, step: -1 | 1): Data {
  const topic = data.topics.find((t) => t.id === id)
  if (!topic) return data
  const siblings = data.topics.filter(
    (t) => t.moduleId === topic.moduleId && t.parentId === topic.parentId,
  )
  const other = siblings[siblings.indexOf(topic) + step]
  if (!other) return data
  const topics = [...data.topics]
  const [i, j] = [topics.indexOf(topic), topics.indexOf(other)]
  ;[topics[i], topics[j]] = [topics[j], topics[i]]
  return { ...data, topics }
}
