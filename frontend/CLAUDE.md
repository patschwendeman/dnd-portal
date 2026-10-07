# frontend (dnd-portal)

UI des DnD Portals: Admin Screen (Spielleiter), Player Screen (Smartphone), Wall Screen (Atmosphäre) und
Ground Screen (digitales Spielbrett). Holt Szenen vom Backend (`../backend`) und liefert alle Medien
(Bilder, Musik, Sounds, Markdown-Notizen) selbst aus `public/` aus. Projektübergreifender Kontext (Vision, Screens
Soll/Ist, Begriffe, bekannte Probleme) liegt eine Ebene höher in `../CLAUDE.md` und `../docs/`.

Gestaltungsregeln, Tokens und Farbrollen stehen in [DESIGN.md](DESIGN.md). Die Mappings je Screen (welcher Wert in
welcher Komponente wie umgestellt wird), das Audit und die Mockups liegen in [design/](design/).

## Stack

React 18 · Vite 5 · TypeScript 5 (strict, `noUnusedLocals/Parameters`) · react-router-dom 6 (`BrowserRouter`) ·
styled-components 6 (Haupt-Styling + Themes) · MUI nur für `Box`/`Slider` · axios · react-markdown · react-svg ·
`@fontsource/inter` (Schrift Inter 400/500/600/700, lokal ausgeliefert, Import in `src/main.tsx`).
Tests: vitest (Unit), jest-cucumber + selenium-webdriver (BDD/E2E).

## Befehle

```bash
# im Monorepo-Root: ganze Anwendung in Docker (Frontend mit Hot-Reload, ./ gemountet)
docker compose up --build    # Frontend :5173, API :8000, DB :5432
# in frontend/: nur Frontend in Docker
docker compose up --build

npm run dev          # Vite-Dev-Server auf 0.0.0.0:5173 (nativ, ohne Docker)
npm run build        # tsc -b && vite build
npm run typecheck    # tsc -b (nur Typprüfung)
npm run lint         # ESLint (eslint.config.js)
npm run test:unit    # vitest (__tests__/unit)
npm run test:e2e     # jest-cucumber + Selenium/Chrome; braucht laufendes Backend auf :8000
```

Das Backend muss auf `http://localhost:8000/` laufen (fest in `src/api/apiClient.ts`, keine Env-Variablen).

Node-Version: `.nvmrc` (`18`, von CI und nvm/fnm gelesen) und `Dockerfile` (`node:18-slim`) synchron halten.
Im Container liegt `node_modules` in einem eigenen Volume; nach Änderungen an `package.json` mit
`docker compose up --build -V` neu aufbauen.

## Routen

| Pfad | Screen | Datei |
|---|---|---|
| `/admin` | Admin | `src/screens/AdminScreen.tsx` |
| `/wall` | Wall | `src/screens/WallScreen.tsx` |
| `/ground` | Ground | `src/screens/GroundScreen.tsx` |
| `/` | Player | `src/screens/PlayerScreen.tsx` |

## Struktur & Datenfluss

```
src/app/App.tsx      Routing, Theme, globaler State (activeSceneId, activeMapId, isDarkTheme) + localStorage-Sync
src/context/         ActiveSceneContext, ActiveMapContext
src/screens/         Screens
src/components/      UI-Bausteine (TopBar, DocumentReader, MapOverview, GridOverlay, ScreenControlBar, ResourceBarPlayer …)
src/service/         Datenladen je Screen (getAdminData, getWallScreenData, getGroundScreenData …)
src/api/             axios-Client (apiClient.ts) und getData/updateData (apiMethods.ts)
src/models/models.ts Interfaces (SceneDetail, Screen, Music, Map) – spiegeln die Backend-Antworten
src/utils/utils.ts   Audio (Playlist, Zufallstrack, Soundeffekte), filterSceneByKey
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
- `GlobalStyle` (box-sizing, margin, Body-Schrift) wird nicht in `App.tsx`, sondern im Screen gerendert – derzeit
  in `AdminScreen` und `WallScreen`; der Player bekommt ihn nicht.
- Icons als SVG über `react-svg` (Füllfarbe aus dem Theme), Pfade ab `/assets/...`.
- Neue Backend-Felder zuerst in `src/models/models.ts` ergänzen.

## Wichtig beim Ändern

- Medienpfade (`source`) kommen aus dem Backend-Seed und müssen zu Dateien in `public/` passen.
- `MapElement`/`MapOverview` setzen voraus, dass Map-ID = Szenen-ID ist; `MapOverview` rendert nur bei
  quadratischer Anzahl korrekt (16, 25 …).
- `DocumentReader` sammelt Markdown per `import.meta.glob` aus `public/story/**` – neue Notizen dort ablegen.
- Player-Ressourcen (`ResourceBarPlayer`) sind reiner lokaler State; Zauberplatz-Maxima sind hart codiert (`SpellMax`).
- `eslint-plugin-react-hooks` ist installiert, aber nicht aktiv – `useEffect`-Abhängigkeiten nicht blind „reparieren“,
  ohne das Verhalten zu prüfen.
- Die Ressource „Bewegung“ ist Work in Progress; `/spells` ist auf dem Branch `feature/spells-screen` geparkt; `v1-roguelike` (Tags `archive/*`) ist verworfen
  (Reste: `updateData`, `map_locked.png`).
- Weitere bekannte Bugs/Altlasten: `../docs/known-issues.md`.

## CI

`../.github/workflows/frontend.yml` (Root des Monorepos): bei Push auf `main`/`development` mit Änderungen unter
`frontend/` vier Jobs direkt auf dem Runner (Node aus `.nvmrc`, npm-Cache, `npm ci`): zuerst `build` (`npx vite build`),
danach parallel `typecheck` (`npm run typecheck`, also `tsc -b`), `lint` (`npm run lint`) und `test`
(`npm run test:unit`), alle mit `needs: build` – bricht der Build, laufen sie nicht. E2E läuft nicht in CI.
