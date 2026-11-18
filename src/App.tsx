import { useEffect, useState } from 'react'
import { AppShell, Button, Group, NavLink, Stack, Text, TextInput, Title } from '@mantine/core'
import { Dropzone, PDF_MIME_TYPE } from '@mantine/dropzone'
import * as pdfjs from 'pdfjs-dist'
import {
  deletePdf,
  loadData,
  saveData,
  savePdf,
  type Data,
  type Module,
  type Semester,
  type Slides,
} from './db'
import { Viewer } from './Viewer'

type Selection =
  | { kind: 'program'; name: string }
  | { kind: 'semester'; id: string }
  | { kind: 'module'; id: string }
  | { kind: 'slides'; id: string }

export default function App() {
  const [data, setData] = useState<Data>()
  const [sel, setSel] = useState<Selection>()

  useEffect(() => {
    loadData().then(setData)
  }, [])

  if (!data) return null

  const update = (next: Data) => {
    setData(next)
    saveData(next)
  }

  const programs = [...new Set(data.semesters.map((s) => s.program))]
  const semester = sel?.kind === 'semester' && data.semesters.find((s) => s.id === sel.id)
  const module = sel?.kind === 'module' && data.modules.find((m) => m.id === sel.id)
  const slides = sel?.kind === 'slides' && data.slides.find((s) => s.id === sel.id)

  function addSemester(program: string) {
    const s: Semester = { id: crypto.randomUUID(), program, name: 'Neues Semester' }
    update({ ...data!, semesters: [...data!.semesters, s] })
    setSel({ kind: 'semester', id: s.id })
  }

  function addModule(semesterId: string) {
    const m: Module = {
      id: crypto.randomUUID(),
      semesterId,
      short: '',
      name: 'Neues Modul',
      lecturer: '',
    }
    update({ ...data!, modules: [...data!.modules, m] })
    setSel({ kind: 'module', id: m.id })
  }

  function renameProgram(from: string, to: string) {
    update({
      ...data!,
      semesters: data!.semesters.map((s) => (s.program === from ? { ...s, program: to } : s)),
    })
    setSel({ kind: 'program', name: to })
  }

  const patchSemester = (id: string, patch: Partial<Semester>) =>
    update({
      ...data,
      semesters: data.semesters.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })

  async function addSlides(moduleId: string, files: File[]) {
    let next = data!
    for (const file of files) {
      let numPages
      try {
        const task = pdfjs.getDocument({ data: await file.arrayBuffer() })
        numPages = (await task.promise).numPages
        await task.destroy()
      } catch {
        alert(`${file.name} konnte nicht als PDF gelesen werden.`)
        continue
      }
      const id = crypto.randomUUID()
      const count = next.slides.filter((s) => s.moduleId === moduleId).length
      await savePdf(id, file)
      next = {
        ...next,
        slides: [...next.slides, { id, moduleId, lectureNum: `VL${count}` }],
        pages: [
          ...next.pages,
          ...Array.from({ length: numPages }, (_, i) => ({
            slidesId: id,
            page: i + 1,
            title: '',
            hidden: false,
          })),
        ],
      }
    }
    update(next)
  }

  const patchSlides = (id: string, patch: Partial<Slides>) =>
    update({ ...data, slides: data.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)) })

  const toggleHidden = (slidesId: string, page: number) =>
    update({
      ...data,
      pages: data.pages.map((p) =>
        p.slidesId === slidesId && p.page === page ? { ...p, hidden: !p.hidden } : p,
      ),
    })

  async function remove(target: Selection) {
    const semesterIds =
      target.kind === 'program'
        ? data!.semesters.filter((s) => s.program === target.name).map((s) => s.id)
        : target.kind === 'semester'
          ? [target.id]
          : []
    const moduleIds =
      target.kind === 'module'
        ? [target.id]
        : data!.modules.filter((m) => semesterIds.includes(m.semesterId)).map((m) => m.id)
    const slidesIds =
      target.kind === 'slides'
        ? [target.id]
        : data!.slides.filter((s) => moduleIds.includes(s.moduleId)).map((s) => s.id)

    setSel(undefined)
    update({
      ...data!,
      semesters: data!.semesters.filter((s) => !semesterIds.includes(s.id)),
      modules: data!.modules.filter((m) => !moduleIds.includes(m.id)),
      slides: data!.slides.filter((s) => !slidesIds.includes(s.id)),
      pages: data!.pages.filter((p) => !slidesIds.includes(p.slidesId)),
      topics: data!.topics.filter((t) => !slidesIds.includes(t.slidesId)),
      cards: data!.cards
        .filter((c) => !moduleIds.includes(c.moduleId))
        .map((c) =>
          c.link && slidesIds.includes(c.link.slidesId) ? { ...c, link: undefined } : c,
        ),
    })
    for (const id of slidesIds) await deletePdf(id)
  }

  const deleteButton = sel && (
    <Button
      color="red"
      variant="light"
      w="fit-content"
      onClick={() => {
        if (confirm('Wirklich löschen? Alles darunter wird mit gelöscht.')) remove(sel)
      }}
    >
      Löschen
    </Button>
  )

  const patchModule = (id: string, patch: Partial<Module>) =>
    update({ ...data, modules: data.modules.map((m) => (m.id === id ? { ...m, ...patch } : m)) })

  return (
    <AppShell navbar={{ width: 300, breakpoint: 'sm' }} padding="md">
      <AppShell.Navbar p="xs">
        {programs.map((p) => (
          <div key={p}>
            <NavLink
              label={p || '(ohne Namen)'}
              active={sel?.kind === 'program' && sel.name === p}
              onClick={() => setSel({ kind: 'program', name: p })}
            />
            {data.semesters
              .filter((s) => s.program === p)
              .map((s) => (
                <div key={s.id}>
                  <NavLink
                    pl="lg"
                    label={s.name}
                    active={sel?.kind === 'semester' && sel.id === s.id}
                    onClick={() => setSel({ kind: 'semester', id: s.id })}
                  />
                  {data.modules
                    .filter((m) => m.semesterId === s.id)
                    .map((m) => (
                      <div key={m.id}>
                        <NavLink
                          pl="xl"
                          label={m.short ? `${m.short} – ${m.name}` : m.name}
                          active={sel?.kind === 'module' && sel.id === m.id}
                          onClick={() => setSel({ kind: 'module', id: m.id })}
                        />
                        {data.slides
                          .filter((sl) => sl.moduleId === m.id)
                          .map((sl) => (
                            <NavLink
                              key={sl.id}
                              pl={48}
                              label={sl.lectureNum}
                              active={sel?.kind === 'slides' && sel.id === sl.id}
                              onClick={() => setSel({ kind: 'slides', id: sl.id })}
                            />
                          ))}
                      </div>
                    ))}
                  <NavLink pl="xl" c="dimmed" label="+ Modul" onClick={() => addModule(s.id)} />
                </div>
              ))}
            <NavLink pl="lg" c="dimmed" label="+ Semester" onClick={() => addSemester(p)} />
          </div>
        ))}
        <NavLink
          c="dimmed"
          label="+ Studiengang"
          onClick={() => addSemester('Neuer Studiengang')}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Stack key={JSON.stringify(sel)}>
          {sel?.kind === 'program' && (
            <>
              <Title order={3}>Studiengang</Title>
              <Field label="Name" value={sel.name} onSave={(v) => renameProgram(sel.name, v)} />
              {deleteButton}
            </>
          )}
          {semester && (
            <>
              <Title order={3}>Semester</Title>
              <Field
                label="Name"
                value={semester.name}
                onSave={(v) => patchSemester(semester.id, { name: v })}
              />
              {deleteButton}
            </>
          )}
          {module && (
            <>
              <Title order={3}>Modul</Title>
              <Field
                label="Kürzel"
                value={module.short}
                onSave={(v) => patchModule(module.id, { short: v })}
              />
              <Field
                label="Name"
                value={module.name}
                onSave={(v) => patchModule(module.id, { name: v })}
              />
              <Field
                label="Dozent"
                value={module.lecturer}
                onSave={(v) => patchModule(module.id, { lecturer: v })}
              />
              {deleteButton}
              <Dropzone accept={PDF_MIME_TYPE} onDrop={(files) => addSlides(module.id, files)}>
                <Text ta="center" py="xl">
                  Vorlesungsfolien (PDF) hierher ziehen oder klicken
                </Text>
              </Dropzone>
            </>
          )}
          {slides && (
            <>
              <Group align="flex-end">
                <Field
                  label="Vorlesung"
                  value={slides.lectureNum}
                  onSave={(v) => patchSlides(slides.id, { lectureNum: v })}
                />
                {deleteButton}
              </Group>
              <Viewer
                key={slides.id}
                slidesId={slides.id}
                pages={data.pages.filter((p) => p.slidesId === slides.id)}
                onToggleHidden={(page) => toggleHidden(slides.id, page)}
              />
            </>
          )}
        </Stack>
      </AppShell.Main>
    </AppShell>
  )
}

// Speichert erst beim Verlassen des Feldes, sonst würde z.B. ein Studiengang beim Tippen
// kurzzeitig einen gleichnamigen anderen treffen und mit ihm verschmelzen.
function Field(props: { label: string; value: string; onSave: (v: string) => void }) {
  return (
    <TextInput
      maw={500}
      label={props.label}
      defaultValue={props.value}
      onBlur={(e) => {
        if (e.target.value !== props.value) props.onSave(e.target.value)
      }}
    />
  )
}
