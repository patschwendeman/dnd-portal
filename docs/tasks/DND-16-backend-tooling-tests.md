# DND-16: Backend-Tooling: uv, ruff, mypy, pytest mit Charakterisierungstests, Paket `app`

**Typ:** setup
**Status:** Freigegeben

## Kontext & Ziel

Das Backend hat keine Tests (CI läuft trotzdem grün). Abhängigkeiten stehen ungetrennt in `requirements.txt`
(`pylint` landet im Prod-Image), Lint läuft nur per pylint und Typen werden nicht geprüft. Für die anstehenden
Backend-Refactorings (Struktur, SQLAlchemy 2.0, Schemas, Migrationen; siehe `docs/known-issues.md`) braucht es
zuerst ein Sicherheitsnetz und schnelles Feedback. Ziel: moderne Tooling-Basis (uv, ruff, mypy, pytest) und
Charakterisierungstests, die das **aktuelle** Verhalten aller Endpoints festhalten, inklusive bekannter Bugs.
Das gibt auch Agents eine verlässliche Selbstprüfung. Abgesichert durch diese Tests wird das Paket `src` in `app`
umbenannt (`src/` ist üblicherweise ein Layout-Ordner, kein Paket). Abschluss: Upgrade der Abhängigkeiten, abgesichert durch
die neuen Tests.

## Invarianten

- API-Verhalten unverändert: Pfade, Statuscodes, Response-Form und -Inhalt aller 6 Endpoints (die bekannten Bugs
  bleiben bestehen und werden nur durch Tests dokumentiert).
- Python 3.11, PostgreSQL 17.
- Paketinhalt nach der Umbenennung `src` → `app` 1:1 gleich (gleiche Unterordner `db/`, `routes/`, `services/`, gleiche
  Dateinamen); nur Importe und Modulpfad (`app.main:app`) ändern sich.
- Start der Stacks unverändert: `./script.sh dev`, `./script.sh prod`, `docker compose up --build` in `backend/`.
  Ports, Containernamen, Healthcheck in `compose.prod.yaml` und Seeder-Verhalten bleiben gleich.
- Dev-Stack behält Hot Reload über den Mount von `./src`.
- Keine Logikänderung im Produktivcode. Erlaubt: Formatierung durch `ruff format`, Entfernen von `# pylint:`-Kommentaren,
  minimale Typ-Annotationen/Ignores, wo mypy es erfordert.

## Scope / Non-Goals

**Im Scope**
- `pyproject.toml` + `uv.lock` (uv), Laufzeit- und Dev-Abhängigkeiten getrennt; `requirements.txt` entfällt.
- ruff (check + format) ersetzt pylint; `.pylintrc` entfällt.
- mypy (Basis-Modus) für `src/`.
- `__tests__/` → `tests/` mit pytest, `conftest.py` und Charakterisierungstests aller Endpoints.
- Umbenennung des Pakets `src` → `app` (`git mv`), alle Importe, Modulpfad `app.main:app`, `PYTHONPATH`, Mounts.
- Dockerfile: uv, Multi-Stage (`dev` mit Dev-Abhängigkeiten, `prod` ohne), nur benötigte Dateien kopieren, Non-Root-User.
- CI (`backend.yml`): uv, Jobs `lint` (ruff check + ruff format --check + mypy), `test` (pytest gegen Postgres-Service),
  `docker-prod`.
- Upgrade aller Abhängigkeiten auf aktuelle stabile Versionen (letzter Schritt).
- Doku und Skill-Befehle nachziehen.

**Nicht im Scope**
- Umstrukturierung innerhalb von `app/` (`core/`, `schemas/`, `api/routes/` …), Router-/Service-Benennung, `lifespan`, `pydantic-settings`, CORS (Struktur-Task).
- SQLAlchemy-2.0-Stil, Pydantic-Schemas, Bugfixes (404, `/scenes/details/{id}`), Alembic.
- Strenger mypy-Modus (`strict`) – erst sinnvoll nach SQLAlchemy 2.0 / Schemas.
- Pre-commit-Hooks, Coverage-Schwellen.
- Python-Upgrade über 3.11 hinaus.

## Entscheidungen

