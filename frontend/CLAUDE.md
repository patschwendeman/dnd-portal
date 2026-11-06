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
                     # sequenziell (--runInBand), weil alle Specs den einen Spieltisch-Zustand des Servers ändern;
                     # Chrome läuft headless (1920×1080), mit HEADED=1 npm run test:e2e sichtbar zum Debuggen
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
| `/` | Player: Charakterauswahl (Ziel des QR-Codes) | `src/screens/PlayerSelectScreen.tsx` |
| `/player/:id` | Player Screen des Charakters | `src/screens/PlayerScreen.tsx` |

Beide Player-Routen liegen unter der Layout-Route `PlayerRoute` (`App.tsx`) mit einem gemeinsamen
`GameTableProvider` und `PlayerLayout` (`src/screens/PlayerLayout.tsx`: lädt das aktive Abenteuer, Hintergrundbild,
Hinweis nach Abenteuerwechsel; per `useOutletContext` als `usePlayerOutlet()`).

## Struktur & Datenfluss

```
src/app/App.tsx      Routing; alle vier Screens je im GameTableProvider (Auswahl und Player Screen teilen sich
                     einen); Theme-Abweichung der Player-Routen (localStorage playerThemeOverride, Prop
                     themeOverride), entfernt den Altschlüssel isDarkTheme
src/realtime/        WebSocket-Client des Spieltischs: GameTableProvider (ThemeProvider + Contexts aus dem Snapshot,
                     optional themeOverride),
                     useGameTable(screen) → { state, audio, isAudioOutput, screens, fight, connected, reconnectNow, requestAudioOutput,
                     reportTrackEnded, subscribeSound }, connection.ts (Reconnect, Heartbeat, send nur bei offener
                     Verbindung, sofortiger Reconnect beim Sichtbarwerden), messages.ts (parseServerMessage,
                     ClientMessage), backoff.ts (reconnectDelay), heartbeat.ts (Watchdog 35 s), visibility.ts
                     (VisibilitySource, für Tests ersetzbar)
src/context/         ActiveAdventureContext, ActiveSceneContext (IDs number | null, nur lesend), GameTableContext
                     (hasState, snapshot: letzter Spieltisch-Zustand, neues Objekt je Push, theme, wallOverlay,
                     groundGrid, groundGridCellSize, connected,
                     reconnectNow, screens: Verbindungszahlen nur für den Admin), GameAudioContext (audio, isAudioOutput,
                     requestAudioOutput, reportTrackEnded, subscribeSound), FightContext (fight: Kampf des aktiven
                     Abenteuers, in Admin, Wall und Player gefüllt (Wall und Player ohne Bezeichnungen),
                     im Ground null)
src/audio/           sounds.ts (Soundliste: Name → Icon, Datei; Gruppen im Panel „Audio“), audioPlayer.ts
                     (AudioPlayer: Wiedergabe im Admin nach dem AudioState, Audio-Fabrik injizierbar für vitest),
                     useAudioPlayback.ts (bindet den AudioPlayer im Admin an den GameAudioContext),
                     useAutoAudioOutput.ts (erste Interaktion ohne Ausgabe meldet audio_ready), audioOutput.ts
                     (shouldRequestAudioOutput)
src/screens/         Screens; PlayerLayout (gemeinsame Layout-Route von PlayerSelectScreen und PlayerScreen)
src/components/      UI-Bausteine (AdminHeader (Kopfzeile im Admin: Zurück/Vor, Abenteuername, mit ErrorBar,
                     Vollbild, Dashboard), JoinDialog, SettingsMenu
                     (Settings-Menü der Player-Routen: Theme, optional „Charakter wechseln“),
                     SelectList (Auswahlliste) mit AdventureSelect, SettingsPanel (Panel „Einstellungen“: Abenteuer,
                     Theme, Zellgröße), NavRail (Navigationsleiste im Admin, Menüpunkte oben bzw. unten),
                     SideBarLeftElement (Eintrag im Panel, Button), DocumentNavigation (Notizen-Einträge im Panel),
                     SceneNavigation (Szenenliste im Panel), DocumentReader (Notizen des gewählten Eintrags: lädt
                     alle Notizdateien, Renderer für Überschriften und Links, springt zur Stelle aus dem Verlauf),
                     AdventureBackground (Hintergrundbild des Abenteuers hinter den Kacheln im Admin und den
                     Karten der Player-Routen),
                     Dashboard (Spalte rechts im Admin) mit DashboardPanel (Rahmen), ActiveScenePanel (Bühne),
                     AudioPanel (MusicControl, SoundBoard), GameTablePanel (Spieltisch), PlayersPanel mit
                     PlayerListItem (Spielerzeile, Inhalt PlayerRowContent, auch in der Charakterauswahl) und
                     LevelStepper (Level im Kopf der Party), ListRow (Zeilen-Bausteine von Party, Initiative und
                     Charakterauswahl), CombatantAvatar (Avatar von Spielern und NPCs), FightPanel (Panel
                     „Kampf“), TurnPanel (Dashboard „Am Zug“) mit HeroCard (Hero-Karte), InitiativePanel (Dashboard
                     „Initiative“), PlayerHeroCard (Hero-Karte des eigenen Charakters im Player Screen, mit
                     „Am Zug“ und „Zug beenden“), MiniButton (↑/↓/Entfernen im Panel „Kampf“), ConfirmDialog („Kampf beenden?“),
                     PanelButton (Icon-Button in Panels), WallParty (Party-Kacheln links und rechts auf der Wall),
                     WallInitiative (Initiative-Leiste auf der Wall) mit WallCharacterTile (Kachel eines
                     Charakters auf der Wall), OptionButtons
                     (Segment-Control in Panels), PanelSlider (Slider in Panels), FullscreenHoverOverlay (Vollbild-Overlay auf Wall und
                     Ground), Dialogue, GridOverlay,
                     ResourceBarPlayer …)
src/notes/           Notizen im Admin: noteFolders.ts (NOTE_FOLDERS: Einträge des Panels „Notizen“ = Ordner von
                     public/story/, NOTE_FILES aus einem import.meta.glob), noteAnchors.ts (headingAnchor,
                     noteHeadings, noteElementId), noteLinks.ts (buildNoteIndex, resolveNoteLink: Auflösung eines
                     Links, auch für die Link-Prüfung), noteHistory.ts (Verlauf als reine Funktionen, höchstens 50
                     Einträge), historyShortcuts.ts (Alt+←/→, Daumentasten der Maus), useNoteHistory.ts
                     (useNoteHistory: Verlauf im AdminScreen, useHistoryShortcuts)
src/service/         Datenladen und Schreibzugriffe je Screen (getAdventures, getAdventure, getAdminData,
                     getJoinInfo, saveActiveScene, saveGlobalLevel, saveActiveAdventure, saveTheme, saveAudio, playSound, getWallScene,
                     getWallPlayers, getGroundScreenData, getPlayerAdventure …); gameTable.ts: saveWallOverlay, saveGroundGrid,
                     saveGroundGridCellSize (nur vom Admin genutzt); fight.ts: startFight, endFight, endTurn,
                     addCombatant, saveDefeated, removeCombatant, saveFightOrder (nur vom Admin genutzt, endTurn
                     auch vom Player Screen)
src/api/             axios-Client (apiClient.ts, API_BASE_URL), getData/patchData/postData/putData/deleteData
                     (apiMethods.ts), loadData, saveData/postCommand/replaceData/deleteCommand, mediaUrl (mediaUrl.ts), wsUrl (wsUrl.ts); schema.d.ts generiert
src/models/models.ts API-Typen AdventureSummary, AdventureDetail, Player, SceneDetail, Image, Track, GameTableState, Theme,
                     WallOverlay, GroundGrid, JoinInfo, AudioState, AudioUpdate, SoundName, FightState, Combatant,
                     CombatantKind, CombatantCreate aus src/api/schema.d.ts
src/utils/utils.ts   Musiktitel (getMusicTitle), filterSceneByKey
src/utils/groundGrid.ts GROUND_GRID_CELL_SIZE (100–200, Schritt 10), gridLineColor, toCellSize (Slider-Wert → Zellgröße)
src/utils/navRail.ts nextOpenPanel (welches Panel neben der Navigationsleiste offen ist), splitByPlacement
                     (Menüpunkte oben und am unteren Ende der Leiste)
src/utils/useListbox.ts Logik der Auswahllisten (SelectList, SettingsMenu): Öffnen, Tastatur, Fokus; listbox.ts dazu
src/utils/adventureBackground.ts adventureBackgroundSource (Bild des Abenteuers zum Theme), adventureBackgroundReducer
                     (Bild hinter den Kacheln: geladen, Überblendung, Rückfall), useAdventureBackground.ts (Hook dazu
                     im Admin und in PlayerLayout, BACKGROUND_FADE_MS)
src/utils/fight.ts   Logik des Kampfes: Vorbereitung (initialPreparation, preparedPlayer/preparedNpc,
                     toCombatantCreate), smallestFreeNumber, numberError, moveItem, missingPlayers, Namen und Details
                     der Teilnehmer, nextOnTurn („Als Nächstes“), countByKind, ownTurnCombatantId (eigener
                     Charakter am Zug im Player Screen); useFightPreparation.ts (Vorbereitung als lokaler Zustand
                     des Admin-Fensters, zurückgesetzt bei Abenteuerwechsel, Start und Ende); usePlayerEndTurn.ts
                     („Zug beenden“ im Player Screen: läuft, fehlgeschlagen)
src/utils/wallParty.ts splitParty (Party-Kacheln links und rechts auf der Wall)
src/utils/wallInitiative.ts Initiative-Leiste der Wall: initiativeQueue (Warteschlange ab dem Teilnehmer am Zug,
                     Filter, Rundentrenner), fitToWidth („+N weitere“), planTransitions (Nachrücken), wallName,
                     wallDetails, playerDetails; useInitiativeTransitions.ts (Animation beim Nachrücken)
src/utils/adminError.ts mostImportantError (welcher Fehler in der Kopfzeile des Admins steht)
src/utils/adventure.ts selectDefaultAdventureId (aktives Abenteuer, falls vorhanden, sonst das erste der Liste)
src/utils/playerTheme.ts Theme-Abweichung des Players lesen/schreiben, effectiveTheme, Altschlüssel verwerfen
src/utils/playerSelect.ts playerSelectStatus (Zustand der Karte „Party“ der Auswahl), parsePlayerId,
                     isPlayerOf, playerRedirect (Rückkehr des Player Screens zur Auswahl, mit oder ohne Hinweis)
src/utils/player.ts  characterInitials (Initialen ohne Avatar), steppedLevel (Level −/+ in den Grenzen 1–20)
src/utils/screenStatus.ts Statustexte des Panels „Spieltisch“ aus der Anzahl (screenStatusText, playerStatusText)
src/utils/useDocumentFullscreen.ts Vollbild des eigenen Fensters (Admin: Kopfzeile; Wall und Ground:
                     FullscreenHoverOverlay), Zustand über fullscreenchange
src/utils/playerUrl.ts selectPlayerUrl (URL der API, sonst Origin des Admins, nicht bei localhost/127.0.0.1/[::1])
src/style/           tokens.ts (statische Tokens + textStyle-Helper), darkTheme/tavernTheme ({ colors }), appTheme(theme),
                     styled.d.ts (DefaultTheme = tokens + colors), GlobalStyle.ts (Grundregeln, je Screen eingebunden;
                     CSS-Helper hoverScrollbar und tileSurface für die Kacheln im Admin, die Panels und Overlays
                     auf Wall und Ground und die Karten der Player-Routen, Schalter $isTranslucent)
public/assets/       sounds (Soundeffekte, im Admin abgespielt), icons; dazu das fest eingebundene Medium
                     images/ground_screen/mapOverview.jpg (Weltkarte) – Szenenmedien und Standardmusik liegen in ../media
public/story/        Markdown-Notizen für den Admin (main, fight, leveling, mechanics), deutsch; Querverweise siehe
                     „Notizen und Querverweise“
```

