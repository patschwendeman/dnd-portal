# DND-33: Admin-Dashboard mit Panel-Raster (Szene, Musik, Sounds, Screens)

**Typ:** feat
**Status:** Fertig

## Kontext & Ziel

Rechts im Admin steht heute nur die Karte „Aktive Szene“ in einer festen 400px-Spalte. Die Musik sitzt in der sonst
leeren Bottom-Bar, die Sounds und der QR-Button in der Top-Bar. Die rechte Spalte wird zu einem Dashboard: ein festes
Raster mit Panels unterschiedlicher Größe, in dem der Spielleiter alles bündelt, was er während des Spiels steuert –
Szene, Musik, Sounds und die Screens am Tisch (Status, Fenster öffnen, QR-Code). Am Spieltisch sieht er auf einen
Blick, ob Wall und Ground verbunden sind und wer die Musik abspielt, und bedient alles an einer Stelle. Folgetasks
ergänzen die Panels „Spieler“ und „Level“ (DND-34) und „Wall-Overlay“ (DND-35).

## Scope / Non-Goals

**Im Scope**
- Dashboard statt rechter Spalte: etwa 33 % breit, festes Raster mit 4 Spalten, Panels mit fester Größe und Position.
- Einklappen/Ausklappen des Dashboards über ein Icon in der Top-Bar.
- Panels „Aktive Szene“ (mit Vorschau von Wall- und Ground-Bild), „Musik“, „Sounds“, „Screens“.
- Musik aus der Bottom-Bar, Sounds und QR-Button aus der Top-Bar ins Dashboard; Bottom-Bar entfällt.
- Backend: Anzahl der verbundenen Screens je Typ an die Admins pushen.

**Nicht im Scope**
- Panels „Spieler“, „Level“ (DND-34) und „Wall-Overlay“ (DND-35).
- Verschieben, Skalieren oder Ausblenden einzelner Panels; gespeichertes Layout.
- Fenster gezielt auf einem bestimmten Monitor öffnen (Window-Management-API).
- Platzhalter „Enemies“/„Loot“ (entfallen ersatzlos, Kampfdaten kommen mit „Kampf“).
- Änderungen an Wall, Ground und Player Screen (außer dass sie im Status gezählt werden).
- Neue Sounds oder geänderte Sound-Gruppen.

## Entscheidungen

### E1: Breite und Raster
- **Entscheidung:** Die Content-Spalten werden `2fr 1fr` (Notizen ≈ 67 %, Dashboard ≈ 33 %), der Abstand bleibt
  `space.5`. Das Dashboard ist ein CSS-Grid mit 4 gleich breiten Spalten (`repeat(4, minmax(0, 1fr))`), fester
  Zeilenhöhe (Konstante, z. B. `DASHBOARD_ROW_HEIGHT`, Wert bei der Umsetzung im Browser festlegen) und `gap`
  `space.4`. Jedes Panel hat eine feste Größe „Spalten x Zeilen“ (`grid-column: span n`, `grid-row: span m`).
  Ist das Raster höher als der Hauptbereich, scrollt das Dashboard für sich, die Notizen bleiben stehen.
- **Verworfene Alternativen:** 400px mit 2-Spalten-Raster; per Trenner verstellbare Breite.
- **Begründung:** Wunsch des Spielleiters; 2x2- und 4x4-Panels brauchen mehr Breite, die Notizen bleiben lesbar.

### E2: Feste Anordnung (Vorschlag A)
- **Entscheidung:** Von oben nach unten: „Aktive Szene“ 4x2; „Musik“ 4x1; „Sounds“ 2x2 und „Screens“ 2x2
  nebeneinander. Unter Sounds/Screens kommt später „Spieler“ (DND-34). Die Panels sind im Code fest
  definiert (Liste mit Größe und Inhalt), kein Drag & Drop.
- **Verworfene Alternativen:** Steuerung oben (Vorschlag B); Anordnung durch den Spielleiter.
- **Begründung:** Die Szene ist der wichtigste Kontext; ohne Speichern eines Layouts bleibt es einfach.

### E3: Panel als gemeinsamer Baustein
- **Entscheidung:** Neuer Baustein `DashboardPanel` (Fläche wie die bisherige Karte „Aktive Szene“: Hintergrund,
  Radius, Innenabstand nach DESIGN.md) mit Label oben (`Label`) und Inhalt; Größe als Props (`columns`, `rows`). Inhalt,
  der nicht in die feste Höhe passt, scrollt im Panel bzw. wird gekürzt (Beschreibung der Szene).
- **Begründung:** Ein Baustein für alle Panels, auch für die Folgetasks.

### E4: Einklappen über die Top-Bar
- **Entscheidung:** Rechts in der Top-Bar (links vom Theme-Umschalter) ein Icon-Button „Dashboard“ (Tooltip, neues
  Icon `public/assets/icons/dashboard.svg`, `fill="currentColor"`). Klick blendet das Dashboard aus, die Notizen nehmen
  die volle Breite; erneuter Klick blendet es wieder ein. Der Button trägt `aria-expanded` und `aria-controls`; im
  ausgeklappten Zustand ist er hervorgehoben wie der aktive Menüpunkt der Navigationsleiste. Der Zustand wird nicht
  gespeichert (wie das Nav-Panel), nach einem Reload ist das Dashboard offen. Auswahl und Scrollposition der Notizen
  bleiben beim Ein- und Ausklappen erhalten.
- **Verworfene Alternativen:** Zustand in `localStorage`; Mini-Musiksteuerung in der Top-Bar bei eingeklapptem
  Dashboard.
- **Begründung:** Eingeklappt ist ein Lesemodus für die Notizen; Musik, Sounds und QR sind dann bewusst nicht
  erreichbar.

### E5: Panel „Aktive Szene“ mit Vorschau
- **Entscheidung:** Zwei Vorschaubilder nebeneinander (Wall-Bild und Ground-Bild der aktiven Szene, über `mediaUrl`,
  `object-fit: cover`, mit kleinem Label „Wall“/„Ground“), darunter Name und Beschreibung. Ohne aktive Szene der
  Hinweis „Keine Szene aktiv“ ohne Bilder; fehlt einer Szene ein Bild, steht an seiner Stelle eine leere Fläche.
  „Enemies“ und „Loot“ entfallen. `DetailsSideBar` wird dazu umgebaut bzw. ersetzt.
- **Begründung:** Der Spielleiter sieht, was die Spieler sehen, ohne zur Wall zu schauen.

