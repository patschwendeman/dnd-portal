# DND-19: Dev-Compose auf Root-Ebene zusammenführen

**Typ:** chore
**Status:** Im Review

## Kontext & Ziel

`compose.dev.yaml` bindet per `include` `backend/docker-compose.yml` (mit `backend/.env` für die Interpolation) und
`frontend/docker-compose.yml` ein (DND-3, E1). `compose.prod.yaml` definiert dagegen alle Services selbst und
liest die Variablen per `env_file`. Durch die zwei Aufbauweisen liegen die Dev-Services in drei Dateien, und die
Variablen werden in zwei Stufen aufgelöst (Interpolation über `include` → `${POSTGRES_*}`). Die Dateien in den
Unterordnern heißen anders (`docker-compose.yml` statt `compose.*.yaml`), `frontend/docker-compose.yml` hat noch den
veralteten Schlüssel `version: '3.4'` (Compose warnt bei jedem Start). Ziel: `compose.dev.yaml` definiert alle
Dev-Services selbst, aufgebaut wie `compose.prod.yaml`; `backend/docker-compose.yml` und `frontend/docker-compose.yml`
entfallen. Zusätzlich heißen die Services in Dev und Prod gleich: `api` und `ui` statt `app` bzw. `react-app`/`web`
(Containernamen `dnd-*-api`/`dnd-*-ui` tragen die Begriffe schon).

## Invarianten

- Projektname `dnd-portal-dev` und Volume-Schlüssel `postgres_data` bleiben → bestehendes DB-Volume
  `dnd-portal-dev_postgres_data` wird weiter genutzt, kein Datenverlust, kein Re-Seed.
- Services `db`, `pgadmin` sowie `api` (vorher `app`) und `ui` (vorher `react-app`) mit unveränderten Containernamen (`dnd-dev-db`, `dnd-dev-api`,
  `dnd-dev-pgadmin`, `dnd-dev-ui`), Ports (5432, 8000, 5050, 5173), Images/Build-Targets (`dev`), `command`,
  `working_dir`, `depends_on` samt Healthcheck-Bedingung, Profil `tools` für pgAdmin.
- Hot Reload unverändert: `backend/app` → `/app/app`, `backend/tests` → `/app/tests`, `frontend/` → `/app` plus
  anonymes Volume `/app/node_modules`, `CHOKIDAR_USEPOLLING=true`.
- Die API bekommt dieselben Variablen aus `backend/.env`; `.env` landet weiterhin nicht im Image.
- `compose.prod.yaml` nur Service-Umbenennung (E4); Containernamen, Ports, Healthchecks, Build und Volume unverändert.
- `script.sh` (Dateinamen `compose.dev.yaml`/`compose.prod.yaml`), `.claude/launch.json`,
  Dockerfiles (außer Kommentaren), CI-Workflows und App-Code unverändert. `DB_HOST=db` bleibt gültig.
- `./script.sh dev [--tools]`, `stop`, `prod` verhalten sich wie bisher.

## Scope / Non-Goals

**Im Scope**
- `compose.dev.yaml` mit eigenen Service-Definitionen; `backend/docker-compose.yml` und `frontend/docker-compose.yml`
  löschen.
- Service-Namen `api`/`ui` in `compose.dev.yaml` und `compose.prod.yaml` (E4) samt Kommentaren und Doku-Befehlen.
- Kommentare in `backend/Dockerfile`, `frontend/Dockerfile`, `backend/.env.example`.
- Doku: `README.md`, `CONTRIBUTING.md`, `docs/architecture.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`,
  `frontend/README.md`, `.claude/skills/quick-task/SKILL.md` (Check „`docker compose config -q` im Teilordner“).

**Nicht im Scope**
- Gemeinsame Basis-Datei oder `extends` für Dev und Prod (bewusst zwei eigenständige Dateien wie bisher bei Prod).
- Umbenennung von `compose.dev.yaml`/`compose.prod.yaml` oder Zusammenlegen per Profil.
- Änderungen an Ports, Containernamen, Healthchecks über das für `env_file` Nötige hinaus.
- Umbenennung von `db` oder `pgadmin`.
- Aufräumen alter Docker-Volumes (`backend_postgres_data`, `dnd-portal-backend_postgres_data`,
  `dnd-portal_postgres_data`) – nur Hinweis in der Doku.