Datenfluss: Screen → `src/service/*` → `getData()` → Backend. Der Admin lädt die Szenenliste nur über
`adventures/{id}/scenes` des aktiven Abenteuers (`activeAdventureId`). Der Spieltisch-Zustand (aktives Abenteuer, aktive
Szene, Theme, Wall-Overlay, Ground-Raster) kommt nur vom Server: `GameTableProvider` verbindet sich per WebSocket (`/ws?screen=…`) und speist die
Contexts aus jedem Snapshot. Szenen-, Abenteuer-, Theme-, Overlay- und Raster-Wechsel schreibt nur der Admin (Wall und Ground
haben keine Bedienelemente außer dem lokalen Vollbild-Overlay) per REST (`PATCH adventures/{id}`
bzw. `PATCH table`) **ohne lokale Vorwegnahme**; der Server pusht danach den neuen Stand an alle Screens, die die Szene
per `scenes/{id}` neu laden (ohne aktive Szene kein Request, nur Hintergrund). Nur der Admin zeigt Speicher- und
Verbindungsfehler (einzige Ausnahme: „Zug konnte nicht beendet werden“ im Player Screen). Auswahl und Player Screen nutzen vom Snapshot das aktive Abenteuer und das Theme (`Abweichung ??
Spieltisch-Theme`) und senden nichts über den WebSocket; `PlayerLayout` lädt `adventures/{id}` beim Laden und nach
jedem Snapshot (Spieler, Level, Hintergrundbilder; wie im Admin, damit das Level ohne Reload folgt). Nur die Auswahl zeigt „Keine Verbindung zum Spieltisch“; der Player
Screen kehrt zur Auswahl zurück, sobald sein Charakter nicht zum aktiven Abenteuer gehört (`playerRedirect`). Der QR-Code-Dialog im Admin (`JoinDialog`, geöffnet aus dem Panel „Spieltisch“) lädt beim Öffnen `table/join`. Nur an
Admins schickt der Server die Zahl der verbundenen Wall-, Ground- und Player-Verbindungen (`screens`); den Kampf
des aktiven Abenteuers (`fight`, `FightContext`) an Admins, Walls und Player (an Walls und Player ohne die Bezeichnungen der NPCs). Den Kampf schreibt der Admin per REST unter `table/fight` ohne
lokale Vorwegnahme; einzige Ausnahme ist „Zug beenden“ im Player Screen (`POST table/fight/turn` für den eigenen
Charakter am Zug, `ownTurnCombatantId`, `usePlayerEndTurn`, ebenfalls ohne Vorwegnahme); nur die Vorbereitung vor „Kampf starten“ ist lokal. Während eines Kampfes sind Szenenliste und
Abenteuer-Auswahl gesperrt (der Server lehnt Wechsel mit 409 ab).
Spieler und Level (`global_level`) stehen nicht im Snapshot: Die Wall lädt `adventures/{id}` beim Laden und bei einem
Abenteuerwechsel (Party und Initiative); der Admin lädt es beim Laden, bei einem
Abenteuerwechsel und nach jedem Snapshot (`snapshot` im `GameTableContext`) neu; das Level schreibt er per
`PATCH adventures/{id}` ohne lokale Vorwegnahme, der Server pusht danach einen Snapshot.
Details: `../docs/architecture.md#synchronisation`.

