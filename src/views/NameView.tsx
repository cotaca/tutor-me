import { Group, Title } from '@mantine/core'
import { DeleteButton } from '../components/DeleteButton'
import { Field } from '../components/Field'

// Ansicht für Einträge, die nur einen Namen haben (Studiengang, Semester).
export function NameView(props: {
  title: string
  value: string
  onSave: (v: string) => void
  onDelete: () => void
}) {
  return (
    <>
      <Title order={3}>{props.title}</Title>
      <Group align="flex-end" gap="xs">
        <Field label="Name" value={props.value} onSave={props.onSave} />
        <DeleteButton onClick={props.onDelete} />
      </Group>
    </>
  )
}
