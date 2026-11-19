import { useEffect, useRef, useState } from 'react'
import {
  ActionIcon,
  AppShell,
  Button,
  Divider,
  Group,
  NavLink,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconFiles,
  IconX,
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
  type Slide,
  type Slides,
} from './db'
import { readPages } from './pdfText'
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
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [searchModule, setSearchModule] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData().then(setData)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && searchRef.current) {
        e.preventDefault()
        searchRef.current.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
      let read
      try {
        const task = pdfjs.getDocument({ data: await file.arrayBuffer() })
        read = await readPages(await task.promise)
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
          ...read.map((r, i) => ({ slidesId: id, page: i + 1, ...r, hidden: false })),
        ],
      }
    }
    update(next)
  }

  const patchSlides = (id: string, patch: Partial<Slides>) =>
    update({ ...data, slides: data.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)) })

  const patchPage = (slidesId: string, page: number, patch: Partial<Slide>) =>
    update({
      ...data,
      pages: data.pages.map((p) =>
        p.slidesId === slidesId && p.page === page ? { ...p, ...patch } : p,
      ),
    })

  function openSlides(id: string, target?: number) {
    setSel({ kind: 'slides', id })
    setPage(target ?? data!.pages.find((p) => p.slidesId === id && !p.hidden)?.page ?? 1)
  }

  const currentPage = slides
    ? data.pages.find((p) => p.slidesId === slides.id && p.page === page)
    : undefined

  const moduleSlides = module ? data.slides.filter((s) => s.moduleId === module.id) : []

  const searchModuleId = module ? module.id : slides ? slides.moduleId : undefined
  const scope =
    slides && !searchModule
      ? [slides.id]
      : data.slides.filter((s) => s.moduleId === searchModuleId).map((s) => s.id)
  const order = (p: Slide) => scope.indexOf(p.slidesId) * 100000 + p.page
  const q = normalize(query)
  const hits = q
    ? data.pages
        .filter(
          (p) => scope.includes(p.slidesId) && normalize(`${p.title} ${p.text ?? ''}`).includes(q),
        )
        .sort((a, b) => order(a) - order(b))
    : []
  const here = currentPage ? order(currentPage) : -1
  const hitIndex = hits.findIndex((h) => order(h) === here)
  const nextHit = hits.find((h) => order(h) > here) ?? hits[0]
  const prevHit = hits.findLast((h) => order(h) < here) ?? hits.at(-1)
  const goHit = (h?: Slide) => h && openSlides(h.slidesId, h.page)

  const searchBar = (
    <Group gap={4} align="flex-end" w={slides ? undefined : '100%'}>
      <TextInput
        ref={searchRef}
        w={slides ? 220 : undefined}
        flex={slides ? undefined : 1}
        label={slides ? 'Suche' : undefined}
        placeholder="Strg+F"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') goHit(e.shiftKey ? prevHit : nextHit)
          if (e.key === 'Escape') setQuery('')
        }}
        rightSectionWidth={slides ? 56 : 28}
        rightSection={
          <Group gap={0} wrap="nowrap">
            {query && (
              <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => setQuery('')}>
                <IconX size={14} />
              </ActionIcon>
            )}
            {slides && (
              <Tooltip
                label={searchModule ? 'Sucht im ganzen Modul' : 'Sucht nur in diesem Foliensatz'}
              >
                <ActionIcon
                  size="sm"
                  variant={searchModule ? 'light' : 'subtle'}
                  color={searchModule ? 'blue' : 'gray'}
                  onClick={() => setSearchModule((m) => !m)}
                >
                  <IconFiles size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        }
      />
      {slides && (
        <>
          <ActionIcon
            variant="default"
            size="lg"
            disabled={!hits.length}
            onClick={() => goHit(prevHit)}
          >
            <IconChevronUp size={16} />
          </ActionIcon>
          <ActionIcon
            variant="default"
            size="lg"
            disabled={!hits.length}
            onClick={() => goHit(nextHit)}
          >
            <IconChevronDown size={16} />
          </ActionIcon>
          <Text size="sm" c="dimmed" w={60} mb={6}>
            {q && `${hitIndex + 1 || '–'} / ${hits.length}`}
          </Text>
        </>
      )}
    </Group>
  )

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
                                          onClick={() => openSlides(sl.id)}
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
        <Stack h="100dvh" p="md" gap="sm">
          {!slides && !module && (
            <Title order={3}>
              {sel?.kind === 'program' ? 'Studiengang' : semester ? 'Semester' : ''}
            </Title>
          )}
          {sel?.kind === 'program' && (
            <Group align="flex-end" gap="xs">
              <Field
                key={sel.name}
                label="Name"
                value={sel.name}
                onSave={(v) => renameProgram(sel.name, v)}
              />
              {deleteButton}
            </Group>
          )}
          {semester && (
            <Group align="flex-end" gap="xs">
              <Field
                key={semester.id}
                label="Name"
                value={semester.name}
                onSave={(v) => patchSemester(semester.id, { name: v })}
              />
              {deleteButton}
            </Group>
          )}
          {module && (
            <>
              <Stack gap="sm">
                <Title order={3}>Modul</Title>
                <Group align="flex-end" gap="xs" wrap="nowrap">
                  <Field
                    key={module.id}
                    w={90}
                    label="Kürzel"
                    value={module.short}
                    onSave={(v) => patchModule(module.id, { short: v })}
                  />
                  <Field
                    key={module.id + 'name'}
                    flex={1}
                    label="Name"
                    value={module.name}
                    onSave={(v) => patchModule(module.id, { name: v })}
                  />
                  <Field
                    key={module.id + 'lecturer'}
                    flex={1}
                    label="Dozent*in"
                    value={module.lecturer}
                    onSave={(v) => patchModule(module.id, { lecturer: v })}
                  />
                  {deleteButton}
                </Group>
              </Stack>
              <Divider my="md" />

              <SimpleGrid
                cols={3}
                spacing="lg"
                flex={1}
                mih={0}
                style={{ gridTemplateRows: 'minmax(0, 1fr)' }}
              >
                <Stack gap="sm">
                  <Title order={5}>Karteikarten</Title>
                </Stack>

                <Stack gap="sm" mih={0}>
                  <Group justify="space-between">
                    <Title order={5}>Foliensätze</Title>
                    <Button size="xs" variant="light" onClick={() => fileRef.current?.click()}>
                      + Hochladen
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="application/pdf"
                      multiple
                      hidden
                      onChange={(e) => {
                        addSlides(module.id, [...(e.target.files ?? [])])
                        e.target.value = ''
                      }}
                    />
                  </Group>
                  <ScrollArea flex={1}>
                    <Table highlightOnHover stickyHeader>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Vorlesung</Table.Th>
                          <Table.Th>Titel</Table.Th>
                          <Table.Th>Folien</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {moduleSlides.map((sl) => {
                          const ps = data.pages.filter((p) => p.slidesId === sl.id)
                          return (
                            <Table.Tr
                              key={sl.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => openSlides(sl.id)}
                            >
                              <Table.Td>{sl.lectureNum}</Table.Td>
                              <Table.Td>{ps[0]?.title}</Table.Td>
                              <Table.Td>
                                {ps.filter((p) => !p.hidden).length}{' '}
                                <Text span c="dimmed">
                                  ({ps.length})
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          )
                        })}
                        <Table.Tr
                          style={{ cursor: 'pointer' }}
                          onClick={() => fileRef.current?.click()}
                        >
                          <Table.Td colSpan={3} c="dimmed">
                            + Foliensatz hochladen
                          </Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Stack>

                <Stack gap="sm" mih={0}>
                  <Title order={5}>Suche</Title>
                  {searchBar}
                  {q && (
                    <ScrollArea flex={1}>
                      {hits.length === 0 && <Text c="dimmed">Keine Treffer</Text>}
                      {hits.map((h) => (
                        <NavLink
                          key={h.slidesId + h.page}
                          label={[
                            data.slides.find((s) => s.id === h.slidesId)?.lectureNum,
                            `Folie ${h.page}`,
                            h.title,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                          description={snippet(h.text ?? '', q)}
                          onClick={() => openSlides(h.slidesId, h.page)}
                        />
                      ))}
                    </ScrollArea>
                  )}
                </Stack>
              </SimpleGrid>
            </>
          )}
          {slides && (
            <>
              <Group align="flex-end" gap="xs">
                <Field
                  key={slides.id}
                  w={90}
                  label="Vorlesung"
                  value={slides.lectureNum}
                  onSave={(v) => patchSlides(slides.id, { lectureNum: v })}
                />
                <Field
                  key={slides.id + page}
                  w={400}
                  label="Folientitel"
                  value={currentPage?.title ?? ''}
                  onSave={(v) => patchPage(slides.id, page, { title: v })}
                />
                {searchBar}
              </Group>
              <Viewer
                key={slides.id}
                slidesId={slides.id}
                pages={data.pages.filter((p) => p.slidesId === slides.id)}
                page={page}
                hits={new Set(hits.filter((h) => h.slidesId === slides.id).map((h) => h.page))}
                onPage={setPage}
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
function Field(props: {
  label: string
  value: string
  w?: number
  flex?: number
  onSave: (v: string) => void
}) {
  return (
    <TextInput
      w={props.flex ? undefined : (props.w ?? 500)}
      flex={props.flex}
      maw="100%"
      label={props.label}
      defaultValue={props.value}
      onBlur={(e) => {
        if (e.target.value !== props.value) props.onSave(e.target.value)
      }}
    />
  )
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

function snippet(text: string, q: string) {
  const flat = text.replace(/\s+/g, ' ')
  const i = flat.toLowerCase().indexOf(q)
  if (i < 0) return ''
  return (i > 40 ? '…' : '') + flat.slice(Math.max(0, i - 40), i + q.length + 40) + '…'
}
