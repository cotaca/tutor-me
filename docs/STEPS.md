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
- [x] **5. Themen**: Modus "Gliedern" im Foliensatz, Themen pro Modul beliebig verschachtelt, Farbstreifen und Themenpfad
- [x] **6. Übersichts-Excel** auf der Semesterseite
  - [x] Aufgaben/Übungen markieren: automatisch beim Upload erkennen, manuell im Gliedern-Modus und am Vorschaubild
  - [x] Tabellenmodell pro Modul (gemeinsame Grundlage für Vorschau und Export)
  - [x] Vorschau: ein Reiter pro Modul, Textbearbeitung per Doppelklick schreibt in die App-Daten zurück
  - [x] Export mit exceljs: `<Semester> – Vorlesungsinhalte.xlsx`
- [x] **7. Karteikarten**: Modus "Karten" im Foliensatz (Folie bleibt sichtbar), Liste mit Themenfilter auf der Modulseite, Kartenzahl an den Vorschaubildern
  - [ ] Text auf der Folie markieren und kopieren, mindestens im Karten-Modus (Textebene von pdf.js über der Folie)
  - [ ] Formatierung in Frage und Antwort: Markdown und Formeln
  - [ ] Bilder in der Antwort: beliebigen Ausschnitt der Folie per Rahmen auswählen und als Bild einfügen
- [ ] **8. Lernmodus**: fällige Karten abfragen, richtig = nächstes Fach, falsch = Fach 1
- [ ] **9. Backup**: alle Daten als JSON exportieren und importieren
