# DND-32: Airbnb-Styleguide als ESLint-Regeln, Frontend-Code angepasst

**Typ:** refactor
**Status:** Im Review

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
