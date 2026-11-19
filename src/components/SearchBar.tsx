import type { Ref } from 'react'
import { ActionIcon, Group, NavLink, ScrollArea, Text, TextInput, Tooltip } from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconFiles, IconX } from '@tabler/icons-react'
import type { Slide, Slides } from '../lib/db'
import { snippet } from '../lib/search'

type Props = {
  inputRef: Ref<HTMLInputElement>
  query: string
  onQuery: (q: string) => void
  onPrev: () => void
  onNext: () => void
  // Nur im Foliensatz: Trefferzähler mit Pfeilen und Umschalter Foliensatz/Modul.
  nav?: { index: number; total: number; moduleScope: boolean; onToggleScope: () => void }
}

export function SearchBar({ inputRef, query, onQuery, onPrev, onNext, nav }: Props) {
  return (
    <Group gap={4} align="flex-end" w={nav ? undefined : '100%'}>
      <TextInput
        ref={inputRef}
        w={nav ? 220 : undefined}
        flex={nav ? undefined : 1}
        label={nav ? 'Suche' : undefined}
        placeholder="Strg+F"
        value={query}
        onChange={(e) => onQuery(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.shiftKey ? onPrev : onNext)()
          if (e.key === 'Escape') onQuery('')
        }}
        rightSectionWidth={nav ? 56 : 28}
        rightSection={
          <Group gap={0} wrap="nowrap">
            {query && (
              <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => onQuery('')}>
                <IconX size={14} />
              </ActionIcon>
            )}
            {nav && (
              <Tooltip
                label={nav.moduleScope ? 'Sucht im ganzen Modul' : 'Sucht nur in diesem Foliensatz'}
              >
                <ActionIcon
                  size="sm"
                  variant={nav.moduleScope ? 'light' : 'subtle'}
                  color={nav.moduleScope ? 'blue' : 'gray'}
                  onClick={nav.onToggleScope}
                >
                  <IconFiles size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        }
      />
      {nav && (
        <>
          <ActionIcon variant="default" size="lg" disabled={!nav.total} onClick={onPrev}>
            <IconChevronUp size={16} />
          </ActionIcon>
          <ActionIcon variant="default" size="lg" disabled={!nav.total} onClick={onNext}>
            <IconChevronDown size={16} />
          </ActionIcon>
          <Text size="sm" c="dimmed" w={60} mb={6}>
            {query.trim() && `${nav.index + 1 || '–'} / ${nav.total}`}
          </Text>
        </>
      )}
    </Group>
  )
}

export function SearchResults(props: {
  hits: Slide[]
  query: string
  slides: Slides[]
  onOpen: (hit: Slide) => void
}) {
  if (!props.query.trim()) return null
  return (
    <ScrollArea flex={1}>
      {props.hits.length === 0 && <Text c="dimmed">Keine Treffer</Text>}
      {props.hits.map((h) => (
        <NavLink
          key={h.slidesId + h.page}
          label={[
            props.slides.find((s) => s.id === h.slidesId)?.lectureNum,
            `Folie ${h.page}`,
            h.title,
          ]
            .filter(Boolean)
            .join(' · ')}
          description={snippet(h.text ?? '', props.query)}
          onClick={() => props.onOpen(h)}
        />
      ))}
    </ScrollArea>
  )
}
