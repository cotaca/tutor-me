import { useState, type ReactNode } from 'react'
import { Group, SegmentedControl, Text } from '@mantine/core'
import { Field } from '../components/Field'
import { HEADER_HEIGHT } from '../components/layout'
import { Outline } from '../components/Outline'
import { Viewer } from '../components/Viewer'
import { usePdf } from '../hooks/usePdf'
import type { Slide, Slides, Topic } from '../lib/db'
import { pathLabel, stripes } from '../lib/topics'

type Props = {
  slides: Slides
  pages: Slide[]
  page: number
  hits: Set<number>
  topics: Topic[]
  search: ReactNode
  onPage: (page: number) => void
  onPatch: (change: Partial<Slides>) => void
  onPatchPage: (page: number, change: Partial<Slide>) => void
  onToggleHidden: (page: number) => void
  onAssign: (pages: number[], topicId?: string) => void
  onAddTopic: (parentId: string | undefined, assignTo: number[]) => void
  onPatchTopic: (id: string, change: Partial<Topic>) => void
  onRemoveTopic: (id: string) => void
  onMoveTopic: (id: string, step: -1 | 1) => void
}

export function SlidesView(props: Props) {
  const { slides, pages, page, topics } = props
  const [mode, setMode] = useState('read')
  const { doc, thumbs } = usePdf(slides.id)
  const current = pages.find((p) => p.page === page)
  const stripesOf = (p: Slide) => stripes(topics, p.topicId)

  const modeSwitch = (
    <SegmentedControl
      value={mode}
      onChange={setMode}
      data={[
        { label: 'Lesen', value: 'read' },
        { label: 'Gliedern', value: 'outline' },
      ]}
    />
  )

  // Die Felder hängen per key an Foliensatz und Seite, nicht die ganze Ansicht:
  // so behält das Suchfeld den Fokus, wenn die Suche in einen anderen Foliensatz springt.
  return mode === 'read' ? (
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
          onSave={(v) => props.onPatchPage(page, { title: v })}
        />
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
        stripes={stripesOf}
        onPage={props.onPage}
        onToggleHidden={props.onToggleHidden}
      />
    </>
  ) : (
    <Outline
      key={slides.id}
      pages={pages}
      thumbs={thumbs}
      topics={topics}
      stripes={stripesOf}
      modeSwitch={modeSwitch}
      onToggleHidden={props.onToggleHidden}
      onAssign={props.onAssign}
      onAddTopic={props.onAddTopic}
      onPatchTopic={props.onPatchTopic}
      onRemoveTopic={props.onRemoveTopic}
      onMoveTopic={props.onMoveTopic}
    />
  )
}
