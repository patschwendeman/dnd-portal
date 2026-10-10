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
entfallen.

## Invarianten

- Projektname `dnd-portal-dev` und Volume-Schlüssel `postgres_data` bleiben → bestehendes DB-Volume
  `dnd-portal-dev_postgres_data` wird weiter genutzt, kein Datenverlust, kein Re-Seed.
- Services `db`, `app`, `pgadmin`, `react-app` mit unveränderten Containernamen (`dnd-dev-db`, `dnd-dev-api`,
  `dnd-dev-pgadmin`, `dnd-dev-ui`), Ports (5432, 8000, 5050, 5173), Images/Build-Targets (`dev`), `command`,
  `working_dir`, `depends_on` samt Healthcheck-Bedingung, Profil `tools` für pgAdmin.
- Hot Reload unverändert: `backend/app` → `/app/app`, `backend/tests` → `/app/tests`, `frontend/` → `/app` plus
  anonymes Volume `/app/node_modules`, `CHOKIDAR_USEPOLLING=true`.
- Die API bekommt dieselben Variablen aus `backend/.env`; `.env` landet weiterhin nicht im Image.
- `compose.prod.yaml`, `script.sh` (Dateinamen `compose.dev.yaml`/`compose.prod.yaml`), `.claude/launch.json`,
  Dockerfiles (außer Kommentaren), CI-Workflows und App-Code unverändert.
- `./script.sh dev [--tools]`, `stop`, `prod` verhalten sich wie bisher.

## Scope / Non-Goals

**Im Scope**
- `compose.dev.yaml` mit eigenen Service-Definitionen; `backend/docker-compose.yml` und `frontend/docker-compose.yml`
  löschen.
- Kommentare in `backend/Dockerfile`, `frontend/Dockerfile`, `backend/.env.example`.
- Doku: `README.md`, `CONTRIBUTING.md`, `docs/architecture.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`,
  `frontend/README.md`, `.claude/skills/quick-task/SKILL.md` (Check „`docker compose config -q` im Teilordner“).

**Nicht im Scope**
- Gemeinsame Basis-Datei oder `extends` für Dev und Prod (bewusst zwei eigenständige Dateien wie bisher bei Prod).
- Umbenennung von `compose.dev.yaml`/`compose.prod.yaml` oder Zusammenlegen per Profil.
- Änderungen an Ports, Containernamen, Healthchecks über das für `env_file` Nötige hinaus.
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
- **Begründung:** Gleiche Möglichkeiten ohne eigene Dateien.

## Subtasks

### Compose
- [x] Vorher `docker compose -f compose.dev.yaml config` (Stand mit `include`) als Referenz sichern.
- [x] `compose.dev.yaml`: Kopfkommentar anpassen (keine Teil-Dateien mehr), `include` durch `services:` mit `db`,
      `pgadmin`, `app`, `react-app` und `volumes: postgres_data:` ersetzen (E1, E2); kein `version`-Schlüssel.
- [x] `backend/docker-compose.yml` und `frontend/docker-compose.yml` löschen.
- [x] `docker compose -f compose.dev.yaml config` neu gegen die Referenz vergleichen: Unterschiede nur bei
      `environment` ↔ `env_file`-Werten der `db`/`pgadmin` (zusätzliche Variablen) und dem Healthcheck-Ausdruck.

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

## Akzeptanzkriterien
- [x] AK1: `compose.dev.yaml` definiert `db`, `app`, `pgadmin`, `react-app` selbst, ohne `include` und ohne
      `version`; `backend/docker-compose.yml` und `frontend/docker-compose.yml` existieren nicht mehr.
- [x] AK2: Alle Invarianten eingehalten – `config`-Vergleich vorher/nachher zeigt nur die in den Subtasks genannten
      Unterschiede; bestehendes Volume `dnd-portal-dev_postgres_data` wird weiter genutzt (kein Re-Seed).
- [x] AK3: `docker compose -f compose.dev.yaml config -q`, `--profile tools config -q` und
      `-f compose.prod.yaml config -q` ohne Fehler und ohne Warnung; Backend-Checks (ruff, mypy, pytest im Container)
      und CI so grün wie vorher.
- [x] AK4: Keine Verweise mehr auf `docker-compose.yml` oder den Einzelstart in Unterordnern (außer `docs/tasks/`);
      Doku nennt die Ersatzbefehle aus E3.

## Teststrategie / Verifikation

**Automatisch**
- `docker compose -f compose.dev.yaml config -q` (mit und ohne `--profile tools`), `-f compose.prod.yaml config -q`.
- `docker compose -f compose.dev.yaml run --rm --build app pytest` und
  `docker compose -f compose.dev.yaml run --rm --no-deps app sh -c 'ruff check && ruff format --check && mypy app'`.
- Backend-CI nach Push.

**Manuell**
1. `./script.sh dev`: alle Container starten, `dnd-dev-db` healthy, Szenen aus der bestehenden DB vorhanden
   (kein neuer Seed), UI unter http://localhost:5173, Admin/Wall/Ground laden Bilder.
2. Hot Reload: Änderung in `backend/app` → uvicorn lädt neu; Änderung in `frontend/src` → Vite aktualisiert.
3. `./script.sh dev --tools`: pgAdmin unter http://localhost:5050, Login mit den Daten aus `backend/.env`.
4. `docker compose -f compose.dev.yaml up --build react-app` startet nur das Frontend.
5. `./script.sh stop` stoppt alles, `docker volume ls` zeigt `dnd-portal-dev_postgres_data` weiterhin.

## Offene Fragen
- keine

## Review