### E6: Panel „Musik“
- **Entscheidung:** Der bisherige Inhalt der Bottom-Bar zieht unverändert um: Play/Pause, Label „Musik“, Titel des
  Tracks, Hinweis „Keine Audioausgabe bereit“, Lautstärke-Slider (gesendet beim Loslassen). Verhalten und Fehlerfälle
  wie bisher. Der Code wird dabei aus `AdminScreen.tsx` in eine eigene Komponente gezogen.
- **Begründung:** Gleiche Funktion, neuer Ort; `AdminScreen` wird kleiner.

### E7: Panel „Sounds“
- **Entscheidung:** Die Sound-Buttons der Top-Bar ziehen mit ihren Gruppen (Heilung/Trank, Buff, Zauber, Debuff,
  Lock) in das Panel, Verhalten unverändert (kein Fehler ohne Ausgabe, Fehler nur geloggt). Die Mitte der Top-Bar
  bleibt leer.
- **Begründung:** Wunsch des Spielleiters; alle Audio-Steuerung an einer Stelle.

### E8: Panel „Screens“
- **Entscheidung:** Je eine Zeile für Wall und Ground: Name, Status-Punkt mit Text „verbunden“ bzw. „nicht
  verbunden“ (bei mehr als einer Verbindung „2 verbunden“), bei der Wall zusätzlich „Audioausgabe“, wenn eine Wall
  Ausgabe ist (`AudioState.output_ready`), und ein Icon-Button „In neuem Fenster öffnen“ (`window.open` auf `/wall`
  bzw. `/ground`, eigenes Fenster je Screen-Name, sodass ein zweiter Klick das bestehende Fenster wiederverwendet).
  Darunter „N Spieler verbunden“ und ein Button „QR-Code“, der den bestehenden `JoinDialog` öffnet. Der Handy-Button
  in der Top-Bar entfällt.
- **Verworfene Alternativen:** nur Audio-Status ohne Backend-Änderung; QR-Button an beiden Stellen.
- **Begründung:** Der Spielleiter sieht sofort, ob ein Screen fehlt, und öffnet ihn mit einem Klick.

### E9: Verbindungszahlen per WebSocket
- **Entscheidung:** Neue Server-Nachricht `{"type": "screens", "payload": {"wall": int, "ground": int, "player": int}}`
  nur an Verbindungen mit `screen=admin`: direkt nach dem Verbinden eines Admins (nach `state` und `audio`) und an alle
  Admins, sobald sich die Zahl der Verbindungen eines Typs ändert (Verbinden, Trennen, Entfernen nach fehlgeschlagenem
  Senden). Admin-Verbindungen werden nicht gezählt. Die Zahlen sind flüchtig (nur im Speicher), nicht in
  `GameTableState`. Frontend: `parseServerMessage` kennt den Typ, der `GameTableProvider` stellt die Zahlen bereit
  (z. B. `screens` im `GameTableContext`, bis zur ersten Nachricht `null`, dann zeigt das Panel „–“ statt eines
  Status).
- **Verworfene Alternativen:** Zahlen im `state`-Snapshot an alle; REST-Endpoint mit Polling.
- **Begründung:** Nur der Admin braucht die Zahlen; Push passt zur bestehenden Synchronisation.

### E10: Bottom-Bar entfällt
- **Entscheidung:** Die Bottom-Bar wird entfernt; das Screen-Grid hat nur noch Top-Bar, ggf. Hinweisleisten und
  Hauptbereich. Navigationsleiste und Nav-Panel reichen bis zum unteren Rand.
- **Begründung:** Nach E6 ist sie leer.

### Runde 3 (Änderungswünsche des Users nach manueller Prüfung)

#### E11: Neue Anordnung, wachsende Zeilen, Mindestbreite (ersetzt E2 und Teile von E1/E3)
- **Entscheidung:** Von oben: „Aktive Szene“ 4x2; „Musik“ 2x2 und „Sounds“ 2x2 nebeneinander; „Screens“ 4x2
  (Spieler aus DND-34 darunter). Keine Lücken. Zeilen `minmax(DASHBOARD_ROW_HEIGHT, auto)`: braucht ein Panel mehr
  Platz, wächst seine Zeile; Panels scrollen nie für sich, Text bricht um (deutsche Texte mit Silbentrennung).
  Das Dashboard ist mindestens `DASHBOARD_MIN_WIDTH` = 400px breit (`minmax(400px, 1fr)`), sonst ist ein
  2-Spalten-Panel bei 1280px mit offenem Nav-Panel nur ~135px breit.
- **Verworfene Alternativen:** „Musik“ | „Screens“ nebeneinander, „Sounds“ voll breit (Screens-Zeile mit zwei
  Icon-Buttons passt nicht in 2 Spalten); feste Zeilenhöhe mit Scrollen im Panel (vom User abgelehnt).
- **Begründung:** Musik und Sounds gehören zusammen; „Screens“ braucht Breite für Status und Buttons.
  Nebenwirkung: Bei 1280px mit offenem Nav-Panel sind die Notizen ~100px schmaler als vorher.

#### E12: Senkrechter Lautstärke-Regler
- **Entscheidung:** „Musik“ als Grid: links Play/Pause, darunter Titel und Hinweis (umbrechend), rechts über die volle
  Höhe der MUI-Slider mit `orientation="vertical"` (`aria-orientation="vertical"`, Pfeiltasten), Mindesthöhe
  `VOLUME_SLIDER_MIN_HEIGHT`. Verhalten (Senden beim Loslassen) unverändert.

#### E13: QR-Code als Icon-Button
- **Entscheidung:** Icon-Button mit neuem Icon `qrCode.svg` rechts in der Zeile „n Spieler verbunden“, ausgerichtet wie
  die Buttons bei Wall/Ground; `data-test-id="join-button"`, Fokus kehrt nach dem Schließen zurück.

