# DND-33: Admin-Dashboard mit Panel-Raster (Szene, Musik, Sounds, Screens)

**Typ:** feat
**Status:** Im Review

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

## Akzeptanzkriterien

### AK1: Dashboard-Raster
- **Given** der Admin Screen ist geöffnet
- **Then** zeigt der rechte Bereich (etwa ein Drittel der Breite) die Panels „Aktive Szene“ über die volle Breite,
  darunter „Musik“ über die volle Breite, darunter „Sounds“ und „Screens“ nebeneinander
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
- **When** der Spielleiter auf „QR-Code“ klickt
- **Then** öffnet sich der bisherige Dialog mit QR-Code und Player-URL; Schließen per Button, Escape oder Klick
  außerhalb wie bisher

### AK8: Rest unverändert
- **Given** Admin, Wall und Ground sind geöffnet
- **When** der Spielleiter Notizen liest, die Navigationsleiste nutzt, Szene, Abenteuer oder Theme wechselt
- **Then** verhält sich alles wie vor dem Task, in beiden Themes; Hinweisleisten erscheinen unter der Top-Bar wie
  bisher

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
