# DND-1: CI ohne Docker-Image: Lint und Tests direkt auf dem Runner

**Typ:** setup
**Status:** Fertig

## Kontext & Ziel

Die Frontend-CI braucht ~11 min, davon ~640 s für „Build and push multi-arch Docker image“; Lint und Tests selbst
dauern ~4 s. Das Backend folgt demselben Muster (~2,5 min). Ursachen: Multi-Arch-Build (arm64 per QEMU, war für
einen Raspberry Pi gedacht, wird nicht mehr gebraucht), wirkungslose Caches (`~/.npm` außerhalb des Containers,
buildx ohne `--cache-from/--cache-to`), `public/` (306 MB) im Build-Kontext, Push nach GHCR und erneuter Pull nur
für Lint/Tests. Ein Deployment aus GHCR gibt es nicht. Ziel: Lint und Tests laufen direkt auf dem Runner, ohne
Docker und ohne GHCR – CI für beide Teile deutlich schneller.

## Invarianten

- Trigger unverändert: Push auf `main`/`development`, gefiltert auf `frontend/**` bzw. `backend/**` und die
  jeweilige Workflow-Datei.
- Geprüft wird dasselbe wie bisher, mit denselben Befehlen und Arbeitsverzeichnissen wie im Container:
  - Frontend: `npm run lint`, `npm run test:unit` (in `frontend/`)
  - Backend: `pylint src/`, `python -m unittest discover -s __tests__ -p "*.py"` (in `backend/`)
- Laufzeitversionen wie in den Dockerfiles: Node 18 (`frontend/Dockerfile`: `node:18-slim`), Python 3.11
  (`backend/Dockerfile`: `python:3.11-slim`).
- Lint oder Tests rot ⇒ Workflow rot (wie bisher).
- `frontend/Dockerfile`, `backend/Dockerfile`, beide `docker-compose.yml` bleiben unverändert; lokales
  `docker compose up` funktioniert wie bisher.
- App-Code, `package.json`, `package-lock.json`, `requirements.txt` unverändert.

## Scope / Non-Goals

**Im Scope**
- `.github/workflows/frontend.yml` und `.github/workflows/backend.yml` neu aufbauen (ohne Docker/GHCR).
- Doku zur CI aktualisieren.

**Nicht im Scope**
- Änderungen an Dockerfiles, `docker-compose.yml`, `.dockerignore` (z. B. `npm ci` im Dockerfile).
- Alte GHCR-Pakete `dnd-portal-frontend`/`-backend` – bleiben als Archiv stehen, werden nicht gelöscht.
- Neue Prüfungen in CI (Build, `tsc`, E2E) oder Versions-Upgrades (Node 18 ist EOL – separates Thema).
- Pull-Request-Trigger, Concurrency-Regeln.

## Entscheidungen

### E1: CI ohne Docker
- **Entscheidung:** Lint und Tests laufen direkt auf `ubuntu-latest` mit `actions/setup-node` bzw.
  `actions/setup-python`; kein Image-Build, kein Push nach GHCR.
- **Verworfene Alternativen:** Docker beibehalten, aber verschlankt (nur amd64, `--load` statt Push/Pull,
  buildx-Cache `type=gha`, `.dockerignore`) – bleibt bei Cache-Miss bei mehreren Minuten und baut ein Image,
  das niemand nutzt.
- **Begründung:** Das Image dient nur Lint/Tests; ein Deployment aus GHCR gibt es nicht. arm64 wird nicht
  mehr gebraucht.

### E2: Abhängigkeiten installieren und cachen
- **Entscheidung:** Frontend `npm ci` mit `setup-node`-Cache (`cache: npm`,
  `cache-dependency-path: frontend/package-lock.json`). Backend `pip install -r requirements.txt` mit
  `setup-python`-Cache (`cache: pip`, `cache-dependency-path: backend/requirements.txt`).
- **Verworfene Alternativen:** `npm install` (nicht reproduzierbar, kann den Lockfile verändern); eigene
  `actions/cache`-Schritte (die Setup-Actions bringen das mit).