#### E14: Vollbild (Fernsteuerung von Wall/Ground in Runde 5 entfernt, siehe E15)
- **Entscheidung:**
  - Admin: Icon-Button „Vollbild“ in der Top-Bar links von „Dashboard“ (Fullscreen API, Zustand über
    `fullscreenchange`, `aria-pressed`, hervorgehoben wie „Dashboard“). Icons `fullscreen.svg`/`fullscreenExit.svg`.
  - ~~Wall/Ground~~ (entfernt in Runde 5): Icon-Button „Vollbild“ je Zeile im Panel „Screens“ (an/aus für alle Screens des Typs, hervorgehoben,
    solange mindestens einer im Vollbild ist). Protokoll: Admin → `fullscreen {screen, active}`; Server → alle
    Walls bzw. Grounds `fullscreen {active}`; Wall/Ground → `fullscreen_state {active}` (nach jeder Änderung und nach
    dem Verbinden; Server zählt ihn in `screens.fullscreen`) und `fullscreen_rejected` (Server → Admins
    `fullscreen_rejected {screen}`).
  - Browser-Prüfung (Chrome 156 per Selenium): `requestFullscreen` nach einer WS-Nachricht ohne Klick im Zielfenster
    → „Permissions check failed“; Aufruf aus dem Admin auf das Popup-Dokument → ebenso abgelehnt; `postMessage` mit
    `delegate: "fullscreen"` an ein vom Admin geöffnetes Popup → klappt; erneuter Versuch beim nächsten Klick im
    Zielfenster → klappt; `exitFullscreen` per WS → klappt immer.
  - Daher: Ein vom Admin geöffnetes Fenster erhält zusätzlich die Delegation (sofort Vollbild, solange der Admin nicht
    neu geladen wurde). Andere Fenster lehnen ab, melden das und holen das Vollbild mit dem nächsten Klick in ihr
    Fenster nach; der Admin zeigt in der Zeile „Vollbild vom Browser abgelehnt – einmal in das Wall-Fenster klicken“
    (bzw. Ground). „Aus“ verwirft einen wartenden Wechsel. Wall/Ground-Logik in `src/realtime/remoteFullscreen.ts`,
    eingebunden in `useGameTable`; `WallScreen`/`GroundScreen` unverändert.
- **Verworfene Alternativen:** nur Hinweis ohne Fernsteuerung; Fernsteuerung je einzelner Verbindung (Protokoll
  schlanker je Typ).

### Runde 5 (Entscheidung des Users)

#### E15: Keine Fernsteuerung des Vollbilds; Szenentext umbrechen
- **Entscheidung:**
  - Die Fernsteuerung des Vollbilds von Wall und Ground (E14, zweiter bis vierter Punkt) entfällt vollständig:
    keine Vollbild-Buttons und kein Hinweis im Panel „Screens“, keine Delegation, keine Nachrichten `fullscreen`,
    `fullscreen_state`, `fullscreen_rejected`, kein Feld `screens.fullscreen`, kein `remoteFullscreen.ts`. Panel
    „Screens“, Protokoll und Backend wie nach Runde 2 (QR-Icon-Button aus E13 bleibt). AK10 und AK11 entfallen.
  - Der Vollbild-Button des Admin-Fensters in der Top-Bar bleibt (AK9).
  - „Aktive Szene“: Name und Beschreibung brechen um (Silbentrennung), nichts wird gekürzt (ersetzt den Teil
    „gekürzt“ aus E3). Damit die Zeilen dafür wirklich wachsen, ist das Dashboard so hoch wie sein Raster, höchstens so
    hoch wie der Hauptbereich (`align-self: start`, `max-height: 100%`); mit fester Höhe wuchsen die Zeilen nur im
    freien Platz, ein Panel mit mehr Inhalt lief über seine Zeilen hinaus.

## Subtasks

### Schritt 1: Dashboard mit Szene, Musik und Sounds (nur Frontend)

#### Frontend
- [x] Baustein `DashboardPanel` (E3) und Dashboard-Raster in `AdminScreen` statt `SidebarRight` (E1, E2).
- [x] Panel „Aktive Szene“ mit Vorschau, ohne „Enemies“/„Loot“ (E5).
- [x] Musik als eigene Komponente ins Panel „Musik“ (E6); Bottom-Bar entfernen (E10).
- [x] Sounds aus `TopBar` ins Panel „Sounds“ (E7).
- [x] Icon-Button „Dashboard“ in der Top-Bar mit Ein-/Ausklappen (E4), Icon `dashboard.svg`.
- [x] E2E: Szenarien für Musik und Sounds auf den neuen Ort umstellen; neues Szenario Ein-/Ausklappen; Szenenwechsel
      zeigt Name und Vorschau im Panel.

### Schritt 2: Panel „Screens“ mit Verbindungsstatus

#### Vertrag
- [x] Nachricht `screens` nach E9 in `docs/architecture.md` (WebSocket-Tabelle) beschreiben.

#### Backend
- [x] `ConnectionManager`: Zählen je Screen-Typ; bei Änderung die Nachricht an alle Admins pushen, einem neuen Admin
      direkt nach `state`/`audio` senden (E9).
- [x] Tests in `tests/test_ws.py`: neuer Admin erhält die Zahlen; Verbinden und Trennen einer Wall, eines Ground und
      eines Players ändert sie; Wall/Ground/Player erhalten keine `screens`-Nachricht; Admins zählen nicht.

#### Frontend
- [x] `src/realtime/messages.ts`: Typ `screens` parsen; `GameTableProvider`/Context: Zahlen bereitstellen (E9).
- [x] Panel „Screens“ (E8): Status Wall/Ground, Audioausgabe, Spielerzahl, Fenster öffnen, QR-Code; Handy-Button aus
      der Top-Bar entfernen, `JoinDialog` aus dem Panel öffnen (Fokus kehrt nach dem Schließen zum Button zurück).
- [x] Unit: Parsen der Nachricht; Text des Status aus der Anzahl (0 / 1 / n).
- [x] E2E: QR-Dialog über das Panel; Status „verbunden“ bei offener Wall/Ground.

### Doku
- [x] `docs/screens.md` (Admin, Soll und Ist): Dashboard, Panels, Einklappen, keine Bottom-Bar, QR über „Screens“.
- [x] `docs/architecture.md`: Nachricht `screens`, Zählung der Verbindungen.
- [x] `frontend/DESIGN.md`, `frontend/docs/design/components.md` (Dashboard-Panel, Status-Punkt),
      `screen-layouts.md` (Admin-Layout, Raster, Konstanten), `contrast.md` bei neuen Farbkombinationen.
- [x] `frontend/CLAUDE.md`: neue Komponenten.

### Schritt 3 (Runde 3): Rückmeldung des Users

#### Vertrag
- [x] ~~`docs/architecture.md`: `screens.fullscreen`, `fullscreen`, `fullscreen_state`, `fullscreen_rejected`;
      Ablauf der Fernsteuerung (E14)~~ (in Runde 5 entfernt).

#### Backend
- [x] ~~`Connection.fullscreen`, `screen_counts` mit `fullscreen`, `send_to_screen`, `set_fullscreen`; Nachrichten in
      `ws.py` (E14)~~ (in Runde 5 entfernt).
- [x] ~~Tests in `tests/test_ws.py`: Weiterleitung an alle Screens des Typs, ungültige und fremde Nachrichten,
      Zustand in `screens`, Trennen im Vollbild, `fullscreen_rejected` an alle Admins~~ (in Runde 5 entfernt).