Audio: Der Server hält den Musikzustand und pusht ihn als `audio` an alle Screens. Ist kein Admin Ausgabe, meldet
sich das Admin-Fenster mit der nächsten Interaktion (Klick oder Taste, `useAutoAudioOutput`) per `audio_ready`; es ist
dann die einzige Audioausgabe und spielt per `AudioPlayer` (`useAudioPlayback`). Nach einem Reconnect meldet es sich
selbst wieder, nach einem Reload erst bei der nächsten Interaktion.
Befehle (`PATCH table/audio`, `POST table/sounds`) sendet der Admin ohne lokale Vorwegnahme. Wall und Ground spielen
nichts. Details: `../docs/architecture.md#audio`.

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
  Screens (`AdminScreen`, `WallScreen`, `GroundScreen`, `PlayerSelectScreen`, `PlayerScreen`).
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
  in `WallScreen`, `GroundScreen`, `Dialogue` und im `AudioPlayer` (Musik im Admin).
- Alle Szenen sind gleich (kein `main` mehr). Das Panel „Szenen“ (`SceneNavigation`) zeigt sie in der Reihenfolge der
  API; aktiv ist der Eintrag mit `scene.id === activeSceneId`. Klick auf die aktive Szene tut nichts, sonst öffnet
  `handleSceneSelection` im `AdminScreen` den Dialog „Szene wechseln“ (nicht während eines Kampfes).