## Entscheidungen

### E1: Eigene Service-Definitionen im Root, Unterordner-Dateien entfallen
- **Entscheidung:** `compose.dev.yaml` definiert `db`, `app`, `pgadmin`, `react-app` selbst (Pfade relativ zum Root:
  `context: backend`/`frontend`, Volumes `./backend/app`, `./backend/tests`, `./frontend`). Kein `include`.
  Löst DND-3 E1 ab.
- **Verworfene Alternativen:** `include` beibehalten (zwei Aufbauweisen, zweistufige Interpolation); Unterordner-Dateien
  zusätzlich behalten (doppelte Pflege).
- **Begründung:** Dev und Prod gleich aufgebaut, alle Compose-Dateien an einem Ort. Der Einzelstart aus
  `backend/`/`frontend/` entfällt (vom User akzeptiert); Ersatz siehe E3.

### E2: Variablen per `env_file` statt Interpolation
- **Entscheidung:** `db`, `app` und `pgadmin` erhalten `env_file: backend/.env` (wie `compose.prod.yaml`). Die
  `environment`-Blöcke mit `${POSTGRES_*}`/`${PGADMIN_*}` entfallen. Der `db`-Healthcheck nutzt die Container-Variablen
  (`pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}`, wie Prod).
- **Verworfene Alternativen:** Interpolation per `--env-file backend/.env` in `script.sh` und allen Doku-Befehlen
  (jeder Aufruf ohne Flag bricht); Root-`.env` (zweite Env-Datei).
- **Begründung:** Ohne `include` gäbe es keine Quelle für `${…}` im Root; `env_file` funktioniert bei jedem Aufruf.
  `db` und `pgadmin` sehen dadurch alle Variablen aus `backend/.env` – lokal unkritisch, bei Prod ebenso.

### E3: Ersatz für den Einzelstart
- **Entscheidung:** Doku nennt die Root-Befehle: nur Backend `docker compose -f compose.dev.yaml up --build db app`,
  nur Frontend `docker compose -f compose.dev.yaml up --build react-app` (Frontend nativ per `npm run dev` bleibt),
  Tests `docker compose -f compose.dev.yaml run --rm app pytest`.
- **Begründung:** Gleiche Möglichkeiten ohne eigene Dateien. Mit E4 heißen die Befehle `up --build db api`,
  `up --build ui`, `run --rm api pytest`.

### E4: Einheitliche Service-Namen `api` und `ui` in Dev und Prod
- **Entscheidung:** In `compose.dev.yaml` und `compose.prod.yaml` heißen die Services `db`, `api`, `ui` (Dev zusätzlich
  `pgadmin`). `app` → `api`, `react-app` (Dev) bzw. `web` (Prod) → `ui`; `depends_on` entsprechend. Nachträglich
  vom User nach Runde 1 entschieden (2026-10-11).
- **Verworfene Alternativen:** Prod-Namen `app`/`web` für Dev übernehmen; Namen getrennt lassen.
- **Begründung:** Gleiche Befehle in beiden Stacks, passend zu den Containernamen `dnd-*-api`/`dnd-*-ui`.
- **Folge:** Alte Container mit den bisherigen Service-Namen werden zu Orphans; vor dem Wechsel den laufenden Stack mit
  der alten Konfiguration stoppen (bzw. einmalig `down --remove-orphans`). Hinweis in `CONTRIBUTING.md`.

## Subtasks

### Compose
- [x] Vorher `docker compose -f compose.dev.yaml config` (Stand mit `include`) als Referenz sichern.
- [x] `compose.dev.yaml`: Kopfkommentar anpassen (keine Teil-Dateien mehr), `include` durch `services:` mit `db`,
      `pgadmin`, `app`, `react-app` und `volumes: postgres_data:` ersetzen (E1, E2); kein `version`-Schlüssel.
- [x] `backend/docker-compose.yml` und `frontend/docker-compose.yml` löschen.
- [x] `docker compose -f compose.dev.yaml config` neu gegen die Referenz vergleichen: Unterschiede nur bei
      `environment` ↔ `env_file`-Werten der `db`/`pgadmin` (zusätzliche Variablen) und dem Healthcheck-Ausdruck.

