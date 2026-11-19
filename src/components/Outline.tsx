import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { Button, Group, ScrollArea, SimpleGrid, Stack, Text } from '@mantine/core'
import type { Slide, Topic } from '../lib/db'
import { HEADER_HEIGHT } from './layout'
import { Thumb } from './Thumb'
import { TopicTree } from './TopicTree'

type Props = {
  pages: Slide[]
  thumbs: string[]
  topics: Topic[]
  stripes: (page: Slide) => string[]
  onToggleHidden: (page: number) => void
  onAssign: (pages: number[], topicId?: string) => void
  onAddTopic: (parentId: string | undefined, assignTo: number[]) => void
  onPatchTopic: (id: string, change: Partial<Topic>) => void
  onRemoveTopic: (id: string) => void
  onMoveTopic: (id: string, step: -1 | 1) => void
  modeSwitch: ReactNode
}

// Modus "Gliedern": Folien im Raster auswählen und Themen zuweisen.
export function Outline(props: Props) {
  const [selected, setSelected] = useState<number[]>([])
  const [anchor, setAnchor] = useState<number>()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected([])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Klick wählt eine Folie, Strg+Klick ergänzt, Shift+Klick wählt den Bereich ab der letzten Folie.
  function select(page: number, e: MouseEvent) {
    if (e.shiftKey && anchor !== undefined) {
      const [from, to] = [Math.min(anchor, page), Math.max(anchor, page)]
      setSelected(props.pages.filter((p) => p.page >= from && p.page <= to).map((p) => p.page))
      return
    }
    setAnchor(page)
    if (e.ctrlKey || e.metaKey)
      setSelected((s) => (s.includes(page) ? s.filter((x) => x !== page) : [...s, page]))
    else setSelected([page])
  }

  return (
    <>
      {/* Gleicher Aufbau wie im Lesemodus (Kopfzeile + Statuszeile), damit beim Wechsel nichts springt. */}
      <Group gap="xs" h={HEADER_HEIGHT} align="flex-end">
        {selected.length > 0 && (
          <>
            <Button variant="default" onClick={() => props.onAssign(selected)}>
              Thema entfernen
            </Button>
            <Button variant="subtle" color="gray" onClick={() => setSelected([])}>
              Auswahl aufheben
            </Button>
          </>
        )}
        <div style={{ marginLeft: 'auto' }}>{props.modeSwitch}</div>
      </Group>
      <Text size="sm" c={selected.length ? undefined : 'dimmed'} mih={20}>
        {selected.length
          ? `${selected.length} Folien ausgewählt`
          : 'Folien anklicken, mit Shift+Klick einen Bereich wählen, dann rechts ein Thema zuweisen.'}
      </Text>

      <Group flex={1} mih={0} align="stretch" wrap="nowrap" gap="lg">
        <ScrollArea flex={1}>
          <SimpleGrid cols={{ base: 3, md: 4, xl: 5 }} spacing="sm" verticalSpacing="sm">
            {props.pages.map((p, i) => (
              <Stack key={p.page} gap={2}>
                <Thumb
                  url={props.thumbs[i]}
                  hidden={p.hidden}
                  border={selected.includes(p.page) ? 'blue-6' : 'gray-3'}
                  stripes={props.stripes(p)}
                  onClick={(e) => select(p.page, e)}
                  onToggleHidden={() => props.onToggleHidden(p.page)}
                />
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {p.page}. {p.title}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>
        </ScrollArea>

        <div style={{ width: 280, flexShrink: 0 }}>
          <TopicTree
            topics={props.topics}
            canAssign={selected.length > 0}
            onAssign={(id) => props.onAssign(selected, id)}
            onAdd={(parentId) => props.onAddTopic(parentId, selected)}
            onPatch={props.onPatchTopic}
            onRemove={props.onRemoveTopic}
            onMove={props.onMoveTopic}
          />
        </div>
      </Group>
    </>
  )
}
