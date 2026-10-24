# DND-32: Airbnb-Styleguide als ESLint-Regeln, Frontend-Code angepasst

**Typ:** refactor
**Status:** Fertig

## Kontext & Ziel

Das Frontend-Linting ist dünn: `@eslint/js` und `typescript-eslint` jeweils `recommended`, `react` recommended und
eine Handvoll eigener Regeln (`frontend/eslint.config.js`). Stil, Komplexität von JSX, Importe und viele
Fehlerquellen prüft niemand. Ziel: Der Airbnb-Styleguide für JS/TS/React wird zur Lint-Basis, der gesamte
Frontend-Code wird daran angepasst, und `npm run lint` ist danach ohne Fehler und Warnungen grün.
Voraussetzung: DND-31 ist abgeschlossen (knip-/jscpd-Baseline).

## Invarianten

- Sichtbares Verhalten aller Screens (Admin, Player, Wall, Ground) bleibt unverändert, ebenso Routen, API-Aufrufe und
  WebSocket-Nachrichten (Feldnamen im Wire-Format bleiben snake_case).
- Keine Semikolons (Projektstil bleibt, bewusste Abweichung von Airbnb, siehe E3).
- Bestehende Tests inhaltlich unverändert (nur Import-/Formatanpassungen).
- Build (`tsc -b && vite build`), Typecheck, Unit-Tests, `check:deadcode` und `check:dupes` grün wie vorher.
- CI-Workflow `frontend.yml` unverändert (der Job `lint` ruft weiter `npm run lint`).
- Backend unberührt.

## Scope / Non-Goals

**Im Scope**
- ESLint 8.57 → 9 (letzte 9.x; ESLint 10 wird von airbnb-extended noch nicht unterstützt).
- `eslint-config-airbnb-extended` (exakt gepinnt) mit `base` + `react`, jeweils `recommended` und `typescript`.
- `frontend/eslint.config.js` neu aufgebaut: eigene Regeln, die Airbnb abdeckt, entfallen; Abweichungen gesammelt in
  einem kommentierten Block, jede begründet (E4).
- Durch airbnb-extended überflüssige direkte Dev-Dependencies entfernen (u. a. `eslint-plugin-import`, ersetzt durch
  `import-x`; weitere, sofern knip sie als ungenutzt meldet). `eslint-plugin-styled-components-a11y` bleibt.
- Gesamter Lint-Umfang: `src/`, `__tests__/`, Konfigurationsdateien (`*.config.*`).
- Funde beheben: zuerst `eslint --fix`, danach die manuellen Funde.
- Nicht mehr nötige `eslint-disable`-Kommentare entfernen (heute 12× `camelcase`).
- Doku der Konventionen.

**Nicht im Scope**
- Prettier oder ein anderer Formatter.
- ESLint 10.
- Backend-Linting (ruff).
- Funktionale Umbauten, die über das hinausgehen, was eine Regel verlangt.
- Abbau der knip-Baseline aus DND-31.

## Entscheidungen

### E1: `eslint-config-airbnb-extended` statt offiziellem Paket
- **Entscheidung:** `eslint-config-airbnb-extended` (v3.3.0, Flat Config, TS und React, Stand 10/2026 gepflegt).
  Dafür ESLint-Upgrade auf 9.
- **Verworfene Alternativen:** Offizielles `eslint-config-airbnb` 19 über `FlatCompat`. Es ist seit Jahren
  unverändert, hängt an ESLint 8 (EOL) und bringt keine TS-Regeln mit; `eslint-config-airbnb-typescript` ist archiviert.
- **Begründung:** Einzige gepflegte Airbnb-Variante für Flat Config und TypeScript.

### E2: Strikt, Abweichungen nur wo technisch nötig
- **Entscheidung:** Airbnb vollständig, auch Geschmacksregeln (`import-x/prefer-default-export`,
  `react/function-component-definition`, `@stylistic/max-len` 100, JSX mit doppelten Anführungszeichen,
  `react-hooks` v7 inkl. `set-state-in-effect`). Abweichungen nur nach E3/E4.
- **Verworfene Alternativen:** Pragmatisch (lästige Regeln pauschal aus).
- **Begründung:** Vorgabe des Users.

### E3: Keine Semikolons
- **Entscheidung:** `@stylistic/semi: ['error', 'never']`.
- **Begründung:** Vorgabe des Users; bisheriger Projektstil, kleinerer Diff.

