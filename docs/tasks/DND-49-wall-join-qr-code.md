# DND-49: QR-Code für die Spieler auf dem Wall Screen

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Den QR-Code der Player-URL zeigt bisher nur ein Dialog im Admin (`JoinDialog`, Icon-Button „QR-Code“ im Panel
„Spieltisch“, Zeile „Spieler“). Die Spieler müssen dafür auf den Monitor des Spielleiters schauen. Künftig zeigt die Wall
den QR-Code als eigenes Overlay im selben Panel wie die Weltkarte, gut sichtbar für alle am Tisch. Der Spielleiter
schaltet es im Admin wie die Weltkarte. Am Spieltisch merkt man es daran, dass der Spielleiter „QR-Code“ wählt und alle
Spieler den Code von der Wall scannen.

## Scope / Non-Goals

**Im Scope**
- Neuer Wert `join` für das Wall-Overlay (Backend-Literal `WallOverlay`, API-Typen, Frontend-Validierung der Pushes).
- Admin: Segment-Control der Zeile „Wall“ mit „Weltkarte“ / „QR-Code“ / „Aus“.
- Wall: Overlay-Panel „Spieler verbinden“ mit QR-Code und URL bzw. Hinweis, wenn die URL unbekannt ist.
- Admin: QR-Code-Dialog, Icon-Button „QR-Code“ und Text „Spieler QR-Code“ entfallen.
- Doku (Ist-Stand) und Design-Doku nachziehen.

**Nicht im Scope**
- Weltkarte und QR-Code gleichzeitig anzeigen.
- QR-Code auf Ground oder Player Screen.
- Änderungen an `GET /table/join` oder daran, wie das Start-Skript die Player-URL ermittelt.
- Automatisches Ausblenden des QR-Codes, z. B. wenn alle Spieler verbunden sind.

## Entscheidungen

### E1: QR-Code als eigenes Wall-Overlay
- **Entscheidung:** `WallOverlay` wird `Literal["world", "join", "off"]`. Das Segment-Control der Admin-Zeile „Wall“ zeigt
  „Weltkarte“ / „QR-Code“ / „Aus“ in dieser Reihenfolge. Bei `join` zeigt die Wall dasselbe Overlay-Panel (Ebene,
  Abdunklung, durchscheinende Kachel, oben mittig) mit dem Titel „Spieler verbinden“ statt der Karte. Für den QR-Code
  gelten dieselben Regeln wie für die Weltkarte: Er steht im Speicher der API (nach Neustart `off`), alle Walls
  folgen dem Push, und ein Szenen- oder Abenteuerwechsel schließt ihn.
- **Verworfene Alternativen:** Den QR-Code zusätzlich im Weltkarten-Panel zeigen, ohne eigenen Schalter.
- **Begründung:** Im Dialog gewählt. Der Spielleiter blendet den QR-Code gezielt ein, die Weltkarte bleibt unverdeckt.

### E2: QR-Code im Admin entfällt ganz
- **Entscheidung:** `JoinDialog` und der Icon-Button „QR-Code“ samt Text „Spieler QR-Code“ werden entfernt. Die Zeile
  „Spieler“ im Panel „Spieltisch“ zeigt nur noch „Spieler“ und „N Spieler verbunden“. Das Icon `qrCode.svg` wird
  gelöscht, sofern es sonst nirgends genutzt wird.
- **Verworfene Alternativen:** Button behalten und damit das QR-Overlay der Wall schalten (doppelte Bedienung neben
  dem Segment-Control).
- **Begründung:** Im Dialog gewählt.

### E3: Player-URL und Hinweis auf der Wall
- **Entscheidung:** Die Wall lädt `GET /table/join`, sobald das Overlay auf `join` wechselt (auch beim Öffnen einer Wall
  mit aktivem `join`). Die URL wählt sie wie bisher der Dialog mit `selectPlayerUrl`, jetzt mit dem Origin der Wall.
  Während des Ladens zeigt das Panel nur den Titel. Ist die URL unbekannt oder schlägt das Laden fehl, zeigt das Panel
  statt QR-Code und URL den Hinweis „Player-URL unbekannt – Spieltisch mit „dnd prod“ starten oder die Wall über die
  IP des Rechners öffnen“. Gegenüber dem Admin-Text heißt es hier „die Wall“, weil jetzt deren Origin zählt.
  Ladefehler gehen zusätzlich in die Konsole (`console.error`).
