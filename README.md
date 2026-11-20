# TutorMe

Vorlesungsfolien über Studiengang → Semester → Modul verwalten, Karteikarten mit Verweis auf einzelne Folien anlegen und lernen und pro Semester eine Übersichts-Excel exportieren.

Läuft komplett im Browser. Es gibt kein Backend, alle Daten liegen in der IndexedDB des Browsers.

## Funktionen

- Ordnerstruktur Studiengang / Semester / Modul
- PDF-Upload mit Viewer, Folien ausblenden, Volltextsuche
- Karteikarten (Frage/Antwort) mit Link zur Folie, Lernmodus (Leitner-System)
- Export einer Übersichts-Excel: ein Blatt pro Modul, Folientitel thematisch gruppiert

Details zu Konzept und Datenmodell stehen in [docs/CONCEPT.md](docs/CONCEPT.md).

## Stack

| Bereich  | Paket                     |
| -------- | ------------------------- |
| Build    | Vite + React + TypeScript |
| UI       | Mantine                   |
| PDF      | pdfjs-dist                |
| Excel    | exceljs                   |
| Speicher | idb-keyval (IndexedDB)    |

## Voraussetzungen

- Node.js ≥ 22.18 (getestet mit 24), `npm run check` führt TypeScript direkt aus

## Entwicklung

```powershell
npm install
npm run dev      # Dev-Server auf http://localhost:5173/tutor-me/
npm run lint
```

## Hinweise

- Die Daten hängen an Browser und Gerät. Wer den Browser-Speicher löscht, verliert alles, also regelmäßig ein Backup exportieren (Datenbank-Symbol unten in der Seitenleiste). Das Backup enthält auch alle PDFs und lässt sich auf einem anderen Gerät wieder importieren.
- PDFs und Excel-Dateien sind per `.gitignore` ausgeschlossen, damit keine Vorlesungsfolien ins Repo gelangen.