- **Begründung:** reproduzierbare Installation, wirksamer Cache ohne Zusatzkonfiguration.

### E3: Lint und Tests als zwei parallele Jobs
- **Entscheidung:** Pro Workflow zwei unabhängige Jobs `lint` und `test` (kein `needs`), jeweils mit eigenem
  Checkout/Setup/Install.
- **Verworfene Alternativen:** ein Job mit zwei Schritten (etwas weniger Runner-Overhead).
- **Begründung:** klarerer Status in der GitHub-UI; die doppelte Installation ist dank Cache günstig.

### E4: Minimale Berechtigungen
- **Entscheidung:** `permissions: contents: read` auf Workflow-Ebene; `packages`/`attestations`/`id-token`
  entfallen, ebenso Buildx-Setup, GHCR-Login und die wirkungslosen Cache-Schritte.
- **Begründung:** ohne GHCR-Push nicht mehr nötig.

### E5: Alte GHCR-Pakete bleiben
- **Entscheidung:** Die vorhandenen Pakete werden nicht angefasst und nicht mehr aktualisiert (`latest` bleibt
  auf dem letzten Stand).

### E6: Laufzeitgrenze in AK2 gilt mit warmem Cache (bei Abnahme festgelegt)
- **Entscheidung:** Die Grenze „Frontend < 2 min“ aus AK2 gilt für Läufe mit Cache-Hit. Die Abweichung bei
  kaltem Cache (erster Lauf: 2:07 min, davon `npm ci` 105 s; mit Cache 0:35 min) wird akzeptiert.
- **Begründung:** Kalter Cache tritt nur nach Änderung von `package-lock.json` oder nach 7 Tagen ohne
  Cache-Zugriff auf; der Regelfall liegt deutlich unter der Grenze. Freigabe durch den User am 2026-10-03.

## Subtasks

### CI
- [x] Lokal in `frontend/` prüfen, dass `npm ci` mit dem vorhandenen `package-lock.json` durchläuft (sonst
      abbrechen und Rückfrage – Lockfile-Änderungen sind nicht im Scope).
- [x] `.github/workflows/frontend.yml`: Jobs `lint` und `test`, je `actions/checkout@v4`,
      `actions/setup-node@v4` (Node 18, npm-Cache wie E2), `npm ci`, dann `npm run lint` bzw.
      `npm run test:unit`; `defaults.run.working-directory: frontend`.
- [x] `.github/workflows/backend.yml`: Jobs `lint` und `test`, je `actions/checkout@v4`,
      `actions/setup-python@v5` (Python 3.11, pip-Cache wie E2), `pip install -r requirements.txt`, dann
      `pylint src/` bzw. `python -m unittest discover -s __tests__ -p "*.py"`;
      `defaults.run.working-directory: backend`.
- [x] Trigger und `paths` beider Workflows unverändert übernehmen; Permissions wie E4.

### Doku
- [x] `CONTRIBUTING.md`, Abschnitt „CI“: keine Docker-/GHCR-Erwähnung mehr, neue Abläufe beschreiben.
- [x] `docs/architecture.md` (Tabelle, Zeile „CI“), `frontend/CLAUDE.md` und `backend/CLAUDE.md` (Abschnitt
      „CI“) entsprechend anpassen.

## Akzeptanzkriterien

- [x] AK1: Beide Workflows enthalten weder `docker`-Befehle noch Buildx-/GHCR-Schritte; Lint und Tests laufen
      als parallele Jobs direkt auf dem Runner mit Node 18 bzw. Python 3.11 und wirksamem Dependency-Cache.
- [x] AK2: Wirksamkeit nachgewiesen: Nach Push auf `development` sind beide Workflows grün. Laufzeit
      (Gesamtdauer des Workflow-Runs) Frontend < 2 min, Backend < 1 min; beim zweiten Lauf meldet der Setup-Schritt
      einen Cache-Hit. Run-URLs und Dauern im Review festgehalten. Grenze gilt mit warmem Cache (E6).
