# frontend (dnd-portal)

UI des DnD Portals: Admin Screen (Spielleiter), Player Screen (Smartphone), Wall Screen (Atmosphäre) und
Ground Screen (digitales Spielbrett). Holt Szenen vom Backend (`../backend`) und liefert alle Medien
(Bilder, Musik, Sounds, Markdown-Notizen) selbst aus `public/` aus. Projektübergreifender Kontext (Vision, Screens
Soll/Ist, Begriffe, bekannte Probleme) liegt eine Ebene höher in `../CLAUDE.md` und `../docs/`.

Gestaltungsregeln, Tokens und Farbrollen stehen in [DESIGN.md](DESIGN.md). Details dazu (Bausteine, Layout-Konstanten
und Screen-Layouts, Kontrast und Theme-Werte) liegen in [docs/design/](docs/design/).

## Stack

React 18 · Vite 5 · TypeScript 5 (strict, `noUnusedLocals/Parameters`) · react-router-dom 6 (`BrowserRouter`) ·
styled-components 6 (Haupt-Styling + Themes) · MUI nur für `Box`/`Slider` · axios · react-markdown · react-svg ·
`@fontsource/inter` (Schrift Inter 400/500/600/700, lokal ausgeliefert, Import in `src/main.tsx`).
Tests: vitest (Unit), jest-cucumber + selenium-webdriver (BDD/E2E).

## Befehle

```bash
# im Monorepo-Root: ganze Anwendung in Docker (Frontend mit Hot-Reload, ./ gemountet)
./dnd.sh dev                 # Frontend :5173, API :8000, DB :5432 (bzw. docker compose -f compose.dev.yaml up --build)
                             # einmalig ./dnd.sh install → danach dnd dev|prod|stop|logs aus jedem Ordner
# in frontend/: nur Frontend in Docker (Stage dev)
docker compose up --build
# Production-Image (nginx, statischer Build) – am Spieltisch per ./dnd.sh prod bzw. dnd prod (compose.prod.yaml);
# web startet erst, wenn die API healthy ist (Healthcheck), Tabs öffnen sich erst danach
docker build --target prod [--build-arg VITE_API_URL=http://<host>:8000/] .

npm run dev          # Vite-Dev-Server auf 0.0.0.0:5173 (nativ, ohne Docker)
npm run build        # tsc -b && vite build
npm run typecheck    # tsc -b (nur Typprüfung)
npm run lint         # ESLint (eslint.config.js)
npm run test:unit    # vitest (__tests__/unit)
npm run test:e2e     # jest-cucumber + Selenium/Chrome; braucht laufendes Backend auf :8000
```

API-URL: `src/api/apiClient.ts` nimmt `import.meta.env.VITE_API_URL` (Typ in `src/vite-env.d.ts`), Default
`http://localhost:8000/`. Die Variable wirkt zur Build-Zeit (Vite setzt sie ins Bundle ein): lokal per `.env`
(gitignored, Vorlage `.env.example`), im Docker-Build per `--build-arg VITE_API_URL=…`.

`Dockerfile` hat drei Stages: `dev` (Vite-Dev-Server :5173, von `docker-compose.yml` per `target: dev` genutzt),
`build` (`npm ci`, `npm run build`, `ARG VITE_API_URL`) und `prod` (nginx, `nginx.conf`: SPA-Fallback auf
`index.html`, lange Cache-Dauer nur für gehashte Dateien direkt unter `/assets/`, gzip). Medien aus `public/` landen im
Prod-Image.

Node-Version: `.nvmrc` (`18`, von CI und nvm/fnm gelesen) und `Dockerfile` (`node:18-slim`, Stages `dev` und `build`)
synchron halten.
Im Container liegt `node_modules` in einem eigenen Volume; nach Änderungen an `package.json` mit
`docker compose up --build -V` (in `frontend/`; im Root `docker compose -f compose.dev.yaml up --build -V`) neu aufbauen.

## Routen

| Pfad | Screen | Datei |
|---|---|---|
| `/admin` | Admin | `src/screens/AdminScreen.tsx` |
| `/wall` | Wall | `src/screens/WallScreen.tsx` |
| `/ground` | Ground | `src/screens/GroundScreen.tsx` |
| `/` | Player | `src/screens/PlayerScreen.tsx` |

## Struktur & Datenfluss

