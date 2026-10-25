# DND-36: Ground-Raster und Audio in den Admin, Wall und Ground ohne Steuerleiste

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Wall und Ground haben je eine Steuerleiste, die beim Hover am unteren Rand erscheint (`ScreenControlBar`): auf dem
Ground „Raster“ BLACK/WHITE/OFF und „Zelle“ (Zellgröße, je Ground lokal), auf der Wall WORLD/OFF und AUDIO. Seit DND-35
steuert der Admin das Wall-Overlay; das Raster lässt sich aber weiter nur am Ground einstellen, und die Musik spielt
nur eine Wall, auf der jemand AUDIO geklickt hat. Dieser Task legt das Ground-Raster auf den Server und ergänzt
neben dem Panel „Wall-Overlay“ ein Dashboard-Panel „Ground-Raster“. Musik und Soundeffekte spielt künftig der Admin selbst (den
Lautsprecher wählt der Spielleiter außerhalb der App). Wall und Ground werden reine Anzeigen ohne Bedienelemente. Am
Spieltisch steuert der Spielleiter alles vom Admin aus und muss nie mehr an Wall oder Ground klicken.

## Scope / Non-Goals

**Im Scope**
- Ground-Raster (Farbe, Zellgröße) im Spieltisch-Zustand, flüchtig, Push an alle Screens.
- Neues Panel „Ground-Raster“ (Raster und Zellgröße) neben dem unveränderten Panel „Wall-Overlay“.
- Audioausgabe von der Wall in den Admin: Abspielen im Admin, Schalter „Hier abspielen“ im Panel „Musik“.
- Wall und Ground ohne Steuerleiste; `ScreenControlBar`, die Audio-Logik der Wall und die nicht mehr nötigen Teile
  (Platzhalter `CONTROL_BAR_CLEARANCE`, Hover-Fläche, Wall-Nachrichten) entfernen.

**Nicht im Scope**
- Weltkarte und Raster selbst (Darstellung, Linienstärke, Farben, Bereich 100–200) bleiben unverändert.
- Auswahl des Lautsprechers in der App (`setSinkId`); das Ausgabegerät legt der Spielleiter im Betriebssystem bzw.
  Browser fest.
- Neue Sounds, Playlists oder andere Musiklogik auf dem Server (Trackwahl, Szenenwechsel, Lautstärke bleiben).
- Player Screen.

## Entscheidungen

### E1: Ground-Raster im Spieltisch-Zustand, flüchtig
- **Entscheidung:** Zwei neue Felder in `GameTableState` und `GameTableUpdate`: `ground_grid` (`"black" | "white" |
  "off"`, Default `"off"`) und `ground_grid_cell_size` (Ganzzahl 100–200 in Schritten von 10, Default 100; andere
  Werte → 422). Geändert per `PATCH /table`, danach `state`-Push an alle. Beide liegen nur im Speicher des Backends
  wie `wall_overlay` (DND-35 E4), nach einem API-Neustart `off`/100. Ein Szenen- oder Abenteuerwechsel ändert das
  Raster nicht (wie bisher gilt es für alle Szenen). Der Ground zeigt nur, was der Server schickt.
- **Verworfene Alternativen:** Speichern in der DB; Zurücksetzen beim Szenenwechsel; ein verschachteltes Objekt
  `ground_grid {color, cell_size}` (passt schlechter zum partiellen PATCH).
- **Begründung:** Gleiches Muster wie das Wall-Overlay; ohne Migration.

### E2: Eigenes Panel „Ground-Raster“, Panel „Wall-Overlay“ bleibt
- **Entscheidung:** Wall und Ground bekommen getrennte Panels. „Wall-Overlay“ (DND-35 E3) bleibt unverändert
  (Weltkarte/Aus). Neues Panel „Ground-Raster“, 2x1, mit den Umschalt-Buttons „Schwarz“, „Weiß“, „Aus“
  (`aria-pressed`, hervorgehoben ist der Zustand des Servers) und einem Slider „Zellgröße“ (100–200, Schritt 10, Wert
  daneben angezeigt), der beim Loslassen speichert (wie die Lautstärke: während des Ziehens lokaler Wert, danach der
  Wert des Servers). Ohne Verbindung bzw. vor dem ersten Stand wie die übrigen Panels. Fehler beim Speichern zeigen
  die Speicherfehler-Leiste. Die Buttons dürfen umbrechen, die Zeile wächst bei Bedarf (DND-33).
