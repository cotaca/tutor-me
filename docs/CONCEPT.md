## Funktionen

- Anlegen von Verwaltungsstrukturen - Studiengang/Semester X/Modul/
  - z.B. Informatik (Telekom)/Semester 5/Machine Learning/...
- hochladen von Vorlesungsfolien
  - PDF Viewer der Folien
  - Ausblenden bestimmter Folien möglich falls gewünscht
  - Durchsuchfunktion wie STRG+F im Browser
- Anlegen von Karteikarten mit Frage + Antwort
  - Verlinkung zu einer spezifischen Vorlesungsfolie mit Antwort/Erklärung
  - Lernmodus (Leitner-System)
- Automatisches generieren von "Übersichts-Excel"
  - Beispieldatei: `Vorlesungsinhalte.xlsx` (4. Semester)
  - Tabelle pro Modul in einem Semester
  - Auflistung der Folientiteln, thematisch gruppiert
  - Markieren von z.B. Aufgaben mit Verweis zur Seite möglich

## Tool Stack

Grundsatz: so simpel wie möglich. Prototyp für einen Nutzer.

| Bereich  | Wahl                            | Zweck                                             |
| -------- | ------------------------------- | ------------------------------------------------- |
| Build    | Vite + React + TypeScript (npm) |                                                   |
| UI       | Mantine                         |                                                   |
| PDF      | pdfjs-dist                      | Rendern, Text pro Seite (Suche, Titel), Outline   |
| Excel    | exceljs                         | Export inkl. verbundener Zellen + Formatierung    |
| Speicher | IndexedDB via idb-keyval        | PDFs als Blob + Metadaten, Backup per JSON-Export |

## Datenmodell

```ts
type Semester = { id; program; name }
type Module = { id; semesterId; short; name; lecturer }
type Slides = { id; moduleId; lectureNum: string; pdf: Blob }
type Slide = { slidesId; page; title; text; hidden: boolean; note?: string; topicId? }
type Topic = { id; moduleId; parentId?; title; color? }
type Card = { id; moduleId; question; answer; link?: { slidesId; page } }
```

## Umsetzung der Funktionen

### Suche

`page.getTextContent()` pro Seite einmal extrahieren, `includes()`-Suche, Treffer → zur Seite springen.

### Folientitel

Automatisch: größte Textzeile im oberen Seitenbereich. Immer manuell editierbar.

### Thematische Gruppierung

Themen pro Modul, beliebig verschachtelt (Unterthema per `parentId`), können sich über mehrere Foliensätze ziehen.
Jede Folie hat höchstens ein (tiefstes) Thema, die Oberthemen ergeben sich aus der Kette.
Im Foliensatz-Modus "Gliedern": Folien im Raster auswählen (Klick, Shift+Klick) und ein Thema zuweisen.
Farben automatisch aus einer Pastellpalette pro Oberthema, Unterthemen in kräftigeren Tönen derselben Farbe, änderbar.

### Übersichts-Excel

Eine Datei pro Semester, ein Arbeitsblatt pro Modul (Aufbau wie Beispieldatei):

- Kopf: A1:A2 Kürzel, B1:E1 Modulname, B2:E2 Dozent
- Zeile 3: `#` | `Thema` (Ebenen in B–C/D) | `Inhalt` | `Sonstiges`
- `#` = VL-Nummer, Thema-Zellen über ihren Folienbereich verbunden
- `Inhalt` = Folientitel (ausgeblendete Folien weglassen), `Sonstiges` = `Folie.notiz`
