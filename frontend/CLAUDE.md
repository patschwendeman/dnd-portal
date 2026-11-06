# frontend (dnd-portal)

UI aller Screens (Admin, Player, Wall, Ground). Datenfluss, Synchronisation, Audio, API-URL, Docker/nginx und CI:
[../docs/architecture.md](../docs/architecture.md). Gestaltung: [DESIGN.md](DESIGN.md), Details in
[docs/design/](docs/design/).

## Stack

TypeScript strict (`noUnusedLocals/Parameters`) · react-router-dom 6 (`BrowserRouter`) · styled-components 6
(Styling + Themes) · MUI nur für `Box`/`Slider` · axios · react-markdown · react-svg · `@fontsource/inter` (Import in
`src/main.tsx`). Tests: vitest (Unit), jest-cucumber + selenium-webdriver (E2E).

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

Start in Docker, Production-Stack, Node-Version (`.nvmrc` ↔ `Dockerfile`), `node_modules`-Volume:
[../docs/architecture.md](../docs/architecture.md#lokal-starten).

E2E-Struktur: `__tests__/bdd/features/*.feature` (Szenarien), `__tests__/bdd/steps/*.ts` (Steps, von jest per
`testMatch` ausgeführt), `__tests__/bdd/support/helpers.ts` (gemeinsame Helper: Driver, Basis-URL, explizite Waits –
liegt bewusst außerhalb von `steps/`). Die Tests erwarten die Seed-Daten (Auswahl über die Namen aus
`../backend/app/db/data/seed_data.json`).

## Struktur

Routen (`src/app/App.tsx`): `/admin`, `/wall`, `/ground`, `/` (Charakterauswahl, Ziel des QR-Codes) und
`/player/:id`; die beiden Player-Routen teilen sich die Layout-Route `PlayerRoute` mit einem `GameTableProvider` und
`PlayerLayout` (`usePlayerOutlet()`).


```
src/app/         Routing, Theme-Abweichung der Player-Routen
src/realtime/    WebSocket-Client des Spieltischs (GameTableProvider, useGameTable)
src/context/     Contexts aus dem Snapshot (nur lesend)
src/screens/     Screens und PlayerLayout
src/components/  UI-Bausteine
src/notes/       Notizen im Admin: Ordner, Anker, Querverweise, Verlauf
src/service/     Datenladen und Schreibzugriffe je Screen
src/audio/       Soundliste und Wiedergabe im Admin
src/api/         axios-Client, Lade-/Schreibmethoden, mediaUrl, wsUrl, generiertes schema.d.ts
src/models/      API-Typen, abgeleitet aus schema.d.ts
src/utils/       reine Logik und Hooks je Thema
src/style/       Tokens, Themes, GlobalStyle
public/assets/   Soundeffekte, Icons, Weltkarte (Szenenmedien liegen in ../media)
public/story/    Markdown-Notizen (deutsch)
```

Ausführlicher: [../docs/architecture.md](../docs/architecture.md#frontend-frontend).

## Konventionen (durch ESLint erzwungen bzw. im Code üblich)

- Basis ist der Airbnb-Styleguide (`eslint-config-airbnb-extended`), streng: `npm run lint` muss ohne Fehler und
  Warnungen durchlaufen. Abweichungen gesammelt und begründet in `eslint.config.js`, u. a. **keine Semikolons**
  (auch nicht in Interfaces), optionale Props per Default-Argument, `console.error` erlaubt.
- Darüber hinaus u. a.: einfache Anführungszeichen (JSX: doppelte), Zeilen höchstens 100 Zeichen (auch Kommentare und
  Strings), `import-x/order`, Variablen camelCase (snake_case nur als Property im API-/WebSocket-Format, beim
  Destrukturieren umbenennen), `react-hooks` v7 (u. a. `set-state-in-effect`). `eslint-disable` nur gezielt und mit
  Begründung im Kommentar.
- Ladefunktionen liegen im Effect selbst und laufen über `loadLatest` (`src/utils/loadSafely.ts`): Der Cleanup
  verwirft veraltete Antworten. Zustand, der nur von einem Context-Wert abhängt, beim Rendern anpassen (vorheriger
  Wert im State), nicht per `setState` im Effect.
- Komponenten als Funktionsdeklaration `function X({ … }: XProps): ReactElement` mit Props-Interface. Dateien mit nur
  einem Export exportieren ihn als Default, sonst benannte Exporte.
- `__tests__/` wird mitgelintet (eigenes `tsconfig.json`, von `tsc -b` nicht gebaut).
- Styles als styled-components in derselben Datei; Farben über `props.theme.colors.*`, nicht hart codiert.
  Abstände, Schrift, Radien, Größen und `z-index` über die Tokens (`props.theme.space[5]`, `textStyle('sm')`,
  `props.theme.layer.dialog` …), feste px-Werte nur als benannte Layout-Konstante (siehe [DESIGN.md](DESIGN.md)).
  Das Theme ist typisiert (`src/style/styled.d.ts`), `tsc` prüft Zugriffe.
- `GlobalStyle` wird nicht in `App.tsx`, sondern in jedem Screen gerendert.
- Icons als SVG über `react-svg` (Füllfarbe aus dem Theme), Pfade ab `/assets/...`.
- API-Typen nicht von Hand pflegen: `src/api/schema.d.ts` wird generiert (`npm run generate:api`, nicht editieren);
  `src/models/models.ts` leitet die Typen davon ab. Ablauf bei Vertragsänderungen:
  [../docs/architecture.md](../docs/architecture.md#api-vertrag--typgenerierung). API-Pfade ohne Slash am Ende.
- Toter Code und Duplikate (knip, jscpd): Der Stand von DND-31 ist die Baseline (`knip.jsonc`, `threshold` in
  `.jscpd.json`). Keine neuen Baseline-Einträge, den Schwellwert nicht anheben; beim Aufräumen Eintrag entfernen bzw.
  Schwellwert senken. Funde: `../docs/known-issues.md`.
- Code-Kommentare erklären das Warum, ohne Verweise auf DESIGN.md-/docs-Abschnitte.

## Wichtig beim Ändern

- Spieltisch-Zustand nur aus dem Snapshot des Servers; geschrieben wird per REST **ohne lokale Vorwegnahme**, der
  Push bringt den neuen Stand. Lokal ist nur die Vorbereitung vor „Kampf starten“. Details:
  [Synchronisation](../docs/architecture.md#synchronisation).
- Medienpfade (`source`, `/media/...`) immer über `mediaUrl(source)` (`src/api/mediaUrl.ts`) in eine URL umwandeln.
- Player-Ressourcen (`ResourceBarPlayer`) sind reiner lokaler State; Zauberplatz-Maxima hart codiert (`SpellMax`);
  die Ressource „Bewegung“ ist Work in Progress.
- Bekannte Bugs/Altlasten: `../docs/known-issues.md`.

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
