# DND-30: Frontend auf Node 24

**Typ:** setup
**Status:** Im Review

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