### E4: Technisch nötige Abweichungen
- **Entscheidung:** Nur diese, jeweils mit Kommentar in `eslint.config.js`:
  - `react/react-in-jsx-scope`, `react/jsx-uses-react` aus (neue JSX-Transform, wie bisher).
  - `@typescript-eslint/naming-convention`: snake_case für Properties erlaubt, die das API-/WebSocket-Format
    abbilden (ersetzt die 12 `eslint-disable camelcase`). Variablen bleiben camelCase.
  - `/assets/…`-Importe (Vite-`public/`): `import-x/no-absolute-path` und `import-x/no-unresolved` per
    Ignore-Muster `^/assets/` statt Umzug der Assets.
  - `react/require-default-props` mit `functions: 'defaultArguments'` (TS-Funktionskomponenten, `defaultProps` ist
    für Funktionen veraltet).
  - `no-console`: `console.error` bleibt erlaubt (Fehlermeldungen aus DND-11).
  - Kommt während der Umsetzung eine weitere technisch nötige Abweichung hinzu, wird sie im Plan ergänzt und im
    Review begründet. Geschmack ist kein Grund.
- **Ergänzt während der Umsetzung:**
  - `@stylistic/member-delimiter-style`: mehrzeilig ohne Trenner, einzeilig Komma (Teil von E3). Airbnb verlangt
    Semikolons als Trenner in Interfaces/Typliteralen; der Autofix hätte über 100 Semikolons eingefügt, das
    widerspricht der Invariante „Keine Semikolons“. Vom User bestätigt.
  - `naming-convention`-Ausnahme entfällt: airbnb-extended prüft Properties nicht (`camelcase` ist für TS aus), die
    12 `eslint-disable camelcase` waren ohnehin überflüssig. Die 3 destrukturierten snake_case-Variablen in
    `src/realtime/messages.ts` werden umbenannt (`active_scene_id: activeSceneId`), das Wire-Format bleibt.
  - Keine Regelabweichung, aber technisch nötig: `__tests__/tsconfig.json` (erbt von `tsconfig.app.json`, nicht von
    `tsc -b` gebaut). Die typbasierten Regeln von airbnb-extended (`projectService`) brauchen für jede Datei ein
    TS-Projekt; ohne sie bricht ESLint für alle 22 Testdateien mit einem Parsing-Fehler ab.
  - Tests (Entscheidung des Users): ohne `eslint-disable` umgeschrieben, Verhalten gleich. `for…of` in den
    Unit-Tests → `forEach` (`playerTheme`, `realtimeMessages` 2×, `sounds`), die `await`-Schleife in
    `__tests__/bdd/steps/selectScene.ts` → rekursive Suche `findInactiveScene` (weiter nacheinander, Abbruch bei
    der ersten inaktiven Szene), die zweite Fake-Klasse in `gameTableConnection.spec.ts` → Fabrik
    `createFakeVisibility()`.

### E5: Drei Commits
- **Entscheidung:** (1) Tooling und Config, (2) reiner `eslint --fix`-Lauf, (3) manuelle Anpassungen und Doku.
  Der Hash von (2) kommt in eine neue `.git-blame-ignore-revs` im Repo-Root (Teil von Commit 3).
- **Bestätigt (User, Runde 1):** gilt statt „ein Commit pro Umsetzungsrunde“; Plan-Datei und Task-Liste kommen in
  Commit 3.
- **Begründung:** Der mechanische Diff (~1000 Stellen) bleibt vom inhaltlichen getrennt, Review und `git blame`
  bleiben lesbar.

## Probelauf (Ist-Stand, 2026-10-24)

Kopie des Frontends mit ESLint 9.39, airbnb-extended 3.3.0, Config wie oben (ohne E4-Ausnahmen außer Semikolon und
JSX-Scope): **1273 Funde in 80 von 81 Dateien, 983 per `--fix` behebbar.**
Größte Brocken: `@stylistic/indent` 416, `react/jsx-indent(-props)` 161, `@stylistic/member-delimiter-style` 110,
`@stylistic/jsx-quotes` 86, `@stylistic/object-curly-newline` 56 (alle fixbar).
Manuell (~290): `@stylistic/max-len` 139, `import-x/prefer-default-export` 29,
`react/function-component-definition` 22, `import-x/no-unresolved`/`no-absolute-path` je 10 (E4), `no-console` 10,
`react/require-default-props` 9 (E4), `consistent-return` 8, `@typescript-eslint/no-shadow` 8,
`react/no-unstable-nested-components` 7, `react-hooks/set-state-in-effect` 6 (AdminScreen), `react/no-array-index-key` 5,
Rest Einzelfälle.

