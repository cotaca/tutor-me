import { useState, type KeyboardEvent } from 'react'
import { Button, Group, Stack, Text } from '@mantine/core'
import { MarkdownField } from './MarkdownField'

type Props = {
  initial?: { question: string; answer: string }
  onSave: (card: { question: string; answer: string }) => void
  onCancel?: () => void
}

// Ohne initial: Formular für neue Karten, das nach dem Speichern leer und offen bleibt.
// Strg+Enter speichert, Esc bricht das Bearbeiten ab.
export function CardForm({ initial, onSave, onCancel }: Props) {
  const [question, setQuestion] = useState(initial?.question ?? '')
  const [answer, setAnswer] = useState(initial?.answer ?? '')
  // Zähler für angelegte Karten: neue Felder (wieder im Schreibmodus), Fokus auf die Frage.
  const [round, setRound] = useState(0)
  const valid = question.trim() && answer.trim()

  function save() {
    if (!valid) return
    onSave({ question: question.trim(), answer: answer.trim() })
    if (!initial) {
      setQuestion('')
      setAnswer('')
      setRound((r) => r + 1)
    }
  }

  const keys = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save()
    if (e.key === 'Escape') onCancel?.()
  }

  return (
    <Stack gap="xs">
      <MarkdownField
        key={`q${round}`}
        label="Frage"
        minRows={2}
        value={question}
        onChange={setQuestion}
        onKeyDown={keys}
        autoFocus={!!initial || round > 0}
      />
      <MarkdownField
        key={`a${round}`}
        label="Antwort"
        minRows={3}
        value={answer}
        onChange={setAnswer}
        onKeyDown={keys}
      />
      <Group gap="xs" justify="space-between">
        <Text size="xs" c="dimmed">
          Markdown, Formeln mit $…$ oder $$…$$
        </Text>
        <Group gap="xs">
          {onCancel && (
            <Button variant="subtle" color="gray" onClick={onCancel}>
              Abbrechen
            </Button>
          )}
          <Button disabled={!valid} onClick={save} title="Strg+Enter">
            {initial ? 'Speichern' : 'Karte anlegen'}
          </Button>
        </Group>
      </Group>
    </Stack>
  )
}
