# DND-49: QR-Code für die Spieler auf dem Wall Screen

**Typ:** feat
**Status:** Fertig

## Kontext & Ziel

Den QR-Code der Player-URL zeigt bisher nur ein Dialog im Admin (`JoinDialog`, Icon-Button „QR-Code“ im Panel
„Spieltisch“, Zeile „Spieler“). Die Spieler müssen dafür auf den Monitor des Spielleiters schauen. Künftig zeigt die Wall
den QR-Code als eigenes Overlay im selben Panel wie die Weltkarte, gut sichtbar für alle am Tisch. Der Spielleiter
schaltet es im Admin mit dem bisherigen Icon-Button „QR-Code“ in der Zeile „Spieler“. Am Spieltisch merkt man es daran,
dass der Spielleiter auf „QR-Code“ klickt und alle Spieler den Code von der Wall scannen.

## Scope / Non-Goals

**Im Scope**
- Neuer Wert `join` für das Wall-Overlay (Backend-Literal `WallOverlay`, API-Typen, Frontend-Validierung der Pushes).
- Admin: Icon-Button „QR-Code“ in der Zeile „Spieler“ bleibt an seiner Stelle und schaltet das QR-Overlay der Wall;
  das Segment-Control der Zeile „Wall“ bleibt „Weltkarte“ / „Aus“.
- Wall: Overlay-Panel „Spieler verbinden“ mit QR-Code und URL bzw. Hinweis, wenn die URL unbekannt ist.
- Admin: QR-Code-Dialog entfällt.
- Doku (Ist-Stand, inkl. `CLAUDE.md`, Config-Kommentare) und Design-Doku nachziehen.

**Nicht im Scope**
- Weltkarte und QR-Code gleichzeitig anzeigen.
- QR-Code auf Ground oder Player Screen.
- Änderungen an `GET /table/join` oder daran, wie das Start-Skript die Player-URL ermittelt.
- Automatisches Ausblenden des QR-Codes, z. B. wenn alle Spieler verbunden sind.

## Entscheidungen

### E1: QR-Code als eigenes Wall-Overlay
- **Entscheidung:** `WallOverlay` wird `Literal["world", "join", "off"]`. Bedient wird `join` im Admin über den
  Icon-Button „QR-Code“ (E2), nicht über das Segment-Control der Zeile „Wall“. Bei `join` zeigt die Wall dasselbe Overlay-Panel (Ebene,
  Abdunklung, durchscheinende Kachel, oben mittig) mit dem Titel „Spieler verbinden“ statt der Karte. Für den QR-Code
  gelten dieselben Regeln wie für die Weltkarte: Er steht im Speicher der API (nach Neustart `off`), alle Walls
  folgen dem Push, und ein Szenen- oder Abenteuerwechsel schließt ihn.
- **Verworfene Alternativen:** Den QR-Code zusätzlich im Weltkarten-Panel zeigen, ohne eigenen Schalter.
- **Begründung:** Im Dialog gewählt. Der Spielleiter blendet den QR-Code gezielt ein, die Weltkarte bleibt unverdeckt.

### E2: Icon-Button „QR-Code“ bleibt und schaltet die Wall (geändert nach Review-Runde 1)
- **Entscheidung:** Der Icon-Button „QR-Code“ samt Text „Spieler QR-Code“ bleibt an seiner bisherigen Stelle in der
  Zeile „Spieler“ des Panels „Spieltisch“ (gleiches Icon `qrCode.svg`, gleicher Aufbau wie vor DND-49). Ein Klick setzt
  das Wall-Overlay auf `join`; ist `join` bereits aktiv, setzt er es auf `off`. Eine aktive Weltkarte wird dabei durch
  den QR-Code ersetzt. Der Button zeigt den Zustand per `aria-pressed` und markiert sich bei `join` optisch wie ein
  aktiver Toggle (bestehende Bausteine nutzen). Das Segment-Control der Zeile „Wall“ bleibt „Weltkarte“ / „Aus“;
  bei `join` ist dort keine Option markiert, „Weltkarte“ bzw. „Aus“ ersetzen den QR-Code. Nur `JoinDialog` entfällt
  (kein `aria-haspopup` mehr am Button); `aria-label` z. B. „QR-Code für Spieler auf der Wall“.
