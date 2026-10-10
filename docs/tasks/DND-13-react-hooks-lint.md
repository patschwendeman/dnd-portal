# DND-13: React-Hooks-Lint aktivieren, Effect-Abhängigkeiten und veraltete Antworten bereinigen

**Typ:** setup
**Status:** Fertig

## Kontext & Ziel

`eslint-plugin-react-hooks` ist im Frontend installiert, in `frontend/eslint.config.js` aber nicht eingebunden
(Known Issue). Das Plugin wird aktiviert, damit unvollständige `useEffect`-Abhängigkeiten künftig in Lint und CI
auffallen. Probelauf (2026-10-10): `rules-of-hooks` 0 Verstöße, `exhaustive-deps` **5 Befunde**, alle nach demselben
Muster: Eine Ladefunktion wird im Component-Body definiert und im Effect aufgerufen. Bei der Bereinigung wird
zusätzlich verhindert, dass beim schnellen Szenen- bzw. Tab-Wechsel eine veraltete Antwort die aktuelle überschreibt.

## Invarianten

- Was die Screens laden und anzeigen, bleibt gleich: Admin, Wall, Ground und DocumentReader laden zu denselben
  Anlässen (Mount, Wechsel von `activeSceneId` bzw. `selectedStoryIndex`, Retry im Admin Screen) dieselben Daten.
- **Einzige gewollte Verhaltensänderung:** Ändert sich der Anlass, bevor eine Ladeanfrage antwortet, wird deren Ergebnis
  bzw. Fehler verworfen (kein State-Update, kein Fehlerhinweis). Es zählt nur die Antwort zum aktuellen Stand.
- Fehlerbehandlung aus DND-11 bleibt: kein unhandled rejection, Fehlerhinweis und Retry im Admin Screen, Konsolenlog
  auf Wall und Ground.
- Musik (DND-10): `music.setPlaylist` wird weiterhin bei jedem Laden der aktiven Szene aufgerufen. `useMusicPlayer` bleibt unverändert.
- API, Services (`src/services/*`) und Routen bleiben unverändert.
- Keine `eslint-disable`-Kommentare für `react-hooks/*`.

## Scope / Non-Goals

**Im Scope**
- `react-hooks/rules-of-hooks` und `react-hooks/exhaustive-deps` in `frontend/eslint.config.js`, beide `error`
- Die 5 Befunde: `DocumentReader.tsx:219`, `AdminScreen.tsx:184` und `:188`, `GroundScreen.tsx:94`, `WallScreen.tsx:144`
- Veraltete Antworten in genau diesen 5 Effects verwerfen
- Unit-Test für den neuen Lade-Helper

**Nicht im Scope**
- Echtes Abbrechen der HTTP-Requests (`AbortController`, Signal-Parameter in den Services)
- Neue Test-Abhängigkeiten (z. B. Testing Library) oder Komponententests
- Die bestehende Lint-Warnung `styled-components-a11y/alt-text` in `WallScreen.tsx` und andere Known Issues
  (z. B. `noneFight`-Pfad im DocumentReader)
- Upgrade von ESLint oder `eslint-plugin-react-hooks` (bleibt `5.1.0-rc`)

## Entscheidungen

### E1: Typ `setup`
- **Entscheidung:** Kern ist die Aktivierung einer Lint-Regel. Die Code-Anpassungen sind nötig, damit Lint grün bleibt.
- **Verworfene Alternativen:** `refactor`, `chore`
- **Begründung:** Mit dem User abgestimmt.

### E2: Schweregrad `error`
- **Entscheidung:** `rules-of-hooks` und `exhaustive-deps` stehen beide auf `error`.
- **Verworfene Alternativen:** `warn` (Plugin-Standard; CI bliebe bei neuen Lücken grün)
- **Begründung:** Die Lücke soll nicht wieder entstehen. Die CI schlägt nur bei Fehlern fehl.

### E3: Beheben statt ausnehmen, je nach Stelle
- **Entscheidung:**
  - `DocumentReader`: `markdownLists` auf Modulebene verschieben (besteht nur aus Modulkonstanten).
  - `GroundScreen`, `WallScreen`: Ladefunktion in den Effect verschieben. Reine Hilfsfunktionen (`determineMediaType`)
    wandern auf Modulebene.
  - `AdminScreen`: Ladefunktionen in die Effects verschieben. `retryLoading` erhöht nur einen Zähler
    (`reloadCount`-State), der in beiden Effects als Abhängigkeit steht. Damit läuft jedes Laden über einen Effect,
    `useCallback` wird nicht gebraucht.