#### Frontend
- [x] Raster neu (E11), `MusicControl` senkrecht (E12), Sounds umbrechend.
- [x] Panel „Screens“: QR-Icon-Button (E13), ~~Vollbild-Buttons und Hinweis (E14)~~ (in Runde 5 entfernt).
- [x] Top-Bar: Vollbild des Admins (E14).
- [x] ~~`messages.ts`, `remoteFullscreen.ts`, `useGameTable`/Context (E14)~~ (in Runde 5 entfernt).
- [x] Unit: ~~Parsen der neuen Nachrichten, `createRemoteFullscreen`, `updateFullscreenHints`~~ (in Runde 5 entfernt).
- [x] E2E: Anordnung und „kein Panel scrollt“, QR-Icon, Vollbild Admin, ~~Vollbild einer aus dem Admin geöffneten
      Wall, abgelehntes Vollbild eines Grounds mit Klick~~ (in Runde 5 entfernt).

#### Doku
- [x] `docs/screens.md`, `frontend/DESIGN.md`, `components.md`, `screen-layouts.md`, `contrast.md`,
      `frontend/CLAUDE.md`, `backend/CLAUDE.md`.

### Schritt 4 (Runde 5): Entscheidung des Users

#### Backend
- [x] Fernsteuerung des Vollbilds entfernen: `manager.py` (`FULLSCREEN_SCREENS`, `Connection.fullscreen`,
      `screens.fullscreen`, `send_to_screen`, `set_fullscreen`), `ws.py` (Nachrichten), Tests in `test_ws.py` (E15).

#### Frontend
- [x] `messages.ts`, `useGameTable.ts`, `GameTableProvider`, `context.ts`, `screenStatus.ts` ohne Vollbild;
      `remoteFullscreen.ts` und `remoteFullscreen.spec.ts` gelöscht; Unit-Tests der Nachrichten und Hinweise entfernt.
- [x] Panel „Screens“ ohne Vollbild-Buttons, Hinweis und `openedWindows`; Öffnen wie nach Runde 2, QR-Icon bleibt.
- [x] E2E: Szenarien „Vollbild einer Wall“ und „abgelehntes Vollbild eines Grounds“ entfernt; „kein Panel scrollt“
      prüft auch, ob ein Panel über seine Zeilen hinausläuft.
- [x] „Aktive Szene“: Name und Beschreibung umbrechend, `DESCRIPTION_MAX_LINES` und Tooltip entfallen; Dashboard
      `align-self: start`, `max-height: 100%`, damit die Zeilen wachsen (E15).

#### Doku
- [x] `docs/architecture.md`, `docs/screens.md`, `frontend/DESIGN.md`, `components.md`, `screen-layouts.md`,
      `contrast.md`, `frontend/CLAUDE.md`, `backend/CLAUDE.md`: Fernsteuerung und Kürzung entfernt.

## Akzeptanzkriterien

### AK1: Dashboard-Raster
- **Given** der Admin Screen ist geöffnet
- **Then** zeigt der rechte Bereich (etwa ein Drittel der Breite, mindestens 400px) die Panels „Aktive Szene“ über
  die volle Breite, darunter „Musik“ und „Sounds“ nebeneinander, darunter „Screens“ über die volle Breite (Runde 3)
- **And** kein Panel hat eine eigene Scrollbar oder abgeschnittenen Text, auch bei 1280×800 (Runde 3); auch Name und
  Beschreibung in „Aktive Szene“ brechen um, statt gekürzt zu werden (Runde 5)
- **And** es gibt keine Bottom-Bar, keine Sound-Buttons und keinen Handy-Button in der Top-Bar

### AK2: Ein- und Ausklappen
- **Given** das Dashboard ist offen und Notizen sind gewählt und gescrollt
- **When** der Spielleiter auf das Dashboard-Icon in der Top-Bar klickt
- **Then** verschwindet das Dashboard, die Notizen sind breiter, Auswahl und Scrollposition bleiben
- **When** er erneut klickt
- **Then** ist das Dashboard wieder da
- **And** nach einem Reload ist das Dashboard offen

### AK3: Aktive Szene
- **Given** eine Szene ist aktiv
- **Then** zeigt das Panel „Aktive Szene“ das Wall- und das Ground-Bild der Szene, ihren Namen und ihre
  Beschreibung, ohne „Enemies“ und „Loot“
- **When** der Spielleiter eine andere Szene aktiviert
- **Then** zeigt das Panel deren Bilder und Daten
- **Given** keine Szene ist aktiv
- **Then** steht dort „Keine Szene aktiv“

### AK4: Musik und Sounds
- **Given** eine Wall ist Audioausgabe
- **When** der Spielleiter im Panel „Musik“ Play/Pause oder die Lautstärke bedient bzw. im Panel „Sounds“ einen
  Sound auslöst
- **Then** verhält sich alles wie vorher in der Bottom-Bar bzw. Top-Bar (inkl. „Keine Audioausgabe bereit“ und
  Speicherfehler-Leiste)

### AK5: Screen-Status
- **Given** der Admin ist geöffnet, eine Wall und ein Ground sind verbunden, die Wall ist Audioausgabe, zwei Player
  Screens sind verbunden
- **Then** zeigt „Screens“ Wall „verbunden“ und „Audioausgabe“, Ground „verbunden“, „2 Spieler verbunden“
- **When** das Ground-Fenster geschlossen wird
- **Then** zeigt Ground kurz darauf „nicht verbunden“, ohne Reload des Admins
- **And** zwei offene Walls zeigen „2 verbunden“

### AK6: Screens öffnen
- **Given** das Panel „Screens“ ist sichtbar
- **When** der Spielleiter bei Wall bzw. Ground auf „In neuem Fenster öffnen“ klickt
- **Then** öffnet sich `/wall` bzw. `/ground` in einem neuen Fenster; ein zweiter Klick öffnet kein weiteres Fenster

### AK7: QR-Code
- **Given** das Panel „Screens“ ist sichtbar
- **When** der Spielleiter auf den QR-Code-Icon-Button rechts neben „n Spieler verbunden“ klickt (Runde 3)
- **Then** öffnet sich der bisherige Dialog mit QR-Code und Player-URL; Schließen per Button, Escape oder Klick
  außerhalb wie bisher

### AK8: Rest unverändert
- **Given** Admin, Wall und Ground sind geöffnet
- **When** der Spielleiter Notizen liest, die Navigationsleiste nutzt, Szene, Abenteuer oder Theme wechselt
- **Then** verhält sich alles wie vor dem Task, in beiden Themes; Hinweisleisten erscheinen unter der Top-Bar wie
  bisher

