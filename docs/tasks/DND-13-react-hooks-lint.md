# DND-13: React-Hooks-Lint aktivieren, Effect-Abhängigkeiten und veraltete Antworten bereinigen

**Typ:** setup
**Status:** Im Review

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
- Die bestehende Lint-Warnung `styled-components-a11y/alt-text` (`WallScreen.tsx:161`) und andere Known Issues
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
  - `GroundScreen`, `WallScreen`: Ladefunktion in den Effect verschieben.
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
- [ ] AK3: Alle Invarianten eingehalten. Die einzige Verhaltensänderung ist das Verwerfen veralteter Antworten.
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