- **Verworfene Alternativen:** Option „QR-Code“ im Segment-Control der Zeile „Wall“ und Button entfernen (so in Runde 1
  umgesetzt, vom User verworfen: der Button soll an der alten Stelle bleiben); Button öffnet weiter den Dialog im Admin.
- **Begründung:** Wunsch des Users nach Review-Runde 1. Die gewohnte Stelle zum Verbinden der Spieler bleibt.

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
      (falls ungenutzt) `public/assets/icons/qrCode.svg` löschen. *(Überholt durch E2 nach Review-Runde 1, siehe „Nacharbeit“.)*
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

### Nacharbeit nach Review-Runde 1 (E2 geändert)
- [x] `GameTablePanel`: Option „QR-Code“ aus dem Segment-Control der Zeile „Wall“ entfernen; Icon-Button „QR-Code“ und
      Text „Spieler QR-Code“ in der Zeile „Spieler“ wiederherstellen (Stand `e12f339`), Klick schaltet `join`/`off`
      nach E2, Zustand per `aria-pressed`; `data-test-id="join-button"`. `public/assets/icons/qrCode.svg` wiederherstellen.
      `JoinDialog` bleibt gelöscht.
- [x] BDD: Szenarien in `wallOverlay.feature` auf den Button umstellen, Wechsel Weltkarte ↔ QR-Code (AK2) und
      „keine Option markiert“ prüfen; AK6-Szenario in `adminDashboard.feature` nach neuem AK6.
- [x] Doku auf den Button umstellen: `docs/screens.md`, `docs/architecture.md`, `docs/domain.md`, `frontend/DESIGN.md`,
      `components.md`, `screen-layouts.md`, `contrast.md`, beide `README.md`.
- [x] Veraltete Ist-Doku aus Review-Runde 1, Hinweis 1: `CLAUDE.md:54`, `frontend/CLAUDE.md` (`JoinDialog`,
      `getJoinInfo` jetzt `service/WallScreen.ts`, Datenfluss-Satz; `WallJoinPanel`, `WallOverlay` ergänzen),
      `backend/CLAUDE.md:5-6`, „QR code in the Admin“ in `backend/.env.example`, `script.sh`, `compose.dev.yaml`,
      `compose.prod.yaml`, Kommentar `frontend/src/utils/playerUrl.ts:6`.

## Akzeptanzkriterien

### AK1: QR-Code auf der Wall einblenden
- **Given** Admin und Wall sind geöffnet, die Player-URL ist bekannt, das Wall-Overlay ist „Aus“
- **When** der Spielleiter in der Zeile „Spieler“ des Panels „Spieltisch“ auf den Icon-Button „QR-Code“ klickt
- **Then** zeigt jede Wall das Panel „Spieler verbinden“ mit dem QR-Code der Player-URL und der URL als Text, der
  Screen darunter ist abgedunkelt, der Button ist gedrückt (`aria-pressed="true"`), und in der Zeile „Wall“ ist keine
  Option markiert

### AK2: Wechsel zwischen Weltkarte, QR-Code und Aus
- **Given** die Wall zeigt den QR-Code
- **When** der Spielleiter erneut auf den Button „QR-Code“ klickt bzw. „Weltkarte“ oder „Aus“ wählt
- **Then** zeigt die Wall kein Overlay bzw. die Weltkarte ohne QR-Code bzw. kein Overlay, und der Button ist nicht
  mehr gedrückt; zeigt die Wall die Weltkarte, ersetzt ein Klick auf den Button sie durch den QR-Code

