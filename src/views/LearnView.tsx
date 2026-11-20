import { useEffect, useState } from 'react'
import { Anchor, Button, Group, Kbd, Paper, Stack, Text, Title } from '@mantine/core'
import { Rich } from '../components/Rich'
import { SlideImage } from '../components/SlideImage'
import { today } from '../lib/cards'
import type { Card } from '../lib/db'
import { isDue } from '../lib/learn'

type Props = {
  title: string
  cards: Card[]
  linkLabel: (card: Card) => string
  onReview: (id: string, known: boolean) => void
  onOpenSlide: (slidesId: string, page: number) => void
  onExit: () => void
}

// Lernrunde: Frage zeigen, Antwort aufdecken, selbst bewerten.
// Nicht gewusste Karten kommen ans Ende der Runde, bis sie sitzen.
export function LearnView({ title, cards, linkLabel, onReview, onOpenSlide, onExit }: Props) {
  const due = cards.filter((c) => isDue(c, today()))
  const [queue, setQueue] = useState<string[]>()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [showSlide, setShowSlide] = useState(false)
  const [stats, setStats] = useState({ known: 0, unknown: 0 })

  const card = queue && cards.find((c) => c.id === queue[index])
  const done = queue && index >= queue.length

  function answer(known: boolean) {
    if (!card || !queue) return
    onReview(card.id, known)
    if (!known) setQueue([...queue, card.id])
    setStats((s) => (known ? { ...s, known: s.known + 1 } : { ...s, unknown: s.unknown + 1 }))
    setIndex(index + 1)
    setRevealed(false)
    setShowSlide(false)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!card) return
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setRevealed(true)
      }
      if (revealed && (e.key === '1' || e.key === 'ArrowLeft')) answer(false)
      if (revealed && (e.key === '2' || e.key === 'ArrowRight')) answer(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <Stack maw={720} w="100%" mx="auto" gap="md">
      <Group justify="space-between">
        <Title order={3}>Lernen: {title}</Title>
        <Button variant="subtle" color="gray" onClick={onExit}>
          Beenden
        </Button>
      </Group>

      {!queue && (
        <Paper withBorder p="lg">
          <Stack gap="sm">
            <Text>
              {due.length} von {cards.length} Karten sind heute fällig.
            </Text>
            <Group>
              <Button
                disabled={!due.length}
                onClick={() => setQueue(shuffle(due.map((c) => c.id)))}
              >
                Fällige lernen
              </Button>
              <Button
                variant="default"
                disabled={!cards.length}
                onClick={() => setQueue(shuffle(cards.map((c) => c.id)))}
              >
                Alle {cards.length} üben
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}

      {done && (
        <Paper withBorder p="lg">
          <Stack gap="sm">
            <Title order={4}>Geschafft!</Title>
            <Text>
              {stats.known} gewusst, {stats.unknown} nicht gewusst.
            </Text>
            <Group>
              <Button onClick={onExit}>Zurück zum Modul</Button>
            </Group>
          </Stack>
        </Paper>
      )}

      {card && (
        <Paper withBorder p="lg">
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Karte {index + 1} / {queue.length} · Fach {card.box}
            </Text>
            <Rich text={card.question} size="lg" fw={600} />

            {!revealed ? (
              <Group>
                <Button onClick={() => setRevealed(true)}>
                  Antwort zeigen <Kbd ml="xs">Leertaste</Kbd>
                </Button>
              </Group>
            ) : (
              <>
                <Rich text={card.answer} size="md" />
                {card.link && (
                  <Group gap="md">
                    <Anchor size="sm" onClick={() => setShowSlide((s) => !s)}>
                      {showSlide ? 'Folie ausblenden' : 'Folie anzeigen'} ({linkLabel(card)})
                    </Anchor>
                    <Anchor
                      size="sm"
                      c="dimmed"
                      onClick={() => onOpenSlide(card.link!.slidesId, card.link!.page)}
                    >
                      Im Foliensatz öffnen
                    </Anchor>
                  </Group>
                )}
                {showSlide && card.link && (
                  <SlideImage slidesId={card.link.slidesId} page={card.link.page} width={640} />
                )}
                <Group grow>
                  <Button color="red" variant="light" onClick={() => answer(false)}>
                    Nicht gewusst <Kbd ml="xs">1</Kbd>
                  </Button>
                  <Button color="green" variant="light" onClick={() => answer(true)}>
                    Gewusst <Kbd ml="xs">2</Kbd>
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}

function shuffle<T>(items: T[]) {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