### AK9 (Runde 3): Vollbild des Admins
- **When** der Spielleiter in der Top-Bar auf „Vollbild“ klickt
- **Then** ist das Admin-Fenster im Vollbild und der Button hervorgehoben; ein weiterer Klick (oder Escape) beendet es

### ~~AK10 (Runde 3): Vollbild einer aus dem Admin geöffneten Wall~~ (entfällt, Runde 5)
- **Given** die Wall wurde über „In neuem Fenster öffnen“ geöffnet
- **When** der Spielleiter bei Wall auf „Vollbild“ klickt
- **Then** ist das Wall-Fenster ohne weiteren Klick im Vollbild, der Button hervorgehoben; erneuter Klick beendet es

### ~~AK11 (Runde 3): Abgelehntes Vollbild~~ (entfällt, Runde 5)
- **Given** ein Ground läuft in einem anderen Fenster/Browser
- **When** der Spielleiter bei Ground auf „Vollbild“ klickt
- **Then** zeigt „Screens“ „Vollbild vom Browser abgelehnt – einmal in das Ground-Fenster klicken“
- **When** jemand in das Ground-Fenster klickt
- **Then** ist es im Vollbild, der Hinweis verschwindet, der Button ist hervorgehoben

## Teststrategie / Verifikation

**Automatisch**
- Backend: WS-Tests für `screens` (E9); `ruff`, `mypy`, `pytest` grün.
- Frontend Unit: Parsen von `screens`, Statustext aus der Anzahl.
- Frontend BDD: Musik/Sounds am neuen Ort, Ein-/Ausklappen, Szene im Panel, QR-Dialog, Screen-Status.
- Lint, Typecheck, Build, Qualitäts-Checks (DND-31) grün.

**Manuell**
1. Admin öffnen: Raster wie AK1, beide Themes ansehen; Fensterbreite 1920 und kleiner prüfen (Notizen lesbar).
2. Dashboard ein- und ausklappen (AK2).
3. Szene wechseln, Vorschau prüfen; ohne aktive Szene (AK3).
4. Wall als Audioausgabe, Musik und Sounds aus dem Dashboard (AK4).
5. Wall und Ground über „Screens“ öffnen und schließen, Status beobachten; Smartphone verbinden (AK5, AK6).
6. QR-Dialog über „Screens“ (AK7).

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-10-24
**Empfehlung:** Nacharbeiten

Funktional ist alles erfüllt; AK5 und AK6 im Browser nachgeprüft. Blockierend ist nur das neue E2E-Szenario
„I see which screens are connected“: Es ist im Dev-Stack rot, sobald weitere Wall- oder Ground-Fenster verbunden sind
(üblicher Zustand; beim Review 2 Walls, 1 Ground). Im isolierten Stack grün. Entspricht dem Befund aus DND-29, Runde 1.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `AdminScreen.tsx:86-90` Spalten `2fr/1fr`; `:347-383` Szene 4×2, Musik 4×1, Sounds 2×2, Screens 2×2; `Dashboard.tsx` 4 Spalten, 144px, scrollt für sich; `TopBar.tsx` ohne Sounds/Handy; keine Bottom-Bar. Gemessen 1600px: 408/816px, 1920px: 515/1029px. E2E-Szenario 1 grün (isoliert) |
| AK2 | erfüllt | `AdminScreen.tsx:119` Zustand nur in React; `:424` `DocumentReader` bleibt gemountet; `TopBar.tsx:101-102` `aria-expanded`/`aria-controls`. E2E-Szenario 2 grün |
| AK3 | erfüllt („Keine Szene aktiv“ nur im Code) | `ActiveScenePanel.tsx:87-101`; `DetailsSideBar.tsx` gelöscht; neuer Schritt in `selectScene` grün; `ActiveScenePanel.tsx:88` ohne automatisierten Test |
| AK4 | erfüllt | `MusicControl.tsx` Logik unverändert verschoben; `runSave` wie bisher; Sounds über `handleSound` (`AdminScreen.tsx:293`). E2E-Szenario 3 grün |
| AK5 | erfüllt | Selenium-Check im isolierten Stack: „verbunden \| Audioausgabe \| verbunden \| 2 Spieler verbunden“; Ground getrennt → „nicht verbunden“ < 0,8s ohne Reload; zwei Walls „2 verbunden“. `test_ws.py:466-545` grün |
| AK6 | erfüllt | `ScreensPanel.tsx:99-108`; 2. Klick öffnet kein weiteres Fenster, auch nach Reload des Admins |
| AK7 | erfüllt | E2E-Szenario 5 grün: Dialog, Escape, Fokus zurück auf `join-button` |
| AK8 | erfüllt | E2E `adminNavigation`, `selectScene` grün; Hinweisleiste bleibt; Dark/Tavern unauffällig; Wall/Ground/Player ohne Diff |

**Blockierende Befunde**
- [x] `npm run test:e2e` im Dev-Stack rot, sobald weitere Wall-/Ground-Fenster verbunden sind
  (`frontend/__tests__/bdd/steps/adminDashboard.ts:255`)
  - Reproduziert (2 Walls, 1 Ground): `1 failed, 9 passed`, „Exceeded timeout of 10000 ms“
  - `waitForText` wartet auf exakt „verbunden“; bei „n verbunden“ je 5s `WAIT_TIMEOUT`, zusammen über 10s `testTimeout`;
    Ground kann bei fremdem Ground nie „nicht verbunden“ zeigen
  - Kommentar `:272` (fremde Screens toleriert) stimmt nicht
  - Driver `wall`/`ground` werden im Fehlerfall nicht beendet (kein `afterEach`); verwaiste chromedriver-Prozesse
  - `:274` `toMatch(/verbunden$/)` ist auch bei „nicht verbunden“ grün – Wall-Prüfung belegt nichts
  - Vorschlag: Status relativ zum Vorher-Zustand prüfen (Zahl vor dem Schließen lesen, Abnahme erwarten);
    zusätzliche Driver in `afterEach`/`finally` beenden

