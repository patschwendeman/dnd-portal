# DND-19: Dev-Compose auf Root-Ebene zusammenführen

**Typ:** chore
**Status:** Fertig

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
- `script.sh`: Verhalten und Dateinamen (`compose.dev.yaml`/`compose.prod.yaml`) unverändert, Hilfetext folgt E4.
- `.claude/launch.json`,
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
- Aufräumen alter Docker-Volumes im Repo (Skript o. Ä.) – die Volumes `backend_postgres_data`,
  `dnd-portal-backend_postgres_data`, `dnd-portal_postgres_data` löscht der User einmalig lokal (nach Runde 2
  entschieden); die Doku nennt sie nicht mehr.

## Entscheidungen

### E1: Eigene Service-Definitionen im Root, Unterordner-Dateien entfallen
- **Entscheidung:** `compose.dev.yaml` definiert `db`, `app`, `pgadmin`, `react-app` (seit E4: `api`/`ui`) selbst (Pfade relativ zum Root:
  `context: backend`/`frontend`, Volumes `./backend/app`, `./backend/tests`, `./frontend`). Kein `include`.
  Löst DND-3 E1 ab.
- **Verworfene Alternativen:** `include` beibehalten (zwei Aufbauweisen, zweistufige Interpolation); Unterordner-Dateien
  zusätzlich behalten (doppelte Pflege).
- **Begründung:** Dev und Prod gleich aufgebaut, alle Compose-Dateien an einem Ort. Der Einzelstart aus
  `backend/`/`frontend/` entfällt (vom User akzeptiert); Ersatz siehe E3.

### E2: Variablen per `env_file` statt Interpolation
- **Entscheidung:** `db`, `app` (seit E4: `api`) und `pgadmin` erhalten `env_file: backend/.env` (wie `compose.prod.yaml`). Die
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
  der alten Konfiguration stoppen (bzw. einmalig `down --remove-orphans`). Kein Doku-Hinweis (in Runde 3 gestrichen,
  Umstellung lokal bereits erledigt).

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

### Runde 3: Kommentare und Doku nachschärfen (nach Runde 2 vom User beauftragt)
- [x] `CONTRIBUTING.md`: Orphan-/Migrationshinweis zu den alten Service-Namen streichen; nur „Dev und Prod nutzen
      dieselben Service-Namen …“ bleibt.
- [x] `CONTRIBUTING.md` und `docs/architecture.md`: Hinweise auf nicht mehr genutzte Volumes
      (`dnd-portal_postgres_data`, `backend_postgres_data`, `dnd-portal-backend_postgres_data`) ganz streichen.
- [x] `backend/CLAUDE.md`: Kommentar `nur Backend (DB + API; pgAdmin: --profile tools up --build db api pgadmin)` →
      ohne Befehlsfragment; pgAdmin ggf. als eigene vollständige Zeile `up --build db api pgadmin`.
- [x] `backend/.env.example`: `Container "db"` → Service `db`; pgAdmin-Kommentar auf Deutsch.
- [x] `CONTRIBUTING.md`: `./script.sh dev  # db, api (API :8000), ui (UI :5173) …` → ohne Doppelung
      (`db :5432, api :8000, ui :5173 …`).
- [x] `backend/Dockerfile`: `Dev stack (../compose.dev.yaml)` → einheitlich mit Zeile 1 bzw. `frontend/Dockerfile`.
      Umgesetzt: Kopf nennt einmal „compose files in the repo root“, danach je eine Zeile für `compose.prod.yaml`/`compose.dev.yaml`.
- [x] Danach keine Erwähnung der alten Service-Namen `react-app`/`web` und der gelöschten Volumes außerhalb
      `docs/tasks/`.

### Runde 4: Restpunkte aus Review Runde 3 (vom User beauftragt)
- [x] `backend/CLAUDE.md:23-24`: Ortsangabe „im Root“ bei den Befehlen „nur Backend“ ergänzen.
- [x] Gegenseitige Verweise „(as in the prod stack)“ in `compose.dev.yaml` / „(as in the dev stack)“ in
      `compose.prod.yaml`: nur einen behalten. Umgesetzt: Verweis in `compose.dev.yaml` bleibt, in `compose.prod.yaml` entfernt.
- [x] Kommentarspalten in `frontend/README.md` und `frontend/CLAUDE.md` an die Nachbarzeilen angleichen.
      Umgesetzt: `frontend/README.md` beide Kommentare auf eine Spalte; `frontend/CLAUDE.md` Kommentar als eigene
      Zeile über dem Befehl (Befehl länger als die Kommentarspalte der Nachbarzeilen, wie die übrigen Kommentarzeilen im Block).