- [x] Laufenden Dev-Stack vor der Umbenennung mit der alten Konfiguration stoppen (Volume behalten, kein `-v`).
- [x] E4: Services in `compose.dev.yaml` (`app` → `api`, `react-app` → `ui`) und `compose.prod.yaml` (`app` → `api`,
      `web` → `ui`) umbenennen, `depends_on` und Kopfkommentare anpassen.
- [x] `config` beider Dateien gegen den Stand von Runde 1 (754d573) vergleichen: Unterschiede nur bei den Service-Namen.

### Kommentare
- [x] `backend/Dockerfile`, `frontend/Dockerfile`: Verweis `docker-compose.yml` → `compose.dev.yaml`.
- [x] `backend/.env.example`: Verweise auf `docker-compose.yml` und `in backend/ docker compose --profile tools up`
      anpassen.

### Doku
- [x] `docs/architecture.md` „Lokal starten“: Absatz zu `include` ersetzen, „Einzelstart weiterhin …“ durch E3
      ersetzen, Image-Absätze (`von frontend/docker-compose.yml`/`backend/docker-compose.yml`) anpassen.
- [x] `README.md`: Zeile „Einzelstart weiterhin …“ durch E3 ersetzen.
- [x] `CONTRIBUTING.md` „Lokale Entwicklung“: Hinweise zu Root- vs. Einzelstart (Containernamen-Konflikt, getrennte
      Volumes) streichen bzw. durch E3 ersetzen; Hinweis auf nicht mehr genutzte Volumes um `backend_postgres_data`
      und `dnd-portal-backend_postgres_data` ergänzen.
- [x] `backend/CLAUDE.md`: `in backend/: docker compose up --build`, `docker compose run --rm app pytest  # in backend/`
      und Verweise auf `docker-compose.yml` anpassen; `docker compose down -v` → `-f compose.dev.yaml`.
- [x] `frontend/CLAUDE.md`, `frontend/README.md`: `docker compose up --build` in `frontend/` und Verweise auf
      `docker-compose.yml` anpassen.
- [x] `.claude/skills/quick-task/SKILL.md`: Check „`docker compose config -q` im betroffenen Teilordner“ streichen.
- [x] `grep -rn "docker-compose" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=tasks .` findet nichts mehr.
- [x] E4 in der Doku: alle Befehle und Service-Listen (`README.md`, `CONTRIBUTING.md`, `docs/architecture.md`,
      `backend/CLAUDE.md`, `frontend/CLAUDE.md`, `frontend/README.md`, `.claude/skills/quick-task/SKILL.md`) auf
      `api`/`ui`; Orphan-Hinweis in `CONTRIBUTING.md`. `git grep -nE "react-app|\bweb\b|(run|up|logs)[^|]* app\b"`
      außerhalb `docs/tasks/` und `frontend/src` ohne Compose-Treffer.
      Abweichung: Auch der Hilfetext von `script.sh` (`logs [service] … (db, app, web)`) auf `(db, api, ui)` angepasst –
      sonst Grep-Treffer und veraltete Hilfe; Verhalten des Skripts unverändert. Einziger verbleibender Treffer ist
      der beabsichtigte Orphan-Hinweis in `CONTRIBUTING.md` mit den alten Namen.

## Akzeptanzkriterien
- [x] AK1: `compose.dev.yaml` definiert `db`, `app`, `pgadmin`, `react-app` selbst, ohne `include` und ohne
      `version`; `backend/docker-compose.yml` und `frontend/docker-compose.yml` existieren nicht mehr.
- [x] AK2: Alle Invarianten eingehalten – `config`-Vergleich vorher/nachher zeigt nur die in den Subtasks genannten
      Unterschiede; bestehendes Volume `dnd-portal-dev_postgres_data` wird weiter genutzt (kein Re-Seed).
- [x] AK3: `docker compose -f compose.dev.yaml config -q`, `--profile tools config -q` und
      `-f compose.prod.yaml config -q` ohne Fehler und ohne Warnung; Backend-Checks (ruff, mypy, pytest im Container)
      und CI so grün wie vorher.
- [x] AK5: Dev und Prod nutzen die Service-Namen `db`, `api`, `ui` (Dev plus `pgadmin`); `config`-Vergleich zu
      754d573 zeigt nur die Umbenennung; Doku nennt keine alten Service-Namen mehr (außer `docs/tasks/`).
