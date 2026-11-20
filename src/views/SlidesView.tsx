import { useState, type ReactNode } from 'react'
import { ActionIcon, Group, SegmentedControl, Text, Tooltip } from '@mantine/core'
import { IconPencil } from '@tabler/icons-react'
import { CardItem } from '../components/CardItem'
import { CardList } from '../components/CardList'
import { Field } from '../components/Field'
import { HEADER_HEIGHT } from '../components/layout'
import { Outline } from '../components/Outline'
import { Viewer } from '../components/Viewer'
import { usePdf } from '../hooks/usePdf'
import type { Card, Slide, Slides, Topic } from '../lib/db'
import { slideImage } from '../lib/slideRef'
import { pathLabel, stripes } from '../lib/topics'

type Props = {
  slides: Slides
  pages: Slide[]
  page: number
  hits: Set<number>
  query: string
  topics: Topic[]
  search: ReactNode
  onPage: (page: number) => void
  onPatch: (change: Partial<Slides>) => void
  onPatchPages: (pages: number[], change: Partial<Slide>) => void
  onAssign: (pages: number[], topicId?: string) => void
  onAddTopic: (parentId: string | undefined, assignTo: number[]) => void
  onPatchTopic: (id: string, change: Partial<Topic>) => void
  onRemoveTopic: (id: string) => void
  onMoveTopic: (id: string, step: -1 | 1) => void
  cards: Card[]
  onAddCard: (card: Pick<Card, 'question' | 'answer' | 'link'>) => void
  onPatchCard: (id: string, change: Partial<Card>) => void
  onRemoveCard: (id: string) => void
}

export function SlidesView(props: Props) {
  const { slides, pages, page, topics } = props
  const [mode, setMode] = useState('read')
  // Wartende Anfrage nach einem Folienausschnitt (aus dem Antwortfeld); solange: Rahmen-Modus.
  const [cropWaiting, setCropWaiting] = useState<(snippet?: string) => void>()
  const { doc, thumbs } = usePdf(slides.id)
  const current = pages.find((p) => p.page === page)
  const stripesOf = (p: Slide) => stripes(topics, p.topicId)
  const cardsOf = (n: number) =>
    props.cards.filter((c) => c.link?.slidesId === slides.id && c.link.page === n)

  function requestCrop() {
    cropWaiting?.() // ältere Anfrage abbrechen
    return new Promise<string | undefined>((resolve) => setCropWaiting(() => resolve))
  }

  const modeSwitch = (
    <SegmentedControl
      value={mode}
      onChange={(m) => {
        cropWaiting?.()
        setCropWaiting(undefined)
        setMode(m)
      }}
      data={[
        { label: 'Lesen', value: 'read' },
        { label: 'Gliedern', value: 'outline' },
        { label: 'Karten', value: 'cards' },
      ]}
    />
  )

  // Die Felder hängen per key an Foliensatz und Seite, nicht die ganze Ansicht:
  // so behält das Suchfeld den Fokus, wenn die Suche in einen anderen Foliensatz springt.
  return mode !== 'outline' ? (
    <>
      <Group align="flex-end" gap="xs" h={HEADER_HEIGHT}>
        <Field
          key={slides.id}
          w={90}
          label="Vorlesung"
          value={slides.lectureNum}
          onSave={(v) => props.onPatch({ lectureNum: v })}
        />
        <Field
          key={slides.id + page}
          w={400}
          label="Folientitel"
          value={current?.title ?? ''}
          onSave={(v) => props.onPatchPages([page], { title: v })}
        />
        <Tooltip label={current?.task ? 'Aufgabe-Markierung entfernen' : 'Als Aufgabe markieren'}>
          <ActionIcon
            size="input-sm"
            variant={current?.task ? 'filled' : 'default'}
            color={current?.task ? 'orange' : undefined}
            onClick={() => props.onPatchPages([page], { task: !current?.task })}
          >
            <IconPencil size={18} />
          </ActionIcon>
        </Tooltip>
        {props.search}
        <div style={{ marginLeft: 'auto' }}>{modeSwitch}</div>
      </Group>
      <Text size="sm" c="dimmed" mih={20}>
        {pathLabel(topics, current?.topicId)}
      </Text>
      <Viewer
        key={slides.id}
        doc={doc}
        thumbs={thumbs}
        pages={pages}
        page={page}
        hits={props.hits}
        query={props.query}
        stripes={stripesOf}
        cardCount={(p) => cardsOf(p.page).length}
        cropping={mode === 'cards' && !!cropWaiting}
        onCrop={(rect) => {
          cropWaiting?.(rect && slideImage({ slidesId: slides.id, page, rect }))
          setCropWaiting(undefined)
        }}
        side={
          mode === 'cards' && (
            <CardList
              title={`Karteikarten zu Folie ${page}`}
              cards={cardsOf(page)}
              alwaysShowForm
              onRequestCrop={requestCrop}
              empty="Noch keine Karten zu dieser Folie."
              onAdd={(card) => props.onAddCard({ ...card, link: { slidesId: slides.id, page } })}
              renderCard={(c) => (
                <CardItem
                  key={c.id}
                  card={c}
                  onPatch={(change) => props.onPatchCard(c.id, change)}
                  onRemove={() => props.onRemoveCard(c.id)}
                  onRequestCrop={requestCrop}
                />
              )}
            />
          )
        }
        onPage={props.onPage}
        onPatchPages={props.onPatchPages}
      />
    </>
  ) : (
    <Outline
      key={slides.id}
      pages={pages}
      thumbs={thumbs}
      topics={topics}
      stripes={stripesOf}
      cardCount={(p) => cardsOf(p.page).length}
      modeSwitch={modeSwitch}
      onPatchPages={props.onPatchPages}
      onAssign={props.onAssign}
      onAddTopic={props.onAddTopic}
      onPatchTopic={props.onPatchTopic}
      onRemoveTopic={props.onRemoveTopic}
      onMoveTopic={props.onMoveTopic}
    />
  )
}
