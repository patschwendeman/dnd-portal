# DND-52: Abenteuerauswahl vor dem Admin Screen, „Abenteuer beenden“ in den Einstellungen

**Typ:** feat
**Status:** Freigegeben

## Kontext & Ziel

Heute wählt der Spielleiter das Abenteuer über eine Auswahlliste im Panel „Einstellungen“. Ist keines aktiv,
aktiviert der Admin automatisch das erste. Künftig öffnet `/admin` immer zuerst eine **Abenteuerauswahl**: Karten mit
Abenteuerbild, Name, Stufe, Beschreibung und Party. Ein Klick auf eine Karte aktiviert das Abenteuer und öffnet den
Admin. Statt der Auswahlliste steht ganz unten im Panel „Einstellungen“ ein Button „Abenteuer beenden“. Er deaktiviert
das Abenteuer am Server und führt zurück zur Auswahl. Am Spieltisch heißt das: Der Spielleiter startet und beendet ein
Abenteuer bewusst, und Wall, Ground und Player folgen.

Mockup (ohne die Änderungen aus E3–E5): https://claude.ai/artifact/Xd6YwuvBvzfQh2qtPcc1Rs

**Voraussetzung:** DND-51 (Abenteuerbild `image`) ist committet.

## Scope / Non-Goals

**Im Scope**
- Neuer Screen „Abenteuerauswahl“ (`AdminSelectScreen`) unter `/admin`, Admin Screen unter `/admin/play`.
- `GET /adventures` liefert zusätzlich Stufe, Abenteuerbild und Party (Vertrag).
- Panel „Einstellungen“: Abschnitt „Abenteuer“ mit Auswahlliste entfällt, Button „Abenteuer beenden“ ganz unten,
  mit Bestätigungsdialog.
- Die automatische Aktivierung des ersten Abenteuers im Admin entfällt.
- Doku (screens, architecture, domain, components.md, screen-layouts.md) und Tests.

**Nicht im Scope**
- Abenteuer anlegen, bearbeiten, löschen oder ein Bild hochladen.
- Änderungen an Wall, Ground und Player. Sie zeigen ohne aktives Abenteuer schon heute ihren Leerzustand.
- Audioausgabe auf der Auswahl: Sie ist kein Admin-Fenster, das Audioausgabe wird (Musik ohne Szene: Standardmusik
  wie heute, gespielt nur von einem Admin Screen).
- Tastenkürzel (Alt+←/→) auf der Auswahl.

## Entscheidungen

### E1: Admin startet immer auf der Auswahl
- **Entscheidung:** `/admin` zeigt immer die Abenteuerauswahl, auch wenn am Server ein Abenteuer aktiv ist. Nach der
  Wahl navigiert der Admin zu `/admin/play`. Ein Reload von `/admin/play` bleibt im Admin. Ist am Server kein
  Abenteuer aktiv (beim Öffnen oder weil ein anderes Admin-Fenster es beendet hat), leitet `/admin/play` auf `/admin`
  um. Wechselt ein anderes Admin-Fenster das Abenteuer, folgt `/admin/play` wie heute.
- **Verworfene Alternativen:** Nur eine Route `/admin`, jeder Reload führt zur Auswahl. Auswahl nur, wenn kein
  Abenteuer aktiv ist.
- **Begründung:** Wunsch des Users („immer“). Mit eigener Route verliert ein Reload mitten im Spiel nicht den Admin.

### E2: Hintergrund der Auswahl ist das Abenteuerbild des aktiven Abenteuers
- **Entscheidung:** Hinter den Karten liegt das Abenteuerbild (`image`) des am Server aktiven Abenteuers, abgedunkelt
  wie im Admin (Baustein „Abenteuer-Hintergrund“), die Karten sind dann durchscheinend (`$isTranslucent`). Ohne
  aktives Abenteuer oder ohne Bild: Grundfläche `background`, Karten deckend.
- **Verworfene Alternativen:** Immer die schlichte Grundfläche (Mockup).
- **Begründung:** Wunsch des Users; gleiche Optik wie Admin und Player.

