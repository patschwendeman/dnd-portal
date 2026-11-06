# DND-48: Querverweise zwischen Notizen und Vor/Zurück im Admin

**Typ:** feat
**Status:** Entwurf

## Kontext & Ziel

Die Notizen im Admin (`DocumentReader`) zeigen je Eintrag einen Ordner aus `public/story/` als Stapel von Kacheln.
Links gibt es nur als `#anker` innerhalb des angezeigten Ordners. Ein Begriff wie „Rettungswurf“ in einer
Kampf- oder Leveling-Notiz kann nicht auf die Grundlagen in „Mechaniken“ verweisen. Dieser Task macht Querverweise
zwischen allen Notiz-Dateien möglich und gibt dem Spielleiter in der Kopfzeile „Zurück“ und „Vor“, wie im Browser.
Am Spieltisch merkt man es daran, dass der Spielleiter während eines Kampfes eine Regel per Klick nachschlägt und
mit einem Klick (oder der Daumentaste der Maus) genau an die Stelle zurückkehrt, an der er gelesen hat.

## Scope / Non-Goals

**Im Scope**
- Zentrales Verzeichnis der Notiz-Ordner statt der Index-Listen in `DocumentReader` und `DocumentNavigation`.
  Der leere Eintrag „Side“ entfällt.
- Querverweise als normale Markdown-Links auf andere `.md`-Dateien, optional mit Anker. Auflösung, Sprung und
  Markierung defekter Links.
- Anker aus Überschriften mit Umlaut-Umschreibung, eindeutig pro Datei.
- Verlauf (Zurück/Vor) für Querverweise, Anker-Sprünge und Eintragswechsel, jeweils mit Scrollposition.
- Kopfzeile: neue Button-Kachel ganz links mit „Zurück“ und „Vor“. Dazu Alt+←/→ und die Daumentasten der Maus im
  ganzen Admin-Fenster.
- Automatische Prüfung aller Links in `public/story/`.
- Inhalte: Bestehende defekte Links reparieren (nur Linkziele), dazu ein Beispiel-Querverweis aus vorhandenem Text.

**Nicht im Scope**
- Popover bzw. Vorschau zum Nachschlagen ohne Sprung (Folge-Task).
- Ansicht „eine Datei auf einmal“ oder Dateiliste im Panel „Notizen“: Der Ordner-Stapel bleibt.
- Neue Regeltexte bzw. Grundlagen-Dateien (z. B. Rüstungsklasse): Inhalte pflegt der Spielleiter selbst.
- Verlauf in der URL bzw. Browser-History. Verlauf über einen Reload hinaus speichern.
- Wiki-Links (`[[…]]`) oder ein eigenes Link-Schema.
- Änderungen an Bildern in den Notizen (öffnen weiter in neuem Tab; ihre Pfade bleiben unverändert).
- Der bekannte Kontrastmangel der Text-Links auf den Notizseiten (`docs/known-issues.md`): Er gilt auch für die neuen
  Querverweise und bleibt offen.
- Wall, Ground, Player und Backend.

## Entscheidungen

### E1: Ansicht bleibt Ordner-Stapel
- **Entscheidung:** Ein Eintrag im Panel „Notizen“ zeigt weiter alle Dateien seines Ordners als Kacheln. Ein
  Querverweis wechselt bei Bedarf den Eintrag (das Panel markiert ihn) und scrollt zur Zieldatei bzw. zur Überschrift.
- **Verworfene Alternativen:** Eine Datei pro Ansicht mit Dateiliste im Panel (größerer Umbau, Inhaltsverzeichnisse
  würden überflüssig).
- **Begründung:** Im Dialog gewählt. Kurze Dateien (z. B. Räume in „Fight“) lassen sich im Stapel gut überfliegen.

### E2: Verzeichnis der Notiz-Ordner
- **Entscheidung:** Ein Modul (z. B. `src/notes/noteFolders.ts`) hält die Liste der Einträge mit `id`, Label und
  Ordner: Main (`main`), Fight (`fight`), Leveling (`leveling`), Mechaniken (`mechanics`). Ein einziger
  `import.meta.glob` über `public/story/*/*.md` liefert die Dateien. Reader, Navigation, Link-Auflösung und Verlauf
  arbeiten mit der `id` statt mit einem Index. Start ist weiter Main. Der Eintrag „Side“ entfällt, weil sein Ordner
  `noneFight/` nicht existiert. Ein neuer Ordner ist später eine Zeile in dieser Liste.
