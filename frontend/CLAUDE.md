# frontend (dnd-portal)

UI des DnD Portals: Admin Screen (Spielleiter), Player Screen (Smartphone), Wall Screen (Atmosphäre) und
Ground Screen (digitales Spielbrett). Holt Szenen vom Backend (`../backend`); Szenenbilder und Musik liefert das
Backend unter `/media` aus, Sounds, Icons und Markdown-Notizen das Frontend selbst aus `public/`. Projektübergreifender Kontext (Vision, Screens
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
npm run dev          # Vite-Dev-Server auf 0.0.0.0:5173 (nativ, ohne Docker)
npm run build        # tsc -b && vite build
npm run typecheck    # tsc -b (nur Typprüfung)
npm run lint         # ESLint (eslint.config.js)
npm run test:unit    # vitest (__tests__/unit)
npm run test:e2e     # jest-cucumber + Selenium/Chrome; braucht laufendes Backend auf :8000
npm run generate:api # API-Typen src/api/schema.d.ts aus ../backend/openapi.json erzeugen (openapi-typescript)
```

Start der ganzen Anwendung bzw. nur des Frontends in Docker (`./script.sh`, `dnd`, Compose) und Production-Stack am
Spieltisch: [../docs/architecture.md](../docs/architecture.md#lokal-starten) (Abschnitte „Lokal starten“ und
„Am Spieltisch (Production)“).

E2E-Struktur: `__tests__/bdd/features/*.feature` (Szenarien), `__tests__/bdd/steps/*.ts` (Steps, von jest per
`testMatch` ausgeführt), `__tests__/bdd/support/helpers.ts` (gemeinsame Helper: Driver, Basis-URL, explizite Waits –
liegt bewusst außerhalb von `steps/`). Die Tests erwarten die Seed-Daten (25 Kampfszenen).

API-URL: `src/api/apiClient.ts` nimmt `import.meta.env.VITE_API_URL` (Typ in `src/vite-env.d.ts`), Default
`http://localhost:8000/`. Die Variable wirkt zur Build-Zeit (Vite setzt sie ins Bundle ein): lokal per `.env`
(gitignored, Vorlage `.env.example`), im Docker-Build per `--build-arg VITE_API_URL=…`.

`Dockerfile` hat drei Stages: `dev` (Vite-Dev-Server :5173, von `../compose.dev.yaml` per `target: dev` genutzt),
`build` (`npm ci`, `npm run build`, `ARG VITE_API_URL`) und `prod` (nginx, `nginx.conf`: SPA-Fallback auf
`index.html`, lange Cache-Dauer nur für gehashte Dateien direkt unter `/assets/`, gzip). Dateien aus `public/` landen im
Prod-Image.

Node-Version: `.nvmrc` (`18`, von CI und nvm/fnm gelesen) und `Dockerfile` (`node:18-slim`, Stages `dev` und `build`)
synchron halten.
Im Container liegt `node_modules` in einem eigenen Volume; nach Änderungen an `package.json` neu aufbauen (Befehl in
[../docs/architecture.md](../docs/architecture.md#lokal-starten)).

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
src/api/             axios-Client (apiClient.ts, API_BASE_URL), getData (apiMethods.ts), loadData, mediaUrl (mediaUrl.ts);
                     schema.d.ts generiert
src/models/models.ts API-Typen SceneDetail, Image, Track, MapResponse (= MapEntry) aus src/api/schema.d.ts;
                     Map ist Frontend-Modell (sceneId), Umwandlung aus MapResponse im Service
src/hooks/           useMusicPlayer (bindet MusicPlayer an den Admin Screen: Track/Play-Zustand, Cleanup)
src/utils/utils.ts   Zufallstrack (getRandomTrack), Musiktitel, Soundeffekte (playAtmoSounds), filterSceneByKey,
                     getGridLayout
src/utils/musicPlayer.ts  MusicPlayer: Hintergrundmusik ohne React (ein Audio-Element, Playlist, aktueller Track,
                     Trackende → nächster Track); Audio-Fabrik und Zufall injizierbar für vitest
src/style/           tokens.ts (statische Tokens + textStyle-Helper), darkTheme/tavernTheme ({ colors }),
                     styled.d.ts (DefaultTheme = tokens + colors), GlobalStyle.ts (Grundregeln, je Screen eingebunden)
public/assets/       sounds, icons; dazu die fest eingebundenen Medien images/ground_screen/mapOverview.jpg (Weltkarte)
                     und music/side/forest/From_Past_To_Present.mp3 (Standardmusik) – Szenenmedien liegen in ../media
public/story/        Markdown-Notizen für den Admin (main, fight, leveling, mechanics), deutsch
```

Datenfluss: Screen → `src/service/*` → `getData()` → Backend. Szenenwechsel: Admin setzt `activeSceneId` über den
Context → `App.tsx` schreibt `localStorage` → andere Fenster desselben Browsers erhalten das `storage`-Event →
jeder Screen lädt die Szene per `scenes/{id}` neu. Kein WebSocket/Polling; Player-Screens sind nicht angebunden.

## Konventionen (durch ESLint erzwungen bzw. im Code üblich)

- Einfache Anführungszeichen, **keine Semikolons**, `curly: all`, `prefer-const`, `camelcase` (auch Properties).
- `import/order`: Gruppen builtin → external → internal, Leerzeile zwischen Gruppen, alphabetisch; `react` zuerst.
- `no-console` ist `warn`.
- React-Hooks-Regeln werden erzwungen (`react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, beide `error`).
  Ladefunktionen liegen im Effect selbst, nicht im Component-Body. Ladevorgänge in Effects laufen über `loadLatest`
  (`src/utils/loadSafely.ts`) mit einem `stale`-Flag, das der Cleanup setzt – veraltete Antworten werden verworfen.
- Komponenten als `const X: FunctionComponent<XProps> = (…): ReactElement => …` mit Props-Interface,
  **benannter Export am Dateiende** (`export { X }`). Nur `App` ist Default-Export.
- Styles als styled-components in derselben Datei; Farben über `props.theme.colors.*`, nicht hart codiert.
  Abstände, Schrift, Radien, Größen und `z-index` über die Tokens (`props.theme.space[5]`, `textStyle('sm')`,
  `props.theme.layer.dialog` …), feste px-Werte nur als benannte Layout-Konstante (siehe [DESIGN.md](DESIGN.md)).
  Das Theme ist typisiert (`src/style/styled.d.ts`), `tsc` prüft Zugriffe.
- `GlobalStyle` (box-sizing, margin, Body-Schrift) wird nicht in `App.tsx`, sondern im Screen gerendert – in allen
  vier Screens (`AdminScreen`, `WallScreen`, `GroundScreen`, `PlayerScreen`).
- Icons als SVG über `react-svg` (Füllfarbe aus dem Theme), Pfade ab `/assets/...`.
- API-Typen nicht von Hand pflegen: `src/api/schema.d.ts` wird aus `../backend/openapi.json` generiert
  (`npm run generate:api`, nicht editieren, von ESLint ausgenommen); `src/models/models.ts` leitet die Typen davon ab.
  Ablauf bei Vertragsänderungen: `../docs/architecture.md#api-vertrag--typgenerierung`. API-Pfade ohne Slash am Ende.
- Code-Kommentare erklären das Warum. Keine Verweise auf DESIGN.md-/docs-Abschnitte im Code – die Zuordnung
  steht in der Doku (z. B. Layout-Konstanten in `docs/design/screen-layouts.md`).

## Wichtig beim Ändern

- Medienpfade (`source`) kommen vom Backend als API-relativer Pfad (`/media/...`) und werden immer über
  `mediaUrl(source)` (`src/api/mediaUrl.ts`, gleiche Basis-URL wie `apiClient`) in eine absolute URL umgewandelt –
  in `WallScreen`, `GroundScreen`, `MapOverview`, `SideMaps`, `Dialogue` und der Playlist im `AdminScreen`.
- Kacheln (`Map`) tragen die Szenen-ID als `sceneId`: Das Backend liefert in `/maps/*` `id = scene.id`, die Services
  mappen es auf `sceneId`. Aktiv ist die Kachel mit `sceneId === activeSceneId`. `MapOverview` rendert jede Anzahl als
  Raster mit `⌈√n⌉` Spalten (`getGridLayout` in `src/utils/utils.ts`, auch Basis der Wall-Overlay-Breite).
- `DocumentReader` sammelt Markdown per `import.meta.glob` aus `public/story/**` – neue Notizen dort ablegen.
- Player-Ressourcen (`ResourceBarPlayer`) sind reiner lokaler State; Zauberplatz-Maxima sind hart codiert (`SpellMax`).
- Die Ressource „Bewegung“ ist Work in Progress; `/spells` ist auf dem Branch `feature/spells-screen` geparkt; `v1-roguelike` (Tags `archive/*`) ist verworfen.
- Weitere bekannte Bugs/Altlasten: `../docs/known-issues.md`.

## CI

`../.github/workflows/frontend.yml`: Build, Typecheck (inkl. Prüfung, dass `src/api/schema.d.ts` aktuell ist), Lint,
Unit-Tests und Production-Image; kein E2E. Details: [../docs/architecture.md](../docs/architecture.md#qualitätssicherung).
