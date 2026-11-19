import type { ReactNode } from 'react'
import { Group } from '@mantine/core'
import type { Slide, Slides } from '../lib/db'
import { Field } from '../components/Field'
import { Viewer } from '../components/Viewer'

type Props = {
  slides: Slides
  pages: Slide[]
  page: number
  hits: Set<number>
  search: ReactNode
  onPage: (page: number) => void
  onPatch: (change: Partial<Slides>) => void
  onPatchPage: (page: number, change: Partial<Slide>) => void
  onToggleHidden: (page: number) => void
}

export function SlidesView({
  slides,
  pages,
  page,
  hits,
  search,
  onPage,
  onPatch,
  onPatchPage,
  onToggleHidden,
}: Props) {
  const current = pages.find((p) => p.page === page)

  // Die Felder hängen per key an Foliensatz und Seite, nicht die ganze Ansicht:
  // so behält das Suchfeld den Fokus, wenn die Suche in einen anderen Foliensatz springt.
  return (
    <>
      <Group align="flex-end" gap="xs">
        <Field
          key={slides.id}
          w={90}
          label="Vorlesung"
          value={slides.lectureNum}
          onSave={(v) => onPatch({ lectureNum: v })}
        />
        <Field
          key={slides.id + page}
          w={400}
          label="Folientitel"
          value={current?.title ?? ''}
          onSave={(v) => onPatchPage(page, { title: v })}
        />
        {search}
      </Group>
      <Viewer
        key={slides.id}
        slidesId={slides.id}
        pages={pages}
        page={page}
        hits={hits}
        onPage={onPage}
        onToggleHidden={onToggleHidden}
      />
    </>
  )
}