- **Verworfene Alternativen:** überall `useCallback` (mehr Boilerplate, Abhängigkeitsketten bis `handle*`);
  `eslint-disable` (Ausnahmen bleiben); Funktionen „blind“ ins Array (Effect liefe bei jedem Render → Endlos-Laden)
- **Begründung:** Mit dem User abgestimmt („gemischt“). Für Admin ersetzt der Retry-Zähler `useCallback`, damit auch
  der Retry von E4 erfasst wird.

### E4: Veraltete Antworten verwerfen (Ignore-Flag)
- **Entscheidung:** Jeder der 5 Effects setzt beim Cleanup ein Flag (`stale`). Danach eintreffende Ergebnisse und Fehler
  werden ignoriert. Umgesetzt mit einem Helper `loadLatest` in derselben Datei wie `loadSafely`, aufgebaut auf
  `loadSafely`:
  `loadLatest<T>(load: () => Promise<T>, apply: (result: T) => void, onError: (error: unknown) => void, isStale: () => boolean): Promise<void>`.
  `apply` und `onError` werden nur aufgerufen, wenn `isStale()` zu diesem Zeitpunkt `false` liefert.
- **Verworfene Alternativen:** `AbortController` (Signal durch alle Services durchreichen, größerer Eingriff);
  Race bestehen lassen.
- **Begründung:** Mit dem User abgestimmt (mitbeheben). Der Ignore-Flag ist das Standardmuster für Effects, kommt ohne
  Service-Änderungen aus, und die Logik lässt sich ohne neue Test-Abhängigkeiten per vitest prüfen.

## Subtasks

### Frontend
- [x] `src/utils/loadSafely.ts`: `loadLatest` gemäß E4 ergänzen
- [x] `__tests__/unit/`: Tests für `loadLatest`:
  - Ergebnis wird angewendet, wenn nicht veraltet
  - Ergebnis wird verworfen, wenn veraltet
  - Fehler geht an `onError`, wenn nicht veraltet
  - Fehler wird verworfen, wenn veraltet
  - kein unhandled rejection
- [x] `DocumentReader.tsx`: `markdownLists` auf Modulebene, Effect mit `loadLatest` und Cleanup-Flag
- [x] `GroundScreen.tsx`, `WallScreen.tsx`: Ladefunktion in den Effect, `loadLatest` und Cleanup-Flag
- [x] `AdminScreen.tsx`: beide Ladefunktionen in ihre Effects, `loadLatest` und Cleanup-Flag. `reloadCount`-State,
      `retryLoading` erhöht ihn, beide Effects hängen davon ab (E3).
- [x] `eslint.config.js`: Plugin `react-hooks` einbinden, beide Regeln `error` (E2)

### Doku
- [x] `docs/known-issues.md`: Eintrag zu `eslint-plugin-react-hooks` entfernen
- [x] `frontend/CLAUDE.md`: Hinweis „installiert, aber nicht aktiv“ (Abschnitt „Wichtig beim Ändern“) entfernen.
      Unter „Konventionen“ ergänzen: Hooks-Regeln werden erzwungen, Ladevorgänge in Effects laufen über `loadLatest`.
- [x] `docs/architecture.md` (Abschnitt zu `loadSafely`, ca. Z. 74): um `loadLatest` und das Verwerfen
      veralteter Antworten ergänzen

## Akzeptanzkriterien (nur setup)
- [x] AK1: `react-hooks/rules-of-hooks` und `react-hooks/exhaustive-deps` sind in `frontend/eslint.config.js` als `error`
      aktiv. `npm run lint` meldet 0 Fehler, einzige verbleibende Warnung ist die bestehende `alt-text`-Warnung.
- [x] AK2: Wirksamkeit nachgewiesen. Eine probeweise eingefügte fehlende Abhängigkeit lässt `npm run lint` mit
      `react-hooks/exhaustive-deps` als Fehler scheitern (danach zurückgenommen). Keine `eslint-disable`-Kommentare für `react-hooks/*`.
