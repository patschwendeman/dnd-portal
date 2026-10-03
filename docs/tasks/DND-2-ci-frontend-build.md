# DND-2: CI: Frontend-Build (tsc + vite build)

**Typ:** setup
**Status:** Fertig

## Kontext & Ziel

`npm run build` (`tsc -b && vite build`) läuft nicht in der CI. ESLint prüft keine Typen und vitest typprüft nicht –
deshalb blieben 13 tsc-Fehler unbemerkt (behoben in `268444c` und `f9a4534`; seitdem ist der Build lokal grün,
~1,3 s). Ziel: Typfehler und Build-Brüche im Frontend werden bei jedem Push erkannt.

## Invarianten

- Trigger und `paths` von `.github/workflows/frontend.yml` unverändert.
- Jobs `lint` und `test` unverändert – bis auf `needs: build` (E1).
- App-Code, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json` unverändert.
- `.github/workflows/backend.yml` unverändert.

## Scope / Non-Goals

**Im Scope**
- Dritter Job `build` in `.github/workflows/frontend.yml`.
- Doku zur CI aktualisieren.

**Nicht im Scope**
- Chunk-Size-Warnung von Vite (Haupt-Chunk ~547 kB) beheben.
- Build-Artefakt (`dist/`) hochladen.
- E2E-Tests in der CI.
- Backend.

## Entscheidungen

### E1: Eigener Job `build`, der vor `lint` und `test` läuft
- **Entscheidung:** Neuer Job `build` mit eigenem Checkout/Setup/Install. `lint` und `test` erhalten
  `needs: build` und laufen erst nach erfolgreichem Build (untereinander weiterhin parallel).
- **Verworfene Alternativen:** Build als zusätzlicher Schritt im Job `test`; `build` parallel zu `lint` und `test`
  ohne `needs` (ursprüngliche Fassung, nach Review-Runde 1 vom User geändert).
- **Begründung:** Wie E3 in DND-1 – klarer Status je Prüfung in der GitHub-UI; `npm ci` ist dank Cache günstig.
  Laut User-Vorgabe soll der Build als erste Prüfung laufen; bricht er, laufen Lint und Tests nicht mehr.

### E2: Kein Artefakt-Upload
- **Entscheidung:** `dist/` wird nicht als Artefakt hochgeladen.
- **Begründung:** Es gibt kein Deployment, das das Build-Ergebnis braucht; der Job dient nur der Prüfung.

### E3: Chunk-Size-Warnung blockiert nicht
- **Entscheidung:** Die Vite-Warnung „Some chunks are larger than 500 kB“ lässt den Job nicht fehlschlagen
  (Vite beendet sich trotzdem mit Exit 0). Sie wird in `docs/known-issues.md` vermerkt.
- **Verworfene Alternativen:** Warnung per `build.chunkSizeWarningLimit` unterdrücken oder Code-Splitting jetzt
  einführen – beides außerhalb des Scopes.

## Subtasks

### CI
- [x] `.github/workflows/frontend.yml`: Job `build` mit `actions/checkout@v4`, `actions/setup-node@v4`
      (Node 18, `cache: npm`, `cache-dependency-path: frontend/package-lock.json`), `npm ci`, `npm run build`
      (`defaults.run.working-directory: frontend` gilt bereits).
- [x] `.github/workflows/frontend.yml`: Jobs `lint` und `test` erhalten `needs: build` (Änderung nach Review-Runde 1).

### Doku
- [x] `CONTRIBUTING.md` (Abschnitt „CI“), `docs/architecture.md` (Tabelle, Zeile „CI“) und `frontend/CLAUDE.md`
      (Abschnitt „CI“): Frontend-Workflow hat jetzt die Jobs `lint`, `test` und `build` (`tsc -b && vite build`);
      E2E läuft weiterhin nicht in der CI.
- [x] `docs/known-issues.md` (Abschnitt Frontend): Hinweis „`vite build` warnt: Haupt-Chunk ~547 kB > 500 kB
      (kein Code-Splitting)“ ergänzen.
- [x] Dieselben drei Dateien (CI-Abschnitte): Reihenfolge beschreiben – erst `build`, danach `lint` und `test`
      parallel (`needs: build`); „parallele Jobs“ für das Frontend korrigieren (Änderung nach Review-Runde 1).

## Akzeptanzkriterien

- [ ] AK1: `frontend.yml` enthält den Job `build` mit Node 18, npm-Cache, `npm ci` und `npm run build`;
      `lint` und `test` haben `needs: build`, `build` selbst hat kein `needs`.
- [ ] AK2: Wirksamkeit nachgewiesen: Nach Push auf `development` sind alle drei Jobs grün und `lint`/`test`
      starten erst nach Ende von `build`; Run-URL und Dauer des Jobs `build` im Review festgehalten. Zusätzlich lokal gezeigt, dass `npm run build` bei einem absichtlich
      eingefügten Typfehler mit Exit ≠ 0 endet (Änderung nicht committen).
- [ ] AK3: Invarianten eingehalten – `git diff --stat` über die Commits von DND-2 zeigt nur `frontend.yml`,
      Doku-Dateien und `docs/tasks/*`.

## Teststrategie / Verifikation

**Automatisch**
- Lokal in `frontend/`: `npm ci && npm run build` (Exit 0), `npm run lint`, `npm run test:unit` unverändert grün.
- Workflow-Syntax prüfen (z. B. `actionlint`, falls verfügbar).

**Manuell**
1. Lokal einen Typfehler einfügen (z. B. `const x: number = 'a'` in einer Komponente), `npm run build` →
   Exit ≠ 0; Änderung verwerfen.
2. Nach Push (nur nach Bestätigung durch den User) in GitHub Actions Status und Dauer der drei Jobs prüfen.

## Offene Fragen

- keine

## Review
<!--
Wird von der Hauptsession im Skill /deliver-task gepflegt – nicht beim Planen ausfüllen.
Pro Review-Runde ein Eintrag; ältere Runden bleiben stehen.
-->

### Runde 1 – 2026-10-03
**Empfehlung:** Abnahme

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `.github/workflows/frontend.yml:60-78`: Job `build` ohne `needs`, `actions/checkout@v4`, `actions/setup-node@v4` mit `node-version: 18`, `cache: npm`, `cache-dependency-path: frontend/package-lock.json`, `npm ci`, `npm run build`. `lint`, `test` und `build` starten in der CI gleichzeitig (14:30:48Z). |
| AK2 | erfüllt | Run [37129850515](https://github.com/patschwendeman/dnd-portal/actions/runs/37129850515) (Frontend CI, Push auf `development`, Commit `2eb67e2`, success): [build](https://github.com/patschwendeman/dnd-portal/actions/runs/37129850515/job/111222620608) grün in 33 s, test grün in 27 s, lint grün in 58 s. Typfehler lokal nachgestellt (`export const dnd2TypeErrorCheck: number = 'a'` in `src/app/App.tsx`): `npm run build` → TS2322, Exit 2; danach verworfen. |
| AK3 | erfüllt | `git diff --stat fe90c5c..2eb67e2`: nur `.github/workflows/frontend.yml`, `CONTRIBUTING.md`, `docs/architecture.md`, `docs/known-issues.md`, `frontend/CLAUDE.md`, `docs/tasks/*`. Trigger, `paths`, `lint`/`test` unverändert; kein Diff in `backend.yml`, `frontend/package*.json`, `tsconfig*`, `vite.config.ts`, `frontend/src`. |

**Blockierende Befunde**
- keine

**Hinweise**
- `CONTRIBUTING.md`: Beim Backend-Punkt steht zusätzlich „zwei Jobs `lint` und `test`“, weil „Je Workflow zwei Jobs“ nicht mehr stimmte. Passt zu `backend.yml`.
- Doku stimmt mit dem Workflow überein; Chunk-Warnung (~547 kB) in `docs/known-issues.md:40`.
- Commits nach Schema, ohne KI-Signatur.
- `actionlint` lokal nicht verfügbar; die Syntax ist durch den grünen CI-Lauf belegt.
- Bereits vorhanden: 3 Lint-Warnungen (`no-console`, `styled-components-a11y/alt-text`), 0 Fehler.

**Checks:** Lint Frontend 0 Fehler / 3 Warnungen (schon vorher vorhanden); `npm run test:unit` 5/5; `npm run build` Exit 0 in 1,29 s (Chunk-Warnung gemäß E3), mit Typfehler Exit 2; CI-Run 37129850515 alle drei Jobs grün.

### Nachtrag – 2026-10-03
Nach Runde 1 hat der User die Job-Reihenfolge geändert (E1: `build` zuerst, `lint`/`test` mit `needs: build`).
Lokale Checks grün. Keine Review-Runde 2: Der User hat die Änderung selbst getestet und abgenommen.

### Nachtrag 2 – 2026-10-03
Nach Abschluss per Kurzweg geändert (`af79f12 setup: add parallel typecheck job to frontend ci`): Die Typprüfung
ist aus dem Job `build` herausgelöst. `build` führt in der CI nur noch `npx vite build` aus; neuer Job `typecheck`
(`npm run typecheck` = `tsc -b`, neues Script in `frontend/package.json`) läuft mit `needs: build` parallel zu
`lint` und `test`. Grund: Mit `needs: build` hätte ein zusätzlicher Typecheck nach `npm run build` nie fehlschlagen
können; so prüft jeder Job genau eine Sache und Typfehler erscheinen als eigener Status. `npm run build` bleibt
lokal unverändert (`tsc -b && vite build`). AK1 („`build` mit `npm run build`“) beschreibt damit den Stand vor
dieser Änderung. Lokal geprüft: mit eingefügtem Typfehler `typecheck` Exit 2, `vite build` Exit 0.
