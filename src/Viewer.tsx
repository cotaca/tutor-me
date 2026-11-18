import { useEffect, useRef, useState } from 'react'
import { Button, Group, Switch, Text } from '@mantine/core'
import * as pdfjs from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { loadPdf, type Slide } from './db'

type Props = {
  slidesId: string
  pages: Slide[]
  onToggleHidden: (page: number) => void
}

export function Viewer({ slidesId, pages, onToggleHidden }: Props) {
  const [doc, setDoc] = useState<PDFDocumentProxy>()
  const [page, setPage] = useState(1)
  const [showHidden, setShowHidden] = useState(false)
  const [width, setWidth] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const visible = pages.filter((p) => showHidden || !p.hidden)
  const found = visible.findIndex((p) => p.page >= page)
  const index = found === -1 ? visible.length - 1 : found
  const current = visible[index]
  const currentPage = current?.page

  const go = (step: number) => {
    const target = visible[index + step]
    if (target) setPage(target.page)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
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

  useEffect(() => {
    if (!doc || !currentPage || !width) return
    let cancelled = false
    let task: RenderTask | undefined
    doc.getPage(currentPage).then((p) => {
      const canvas = canvasRef.current
      if (cancelled || !canvas) return
      const scale = width / p.getViewport({ scale: 1 }).width
      const viewport = p.getViewport({ scale: scale * devicePixelRatio })
      canvas.width = viewport.width
      canvas.height = viewport.height
      task = p.render({ canvas, viewport })
      task.promise.catch((e) => {
        if (e?.name !== 'RenderingCancelledException') console.error(e)
      })
    })
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [doc, currentPage, width])

  return (
    <>
      <Group>
        <Button variant="default" disabled={index <= 0} onClick={() => go(-1)}>
          ←
        </Button>
        <Text>
          Seite {currentPage ?? '–'} / {pages.length}
        </Text>
        <Button variant="default" disabled={index >= visible.length - 1} onClick={() => go(1)}>
          →
        </Button>
        {current && (
          <Button variant="light" onClick={() => onToggleHidden(current.page)}>
            {current.hidden ? 'Einblenden' : 'Ausblenden'}
          </Button>
        )}
        <Switch
          label="Ausgeblendete zeigen"
          checked={showHidden}
          onChange={(e) => setShowHidden(e.currentTarget.checked)}
        />
      </Group>
      <div ref={boxRef}>
        {current ? (
          <canvas ref={canvasRef} style={{ width: '100%', opacity: current.hidden ? 0.4 : 1 }} />
        ) : (
          <Text c="dimmed">Alle Folien sind ausgeblendet.</Text>
        )}
      </div>
    </>
  )
}