- Notizen: siehe „Notizen und Querverweise“.
- Player-Ressourcen (`ResourceBarPlayer`) sind reiner lokaler State; Zauberplatz-Maxima sind hart codiert (`SpellMax`).
- Die Ressource „Bewegung“ ist Work in Progress; `/spells` ist auf dem Branch `feature/spells-screen` geparkt; `v1-roguelike` (Tags `archive/*`) ist verworfen.
- Weitere bekannte Bugs/Altlasten: `../docs/known-issues.md`.

## Notizen und Querverweise

- Jeder Eintrag im Panel „Notizen“ ist ein Ordner unter `public/story/` und eine Zeile in `NOTE_FOLDERS`
  (`src/notes/noteFolders.ts`, `id` = Ordnername, Label). Neue Notizen als `.md` in den Ordner legen (keine
  Unterordner); ein neuer Ordner braucht die Zeile in `NOTE_FOLDERS`, sonst wird er nicht angezeigt und ist kein
  Linkziel. Die Dateien eines Ordners stehen in der Reihenfolge ihrer Namen untereinander (deshalb
  `1_tableOfContent.md`).
- Anker einer Überschrift: Text in Kleinbuchstaben, `ä`→`ae`, `ö`→`oe`, `ü`→`ue`, `ß`→`ss`, danach jedes Zeichen außer
  `a–z`, `0–9` und `_` durch `-` ersetzt („Rüstungsklasse“ → `ruestungsklasse`, „Taverne – Zum Verzauberte Krug“ →
  `taverne---zum-verzauberte-krug`). Kommt eine Überschrift in einer Datei mehrfach vor, heißt die zweite `…-2`, die
  dritte `…-3`. Im DOM ist die `id` `note-<ordner>-<datei>--<anker>` (`noteElementId`).
- Querverweise sind normale Markdown-Links, der Pfad relativ zur Datei, in der der Link steht:
  `[Text](datei.md)` bzw. `[Text](../ordner/datei.md)` (Anfang der Datei), `[Text](datei.md#anker)` bzw.
  `[Text](../ordner/datei.md#anker)` (Überschrift). `[Text](#anker)` sucht zuerst in der eigenen Datei, dann in den
  anderen Dateien des Ordners; dort muss es genau eine Datei mit dem Anker geben. Links mit `http(s)://` öffnen in
  neuem Tab; Bilder und andere Links bleiben normale Links.
- Ein Link ohne Ziel (fehlende Datei, fehlender oder mehrdeutiger Anker) erscheint im Admin als defekt, und
  `npm run test:unit` schlägt fehl (`__tests__/unit/noteLinksCheck.spec.ts`, Meldung mit Datei und Link).

## CI

`../.github/workflows/frontend.yml`: Build, Typecheck (inkl. Prüfung, dass `src/api/schema.d.ts` aktuell ist), Lint,
danach Job `quality` (`check:deadcode`, `check:dupes`), Unit-Tests und Production-Image; kein E2E. Details: [../docs/architecture.md](../docs/architecture.md#qualitätssicherung).