- **Verworfene Alternativen:** Ordner `side/` mit Platzhalter anlegen (im Dialog verworfen).

### E3: Schreibweise und Auflösung der Links
- **Entscheidung:** Normale Markdown-Links, der Pfad relativ zur Datei, in der der Link steht:
  - `[Text](datei.md)` bzw. `[Text](../ordner/datei.md)`: Sprung an den Anfang der Zieldatei.
  - `[Text](datei.md#anker)` bzw. `[Text](../ordner/datei.md#anker)`: Sprung zur Überschrift in der Zieldatei.
  - `[Text](#anker)`: Überschrift in der eigenen Datei. Gibt es sie dort nicht, muss es genau eine Datei im selben
    Ordner geben, die sie hat. So bleiben die vorhandenen Inhaltsverzeichnisse unverändert gültig. Mehrere Treffer
    gelten als defekt (mehrdeutig).
  - Links mit `http(s)://`: öffnen in neuem Tab (`target="_blank"`, `rel="noopener noreferrer"`).
  - Bilder und Links, die nicht auf `.md` bzw. `#` zeigen, bleiben wie bisher.
- Ein Klick auf einen internen Link ändert weder URL noch Browser-History (kein `location.hash`), sondern läuft über
  den Reader (E6).
- Die Auflösung ist eine reine Funktion (Quelldatei + `href` + bekannte Dateien und Anker → Ziel oder „defekt“),
  die der Reader und die Link-Prüfung (E5) gemeinsam nutzen.
- **Verworfene Alternativen:** Wiki-Links `[[…]]` und ein eigenes Schema `doc:` (im Dialog verworfen).
- **Begründung:** Funktioniert auch in der Markdown-Vorschau von Editoren und braucht keinen neuen Parser.

### E4: Anker
- **Entscheidung:** Der Anker einer Überschrift ist ihr Text in Kleinbuchstaben, `ä`→`ae`, `ö`→`oe`, `ü`→`ue`,
  `ß`→`ss`, danach wird jedes Zeichen außer `a–z`, `0–9` und `_` durch `-` ersetzt (wie bisher Zeichen für Zeichen).
  Beispiel: „Rüstungsklasse“ → `ruestungsklasse`, „Taverne – Zum Verzauberte Krug“ →
  `taverne---zum-verzauberte-krug`. Die vorhandenen Anker ohne Umlaute bleiben damit gleich. Kommt eine Überschrift
  in derselben Datei mehrfach vor, bekommt jede weitere `-2`, `-3` … Die `id` im DOM ist pro Datei eindeutig (z. B.
  mit Ordner und Dateiname als Präfix), damit gleiche Überschriften in verschiedenen Dateien nicht kollidieren.
- **Begründung:** Heute macht `replace(/\W/g, '-')` aus „Rüstungsklasse“ `r-stungsklasse`, und gleiche Überschriften
  in mehreren Dateien eines Ordners ergeben doppelte IDs.

### E5: Defekte Links und automatische Prüfung
- **Entscheidung:**
  - Laufzeit: Ein interner Link ohne Ziel bleibt als Text sichtbar, aber erkennbar als defekt: Farbe `error`,
    gepunktete Unterstreichung, Tooltip „Verweis-Ziel nicht gefunden“. Ein Klick tut nichts und erzeugt keinen
    Verlaufseintrag.
  - Prüfung: Ein vitest-Test liest alle Dateien unter `public/story/` und schlägt fehl, wenn ein interner Link nicht
    aufgelöst werden kann (fehlende Datei, fehlender oder mehrdeutiger Anker). Die Fehlermeldung nennt Datei und Link.