### E1: Tests gegen echtes Postgres
- **Entscheidung:** Tests laufen gegen PostgreSQL – in der CI als Service-Container (`postgres:17`), lokal im
  Dev-Container (`docker compose run --rm app pytest`, DB `db` aus dem Compose-Netz).
- **Verworfene Alternativen:** SQLite (Env-Hacks, abweichendes Verhalten, fragil wegen DB-Zugriff beim Import).
- **Begründung:** `src.main` erzeugt beim Import Tabellen und seedet – ohne echte DB nicht importierbar. Gleiche DB wie Prod.

### E2: ruff ersetzt pylint
- **Entscheidung:** `ruff check` + `ruff format`; pylint und `.pylintrc` entfallen. Zeilenlänge 120. Regelsets
  mindestens `E`, `F`, `W`, `I` (Import-Sortierung), `B`, `UP`, `SIM`; ggf. einzelne Regeln mit Begründung
  ignorieren statt Code umzubauen. Die einmalige Formatierung erfolgt in einem eigenen Commit ohne Logikänderung.
- **Verworfene Alternativen:** ruff zusätzlich zu pylint (doppelte Regeln), ruff ohne Formatter.
- **Begründung:** Ein schnelles Tool für Lint und Format, Standard im Ökosystem, kurze Feedback-Schleife.

### E3: uv mit Lock-Datei
- **Entscheidung:** `pyproject.toml` (Projekt-Metadaten, `requires-python = "==3.11.*"`, Laufzeit-Abhängigkeiten,
  `[dependency-groups] dev` mit ruff, mypy, pytest, httpx), `uv.lock` versioniert; `requirements.txt` entfällt.
  Tool-Konfiguration (ruff, mypy, pytest) in `pyproject.toml`. CI nutzt `astral-sh/setup-uv`, Dockerfile das
  offizielle uv-Image (Version gepinnt).
- **Verworfene Alternativen:** pip + pyproject ohne Lock.
- **Begründung:** Reproduzierbare Builds, klare Trennung Prod/Dev, schnell.

### E4: Upgrade als letzter Schritt in diesem Task
- **Entscheidung:** Erst Tooling + Tests (Versionen wie bisher gepinnt), dann Upgrade auf aktuelle stabile Versionen
  (FastAPI, Pydantic, SQLAlchemy, uvicorn, psycopg2-binary, python-dotenv); die Charakterisierungstests müssen
  unverändert grün bleiben.
- **Verworfene Alternativen:** Eigener Task.
- **Begründung:** Die Tests sichern das Upgrade direkt ab.

### E5: Charakterisierungstests leiten Erwartungen aus dem Seed ab
- **Entscheidung:** Erwartete Werte (Anzahl, IDs, `source`-Pfade, `main`-Flag) werden in den Tests aus
  `src/db/data/seed_data.json` berechnet statt hart kodiert. Bekannte Bugs werden mit ihrem **Ist**-Verhalten getestet
  und mit `# known issue: …`-Kommentar markiert, damit der spätere Fix-Task sie gezielt umstellt.
- **Begründung:** Robust gegen Seed-Pflege; Bugs bleiben sichtbar statt versteckt.

### E6: mypy statt pyright, Basis-Modus
- **Entscheidung:** mypy ohne `strict`, mit `sqlalchemy`-Typen so weit möglich; fehlende Typen von Drittpaketen
  per `ignore_missing_imports` nur gezielt.
- **Begründung:** Python-native, in CI einfach; Verschärfung nach SQLAlchemy 2.0.

### E7: Umbenennung `src` → `app` nach den Tests
- **Entscheidung:** Nach Schritt 2 (Tests grün gegen `src`) wird das Paket per `git mv backend/src backend/app` umbenannt;
  Struktur darunter bleibt gleich. Tests müssen danach inhaltlich unverändert grün sein (nur Importe).
- **Verworfene Alternativen:** Erst im Struktur-Task; `src/dnd_portal/`-Layout.
- **Begründung:** Wunsch des Users; die Charakterisierungstests belegen, dass sich nichts ändert. `app/` ist die
  FastAPI-Konvention für reine API-Projekte.

## Subtasks

