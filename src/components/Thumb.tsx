import type { MouseEvent } from 'react'
import { ActionIcon } from '@mantine/core'
import { IconEye, IconEyeOff } from '@tabler/icons-react'

type Props = {
  url?: string
  hidden: boolean
  border: string // Mantine-Farbe wie 'blue-6'
  stripes: string[] // Themenfarben, eine pro Ebene
  onClick: (e: MouseEvent) => void
  onToggleHidden: () => void
}

export function Thumb({ url, hidden, border, stripes, onClick, onToggleHidden }: Props) {
  return (
    <div
      className="hover-parent"
      onClick={onClick}
      style={{
        position: 'relative',
        cursor: 'pointer',
        border: `2px solid var(--mantine-color-${border})`,
        userSelect: 'none',
      }}
    >
      {url ? (
        <img src={url} style={{ display: 'block', width: '100%', opacity: hidden ? 0.4 : 1 }} />
      ) : (
        <div style={{ aspectRatio: '16 / 9', background: 'var(--mantine-color-gray-1)' }} />
      )}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, display: 'flex' }}>
        {stripes.map((color, i) => (
          <div key={i} style={{ width: 6, background: color }} />
        ))}
      </div>
      <ActionIcon
        className={hidden ? undefined : 'hover-only'}
        pos="absolute"
        top={4}
        right={4}
        size="sm"
        variant="white"
        color="dark"
        style={{ boxShadow: 'var(--mantine-shadow-md)' }}
        onClick={(e) => {
          e.stopPropagation()
          onToggleHidden()
        }}
      >
        {hidden ? <IconEyeOff size={14} /> : <IconEye size={14} />}
      </ActionIcon>
    </div>
  )
}