```
src/app/App.tsx      Routing, Theme, globaler State (activeSceneId, isDarkTheme) + localStorage-Sync
src/context/         ActiveSceneContext
src/screens/         Screens
src/components/      UI-Bausteine (TopBar, DocumentReader, MapOverview, GridOverlay, ScreenControlBar, ResourceBarPlayer …)
src/service/         Datenladen je Screen (getAdminData, getWallScreenData, getGroundScreenData …)
src/api/             axios-Client (apiClient.ts) und getData (apiMethods.ts)
src/models/models.ts Interfaces (SceneDetail, Screen, Music, MapResponse) – spiegeln die Backend-Antworten;
                     Map ist Frontend-Modell (sceneId), Umwandlung aus MapResponse im Service
src/hooks/           useMusicPlayer (bindet MusicPlayer an den Admin Screen: Track/Play-Zustand, Cleanup)
src/utils/utils.ts   Zufallstrack (getRandomTrack), Musiktitel, Soundeffekte (playAtmoSounds), filterSceneByKey,
                     getGridLayout
src/utils/musicPlayer.ts  MusicPlayer: Hintergrundmusik ohne React (ein Audio-Element, Playlist, aktueller Track,
                     Trackende → nächster Track); Audio-Fabrik und Zufall injizierbar für vitest
src/style/           tokens.ts (statische Tokens + textStyle-Helper), darkTheme/tavernTheme ({ colors }),
                     styled.d.ts (DefaultTheme = tokens + colors), GlobalStyle.ts (Grundregeln, je Screen eingebunden)
public/assets/       images (ground_screen, wall_screen, maps), music, sounds, icons
public/story/        Markdown-Notizen für den Admin (main, fight, leveling, mechanics), deutsch
```

Datenfluss: Screen → `src/service/*` → `getData()` → Backend. Szenenwechsel: Admin setzt `activeSceneId` über den
Context → `App.tsx` schreibt `localStorage` → andere Fenster desselben Browsers erhalten das `storage`-Event →
jeder Screen lädt die Szene per `scenes/details/{id}` neu. Kein WebSocket/Polling; Player-Screens sind nicht angebunden.

## Konventionen (durch ESLint erzwungen bzw. im Code üblich)

- Einfache Anführungszeichen, **keine Semikolons**, `curly: all`, `prefer-const`, `camelcase` (auch Properties).
- `import/order`: Gruppen builtin → external → internal, Leerzeile zwischen Gruppen, alphabetisch; `react` zuerst.
- `no-console` ist `warn`.
- Komponenten als `const X: FunctionComponent<XProps> = (…): ReactElement => …` mit Props-Interface,
  **benannter Export am Dateiende** (`export { X }`). Nur `App` ist Default-Export.
- Styles als styled-components in derselben Datei; Farben über `props.theme.colors.*`, nicht hart codiert.
  Abstände, Schrift, Radien, Größen und `z-index` über die Tokens (`props.theme.space[5]`, `textStyle('sm')`,
  `props.theme.layer.dialog` …), feste px-Werte nur als benannte Layout-Konstante (siehe [DESIGN.md](DESIGN.md)).
  Das Theme ist typisiert (`src/style/styled.d.ts`), `tsc` prüft Zugriffe.
- `GlobalStyle` (box-sizing, margin, Body-Schrift) wird nicht in `App.tsx`, sondern im Screen gerendert – in allen
  vier Screens (`AdminScreen`, `WallScreen`, `GroundScreen`, `PlayerScreen`).
- Icons als SVG über `react-svg` (Füllfarbe aus dem Theme), Pfade ab `/assets/...`.
- Neue Backend-Felder zuerst in `src/models/models.ts` ergänzen.
- Code-Kommentare erklären das Warum. Keine Verweise auf DESIGN.md-/docs-Abschnitte im Code – die Zuordnung
  steht in der Doku (z. B. Layout-Konstanten in `docs/design/screen-layouts.md`).

## Wichtig beim Ändern

- Medienpfade (`source`) kommen aus dem Backend-Seed und müssen zu Dateien in `public/` passen.
- Kacheln (`Map`) tragen die Szenen-ID als `sceneId`: Das Backend liefert in `/maps/*` `id = scene.id`, die Services
  mappen es auf `sceneId`. Aktiv ist die Kachel mit `sceneId === activeSceneId`. `MapOverview` rendert jede Anzahl als
  Raster mit `⌈√n⌉` Spalten (`getGridLayout` in `src/utils/utils.ts`, auch Basis der Wall-Overlay-Breite).
- `DocumentReader` sammelt Markdown per `import.meta.glob` aus `public/story/**` – neue Notizen dort ablegen.
- Player-Ressourcen (`ResourceBarPlayer`) sind reiner lokaler State; Zauberplatz-Maxima sind hart codiert (`SpellMax`).
- `eslint-plugin-react-hooks` ist installiert, aber nicht aktiv – `useEffect`-Abhängigkeiten nicht blind „reparieren“,
  ohne das Verhalten zu prüfen.
- Die Ressource „Bewegung“ ist Work in Progress; `/spells` ist auf dem Branch `feature/spells-screen` geparkt; `v1-roguelike` (Tags `archive/*`) ist verworfen
  (Rest: `map_locked.png`).
- Weitere bekannte Bugs/Altlasten: `../docs/known-issues.md`.

## CI

`../.github/workflows/frontend.yml` (Root des Monorepos): bei Push auf `main`/`development` mit Änderungen unter
`frontend/` vier Jobs direkt auf dem Runner (Node aus `.nvmrc`, npm-Cache, `npm ci`): zuerst `build` (`npx vite build`),
danach parallel `typecheck` (`npm run typecheck`, also `tsc -b`), `lint` (`npm run lint`) und `test`
(`npm run test:unit`), alle mit `needs: build` – bricht der Build, laufen sie nicht. Unabhängig davon baut
`docker-prod` das Production-Image (`docker build --target prod`, ohne Push). E2E läuft nicht in CI.