## Subtasks

### Tooling (Commit 1)
- [x] `eslint` ^9 (letzte 9.x), `@eslint/js` passend, `eslint-config-airbnb-extended` exakt `3.3.0`.
- [x] `frontend/eslint.config.js` nach E2–E4 neu; `ignores` (`dist/`, `src/api/schema.d.ts`) bleiben.
- [x] Überflüssige Dev-Dependencies entfernen, `knip.jsonc` ggf. anpassen (keine neuen Baseline-Einträge).

### Autofix (Commit 2)
- [x] `npx eslint . --fix`, sonst nichts. Tests, Build und Typecheck danach grün.

### Manuelle Anpassungen (Commit 3)
- [x] `max-len`: Zeilen umbrechen, lange Strings/Template-Literals sinnvoll aufteilen.
- [x] Default-Exporte (`prefer-default-export`) und Komponenten als Funktionsdeklarationen bzw. nach Regelvorgabe
      (`function-component-definition`); Importe anpassen.
- [x] `react-hooks/set-state-in-effect` im AdminScreen: abgeleiteten Zustand berechnen statt per Effekt setzen;
      Verhalten unverändert. Wo ein Effekt tatsächlich nötig ist (Synchronisation mit Server/WebSocket), gezieltes
      `eslint-disable-next-line` mit Begründung.
- [x] `no-unstable-nested-components`, `no-array-index-key`, `no-shadow`, `consistent-return` und Einzelfälle beheben.
- [x] Überflüssige `eslint-disable`-Kommentare entfernen; verbleibende Disables nur mit Begründung im Kommentar.

### Doku
- [x] `frontend/CLAUDE.md` „Konventionen“: Airbnb (airbnb-extended) als Basis, Abweichungen aus E3/E4 kurz.
- [x] `docs/architecture.md` Lint-Zeile (Tabelle Tooling) anpassen.

## Akzeptanzkriterien

- [ ] AK1: `frontend/eslint.config.js` basiert auf `eslint-config-airbnb-extended` (base + react, recommended +
      typescript) auf ESLint 9; Abweichungen sind genau die aus E3/E4 und jeweils kommentiert.
- [ ] AK2: `npm run lint` meldet 0 Fehler und 0 Warnungen.
- [ ] AK3: Jedes verbleibende `eslint-disable` im Code hat eine Begründung im Kommentar.
- [ ] AK4: Alle Invarianten eingehalten, keine Verhaltensänderung.
- [ ] AK5: Build, Typecheck, `test:unit`, `check:deadcode`, `check:dupes` grün; Tests inhaltlich unverändert.
- [ ] AK6: Commits nach E5, Autofix-Commit in `.git-blame-ignore-revs`.

## Teststrategie / Verifikation