- **Verworfene Alternativen:** ein gemeinsames Panel „Overlays“ (4x1) für Wall und Ground; Steuerung im Panel
  „Screens“; Slider live beim Ziehen.
- **Begründung:** Wunsch des Spielleiters; je Screen ein Panel.

### E3: Neue Anordnung im Raster
- **Entscheidung:** „Aktive Szene“ 4x2; „Musik“ 2x2 und „Sounds“ 2x2 nebeneinander; „Wall-Overlay“ 2x1 und
  „Ground-Raster“ 2x1 nebeneinander; „Screens“ 4x2; „Level“ 4x1; „Spieler“ 4xN. Die Lücke neben „Musik“ aus DND-35
  entfällt.
- **Begründung:** Audio-Steuerung nebeneinander, die Steuerung von Wall und Ground nebeneinander.

### E4: Der Admin spielt Musik und Sounds
- **Entscheidung:** Die bisherige Wall-Audioausgabe zieht in den Admin: Die Rolle „Audioausgabe“ kann künftig nur
  eine Verbindung mit `screen=admin` haben, der Server wertet `audio_ready` und `track_ended` nur noch von Admins aus
  (von Walls nicht mehr). Es spielt immer genau ein Admin (die zuletzt gemeldete Verbindung), die bisherige verliert
  die Rolle (`audio_output {active: false}`) und verstummt. Der Player (`wallAudioPlayer.ts`) wird zu einem
  allgemeinen Audio-Player (Name ohne „Wall“) und läuft im Admin; Verhalten unverändert (Play/Pause, Lautstärke,
  Sounds bei voller Lautstärke über der Musik, Trackende melden, nach Verbindungsabbruch ohne neuen Klick wieder als
  Ausgabe melden).
- **Verworfene Alternativen:** Wall spielt ohne Button (nur mit Autoplay-Freigabe des Browsers); jede Wall spielt;
  jedes Admin-Fenster spielt.
- **Begründung:** Der Admin hat ohnehin Nutzerinteraktion (kein Autoplay-Problem); der Spielleiter legt den
  Lautsprecher außerhalb der App fest.

### E5: Schalter „Hier abspielen“
- **Entscheidung:** Im Panel „Musik“ ein Umschalt-Button „Hier abspielen“ (`aria-pressed`, hervorgehoben, solange
  dieses Fenster Ausgabe ist). Ein Klick macht dieses Admin-Fenster zur Ausgabe (der Klick gibt die Wiedergabe im
  Browser frei); ein Klick auf den hervorgehobenen Button tut nichts. Nach einem Reload ist das Fenster keine Ausgabe
  mehr, bis wieder geklickt wird (der Browser verlangt die Interaktion). Ist kein Admin Ausgabe, steht wie bisher
  „Keine Audioausgabe bereit“; die Befehle ändern trotzdem den Zustand. Blockiert der Browser das Abspielen, wird der
  Fehler geloggt, ein erneuter Klick versucht es wieder.
- **Verworfene Alternativen:** jedes Admin-Fenster spielt automatisch.
- **Begründung:** Kein doppelter Ton bei mehreren Admin-Fenstern.

### E6: Wall und Ground ohne Bedienelemente
- **Entscheidung:** `ScreenControlBar` entfällt ersatzlos, ebenso die Hover-Fläche, `CONTROL_BAR_CLEARANCE` (die
  Weltkarte nutzt die frei werdende Höhe, bleibt vollständig sichtbar und oben mittig) und alle Audio-Teile der Wall
  (Player, `audio_ready`/`track_ended` senden, Auswertung von `audio_output`/`sound`). Wall zeigt Szenenbild und
  Weltkarte, Ground Szenenbild und Raster, beides nur nach dem Spieltisch-Zustand. Im Panel „Screens“ entfällt bei der
  Wall die Angabe „Audioausgabe“. Komponenten und Styles, die danach ungenutzt sind (z. B. `TextButton`, falls nur
  dort verwendet), werden entfernt.