### E6: Verlauf
- **Entscheidung:**
  - Ein Eintrag im Verlauf ist: Notiz-Eintrag (`id`) + Scrollposition des Notizbereichs.
  - Neue Einträge entstehen durch: Klick auf einen Querverweis, Klick auf einen Anker-Link (auch im
    Inhaltsverzeichnis desselben Ordners) und Wechsel des Eintrags im Panel „Notizen“ (nicht der Klick auf den schon
    aktiven Eintrag). Bloßes Scrollen und der Button „Nach oben“ erzeugen keinen Eintrag.
  - Vor jedem Sprung wird die aktuelle Scrollposition im aktuellen Eintrag gespeichert. „Zurück“ und „Vor“ stellen
    Eintrag (Panel-Markierung inklusive) und Scrollposition wieder her.
  - Wie im Browser: Ein neuer Sprung nach „Zurück“ verwirft den Vor-Verlauf. Der Verlauf hält höchstens 50 Einträge
    (die ältesten fallen weg).
  - Nach einem Ordnerwechsel (Querverweis, Zurück, Vor) springt die Ansicht ohne Animation an die Zielstelle, erst
    wenn die Dateien geladen sind. Innerhalb desselben Ordners darf weich gescrollt werden (bei „Bewegung reduzieren“
    ohne Animation).
  - Nur im Speicher: keine URL, keine Browser-History, kein `localStorage`. Nach einem Reload ist der Verlauf leer und
    Main offen.
  - Der Verlauf als reine Logik (Reducer bzw. Funktionen) mit Unit-Tests. Ein Hook im `AdminScreen` hält ihn und
    ersetzt `selectedStoryIndex`.
- **Begründung:** Im Dialog gewählt (Links, Eintragswechsel und Inhaltsverzeichnis zählen).

### E7: Kopfzeile
- **Entscheidung:** Die Kopfzeile wird `[Zurück | Vor] [Abenteuername …] [Vollbild | Dashboard]`. Die neue Kachel
  ganz links ist eine `ButtonGroup` wie rechts (gleiche Höhe, durchscheinend wie die anderen Kacheln) mit zwei
  `IconButton`s (keine Toggle-Buttons):
  - Icons: neue SVGs `arrowLeft.svg` und `arrowRight.svg` in `public/assets/icons/`, im Stil von `arrowUp.svg`.
  - `title`/`aria-label`: „Zurück“ bzw. „Vor“.
  - Ohne Ziel `disabled` (gedimmt, kein Hover, Cursor default). Beim Laden sind beide deaktiviert.
  - Die Kachel steht auch, wenn die Hinweisleiste „Backend nicht erreichbar“ den Abenteuernamen ersetzt, und auch bei
    ausgeblendetem Dashboard.
- **Begründung:** Vom User vorgegeben (links, analog zu Vollbild/Dashboard rechts, Pfeile links/rechts).

### E8: Tastatur und Maus
- **Entscheidung:** Im ganzen Admin-Fenster wirken Alt+← wie „Zurück“ und Alt+→ wie „Vor“, ebenso die Daumentasten
  der Maus (`MouseEvent.button` 3 = zurück, 4 = vor). Das Browser-Verhalten (Seite verlassen) wird dabei unterdrückt
  (`preventDefault`), auch wenn es im Verlauf kein Ziel gibt. Ausnahme: Hat ein Textfeld (`input`, `textarea`,
  `select`, `contenteditable`) den Fokus, bleiben Alt+←/→ unberührt.
- **Verworfene Alternativen:** Nur über dem Notizbereich (im Dialog verworfen).
- **Begründung:** Am Spieltisch liegt die Hand an der Maus. Die Daumentaste soll nicht versehentlich den Admin
  verlassen.

### E9: Inhalte
- **Entscheidung:** Nur Linkziele werden angepasst, kein Text:
  - Beispiel-Querverweis: In `leveling/1_tableOfContent.md` wird „Rast“ ein Link auf
    `../mechanics/rest.md#rasten`.
  - Main: „Intro“ zeigt heute auf `#dialog` und landet beim Abschnitt „Dialog“ im Shop. Neu: `dialog.md`.
  - Weitere Links, die die Prüfung (E5) als defekt meldet, werden genauso repariert.
  - Wie man Querverweise schreibt, wird dokumentiert (E3, E4).

## Subtasks

### Frontend
- [ ] Verzeichnis der Notiz-Ordner (E2). `DocumentNavigation` listet daraus Main, Fight, Leveling, Mechaniken.
  Test-ID der Einträge nach `id` statt Index.