**Automatisch**
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:unit`, `npm run check:deadcode`,
  `npm run check:dupes`.

**Manuell**
1. Dev-Stack starten, Admin öffnen: Abenteuer wählen, Szene aktivieren, Notizen öffnen, Theme wechseln.
2. Wall und Ground in eigenen Fenstern: Szenenwechsel kommt an, Bilder und Musik laufen, Soundeffekt auslösen.
3. Player per QR-Code-URL öffnen: Verbindung steht, Theme pro Gerät wählbar.
4. Konsole ohne neue Fehler oder Warnungen (insb. React-Render-Schleifen nach dem Umbau in AdminScreen).

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-10-24
**Empfehlung:** Abnahme

Geprüft habe ich die drei Commits `955252b`, `d14958b` und `e71d863` gegen `051a23b`. Einen Commit `docs(DND-32): approve plan` gibt es nicht. Die Plan-Datei kommt erst mit Commit 3 ins Repo, so wie es in E5 steht und vom User bestätigt ist. Gegengeprüft habe ich in einem temporären Worktree im Scratchpad: Autofix nachgestellt, Baselines gemessen, `npm ci` auf leerem Stand. Der Worktree ist wieder entfernt, der Arbeitsbaum des Repos ist unverändert und sauber.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `frontend/eslint.config.js`:10-20 nutzt `configs.base.recommended`, `configs.react.recommended`, `configs.base.typescript` und `configs.react.typescript`. `frontend/package.json`:35/41/42 setzt `eslint` und `@eslint/js` auf ^9.39.5 und pinnt `eslint-config-airbnb-extended` exakt auf `3.3.0`. Der Abweichungsblock steht unter :29-58, jede Regel hat einen Kommentar: `@stylistic/semi` never (:33), `member-delimiter-style` (:34, in E4 ergänzt), JSX-Scope aus (:42-43), `/assets/` als Ignore-Muster (:45-49), `require-default-props` mit `functions: 'defaultArguments'` (:52-55), `no-console` erlaubt `error` (:57). Abgeglichen mit den Airbnb-Quellen in `node_modules/eslint-config-airbnb-extended/dist/rules`: Bei `no-unresolved` kommt nur `ignore` dazu, bei `require-default-props` ändert sich nur `functions`, alle anderen Optionen sind identisch. Die `naming-convention`-Ausnahme fehlt korrekt; Airbnb schaltet `camelcase` für TS ab (`typescriptEslint.mjs`:49). Der Block `styled-components-a11y` ist keine Abweichung, das Plugin bleibt laut Scope. |
| AK2 | erfüllt | `npm run lint` endet mit Exit 0 und ohne Ausgabe. Laut `eslint . --format json`: 81 Dateien, 0 Fehler, 0 Warnungen. Geprüft werden `src/`, alle 22 Dateien in `__tests__/`, `eslint.config.js` und `vite.config.ts`. Die frühere Warnung `styled-components-a11y/alt-text` in WallScreen (aus DND-29) ist mit `alt=""` behoben. |
| AK3 | erfüllt | Es bleiben 3 Disables, alle mit Begründung: `src/screens/WallScreen.tsx`:148 (Kommentar :147, der Player besitzt Audio-Elemente und der Cleanup gibt sie frei), `src/realtime/connection.ts`:80 (Kommentar :78-79, Reconnect-Zyklus) und :113 (`-- reconnect cycle`). Vorher waren es 11 Disables in `src`/`__tests__`. In `__tests__/` ist keins mehr übrig. |
| AK4 | erfüllt | Siehe die Prüfung auf Verhaltensänderungen unten. Routen (`/`, `/wall`, `/ground`, `/admin`), API-Pfade (12 Aufrufe von `loadData`/`saveData`/`postCommand`, Pfade gleich) und alle 24 `data-test-id` sind gleich geblieben (Vergleich mit `051a23b`, nur die JSX-Quotes haben sich geändert). Das Wire-Format bleibt snake_case (`src/realtime/messages.ts`: Umbenennung nur beim Destrukturieren, das Rückgabeobjekt hat dieselben Felder). `.github/`, `backend/`, `media/`, `knip.jsonc`, `.jscpd.json`, die `tsconfig*.json` und `jest.config.json` sind unverändert. Keine Semikolons, auch nicht in Interfaces. |
| AK5 | erfüllt | Grün sind typecheck, build, test:unit (19 Dateien, 158 Tests, so viele wie bei `051a23b`), `check:deadcode` und `check:dupes` (2,03 %, Schwelle 2,09), lokal und nach `npm ci` auf leerem Stand. Die knip-Funde ohne Baseline sind identisch mit der DND-31-Baseline (1 Dependency, 5 Exporte, 4 Typen), es gibt keine neuen Baseline-Einträge. Die Tests sind in den Assertions und Testdaten unverändert. Das Umschreiben von Schleifen und Fake entspricht der dokumentierten User-Entscheidung (E4) und verhält sich gleich, Details unten. |
| AK6 | erfüllt | Drei Commits nach E5: Tooling (`955252b`, nur `eslint.config.js`, `package.json`, Lockfile, `__tests__/tsconfig.json`), Autofix (`d14958b`), Handarbeit plus Doku (`e71d863`). `d14958b` ist reiner Autofix: `npx eslint . --fix` auf `955252b` ergibt im Worktree exakt den Baum von `d14958b` (`git diff --quiet` ohne Unterschied). `.git-blame-ignore-revs` enthält den vollen Hash `d14958be2bb4738cdca6d04b76eba28d123ccd72`. |

**Prüfung auf Verhaltensänderungen (refactor)**
- **Zurücksetzen beim Rendern statt im Effekt:**
  - Stellen: `AdminScreen.tsx`:230-245 und :374-378, `WallScreen.tsx`:110-118, `GroundScreen.tsx`:80-88.
  - Gleichwertig, weil die Anfangswerte des States schon den Reset-Werten entsprechen: `scenesDetails` `[]`, `activeScene` `undefined`, `*Failed` `false`, `worldMapVisibility` `false`, `mediaSRC` `''`, `mediaType` `null`, `draggedVolume` `null`. Den Reset beim Mount, den der alte Effekt machte, braucht es deshalb nicht.
  - Erneutes Auslösen über `reloadCount` bei `null`-Id: Das war vorher ein No-op. Der Lade-Effekt läuft dann nicht, und die `stale`-Flag aus `loadLatest` verwirft späte Antworten.
  - Der Lautstärke-Reset vergleicht `audio` und `failedSave` per Referenz, so wie die Dependency-Liste vorher.
  - Einziger Unterschied: Der Reset passiert im selben Render und nicht erst nach dem Commit, also einen Frame früher. Das ist nicht sichtbar.
  - Die Lade-Effekte geben bei `null` jetzt `undefined` zurück (`consistent-return`), ohne Auswirkung.
- **Autofix:**
  - Fixbare Regeln an `955252b`: Großteils Einrückung, Klammern und Quotes.
  - Inhaltlich relevante Fixes, alle geprüft und sicher: `prefer-template` (1, Test), `prefer-destructuring` (`wallAudioPlayer.ts`), `consistent-type-definitions` (4× `type` → `interface` in `context.ts`), `import-x/order` (`react-svg` vor die lokalen Importe in AdminScreen, ohne Nebenwirkungen), `no-useless-path-segments` (Bildpfad in WallScreen).
  - Dazu entfernt ESLint 9 per `--fix` die 12 unnötigen Disable-Kommentare.
  - Typecheck, Build und Unit-Tests sind auch auf `d14958b` grün.
- **Handarbeit, sonst gleichwertig:**
  - Komponenten als Funktionsdeklaration, Default-Exporte, Umbenennungen gegen Shadowing, `++` → `+= 1`, Zeilenumbrüche in styled-components-Templates (nur Leerraum; `calc` in `WallScreen.tsx` OverlayPanel geprüft, die `-` haben Leerraum auf beiden Seiten), `UNKNOWN_URL_MESSAGE` zusammengesetzt (ergibt denselben String), private Methode `start` → Modulfunktion `startPlayback`.
  - Stabile Keys: Labels in `ScreenControlBar` (eindeutig: WORLD/OFF bzw. BLACK/WHITE/OFF), `sounds[0].name` in `TopBar` (keine Gruppe ist leer), Pfad in `DocumentReader`.
- **Test-Umbau:**
  - `for…of` → `forEach` (synchrone Assertions, gleiche Werte).
  - `findInactiveScene` prüft weiterhin nacheinander, bricht bei der ersten inaktiven Szene ab und wirft denselben Fehler, wenn keine gefunden wird.
  - `createFakeVisibility()` hat dieselbe Schnittstelle. `listeners` bleibt erreichbar (genutzt in `gameTableConnection.spec.ts`:275); `visible` war von außen nie in Gebrauch.

**Blockierende Befunde**
- keine

**Nach dem Push prüfen**
- [ ] Die Frontend-CI ist grün, vor allem die Jobs `lint` und `quality` mit `npm ci` (lokal auf leerem Stand nachgestellt und grün).
- [ ] E2E (`npm run test:e2e`) und die manuellen Schritte 1–4 aus dem Plan; beides wurde nicht ausgeführt, Restrisiko siehe Hinweise.

**Hinweise**
- **Restrisiko durch fehlende E2E- und Browser-Checks:** aus meiner Sicht gering. Die einzigen echten Logikänderungen sind die Render-Resets (s. o., gleichwertig) und `DocumentReader`. Dort werden Überschriften und Bilder des Markdowns nicht mehr bei jedem Render neu gemountet (die Komponenten sind ausgelagert), und Seiten haben als Key den Pfad statt des Index. Sichtbar sollte das nicht sein. Ein E2E-Fall berührt den Bereich aber direkt (`adminNavigation`: Scroll-Position der Notizen nach Zu- und Aufklappen), deshalb vor der Abnahme durch den User einmal laufen lassen. Weniger sicher absichern lassen sich ohne Browser: React-Warnungen in der Konsole (Plan, manuell Schritt 4) und die CSS-Umbrüche (Annahme: rein Leerraum, im Code geprüft, nicht gerendert).
- **Kleine Abweichungen im Verhalten, die die Lint-Regeln erzwingen:**
  - `WallScreen.tsx` Weltkarte bekommt `alt=""`. Sie gilt damit für Screenreader als dekorativ. Lädt das Bild nicht, fehlt nur das Symbol für ein kaputtes Bild.
  - `src/utils/listbox.ts`: Der neue `default`-Zweig mit `never` gibt bei einer Taste, die es laut Typ nicht geben kann, zur Laufzeit diese Taste zurück statt `undefined`. Über die Typen und `isListboxNavigationKey` ist das nicht erreichbar.
- **`__tests__/tsconfig.json` ist als TS-Projekt nicht fehlerfrei:** `tsc -p __tests__/tsconfig.json --noEmit` meldet 9 Fehler: `selenium-webdriver` ohne Typen (3×), implizite `any` in `selectScene.ts` (5×), `import.meta.env` in `src/api/apiClient.ts`, weil `src/vite-env.d.ts` nicht eingebunden ist. Auf Lint (0 Funde) und CI hat das keinen Einfluss. Der Kommentar in der Datei und `frontend/CLAUDE.md` versprechen aber auch Editoren ein Projekt; dort erscheinen diese Fehler.
- **Veraltete Zahlen:** `docs/known-issues.md`:57-59 nennt noch die jscpd-Werte der DND-31-Baseline (88 von 4221 Zeilen, 2,08 %; NavRail↔SideBarLeftElement 11 Zeilen, darkTheme↔tavernTheme 17 Zeilen). Jetzt sind es 92 von 4543 Zeilen (2,03 %), 13 bzw. 19 Zeilen, weiterhin 6 Klone. Die Datei lag nicht im Doku-Scope; Nachziehen per Kurzweg möglich.
- **Gelockerte Lint-Regeln:** Durch den Wechsel auf Airbnb gelten einige frühere eigene Regeln nicht mehr so streng: `curly` von `all` auf `multi-line`, `camelcase` mit `properties: 'always'` entfällt (für TS nur noch `naming-convention` ohne Properties), `import/order` ohne alphabetische Sortierung und Leerzeilen zwischen Gruppen. Das entspricht dem Plan („eigene Regeln, die Airbnb abdeckt, entfallen“) und steht hier nur zur Kenntnis.
- **ESLint-Version:** npm meldet `eslint@9.39.5` als „no longer supported“. Das ist planmäßig (E1, ESLint 10 wird noch nicht unterstützt); umsteigen, sobald airbnb-extended ESLint 10 unterstützt.
- **Blame-Hash:** `.git-blame-ignore-revs` hängt am Hash von `d14958b`. Vor dem Push nicht rebasen oder amenden. Lokal wirkt die Datei nur mit `git config blame.ignoreRevsFile .git-blame-ignore-revs`; GitHub liest sie automatisch.
- **Commit-Typ:** Alle drei Commits sind `refactor` wie der Plan-Typ, obwohl Commit 1 reines Tooling ist. Das passt zum Schema „Commit-Typ = Plan-Typ“ und ist kein Befund. Die Bodies bestehen nur aus `*`-Stichpunkten, es gibt keine KI-Signaturen.

**Checks:** Frontend (Node v24.15.0), lokal und nach frischem `npm ci` im temporären Worktree: `npm run lint` Exit 0 (0 Fehler, 0 Warnungen, 81 Dateien), `typecheck` Exit 0, `test:unit` 158/158 grün (19 Dateien), `build` Exit 0 (nur der bekannte Hinweis zur Chunk-Größe), `check:deadcode` Exit 0, `check:dupes` Exit 0 (2,03 % < 2,09). Autofix-Commit auf `955252b` nachgestellt: kein Unterschied zu `d14958b`, dort Typecheck, Build und 158 Unit-Tests grün. E2E und manuelle Prüfung nicht ausgeführt; CI erst nach dem Push.