- [x] AK4: Keine Verweise mehr auf `docker-compose.yml` oder den Einzelstart in Unterordnern (außer `docs/tasks/`);
      Doku nennt die Ersatzbefehle aus E3.

## Teststrategie / Verifikation

**Automatisch**
- `docker compose -f compose.dev.yaml config -q` (mit und ohne `--profile tools`), `-f compose.prod.yaml config -q`.
- `docker compose -f compose.dev.yaml run --rm --build api pytest` und
  `docker compose -f compose.dev.yaml run --rm --no-deps api sh -c 'ruff check && ruff format --check && mypy app'`.
- Backend-CI nach Push.

**Manuell**
1. `./script.sh dev`: alle Container starten, `dnd-dev-db` healthy, Szenen aus der bestehenden DB vorhanden
   (kein neuer Seed), UI unter http://localhost:5173, Admin/Wall/Ground laden Bilder.
2. Hot Reload: Änderung in `backend/app` → uvicorn lädt neu; Änderung in `frontend/src` → Vite aktualisiert.
3. `./script.sh dev --tools`: pgAdmin unter http://localhost:5050, Login mit den Daten aus `backend/.env`.
4. `docker compose -f compose.dev.yaml up --build ui` startet nur das Frontend.
5. `./script.sh stop` stoppt alles, keine Orphan-Warnung, `docker volume ls` zeigt `dnd-portal-dev_postgres_data` weiterhin.

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-10-11 (Commit 754d573)
**Empfehlung:** Abnahme (CI-Lauf nach Push noch nachzuweisen)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `compose.dev.yaml` definiert `db`, `pgadmin`, `app`, `react-app` und `volumes: postgres_data` selbst; kein `include`, kein `version`; `backend/docker-compose.yml` und `frontend/docker-compose.yml` gelöscht |
| AK2 | erfüllt | `--profile tools config` gegen Worktree auf 8500650 verglichen: nur zusätzliche Variablen bei `db`/`pgadmin` (`env_file`), Healthcheck `pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}` (wie Prod) und Schreibweise `./Dockerfile` → `Dockerfile`; Containernamen, Ports, Targets, `command`, Mounts, Profil, `CHOKIDAR_USEPOLLING` unverändert; `dnd-dev-db` hängt an `dnd-portal-dev_postgres_data`, Log „Skipping initialization“, `GET /scenes` 200 mit bestehenden Szenen |
| AK3 | lokal erfüllt, CI nach Push | `config -q` (dev, dev `--profile tools`, prod) rc=0 ohne Ausgabe; pytest 21 passed; ruff check, ruff format --check, mypy grün |
| AK4 | erfüllt | Plan-Grep auf `docker-compose` ohne Treffer; E3-Befehle in `README.md`, `CONTRIBUTING.md`, `docs/architecture.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`, `frontend/README.md` und im Kopfkommentar von `compose.dev.yaml` |

#### Blockierende Befunde
- keine

#### Hinweise (nicht blockierend)
- [x] Freigabe des Plans nicht als eigener Commit nachvollziehbar (8500650 noch „Entwurf“) – vom User am 2026-10-11 im Chat freigegeben
- `dockerfile: ./Dockerfile` → `Dockerfile` bei `react-app` nicht in der Subtask-Liste genannt; gleichwertig
- Neuerstellung von `dnd-dev-db` führte bei laufender `dnd-dev-api` einmalig zu 500 auf `GET /scenes` (alte Pool-Verbindung, kein `pool_pre_ping`); vorbestehend, ggf. Known Issue
- Manuell nicht geprüft: Hot Reload, pgAdmin-Login über `--tools`, `up --build react-app` allein, `./script.sh stop`

#### Checks
- `docker compose -f compose.dev.yaml config -q` / `--profile tools` / `-f compose.prod.yaml config -q`: ok
- pytest im Container: 21 passed
- ruff check, ruff format --check, mypy app: grün
- Backend-CI: nach Push zu prüfen
- Frontend-Lint/Tests: nicht ausgeführt (nur Dockerfile-Kommentar/Doku geändert); `dnd-dev-ui` baut und läuft, `:5173` 200