- **Verworfene Alternativen:** Bei unbekannter URL nichts anzeigen.
- **Begründung:** Im Dialog gewählt. Der Spielleiter sieht auf der Wall sofort, warum kein Code erscheint.

### E4: Darstellung auf der Wall
- **Entscheidung:** Das Panel ist schmaler als bei der Weltkarte, gerade so breit wie der QR-Code plus Innenabstand.
  Es zeigt in einer zentrierten Spalte den Titel „Spieler verbinden“ (wie „Weltkarte“), den QR-Code und darunter die
  URL in `text.lg`. Der QR-Code nutzt wie bisher `qr.foreground` auf `qr.background` (unabhängig vom Theme) mit 4 Modulen
  Ruhezone. Seine Kantenlänge ist so groß wie möglich, höchstens 480px, und passt mit Titel und URL vollständig in
  die Höhe des Fensters (unten derselbe Abstand wie oben, wie bei der Weltkarte). Die Größe steht als Konstante bzw.
  `min(...)`-Ausdruck im Code und in `frontend/docs/design/screen-layouts.md`.
- **Begründung:** Die Spieler scannen aus einigen Metern Abstand. Ein großer Code im Kontrast unabhängig vom Theme ist
  zuverlässig lesbar.

## Subtasks

### Vertrag
- [x] `WallOverlay = Literal["world", "join", "off"]` in `backend/app/schemas/game_table.py`, Docstring von
      `GameTableState` ergänzen (`join`: QR-Code der Player-URL).

### Backend
- [x] Tests in `backend/tests/test_table.py`: `PATCH /table` mit `wall_overlay: "join"` setzt und liefert den Wert,
      ein Szenen- bzw. Abenteuerwechsel setzt `join` auf `off`.
- [x] Test in `backend/tests/test_ws.py`: `join` wird an alle Walls gepusht.

### Frontend
- [x] API-Typen (`src/api/schema.d.ts`) neu generieren wie in `frontend/CLAUDE.md` beschrieben, `WALL_OVERLAYS` in
      `src/realtime/messages.ts` um `join` ergänzen.
- [x] `GameTablePanel`: Option `{ value: 'join', label: 'QR-Code' }` zwischen „Weltkarte“ und „Aus“. `JoinDialog`,
      Icon-Button, Text „Spieler QR-Code“, Ref/Callbacks und den Import des Icons entfernen. `JoinDialog.tsx` und
      (falls ungenutzt) `public/assets/icons/qrCode.svg` löschen.
- [x] Wall: Panel „Spieler verbinden“ als eigene Komponente (z. B. `src/components/WallJoinPanel.tsx`), die
      `OverlayPanel`/`PanelHeader`/`PanelTitle` mit der Weltkarte teilt (Styles bei Bedarf in ein gemeinsames Modul
      ziehen). Laden der URL nach E3 (mit `loadLatest`), Darstellung nach E4. `data-test-id`s: `wall-join-layer`,
      `wall-join-qr-code`, `wall-join-url`, `wall-join-hint`.
- [x] `WallScreen`: zweite Ebene für `wallOverlay === 'join'` analog zu `WorldMapLayer`. Das Vollbild-Overlay liegt
      weiter über allem.
- [x] BDD: `wallOverlay.feature` um die Szenarien unten erweitern; Szenarien zum Dialog „Spieler verbinden“ in
      `adminDashboard.feature` entfernen bzw. an die Wall verlegen.

### Doku
- [x] `docs/screens.md`: Admin (Spieltisch-Zeilen „Wall“ und „Spieler“, Abschnitt „Spieler verbinden“ entfällt bzw.
      verweist auf die Wall), Wall (Overlay „QR-Code“), Player (`/` ist Ziel des QR-Codes auf der Wall).
- [x] `docs/architecture.md`: `/table/join` (Nutzer jetzt die Wall), Abschnitte zum QR-Code-Dialog und zum Verbinden
      der Smartphones.