## Akzeptanzkriterien
- [x] AK1: `compose.dev.yaml` definiert `db`, `app`, `pgadmin`, `react-app` (seit E4: `api`/`ui`) selbst, ohne `include` und ohne
      `version`; `backend/docker-compose.yml` und `frontend/docker-compose.yml` existieren nicht mehr.
- [x] AK2: Alle Invarianten eingehalten – `config`-Vergleich vorher/nachher zeigt nur die in den Subtasks genannten
      Unterschiede; bestehendes Volume `dnd-portal-dev_postgres_data` wird weiter genutzt (kein Re-Seed).
- [x] AK3: `docker compose -f compose.dev.yaml config -q`, `--profile tools config -q` und
      `-f compose.prod.yaml config -q` ohne Fehler und ohne Warnung; Backend-Checks (ruff, mypy, pytest im Container)
      und CI so grün wie vorher.
- [x] AK4: Keine Verweise mehr auf `docker-compose.yml` oder den Einzelstart in Unterordnern (außer `docs/tasks/`);
      Doku nennt die Ersatzbefehle aus E3.
- [x] AK5: Dev und Prod nutzen die Service-Namen `db`, `api`, `ui` (Dev plus `pgadmin`); `config`-Vergleich zu
      754d573 zeigt nur die Umbenennung; Doku nennt keine alten Service-Namen mehr (außer `docs/tasks/`).

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

### Runde 2 – 2026-10-11 (Commit bcc9db2)
**Empfehlung:** Abnahme (CI-Lauf nach Push noch nachzuweisen; script.sh-Abweichung vom User zu bestätigen)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt (Wortlaut veraltet) | Kein `include`, kein `version`, Unterordner-Dateien fehlen; `config --services` → `db`, `api`, `ui` (+ `pgadmin` mit `tools`); AK-Text nennt noch `app`/`react-app` |
| AK2 | erfüllt | Containernamen `dnd-dev-{db,api,ui,pgadmin}`/`dnd-prod-{db,api,ui}`, Ports, Volumes, Healthchecks, Targets laut `config`-Diff unverändert; `dnd-dev-db` an `dnd-portal-dev_postgres_data`, „Skipping initialization“, `GET /scenes` 200 mit bestehenden Szenen |
| AK3 | lokal erfüllt, CI nach Push | `config -q` (dev, dev `tools`, prod) rc=0 ohne Ausgabe; pytest 21 passed; ruff, mypy grün |
| AK4 | erfüllt | Kein `docker-compose.yml`-Verweis außerhalb `docs/tasks/`; E3-Befehle mit neuen Namen in der Doku |
| AK5 | erfüllt | `config`-Diff gegen 754d573: Dev nur `app`→`api`, `react-app`→`ui`; Prod nur `app`→`api`, `web`→`ui`, `depends_on`; Plan-Grep trifft nur den Orphan-Hinweis `CONTRIBUTING.md:124`; Dev-Container mit Labels `api`/`ui`, keine Orphans |

#### Blockierende Befunde
- keine

#### Hinweise (nicht blockierend)
- [x] `script.sh:47`: nur Hilfetext `logs [service] … (db, api, ui)` geändert, Verhalten gleich; gehört inhaltlich zu E4 – Bestätigung durch User, ggf. Invariante präzisieren
- [x] Plan-Text: AK1, E1, E2 nennen noch `app`/`react-app`; AK5 steht vor AK4
- Kopfzeile bcc9db2 „address review round 1“ wenig aussagekräftig (setzt E4 um)
- Manuell nicht geprüft: Prod-Start mit neuen Namen, `./script.sh stop`, Hot Reload, `up --build ui` allein

#### Checks
- `config -q` dev / dev `--profile tools` / prod: ok
- `config`-Diff gegen 754d573: nur Service-Namen
- pytest im Container (`run --rm api pytest`): 21 passed
- ruff check, ruff format --check, mypy app: grün
- Dev-Stack läuft: `dnd-dev-db` healthy, API :8000 200, UI :5173 200
- Backend-CI: nach Push zu prüfen

