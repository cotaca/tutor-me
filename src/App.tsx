import { useEffect, useState } from 'react'
import { AppShell, NavLink, Stack, TextInput, Title } from '@mantine/core'
import { loadData, saveData, type Data, type Module, type Semester } from './db'

type Selection =
  | { kind: 'program'; name: string }
  | { kind: 'semester'; id: string }
  | { kind: 'module'; id: string }

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
                      <NavLink
                        key={m.id}
                        pl="xl"
                        label={m.short ? `${m.short} – ${m.name}` : m.name}
                        active={sel?.kind === 'module' && sel.id === m.id}
                        onClick={() => setSel({ kind: 'module', id: m.id })}
                      />
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
        <Stack maw={500} key={JSON.stringify(sel)}>
          {sel?.kind === 'program' && (
            <>
              <Title order={3}>Studiengang</Title>
              <Field label="Name" value={sel.name} onSave={(v) => renameProgram(sel.name, v)} />
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
      label={props.label}
      defaultValue={props.value}
      onBlur={(e) => {
        if (e.target.value !== props.value) props.onSave(e.target.value)
      }}
    />
  )
}
