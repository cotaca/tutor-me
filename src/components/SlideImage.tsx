import { useEffect, useRef } from 'react'
import type { RenderTask } from 'pdfjs-dist'
import { usePdfDoc } from '../hooks/usePdf'

// Eine einzelne Folie als Bild, z. B. zur Antwort im Lernmodus.
export function SlideImage({
  slidesId,
  page,
  width,
}: {
  slidesId: string
  page: number
  width: number
}) {
  const doc = usePdfDoc(slidesId)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!doc) return
    let cancelled = false
    let task: RenderTask | undefined
    doc.getPage(page).then((p) => {
      const canvas = canvasRef.current
      if (cancelled || !canvas) return
      const scale = width / p.getViewport({ scale: 1 }).width
      const viewport = p.getViewport({ scale: scale * devicePixelRatio })
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${width}px`
      task = p.render({ canvas, viewport })
      task.promise.catch(() => {})
    })
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [doc, page, width])

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        maxWidth: '100%',
        border: '1px solid var(--mantine-color-gray-3)',
      }}
    />
  )
}
