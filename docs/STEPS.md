# Schritte

## Setup

- [x] Vite + React + TypeScript aufsetzen
- [x] Abhängigkeiten installieren (Mantine, pdfjs-dist, exceljs, idb-keyval)
- [x] README und .gitignore
- [x] Prettier

## Prototyp

- [x] **1. Datenschicht** (`src/lib/db.ts`): Typen, `loadData`/`saveData`, PDFs unter eigenem Key
- [x] **2. Ordnerstruktur**: AppShell, Baum Studiengang / Semester / Modul, anlegen und umbenennen
- [x] **3. PDF-Upload und Viewer**: Dropzone im Modul, Seiten mit pdf.js rendern, blättern, Folien ausblenden
- [x] **4. Text, Suche und Folientitel**: beim Upload `getTextContent()` pro Seite speichern, Suche, Titelvorschlag
- [ ] **5. Themen**: im Viewer "ab hier Thema X" mit Ebene 1–3 setzen, Vorschlag aus `getOutline()`
- [ ] **6. Excel-Export**: exceljs, ein Blatt pro Modul, Aufbau wie `Vorlesungsinhalte.xlsx`
- [ ] **7. Karteikarten**: aus dem Viewer anlegen, mit Link zur aktuellen Folie
- [ ] **8. Lernmodus**: fällige Karten abfragen, richtig = nächstes Fach, falsch = Fach 1
- [ ] **9. Backup**: alle Daten als JSON exportieren und importieren

## Offene Fragen

- Lernmodus: `box` und `due` an `Card` ergänzen (Leitner) oder etwas anderes geplant?
