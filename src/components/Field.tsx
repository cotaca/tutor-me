import { TextInput } from '@mantine/core'

// Speichert erst beim Verlassen des Feldes, sonst würde z.B. ein Studiengang beim Tippen
// kurzzeitig einen gleichnamigen anderen treffen und mit ihm verschmelzen.
export function Field(props: {
  label: string
  value: string
  w?: number
  flex?: number
  onSave: (v: string) => void
}) {
  return (
    <TextInput
      w={props.flex ? undefined : (props.w ?? 500)}
      flex={props.flex}
      maw="100%"
      label={props.label}
      defaultValue={props.value}
      onBlur={(e) => {
        if (e.target.value !== props.value) props.onSave(e.target.value)
      }}
    />
  )
}
