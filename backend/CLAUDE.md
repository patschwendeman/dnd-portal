# backend (dnd-portal)

REST-API + PostgreSQL für das DnD Portal. Liefert Szenen mit ihren Wall-/Ground-Bildern und Musik-Playlists an das
Frontend (`../frontend`). Projektübergreifender Kontext (Vision, Screens, Begriffe, bekannte Probleme) liegt
eine Ebene höher in `../CLAUDE.md` und `../docs/`.

## Stack

Python 3.11 · FastAPI 0.143 · Pydantic 2.14 · SQLAlchemy 2.1 (klassischer Stil: `declarative_base`, `Column`, `db.query`) ·
psycopg2 · PostgreSQL 17. Tooling: uv · ruff (Lint + Format) · mypy · pytest. Laufzeit-Abhängigkeiten exakt gepinnt in
`pyproject.toml`, Dev-Abhängigkeiten in `[dependency-groups] dev`; `uv.lock` ist versioniert. Tool-Konfiguration
(ruff, mypy, pytest) ebenfalls in `pyproject.toml`.

## Befehle

```bash
# im Monorepo-Root: ganze Anwendung (DB, API, Frontend) – siehe ../docs/architecture.md#lokal-starten
./script.sh dev                    # Postgres :5432, API :8000 (uvicorn --reload, ./app und ./tests gemountet), Frontend :5173
./script.sh dev --tools            # zusätzlich pgAdmin :5050
docker compose -f compose.dev.yaml logs -f app   # API-Logs (Container dnd-dev-api)
docker compose -f compose.dev.yaml down          # stoppen (-v: DB-Reset); ./script.sh stop stoppt Dev und Prod

# in backend/: nur Backend (DB + API; pgAdmin mit --profile tools)
docker compose up --build

# Production-Stack am Spieltisch (im Root): API ohne Reload und ohne Code-Mount (Container dnd-prod-api)
./script.sh prod                   # bzw. dnd prod (nach einmaligem ./script.sh install) oder docker compose -f compose.prod.yaml up -d --build --wait
# Healthcheck in compose.prod.yaml: GET /scenes per Python (kein curl im Image); dnd prod wartet per --wait auf healthy

# Lint/Typen/Tests lokal (in backend/, uv installiert Python 3.11 bei Bedarf selbst)
uv sync                            # .venv mit Laufzeit- und Dev-Abhängigkeiten (Dev-Stack muss nicht laufen)
uv run ruff check                  # Lint (--fix behebt Import-Sortierung u. a.)
uv run ruff format                 # Formatierung (CI: --check)
uv run mypy app                    # Typprüfung (Basis-Modus)
HOST=localhost uv run pytest       # Tests gegen die DB des laufenden Dev-Stacks (Port 5432); HOST aus .env (db) überschreiben

# Tests im Dev-Container (DB `db` aus dem Compose-Netz, Image mit Dev-Gruppe)
docker compose run --rm app pytest                          # in backend/, wenn der Root-Stack nicht läuft
docker compose -f compose.dev.yaml run --rm app pytest      # im Root bzw. bei laufendem ./script.sh dev
docker compose -f compose.dev.yaml run --rm --no-deps app sh -c 'ruff check && ruff format --check && mypy app'
# Nach Änderungen an pyproject.toml/uv.lock das Image neu bauen (--build bzw. ./script.sh dev).
```

Abhängigkeiten ändern: `uv add <paket>==<version>` (Laufzeit) bzw. `uv add --dev <paket>`; Upgrade per Pin-Anpassung
in `pyproject.toml` und `uv lock`. `requirements.txt` gibt es nicht mehr.

**Tests** (`tests/`, pytest) sind Charakterisierungstests: Sie halten das **aktuelle** Verhalten aller Endpoints fest,
auch bekannte Bugs (markiert mit `# known issue: …`). Erwartungen werden aus `app/db/data/seed_data.json` berechnet;
die Test-DB muss daher genau diesen Seed enthalten – nach Seed-Änderungen DB zurücksetzen (`docker compose down -v`).
Der `TestClient` läuft mit `raise_server_exceptions=False`, damit 500er als Response prüfbar sind. Behebt ein Task
einen der Bugs, stellt er den zugehörigen Test gezielt um.

Benötigt `backend/.env` (gitignored), angelegt aus `.env.example`: `cp .env.example .env`, Platzhalter ersetzen.
Schlüssel: `DRIVERNAME`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `HOST` (`db` – nur im Compose-Netz
erreichbar), `PORT`, `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`. Der Service `app` erhält sie per
`env_file`, nicht über das Image (`.dockerignore` schließt `.env` aus). Import von `app.main` braucht eine erreichbare
DB (beim Start laufen `create_all` und der Seeder).

