import { useState, type ReactNode } from 'react'
import { Button, Group, Paper, ScrollArea, Select, Stack, Text, Title } from '@mantine/core'
import { today } from '../lib/cards'
import type { Card } from '../lib/db'
import { isDue } from '../lib/learn'
import { CardForm } from './CardForm'

type Props = {
  title: ReactNode
  cards: Card[]
  renderCard: (card: Card) => ReactNode
  onAdd: (card: { question: string; answer: string }) => void
  // Optionaler Filter, z. B. nach Thema: Auswahlmöglichkeiten und Prüfung pro Karte.
  filter?: {
    label: string
    options: { value: string; label: string }[]
    matches: (card: Card, value: string) => boolean
  }
  // true: Formular für neue Karten immer sichtbar (Karten-Modus), sonst hinter "+ Karteikarte".
  alwaysShowForm?: boolean
  empty: string
  // Startet eine Lernrunde mit den gerade angezeigten (ggf. gefilterten) Karten.
  onLearn?: (cards: Card[], filterLabel?: string) => void
}

export function CardList(props: Props) {
  const [adding, setAdding] = useState(false)
  const [filterValue, setFilterValue] = useState<string | null>(null)
  const shown =
    props.filter && filterValue
      ? props.cards.filter((c) => props.filter!.matches(c, filterValue))
      : props.cards
  const form = (
    <Paper withBorder p="sm">
      <CardForm
        onSave={props.onAdd}
        onCancel={props.alwaysShowForm ? undefined : () => setAdding(false)}
      />
    </Paper>
  )

  return (
    <Stack gap="sm" mih={0} h="100%">
      <Group justify="space-between" wrap="nowrap">
        <Title order={5}>{props.title}</Title>
        <Group gap="xs" wrap="nowrap">
          {props.onLearn && (
            <Button
              size="xs"
              disabled={!shown.length}
              onClick={() =>
                props.onLearn!(
                  shown,
                  props.filter?.options.find((o) => o.value === filterValue)?.label,
                )
              }
            >
              Lernen ({shown.filter((c) => isDue(c, today())).length} fällig)
            </Button>
          )}
          {!props.alwaysShowForm && !adding && (
            <Button size="xs" variant="light" onClick={() => setAdding(true)}>
              + Karteikarte
            </Button>
          )}
        </Group>
      </Group>
      {props.filter && props.filter.options.length > 0 && (
        <Select
          size="xs"
          placeholder={props.filter.label}
          clearable
          data={props.filter.options}
          value={filterValue}
          onChange={setFilterValue}
        />
      )}
      {adding && form}
      <ScrollArea flex={1}>
        <Stack gap="xs">
          {shown.length === 0 && (
            <Text size="sm" c="dimmed">
              {props.empty}
            </Text>
          )}
          {shown.map((c) => props.renderCard(c))}
          {props.alwaysShowForm && form}
        </Stack>
      </ScrollArea>
    </Stack>
  )
}