### AK3: Player-URL unbekannt
- **Given** die API liefert keine Player-URL und die Wall läuft unter `localhost` (oder das Laden schlägt fehl)
- **When** der Spielleiter auf den Button „QR-Code“ klickt
- **Then** zeigt das Panel „Spieler verbinden“ den Hinweis „Player-URL unbekannt – Spieltisch mit „dnd prod“ starten
  oder die Wall über die IP des Rechners öffnen“ und keinen QR-Code

### AK4: Später geöffnete Wall
- **Given** das Wall-Overlay ist „QR-Code“
- **When** eine weitere Wall geöffnet wird
- **Then** zeigt sie sofort das Panel „Spieler verbinden“ mit dem QR-Code

### AK5: Szenen- oder Abenteuerwechsel schließt den QR-Code
- **Given** das Wall-Overlay ist „QR-Code“
- **When** der Spielleiter die Szene oder das Abenteuer wechselt
- **Then** blenden alle Walls den QR-Code aus, im Admin ist „Aus“ markiert und der Button „QR-Code“ nicht gedrückt

### AK6: Button an der alten Stelle, kein Dialog im Admin
- **Given** der Admin ist geöffnet
- **When** der Spielleiter das Panel „Spieltisch“ ansieht und auf den Button „QR-Code“ klickt
- **Then** zeigt die Zeile „Spieler“ wie vor DND-49 „Spieler“, „N Spieler verbunden“, „Spieler QR-Code“ und den
  Icon-Button „QR-Code“; die Zeile „Wall“ bietet nur „Weltkarte“ / „Aus“; im Admin öffnet sich kein Dialog

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
1. `dnd prod` starten, Admin und Wall öffnen, auf den Button „QR-Code“ klicken: QR-Code und URL erscheinen auf der Wall, mit dem
   Smartphone scannen, die Charakterauswahl öffnet sich (AK1, AK7).
2. Zwischen Button „QR-Code“, „Weltkarte“ und „Aus“ wechseln, dann Szene wechseln (AK2, AK5).
3. Dev-Setup unter `localhost` ohne `PLAYER_URL`: Hinweis erscheint (AK3).
4. Beide Themes prüfen: QR-Code bleibt dunkel auf hell.

## Offene Fragen
- keine

## Review

### Runde 1 – Review vom 2026-11-06 (Commit 2bd94ab)

**Empfehlung: Abnahme.** Kein blockierender Befund; AK1–AK6 erfüllt, AK7 in der Darstellung erfüllt (Scan nur
manuell prüfbar). Vor dem Abschluss empfohlen: veraltete Ist-Doku nachziehen (Hinweis 1), AK7 am Smartphone scannen.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 QR-Code auf allen Walls | erfüllt | `GameTablePanel.tsx:23` (Option „QR-Code“ zwischen „Weltkarte“ und „Aus“); `WallScreen.tsx:153-155`, `WallOverlay.ts:15`; `WallJoinPanel.tsx:87-106`; BDD `wallOverlay.feature:15` |
| AK2 Overlays schließen sich aus | erfüllt | `WallScreen.tsx:145/153` (Panel nur bei `join` eingehängt); BDD `wallOverlay.feature:15` |
| AK3 Hinweis ohne URL | erfüllt | `WallJoinPanel.tsx:15` (Text wörtlich nach E3, NBSP geprüft), `:73-77`, `:106`; BDD `wallOverlay.feature:27` (`Network.setBlockedURLs`); Zweig localhost per Unit `playerUrl.spec.ts` |
| AK4 Neue Wall zeigt Overlay | erfüllt | BDD `wallOverlay.feature:33`; Backend `test_ws.py:253` |
| AK5 Szenen-/Abenteuerwechsel schließt | erfüllt | Backend `test_table.py:263`, `:273`; BDD `wallOverlay.feature:38` (nur Szenenwechsel; Seed hat ein Abenteuer) |
| AK6 Kein Dialog im Admin | erfüllt | `JoinDialog.tsx`, `qrCode.svg` gelöscht, keine Referenzen; BDD `adminDashboard.feature:54` |
| AK7 Größe und Scanbarkeit | Darstellung erfüllt, Scan offen | `WallJoinPanel.tsx:11,21-31` (`min(...)`, 1920×1080 → 480 px, Gesamthöhe 748 px); BDD prüft quadratisch, ≤ 480, im Viewport |

