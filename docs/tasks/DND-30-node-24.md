# DND-30: Frontend auf Node 24

**Typ:** setup
**Status:** Fertig

## Kontext & Ziel

Das Frontend läuft auf Node 18 (`.nvmrc`, `node:18-slim` im `Dockerfile`, CI über `.nvmrc`). Node 18 und Node 20
sind EOL. knip 6, das DND-31 einführt, braucht Node ≥ 20.19. Ziel: Frontend lokal, in Docker und in der CI auf
Node 24 (aktuelles LTS) heben. `@types/node` wird direkte Dev-Abhängigkeit auf der 24.x-Linie, bisher war es nur
transitiv da (22.5.4).

## Invarianten

- App-Verhalten unverändert, kein App-Code geändert.
- Keine weiteren Dependency-Upgrades außer `@types/node`.
- Workflows unverändert, die CI liest die Version weiter aus `frontend/.nvmrc`.

## Scope / Non-Goals

**Im Scope**
- `frontend/.nvmrc` `18` → `24`, `frontend/Dockerfile` `node:18-slim` → `node:24-slim` (Stages `dev` und `build`).
- `@types/node` `^24.19.2` als Dev-Abhängigkeit (`vite.config.ts` nutzt `process`).
- Doku: Node-Version in `frontend/CLAUDE.md`, `frontend/README.md`, `docs/architecture.md`.

**Nicht im Scope**
- Weitere Dependency-Upgrades (Vite, ESLint, jest …).
- Backend (Python).

## Entscheidungen

### E1: Node 24 statt 22 oder 26
- **Entscheidung:** Node 24.
- **Verworfene Alternativen:** Node 22 (Maintenance-LTS bis 04/2027, nächstes Upgrade käme bald), Node 26 (LTS erst ab
  Ende Oktober 2026).
- **Begründung:** Aktuelles LTS, läuft lokal schon (v24.15).

### E2: Eigener Task vor DND-31
- **Entscheidung:** Das Node-Upgrade ist ein eigener Task. DND-31 setzt darauf auf.
- **Verworfene Alternativen:** knip 5.88.1 (letzte Version mit Node 18); nur der knip-Job auf Node 22.
- **Begründung:** Vorgabe des Users. Lokal, in Docker und in der CI läuft dieselbe Node-Version.

## Subtasks

### Frontend
- [x] `frontend/.nvmrc` auf `24`.
- [x] `frontend/Dockerfile`: `node:24-slim` in den Stages `dev` und `build`.
- [x] `@types/node` `^24.19.2` in `devDependencies`, `package-lock.json` neu erzeugt.

### Doku
- [x] `frontend/CLAUDE.md` (Node-Version), `frontend/README.md` (nativer Start), `docs/architecture.md`
      (Abschnitt „Lokal starten“ und Tabelle „Qualitätssicherung“).

## Akzeptanzkriterien (nur setup)
- [x] AK1: `.nvmrc`, `Dockerfile` (dev, build) und Doku nennen Node 24. `@types/node` steht auf 24.x.
- [ ] AK2: Wirksamkeit nachgewiesen: Unter Node 24 sind `npm ci`, `npm run build`, `typecheck`, `lint` und
      `test:unit` grün, die Images `--target prod` und `--target dev` bauen. Nach dem Push ist die Frontend-CI grün.
      (Lokal nachgewiesen; Frontend-CI nach Push zu prüfen.)
- [x] AK3: Alle Invarianten eingehalten – App-Verhalten unverändert.

## Teststrategie / Verifikation

**Automatisch**
- Frontend: `npm ci`, `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test:unit` unter Node 24.

**Manuell**
1. `docker build --target prod -t dnd-portal-frontend:node24 .` und `--target dev` in `frontend/`.

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-10-24
**Empfehlung:** Abnahme

Offen ist nur der Teil von AK2, den man erst nach dem Push prüfen kann: Die Frontend-CI muss grün sein. Geprüft wurde Commit `1e08c3d`, die Checks liefen in einem temporären Worktree.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `frontend/.nvmrc`:1 = `24`. `frontend/Dockerfile`:7 und :22 `node:24-slim` (Stages `dev`, `build`). `package.json`: `"@types/node": "^24.19.2"`, das Lockfile hat 24.19.2 (`npm ls` zeigt nur diese Version, deduped). Doku: `frontend/CLAUDE.md`:53, `frontend/README.md`:31, `docs/architecture.md`:391 und :449. Node 18 steht nur noch in abgeschlossenen Task-Plänen |
| AK2 | lokal erfüllt, CI nach dem Push prüfen | Node v24.15.0 / npm 11.12.1: `npm ci` ok, das Lockfile bleibt danach unverändert. `build`, `typecheck` und `lint` mit Exit 0. `test:unit` 19 Dateien / 158 Tests grün. `generate:api` ändert `schema.d.ts` nicht. Docker `--target prod` und `--target dev` bauen, im Dev-Image läuft v24.22.1 |
| AK3 | erfüllt | Kein Code unter `src/` geändert. Im Lockfile ändern sich nur `@types/node` und dessen Abhängigkeit `undici-types` (6.19.8 → 7.24.6). `.github/workflows/frontend.yml` unverändert, alle 4 Jobs lesen `frontend/.nvmrc` |

**Blockierende Befunde**
- keine

**Nach dem Push prüfen**
- [ ] Die Frontend-CI ist grün, und das setup-node-Log zeigt v24 (AK2).

**Hinweise**
- Die Lint-Warnung `styled-components-a11y/alt-text` in `frontend/src/screens/WallScreen.tsx:157` gab es schon vorher (aus DND-29).
- `undici-types` wurde zwangsläufig mit `@types/node` 24 angehoben. Das zählt nicht als weiteres Dependency-Upgrade.
- Die Audit-Funde von `npm ci` gab es schon vorher. Sie liegen außerhalb des Scopes.
- Die alten Task-Pläne (DND-1/2/3/12) nennen weiter Node 18. Sie sind historisch und bleiben bewusst so.

**Checks:** Lint grün (1 Warnung, schon vorher vorhanden), Unit-Tests 158 grün, Build und Typecheck grün, Docker prod/dev bauen. CI erst nach dem Push.