- [x] AK3: Alle Invarianten eingehalten. Die einzige Verhaltensänderung ist das Verwerfen veralteter Antworten.
      Das belegen die Unit-Tests für `loadLatest` und die manuelle Prüfung.
- [x] AK4: `npm run typecheck`, `npm run test:unit` und `npm run build` grün. Bestehende Tests inhaltlich unverändert.

## Teststrategie / Verifikation

**Automatisch**
- Frontend (Unit): neue `loadLatest`-Tests; bestehende Unit-Tests (u. a. `loadSafely.spec.ts`) unverändert grün
- Lint, Typecheck, Build

**Manuell** (lokaler Stack, Admin, Wall und Ground als Fenster im selben Browser)
1. Admin: Szene wechseln. Wall und Ground zeigen die neue Szene, die Musik wechselt auf deren Playlist (wie bisher).
2. Mehrere Szenen schnell nacheinander wählen. Am Ende zeigen alle Screens die zuletzt gewählte Szene.
3. Backend stoppen, Admin neu laden. Der Fehlerhinweis erscheint. Backend starten, Retry. Daten erscheinen, der Hinweis verschwindet.
4. Admin Screen, Notizen (DocumentReader): Tabs schnell wechseln. Es erscheint der Inhalt des zuletzt gewählten Tabs.
5. DevTools-Konsole: keine Endlos-Requests (Netzwerk-Tab ruhig nach dem Laden), keine unhandled rejections.

## Offene Fragen
- keine

## Review

### Runde 1 – Review 4459754

**Empfehlung:** Nacharbeiten, nur wegen der fehlenden manuellen Prüfung (AK3). Im Code keine blockierenden Befunde;
lint, typecheck, test:unit und build grün. Voraussichtlich keine Codeänderung nötig.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Beide Regeln `error`, Lint 0 Fehler, nur `alt-text`-Warnung | erfüllt | `frontend/eslint.config.js:4,19,65-66`; `npm run lint`: 0 errors, 1 warning (`styled-components-a11y/alt-text`, `WallScreen.tsx:165`, vormals `:161`) |
| AK2 Wirksamkeit, keine `eslint-disable` für `react-hooks/*` | erfüllt | Per `eslint --stdin`: `GroundScreen.tsx` mit `[]` → `97:8 error … exhaustive-deps`, Exit 1; bedingter Hook → `rules-of-hooks` error, Exit 1; kein `eslint-disable` in `src/`, `__tests__/` |
| AK3 Invarianten, einzige Verhaltensänderung belegt | nicht prüfbar | Unit-Tests und Code-Analyse decken die Invarianten; manuelle Prüfung (Teststrategie 1–5) fehlt, lokaler Stack lief nicht |
| AK4 Typecheck, Unit-Tests, Build grün, Tests unverändert | erfüllt | `tsc -b` Exit 0; vitest 57/57 (7 Dateien, 5 neu in `loadLatest.spec.ts`); build ✓; bestehende Tests unverändert |

**Statische Prüfung der Invarianten:**
- Ladeanlässe: Admin-Daten bei Mount/Retry (`AdminScreen.tsx:174`, `[reloadCount]`), Szene bei Mount/`activeSceneId`/Retry (`:197`); Wall (`WallScreen.tsx:148`) und Ground (`GroundScreen.tsx:97`) an `[activeSceneId]`, DocumentReader an `[selectedStoryIndex]` (`DocumentReader.tsx:232`); unveränderte Service-Aufrufe
- Retry über `reloadCount` statt direkter Aufrufe: gleichwertig (E3)
- `setMusicPlaylist` im Dependency-Array (`AdminScreen.tsx:143,197`): stabil (`useCallback(..., [player])`, `useMusicPlayer.ts:36`), keine zusätzlichen Effect-Läufe; `useMusicPlayer` unverändert
- Fehlerbehandlung (DND-11): `loadLatest` baut auf `loadSafely` auf, keine unhandled rejections; Admin setzt `*Failed`, Wall/Ground loggen
- API, Services, Routen nicht im Diff

**Scope/Konventionen:** Alle Subtasks im Diff, nichts außerhalb des Scopes; ein Commit `setup(DND-13): …` ohne
KI-Signatur; Doku stimmt mit Code überein.

