import { useState } from 'react'
import { ActionIcon, Anchor, Group, Paper, Stack } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { Card } from '../lib/db'
import { CardForm } from './CardForm'
import { Rich } from './Rich'

type Props = {
  card: Card
  link?: string // z. B. "VL2 · Folie 14"
  onOpenLink?: () => void
  onPatch: (change: Partial<Card>) => void
  onRemove: () => void
  onRequestCrop?: () => Promise<string | undefined>
}

// Frage sichtbar, Antwort per Klick aufklappbar; Bearbeiten und Löschen beim Überfahren.
export function CardItem({ card, link, onOpenLink, onPatch, onRemove, onRequestCrop }: Props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)

  if (editing)
    return (
      <Paper withBorder p="sm">
        <CardForm
          initial={card}
          onSave={(change) => {
            onPatch(change)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
          onRequestCrop={onRequestCrop}
        />
      </Paper>
    )

  return (
    <Paper withBorder p="sm" className="hover-parent">
      <Group align="flex-start" wrap="nowrap" gap="xs">
        <Stack
          gap={4}
          flex={1}
          miw={0}
          style={{ cursor: 'pointer' }}
          onClick={() => setOpen((o) => !o)}
        >
          <Rich text={card.question} fw={600} />
          {open && <Rich text={card.answer} />}
          {link && (
            <Anchor
              size="xs"
              c="dimmed"
              onClick={(e) => {
                e.stopPropagation()
                onOpenLink?.()
              }}
            >
              {link}
            </Anchor>
          )}
        </Stack>
        <Group gap={2} wrap="nowrap" className="hover-only">
          <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => setEditing(true)}>
            <IconPencil size={14} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            onClick={() => {
              if (confirm('Karteikarte löschen?')) onRemove()
            }}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  )
}