`Dockerfile`: Multi-Stage mit uv (Version gepinnt über `ghcr.io/astral-sh/uv`): `base` → `dev` (inkl. Dev-Gruppe,
von `docker-compose.yml` per `target: dev` gebaut) → `prod` (letzte Stage, `uv sync --frozen --no-dev`; von
`../compose.prod.yaml` ohne `target` gebaut). Kopiert werden nur `pyproject.toml`, `uv.lock` und `app/`; das venv liegt
unter `/app/.venv` (im `PATH`), der Prozess läuft als Non-Root-User `dnd`. `CMD` startet `uvicorn app.main:app` **ohne**
`--reload`. Den Reload samt Mount von `./app` (und `./tests`) setzt nur der Dev-Stack über `command`/`volumes` in
`docker-compose.yml`.

## Struktur & Schichten

```
app/main.py            App, CORS, create_all, Router einbinden, Seeder beim Import
app/routes/*.py        APIRouter je Ressource (scenes_router, maps_router) – nur HTTP-Mapping
app/services/*.py      Klasse mit @staticmethod-Methoden (SceneService, MapsService) – Fachlogik
app/db/crud.py         generische DB-Helfer (read_all, read_by_id, read_join_all)
app/db/models.py       SQLAlchemy-Models: Scene, GraphicsWall, GraphicsGround, Music, scene_music_association
app/db/database.py     Engine aus Env-Variablen, SessionLocal, Base, get_db()
app/db/seed.py         Seeder; Daten in app/db/data/seed_data.json
tests/conftest.py      Fixtures: TestClient, Seed-Daten und daraus berechnete Erwartungen
tests/test_*.py        Charakterisierungstests je Router (scenes, maps)
```

Neue Funktionalität folgt dem Muster **route → service → crud → model**. Die DB-Session kommt per
`Depends(get_db)`; Services bekommen sie als Parameter.

## Konventionen

- Imports absolut ab `app.` (z. B. `from app.db.models import Scene`).
- Routen geben ORM-Objekte direkt zurück (keine Pydantic-Schemas, kein `response_model`). Relationen sind nur
  enthalten, wenn sie per `joinedload` geladen wurden (siehe `read_join_all`).
- ruff: Zeilenlänge 120, Regelsets `E`, `F`, `W`, `I`, `B`, `UP`, `SIM`; ignoriert nur `B008` (`Depends(...)` als
  Default ist FastAPI-Idiom). Code ist mit `ruff format` formatiert (doppelte Quotes).
- mypy im Basis-Modus (kein `strict`); gezielte `# type: ignore[...]` mit Fehlercode statt pauschaler Ignores.
- Tabellen-/Spaltennamen snake_case, Model-Klassen PascalCase.

## Wichtig beim Ändern

- **API-Vertrag:** Das Frontend spiegelt die Antwort von `/scenes/details` im Interface `SceneDetail`
  (`../frontend/src/models/models.ts`). Feld- oder Pfadänderungen dort mitziehen.
- **`source`-Pfade** in `seed_data.json` verweisen auf Dateien in `../frontend/public/` (z. B.
  `/assets/images/ground_screen/main_1.jpg`). Das Backend liefert keine Dateien aus.
- **Seed:** Referenzen (`graphics_wall_id`, `graphics_ground_id`, `music_id`-Liste) sind Autoincrement-IDs in
  Dateireihenfolge – Einträge nicht umsortieren. Der Seeder befüllt nur leere Tabellen; Änderungen an der JSON
  erfordern einen DB-Reset (z. B. `docker compose down -v`).
- **Keine Migrationen:** `create_all` legt nur fehlende Tabellen an; Schemaänderungen brauchen ebenfalls einen DB-Reset.
- `Scene.main == true` = Kampfszene (Mainmap), `false` = Nicht-Kampfszene (Sidemap). Alte Namen
  (`battlemap`, `sidemap`, `fight`) nicht wieder einführen; `v1-roguelike` (Tags `archive/*`) ist verworfen.
- Bekannte Bugs (500 statt 404, `/scenes/details/{id}` gibt bei unbekannter ID die Liste zurück, ungenutzte Spalten
  u. a.): siehe `../docs/known-issues.md`.

## CI

`../.github/workflows/backend.yml` (Root des Monorepos): bei Push auf `main`/`development` mit Änderungen unter
`backend/` drei parallele Jobs: `lint` und `test` direkt auf dem Runner (`astral-sh/setup-uv` mit Cache auf `uv.lock`,
`uv sync --frozen`) – `lint`: `uv run ruff check`, `uv run ruff format --check`, `uv run mypy app`; `test`:
`uv run pytest` gegen einen Service-Container `postgres:17` (Env wie `.env.example`, `HOST=localhost`). Der Job
`docker-prod` baut das Prod-Image (`docker build --target prod`, ohne Push).