### Schritt 1: Abhängigkeiten & Lint
- [ ] `backend/pyproject.toml` anlegen (E3), bestehende Pins übernehmen (`fastapi==0.114.1`, `uvicorn[standard]==0.30.6`,
      `sqlalchemy==2.0.34`, `psycopg2-binary==2.9.9`, `pydantic==2.9.1`, `python-dotenv`), Dev-Gruppe ergänzen;
      `uv.lock` erzeugen; `requirements.txt` und `.pylintrc` löschen.
- [ ] ruff konfigurieren (E2), `ruff check --fix` + `ruff format` – als eigener Commit; `# pylint: disable`-Kommentare
      in `src/db/models.py` und `src/services/maps.py` entfernen.
- [ ] mypy konfigurieren (E6), bis `mypy src` grün ist (nur Annotationen/gezielte Ignores, keine Logik).

### Schritt 2: Tests
- [ ] `__tests__/` → `tests/` (`__init__.py` + `conftest.py`); pytest-Konfiguration in `pyproject.toml`.
- [ ] `conftest.py`: `TestClient(app, raise_server_exceptions=False)` als Fixture; Seed-Daten als Fixture.
- [ ] Charakterisierungstests (E5) für:
  - `GET /scenes` – alle Szenen, nach ID sortiert, Felder ohne Relationen.
  - `GET /scenes/{id}` – vorhandene ID; unbekannte ID → **500** (known issue).
  - `GET /scenes/details/` – alle Szenen mit `graphics_wall`, `graphics_ground`, `music`.
  - `GET /scenes/details/{id}` – vorhandene ID; unbekannte ID → **ganze Liste** (known issue).
  - `GET /scenes/details` ohne Slash – tatsächliches Verhalten ermitteln und festhalten (known issue, bisher ungeprüft).
  - `GET /maps/main` und `GET /maps/side` – `{id, source}` je Szene; main → Ground-Bild, side → Wall-Bild.
  - Aufruf mit Trailing Slash wie im Frontend (`maps/main/`, `maps/side/`, siehe `frontend/src/service/adminScreen.ts`)
    – Redirect-Verhalten festhalten.
- [ ] Gegenprobe: je Testdatei einmal Erwartung bewusst verfälschen → Test schlägt fehl (nicht trivial grün).

### Schritt 3: Umbenennung `src` → `app` (E7)
- [ ] `git mv backend/src backend/app`; alle Importe `from src.…` → `from app.…` (inkl. `tests/`).
- [ ] Modulpfad `src.main:app` → `app.main:app` in `Dockerfile`, `backend/docker-compose.yml` (`command`).
- [ ] `PYTHONPATH=/app/src` in `backend/docker-compose.yml` und `compose.prod.yaml` entfernen bzw. auf das Paket-Root
      anpassen; Mount `./src:/app/src` → `./app:/app/app`.
- [ ] Konfiguration in `pyproject.toml` (ruff, mypy, pytest) und Pfade in CI auf `app` umstellen.
- [ ] Suche nach Restvorkommen (`rg "src\.main|/app/src|backend/src|src/db|src/routes|src/services"`) außerhalb von
      `frontend/` und `docs/tasks/` – keine Treffer mehr.

### Schritt 4: Docker & Compose
- [ ] `Dockerfile` Multi-Stage mit uv: Basis-Stage, `dev` (inkl. Dev-Gruppe), `prod` als **letzte** Stage
      (`uv sync --frozen --no-dev`); nur `pyproject.toml`, `uv.lock`, `app/` kopieren; Non-Root-User; `.venv/bin` im `PATH`;
      `CMD` `uvicorn app.main:app --host 0.0.0.0 --port 8000` (ohne `--reload`).
- [ ] `backend/docker-compose.yml`: `app` baut `target: dev`, mountet zusätzlich `./tests` (für `docker compose run --rm app pytest`);
      Hot Reload bleibt.
- [ ] `.dockerignore` ergänzen (`.venv`, `tests/`, Caches von ruff/mypy/pytest).
- [ ] `compose.prod.yaml` prüfen: baut ohne `target` → `prod`-Stage; Healthcheck funktioniert weiter.