**Blockierende Befunde**
- keine

**Hinweise (nicht blockierend)**
1. **Veraltete Ist-Doku (im Scope „Doku nachziehen“):** `CLAUDE.md:54`; `frontend/CLAUDE.md:102` (`JoinDialog`),
   `:132` (`getJoinInfo` bei Admin-Services, liegt jetzt in `service/WallScreen.ts`), `:190` (QR-Code-Dialog);
   `backend/CLAUDE.md:5-6`; außerdem „QR code in the Admin“ in `backend/.env.example:30`, `script.sh:78`,
   `compose.dev.yaml:44`, `compose.prod.yaml:34` und Kommentar `frontend/src/utils/playerUrl.ts:6`.
2. **4 rote Backend-Tests vorbestehend:** 3× `test_adventures.py`, `test_fight.py::test_scene_change_is_rejected_during_a_fight`;
   auf `e12f339` gegen dieselbe Dev-DB identisch rot. Ursache: Dev-DB weicht vom Seed ab (`global_level` 4,
   andere Hintergründe). Abhilfe: DB zurücksetzen.
3. **E2E `adminDashboard` 6/7:** „The first interaction makes an admin window the audio output“ rot wegen
   `output_ready: true` im laufenden Stack (umgebungsbedingt); „The dashboard shows its panels…“ einmal rot, danach
   zweimal grün (flaky).
4. **Zusätzliche Test-ID** `wall-join` am Panel – unproblematisch.
5. **Gemeinsames Modul** `src/components/WallOverlay.ts` vom Subtask gedeckt; Weltkarte (`WorldMapPanel`) unverändert.
6. **jscpd:** einziger Klon (`darkTheme` ↔ `tavernTheme`) vorbestehend.

**Scope und Subtasks**
- Alle Subtasks erledigt und im Diff belegt; Abweichungen (`getJoinInfo` nach `service/WallScreen.ts`, zusätzlicher
  Unit-Test, `docs/domain.md` und beide `README.md` mitgezogen) vertretbar; `GET /table/join` und Start-Skript-Logik
  unverändert.

**Checks**
- Backend: `ruff`, `mypy`, `make check-quality` grün; `openapi.json` ohne Diff; pytest 324/328 (4 vorbestehend rot).
- Frontend: lint, typecheck, Unit 346/346, `knip`, `jscpd`, build grün; `schema.d.ts` ohne Diff.
- E2E: `wallOverlay` 6/6, `adminDashboard` 6/7 (siehe Hinweis 3). Implementer: alle 13 Suites grün (52 Tests).
- Manuell offen: Test 1 (Scan, AK7), Test 3 (Hinweis unter localhost ohne `PLAYER_URL`), Test 4 (beide Themes).
- Konventionen: ein Commit `feat(DND-49): …` nach Schema, keine KI-Signatur.

### Runde 2 – Review vom 2026-11-06 (Commit 36a5015, Gesamtstand gegen e12f339)