### E3: „Abenteuer beenden“ deaktiviert das Abenteuer am Server
- **Entscheidung:** Der Button setzt nach Bestätigung `active_adventure_id: null` (`PATCH /table`, existiert schon).
  Danach zeigen Wall und Ground kein Szenenbild, der Player „Noch kein Abenteuer aktiv“, und der Admin navigiert zu
  `/admin`. Schlägt das Speichern fehl, bleibt der Admin auf `/admin/play` und zeigt die Hinweisleiste „Speichern
  fehlgeschlagen“ wie bei anderen Schreibfehlern.
- **Verworfene Alternativen:** Nur zurück zur Auswahl, der Server behält das Abenteuer.
- **Begründung:** Wunsch des Users; „beenden“ soll am Spieltisch wirken.

### E4: Bestätigungsdialog vor dem Beenden
- **Entscheidung:** Klick auf „Abenteuer beenden“ öffnet `ConfirmDialog` „Abenteuer beenden“ mit dem Namen des
  Abenteuers und dem Hinweis, dass Wall, Ground und Player danach kein Abenteuer mehr zeigen. „Confirm“ beendet,
  „Decline“ bricht ab.
- **Begründung:** Wunsch des Users; die Aktion betrifft alle Screens, wie ein Szenenwechsel.

### E5: Keine automatische Aktivierung mehr
- **Entscheidung:** Der Admin aktiviert kein Abenteuer mehr von selbst (`selectDefaultAdventureId` und der Effekt im
  `AdminScreen` entfallen). Ein Abenteuer wird nur durch einen Klick auf seine Karte aktiv, auch wenn es nur eines gibt.
- **Begründung:** Wunsch des Users; die Auswahl ersetzt die Automatik.

### E6: Inhalt der Karte
- **Entscheidung:** Von oben: Abenteuerbild 16:9 bündig (`object-fit: cover`; ohne Bild Fläche `background` mit
  Bild-Icon), auf dem Bild beim aktiven Abenteuer ein Label „Aktiv“. Darunter Name (`text.lg` semibold) und rechts
  daneben die Stufe als Level-Badge (`global_level`). Darunter die Beschreibung, gedämpft, höchstens zwei Zeilen mit
  „…“ (ohne Beschreibung entfällt sie). Darunter Label „Party · N“ und die Mitglieder in zwei Spalten
  (Avatar mit Initialen bzw. Bild, Charaktername, Spielername); ab 7 Mitgliedern die ersten 5 und „+N weitere“; ohne
  Mitglieder „Noch keine Charaktere“. Das aktive Abenteuer hat den Rahmen `borderWidth.thick` in `primary`. Die ganze
  Karte ist ein Button (Tab, Enter, Leertaste).
- **Verworfene Alternativen:** Ohne Beschreibung.
- **Begründung:** Wunsch des Users (Bild, Name, Spieler; Beschreibung ja, zwei Zeilen).

### E7: Kampf sperrt den Wechsel
- **Entscheidung:** Hat das aktive Abenteuer einen Kampf, sind auf der Auswahl alle anderen Karten gesperrt
  (ausgegraut, Schloss-Label auf dem Bild, Tooltip „Während des Kampfes nicht wechselbar“, Klick tut nichts); darüber
  ein Hinweis „Im aktiven Abenteuer läuft ein Kampf. Andere Abenteuer sind bis zu seinem Ende gesperrt.“ Die Karte
  des aktiven Abenteuers öffnet den Admin. Im Admin ist „Abenteuer beenden“ während eines Kampfes gesperrt (Schloss,
  gleicher Tooltip). Der Server lehnt schon heute mit 409 ab.
- **Begründung:** Gleiche Regel wie bisher bei der Auswahlliste.

### E8: Vertrag `GET /adventures`
- **Entscheidung:** `AdventureSummary` bekommt `global_level: int`, `image: Image | null` und `players: list[Player]`
  (gleiche Form wie in `AdventureDetail`). Reihenfolge der Abenteuer wie bisher nach ID, Spieler wie in
  `AdventureDetail`.
- **Verworfene Alternativen:** Ein Detail-Request je Abenteuer auf der Auswahl.
- **Begründung:** Ein Request für die ganze Auswahl; die Datenmenge ist klein.

