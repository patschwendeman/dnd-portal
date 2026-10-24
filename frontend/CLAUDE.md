# frontend (dnd-portal)

UI des DnD Portals: Admin Screen (Spielleiter), Player Screen (Smartphone), Wall Screen (Atmosphäre) und
Ground Screen (digitales Spielbrett). Holt Szenen vom Backend (`../backend`); Szenenbilder und Musik liefert das
Backend unter `/media` aus, Soundeffekte, Icons und Markdown-Notizen das Frontend selbst aus `public/`. Projektübergreifender Kontext (Vision, Screens
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
npm run test:e2e     # jest-cucumber + Selenium/Chrome; braucht laufendes Backend auf :8000 (über den Vite-Proxy);
                     # sequenziell (--runInBand), weil alle Specs den einen Spieltisch-Zustand des Servers ändern
npm run generate:api # API-Typen src/api/schema.d.ts aus ../backend/openapi.json erzeugen (openapi-typescript)
npm run check:deadcode # knip: ungenutzte Dateien, Exporte und Dependencies (knip.jsonc)
npm run check:dupes  # jscpd: Duplikate in src/ ab 8 Zeilen, scheitert über dem Schwellwert (.jscpd.json)
```

Start der ganzen Anwendung bzw. nur des Frontends in Docker (`./script.sh`, `dnd`, Compose) und Production-Stack am
Spieltisch: [../docs/architecture.md](../docs/architecture.md#lokal-starten) (Abschnitte „Lokal starten“ und
„Am Spieltisch (Production)“).

E2E-Struktur: `__tests__/bdd/features/*.feature` (Szenarien), `__tests__/bdd/steps/*.ts` (Steps, von jest per
`testMatch` ausgeführt), `__tests__/bdd/support/helpers.ts` (gemeinsame Helper: Driver, Basis-URL, explizite Waits –
liegt bewusst außerhalb von `steps/`). Die Tests erwarten die Seed-Daten (29 Szenen,
Auswahl über die Namen aus `../backend/app/db/data/seed_data.json`).

API-URL: `src/api/apiClient.ts` nimmt `import.meta.env.VITE_API_URL` (Typ in `src/vite-env.d.ts`), Default
`/api/` (relativ: der Vite-Dev-Server bzw. nginx leiten `/api/` ohne Präfix und `/ws` an die API weiter, gleicher
Origin für alle Geräte). Proxy-Ziel in Dev: `API_PROXY_TARGET` (Default `http://localhost:8000`, im Dev-Compose
`http://api:8000`, `vite.config.ts`). Die Variable wirkt zur Build-Zeit (Vite setzt sie ins Bundle ein): lokal per
`.env` (gitignored, Vorlage `.env.example`), im Docker-Build per `--build-arg VITE_API_URL=…`. Die WebSocket-URL
leitet `wsUrl` (`src/api/wsUrl.ts`) aus derselben Basis ab.

`Dockerfile` hat drei Stages: `dev` (Vite-Dev-Server :5173, von `../compose.dev.yaml` per `target: dev` genutzt),
`build` (`npm ci`, `npm run build`, `ARG VITE_API_URL`) und `prod` (nginx, `nginx.conf`: Proxy `/api/` und `/ws` zur
API, SPA-Fallback auf
`index.html`, lange Cache-Dauer nur für gehashte Dateien direkt unter `/assets/`, gzip). Dateien aus `public/` landen im
Prod-Image.

Node-Version: `.nvmrc` (`24`, von CI und nvm/fnm gelesen) und `Dockerfile` (`node:24-slim`, Stages `dev` und `build`)
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
src/app/App.tsx      Routing; alle vier Screens je im GameTableProvider; Theme-Abweichung des Player Screens
                     (localStorage playerThemeOverride, Prop themeOverride), entfernt den Altschlüssel isDarkTheme
src/realtime/        WebSocket-Client des Spieltischs: GameTableProvider (ThemeProvider + Contexts aus dem Snapshot,
                     optional themeOverride),
                     useGameTable(screen) → { state, audio, isAudioOutput, screens, fullscreenHints,
                     requestScreenFullscreen, connected, reconnectNow, requestAudioOutput,
                     reportTrackEnded, subscribeSound }, remoteFullscreen.ts (Vollbild von Wall/Ground per
                     Fernsteuerung: Ablehnung melden, mit dem nächsten Klick nachholen, Delegation aus dem
                     Admin-Fenster), connection.ts (Reconnect, Heartbeat, send nur bei offener Verbindung,
                     sofortiger Reconnect beim Sichtbarwerden), messages.ts (parseServerMessage, ClientMessage), backoff.ts (reconnectDelay), heartbeat.ts (Watchdog 35 s), visibility.ts
                     (VisibilitySource, für Tests ersetzbar)
src/context/         ActiveAdventureContext, ActiveSceneContext (IDs number | null, nur lesend), GameTableContext
                     (hasState, theme, connected, reconnectNow, screens: Verbindungs- und Vollbildzahlen,
                     fullscreenHints, requestScreenFullscreen – nur für den Admin), GameAudioContext (audio, isAudioOutput,
                     requestAudioOutput, reportTrackEnded, subscribeSound)
src/audio/           sounds.ts (Soundliste: Name → Icon, Datei; Gruppen im Panel „Sounds“), wallAudioPlayer.ts
                     (WallAudioPlayer: Wiedergabe auf der Wall nach dem AudioState, Audio-Fabrik injizierbar für vitest)
src/screens/         Screens
src/components/      UI-Bausteine (TopBar, JoinDialog, ThemeMenu, NavRail (Navigationsleiste im Admin),
                     SideBarLeftElement (Eintrag im Panel, Button), DocumentNavigation (Notizen-Einträge im Panel),
                     SceneNavigation (Szenenliste im Panel), DocumentReader (Notizen des gewählten Eintrags),
                     Dashboard (Raster rechts im Admin) mit DashboardPanel, ActiveScenePanel, MusicControl,
                     SoundBoard, ScreensPanel (Panels), Dialogue, GridOverlay, ScreenControlBar,
                     ResourceBarPlayer …)
src/service/         Datenladen und Schreibzugriffe je Screen (getAdventures, getAdventure, getAdminData,
                     getJoinInfo, saveActiveScene, saveActiveAdventure, saveTheme, saveAudio, playSound, getWallScene,
                     getGroundScreenData …)
src/api/             axios-Client (apiClient.ts, API_BASE_URL), getData/patchData/postData (apiMethods.ts), loadData,
                     saveData/postCommand, mediaUrl (mediaUrl.ts), wsUrl (wsUrl.ts); schema.d.ts generiert
src/models/models.ts API-Typen AdventureSummary, AdventureDetail, SceneDetail, Image, Track, GameTableState, Theme,
                     JoinInfo, AudioState, AudioUpdate, SoundName aus src/api/schema.d.ts
src/utils/utils.ts   Musiktitel (getMusicTitle), filterSceneByKey
src/utils/navRail.ts nextOpenPanel (welches Panel neben der Navigationsleiste offen ist)
src/utils/adventure.ts selectDefaultAdventureId (aktives Abenteuer, falls vorhanden, sonst das erste der Liste)
src/utils/playerTheme.ts Theme-Abweichung des Players lesen/schreiben, effectiveTheme, Altschlüssel verwerfen
src/utils/screenStatus.ts Statustexte des Panels „Screens“ aus der Anzahl (screenStatusText, playerStatusText),
                     Vollbild-Hinweis (updateFullscreenHints, fullscreenHintText)
src/utils/useDocumentFullscreen.ts Vollbild des eigenen Fensters (Admin, Top-Bar), Zustand über fullscreenchange
src/utils/playerUrl.ts selectPlayerUrl (URL der API, sonst Origin des Admins, nicht bei localhost/127.0.0.1/[::1])
src/style/           tokens.ts (statische Tokens + textStyle-Helper), darkTheme/tavernTheme ({ colors }), appTheme(theme),
                     styled.d.ts (DefaultTheme = tokens + colors), GlobalStyle.ts (Grundregeln, je Screen eingebunden)
public/assets/       sounds (Soundeffekte, auf der Wall abgespielt), icons; dazu das fest eingebundene Medium
                     images/ground_screen/mapOverview.jpg (Weltkarte) – Szenenmedien und Standardmusik liegen in ../media
public/story/        Markdown-Notizen für den Admin (main, fight, leveling, mechanics), deutsch
```

Datenfluss: Screen → `src/service/*` → `getData()` → Backend. Der Admin lädt die Szenenliste nur über
`adventures/{id}/scenes` des aktiven Abenteuers (`activeAdventureId`). Der Spieltisch-Zustand (aktives Abenteuer, aktive
Szene, Theme) kommt nur vom Server: `GameTableProvider` verbindet sich per WebSocket (`/ws?screen=…`) und speist die
Contexts aus jedem Snapshot. Szenen-, Abenteuer- und Theme-Wechsel schreibt der Admin per REST (`PATCH adventures/{id}`
bzw. `PATCH table`) **ohne lokale Vorwegnahme**; der Server pusht danach den neuen Stand an alle Screens, die die Szene
per `scenes/{id}` neu laden (ohne aktive Szene kein Request, nur Hintergrund). Nur der Admin zeigt Speicher- und
Verbindungsfehler. Der Player nutzt vom Snapshot nur das Theme (`Abweichung ?? Spieltisch-Theme`), sendet nichts und
zeigt keinen Verbindungsstatus. Der QR-Code-Dialog im Admin (`JoinDialog`, geöffnet aus dem Panel „Screens“) lädt beim Öffnen `table/join`. Nur an
Admins schickt der Server die Zahl der verbundenen Wall-, Ground- und Player-Verbindungen und der Walls/Grounds im
Vollbild (`screens`); Vollbild von Wall und Ground schaltet der Admin per WebSocket (`fullscreen`).
Details: `../docs/architecture.md#synchronisation`.

Audio: Der Server hält den Musikzustand und pusht ihn als `audio` an alle Screens. Die Wall, auf der „AUDIO“ geklickt
wurde (`audio_ready`), ist die einzige Audioausgabe und spielt per `WallAudioPlayer`; nach einem Reconnect meldet sie
sich selbst wieder. Der Admin spielt nichts ab, er sendet Befehle (`PATCH table/audio`,
`POST table/sounds`) ohne lokale Vorwegnahme. Details: `../docs/architecture.md#audio`.

## Konventionen (durch ESLint erzwungen bzw. im Code üblich)

- Basis ist der Airbnb-Styleguide (`eslint-config-airbnb-extended`, ESLint 9: base + react, jeweils recommended und
  typescript), streng: `npm run lint` muss ohne Fehler und Warnungen durchlaufen. Abweichungen stehen gesammelt und
  begründet in `eslint.config.js`: **keine Semikolons** (auch nicht als Trenner in Interfaces), alte
  JSX-Scope-Regeln aus, `/assets/…`-Importe (Vite-`public/`) von `no-absolute-path`/`no-unresolved` ausgenommen,
  optionale Props per Default-Argument (`react/require-default-props`), `console.error` erlaubt.
- Darüber hinaus u. a.: einfache Anführungszeichen (JSX: doppelte), Zeilen höchstens 100 Zeichen (auch Kommentare und
  Strings), `import-x/order`, Variablen camelCase (snake_case nur als Property im API-/WebSocket-Format, beim
  Destrukturieren umbenennen), `react-hooks` v7 (u. a. `set-state-in-effect`). `eslint-disable` nur gezielt und mit
  Begründung im Kommentar.
- Ladefunktionen liegen im Effect selbst, nicht im Component-Body. Ladevorgänge in Effects laufen über `loadLatest`
  (`src/utils/loadSafely.ts`) mit einem `stale`-Flag, das der Cleanup setzt – veraltete Antworten werden verworfen.
  Zustand, der nur von einem Wert aus dem Context abhängt (z. B. Zurücksetzen ohne aktive Szene), wird beim Rendern
  angepasst (vorheriger Wert im State), nicht per `setState` im Effect.
- Komponenten als Funktionsdeklaration `function X({ … }: XProps): ReactElement` mit Props-Interface. Dateien mit nur
  einem Export exportieren ihn als Default (`export default X`), sonst benannte Exporte.
- Die Tests unter `__tests__/` werden mitgeprüft; `__tests__/tsconfig.json` gibt ESLint (typbasierte Regeln) und
  Editoren ein TS-Projekt dafür, `tsc -b` baut es nicht.
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
- Toter Code und Duplikate (knip, jscpd): Der Stand von DND-31 ist die Baseline. Bestehende Funde stehen in
  `knip.jsonc` (`ignoreIssues`/`ignoreDependencies`, getrennt nach Falsch-Positiven und Baseline), der
  `threshold` in `.jscpd.json` ist der Ist-Anteil duplizierter Zeilen. Keine neuen Baseline-Einträge, den Schwellwert
  nicht anheben; beim Aufräumen Eintrag entfernen bzw. Schwellwert senken. Funde: `../docs/known-issues.md`.
- Code-Kommentare erklären das Warum. Keine Verweise auf DESIGN.md-/docs-Abschnitte im Code – die Zuordnung
  steht in der Doku (z. B. Layout-Konstanten in `docs/design/screen-layouts.md`).

## Wichtig beim Ändern

- Medienpfade (`source`) kommen vom Backend als API-relativer Pfad (`/media/...`) und werden immer über
  `mediaUrl(source)` (`src/api/mediaUrl.ts`, gleiche Basis-URL wie `apiClient`) in eine absolute URL umgewandelt –
  in `WallScreen`, `GroundScreen`, `Dialogue` und im `WallAudioPlayer` (Musik der Wall).
- Alle Szenen sind gleich (kein `main` mehr). Das Panel „Szenen“ (`SceneNavigation`) zeigt sie in der Reihenfolge der
  API; aktiv ist der Eintrag mit `scene.id === activeSceneId`. Klick auf die aktive Szene tut nichts, sonst öffnet
  `handleSceneSelection` im `AdminScreen` den Dialog „Szene wechseln“.
- `DocumentReader` sammelt Markdown per `import.meta.glob` aus `public/story/**` – neue Notizen dort ablegen.
- Player-Ressourcen (`ResourceBarPlayer`) sind reiner lokaler State; Zauberplatz-Maxima sind hart codiert (`SpellMax`).
- Die Ressource „Bewegung“ ist Work in Progress; `/spells` ist auf dem Branch `feature/spells-screen` geparkt; `v1-roguelike` (Tags `archive/*`) ist verworfen.
- Weitere bekannte Bugs/Altlasten: `../docs/known-issues.md`.

## CI

`../.github/workflows/frontend.yml`: Build, Typecheck (inkl. Prüfung, dass `src/api/schema.d.ts` aktuell ist), Lint,
danach Job `quality` (`check:deadcode`, `check:dupes`), Unit-Tests und Production-Image; kein E2E. Details: [../docs/architecture.md](../docs/architecture.md#qualitätssicherung).