- [ ] Reine Funktionen mit Unit-Tests: Anker aus Überschrift (E4), Auflösung eines Links (E3).
- [ ] Link-Prüfung als vitest-Test über `public/story/` (E5).
- [ ] `DocumentReader`: eigene Renderer für `a` (intern, extern, defekt) und Überschriften (IDs pro Datei, E4).
  Anzeige nach `id`. Sprung zu Datei bzw. Anker und Wiederherstellen einer Scrollposition nach dem Laden (E6).
- [ ] Verlauf (E6) als reine Logik mit Unit-Tests, Hook im `AdminScreen` statt `selectedStoryIndex`. Panel-Auswahl,
  Reader und Kopfzeile hängen daran.
- [ ] `AdminHeader`: Kachel „Zurück | Vor“ (E7), neue Icons.
- [ ] Tastatur und Maus (E8) im `AdminScreen`.
- [ ] Inhalte (E9) in `public/story/`.
- [ ] BDD: neues Feature (z. B. `adminNotesNavigation.feature`) für AK1–AK7. `adminNavigation.feature` an die
  Einträge ohne „Side“ anpassen.

### Doku
- [ ] `docs/screens.md` (Admin Ist: Kopfzeile, Notizen, Verlauf, Tastatur/Maus; ggf. Soll ergänzen)
- [ ] `docs/known-issues.md` (Eintrag „Side leer“ entfernen; Kontrast-Hinweis auf Links in den Notizen allgemein)
- [ ] `docs/domain.md` (Zeile „Notizen“: Querverweise, Ordner-Verzeichnis)
- [ ] `frontend/CLAUDE.md` (Struktur; Abschnitt, wie Notizen und Querverweise geschrieben werden)
- [ ] `frontend/DESIGN.md`, `frontend/docs/design/components.md`, `frontend/docs/design/screen-layouts.md`
  (Kopfzeile mit Kachel links, deaktivierte Icon-Buttons, Darstellung defekter Links)

## Akzeptanzkriterien

### AK1: Querverweis in einen anderen Ordner
- **Given** der Admin zeigt die Notizen „Leveling“
- **When** der Spielleiter im Inhaltsverzeichnis auf den Link „Rast“ klickt
- **Then** ist im Panel „Notizen“ „Mechaniken“ markiert und die Überschrift „Rasten“ steht oben im Notizbereich
- **And** die URL des Admins ist unverändert

### AK2: Anker im selben Ordner
- **Given** der Admin zeigt die Notizen „Mechaniken“
- **When** der Spielleiter im Inhaltsverzeichnis auf „Rettungswurf“ klickt
- **Then** scrollt der Notizbereich zur Überschrift „Rettungswurf“, und „Zurück“ ist aktiv

### AK3: Zurück und Vor
- **Given** der Spielleiter hat in „Leveling“ ein Stück nach unten gescrollt und ist per Querverweis zu „Rasten“
  gesprungen
- **When** er auf „Zurück“ klickt
- **Then** ist „Leveling“ markiert und der Notizbereich steht an derselben Scrollposition wie vor dem Sprung
- **When** er danach auf „Vor“ klickt
- **Then** ist wieder „Mechaniken“ markiert und „Rasten“ steht oben

### AK4: Eintragswechsel im Panel
- **Given** der Admin zeigt „Main“, ein Stück nach unten gescrollt
- **When** der Spielleiter im Panel „Fight“ wählt und danach auf „Zurück“ klickt
- **Then** ist „Main“ markiert und an der vorherigen Scrollposition

### AK5: Neuer Sprung verwirft „Vor“
- **Given** der Spielleiter ist per „Zurück“ einen Schritt zurückgegangen
- **When** er einen anderen Eintrag wählt oder einem Link folgt
- **Then** ist „Vor“ deaktiviert

### AK6: Zustand der Buttons
- **Given** der Admin wurde gerade geladen (oder neu geladen)
- **When** die Kopfzeile erscheint
- **Then** stehen ganz links „Zurück“ und „Vor“ in einer eigenen Kachel, beide deaktiviert, und „Main“ ist markiert
- **And** am Ende des Verlaufs ist „Vor“ deaktiviert, am Anfang „Zurück“