#### Blockierende Befunde
- [x] AK3: Manuelle Prüfung nach Teststrategie 1–5 im lokalen Stack durchführen und Ergebnis festhalten (erledigt, siehe unten)

#### Hinweise (nicht blockierend)
- Kein Commit `docs(DND-13): approve plan`; Plan und README-Eintrag kamen erst mit 4459754 ins Repo (wie bei DND-12)
- `determineMediaType` auf Modulebene (`GroundScreen.tsx:40`): nicht im Plan, aber nötig für `exhaustive-deps`; rein, Verhalten gleich
- AK1, AK2, AK4 vom Implementer vor dem Review abgehakt
- `DocumentReader.tsx:17`: `markdownLists` zwischen Glob-Konstanten und nachgestelltem `import arrowUpIcon` (Altlast, Lesbarkeit)
- `GroundScreen.tsx`: Leerzeichen am Zeilenende in `activeScene.graphics_ground.source ` mitübernommen (trivial)
- `StrictMode` (`main.tsx`): im Dev-Modus zwei Requests pro Mount, das erste Ergebnis wird verworfen (erwartet)
- Zeilenangabe der `alt-text`-Warnung im Plan (`:161`) ist jetzt `:165`

#### Checks
- `npm run lint`: 0 Fehler, 1 Warnung (bestehende `alt-text`)
- `npm run typecheck`: grün
- `npm run test:unit`: 57/57 grün
- `npm run build`: grün

#### Manuelle Prüfung (AK3, nach dem Review, 2026-10-10)
Lokaler Dev-Stack (`compose.dev.yaml`), Admin, Wall und Ground als Tabs im selben Browser. Für die Race-Fälle wurden
einzelne Antworten im Browser künstlich um 3 s verzögert (XHR- bzw. `fetch`-Wrapper, kein Code geändert).
1. Szenenwechsel Default → Shop: Admin, Wall (`wall_screen/shop.jpg`) und Ground (`ground_screen/shop.jpg`) zeigen Shop,
   Musik wechselt auf die Shop-Playlist – ok
2. `/scenes/details/3` (Tavern) verzögert, Tavern → Shop direkt nacheinander: Die Tavern-Antwort kommt nach der von Shop
   und wird verworfen; alle drei Screens und die Musik bleiben bei Shop – ok
3. `dnd-dev-api` gestoppt, Admin neu geladen: Hinweis „Backend nicht erreichbar“; API gestartet, Retry: Daten erscheinen,
   Hinweis weg – ok. Pro Ladevorgang nur ein Fehlerlog (verworfener StrictMode-Lauf loggt nicht)
4. Notizen `fight/*` verzögert, Fight → Leveling direkt nacheinander: Leveling bleibt nach Eintreffen der Fight-Antworten
   sichtbar – ok
5. 8 s Leerlauf: 0 neue Requests in Admin, Wall und Ground; keine unhandled rejections, Wall/Ground ohne Konsolenfehler – ok

### Runde 2 – Review 6ed1e76

**Empfehlung:** Abnahme. Runde 2 setzt nur die drei Hinweise aus Runde 1 um, ohne Verhaltensänderung; alle AKs erfüllt
(AK3 inkl. dokumentierter manueller Prüfung).

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Beide Regeln `error`, Lint 0 Fehler, nur `alt-text`-Warnung | erfüllt | `eslint.config.js` unverändert seit Runde 1; `npm run lint`: 0 errors, 1 warning (`alt-text`, `WallScreen.tsx:165`) |
| AK2 Wirksamkeit, keine `eslint-disable` für `react-hooks/*` | erfüllt | Nachweis aus Runde 1, Konfiguration unverändert; `grep eslint-disable` (hooks) in `src/`, `__tests__/` leer |
| AK3 Invarianten, einzige Verhaltensänderung | erfüllt | Statische Prüfung Runde 1, 5 `loadLatest`-Tests grün, manuelle Prüfung 1–5 ok; Runde 2 ohne Verhaltenseinfluss |
| AK4 Typecheck, Unit-Tests, Build grün, Tests unverändert | erfüllt | typecheck Exit 0; vitest 57/57 (7 Dateien); build ✓; keine Testdatei geändert |