### Schritt 5: CI
- [ ] `.github/workflows/backend.yml`: `setup-uv` (mit Cache auf `uv.lock`), `uv sync --frozen`;
      `lint`: `uv run ruff check`, `uv run ruff format --check`, `uv run mypy app`;
      `test`: Postgres-17-Service mit Healthcheck, Env-Variablen wie `.env.example` (HOST=localhost), `uv run pytest`;
      `docker-prod`: `docker build --target prod`.
- [ ] Wirksamkeit: CI-Lauf auf `development` grün; zusätzlich einmal nachweisen, dass ein absichtlich kaputter Test
      den Job rot macht (lokal ausreichend, nicht pushen).

### Schritt 6: Upgrade (E4)
- [ ] Laufzeit-Abhängigkeiten auf aktuelle stabile Versionen heben (`uv lock --upgrade` bzw. Pins anpassen),
      Deprecation-Warnungen im Testlauf prüfen und, falls trivial und ohne Verhaltensänderung, beheben – sonst in
      `docs/known-issues.md` notieren.
- [ ] Alle Tests, Lint, mypy und Docker-Build grün; Dev- und Prod-Stack starten, Frontend lädt Szenen.

### Doku
- [ ] `backend/CLAUDE.md`: Stack, Befehle (uv, ruff, mypy, pytest, Testlauf im Container), Struktur (`app/…`),
      Konventionen (Importe ab `app.`, pylint-Abschnitt ersetzen), CI.
- [ ] `CONTRIBUTING.md` (Zeile ~139), `docs/architecture.md` (Schichten, Seeder-Pfade, CI-Zeile), `.claude/skills/quick-task/SKILL.md` (Backend-Checks).
- [ ] `docs/known-issues.md`: Punkte zu Tests/`__tests__`, `requirements.txt`/Dev-Abhängigkeiten, Lint/Typprüfung,
      Dockerfile, Versionen und Paketname `src` entfernen bzw. anpassen; verbleibende Pfade `src/…` auf `app/…`.

## Akzeptanzkriterien

- [ ] AK1: `uv sync`, `uv run ruff check`, `uv run ruff format --check`, `uv run mypy app` und `uv run pytest` laufen
      grün; pylint, `.pylintrc` und `requirements.txt` sind entfernt.
- [ ] AK2: Alle 6 Endpoints sind durch Charakterisierungstests abgedeckt (inkl. 500 bei unbekannter Szene,
      Liste bei unbekannter Detail-ID, Verhalten ohne/mit Trailing Slash); die Tests schlagen fehl, wenn das
      Verhalten sich ändert.
- [ ] AK3: Das Prod-Image enthält keine Dev-Abhängigkeiten und läuft als Non-Root-User; `./script.sh prod` wird healthy.
- [ ] AK4: `./script.sh dev` startet wie bisher inkl. Hot Reload; `docker compose run --rm app pytest` läuft im Dev-Container.
- [ ] AK5: CI-Lauf auf `development` grün mit allen drei Jobs; der Test-Job läuft gegen Postgres.
- [ ] AK6: Abhängigkeiten auf aktuellen stabilen Versionen; Tests unverändert grün.
- [ ] AK7: Alle Invarianten eingehalten – API-Verhalten unverändert.
- [ ] AK8: Paket heißt `app`, Modulpfad `app.main:app`; keine Verweise auf das alte Paket `src` mehr außerhalb von
      `docs/tasks/`; Tests nach der Umbenennung inhaltlich unverändert grün.

## Teststrategie / Verifikation

**Automatisch**
- Backend: neue Charakterisierungstests (`tests/`), ruff, mypy, Docker-Build – lokal und in der CI.
- Frontend: unverändert; `npm test` im Frontend als Gegenprobe, dass der Vertrag nicht berührt ist (optional).

**Manuell**
1. `./script.sh dev` → Admin Screen lädt Szenen, Wall/Ground zeigen Bilder; Änderung in `app/` löst Reload aus.
2. `docker compose run --rm app pytest` in `backend/` → grün.
3. `./script.sh prod` → Stack healthy, `docker exec dnd-prod-api whoami` ≠ root, `docker exec dnd-prod-api pip list`
   bzw. `uv pip list` ohne ruff/mypy/pytest.

## Offene Fragen
- keine

## Review