- **Begründung:** Wunsch des Spielleiters; nichts auf Wall und Ground soll bedient werden.

### E7: Zwei Schritte
- **Entscheidung:** Schritt 1: Ground-Raster über den Server und Panel „Ground-Raster“, Steuerleiste des Ground und
  WORLD/OFF der Wall entfernen (AUDIO bleibt vorerst). Schritt 2: Audioausgabe in den Admin, AUDIO und
  `ScreenControlBar` vollständig entfernen. Jeder Schritt ist für sich lauffähig.
- **Begründung:** Kleine Umsetzungsrunden; Musik spielt nach jedem Schritt.

## Subtasks

### Schritt 1: Ground-Raster vom Admin, Panel „Ground-Raster“

#### Vertrag
- [x] `ground_grid` und `ground_grid_cell_size` in `GameTableState`/`GameTableUpdate` (E1); `openapi.json` und
      `frontend/src/api/schema.d.ts` neu erzeugen.

#### Backend
- [x] Flüchtiger Zustand nach Vorbild `app/realtime/wall_overlay.py`; `PATCH /table` nimmt die Felder an, Snapshot
      enthält sie.
- [x] Tests: PATCH und Push; Validierung (ungültige Farbe, Zellgröße außerhalb 100–200 oder nicht in 10er-Schritten →
      422); Szenen- und Abenteuerwechsel lassen das Raster unverändert; Default nach Start.

#### Frontend
- [x] `GameTableProvider`/Context: Raster bereitstellen.
- [x] Ground: `GridOverlay` aus dem Spieltisch-Zustand; `ScreenControlBar` und lokaler Zustand entfernen.
- [x] Wall: WORLD/OFF aus der Steuerleiste entfernen (nur AUDIO bleibt bis Schritt 2).
- [x] Panel „Ground-Raster“ (E2), Anordnung nach E3.
- [x] Unit: Zuordnung Farbe → Linienfarbe (falls als Funktion), Slider-Wert beim Loslassen.
- [x] E2E: `wallOverlay.feature` weiter grün (Anordnung angepasst); neues Szenario Raster vom Admin → Ground zeigt es, auch
      nach Szenenwechsel.

### Schritt 2: Audio im Admin, Steuerleisten entfernt

#### Vertrag
- [x] `docs/architecture.md`: `audio_ready`/`track_ended` nur von `screen=admin`, `audio_output` an Admins (E4).

#### Backend
- [x] `app/api/routes/ws.py` und `app/realtime/audio.py`/`push.py`: Ausgabe-Rolle an Admin- statt Wall-Verbindungen;
      Nachrichten von Walls ignorieren.
- [x] Tests in `tests/test_ws.py`/`test_audio.py` umstellen: Admin wird Ausgabe, zweiter Admin übernimmt, Trennen
      gibt die Rolle frei, Wall-Nachrichten werden ignoriert.

#### Frontend
- [x] `wallAudioPlayer.ts` → allgemeiner Player (umbenennen inkl. Unit-Test), im Admin verwenden (E4).
- [x] Panel „Musik“: Schalter „Hier abspielen“ (E5); Hinweis „Keine Audioausgabe bereit“ bleibt.
- [x] Wall: AUDIO, Player und Audio-Nachrichten entfernen; `ScreenControlBar`, Hover-Fläche und
      `CONTROL_BAR_CLEARANCE` löschen, Weltkarte neu einpassen (E6).
- [x] Panel „Screens“: „Audioausgabe“ bei der Wall entfernen.
- [x] Ungenutzte Komponenten, Styles, Tokens und Tests entfernen (Qualitäts-Checks aus DND-31 grün).
- [x] E2E: Musik-Szenarien auf den Admin als Ausgabe umstellen.

