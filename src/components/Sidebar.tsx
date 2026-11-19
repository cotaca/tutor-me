import { useState } from 'react'
import { ActionIcon, Group, NavLink, ScrollArea } from '@mantine/core'
import {
  IconChevronDown,
  IconChevronRight,
  IconLayoutSidebarLeftCollapse,
  IconTrash,
} from '@tabler/icons-react'
import type { Selection } from '../lib/actions'
import type { Data } from '../lib/db'

type Props = {
  data: Data
  sel?: Selection
  onSelect: (sel: Selection) => void
  onOpenSlides: (id: string) => void
  onAddSemester: (program: string) => void
  onAddModule: (semesterId: string) => void
  onDelete: (target: Selection) => void
  onClose: () => void
}

export function Sidebar({
  data,
  sel,
  onSelect,
  onOpenSlides,
  onAddSemester,
  onAddModule,
  onDelete,
  onClose,
}: Props) {
  const [collapsed, setCollapsed] = useState(new Set<string>())
  const programs = [...new Set(data.semesters.map((s) => s.program))]

  const isOpen = (key: string) => !collapsed.has(key)
  const toggle = (key: string) =>
    setCollapsed((c) => {
      const next = new Set(c)
      if (!next.delete(key)) next.add(key)
      return next
    })
  const isActive = (target: Selection) => JSON.stringify(target) === JSON.stringify(sel)

  // Gemeinsame Props für Einträge, die man auswählen, einklappen und löschen kann.
  const node = (target: Selection, key: string) => ({
    active: isActive(target),
    open: isOpen(key),
    onToggle: () => toggle(key),
    onClick: () => onSelect(target),
    onDelete: () => onDelete(target),
  })

  return (
    <>
      <ScrollArea flex={1}>
        {programs.map((p) => (
          <div key={p}>
            <TreeItem
              depth={0}
              label={p || '(ohne Namen)'}
              {...node({ kind: 'program', name: p }, `program:${p}`)}
            />
            {isOpen(`program:${p}`) && (
              <>
                {data.semesters
                  .filter((s) => s.program === p)
                  .map((s) => (
                    <div key={s.id}>
                      <TreeItem
                        depth={1}
                        label={s.name}
                        {...node({ kind: 'semester', id: s.id }, s.id)}
                      />
                      {isOpen(s.id) && (
                        <>
                          {data.modules
                            .filter((m) => m.semesterId === s.id)
                            .map((m) => (
                              <div key={m.id}>
                                <TreeItem
                                  depth={2}
                                  label={m.short ? `${m.short} – ${m.name}` : m.name}
                                  {...node({ kind: 'module', id: m.id }, m.id)}
                                />
                                {isOpen(m.id) &&
                                  data.slides
                                    .filter((sl) => sl.moduleId === m.id)
                                    .map((sl) => (
                                      <TreeItem
                                        key={sl.id}
                                        depth={3}
                                        label={sl.lectureNum}
                                        active={isActive({ kind: 'slides', id: sl.id })}
                                        onClick={() => onOpenSlides(sl.id)}
                                        onDelete={() => onDelete({ kind: 'slides', id: sl.id })}
                                      />
                                    ))}
                              </div>
                            ))}
                          <TreeItem
                            depth={2}
                            dimmed
                            label="+ Modul"
                            onClick={() => onAddModule(s.id)}
                          />
                        </>
                      )}
                    </div>
                  ))}
                <TreeItem depth={1} dimmed label="+ Semester" onClick={() => onAddSemester(p)} />
              </>
            )}
          </div>
        ))}
        <TreeItem
          depth={0}
          dimmed
          label="+ Studiengang"
          onClick={() => onAddSemester('Neuer Studiengang')}
        />
      </ScrollArea>
      <Group justify="flex-end">
        <ActionIcon variant="subtle" color="gray" onClick={onClose}>
          <IconLayoutSidebarLeftCollapse />
        </ActionIcon>
      </Group>
    </>
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
      onClick={props.onClick}
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
