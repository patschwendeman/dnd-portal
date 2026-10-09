# DND-9: Kampfszenen-Raster für beliebige Anzahl, Kachel-ID explizit als Szenen-ID

**Typ:** fix
**Status:** Fertig

## Kontext & Ziel

`MapOverview` (Raster der Kampfszenen auf Admin und Wall) berechnet die Spaltenzahl mit `Math.sqrt(maps.length)`
und stürzt ab, sobald die Anzahl der Kampfszenen keine Quadratzahl ist. Heute fällt das nur nicht auf, weil der Seed
genau 25 Kampfszenen enthält; jede Änderung an `seed_data.json` (Szene hinzu/weg) macht Admin- und Wall-Screen
unbenutzbar. Außerdem ist im Frontend nicht erkennbar, dass die Kachel-ID die Szenen-ID ist, und die aktive Kachel
wird über einen doppelten State (`ActiveMapContext`) bestimmt, der immer dieselbe Zahl wie `activeSceneId` enthält.
Ziel: Raster funktioniert für jede Anzahl, die Zuordnung Kachel → Szene ist im Code explizit.

## Fehlerbild

**Reproduktion**
1. In `backend/src/db/data/seed_data.json` eine Kampfszene (`main: true`) entfernen (24 statt 25) und DB neu seeden.
2. Admin Screen (`/admin`) oder Wall Screen (`/wall`, Overlay „BATTLE“) öffnen.

**Ist:** `[...Array(Math.sqrt(24))]` wirft `RangeError: Invalid array length`; der Screen rendert nicht.
**Soll:** Das Raster zeigt alle 24 Kampfszenen, zeilenweise sortiert mit Raumnummern 1–24.

## Ursache

- [MapOverview.tsx:46](../../frontend/src/components/MapOverview.tsx) – `const count = Math.sqrt(maps.length)`
  wird als Array-Länge für Spalten und Zeilen benutzt; bei Nicht-Quadratzahlen ist `count` keine ganze Zahl.
- [WallScreen.tsx](../../frontend/src/screens/WallScreen.tsx) – `GRID_GAP_COUNT = 4`: Die Breitenformel des
  Overlay-Panels setzt ein 5 × 5-Raster voraus.
- Kachel-ID: Das Backend liefert in `/maps/main` und `/maps/side` bewusst `id: scene.id`
  ([services/maps.py](../../backend/src/services/maps.py)), im Frontend heißt der Wert aber `Map.id`, `mapId`,
  `keyProp`. `ActiveMapContext`/`activeMapId` wird nur in
  [AdminScreen.tsx:161](../../frontend/src/screens/AdminScreen.tsx) gesetzt, und zwar auf `activeScene.id`.

## Scope / Non-Goals

**Im Scope**
- Rasterberechnung in `MapOverview` für beliebige Anzahl (inkl. 0 und 1).
- Breitenformel des Wall-Overlays aus tatsächlicher Spalten-/Zeilenzahl.
- Frontend-Benennung: Kachel-ID heißt `sceneId`; `ActiveMapContext` und localStorage-Key `activeMapId` entfallen.
- Regressionstest (Unit) für die Rasterberechnung.
- Doku: `docs/known-issues.md`, `docs/architecture.md`, `docs/screens.md`, `frontend/CLAUDE.md`,
  `frontend/docs/design/screen-layouts.md`.

**Nicht im Scope**
- Backend und API-Vertrag (`/maps/*` liefert weiter `{ id, source }`).
- Platzhalter-Kacheln in `MapOverview`/`SideMaps`, wenn `mainmaps`/`sidemaps` `undefined` ist (unverändert lassen).
- Fehlerbehandlung in Effects (`throw` in `handleSceneSelection` u. a.) – eigener Task.
- Musik-Logik in `handleActiveScene`.
- Optik der Kacheln (Größe 16:9, Abstände, Outline, Nummern-Badge).

## Entscheidungen

### E1: Spaltenzahl = aufgerundete Wurzel
- **Entscheidung:** `columns = ceil(√n)`, `rows = ceil(n / columns)`. Darstellung per CSS-Grid
  (`grid-template-columns: repeat(columns, 1fr)`), Reihenfolge zeilenweise wie bisher. Eine unvollständige letzte
  Zeile ist linksbündig, Kacheln behalten dieselbe Breite. 16 → 4 × 4, 25 → 5 × 5 (wie heute), 24 → 5 × 5 mit 4 in
  der letzten Zeile, 15 → 4 Spalten × 4 Zeilen, 0 → kein Raster (kein Fehler).
