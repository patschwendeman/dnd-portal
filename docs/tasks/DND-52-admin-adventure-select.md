# DND-52: Abenteuerauswahl vor dem Admin Screen, „Abenteuer beenden“ in den Einstellungen

**Typ:** feat
**Status:** Fertig

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
- [x] `AdventureSummary` um `global_level`, `image`, `players` erweitern; `openapi.json` und
      `frontend/src/api/schema.d.ts` neu erzeugen.

### Backend
- [x] `GET /adventures` lädt Bild und Spieler mit (ohne N+1-Abfragen, z. B. `selectinload`).
- [x] Tests: Response enthält Stufe, Bild (bzw. `null`) und Spieler; `PATCH /table` mit `active_adventure_id: null`
      deaktiviert und pusht (falls nicht schon abgedeckt), 409 während eines Kampfes.

### Frontend
- [x] Routen: `/admin` → `AdminSelectScreen`, `/admin/play` → `AdminScreen`, beide im `GameTableProvider`
      (`screen="admin"`), damit aktives Abenteuer und Kampf live ankommen.
- [x] `AdminSelectScreen`: Kopf (Label „Spielleiter“, Überschrift „Abenteuer wählen“), Raster der Karten
      (`repeat(auto-fill, minmax(min(100%, <Konstante>), 1fr))`), Hintergrund nach E2, Kampfsperre nach E7.
      Zustände: Laden (Platzhalter-Karten), „Noch keine Abenteuer“, „Keine Verbindung zum Server“ mit „Erneut
      versuchen“. Klick auf eine Karte: ist sie nicht aktiv, `PATCH /table` mit ihrer ID, nach Erfolg zu
      `/admin/play`; schlägt es fehl, Hinweis auf der Auswahl und keine Navigation. Ist sie aktiv, direkt navigieren.
- [x] Komponente `AdventureCard` nach E6; Party-Zeile wiederverwendet `CombatantAvatar` bzw. `PlayerRowContent`, wo
      es passt.
- [x] `AdminScreen`: Umleitung nach `/admin` ohne aktives Abenteuer (E1); automatische Aktivierung entfernen (E5),
      `selectDefaultAdventureId` samt Tests löschen, falls ungenutzt.
- [x] `SettingsPanel`: Abschnitt „Abenteuer“ und `AdventureSelect` entfernen; Button „Abenteuer beenden“ ganz unten
      im Panel (unter „Ground-Raster“) mit Name und Icon (Vorschaubild nach Runde 1 entfallen); Sperre im Kampf und bei
      stehender Hinweisleiste wie bisher bei der Auswahlliste; `ConfirmDialog` nach E4; nach Erfolg zu `/admin`.
- [x] `AdventureSelect.tsx` löschen, falls ungenutzt.

### Doku
- [x] `docs/screens.md`: neuer Abschnitt Abenteuerauswahl (Soll/Ist), Einstellungen und Kopfzeile anpassen, Absatz
      „Abenteuer-Auswahl“ ersetzen.