**Hinweise**
- Abweichungen des Implementers geprüft:
  - `openWindow.svg`: unkritisch (`fill="currentColor"`)
  - `window.open('', 'dnd-portal-<screen>', 'popup')`, Laden nur bei `about:blank`: erfüllt AK6, Wall behält
    Audioausgabe; Nebenwirkung: Popup ohne Adressleiste/Tabs, von Hand geöffnete Wall wird nicht wiederverwendet
  - Sound-Gruppen ohne Trennlinien: dokumentiert, nicht blockierend
  - Flächen `background` statt `secondary`: zwingend; in `contrast.md` als „bewusst ✗“; fehlt in Ausnahmeliste
    `DESIGN.md` §2.6 (Kleinigkeit)
  - `size.bar.lg` entfernt: im Scope, `DESIGN.md` angepasst
  - `receive_json` überspringt `screens`: bestehende Assertions nicht aufgeweicht
  - `release_connection` unter `asyncio.shield`: konsequent; Lock-Reihenfolge `state_lock` → `screens_lock`
  - 1600px: Umbruch und Scrollen nach E1 erlaubt; auch 1920×1080 scrollt (784 > 722); „QR-Code“ erst nach Scrollen;
    Hinweis gekürzt „Keine Audioausgabe b…“ – Entscheidung beim User
- pytest/Dev-DB: betrifft diesen Task nicht; neue Tests mit Rollback-Fixture; frische DB 174 grün
- `backend/CLAUDE.md` nennt die `screens`-Tests in `test_ws.py` nicht (vom Plan nicht verlangt); übrige Doku stimmt
- Plan ohne eigenen Commit `docs(DND-33): approve plan` im Runden-Commit, wie bei DND-29
- Commit `4b3f3e1`: Schema passt, keine KI-Signatur, alle Subtasks abgehakt
- Nebeneffekt: E2E im Dev-Stack hat aktive Szene von Abenteuer 1 von 5 auf 3 gesetzt (Track geändert)

**Checks**
- Backend: `ruff`, `ruff format --check`, `mypy`, `make check-quality` (pylint 10.00) grün; `pytest` frische
  Postgres-17-DB 174 passed; `test_ws.py` 5× je 50 passed; `openapi.json` aktuell
- Frontend: lint, typecheck, `test:unit` 171, `check:deadcode`, `check:dupes` (5 Altklone), build grün
- E2E: Dev-Stack 9/10 (Screens-Szenario rot); isolierter Stack 10/10 in 2 Läufen

### Runde 2 – 2026-10-24
**Empfehlung:** Abnahme

Blockierender Befund aus Runde 1 behoben: Das Szenario „I see which screens are connected“ ist im Dev-Stack grün,
auch mit bereits verbundenen 2 Walls und 1 Ground. Vergleich gegen den Vorher-Stand, exakte Prüfung von Wall und
Ground, Driver-Aufräumen in `afterEach`, eigenes Timeout 30 s. Gegenprobe mit absichtlich falschen Erwartungen rot
(klare Meldung, ~6,9 s), danach keine verwaisten chromedriver-Prozesse. Kein Produktivcode geändert
(`git diff 4b3f3e1 b8243b4 -- frontend/src backend/app` leer); Belege aus Runde 1 für AK1–AK8 gelten weiter.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Code unverändert; E2E-Szenario 1 im Dev-Stack grün |
| AK2 | erfüllt | Code unverändert; E2E-Szenario 2 grün |
| AK3 | erfüllt („Keine Szene aktiv“ nur im Code) | Code unverändert; `selectScene` grün |
| AK4 | erfüllt | Code unverändert; E2E-Szenario 3 grün |
| AK5 | erfüllt | `adminDashboard.feature:29-35`, `adminDashboard.ts:290-340`: Wall/Ground nach Öffnen je +1, Ground nach Schließen auf Vorher-Wert, ohne Reload; `parseScreenCount` (`:49-58`) nur die drei Formen aus `screenStatusText`; Gegenproben rot; „Audioausgabe“/„2 Spieler verbunden“ manuell (Runde 1); `test_ws.py` 50 passed |
| AK6 | erfüllt | Code unverändert (Beleg Runde 1) |
| AK7 | erfüllt | E2E-Szenario 5 grün |
| AK8 | erfüllt | E2E `adminNavigation`, `selectScene` grün; Wall/Ground/Player ohne Diff |

**Blockierende Befunde**
- keine

**Hinweise**
- Befund Runde 1: fremde Screens per `waitForScreenCounts` (`:71-91`) gelöst, Kommentar `:290-292` stimmt;
  Wall-Prüfung auf `before.wall + 1` (`:323`, `:337`); `screenDrivers` per `Promise.allSettled` in `afterEach`
  (`:128-132`), Ground nicht doppelt beendet (`:328-333`); `SCREENS_SCENARIO_TIMEOUT` (`:36`, `:340`) begründet
- Kleinigkeit: `parseScreenCount` liest auch ein falsches „1 verbunden“ als 1 (Text durch Unit-Tests abgedeckt)
- Verbindet/trennt ein fremder Screen während des Szenarios, kann es rot werden; selten, nicht blockierend
- `frontend/DESIGN.md` §2.6 (`:271-273`) passt zu `contrast.md:57`, `:76-79`; `backend/CLAUDE.md:60-61` passt zu `test_ws.py`
- Commit `b8243b4`: Schema passt, keine KI-Signatur, nur im Scope, alle Subtasks abgehakt
- Dev-Zustand: aktive Szene von Abenteuer 1 durch E2E auf 6, per `PATCH` zurück auf 3; Theme `dark`; Musik pausiert,
  Lautstärke 8; Track jetzt id 42 statt 40 (zufällige Wahl beim Szenenwechsel); Verbindungen wie vorher

**Checks**
- Frontend: lint, typecheck, `test:unit` 171, `check:deadcode`, `check:dupes` (5 Altklone) grün; build nicht erneut
- E2E Dev-Stack (2 Walls, 1 Ground verbunden): 10/10; `adminDashboard` einzeln 5/5; Gegenproben je 1× rot
- Backend (Code unverändert): `ruff check`, `ruff format --check`, `mypy app` grün; `pytest tests/test_ws.py` 50 passed

### Runde 3 – Rückmeldung User – 2026-10-24
**Empfehlung:** Nacharbeiten (Änderungswünsche nach manueller Prüfung)

**Blockierende Befunde**
- [x] Panel „Musik“ halb so breit (2 statt 4 Spalten); Lautstärke als senkrechter Regler. Raster so neu anordnen,
  dass keine Lücken entstehen
- [x] Panel „Screens“: Button „QR-Code“ durch ein QR-Code-Icon-Button ersetzen, rechts hinter der Spieler-Zeile –
  gleiche Anordnung wie die Öffnen-Buttons bei Wall und Ground
- [x] Vollbild-Buttons:
  - Admin: eigener Button (Vollbild an/aus) für das Admin-Fenster
  - Wall und Ground: Buttons im Panel „Screens“, die den jeweiligen Screen per WebSocket fernsteuern (an/aus).
    Browser erlauben Vollbild nur nach Nutzeraktion im Zielfenster; wenn der Browser es ablehnt, einen
    verständlichen Hinweis im Admin anzeigen (vom User so entschieden)
