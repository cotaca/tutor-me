import Markdown, { defaultUrlTransform, type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Text, Typography, type MantineFontSize } from '@mantine/core'
import { parseSlideUrl } from '../lib/slideRef'
import { SlideCrop } from './SlideCrop'

const remarkPlugins = [remarkGfm, remarkBreaks, remarkMath]
const rehypePlugins = [rehypeKatex]

// slide:-Adressen durchlassen, sonst würde react-markdown sie als unbekanntes Schema entfernen.
const urlTransform = (url: string) => (url.startsWith('slide:') ? url : defaultUrlTransform(url))

// Bilder nur als Folienausschnitt. Andere Bildadressen werden nicht geladen,
// damit keine Anfragen an fremde Server entstehen (siehe Datenschutzseite).
const components: Components = {
  img: ({ src, alt }) => {
    const ref = typeof src === 'string' ? parseSlideUrl(src) : undefined
    if (ref) return <SlideCrop key={src as string} slide={ref} alt={alt} />
    return (
      <Text span size="xs" c="dimmed">
        [Bild: {alt || 'ohne Beschreibung'} – nur Folienausschnitte werden angezeigt]
      </Text>
    )
  },
}

// Markdown mit Formeln ($…$ im Text, $$…$$ als Block) und Folienausschnitten.
// Einfache Zeilenumbrüche bleiben erhalten, HTML im Text wird nicht ausgeführt.
export function Rich(props: { text: string; size?: MantineFontSize; fw?: number }) {
  return (
    <Typography className="rich" fz={props.size ?? 'sm'} fw={props.fw}>
      <Markdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        urlTransform={urlTransform}
        components={components}
      >
        {props.text}
      </Markdown>
    </Typography>
  )
}