### Runde 3 – 2026-10-11 (Commit d460e14)
**Empfehlung:** Abnahme (CI-Lauf nach Push noch nachzuweisen)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `compose.dev.yaml` in Runde 3 unverändert; kein `include`, kein `version`, Unterordner-Dateien fehlen |
| AK2 | erfüllt | Runde 3 ändert nur `CONTRIBUTING.md`, `backend/.env.example`, `backend/CLAUDE.md`, `backend/Dockerfile` (Kommentar Z. 1–3), `docs/architecture.md`; Compose, `script.sh`, `frontend/`, App-Code, Tests, CI, `.claude` unverändert; `dnd-dev-db` healthy |
| AK3 | lokal erfüllt, CI nach Push | `config -q` (dev, dev `tools`, prod) rc=0; ruff, mypy grün; pytest 21 passed |
| AK4 | erfüllt | Kein `docker-compose`/„Einzelstart“ außerhalb `docs/tasks/`; E3-Befehle in der Doku |
| AK5 | erfüllt | Grep auf alte Service-Namen ohne Treffer; Orphan-Hinweis und Hinweise auf gelöschte Volumes entfernt |

Kommentare/Doku-Hinweise 8500650..d460e14 (außerhalb `docs/tasks/`): inhaltlich korrekt (Ports, Service-/Containernamen, `env_file`, Targets, `run --rm api pytest` startet DB mit, `up --build ui` ohne Backend); Sprache je Datei passend.

#### Blockierende Befunde
- keine

#### Hinweise (nicht blockierend)
- Commit-Body d460e14 nennt „script.sh dev comment“, gemeint ist der Kommentar in `CONTRIBUTING.md`
- [x] Plan-Text E4 „Folge“ nannte noch den Hinweis in `CONTRIBUTING.md` – angepasst
- `backend/CLAUDE.md:23-24`: Befehle „nur Backend“ ohne Ortsangabe „im Root“ (in `backend/` schlägt `-f compose.dev.yaml` fehl)
- `backend/CLAUDE.md:24`: `--profile tools` bei explizit genanntem `pgadmin` überflüssig, aber unschädlich
- Gegenseitige Verweise `compose.dev.yaml:15` „(as in the prod stack)“ / `compose.prod.yaml:16` „(as in the dev stack)“ – einer reicht
- E3-Befehle stehen in 7 Dateien (vom Plan so verlangt) – Pflegeaufwand
- `docs/architecture.md:93` „Eigene Compose-Dateien in `backend/` bzw. `frontend/` gibt es nicht.“ – vertretbar, ggf. streichbar
- Kosmetisch: Kommentarspalten in `frontend/README.md:27` und `frontend/CLAUDE.md:24` uneinheitlich eingerückt
- Manuell nicht geprüft: Prod-Start mit neuen Namen, `./script.sh stop`, Hot Reload, `up --build ui` allein

#### Checks
- `config -q` dev / dev `--profile tools` / prod: ok
- Diff bcc9db2..d460e14: nur Doku und Kommentare
- ruff check, ruff format --check, mypy app: grün
- pytest: 21 passed
- Frontend-Lint/Tests: nicht ausgeführt (nichts unter `frontend/` geändert)
- Backend-CI: nach Push zu prüfen

### Runde 4 – 2026-10-11 (Commit 50cc391)
**Empfehlung:** Abnahme (CI-Lauf nach Push noch nachzuweisen)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `compose.dev.yaml` in Runde 4 unverändert |
| AK2 | erfüllt | Nur Kommentare/Doku: `backend/CLAUDE.md:23-24`, `compose.prod.yaml:15` (YAML-Kommentar), `frontend/README.md:27-28`, `frontend/CLAUDE.md:24-25`, Plan; Compose-Keys, `script.sh`, App-Code, Tests, CI, `.claude` unverändert |
| AK3 | lokal erfüllt, CI nach Push | `config -q` (dev, dev `tools`, prod) rc=0 ohne Ausgabe |
| AK4 | erfüllt | E3-Befehle unverändert, jetzt mit Ortsangabe |
| AK5 | erfüllt | Keine alten Service-Namen hinzugekommen |

#### Blockierende Befunde
- keine

#### Hinweise (nicht blockierend)
- Commit-Body nennt „status“, Status-Zeile im Plan aber unverändert
- `backend/CLAUDE.md:24`: `--profile tools` bei explizit genanntem `pgadmin` überflüssig, unschädlich
- Manuell nicht geprüft: Prod-Start mit neuen Namen, `./script.sh stop`, Hot Reload, `up --build ui` allein

#### Checks
- `config -q` dev / dev `--profile tools` / prod: ok
- Diff d460e14..50cc391: nur Kommentare, Doku, Plan
- Commit-Konvention: ok
- Backend-CI: nach Push zu prüfen