- [x] Auf kleinem Bildschirm zeigen die Panels „Sounds“ und „Screens“ eigene Scrollbars und abgeschnittenen Text
  („verbunde…“); Panels ohne innere Scrollbars, Text nicht abschneiden

### Runde 4 – 2026-10-24
**Empfehlung:** Nacharbeiten

Wünsche aus Runde 3 fachlich umgesetzt: Raster, senkrechter Regler, QR-Icon und Vollbild (Admin, Delegation,
Ablehnung mit Hinweis und Klick) laufen im Browser; Protokoll sauber abgesichert. Zwei Punkte blockieren: die
Vollbild-E2E-Szenarien von Wall/Ground sind ohne aktive Szene rot; „Aktive Szene“ kürzt Name und Beschreibung, AK1
verlangt keinen abgeschnittenen Text (Ausnahme nur in `components.md`, nicht im Plan).

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | nicht erfüllt (nur „Aktive Szene“, nur bei längeren Texten) | Anordnung stimmt (Dashboard 400px bei 1280×800; Szene 385px, Musik/Sounds je 185px, Screens 385px; `AdminScreen.tsx:91-93`, `:357-383`; `Dashboard.tsx:15`); keine inneren Scrollbars/kein abgeschnittener Text in Musik, Sounds, Screens bei 1280×800, 1600, 1920, auch mit Hinweis; E2E „no panel scrolls on its own“ grün. Aber `ActiveScenePanel.tsx:40-56`: Name `nowrap`/`ellipsis`, Beschreibung `line-clamp: 2`; mit längerem Text bei 1280 abgeschnitten (Seed-Daten nicht betroffen) |
| AK2 | erfüllt | E2E-Szenario 2 grün |
| AK3 | erfüllt („Keine Szene aktiv“ nur im Code) | `selectScene` grün |
| AK4 | erfüllt | `MusicControl.tsx:147-152` `orientation="vertical"`, `aria-orientation="vertical"`, Höhe 212px; `onChangeCommitted` unverändert; E2E-Szenario 3 grün |
| AK5 | erfüllt | E2E-Szenario 4 grün mit fremder Wall; `test_ws.py` grün |
| AK6 | erfüllt | `ScreensPanel.tsx:121-133` Logik unverändert, nur `openedWindows.set` neu |
| AK7 | erfüllt | Icon-Button neben „n Spieler verbunden“, rechte Kante wie Öffnen-Buttons (`ScreensPanel.tsx:371-384`); E2E-Szenario 5 grün |
| AK8 | erfüllt | `adminNavigation`, `selectScene` grün; Wall/Ground/Player-Screen ohne Diff; `useGameTable.ts:823-830` Vollbild nur Wall/Ground |
| AK9 | erfüllt (Escape nur im Code) | `TopBar.tsx:102-118`, `useDocumentFullscreen.ts` (`fullscreenchange`); E2E grün |
| AK10 | erfüllt | `ScreensPanel.tsx:165-171`, `remoteFullscreen.ts:759-770`; E2E grün mit aktiver Szene |
| AK11 | erfüllt | E2E grün mit aktiver Szene; Selenium: Hinweistext exakt, Klick ins Ground-Fenster → Vollbild, Hinweis weg, `aria-pressed=true`; „Aus“ beendet |

**Blockierende Befunde**
- [x] (entfallen mit Runde 5) Vollbild-E2E-Szenarien hängen von einer aktiven Szene ab: `adminDashboard.ts:457` wartet auf `wallImg`, `:505`
  auf `groundImg` (nur mit aktiver Szene, `WallScreen.tsx:168-174`, `GroundScreen.tsx:119-125`). Ohne aktive Szene
  2 failed, 11 passed; Seed setzt keine aktive Szene. Vorschlag: auf szenenunabhängiges warten (z. B. Zählung +1 per
  `waitForScreenCounts`)
- [x] AK1: „Aktive Szene“ schneidet Text ab (`ActiveScenePanel.tsx:40-56`); Ausnahme nur in `components.md`, nicht in
  E11/AK1; Kommentar `:9` („fixed height of the panel“) veraltet. Entweder umbrechen lassen oder Ausnahme vom User in
  E11/AK1 aufnehmen

**Hinweise**
- Implementer-Entscheidungen: Mindestbreite 400px (E11; Notizen bei 1280×800 504px), `minmax(144px, auto)`, „Screens“
  4×2 mit Leerraum, Vollbild-Buttons ohne verbundenen Screen ohne Rückmeldung, Delegation nur Chrome/selbst geöffnete
  Fenster – vertretbar bzw. im Plan begründet
- Wartender Wechsel lässt sich nur verwerfen, wenn mind. ein Screen des Typs im Vollbild ist, sonst sendet der Button
  erneut `active: true` (`ScreensPanel.tsx:299-341`); bei Vollbild wird der Hinweis ausgeblendet (`:311`) – eine fremde
  Wall, die abgelehnt hat, wechselt dann unsichtbar beim nächsten Klick (z. B. auf „AUDIO“). Kein AK verletzt
- E2E und fremde Fenster: normal keine bleibende Änderung; schlägt das Szenario nach dem ersten Klick fehl, bleibt ein
  wartender Wechsel; ist eine fremde Wall/Ground per Fullscreen API im Vollbild, sendet der erste Klick „Aus“ – fremdes
  Fenster verlässt dauerhaft das Vollbild, Szenario rot (belegt). F11 zählt nicht. Dokumentieren oder vorab auf
  `fullscreen` = 0 prüfen
- Protokoll: Admin → nur `fullscreen` mit `screen` ∈ {wall, ground}, `active: bool`; Wall/Ground →
  `fullscreen_state`/`fullscreen_rejected`; Rest ignoriert (`ws.py:36-70`, Tests). Rolle aus `?screen=` ohne
  Anmeldung wie im Rest der App; `message`-Listener prüft `event.origin`; Reconnect sendet Zustand erneut
- Dashboard scrollt als Ganzes (944/696px bei 1280×800); nach E1 erlaubt
- Teststrategie/Manuell im Plan nennt AK9–AK11 nicht (Kleinigkeit); Theme `dark` nicht angesehen
- Commit `4001bdd`: Schema passt, keine KI-Signatur, im Scope, Subtasks abgehakt
- Dev-Zustand: vorher keine aktive Szene, `tavern`, pausiert, Lautstärke 33, Track 40, 1 Wall; E2E aktivierte Szene 5,
  per `PATCH` auf `null` zurück; Track jetzt 34; Vollbild 0; keine Prozesse übrig

