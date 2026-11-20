import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Typography, type MantineFontSize } from '@mantine/core'

const remarkPlugins = [remarkGfm, remarkBreaks, remarkMath]
const rehypePlugins = [rehypeKatex]

// Markdown mit Formeln ($…$ im Text, $$…$$ als Block). Einfache Zeilenumbrüche bleiben erhalten,
// HTML im Text wird nicht ausgeführt.
export function Rich(props: { text: string; size?: MantineFontSize; fw?: number }) {
  return (
    <Typography className="rich" fz={props.size ?? 'sm'} fw={props.fw}>
      <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
        {props.text}
      </Markdown>
    </Typography>
  )
}
