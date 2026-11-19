import { useEffect, useRef, useState } from 'react'
import { ActionIcon, AppShell, Stack } from '@mantine/core'
import { IconLayoutSidebarLeftExpand } from '@tabler/icons-react'
import {
  importPdfs,
  patchById,
  applyEdit,
  patchPages,
  removeTarget,
  renameProgram,
  type Selection,
} from './lib/actions'
import { deletePdf, loadData, saveData, type Data, type Slide } from './lib/db'
import { ModuleView } from './views/ModuleView'
import { hitNavigation, search } from './lib/search'
import { addTopic, assignTopic, moveTopic, removeTopic } from './lib/topics'
import { SearchBar, SearchResults } from './components/SearchBar'
import { Sidebar } from './components/Sidebar'
import { SlidesView } from './views/SlidesView'
import { NameView } from './views/NameView'
import { SemesterView } from './views/SemesterView'

export default function App() {
  const [data, setData] = useState<Data>()
  const [sel, setSel] = useState<Selection>()
  const [navOpen, setNavOpen] = useState(true)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [searchModule, setSearchModule] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

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

  const semester = sel?.kind === 'semester' && data.semesters.find((s) => s.id === sel.id)
  const module = sel?.kind === 'module' && data.modules.find((m) => m.id === sel.id)
  const slides = sel?.kind === 'slides' && data.slides.find((s) => s.id === sel.id)

  function addSemester(program: string) {
    const id = crypto.randomUUID()
    update({ ...data!, semesters: [...data!.semesters, { id, program, name: 'Neues Semester' }] })
    setSel({ kind: 'semester', id })
  }

  function addModule(semesterId: string) {
    const id = crypto.randomUUID()
    const m = { id, semesterId, short: '', name: 'Neues Modul', lecturer: '' }
    update({ ...data!, modules: [...data!.modules, m] })
    setSel({ kind: 'module', id })
  }

  function openSlides(id: string, target?: number) {
    setSel({ kind: 'slides', id })
    setPage(target ?? data!.pages.find((p) => p.slidesId === id && !p.hidden)?.page ?? 1)
  }

  function confirmRemove(target: Selection) {
    if (!confirm('Wirklich löschen? Alles darunter wird mit gelöscht.')) return
    const result = removeTarget(data!, target)
    setSel(undefined)
    update(result.data)
    result.pdfIds.forEach(deletePdf)
  }

  // Suche: im Foliensatz nur dieser (außer "ganzes Modul"), auf der Modulseite alle des Moduls.
  const moduleId = module ? module.id : slides ? slides.moduleId : undefined
  const scope =
    slides && !searchModule
      ? [slides.id]
      : data.slides.filter((s) => s.moduleId === moduleId).map((s) => s.id)
  const hits = search(data, scope, query)
  const slidesPages = slides ? data.pages.filter((p) => p.slidesId === slides.id) : []
  const nav = hitNavigation(
    hits,
    slidesPages.find((p) => p.page === page),
    scope,
  )
  const goHit = (h?: Slide) => h && openSlides(h.slidesId, h.page)

  const searchBar = (
    <SearchBar
      inputRef={searchRef}
      query={query}
      onQuery={setQuery}
      onPrev={() => goHit(nav.prev)}
      onNext={() => goHit(nav.next)}
      nav={
        slides
          ? {
              index: nav.index,
              total: hits.length,
              moduleScope: searchModule,
              onToggleScope: () => setSearchModule((m) => !m),
            }
          : undefined
      }
    />
  )

  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 0, collapsed: { desktop: !navOpen, mobile: !navOpen } }}
    >
      <AppShell.Navbar p={4}>
        <Sidebar
          data={data}
          sel={sel}
          onSelect={setSel}
          onOpenSlides={openSlides}
          onAddSemester={addSemester}
          onAddModule={addModule}
          onDelete={confirmRemove}
          onClose={() => setNavOpen(false)}
        />
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
          {sel?.kind === 'program' && (
            <NameView
              key={sel.name}
              title="Studiengang"
              value={sel.name}
              onSave={(v) => {
                update(renameProgram(data, sel.name, v))
                setSel({ kind: 'program', name: v })
              }}
              onDelete={() => confirmRemove(sel)}
            />
          )}
          {semester && (
            <SemesterView
              data={data}
              semester={semester}
              onRename={(v) => update(patchById(data, 'semesters', semester.id, { name: v }))}
              onDelete={() => confirmRemove({ kind: 'semester', id: semester.id })}
              onEdit={(edit, value) => update(applyEdit(data, edit, value))}
              onOpen={openSlides}
              onToggleHidden={(slidesId, p) => {
                const hidden = data.pages.find(
                  (x) => x.slidesId === slidesId && x.page === p,
                )?.hidden
                update(patchPages(data, slidesId, [p], { hidden: !hidden }))
              }}
            />
          )}
          {module && (
            <ModuleView
              module={module}
              slides={data.slides.filter((s) => s.moduleId === module.id)}
              pages={data.pages}
              onPatch={(change) => update(patchById(data, 'modules', module.id, change))}
              onUpload={async (files) => update(await importPdfs(data, module.id, files))}
              onOpenSlides={openSlides}
              onDelete={() => confirmRemove({ kind: 'module', id: module.id })}
              search={
                <>
                  {searchBar}
                  <SearchResults
                    hits={hits}
                    query={query}
                    slides={data.slides}
                    onOpen={(h) => openSlides(h.slidesId, h.page)}
                  />
                </>
              }
            />
          )}
          {slides && (
            <SlidesView
              slides={slides}
              pages={slidesPages}
              page={page}
              hits={new Set(hits.filter((h) => h.slidesId === slides.id).map((h) => h.page))}
              search={searchBar}
              onPage={setPage}
              onPatch={(change) => update(patchById(data, 'slides', slides.id, change))}
              onPatchPages={(ps, change) => update(patchPages(data, slides.id, ps, change))}
              topics={data.topics.filter((t) => t.moduleId === slides.moduleId)}
              onAssign={(pages, topicId) => update(assignTopic(data, slides.id, pages, topicId))}
              onAddTopic={(parentId, assignTo) => {
                const id = crypto.randomUUID()
                const next = addTopic(data, id, slides.moduleId, parentId)
                update(assignTo.length ? assignTopic(next, slides.id, assignTo, id) : next)
              }}
              onPatchTopic={(id, change) => update(patchById(data, 'topics', id, change))}
              onRemoveTopic={(id) => update(removeTopic(data, id))}
              onMoveTopic={(id, step) => update(moveTopic(data, id, step))}
            />
          )}
        </Stack>
      </AppShell.Main>
    </AppShell>
  )
}
