import { useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { loadPdf } from '../lib/db'

// Lädt die PDF eines Foliensatzes. Wird mit der id gespeichert,
// damit beim Wechsel nichts vom alten Foliensatz durchscheint.
export function usePdfDoc(slidesId: string) {
  const [doc, setDoc] = useState<{ id: string; doc: PDFDocumentProxy }>()

  useEffect(() => {
    let cancelled = false
    let task: ReturnType<typeof pdfjs.getDocument> | undefined
    loadPdf(slidesId).then(async (blob) => {
      const data = blob && (await blob.arrayBuffer())
      if (!data || cancelled) return
      task = pdfjs.getDocument({ data })
      task.promise.then(
        (d) => setDoc({ id: slidesId, doc: d }),
        () => {},
      )
    })
    return () => {
      cancelled = true
      task?.destroy()
    }
  }, [slidesId])

  return doc?.id === slidesId ? doc.doc : undefined
}

// Wie usePdfDoc, erzeugt zusätzlich nach und nach die Vorschaubilder aller Seiten.
export function usePdf(slidesId: string) {
  const doc = usePdfDoc(slidesId)
  const [thumbs, setThumbs] = useState<{ doc: PDFDocumentProxy; urls: string[] }>()

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
        if (cancelled) return
        setThumbs((t) => ({ doc, urls: t?.doc === doc ? [...t.urls, url] : [url] }))
      }
    })().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [doc])

  return { doc, thumbs: thumbs && thumbs.doc === doc ? thumbs.urls : [] }
}
