import { useEffect, useRef, useState } from 'react'
import { ActionIcon, Group, ScrollArea, Text } from '@mantine/core'
import {
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from '@tabler/icons-react'
import * as pdfjs from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { loadPdf, type Slide } from '../lib/db'

const THUMBS_WIDTH = 150

type Props = {
  slidesId: string
  pages: Slide[]
  page: number
  hits: Set<number>
  onPage: (page: number) => void
  onToggleHidden: (page: number) => void
}

export function Viewer({ slidesId, pages, page, hits, onPage: setPage, onToggleHidden }: Props) {
  const [doc, setDoc] = useState<PDFDocumentProxy>()
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [thumbs, setThumbs] = useState<string[]>([])
  const [thumbsOpen, setThumbsOpen] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
    let cancelled = false
    let task: ReturnType<typeof pdfjs.getDocument> | undefined
    loadPdf(slidesId).then(async (blob) => {
      const data = blob && (await blob.arrayBuffer())
      if (!data || cancelled) return
      task = pdfjs.getDocument({ data })
      task.promise.then(setDoc, () => {})
    })
    return () => {
      cancelled = true
      task?.destroy()
    }
  }, [slidesId])

  // ponytail: rendert alle Vorschaubilder beim Öffnen; bei sehr langen PDFs auf Lazy-Rendering umstellen.
  useEffect(() => {
    if (!doc) return
    let cancelled = false
    ;(async () => {
      for (let i = 1; i <= doc.numPages && !cancelled; i++) {
        const p = await doc.getPage(i)
        const viewport = p.getViewport({ scale: 240 / p.getViewport({ scale: 1 }).width })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await p.render({ canvas, viewport }).promise
        const url = canvas.toDataURL('image/jpeg', 0.7)
        if (!cancelled) setThumbs((t) => [...t, url])
      }
    })().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [doc])

  useEffect(() => {
    if (!doc || !size.width || !size.height) return
    let cancelled = false
    let task: RenderTask | undefined
    doc.getPage(page).then((p) => {
      const canvas = canvasRef.current
      if (cancelled || !canvas) return
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
    })
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [doc, page, size])

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
          <canvas ref={canvasRef} style={{ opacity: current?.hidden ? 0.4 : 1 }} />
        </div>

        <div
          style={{
            display: 'flex',
            flexShrink: 0,
            overflow: 'hidden',
            width: thumbsOpen ? THUMBS_WIDTH + 12 : 0,
            transition: 'width 200ms ease',
          }}
        >
          <ScrollArea w={THUMBS_WIDTH} ml={12} type="auto" offsetScrollbars>
            {pages.map((p, i) => (
              <div
                key={p.page}
                className="hover-parent"
                onClick={() => setPage(p.page)}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  marginBottom: 8,
                  border: `2px solid var(--mantine-color-${p.page === page ? 'blue-6' : hits.has(p.page) ? 'yellow-5' : 'gray-3'})`,
                }}
              >
                {thumbs[i] ? (
                  <img
                    src={thumbs[i]}
                    style={{ display: 'block', width: '100%', opacity: p.hidden ? 0.4 : 1 }}
                  />
                ) : (
                  <div
                    style={{ aspectRatio: '16 / 9', background: 'var(--mantine-color-gray-1)' }}
                  />
                )}
                <ActionIcon
                  className={p.hidden ? undefined : 'hover-only'}
                  pos="absolute"
                  top={4}
                  right={4}
                  size="sm"
                  variant="white"
                  color="dark"
                  style={{ boxShadow: 'var(--mantine-shadow-md)' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleHidden(p.page)
                  }}
                >
                  {p.hidden ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                </ActionIcon>
              </div>
            ))}
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
