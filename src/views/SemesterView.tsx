import { useState } from 'react'
import { Button, Divider, Group, ScrollArea, Stack, Tabs, Text, Title } from '@mantine/core'
import { IconDownload } from '@tabler/icons-react'
import { DeleteButton } from '../components/DeleteButton'
import { Field } from '../components/Field'
import { SheetPreview } from '../components/SheetPreview'
import type { Data, Semester } from '../lib/db'
import { exportSemester } from '../lib/excel'
import { buildSheet, type Edit } from '../lib/sheet'

type Props = {
  data: Data
  semester: Semester
  onRename: (name: string) => void
  onDelete: () => void
  onEdit: (edit: Edit, value: string) => void
  onOpen: (slidesId: string, page: number) => void
  onToggleHidden: (slidesId: string, pages: number[], hidden: boolean) => void
}

export function SemesterView({ data, semester, onRename, onDelete, ...sheetProps }: Props) {
  const modules = data.modules.filter((m) => m.semesterId === semester.id)
  const [tab, setTab] = useState<string | null>(null)
  const active = modules.find((m) => m.id === tab) ?? modules[0]
  const [exporting, setExporting] = useState(false)

  async function download() {
    setExporting(true)
    try {
      await exportSemester(data, semester)
    } catch (e) {
      console.error(e)
      alert(`Export fehlgeschlagen: ${e instanceof Error ? e.message : e}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Stack gap="sm">
        <Title order={3}>Semester</Title>
        <Group align="flex-end" gap="xs">
          <Field key={semester.id} label="Name" value={semester.name} onSave={onRename} />
          <DeleteButton onClick={onDelete} />
        </Group>
      </Stack>
      <Divider my="md" />

      <Group justify="space-between">
        <Title order={5}>Übersicht</Title>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconDownload size={14} />}
          disabled={!modules.length}
          loading={exporting}
          onClick={download}
        >
          Excel exportieren
        </Button>
      </Group>

      {modules.length === 0 ? (
        <Text c="dimmed">Noch keine Module in diesem Semester.</Text>
      ) : (
        <Tabs
          value={active.id}
          onChange={setTab}
          flex={1}
          mih={0}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <Tabs.List>
            {modules.map((m) => (
              <Tabs.Tab key={m.id} value={m.id}>
                {m.short || m.name}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <ScrollArea flex={1} pt="sm">
            <SheetPreview sheet={buildSheet(data, active)} {...sheetProps} />
          </ScrollArea>
        </Tabs>
      )}
    </>
  )
}