- **Verworfene Alternativen:** Feste 5 Spalten (Wall-Overlay passt ab 26 Karten nicht mehr in die Höhe).
- **Begründung:** Bei den heutigen 25 Szenen identisch, nahezu quadratisch bei anderen Anzahlen; die Wall-Formel
  lässt sich allgemein aus Spalten und Zeilen ableiten.

### E2: Kachel-ID als Szenen-ID, `ActiveMapContext` entfällt
- **Entscheidung:** API bleibt gleich. Im Frontend heißt die Kachel-ID ab dem Model durchgängig `sceneId`
  (Interface `Map` → Feld-Mapping oder Umbenennung, Props von `MapElement`, Handler `handleSceneSelection(sceneId)`).
  `ActiveMapContext`, der State `activeMapId` in `App.tsx`, sein localStorage-Key und der `storage`-Zweig entfallen;
  die aktive Kachel ist die mit `sceneId === activeSceneId` (aus `ActiveSceneContext`). Die Props
  `isMainMap`/`isActiveMainMap` entfallen in `MapElement`, `MapOverview` und `SideMaps`, soweit sie nur der
  Aktiv-Prüfung dienten (Szenen-IDs sind über Kampf- und Nicht-Kampfszenen eindeutig).
- **Verworfene Alternativen:** nur umbenennen und `ActiveMapContext` behalten; Backend liefert `scene_id`
  (berührt API-Vertrag und beide Teile).
- **Begründung:** Der doppelte State bringt keine Information; eine Quelle für „aktive Szene“ ist einfacher und
  vermeidet, dass beide auseinanderlaufen.
- **Folge:** Die Aktiv-Markierung wechselt mit der Bestätigung im Dialog (Setzen von `activeSceneId`) statt erst
  nach dem Laden der Szene – praktisch nicht sichtbar. Ein alter Eintrag `activeMapId` im localStorage bleibt
  liegen und wird ignoriert.

### E3: Ein Task
- **Entscheidung:** Raster-Fix und ID-Bereinigung in einem `fix`-Task, als getrennte Schritte/Commits.
- **Begründung:** Dieselben Dateien (`MapOverview`, `MapElement`, `SideMaps`, `AdminScreen`, `WallScreen`).

## Subtasks

### Schritt 1: Raster für beliebige Anzahl (`fix(DND-9): …`)

#### Frontend
- [x] Reine Funktion für die Rasterberechnung (z. B. `getGridLayout(count): { columns, rows }` in
      `src/utils/utils.ts`), Verhalten nach E1, `count = 0` → `{ columns: 0, rows: 0 }`.
- [x] Regressionstest in `frontend/__tests__/unit/` (vitest): 0, 1, 15, 16, 24, 25, 26 → erwartete Spalten/Zeilen.
      Vor dem Fix rot (Funktion fehlt bzw. die alte Berechnung liefert für 15/24 keine ganze Zahl), danach grün.
- [x] `MapOverview` auf CSS-Grid mit `columns` aus der Funktion umstellen; Spalten-Container `MainmapsColumn`
      entfällt. Reihenfolge zeilenweise, Raumnummer = Position + 1 (wie heute). Gap/Padding-Props bleiben wirksam.
      Bei 0 Karten: leerer Container, kein Fehler.
- [x] `WallScreen`: `GRID_GAP_COUNT` ersetzen; die Breite des Overlay-Panels aus `columns`/`rows` der aktuellen
      `mainmaps` berechnen. Allgemeine Formel (Tile 16:9, Gap `g = space.3`, verfügbare Rasterhöhe `H` wie heute
      ohne den Gap-Abzug):
      `Breite = (H − (rows − 1)·g) · 16/9 · columns/rows + (columns − 1)·g + 2·space.6`.
      Bei 5 × 5 ergibt sich exakt die heutige Formel. Für `rows = 0` die Höhen-Begrenzung weglassen bzw. so wählen,
      dass kein ungültiges `calc()` entsteht.

#### Doku
- [x] `frontend/docs/design/screen-layouts.md`, Abschnitt „Breite des Overlay-Panels“: allgemeine Formel statt
      5 × 5 / `GRID_GAP_COUNT`.
- [x] `docs/screens.md` (Admin „Szenenauswahl“, Wall „BATTLE“): Raster mit `ceil(√n)` Spalten.
- [x] `docs/known-issues.md`: Eintrag „`MapOverview` nutzt `Math.sqrt` …“ entfernen.
- [x] `frontend/CLAUDE.md:91`: Hinweis auf quadratische Anzahl entfernen bzw. anpassen.

### Schritt 2: Kachel-ID = Szenen-ID explizit, `ActiveMapContext` entfernen (`refactor`-Anteil, Commit `fix(DND-9): …`)