### AK7: Tastatur und Maus
- **Given** im Verlauf gibt es einen vorherigen Eintrag
- **When** der Spielleiter Alt+← drückt oder die Daumentaste „zurück“ der Maus
- **Then** passiert dasselbe wie bei „Zurück“, und der Browser verlässt den Admin nicht
- **And** Alt+→ bzw. die Daumentaste „vor“ wirken wie „Vor“
- **And** hat ein Textfeld den Fokus, löst Alt+←/→ keinen Sprung aus

### AK8: Umlaute im Anker
- **Given** eine Notiz hat die Überschrift „Rüstungsklasse“
- **When** eine andere Notiz mit `…#ruestungsklasse` auf sie verweist
- **Then** springt der Link zu dieser Überschrift

### AK9: Defekter Link
- **Given** eine Notiz enthält einen internen Link auf eine Datei oder einen Anker, den es nicht gibt
- **When** der Admin die Notiz anzeigt
- **Then** ist der Link als defekt markiert (Farbe `error`, gepunktete Unterstreichung, Tooltip „Verweis-Ziel nicht
  gefunden“), und ein Klick ändert weder Ansicht noch Verlauf

### AK10: Link-Prüfung
- **Given** alle Notizen in `public/story/`
- **When** die Unit-Tests laufen
- **Then** sind alle internen Links auflösbar und eindeutig
- **And** ein absichtlich defekter Link lässt den Test mit Datei und Link in der Meldung fehlschlagen

### AK11: Einträge im Panel
- **Given** der Admin ist geladen
- **When** das Panel „Notizen“ offen ist
- **Then** listet es Main, Fight, Leveling, Mechaniken (ohne „Side“), und jeder Eintrag zeigt seine Notizen

### AK12: Bestehendes Verhalten
- **Given** der Admin zeigt Notizen
- **When** der Spielleiter auf ein Bild oder einen externen Link klickt
- **Then** öffnet es sich in einem neuen Tab
- **And** die Inhaltsverzeichnisse von Main, Fight, Leveling und Mechaniken springen zu ihren Abschnitten
  („Intro“ in Main zur Datei `dialog.md`)

## Teststrategie / Verifikation

**Automatisch**
- Frontend Unit (vitest):
  - Anker: Umlaute, ß, Sonderzeichen, Gedankenstrich, Unterstrich, doppelte Überschrift in einer Datei.
  - Auflösung: relativer Pfad im selben und im anderen Ordner, mit und ohne Anker, `#anker` in eigener Datei, im
    Ordner eindeutig, mehrdeutig, fehlend; externe Links; Nicht-`.md`-Links.
  - Verlauf: Push, Zurück, Vor, Verwerfen des Vor-Verlaufs, kein Eintrag beim aktiven Eintrag, Obergrenze 50,
    Speichern der Scrollposition.
  - Tastatur/Maus: Zuordnung der Ereignisse (Alt+←/→, Maustasten 3/4, Fokus in Textfeld wird ignoriert). Der Admin
    hat heute kein Textfeld; die Ausnahme sichert künftige Felder ab und wird deshalb nur hier geprüft.
  - Link-Prüfung über `public/story/` (AK10).
- Frontend BDD: AK1–AK7 und AK11 (bestehende Features zu Navigation und Dashboard weiter grün).
- Lint, Typecheck, `check:deadcode`, `check:dupes` grün.

**Manuell**
1. `npm run dev`, Admin öffnen: Kopfzeile prüfen (Kachel links, beide Buttons deaktiviert), in Dark und Tavern, mit
   und ohne Hintergrundbild.
2. „Leveling“ ein Stück scrollen, „Rast“ klicken, mit „Zurück“, „Vor“, Alt+←/→ und den Daumentasten der Maus hin und
   her springen. Scrollpositionen und Panel-Markierung prüfen.
3. Inhaltsverzeichnisse aller vier Einträge durchklicken.
4. Testweise einen defekten Link in eine Notiz schreiben: Markierung im Admin prüfen, `npm run test:unit` schlägt fehl.
   Danach zurücknehmen.
5. Den Slider „Lautstärke“ fokussieren und mit den Pfeiltasten (ohne Alt) bedienen: kein Sprung im Verlauf.

## Offene Fragen
- keine

## Review
