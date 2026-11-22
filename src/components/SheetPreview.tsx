import { useState, type CSSProperties } from 'react'
import { ActionIcon, Group, Table, TextInput } from '@mantine/core'
import { IconExternalLink, IconEye, IconEyeOff } from '@tabler/icons-react'
import { isTaskCell, TASK_FILL, type Edit, type Sheet } from '../lib/sheet'

type Props = {
  sheet: Sheet
  onEdit: (edit: Edit, value: string) => void
  onOpen: (slidesId: string, page: number) => void
  onToggleHidden: (slidesId: string, pages: number[], hidden: boolean) => void
}

// Zeigt ein Arbeitsblatt so, wie es in der Excel aussieht. Doppelklick bearbeitet den Text einer Zelle.
export function SheetPreview({ sheet, onEdit, onOpen, onToggleHidden }: Props) {
  const { module } = sheet
  const lastCol = sheet.columns.length
  const header = { fontWeight: 700 }

  return (
    <Table withTableBorder withColumnBorders verticalSpacing={4} fz="sm">
      <Table.Thead>
        <Table.Tr>
          <EditableCell
            style={header}
            rowSpan={2}
            text={module.short}
            onSave={(v) => onEdit({ kind: 'module', id: module.id, field: 'short' }, v)}
          />
          <EditableCell
            style={header}
            colSpan={lastCol - 1}
            text={module.name}
            onSave={(v) => onEdit({ kind: 'module', id: module.id, field: 'name' }, v)}
          />
          <Table.Td style={{ border: 'none' }} />
        </Table.Tr>
        <Table.Tr>
          <EditableCell
            style={header}
            colSpan={lastCol - 1}
            text={module.lecturer}
            onSave={(v) => onEdit({ kind: 'module', id: module.id, field: 'lecturer' }, v)}
          />
          <Table.Td style={{ border: 'none' }} />
        </Table.Tr>
        <Table.Tr>
          <Table.Th>#</Table.Th>
          <Table.Th colSpan={sheet.levels}>Thema</Table.Th>
          <Table.Th>Folie</Table.Th>
          <Table.Th>Inhalt</Table.Th>
          <Table.Th>Sonstiges</Table.Th>
          <Table.Th style={{ border: 'none' }} />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {sheet.rows.map((row) => (
          <Table.Tr key={row.slidesId + row.page} className="hover-parent">
            {row.cells.map(
              (cell, c) =>
                cell && (
                  <EditableCell
                    key={c}
                    rowSpan={cell.rowSpan}
                    colSpan={cell.colSpan}
                    text={cell.text}
                    editValue={cell.editValue}
                    style={{
                      verticalAlign: 'top',
                      background: isTaskCell(row, cell) ? `#${TASK_FILL}` : undefined,
                      color: cell.hidden ? 'var(--mantine-color-dimmed)' : undefined,
                      fontStyle: cell.hidden ? 'italic' : undefined,
                    }}
                    onSave={cell.edit && ((v) => onEdit(cell.edit!, v))}
                  />
                ),
            )}
            <Table.Td style={{ border: 'none', width: 60 }}>
              <Group gap={2} wrap="nowrap" className="hover-only">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  title={row.hidden ? 'Einblenden' : 'Ausblenden'}
                  onClick={() => onToggleHidden(row.slidesId, row.pages, !row.hidden)}
                >
                  {row.hidden ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                </ActionIcon>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  title="Folie öffnen"
                  onClick={() => onOpen(row.slidesId, row.page)}
                >
                  <IconExternalLink size={14} />
                </ActionIcon>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}

function EditableCell(props: {
  text: string
  editValue?: string
  rowSpan?: number
  colSpan?: number
  style?: CSSProperties
  onSave?: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const initial = props.editValue ?? props.text

  return (
    <Table.Td
      rowSpan={props.rowSpan}
      colSpan={props.colSpan}
      style={{ ...props.style, cursor: props.onSave ? 'text' : undefined }}
      onDoubleClick={() => props.onSave && setEditing(true)}
    >
      {editing ? (
        <TextInput
          size="xs"
          autoFocus
          defaultValue={initial}
          onBlur={(e) => {
            setEditing(false)
            if (e.target.value !== initial) props.onSave!(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') {
              e.currentTarget.value = initial
              e.currentTarget.blur()
            }
          }}
        />
      ) : (
        props.text
      )}
    </Table.Td>
  )
}