- [x] AK3: Invarianten eingehalten – gleiche Befehle, gleiche Trigger, Dockerfiles/Compose/App-Code unverändert
      (`git diff --stat` zeigt nur Workflows und Doku).
- [x] AK4: Doku (CONTRIBUTING.md, architecture.md, frontend/backend CLAUDE.md) beschreibt die CI ohne Docker/GHCR.

## Teststrategie / Verifikation

**Automatisch**
- Lokal vor dem Push: in `frontend/` `npm ci && npm run lint && npm run test:unit`; in `backend/` (venv,
  Python 3.11) `pip install -r requirements.txt && pylint src/ && python -m unittest discover -s __tests__ -p "*.py"`
  – Ergebnisse müssen dem bisherigen CI-Stand entsprechen.
- Workflow-Syntax prüfen (z. B. `actionlint`, falls verfügbar).

**Manuell**
1. Commit auf `development` pushen (Push nur nach Bestätigung durch den User); beide Workflows triggern, da die
   Workflow-Dateien geändert sind.
2. In GitHub Actions (`gh run list` / `gh run view`) Status und Dauer beider Runs prüfen.
3. Zweiten Lauf auslösen (z. B. `gh run rerun`) und Cache-Hit im Setup-Schritt prüfen.

## Offene Fragen

- keine

## Review

### Runde 1 – 2026-10-03
**Empfehlung:** Abnahme (AK2 ausgelegt als „mit warmem Cache“, siehe Hinweise)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `frontend.yml`/`backend.yml`: Jobs `lint` und `test` ohne `needs`, `setup-node@v4` (Node 18, `cache: npm`) bzw. `setup-python@v5` (3.11, `cache: pip`); kein `docker`/`buildx`/`ghcr` im Diff; Jobs starten zeitgleich |
| AK2 | erfüllt (mit warmem Cache) | Commit `10ee624`. Frontend [37126878132](https://github.com/patschwendeman/dnd-portal/actions/runs/37126878132): Lauf 1 (kalt) 2:07 min (`npm ci` 105 s), Lauf 2 0:35 min (`npm ci` 10 s). Backend [37126878227](https://github.com/patschwendeman/dnd-portal/actions/runs/37126878227): Lauf 1 0:28 min, Lauf 2 0:32 min. Cache-Hit über `GET /actions/caches` belegt (npm- und pip-Cache in Lauf 1 angelegt, im Setup-Schritt von Lauf 2 gelesen). Vorher (Docker, `df0a092`): Frontend 11:49 min, Backend 2:14 min |
| AK3 | erfüllt | `git diff --stat d1e72ed..HEAD`: nur Workflows, `CONTRIBUTING.md`, `docs/architecture.md`, `frontend/CLAUDE.md`, `backend/CLAUDE.md`, `docs/tasks/*`; Trigger und Befehle unverändert |
| AK4 | erfüllt | CI-Abschnitte in `CONTRIBUTING.md`, `docs/architecture.md`, `frontend/CLAUDE.md`, `backend/CLAUDE.md` ohne Docker/GHCR, passend zu den Workflows |

**Blockierende Befunde**
- keine

**Hinweise**
- AK2: Frontend mit kaltem Cache 2:07 min, also 7 s über der Grenze; tritt nach Lockfile-Änderung oder 7 Tagen ohne Cache-Zugriff wieder auf. Mit warmem Cache 0:35 min.
- Commit `2f337fd` (`setup(...)`) ändert nur Plan-Dateien; `docs` hätte besser gepasst. Schema eingehalten.
- Backend-Testjob ist mit 0 Tests grün (`__tests__` enthält nur `__init__.py`); ab Python 3.12 endet ein Lauf ohne Tests mit Exit 5.
- Bereits vorher vorhanden: 3 Lint-Warnungen (`no-console`, `alt-text`), 0 Fehler.

**Checks:** Lint Frontend 0 Fehler / Backend pylint 10.00, Tests Frontend 5/5 / Backend 0 Tests OK, actionlint (Implementer) ohne Befunde, CI beide Workflows grün in beiden Läufen