#### Frontend
- [x] `src/models/models.ts`: Kachel-Typ so anpassen, dass die ID als Szenen-ID erkennbar ist (z. B. Feld `sceneId`
      mit Mapping in den Services `adminScreen.ts`/`WallScreen.ts`, oder Kommentar + Umbenennung des Interfaces);
      API-Response unverändert.
- [x] `MapElement`: `keyProp` → `sceneId`; Aktiv-Prüfung `sceneId === activeSceneId`; `isMainMap`/`isActiveMainMap`
      entfernen, `activeMapId`-Prop durch `activeSceneId` (aus Context in `MapOverview`/`SideMaps` oder direkt)
      ersetzen. `handleSceneSelection(sceneId)` ohne zweiten Parameter.
- [x] `MapOverview`, `SideMaps`: auf `ActiveSceneContext` umstellen, Props `isActiveMainMap` entfernen; Aufrufer
      in `AdminScreen`/`WallScreen` anpassen.
- [x] `AdminScreen`: `handleSceneSelection(sceneId)`, `setActiveMapId`-Aufruf und Context-Import entfernen.
- [x] `App.tsx`: State `activeMapId`, localStorage-Effect, `storage`-Zweig und Provider entfernen.
- [x] `src/context/context.ts`: `ActiveMapContext` und Typ entfernen.
- [x] Prüfen, ob `isActiveMainMap`/`isMainMap` in `AdminScreen`/`WallScreen` danach noch für anderes gebraucht
      werden (z. B. Wall-Overlay-Umschaltung) – dort unverändert lassen.

#### Doku
- [x] `docs/architecture.md` (Diagramm Z. 8, State Z. 65): `activeMapId`/`ActiveMapContext` entfernen.
- [x] `frontend/CLAUDE.md` (Z. 52–53, 91): `activeMapId`/`ActiveMapContext` entfernen; Hinweis, dass Kacheln die
      Szenen-ID tragen (Backend `/maps/*` liefert `id = scene.id`).
- [x] `docs/known-issues.md`: Eintrag „Map-Kachel-ID = Szenen-ID wird implizit vorausgesetzt“ entfernen.

## Akzeptanzkriterien

### AK1: Raster bei Nicht-Quadratzahl
- **Given** die DB enthält 24 Kampfszenen (eine aus dem Seed entfernt)
- **When** der Spielleiter Admin und Wall (Overlay „BATTLE“) öffnet
- **Then** beide Raster zeigen 24 Kacheln in 5 Spalten, zeilenweise, Raumnummern 1–24, ohne Fehler in der Konsole;
  das Wall-Overlay passt über der Steuerleiste in den Viewport.

### AK2: Heutiger Stand unverändert
- **Given** der unveränderte Seed mit 25 Kampfszenen
- **When** Admin und Wall geöffnet werden
- **Then** Raster 5 × 5, Kachelgrößen, Abstände, Overlay-Breite und Raumnummern wie vor dem Fix
  (berechnete Breite des Overlay-Panels bei gleicher Viewport-Größe identisch).

### AK3: Szenenauswahl und Aktiv-Markierung
- **Given** Admin und Wall sind geöffnet
- **When** der Spielleiter eine Kampf- oder Nicht-Kampfszene anklickt und im Dialog bestätigt
- **Then** die gewählte Szene wird aktiv, genau diese Kachel ist auf Admin (Kampfszenen oder `SideMaps`) und auf der
  Wall markiert; Wall/Ground wechseln wie bisher. Nach Reload bleibt die Markierung erhalten (über `activeSceneId`).

### AK4: Keine Reste
- `ActiveMapContext`, `activeMapId`, `keyProp`, `GRID_GAP_COUNT` und `Math.sqrt` in `MapOverview` kommen im
  Frontend-Code nicht mehr vor; die beiden Known Issues sind entfernt, die genannte Doku ist nachgezogen.

### AK5: Regressionstest
- Ein Unit-Test bildet die Rasterberechnung für 0, 1, 15, 16, 24, 25, 26 ab, schlägt vor dem Fix fehl und danach nicht.

## Teststrategie / Verifikation

**Automatisch**
- Frontend: `npm run lint`, `npm run typecheck`, `npm run test:unit` (inkl. neuem Test), `npm run build`.
- E2E (`__tests__/bdd`) ist teilweise veraltet (Known Issue) und nicht Teil der Abnahme.

