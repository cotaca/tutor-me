import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ActionIcon, Group, ScrollArea, Stack, Text } from '@mantine/core'
import {
  IconChevronLeft,
  IconChevronRight,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from '@tabler/icons-react'
import { TextLayer } from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import type { Slide } from '../lib/db'
import { highlightRects } from '../lib/highlight'
import { Thumb } from './Thumb'

const THUMBS_WIDTH = 150

type Props = {
  doc?: PDFDocumentProxy
  thumbs: string[]
  pages: Slide[]
  page: number
  hits: Set<number>
  query: string
  stripes: (page: Slide) => string[]
  cardCount: (page: Slide) => number
  // Ersetzt die Vorschauspalte (Karten-Modus).
  side?: ReactNode
  onPage: (page: number) => void
  onPatchPages: (pages: number[], change: Partial<Slide>) => void
}

export function Viewer({
  doc,
  thumbs,
  pages,
  page,
  hits,
  query,
  stripes,
  cardCount,
  side,
  onPage: setPage,
  onPatchPages,
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [thumbsOpen, setThumbsOpen] = useState(true)
  // Markierungen gehören zu Seite, Suchbegriff und Größe; passen sie nicht mehr, werden sie nicht gezeigt.
  const [marks, setMarks] = useState<{ key: string; rects: number[][] }>()
  // Kennung der gerade fertig aufgebauten Textebene (Seite und Größe).
  const [textReady, setTextReady] = useState<string>()
  const layerKey = `${page}|${size.width}x${size.height}`
  const markKey = `${layerKey}|${query}`
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const visible = pages.filter((p) => !p.hidden)
  const current = pages.find((p) => p.page === page)
  const prev = visible.findLast((p) => p.page < page)
  const next = visible.find((p) => p.page > page)
  const position = visible.findIndex((p) => p.page === page) + 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft' && prev) setPage(prev.page)
      if (e.key === 'ArrowRight' && next) setPage(next.page)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    )
    observer.observe(boxRef.current!)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!doc || !size.width || !size.height) return
    let cancelled = false
    let task: RenderTask | undefined
    let text: TextLayer | undefined
    doc.getPage(page).then((p) => {
      const canvas = canvasRef.current
      const layer = textRef.current
      if (cancelled || !canvas || !layer) return
      const base = p.getViewport({ scale: 1 })
      const scale = Math.min(size.width / base.width, size.height / base.height)
      const viewport = p.getViewport({ scale: scale * devicePixelRatio })
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${base.width * scale}px`
      canvas.style.height = `${base.height * scale}px`
      task = p.render({ canvas, viewport })
      task.promise.catch((e) => {
        if (e?.name !== 'RenderingCancelledException') console.error(e)
      })

      // Unsichtbarer, markierbarer Text deckungsgleich über der Folie (zum Markieren und Kopieren).
      layer.replaceChildren()
      layer.style.setProperty('--total-scale-factor', String(scale))
      text = new TextLayer({
        textContentSource: p.streamTextContent(),
        container: layer,
        viewport: p.getViewport({ scale }),
      })
      const key = `${page}|${size.width}x${size.height}`
      text.render().then(
        () => !cancelled && setTextReady(key),
        () => {},
      )
    })
    return () => {
      cancelled = true
      task?.cancel()
      text?.cancel()
    }
  }, [doc, page, size])

  // Neu markieren, wenn die Textebene fertig ist oder sich der Suchbegriff ändert.
  // requestAnimationFrame: erst nach dem Layout messen (und kein setState direkt im Effect).
  useEffect(() => {
    if (!textReady) return
    const id = requestAnimationFrame(() => {
      const layer = textRef.current
      const box = layer?.parentElement
      if (layer && box)
        setMarks({ key: `${textReady}|${query}`, rects: highlightRects(layer, box, query) })
    })
    return () => cancelAnimationFrame(id)
  }, [textReady, query])

  return (
    <>
      <Group flex={1} mih={0} align="stretch" wrap="nowrap" gap={0}>
        <div
          ref={boxRef}
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              style={{ display: 'block', opacity: current?.hidden ? 0.4 : 1 }}
            />
            <div ref={textRef} className="textLayer" />
            {query.trim() &&
              marks?.key === markKey &&
              marks.rects.map(([left, top, width, height], i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width,
                    height,
                    background: 'var(--mantine-color-yellow-4)',
                    mixBlendMode: 'multiply',
                    borderRadius: 2,
                    pointerEvents: 'none',
                  }}
                />
              ))}
          </div>
        </div>

        {side && (
          <div style={{ width: 360, flexShrink: 0, marginLeft: 16, minHeight: 0 }}>{side}</div>
        )}
        <div
          style={{
            display: side ? 'none' : 'flex',
            flexShrink: 0,
            overflow: 'hidden',
            width: thumbsOpen ? THUMBS_WIDTH + 12 : 0,
            transition: 'width 200ms ease',
          }}
        >
          <ScrollArea w={THUMBS_WIDTH} ml={12} type="auto" offsetScrollbars>
            <Stack gap={8}>
              {pages.map((p, i) => (
                <Thumb
                  key={p.page}
                  url={thumbs[i]}
                  hidden={p.hidden}
                  task={!!p.task}
                  cards={cardCount(p)}
                  border={p.page === page ? 'blue-6' : hits.has(p.page) ? 'yellow-5' : 'gray-3'}
                  stripes={stripes(p)}
                  onClick={() => setPage(p.page)}
                  onToggleHidden={() => onPatchPages([p.page], { hidden: !p.hidden })}
                  onToggleTask={() => onPatchPages([p.page], { task: !p.task })}
                />
              ))}
            </Stack>
          </ScrollArea>
        </div>
      </Group>

      <Group justify="center" gap="xs" pos="relative">
        <ActionIcon variant="default" disabled={!prev} onClick={() => prev && setPage(prev.page)}>
          <IconChevronLeft size={16} />
        </ActionIcon>
        <Text>
          {position || '–'} / {visible.length}{' '}
          <Text span c="dimmed">
            ({pages.length})
          </Text>
        </Text>
        <ActionIcon variant="default" disabled={!next} onClick={() => next && setPage(next.page)}>
          <IconChevronRight size={16} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          pos="absolute"
          display={side ? 'none' : undefined}
          left={`calc(100% - ${thumbsOpen ? THUMBS_WIDTH : 28}px)`}
          style={{ transition: 'left 200ms ease' }}
          onClick={() => setThumbsOpen((o) => !o)}
        >
          {thumbsOpen ? <IconLayoutSidebarRightCollapse /> : <IconLayoutSidebarRightExpand />}
        </ActionIcon>
      </Group>
    </>
  )
}
