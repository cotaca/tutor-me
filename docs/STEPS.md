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
  - [x] Text auf der Folie markieren und kopieren, mindestens im Karten-Modus (Textebene von pdf.js über der Folie)
  - [x] Formatierung in Frage und Antwort: Markdown und Formeln, Umschalter Schreiben/Vorschau
  - [ ] Bilder in der Antwort: beliebigen Ausschnitt der Folie per Rahmen auswählen und als Bild einfügen
- [x] **8. Lernmodus**: Lernrunde pro Modul bzw. gefiltertem Thema, Leitner (Fächer 1–5, Intervalle 1/2/4/8/16 Tage), nicht gewusste Karten wiederholen sich in der Runde
- [x] **9. Backup**: eine JSON-Datei mit allen Daten und PDFs (Base64), Import ersetzt alles nach Rückfrage
