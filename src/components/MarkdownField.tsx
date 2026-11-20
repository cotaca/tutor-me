import { useState, type KeyboardEvent } from 'react'
import { Group, Paper, SegmentedControl, Text, Textarea } from '@mantine/core'
import { Rich } from './Rich'

type Props = {
  label: string
  value: string
  onChange: (v: string) => void
  onKeyDown: (e: KeyboardEvent) => void
  minRows: number
  autoFocus?: boolean
}

// Textfeld mit Umschalter Schreiben/Vorschau wie bei GitLab.
export function MarkdownField({ label, value, onChange, onKeyDown, minRows, autoFocus }: Props) {
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  // Nach dem Zurückwechseln direkt weiterschreiben können.
  const [switched, setSwitched] = useState(false)

  return (
    // In der Vorschau fängt der Rahmen Strg+Enter und Esc ab (vom Umschalter oder der Vorschau).
    <div onKeyDown={mode === 'preview' ? onKeyDown : undefined}>
      <Group justify="space-between" mb={4}>
        <Text size="sm" fw={500}>
          {label}
        </Text>
        <SegmentedControl
          size="xs"
          value={mode}
          onChange={(v) => {
            setMode(v as 'write' | 'preview')
            setSwitched(true)
          }}
          data={[
            { value: 'write', label: 'Schreiben' },
            { value: 'preview', label: 'Vorschau' },
          ]}
        />
      </Group>
      {mode === 'write' ? (
        <Textarea
          aria-label={label}
          autosize
          minRows={minRows}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus || switched}
        />
      ) : (
        <Paper withBorder p="xs" mih={minRows * 24 + 14} tabIndex={0}>
          {value.trim() ? (
            <Rich text={value} />
          ) : (
            <Text size="sm" c="dimmed">
              Nichts zur Vorschau.
            </Text>
          )}
        </Paper>
      )}
    </div>
  )
}
