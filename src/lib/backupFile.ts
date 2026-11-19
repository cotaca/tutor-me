import { backupFileName, makeBackup, parseBackup } from './backup'
import { deletePdfsExcept, loadPdf, saveData, savePdf, type Data } from './db'
import { download } from './download'

export async function exportBackup(data: Data) {
  const pdfs: Record<string, string> = {}
  for (const s of data.slides) {
    const blob = await loadPdf(s.id)
    if (blob) pdfs[s.id] = await toBase64(blob)
  }
  const json = JSON.stringify(makeBackup(data, pdfs))
  download(new Blob([json], { type: 'application/json' }), backupFileName())
}

// Ersetzt alle Daten durch das Backup. Reihenfolge: erst neue PDFs und Daten schreiben,
// zuletzt überzählige alte PDFs löschen, damit ein Abbruch nichts Bestehendes zerstört.
export async function importBackup(file: File): Promise<Data> {
  const backup = parseBackup(await file.text())
  for (const [id, base64] of Object.entries(backup.pdfs))
    await savePdf(id, await (await fetch(`data:application/pdf;base64,${base64}`)).blob())
  await saveData(backup.data)
  await deletePdfsExcept(backup.data.slides.map((s) => s.id))
  return backup.data
}

function toBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
