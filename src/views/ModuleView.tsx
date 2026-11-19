import { useRef, type ReactNode } from 'react'
import {
  Button,
  Divider,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import type { Module, Slide, Slides } from '../lib/db'
import { DeleteButton } from '../components/DeleteButton'
import { Field } from '../components/Field'

type Props = {
  module: Module
  slides: Slides[]
  pages: Slide[]
  search: ReactNode
  onPatch: (change: Partial<Module>) => void
  onUpload: (files: File[]) => void
  onOpenSlides: (id: string) => void
  onDelete: () => void
}

export function ModuleView({
  module,
  slides,
  pages,
  search,
  onPatch,
  onUpload,
  onOpenSlides,
  onDelete,
}: Props) {
  return (
    <>
      <Stack gap="sm">
        <Title order={3}>Modul</Title>
        <Group align="flex-end" gap="xs" wrap="nowrap">
          <Field
            key={module.id + 'short'}
            w={90}
            label="Kürzel"
            value={module.short}
            onSave={(v) => onPatch({ short: v })}
          />
          <Field
            key={module.id + 'name'}
            flex={1}
            label="Name"
            value={module.name}
            onSave={(v) => onPatch({ name: v })}
          />
          <Field
            key={module.id + 'lecturer'}
            flex={1}
            label="Dozent*in"
            value={module.lecturer}
            onSave={(v) => onPatch({ lecturer: v })}
          />
          <DeleteButton onClick={onDelete} />
        </Group>
      </Stack>
      <Divider my="md" />

      <SimpleGrid
        cols={3}
        spacing="lg"
        flex={1}
        mih={0}
        style={{ gridTemplateRows: 'minmax(0, 1fr)' }}
      >
        <Stack gap="sm">
          <Title order={5}>Karteikarten</Title>
        </Stack>

        <SlidesTable slides={slides} pages={pages} onOpen={onOpenSlides} onUpload={onUpload} />

        <Stack gap="sm" mih={0}>
          <Title order={5}>Suche</Title>
          {search}
        </Stack>
      </SimpleGrid>
    </>
  )
}

function SlidesTable(props: {
  slides: Slides[]
  pages: Slide[]
  onOpen: (id: string) => void
  onUpload: (files: File[]) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const pickFiles = () => fileRef.current?.click()

  return (
    <Stack gap="sm" mih={0}>
      <Group justify="space-between">
        <Title order={5}>Foliensätze</Title>
        <Button size="xs" variant="light" onClick={pickFiles}>
          + Hochladen
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          multiple
          hidden
          onChange={(e) => {
            props.onUpload([...(e.target.files ?? [])])
            e.target.value = ''
          }}
        />
      </Group>
      <ScrollArea flex={1}>
        <Table highlightOnHover stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Vorlesung</Table.Th>
              <Table.Th>Titel</Table.Th>
              <Table.Th>Folien</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {props.slides.map((sl) => {
              const ps = props.pages.filter((p) => p.slidesId === sl.id)
              return (
                <Table.Tr
                  key={sl.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => props.onOpen(sl.id)}
                >
                  <Table.Td>{sl.lectureNum}</Table.Td>
                  <Table.Td>{ps[0]?.title}</Table.Td>
                  <Table.Td>
                    {ps.filter((p) => !p.hidden).length}{' '}
                    <Text span c="dimmed">
                      ({ps.length})
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            <Table.Tr style={{ cursor: 'pointer' }} onClick={pickFiles}>
              <Table.Td colSpan={3} c="dimmed">
                + Foliensatz hochladen
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Stack>
  )
}