### Doku
- [x] `CLAUDE.md` (Leitplanke „Setup am Spieltisch“: Admin spielt Musik und Sounds, Lautsprecher außerhalb der App).
- [x] `docs/screens.md` (Admin, Wall, Ground: Soll und Ist), `docs/architecture.md` (Spieltisch-Zustand, WebSocket,
      Audio), `docs/domain.md` (Audioausgabe, Raster), `docs/vision.md` falls betroffen, `docs/known-issues.md`.
- [x] `frontend/DESIGN.md`, `frontend/docs/design/components.md` (Steuerleiste entfernen, Panel „Ground-Raster“),
      `screen-layouts.md` (Raster, Wall ohne Leiste), `contrast.md` falls betroffen; `frontend/CLAUDE.md`.

## Akzeptanzkriterien

### AK1: Ground-Raster vom Admin
- **Given** Admin und zwei Grounds sind geöffnet, kein Raster ist sichtbar
- **When** der Spielleiter im Panel „Ground-Raster“ auf „Weiß“ klickt
- **Then** zeigen beide Grounds ein weißes Raster, das Panel hebt „Weiß“ hervor
- **When** er den Slider „Zellgröße“ auf 150 zieht und loslässt
- **Then** zeigen beide Grounds das Raster mit Zellgröße 150, auch ein danach geöffneter Ground
- **When** er die Szene wechselt
- **Then** bleibt das Raster so

### AK2: Getrennte Panels
- **Given** der Admin Screen ist geöffnet
- **Then** stehen „Wall-Overlay“ und „Ground-Raster“ als zwei Panels nebeneinander unter „Musik“ und „Sounds“
- **When** der Spielleiter im Panel „Wall-Overlay“ auf „Weltkarte“ bzw. „Aus“ klickt
- **Then** verhalten sich die Walls wie bisher (DND-35)

### AK3: Admin spielt ab
- **Given** ein Admin-Fenster ist offen, Musik ist pausiert
- **When** der Spielleiter im Panel „Musik“ auf „Hier abspielen“ und dann auf Play klickt
- **Then** spielt die Musik in diesem Admin-Fenster, „Hier abspielen“ ist hervorgehoben, „Keine Audioausgabe bereit“
  ist verschwunden; Sounds aus dem Panel „Sounds“ erklingen über der Musik
- **And** nach dem Trackende folgt ein anderer Track wie bisher

### AK4: Nur ein Admin spielt
- **Given** zwei Admin-Fenster sind offen, das erste ist Ausgabe
- **When** im zweiten auf „Hier abspielen“ geklickt wird
- **Then** verstummt das erste, das zweite spielt; nur im zweiten ist der Schalter hervorgehoben
- **When** das zweite Fenster geschlossen wird
- **Then** zeigen die übrigen Admins „Keine Audioausgabe bereit“

### AK5: Wall und Ground ohne Bedienelemente
- **Given** Wall und Ground sind geöffnet
- **When** die Maus über den Screen bewegt wird
- **Then** erscheint keine Steuerleiste; die Wall spielt keinen Ton
- **And** die Weltkarte ist vollständig sichtbar, das Panel „Screens“ zeigt bei der Wall keine „Audioausgabe“ mehr

### AK6: Fehler und Neustart
- **Given** das Speichern des Rasters schlägt fehl
- **Then** ändert sich auf keinem Ground etwas, die Speicherfehler-Leiste erscheint
- **And** nach einem API-Neustart ist das Raster aus, Zellgröße 100

## Teststrategie / Verifikation

**Automatisch**
- Backend: Tests wie in den Subtasks; `ruff`, `mypy`, `pytest`, Qualitäts-Checks grün; `openapi.json` aktuell.
- Frontend: Unit für den umbenannten Player und das Panel; BDD wie in den Subtasks; Lint, Typecheck, Build grün.

**Manuell**
1. Admin, zwei Grounds und eine Wall öffnen; Raster und Zellgröße vom Admin, Szenenwechsel (AK1), Weltkarte (AK2).
2. „Hier abspielen“, Play, Sound, Lautstärke, Trackende abwarten (AK3); zweites Admin-Fenster (AK4).
3. Hover über Wall und Ground, Weltkarte ansehen, beide Themes (AK5).
4. Backend stoppen und Raster ändern; API neu starten (AK6).

## Offene Fragen
- keine

## Review