- [x] `frontend/DESIGN.md`, `frontend/docs/design/components.md` (Spieltisch-Zeile, Abschnitt „Dialog „Spieler
      verbinden““ wird Wall-Panel), `screen-layouts.md` (Maße aus E4), `contrast.md` (QR-Code jetzt auf der Wall).
- [x] `docs/known-issues.md` prüfen und ggf. anpassen.

## Akzeptanzkriterien

### AK1: QR-Code auf der Wall einblenden
- **Given** Admin und Wall sind geöffnet, die Player-URL ist bekannt, das Wall-Overlay ist „Aus“
- **When** der Spielleiter in der Zeile „Wall“ des Panels „Spieltisch“ „QR-Code“ wählt
- **Then** zeigt jede Wall das Panel „Spieler verbinden“ mit dem QR-Code der Player-URL und der URL als Text, der
  Screen darunter ist abgedunkelt, und im Admin ist „QR-Code“ markiert

### AK2: Wechsel zwischen Weltkarte, QR-Code und Aus
- **Given** die Wall zeigt den QR-Code
- **When** der Spielleiter „Weltkarte“ bzw. „Aus“ wählt
- **Then** zeigt die Wall die Weltkarte ohne QR-Code bzw. kein Overlay

### AK3: Player-URL unbekannt
- **Given** die API liefert keine Player-URL und die Wall läuft unter `localhost` (oder das Laden schlägt fehl)
- **When** der Spielleiter „QR-Code“ wählt
- **Then** zeigt das Panel „Spieler verbinden“ den Hinweis „Player-URL unbekannt – Spieltisch mit „dnd prod“ starten
  oder die Wall über die IP des Rechners öffnen“ und keinen QR-Code

### AK4: Später geöffnete Wall
- **Given** das Wall-Overlay ist „QR-Code“
- **When** eine weitere Wall geöffnet wird
- **Then** zeigt sie sofort das Panel „Spieler verbinden“ mit dem QR-Code

### AK5: Szenen- oder Abenteuerwechsel schließt den QR-Code
- **Given** das Wall-Overlay ist „QR-Code“
- **When** der Spielleiter die Szene oder das Abenteuer wechselt
- **Then** blenden alle Walls den QR-Code aus, und im Admin ist „Aus“ markiert

### AK6: Kein QR-Code mehr im Admin
- **Given** der Admin ist geöffnet
- **When** der Spielleiter das Panel „Spieltisch“ ansieht
- **Then** zeigt die Zeile „Spieler“ nur „Spieler“ und „N Spieler verbunden“, ohne Icon-Button „QR-Code“ und ohne
  Text „Spieler QR-Code“; einen Dialog „Spieler verbinden“ gibt es nicht mehr

### AK7: Scannbar aus Abstand
- **Given** die Wall läuft im Vollbild auf einem 1080p-Monitor und zeigt den QR-Code
- **When** ein Spieler den Code mit der Smartphone-Kamera scannt
- **Then** öffnet sich die Charakterauswahl des Player Screens; der QR-Code ist vollständig sichtbar und nicht
  abgeschnitten

## Teststrategie / Verifikation

**Automatisch**
- Backend: neue Fälle in `test_table.py` und `test_ws.py` (siehe Subtasks); bestehende Tests grün.
- Frontend (BDD): `wallOverlay.feature` deckt AK1–AK5 ab, `adminDashboard.feature` AK6. Lint, Unit-Tests, Build grün.

**Manuell**
1. `dnd prod` starten, Admin und Wall öffnen, „QR-Code“ wählen: QR-Code und URL erscheinen auf der Wall, mit dem
   Smartphone scannen, die Charakterauswahl öffnet sich (AK1, AK7).
2. Zwischen „Weltkarte“, „QR-Code“ und „Aus“ wechseln, dann Szene wechseln (AK2, AK5).
3. Dev-Setup unter `localhost` ohne `PLAYER_URL`: Hinweis erscheint (AK3).
4. Beide Themes prüfen: QR-Code bleibt dunkel auf hell.

## Offene Fragen
- keine

## Review