**Manuell**
1. Stack starten (`docker compose up` im Root), Admin, Wall und Ground in getrennten Fenstern öffnen.
2. AK2: Raster und Overlay-Breite mit dem Stand vor dem Fix vergleichen (z. B. berechnete Breite per DevTools).
3. AK3: Kampf- und Nicht-Kampfszene wählen, Markierung auf Admin und Wall prüfen, Reload.
4. AK1: Eine Kampfszene temporär aus `seed_data.json` entfernen, DB neu seeden, Admin und Wall prüfen;
   danach Seed zurücksetzen. Alternativ im Browser die Response von `maps/main/` kürzen (DevTools-Override).

## Offene Fragen
- Geklärt: Wall-Panel „WORLD“ bei `rows < columns` (26–30, 37–42 … Kampfszenen) kann über die Steuerleiste reichen,
  weil es dieselbe Breite wie „BATTLE“ nutzt. Entscheidung User: eigener Task, nicht Teil von DND-9.
- Geklärt: `frontend/docs/design/components.md` (Kachel-Raster „5 Spalten“) und `frontend/CLAUDE.md`
  (models.ts-Aussage) werden in DND-9 nachgezogen (Entscheidung User) – erledigt.

## Review

### Runde 1 – 2026-10-09
**Empfehlung:** Abnahme

Geprüft: Commits `29efd1e..6f95ec7` auf `development` (7 × `fix(DND-9)`, 11 × `docs(DND-9)`), zusätzlich
headless-Browser-Lauf (Selenium/Chrome) gegen den Docker-Stack; für AK1 wurde die Antwort von `maps/main` per
CDP-XHR-Patch auf 24 Einträge gekürzt, DB und Seed unverändert.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Browser mit 24 Kampfszenen: Admin und Wall je 24 Kacheln in 5 × 5, zeilenweise, Nummern 1–24, letzte Zeile 4 Kacheln linksbündig, Konsole leer. Wall-Panel über der Steuerleiste: Unterkante 832,95 ≤ 833 px (1920×1080), 552,95 ≤ 553 (1280×800), 962,95 ≤ 1193 (2560×1440). Code: `MapOverview.tsx` (CSS-Grid `repeat(columns, minmax(0, 1fr))`), `WallScreen.tsx:47-63`. |
| AK2 | erfüllt | Browser mit 25 Kampfszenen: 5 × 5, Nummern 1–25; Kacheln Wall 219,4 × 123,4 px, Admin 64 × 36 px; Panelbreite 1208,88 px (1920×1080). Für c = r = 5 ist die neue Formel algebraisch gleich der alten. Kein Pixelvergleich mit altem Stand im Browser. |
| AK3 | erfüllt | Nicht-Kampfszene forest (`activeSceneId` 1) und Kampfszene Raum 7 (`activeSceneId` 11): jeweils genau die passende Kachel markiert, Wall im zweiten Tab synchron, Markierung nach Reload erhalten. `MapElement`: `isActive = sceneId === activeSceneId`. Szenen-IDs überschneiden sich nicht (Seite 1–4, Kampf 5–29). Wechsel von Wall/Ground nicht separat geprüft (Mechanismus unverändert). |
| AK4 | erfüllt | `grep` nach `ActiveMapContext`, `activeMapId`, `keyProp`, `GRID_GAP_COUNT`, `Math.sqrt` in `frontend/src` und `__tests__`: nur `Math.sqrt` in `utils.ts:25` (`getGridLayout`). Known Issues entfernt; `architecture.md`, `screens.md`, `frontend/CLAUDE.md`, `screen-layouts.md`, `components.md` stimmen mit dem Code überein. |
| AK5 | erfüllt | `gridLayout.spec.ts` (0, 1, 15, 16, 24, 25, 26 + Invariante 1–50) 8/8 grün; auf `29efd1e` mit kopiertem Test 8/8 rot. |

**Blockierende Befunde**
- keine

**Hinweise**
- `frontend/src/utils/utils.ts:30`: Leerzeichen nach `=` bei `getMusicTitle` versehentlich entfernt (cf15db6); ohne Verhaltens- und Lint-Auswirkung, sollte zurückgesetzt werden.
- Regressionstest prüft die Rasterberechnung, nicht direkt den Render-Absturz; der ist durch den Browser-Lauf zu AK1 abgedeckt.
- WORLD-Panel kann bei `rows < columns` (26–30 Kampfszenen) über die Steuerleiste reichen; in `screen-layouts.md` dokumentiert, eigener Task laut Entscheidung des Users.

**Checks:** `npm run lint` 0 Fehler, 2 bekannte Warnungen (`no-console` in `apiMethods.ts`, `alt-text` in `WallScreen`, auf `29efd1e` gegengeprüft); `npm run typecheck` grün; `npm run test:unit` 18/18 grün (8 neu); `npm run build` grün; Commits nach Schema, ohne KI-Signatur, auf `development`; Arbeitsverzeichnis sauber.