## Subtasks

### Vertrag
- [ ] `AdventureSummary` um `global_level`, `image`, `players` erweitern; `openapi.json` und
      `frontend/src/api/schema.d.ts` neu erzeugen.

### Backend
- [ ] `GET /adventures` lädt Bild und Spieler mit (ohne N+1-Abfragen, z. B. `selectinload`).
- [ ] Tests: Response enthält Stufe, Bild (bzw. `null`) und Spieler; `PATCH /table` mit `active_adventure_id: null`
      deaktiviert und pusht (falls nicht schon abgedeckt), 409 während eines Kampfes.

### Frontend
- [ ] Routen: `/admin` → `AdminSelectScreen`, `/admin/play` → `AdminScreen`, beide im `GameTableProvider`
      (`screen="admin"`), damit aktives Abenteuer und Kampf live ankommen.
- [ ] `AdminSelectScreen`: Kopf (Label „Spielleiter“, Überschrift „Abenteuer wählen“), Raster der Karten
      (`repeat(auto-fill, minmax(min(100%, <Konstante>), 1fr))`), Hintergrund nach E2, Kampfsperre nach E7.
      Zustände: Laden (Platzhalter-Karten), „Noch keine Abenteuer“, „Keine Verbindung zum Server“ mit „Erneut
      versuchen“. Klick auf eine Karte: ist sie nicht aktiv, `PATCH /table` mit ihrer ID, nach Erfolg zu
      `/admin/play`; schlägt es fehl, Hinweis auf der Auswahl und keine Navigation. Ist sie aktiv, direkt navigieren.
- [ ] Komponente `AdventureCard` nach E6; Party-Zeile wiederverwendet `CombatantAvatar` bzw. `PlayerRowContent`, wo
      es passt.
- [ ] `AdminScreen`: Umleitung nach `/admin` ohne aktives Abenteuer (E1); automatische Aktivierung entfernen (E5),
      `selectDefaultAdventureId` samt Tests löschen, falls ungenutzt.
- [ ] `SettingsPanel`: Abschnitt „Abenteuer“ und `AdventureSelect` entfernen; Button „Abenteuer beenden“ ganz unten
      im Panel (unter „Ground-Raster“) mit Vorschaubild des Abenteuerbilds, Name und Icon; Sperre im Kampf und bei
      stehender Hinweisleiste wie bisher bei der Auswahlliste; `ConfirmDialog` nach E4; nach Erfolg zu `/admin`.
- [ ] `AdventureSelect.tsx` löschen, falls ungenutzt.

### Doku
- [ ] `docs/screens.md`: neuer Abschnitt Abenteuerauswahl (Soll/Ist), Einstellungen und Kopfzeile anpassen, Absatz
      „Abenteuer-Auswahl“ ersetzen.
- [ ] `docs/architecture.md` (Routen, Diagramm, Snapshot ohne Abenteuer: keine Auto-Aktivierung, Vertrag
      `AdventureSummary`), `docs/domain.md` (Route), `frontend/docs/design/components.md` (Abenteuer-Karte, Button
      „Abenteuer beenden“), `frontend/docs/design/screen-layouts.md` (Layout und Konstanten der Auswahl).

## Akzeptanzkriterien

### AK1: Admin startet auf der Auswahl
- **Given** am Server ist das Abenteuer „Erstes Abenteuer“ aktiv
- **When** der Spielleiter `/admin` öffnet
- **Then** sieht er die Abenteuerauswahl mit allen Abenteuern, „Erstes Abenteuer“ ist als „Aktiv“ markiert, und
  hinter den Karten liegt dessen Abenteuerbild

### AK2: Karte zeigt die Daten des Abenteuers
- **Given** ein Abenteuer mit Bild, Beschreibung, Stufe 3 und vier Spielern
- **When** die Auswahl geladen ist
- **Then** zeigt seine Karte das Bild, den Namen, die Stufe 3, die Beschreibung (höchstens zwei Zeilen) und
  „Party · 4“ mit Charakter- und Spielername jedes Spielers