**Diff 6ed1e76:**
- `DocumentReader.tsx`: `import arrowUpIcon` in den Import-Block verschoben (Imports werden gehoisted, kein Verhaltenseinfluss)
- `GroundScreen.tsx:80`: Leerzeichen am Zeilenende entfernt
- Plan: Zeilenangabe `alt-text` `:161` → `:165`, E3 um `determineMediaType` auf Modulebene ergänzt; dazu Bericht Runde 1, manuelle Prüfung, AK3 abgehakt

**Scope/Konventionen:** Ein Commit pro Runde (4459754, 6ed1e76), Schema und Typ `setup` passen, keine KI-Signatur,
alle Subtasks abgehakt, nichts außerhalb des Scopes.

#### Blockierende Befunde
- keine

#### Hinweise (nicht blockierend)
- Kein Commit `docs(DND-13): approve plan`; der Plan kam erst mit 4459754 ins Repo (wie Runde 1)

#### Checks
- `npm run lint`: 0 Fehler, 1 Warnung (bestehende `alt-text`, `WallScreen.tsx:165`)
- `npm run typecheck`: grün
- `npm run test:unit`: 57/57 grün
- `npm run build`: grün

### Runde 3 – Review c22db85

**Empfehlung:** Abnahme (Runde 3 und gesamter Task). Runde 3 entfernt bzw. kürzt nur Kommentare, keine Logik;
alle AKs erfüllt, alle Checks grün.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Beide Regeln `error`, Lint 0 Fehler, nur `alt-text`-Warnung | erfüllt | `eslint.config.js` seit Runde 1 unverändert; `npm run lint`: 0 errors, 1 warning (`alt-text`, `WallScreen.tsx:164`) |
| AK2 Wirksamkeit, keine `eslint-disable` für `react-hooks/*` | erfüllt | Nachweis aus Runde 1, Konfiguration unverändert; kein `eslint-disable` in `src/`, `__tests__/` |
| AK3 Invarianten, einzige Verhaltensänderung | erfüllt | Statische und manuelle Prüfung aus Runde 1, 5 `loadLatest`-Tests grün; Dependency-Arrays unverändert (`AdminScreen.tsx:173`, `:195`) |
| AK4 Typecheck, Unit-Tests, Build grün, Tests unverändert | erfüllt | `tsc -b` Exit 0; vitest 57/57; build ✓; keine Testdatei geändert |

**Diff c22db85:**
- 5 Kommentare über `return () => { stale = true }` gelöscht (`DocumentReader.tsx`, `AdminScreen.tsx` ×2, `GroundScreen.tsx`, `WallScreen.tsx`)
- `AdminScreen.tsx:145`: Kommentar zu `reloadCount` gekürzt
- Sonst keine Code-Änderung; im Plan nur Bericht Runde 2

**Verbleibende Kommentare:** alle korrekt und erklären das Warum
- `loadSafely.ts:14-15` (`loadLatest`): entspricht der Implementierung (Prüfung vor `apply` und `onError`)
- `AdminScreen.tsx:142` (`setMusicPlaylist` stabil): `setPlaylist` ist `useCallback(..., [player])`, `player` aus `useState` (`useMusicPlayer.ts:19,36`)
- `AdminScreen.tsx:145` (`reloadCount`): `retryLoading` erhöht den Zähler, beide Effects hängen davon ab
- „Players see no error…“ (`WallScreen.tsx:136`, `GroundScreen.tsx:85`): passt zur Fehlerbehandlung

**Scope/Konventionen:** Ein Commit pro Runde (4459754, 6ed1e76, c22db85), Schema und Typ passen, keine KI-Signatur.

#### Blockierende Befunde
- keine

#### Hinweise (nicht blockierend)
- Zeilenangabe der `alt-text`-Warnung im Abschnitt Scope (`:165`) veraltet, jetzt `:164` → beim Abschluss Zeilenangabe dort entfernt; ältere Berichte bleiben
- Kein Commit `docs(DND-13): approve plan` (wie Runde 1 und 2)

#### Checks
- `npm run lint`: 0 Fehler, 1 Warnung (bestehende `alt-text`, `WallScreen.tsx:164`)
- `npm run typecheck`: grün
- `npm run test:unit`: 57/57 grün
- `npm run build`: grün