- [x] `docs/architecture.md` (Routen, Diagramm, Snapshot ohne Abenteuer: keine Auto-Aktivierung, Vertrag
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

## Review

### Runde 1 – Review vom 2026-11-07 (Commit 9e10442, Gesamtstand gegen 73aee0b)

**Empfehlung: Abnahme.** Kein blockierender Befund. AK1–AK10 erfüllt, alle Checks grün, auch die vollständige
E2E-Suite (14 Suites, 61/61). Der E2E-Fehler beim Implementer („first interaction makes an admin window the audio
output“) trat nicht auf; die Erklärung mit dem externen Fenster ist plausibel. Die Kampfsperre anderer Karten (AK7)
wurde zusätzlich live mit einem eingeschleusten zweiten Abenteuer geprüft. Die gemeldeten Abweichungen verfehlen kein
Akzeptanzkriterium; ob Abweichung 1 bleibt, entscheidet der User (Hinweis 1).

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Admin startet auf der Auswahl | erfüllt | Route `/admin` → `AdminSelectScreen` (`App.tsx:62-68`); Hintergrund über `useAdventureBackground(activeAdventure)`. BDD `adminAdventureSelect.feature:3` grün. |
| AK2 Karte zeigt die Daten | erfüllt | `AdventureCard.tsx`: Bild 16:9, Name, Level-Badge, Beschreibung (2 Zeilen), Party. BDD `feature:8`; Backend-Test für Stufe und `image: null`; Unit `partyPreview`. |
| AK3 Abenteuer starten | erfüllt | Erst `PATCH /table`, nach Erfolg `/admin/play`; bei Fehler Hinweis. BDD `feature:11`; Push an alle Screens per `test_ws.py`. |
| AK4 Aktives Abenteuer fortsetzen | erfüllt | Aktive Karte navigiert ohne Schreibzugriff. BDD `feature:20`. |
| AK5 Keine automatische Aktivierung | erfüllt | `selectDefaultAdventureId` entfernt. BDD `feature:11`: Server bleibt `null`. |
| AK6 Abenteuer beenden | erfüllt | Button unten in „Einstellungen“, `ConfirmDialog`, `saveActiveAdventure(null)`, Navigation nach `/admin`. BDD `feature:26`, `adminSettings.feature:19`; Backend `test_ending_the_adventure_pushes_a_state_without_adventure`. |
| AK7 Kampf sperrt den Wechsel | erfüllt | Unit `isAdventureLocked`, Guard `AdventureCard.tsx:267`, BDD `feature:33`, `adminFight.feature:25`; zusätzlich live geprüft (gesperrte Karte, Tooltip, kein PATCH). |
| AK8 Beenden in anderem Admin-Fenster | erfüllt | `<Navigate replace>` bei `activeAdventureId === null`. BDD `feature:26`. |
| AK9 Direkter Aufruf ohne Abenteuer | erfüllt | Gleiche Umleitung. BDD `feature:41`. |
| AK10 Leer- und Fehlerzustände | erfüllt | Unit `adventureSelectStatus`; BDD `feature:46` und `feature:53`. |

**Bewertung der gemeldeten Abweichungen**
1. Beschreibung nicht gedämpft: weicht von E6 ab, nicht von AK2; begründet durch `contrast.md` (`text.muted` auf
   `secondary` in Tavern 3,9:1). Regelkonform, Bestätigung durch den User.
2. Schloss-Label zusätzlich „Gesperrt“: ergänzt E7, dokumentiert.
3. Eigener `GameTableProvider` je Route: erfüllt den Subtask; Neuaufbau verhindert, dass die Auswahl Audioausgabe
   bleibt; in `architecture.md` begründet.
4. Button zweizeilig: Layout-Detail, dokumentiert.
5. Kampfsperre anderer Karten nur Unit-Test: durch Live-Prüfung geschlossen (siehe Hinweis 4).

**Blockierende Befunde**
- keine

**Hinweise (nicht blockierend)**
1. E6 „gedämpft“: Abweichung vom User bestätigen lassen.
2. `frontend/CLAUDE.md` (Abschnitt „Struktur“) nennt `/admin/play` nicht; per Kurzweg nachziehen.
3. `SelectList`-Props `isLocked`/`lockedTitle`/`isDisabled` ohne Aufrufer; `components.md` beschreibt das Schloss
   weiter. Kandidat für Aufräumen bzw. `known-issues.md`.
4. Testlücke AK7: kein automatischer Test für den Klick auf eine gesperrte Karte; BDD mit eingeschleustem zweiten
   Abenteuer (analog `EMPTY_ADVENTURES_SCRIPT`) möglich.
5. Keine neuen `contrast.md`-Zeilen; verwendete Paare sind bereits gemessen. Optional `LOCKED_OPACITY` unter
   „Bewusste Ausnahmen“ in `DESIGN.md` 2.6.
6. Plan-Wortlaut E3 („Speichern fehlgeschlagen“) weicht vom Code ab („Änderung konnte nicht gespeichert werden“);
   `screens.md` ist korrekt.
7. Flaky Backend-Test `test_ws.py::test_join_overlay_is_pushed_to_all_walls` (1 von 7 Läufen,
   `InvalidRequestError`); vorbestehend wie in DND-51 Hinweis 2, nicht im Diff.
8. Testablage: Push-Test in `test_ws.py` statt `test_table.py`; 409 mit `null` deckt
   `test_fight.py::test_adventure_change_is_rejected_during_a_fight` ab.

**Checks**
- Backend: ruff, ruff format, mypy grün; pytest 338/338 (1 von 7 Läufen mit Flake aus Hinweis 7); `openapi.json` ohne Diff.
- Frontend: lint, typecheck, Unit 351/351, knip, jscpd grün; `schema.d.ts` ohne Diff; `tsc -b` grün.
- E2E: betroffene Suites 18/18, Gesamtsuite 61/61 grün.
- Konventionen: ein Commit, Typ passt, keine KI-Signatur, keine Lint-Unterdrückungen, Änderungen im Scope.
- Manuell offen: Plan-Tests 1–4, vor allem Test 4 (beide Themes, mit und ohne Abenteuerbild).

**Entscheidung des Users nach Runde 1**
- Das Vorschaubild des Abenteuers im Button „Abenteuer beenden“ (Panel „Einstellungen“) entfällt.

**Umsetzung Runde 2**
- [x] Vorschaubild aus „Abenteuer beenden“ entfernt; Button bleibt zweizeilig (oben „Abenteuer beenden“, darunter
      der Name, Icon rechts über beide Zeilen), weil Text und Name im 240px breiten Panel nicht nebeneinander passen.
      Prop `image` entfernt; `image.svg` bleibt (genutzt von `AdventureCard`). Doku: `screens.md`, `components.md`.

### Runde 2 – Review vom 2026-11-07 (Commit 587c5dd, Gesamtstand gegen 73aee0b)

**Empfehlung: Abnahme.** Kein blockierender Befund. Die Entscheidung des Users ist umgesetzt: Der Button
„Abenteuer beenden“ hat kein Vorschaubild mehr (Prop `image`, `Preview`, `mediaUrl`, Import `image.svg` aus
`SettingsPanel.tsx` entfernt; `image.svg` nutzt weiter `AdventureCard.tsx`). AK1–AK10 bleiben erfüllt, alle
Frontend-Checks grün, Gesamt-E2E 61/61. Layout per Screenshot in beiden Themes geprüft; der gedämpfte Name erreicht AA.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1–AK5, AK8–AK10 | erfüllt | In Runde 2 unverändert; BDD `adminAdventureSelect.feature` in der Gesamtsuite grün. |
| AK6 Abenteuer beenden | erfüllt | Button unten im Panel (Screenshot Tavern, 206×56 px unter „Ground-Raster“), Name `end-adventure-name`. BDD `adminSettings.feature:12/21-23`, `adminAdventureSelect.feature:29` grün. |
| AK7 Kampf sperrt den Wechsel | erfüllt | Schloss und `aria-disabled` unverändert (`end-adventure-lock`). BDD `adminFight.feature:31-32` grün. |

**Prüfung der Userentscheidung und des Layouts**
- Diff 9e10442..587c5dd: nur `SettingsPanel.tsx`, `docs/screens.md`, `frontend/docs/design/components.md`, Plan.
- Grid `"label icon" "name icon"`, Spalten `minmax(0, 1fr) auto`, `column-gap` `space.3`, Icon über beide Zeilen
  zentriert; entspricht `components.md` und `screens.md`.
- Screenshots Cyber und Tavern: oben „Abenteuer beenden“, darunter Name in `text.muted`, rechts `logout.svg`. Langer
  Name wird einzeilig mit „…“ gekürzt, Höhe bleibt 56 px.
- Kontrast Name (`text.muted` auf `background`): Cyber 8,56:1, Tavern 4,82:1 (Ziel 4,5) – deckt sich mit `contrast.md:65`.

**Blockierende Befunde**
- keine

**Hinweise (nicht blockierend)**
1. `contrast.md:65` nennt den Namen im Button „Abenteuer beenden“ nicht unter „Verwendung“; optional ergänzen.
2. Gesperrter/deaktivierter Zustand des Buttons nur per BDD geprüft, nicht im Screenshot; deaktiviert ist nach WCAG
   vom Kontrastziel ausgenommen.
3. Hinweise 2–8 aus Runde 1 bleiben offen.
4. Plan-Test 4 (beide Themes, mit/ohne Abenteuerbild) bleibt manuell offen, betrifft nur noch die Abenteuerkarten.

**Checks**
- Frontend: lint, `tsc -b`, Unit 351/351, knip, jscpd grün.
- E2E: Gesamtsuite 14 Suites, 61/61 grün.
- Backend: in Runde 2 unverändert, nicht erneut ausgeführt (Runde 1: 338/338).
- Konventionen: ein Commit `feat(DND-52): address review round 1`, 3 Stichpunkte, keine KI-Signatur, im Scope.
