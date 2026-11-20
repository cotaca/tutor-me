import { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { Text } from '@mantine/core'
import { loadPdf } from '../lib/db'
import type { SlideRef } from '../lib/slideRef'

// Breite einer ganzen Folie in px; ein Ausschnitt wird anteilig so breit, höchstens so breit wie die Karte.
const PAGE_WIDTH = 800

// Mehrere Ausschnitte desselben Foliensatzes sollen die PDF nur einmal laden. Die letzten
// paar PDFs bleiben offen, ältere werden geschlossen, damit sich nicht alles im Speicher sammelt.
const MAX_DOCS = 3
type Task = ReturnType<typeof pdfjs.getDocument>
const docs = new Map<string, Promise<Task | undefined>>()

function openDoc(slidesId: string): Promise<PDFDocumentProxy | undefined> {
  let task = docs.get(slidesId)
  if (task) docs.delete(slidesId)
  else
    task = loadPdf(slidesId).then(async (blob) =>
      blob ? pdfjs.getDocument({ data: await blob.arrayBuffer() }) : undefined,
    )
  docs.set(slidesId, task) // ans Ende = zuletzt benutzt
  for (const [id, old] of docs) {
    if (docs.size <= MAX_DOCS) break
    docs.delete(id)
    old.then(
      (t) => t?.destroy(),
      () => {},
    )
  }
  return task.then((t) => t?.promise)
}

export function SlideCrop({ slide, alt }: { slide: SlideRef; alt?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [missing, setMissing] = useState(false)
  const { slidesId, page } = slide
  const [x, y, w, h] = slide.rect

  useEffect(() => {
    let cancelled = false
    let task: RenderTask | undefined
    openDoc(slidesId)
      .then(async (doc) => {
        if (!doc || page > doc.numPages) throw new Error('missing')
        const p = await doc.getPage(page)
        const canvas = canvasRef.current
        if (cancelled || !canvas) return
        const base = p.getViewport({ scale: 1 })
        const cssScale = PAGE_WIDTH / base.width
        const scale = cssScale * devicePixelRatio
        // Verschobener Viewport: pdf.js zeichnet nur den Ausschnitt ins Canvas.
        const viewport = p.getViewport({
          scale,
          offsetX: -x * base.width * scale,
          offsetY: -y * base.height * scale,
        })
        canvas.width = Math.round(w * base.width * scale)
        canvas.height = Math.round(h * base.height * scale)
        canvas.style.width = `${w * base.width * cssScale}px`
        task = p.render({ canvas, viewport })
        await task.promise
      })
      .catch((e) => {
        if (!cancelled && e?.name !== 'RenderingCancelledException') setMissing(true)
      })
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [slidesId, page, x, y, w, h])

  if (missing)
    return (
      <Text span size="xs" c="dimmed">
        [Folie nicht mehr vorhanden]
      </Text>
    )
  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
        border: '1px solid var(--mantine-color-gray-3)',
      }}
    />
  )
}
