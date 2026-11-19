import { useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { loadPdf } from '../lib/db'

// Lädt die PDF eines Foliensatzes und erzeugt nach und nach die Vorschaubilder.
// Beides wird mit der id gespeichert, damit beim Wechsel nichts vom alten Foliensatz durchscheint.
export function usePdf(slidesId: string) {
  const [doc, setDoc] = useState<{ id: string; doc: PDFDocumentProxy }>()
  const [thumbs, setThumbs] = useState<{ id: string; urls: string[] }>()

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

  // ponytail: rendert alle Vorschaubilder beim Öffnen; bei sehr langen PDFs auf Lazy-Rendering umstellen.
  useEffect(() => {
    if (!doc) return
    let cancelled = false
    ;(async () => {
      for (let i = 1; i <= doc.doc.numPages && !cancelled; i++) {
        const p = await doc.doc.getPage(i)
        const viewport = p.getViewport({ scale: 240 / p.getViewport({ scale: 1 }).width })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await p.render({ canvas, viewport }).promise
        const url = canvas.toDataURL('image/jpeg', 0.7)
        if (cancelled) return
        setThumbs((t) => ({ id: doc.id, urls: t?.id === doc.id ? [...t.urls, url] : [url] }))
      }
    })().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [doc])

  return {
    doc: doc?.id === slidesId ? doc.doc : undefined,
    thumbs: thumbs?.id === slidesId ? thumbs.urls : [],
  }
}
