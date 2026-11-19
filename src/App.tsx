import { useEffect, useState } from 'react'
import {
  ActionIcon,
  AppShell,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { Dropzone, PDF_MIME_TYPE } from '@mantine/dropzone'
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
} from '@tabler/icons-react'
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
  const [navOpen, setNavOpen] = useState(true)
  const [collapsed, setCollapsed] = useState(new Set<string>())

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

  const patchModule = (id: string, patch: Partial<Module>) =>
    update({ ...data, modules: data.modules.map((m) => (m.id === id ? { ...m, ...patch } : m)) })

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

  const toggle = (key: string) =>
    setCollapsed((c) => {
      const next = new Set(c)
      if (!next.delete(key)) next.add(key)
      return next
    })

  const confirmRemove = (target: Selection) => {
    if (confirm('Wirklich löschen? Alles darunter wird mit gelöscht.')) remove(target)
  }

  const deleteButton = sel && (
    <ActionIcon size="lg" variant="subtle" color="red" onClick={() => confirmRemove(sel)}>
      <IconTrash size={20} />
    </ActionIcon>
  )

  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 0, collapsed: { desktop: !navOpen, mobile: !navOpen } }}
    >
      <AppShell.Navbar p={4}>
        <ScrollArea flex={1}>
          {programs.map((p) => (
            <div key={p}>
              <TreeItem
                depth={0}
                label={p || '(ohne Namen)'}
                active={sel?.kind === 'program' && sel.name === p}
                open={!collapsed.has(`program:${p}`)}
                onToggle={() => toggle(`program:${p}`)}
                onClick={() => setSel({ kind: 'program', name: p })}
                onDelete={() => confirmRemove({ kind: 'program', name: p })}
              />
              {!collapsed.has(`program:${p}`) && (
                <>
                  {data.semesters
                    .filter((s) => s.program === p)
                    .map((s) => (
                      <div key={s.id}>
                        <TreeItem
                          depth={1}
                          label={s.name}
                          active={sel?.kind === 'semester' && sel.id === s.id}
                          open={!collapsed.has(s.id)}
                          onToggle={() => toggle(s.id)}
                          onClick={() => setSel({ kind: 'semester', id: s.id })}
                          onDelete={() => confirmRemove({ kind: 'semester', id: s.id })}
                        />
                        {!collapsed.has(s.id) && (
                          <>
                            {data.modules
                              .filter((m) => m.semesterId === s.id)
                              .map((m) => (
                                <div key={m.id}>
                                  <TreeItem
                                    depth={2}
                                    label={m.short ? `${m.short} – ${m.name}` : m.name}
                                    active={sel?.kind === 'module' && sel.id === m.id}
                                    open={!collapsed.has(m.id)}
                                    onToggle={() => toggle(m.id)}
                                    onClick={() => setSel({ kind: 'module', id: m.id })}
                                    onDelete={() => confirmRemove({ kind: 'module', id: m.id })}
                                  />
                                  {!collapsed.has(m.id) &&
                                    data.slides
                                      .filter((sl) => sl.moduleId === m.id)
                                      .map((sl) => (
                                        <TreeItem
                                          key={sl.id}
                                          depth={3}
                                          label={sl.lectureNum}
                                          active={sel?.kind === 'slides' && sel.id === sl.id}
                                          onClick={() => setSel({ kind: 'slides', id: sl.id })}
                                          onDelete={() =>
                                            confirmRemove({ kind: 'slides', id: sl.id })
                                          }
                                        />
                                      ))}
                                </div>
                              ))}
                            <TreeItem
                              depth={2}
                              dimmed
                              label="+ Modul"
                              onClick={() => addModule(s.id)}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  <TreeItem depth={1} dimmed label="+ Semester" onClick={() => addSemester(p)} />
                </>
              )}
            </div>
          ))}
          <TreeItem
            depth={0}
            dimmed
            label="+ Studiengang"
            onClick={() => addSemester('Neuer Studiengang')}
          />
        </ScrollArea>
        <Group justify="flex-end">
          <ActionIcon variant="subtle" color="gray" onClick={() => setNavOpen(false)}>
            <IconLayoutSidebarLeftCollapse />
          </ActionIcon>
        </Group>
      </AppShell.Navbar>

      <AppShell.Main>
        {!navOpen && (
          <ActionIcon
            variant="subtle"
            color="gray"
            pos="fixed"
            bottom={4}
            left={4}
            onClick={() => setNavOpen(true)}
          >
            <IconLayoutSidebarLeftExpand />
          </ActionIcon>
        )}
        <Stack key={JSON.stringify(sel)} h="100dvh" p="md" gap="sm">
          {!slides && (
            <Title order={3}>
              {sel?.kind === 'program'
                ? 'Studiengang'
                : semester
                  ? 'Semester'
                  : module
                    ? 'Modul'
                    : ''}
            </Title>
          )}
          {sel?.kind === 'program' && (
            <Group align="flex-end" gap="xs">
              <Field label="Name" value={sel.name} onSave={(v) => renameProgram(sel.name, v)} />
              {deleteButton}
            </Group>
          )}
          {semester && (
            <Group align="flex-end" gap="xs">
              <Field
                label="Name"
                value={semester.name}
                onSave={(v) => patchSemester(semester.id, { name: v })}
              />
              {deleteButton}
            </Group>
          )}
          {module && (
            <>
              <Group align="flex-end" gap="xs">
                <Field
                  label="Kürzel"
                  value={module.short}
                  onSave={(v) => patchModule(module.id, { short: v })}
                />
                {deleteButton}
              </Group>
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
              <Dropzone
                maw={500}
                accept={PDF_MIME_TYPE}
                onDrop={(files) => addSlides(module.id, files)}
              >
                <Text ta="center" py="xl">
                  Vorlesungsfolien (PDF) hierher ziehen oder klicken
                </Text>
              </Dropzone>
            </>
          )}
          {slides && (
            <>
              <Group align="flex-end" gap="xs">
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

function TreeItem(props: {
  depth: number
  label: string
  active?: boolean
  dimmed?: boolean
  open?: boolean
  onToggle?: () => void
  onClick: () => void
  onDelete?: () => void
}) {
  return (
    <NavLink
      className="hover-parent"
      pl={8 + props.depth * 14}
      py={3}
      c={props.dimmed ? 'dimmed' : undefined}
      label={props.label}
      active={props.active}
      leftSection={
        props.onToggle ? (
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            onClick={(e) => {
              e.stopPropagation()
              props.onToggle!()
            }}
          >
            {props.open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
          </ActionIcon>
        ) : (
          <span style={{ width: 18 }} />
        )
      }
      onClick={props.onClick}
      rightSection={
        props.onDelete && (
          <ActionIcon
            className="hover-only"
            size="sm"
            variant="subtle"
            color="red"
            onClick={(e) => {
              e.stopPropagation()
              props.onDelete!()
            }}
          >
            <IconTrash size={14} />
          </ActionIcon>
        )
      }
    />
  )
}

// Speichert erst beim Verlassen des Feldes, sonst würde z.B. ein Studiengang beim Tippen
// kurzzeitig einen gleichnamigen anderen treffen und mit ihm verschmelzen.
function Field(props: { label: string; value: string; onSave: (v: string) => void }) {
  return (
    <TextInput
      w={500}
      maw="100%"
      label={props.label}
      defaultValue={props.value}
      onBlur={(e) => {
        if (e.target.value !== props.value) props.onSave(e.target.value)
      }}
    />
  )
}