**Empfehlung: Abnahme.** Kein blockierender Befund; AK1–AK6 erfüllt, AK7 in der Darstellung erfüllt (Scan nur
manuell prüfbar). Die Nacharbeit setzt das geänderte E2 vollständig um; die Zeile „Spieler“ entspricht im Aufbau
`e12f339` (Unterschiede nur Toggle-Zustand, aria-Attribute, Klick-Handler). Keine Ist-Doku verweist mehr auf den
QR-Code im Admin oder eine Segment-Option „QR-Code“.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 QR-Code auf der Wall einblenden | erfüllt | `GameTablePanel.tsx:178,218-230` (`aria-pressed={isJoinShown}`), `:22-25` (nur `world`/`off`); BDD `wallOverlay.feature:15` |
| AK2 Wechsel Weltkarte / QR-Code / Aus | erfüllt | `GameTablePanel.tsx:224` (`isJoinShown ? 'off' : 'join'`); BDD `wallOverlay.feature:15`, `:23` |
| AK3 Player-URL unbekannt | erfüllt | `WallJoinPanel.tsx` unverändert; BDD `wallOverlay.feature:32` per Button |
| AK4 Später geöffnete Wall | erfüllt | BDD `wallOverlay.feature:38`; Backend `test_ws.py` |
| AK5 Szenen-/Abenteuerwechsel schließt | erfüllt | BDD `wallOverlay.feature:43` (Button nicht gedrückt, „Aus“ markiert); Backend `test_table.py` |
| AK6 Button an der alten Stelle, kein Dialog | erfüllt | Diff `e12f339..HEAD` von `GameTablePanel.tsx`; `qrCode.svg` identisch zu `e12f339`; BDD `adminDashboard.feature:54` |
| AK7 Scannbar aus Abstand | Darstellung erfüllt, Scan offen | `WallJoinPanel.tsx` unverändert; BDD: quadratisch, ≤ 480 px, im Viewport |

**Blockierende Befunde**
- keine

**Hinweise (nicht blockierend)**
1. **Optik bei `join`:** `ToggleButton` (`GameTablePanel.tsx:85-89`) mit `primary`/`onPrimary` wie `OptionButtons` und
   „Vollbild“ im `AdminHeader`; dokumentiert in `DESIGN.md` 2.4, `components.md`, `contrast.md:57,59`. Nur per
   Code-Vergleich geprüft, nicht am Bildschirm.
2. **Veralteter Testname:** `frontend/__tests__/unit/playerUrl.spec.ts:20` „falls back to the origin of the Admin“
   (Kommentar in `playerUrl.ts` sagt jetzt „Wall“).
3. **Plan-Text:** erledigter Subtask „Frontend/GameTablePanel“ beschrieb die verworfene Variante – als überholt markiert.
4. **Umgebungsbedingt (bekannt):** 4 Backend-Tests (Dev-DB ≠ Seed); E2E „The first interaction makes an admin window
   the audio output“ (`output_ready: true`); „The dashboard shows its panels next to the notes“ flaky.
5. **Nebenwirkung der E2E-Läufe:** Dev-Stack hat `active_scene_id` = 2 (vorher `null`), `wall_overlay` = `off`.
6. **Doku-Suche** (`git grep` außerhalb `docs/tasks/`): keine veralteten Treffer mehr; Mockups unter
   `frontend/docs/design/mockup/` passen zum Stand.

**Scope und Subtasks**
- Alle vier Punkte der Nacharbeit erledigt und im Diff von `36a5015` belegt; kein Backend-Code, `WallJoinPanel` oder
  `WallScreen` geändert; nichts außerhalb des Scopes.

**Checks**
- Backend: `ruff`, `mypy` grün; pytest 324/328 (4 umgebungsbedingt).
- Frontend: lint, typecheck, `knip`, build grün; Unit 346/346; `jscpd` nur bekannter Klon.
- E2E: `wallOverlay` 7/7; `adminDashboard` 6/7 (neues AK6-Szenario grün, rot nur Audio-Output).
- Manuell offen: Test 1 (Scan, AK7), Test 2 (Wechsel am echten Setup), Test 3 (Hinweis unter localhost ohne
  `PLAYER_URL`), Test 4 (beide Themes, auch gedrückter Button).
- Konventionen: `2bd94ab` und `36a5015` je ein Commit `feat(DND-49): …` nach Schema, keine KI-Signatur.