**Checks**
- Backend: `ruff check`, `ruff format --check`, `mypy app`, `make check-quality` grün; `pytest` frische DB 197 passed
  (Dev-DB 6 failed wegen Theme `tavern`, nicht durch den Task)
- Frontend: lint, typecheck, `test:unit` 196, `check:deadcode`, `check:dupes` (5 Altklone), build grün
- E2E Dev-Stack: ohne aktive Szene 11/13; mit aktiver Szene `adminDashboard` 8/8, `adminNavigation`, `selectScene` grün;
  Gegenprobe fremde Wall im Vollbild: Szenario rot, Fenster verlässt Vollbild

### Runde 5 – Rückmeldung User – 2026-10-24
**Empfehlung:** Nacharbeiten (Entscheidung des Users)

**Blockierende Befunde**
- [x] Fernsteuerung des Vollbilds von Wall und Ground aus dem Admin wieder vollständig entfernen (Buttons im Panel
  „Screens“, Hinweis bei Ablehnung, Delegation, WebSocket-Nachrichten `fullscreen`/`fullscreen_state`/
  `fullscreen_rejected`, `screens.fullscreen`, `remoteFullscreen.ts`, zugehörige Tests, Doku und Plan-Teile wie
  E14/AK10/AK11). Damit entfällt auch der Befund zu den Vollbild-E2E-Szenarien aus Runde 4
- [x] Vollbild-Button für das Admin-Fenster in der Top-Bar bleibt (AK9)
- [x] Befund AK1 aus Runde 4: Name und Beschreibung in „Aktive Szene“ umbrechen statt kürzen (Grundsatz „kein
  abgeschnittener Text“); veralteten Kommentar `ActiveScenePanel.tsx:9` korrigieren

### Runde 6 – 2026-10-24
**Empfehlung:** Abnahme

Runde 5 vollständig umgesetzt. Fernsteuerung des Vollbilds von Wall/Ground ohne Reste entfernt: Backend,
Realtime-Schicht, Context und Unit-Tests identisch mit Runde 2 (`git diff b8243b4 0e81e89 -- backend
frontend/src/realtime frontend/src/context frontend/src/utils/screenStatus.ts frontend/__tests__/unit` leer); im Panel
„Screens“ gegenüber Runde 2 nur der QR-Icon-Button (E13). Admin-Vollbild bleibt. „Aktive Szene“ bricht um und wächst
mit. Nicht beauftragter Fix in `Dashboard.tsx` per Gegenprobe als nötig bestätigt, deckt sich mit AK1.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | 1280×800: Dashboard 400px (Notizen 504px), Szene 385px, Musik/Sounds je 185px, Screens 385px; 1600: 408/816px; 1920: 515/1029px. Seed-Daten ohne Überlauf. `ActiveScenePanel.tsx:38-50` `overflow-wrap: break-word`, `hyphens: auto`, `lang="de"` (`:87`), kein `title`. Langer Text per DOM bei 1280: Panel wächst 304 → 591px, kein Überlauf, Dashboard scrollt als Ganzes; ebenso 1600/1920. Top-Bar ohne Sounds/Handy, keine Bottom-Bar; E2E-Szenario 1 grün |
| AK2 | erfüllt | E2E-Szenario 2 grün |
| AK3 | erfüllt | `selectScene` grün; „Keine Szene aktiv“ im Browser geprüft |
| AK4 | erfüllt | `MusicControl.tsx` seit Runde 3 unverändert; `aria-orientation="vertical"`; E2E-Szenario 3 grün |
| AK5 | erfüllt | Backend gleich Runde 2; `test_ws.py` 3× je 50 passed; E2E-Szenario 4 grün mit fremden Screens |
| AK6 | erfüllt | `openScreenWindow` gleich Runde 2; je 2 Klicks Wall/Ground → genau 3 Fenster; Status „2 verbunden“ und zurück |
| AK7 | erfüllt | QR-Icon rechts neben „n Spieler verbunden“, rechte Kante wie Öffnen-Buttons; E2E-Szenario 5 grün |
| AK8 | erfüllt | `adminNavigation`, `selectScene` grün; Wall/Ground/Player ohne Diff |
| AK9 | erfüllt (Escape nur im Code) | `TopBar.tsx:101-118`, `useDocumentFullscreen.ts`; E2E grün |
| AK10, AK11 | entfallen (Runde 5) | im Plan gekennzeichnet; Szenarien entfernt |

**Blockierende Befunde**
- keine

**Hinweise**
- Keine Reste der Fernsteuerung (`git grep`); Doku stimmt mit dem Code überein; Unit-Tests wieder 171
- Fix `Dashboard.tsx:20-23` (`align-self: start`, `max-height: 100%`): Gegenprobe ohne Fix → „Aktive Szene“ läuft über;
  im Scope, keine Nebenwirkung. Steht in E15 unter „Entscheidung des Users“, ist aber technische Ergänzung des Implementers
- Verschärfte E2E-Prüfung „no panel scrolls on its own“ (`adminDashboard.ts:197-208`) erkennt Überlauf, läuft aber nur
  mit Seed-Daten – Rückfall bei langen Texten fällt automatisch nicht auf; nicht verlangt
- Slider-Hülle in „Musik“ (`MusicControl.tsx:147-152`, `overflow: hidden`): bewusst abgeschnittener Touch-Bereich, kein Text
- E14 nur teilweise einzeln durchgestrichen, über E15 eindeutig (Kleinigkeit); Dark-Theme nicht angesehen (nur Elemente entfernt)
- Commit `0e81e89`: Schema passt, keine KI-Signatur, nur Task-Dateien, Subtasks Schritt 4 abgehakt
- Dev-Zustand: vor dem Review Szene 5, Lautstärke 11; jetzt keine aktive Szene, `tavern`, pausiert, Lautstärke 10,
  Track 34 statt 62; Verbindungen 1/1/0; keine Prozesse übrig

**Checks**
- Backend: `ruff check`, `ruff format --check`, `mypy app`, `make check-quality` grün; `pytest` frische DB 174 passed;
  `test_ws.py` 3× je 50 passed
- Frontend: lint, typecheck, `test:unit` 171, `check:deadcode`, `check:dupes` (5 Altklone), build grün
- E2E Dev-Stack: mit aktiver Szene 11/11; `adminDashboard` ohne aktive Szene 6/6 (2×)
- Browser: Raster/Überlauf bei 1280×800, 1600×900, 1920×1080 mit Seed- und langem Text; Gegenprobe ohne Fix; AK6; „Keine Szene aktiv“
