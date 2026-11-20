import { useRef, useState, type KeyboardEvent } from 'react'
import { Button, Group, Paper, SegmentedControl, Text, Textarea } from '@mantine/core'
import { IconCrop } from '@tabler/icons-react'
import { Rich } from './Rich'

type Props = {
  label: string
  value: string
  onChange: (v: string) => void
  onKeyDown: (e: KeyboardEvent) => void
  minRows: number
  autoFocus?: boolean
  // Holt einen Folienausschnitt als Markdown (undefined = abgebrochen), z. B. im Karten-Modus.
  onRequestInsert?: () => Promise<string | undefined>
}

// Textfeld mit Umschalter Schreiben/Vorschau wie bei GitLab.
export function MarkdownField({
  label,
  value,
  onChange,
  onKeyDown,
  minRows,
  autoFocus,
  onRequestInsert,
}: Props) {
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  // Nach dem Zurückwechseln direkt weiterschreiben können.
  const [switched, setSwitched] = useState(false)
  const [inserting, setInserting] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  async function insert() {
    // Cursor merken, bevor der Fokus wegwandert; in der Vorschau ans Ende anhängen.
    const area = mode === 'write' ? textRef.current : null
    const start = area ? area.selectionStart : value.length
    const end = area ? area.selectionEnd : value.length
    // Fokus abgeben, damit Esc beim Rahmenziehen nicht das Formular abbricht.
    ;(document.activeElement as HTMLElement | null)?.blur()
    setInserting(true)
    const snippet = await onRequestInsert!()
    setInserting(false)
    if (!snippet) return
    // Bild als eigener Absatz.
    const before = value.slice(0, start).replace(/\s*$/, '')
    const after = value.slice(end).replace(/^\s*/, '')
    const head = before ? `${before}\n\n` : ''
    onChange(`${head}${snippet}${after ? `\n\n${after}` : ''}`)
    const caret = head.length + snippet.length
    requestAnimationFrame(() => {
      textRef.current?.focus()
      textRef.current?.setSelectionRange(caret, caret)
    })
  }

  return (
    // In der Vorschau fängt der Rahmen Strg+Enter und Esc ab (vom Umschalter oder der Vorschau).
    <div onKeyDown={mode === 'preview' ? onKeyDown : undefined}>
      <Group justify="space-between" mb={4} gap="xs">
        <Text size="sm" fw={500}>
          {label}
        </Text>
        <Group gap="xs">
          {onRequestInsert && (
            <Button
              size="compact-xs"
              variant={inserting ? 'filled' : 'subtle'}
              leftSection={<IconCrop size={14} />}
              disabled={inserting}
              onClick={insert}
              title="Rahmen auf der Folie ziehen und als Bild einfügen"
            >
              {inserting ? 'Rahmen ziehen…' : 'Ausschnitt'}
            </Button>
          )}
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
      </Group>
      {mode === 'write' ? (
        <Textarea
          ref={textRef}
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
