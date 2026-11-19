import type { Data, Semester } from './db'
import { download } from './download'
import { buildSheet, isTaskCell, TASK_FILL } from './sheet'

export const excelFileName = (semester: Semester) => `${semester.name} – Vorlesungsinhalte.xlsx`

export async function exportSemester(data: Data, semester: Semester) {
  // exceljs ist groß, deshalb erst beim Export laden.
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const usedNames = new Set<string>()

  for (const module of data.modules.filter((m) => m.semesterId === semester.id)) {
    const sheet = buildSheet(data, module)
    const ws = wb.addWorksheet(sheetName(sheet.name, usedNames))
    const lastCol = sheet.columns.length

    ws.getCell(1, 1).value = module.short
    ws.mergeCells(1, 1, 2, 1)
    ws.getCell(1, 2).value = module.name
    ws.mergeCells(1, 2, 1, lastCol)
    ws.getCell(2, 2).value = module.lecturer
    ws.mergeCells(2, 2, 2, lastCol)

    sheet.columns.forEach((title, i) => {
      if (i === 1 || title !== 'Thema') ws.getCell(3, i + 1).value = title
    })
    if (sheet.levels > 1) ws.mergeCells(3, 2, 3, 1 + sheet.levels)
    for (const r of [1, 2, 3]) ws.getRow(r).font = { bold: true }

    sheet.rows.forEach((row, i) => {
      const r = 4 + i
      row.cells.forEach((cell, c) => {
        if (!cell) return
        const target = ws.getCell(r, c + 1)
        target.value = c === 1 + sheet.levels ? Number(cell.text) : cell.text
        target.alignment = { vertical: 'top', wrapText: true }
        if (row.hidden) target.font = { italic: true, color: { argb: 'FF999999' } }
        if (isTaskCell(row, cell))
          target.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${TASK_FILL}` } }
        const colSpan = cell.colSpan ?? 1
        if (cell.rowSpan > 1 || colSpan > 1)
          ws.mergeCells(r, c + 1, r + cell.rowSpan - 1, c + colSpan)
      })
    })

    sheet.columns.forEach((title, i) => {
      ws.getColumn(i + 1).width =
        title === 'Inhalt' ? 60 : title === 'Thema' ? 28 : title === 'Sonstiges' ? 30 : 8
    })
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  download(blob, excelFileName(semester))
}

// Excel erlaubt höchstens 31 Zeichen, keine []:*?/\ und keine doppelten Blattnamen.
function sheetName(name: string, used: Set<string>) {
  const base = (name.replace(/[[\]:*?/\\]/g, ' ').trim() || 'Modul').slice(0, 28)
  let result = base
  for (let n = 2; used.has(result.toLowerCase()); n++) result = `${base} ${n}`
  used.add(result.toLowerCase())
  return result
}
