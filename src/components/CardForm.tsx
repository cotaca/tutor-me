import { useRef, useState, type KeyboardEvent } from 'react'
import { Button, Group, Stack, Textarea } from '@mantine/core'

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
  const questionRef = useRef<HTMLTextAreaElement>(null)
  const valid = question.trim() && answer.trim()

  function save() {
    if (!valid) return
    onSave({ question: question.trim(), answer: answer.trim() })
    if (!initial) {
      setQuestion('')
      setAnswer('')
      questionRef.current?.focus()
    }
  }

  const keys = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save()
    if (e.key === 'Escape') onCancel?.()
  }

  return (
    <Stack gap="xs">
      <Textarea
        ref={questionRef}
        label="Frage"
        autosize
        minRows={2}
        value={question}
        onChange={(e) => setQuestion(e.currentTarget.value)}
        onKeyDown={keys}
        autoFocus={!!initial}
      />
      <Textarea
        label="Antwort"
        autosize
        minRows={3}
        value={answer}
        onChange={(e) => setAnswer(e.currentTarget.value)}
        onKeyDown={keys}
      />
      <Group gap="xs" justify="flex-end">
        {onCancel && (
          <Button variant="subtle" color="gray" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
        <Button disabled={!valid} onClick={save} title="Strg+Enter">
          {initial ? 'Speichern' : 'Karte anlegen'}
        </Button>
      </Group>
    </Stack>
  )
}
