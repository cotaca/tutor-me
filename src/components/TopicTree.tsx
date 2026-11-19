import {
  ActionIcon,
  Button,
  ColorSwatch,
  Group,
  Popover,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconArrowDown, IconArrowUp, IconPlus, IconTag, IconTrash } from '@tabler/icons-react'
import type { Topic } from '../lib/db'
import { colorOf, PALETTE } from '../lib/topics'

type Props = {
  topics: Topic[]
  canAssign: boolean
  onAssign: (id: string) => void
  onAdd: (parentId?: string) => void
  onPatch: (id: string, change: Partial<Topic>) => void
  onRemove: (id: string) => void
  onMove: (id: string, step: -1 | 1) => void
}

export function TopicTree(props: Props) {
  const roots = props.topics.filter((t) => !t.parentId)

  return (
    <Stack gap="xs" mih={0} h="100%">
      <Group justify="space-between">
        <Title order={5}>Themen</Title>
        <Button size="xs" variant="light" onClick={() => props.onAdd()}>
          + Thema
        </Button>
      </Group>
      {roots.length === 0 && (
        <Text size="sm" c="dimmed">
          Noch keine Themen. Themen gelten für das ganze Modul.
        </Text>
      )}
      <ScrollArea flex={1}>
        {roots.map((t) => (
          <TopicRow key={t.id} topic={t} depth={0} {...props} />
        ))}
      </ScrollArea>
    </Stack>
  )
}

function TopicRow({ topic, depth, ...props }: Props & { topic: Topic; depth: number }) {
  const children = props.topics.filter((t) => t.parentId === topic.id)
  const siblings = props.topics.filter((t) => t.parentId === topic.parentId)
  const isFirst = siblings[0] === topic
  const isLast = siblings.at(-1) === topic

  return (
    <>
      <Group gap={4} pl={depth * 16} py={2} wrap="nowrap" className="hover-parent">
        <Popover position="bottom-start" withArrow>
          <Popover.Target>
            <ColorSwatch
              component="button"
              size={16}
              color={colorOf(props.topics, topic)}
              style={{ cursor: 'pointer', flexShrink: 0 }}
            />
          </Popover.Target>
          <Popover.Dropdown>
            <Group gap={6} maw={180}>
              {PALETTE.map((hue) => (
                <ColorSwatch
                  key={hue}
                  component="button"
                  size={20}
                  color={`var(--mantine-color-${hue}-3)`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => props.onPatch(topic.id, { color: hue })}
                />
              ))}
              {topic.parentId && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  onClick={() => props.onPatch(topic.id, { color: undefined })}
                >
                  Wie Oberthema
                </Button>
              )}
            </Group>
          </Popover.Dropdown>
        </Popover>
        <TextInput
          key={topic.id}
          variant="unstyled"
          size="xs"
          flex={1}
          defaultValue={topic.title}
          onBlur={(e) => {
            if (e.target.value !== topic.title) props.onPatch(topic.id, { title: e.target.value })
          }}
        />
        {props.canAssign && (
          <Tooltip label="Ausgewählte Folien zuweisen">
            <ActionIcon size="sm" variant="light" onClick={() => props.onAssign(topic.id)}>
              <IconTag size={14} />
            </ActionIcon>
          </Tooltip>
        )}
        <ActionIcon
          className="hover-only"
          size="sm"
          variant="subtle"
          color="gray"
          disabled={isFirst}
          onClick={() => props.onMove(topic.id, -1)}
        >
          <IconArrowUp size={14} />
        </ActionIcon>
        <ActionIcon
          className="hover-only"
          size="sm"
          variant="subtle"
          color="gray"
          disabled={isLast}
          onClick={() => props.onMove(topic.id, 1)}
        >
          <IconArrowDown size={14} />
        </ActionIcon>
        <Tooltip label="Unterthema hinzufügen">
          <ActionIcon
            className="hover-only"
            size="sm"
            variant="subtle"
            color="gray"
            onClick={() => props.onAdd(topic.id)}
          >
            <IconPlus size={14} />
          </ActionIcon>
        </Tooltip>
        <ActionIcon
          className="hover-only"
          size="sm"
          variant="subtle"
          color="red"
          onClick={() => {
            if (
              confirm(
                `Thema „${topic.title}“ löschen? Unterthemen und Folien rutschen eine Ebene nach oben.`,
              )
            )
              props.onRemove(topic.id)
          }}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
      {children.map((c) => (
        <TopicRow key={c.id} {...props} topic={c} depth={depth + 1} />
      ))}
    </>
  )
}