### AK3: Abenteuer starten
- **Given** die Auswahl zeigt ein nicht aktives Abenteuer und kein Kampf läuft
- **When** der Spielleiter auf dessen Karte klickt
- **Then** wird es am Server aktiv, Wall, Ground und Player folgen, und der Admin öffnet `/admin/play` mit diesem
  Abenteuer

### AK4: Aktives Abenteuer fortsetzen
- **Given** die Auswahl zeigt das aktive Abenteuer
- **When** der Spielleiter auf dessen Karte klickt
- **Then** öffnet der Admin `/admin/play`, ohne dass am Server etwas gespeichert wird

### AK5: Keine automatische Aktivierung
- **Given** am Server ist kein Abenteuer aktiv und es gibt genau ein Abenteuer
- **When** der Spielleiter `/admin` öffnet
- **Then** bleibt am Server kein Abenteuer aktiv, bis er die Karte anklickt; der Hintergrund ist einfarbig

### AK6: Abenteuer beenden
- **Given** der Admin zeigt ein aktives Abenteuer ohne Kampf
- **When** der Spielleiter ganz unten im Panel „Einstellungen“ auf „Abenteuer beenden“ klickt und den Dialog bestätigt
- **Then** ist am Server kein Abenteuer mehr aktiv, Wall und Ground zeigen kein Szenenbild, der Player zeigt „Noch kein
  Abenteuer aktiv“, und der Admin zeigt die Abenteuerauswahl
- **And** mit „Decline“ im Dialog bleibt alles unverändert

### AK7: Kampf sperrt den Wechsel
- **Given** im aktiven Abenteuer läuft ein Kampf
- **When** der Spielleiter die Auswahl öffnet
- **Then** sind alle anderen Karten gesperrt und ein Klick darauf tut nichts, die Karte des aktiven Abenteuers öffnet
  den Admin
- **And** im Admin ist „Abenteuer beenden“ gesperrt (Schloss, Tooltip „Während des Kampfes nicht wechselbar“)

### AK8: Beenden in einem anderen Admin-Fenster
- **Given** zwei Admin-Fenster zeigen `/admin/play`
- **When** in einem davon das Abenteuer beendet wird
- **Then** wechselt auch das andere auf die Abenteuerauswahl

### AK9: Direkter Aufruf ohne Abenteuer
- **Given** am Server ist kein Abenteuer aktiv
- **When** der Spielleiter `/admin/play` öffnet
- **Then** leitet der Admin auf die Abenteuerauswahl `/admin` um

### AK10: Leer- und Fehlerzustände
- **Given** es gibt keine Abenteuer bzw. die Abenteuer können nicht geladen werden
- **When** der Spielleiter `/admin` öffnet
- **Then** zeigt die Auswahl „Noch keine Abenteuer“ bzw. „Keine Verbindung zum Server“ mit „Erneut versuchen“

## Teststrategie / Verifikation

**Automatisch**
- Backend: `test_adventures.py` (Form von `GET /adventures`), `test_table.py` (Beenden mit `null`, 409 im Kampf).
- Frontend Unit: Statuslogik der Auswahl (Laden, leer, Fehler, Liste), Sperre im Kampf, Kürzung der Party.
- Frontend BDD: neues Feature `adminAdventureSelect.feature` (AK1, AK3–AK7, AK9, AK10); `adminSettings.feature`
  an den Button statt der Auswahlliste anpassen; bestehende Admin-Features starten auf `/admin/play` mit aktivem
  Abenteuer.

**Manuell**
1. `/admin` öffnen, Karte „Erstes Abenteuer“ klicken → Admin öffnet, Wall und Ground zeigen die Szene.
2. Einstellungen → „Abenteuer beenden“ → Confirm → Auswahl erscheint, Wall/Ground ohne Szenenbild, Player „Noch kein
   Abenteuer aktiv“.
3. Kampf starten, `/admin` in zweitem Fenster öffnen → nur die aktive Karte klickbar; im Admin ist „Abenteuer
   beenden“ gesperrt.
4. Beide Themes prüfen (Cyber, Taverne), mit und ohne Abenteuerbild.

## Offene Fragen
- –
