import { today } from './cards.ts'
import { emptyData, type Data } from './db.ts'

// Ein Backup ist eine JSON-Datei mit allen Daten und allen PDFs (Base64).
export type Backup = {
  app: 'tutor-me'
  version: 1
  exportedAt: string
  data: Data
  pdfs: Record<string, string>
}

export const backupFileName = () => `tutor-me-backup-${today()}.json`

export function makeBackup(data: Data, pdfs: Record<string, string>): Backup {
  return { app: 'tutor-me', version: 1, exportedAt: new Date().toISOString(), data, pdfs }
}

// Prüft eine eingelesene Datei, bevor irgendetwas überschrieben wird.
export function parseBackup(json: string): Backup {
  let backup
  try {
    backup = JSON.parse(json)
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.')
  }
  if (backup?.app !== 'tutor-me' || typeof backup.data !== 'object' || !backup.data)
    throw new Error('Die Datei ist kein tutor-me-Backup.')
  const data = { ...emptyData(), ...backup.data }
  for (const [key, value] of Object.entries(data))
    if (!Array.isArray(value)) throw new Error(`Das Backup ist beschädigt („${key}“ fehlt).`)
  const pdfs = backup.pdfs ?? {}
  const missing = data.slides.filter((s: { id: string }) => typeof pdfs[s.id] !== 'string')
  if (missing.length) throw new Error(`Im Backup fehlen ${missing.length} PDF(s).`)
  return { ...backup, data, pdfs }
}
