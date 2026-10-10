# backend (dnd-portal)

REST-API + PostgreSQL für das DnD Portal. Liefert Szenen mit ihren Wall-/Ground-Bildern und Musik-Playlists an das
Frontend (`../frontend`). Projektübergreifender Kontext (Vision, Screens, Begriffe, bekannte Probleme) liegt
eine Ebene höher in `../CLAUDE.md` und `../docs/`.

## Stack

Python 3.11 · FastAPI 0.143 · Pydantic 2.14 · pydantic-settings 2.15 · SQLAlchemy 2.1 (typisierter 2.0-Stil: `DeclarativeBase`, `Mapped`, `select()`) ·
psycopg2 · PostgreSQL 17. Tooling: uv · ruff (Lint + Format) · mypy · pytest. Laufzeit-Abhängigkeiten exakt gepinnt in
`pyproject.toml`, Dev-Abhängigkeiten in `[dependency-groups] dev`; `uv.lock` ist versioniert. Tool-Konfiguration
(ruff, mypy, pytest) ebenfalls in `pyproject.toml`.

## Befehle

```bash
# im Monorepo-Root: ganze Anwendung (DB, API, Frontend) – siehe ../docs/architecture.md#lokal-starten
./script.sh dev                    # Postgres :5432, API :8000 (uvicorn --reload, ./app und ./tests gemountet), Frontend :5173
./script.sh dev --tools            # zusätzlich pgAdmin :5050
docker compose -f compose.dev.yaml logs -f api   # API-Logs (Container dnd-dev-api)
docker compose -f compose.dev.yaml down          # stoppen (-v: DB-Reset); ./script.sh stop stoppt Dev und Prod

docker compose -f compose.dev.yaml up --build db api   # nur Backend (DB + API; pgAdmin: --profile tools up --build db api pgadmin)

# Production-Stack am Spieltisch (im Root): API ohne Reload und ohne Code-Mount (Container dnd-prod-api)
./script.sh prod                   # bzw. dnd prod (nach einmaligem ./script.sh install) oder docker compose -f compose.prod.yaml up -d --build --wait
# Healthcheck in compose.prod.yaml: GET /scenes per Python (kein curl im Image); dnd prod wartet per --wait auf healthy

# Lint/Typen/Tests lokal (in backend/, uv installiert Python 3.11 bei Bedarf selbst)
uv sync                            # .venv mit Laufzeit- und Dev-Abhängigkeiten (Dev-Stack muss nicht laufen)
uv run ruff check                  # Lint (--fix behebt Import-Sortierung u. a.)
uv run ruff format                 # Formatierung (CI: --check)
uv run mypy app                    # Typprüfung (strict, Pydantic-Plugin)
DB_HOST=localhost uv run pytest    # Tests gegen die DB des laufenden Dev-Stacks (Port 5432); DB_HOST aus .env (db) überschreiben

# Tests im Dev-Container (DB `db` aus dem Compose-Netz, Image mit Dev-Gruppe)
docker compose -f compose.dev.yaml run --rm api pytest      # im Root (startet bei Bedarf die DB mit)
docker compose -f compose.dev.yaml run --rm --no-deps api sh -c 'ruff check && ruff format --check && mypy app'
# Nach Änderungen an pyproject.toml/uv.lock das Image neu bauen (--build bzw. ./script.sh dev).
```

Abhängigkeiten ändern: `uv add <paket>==<version>` (Laufzeit) bzw. `uv add --dev <paket>`; Upgrade per Pin-Anpassung
in `pyproject.toml` und `uv lock`. `requirements.txt` gibt es nicht mehr.

**Tests** (`tests/`, pytest) sind Charakterisierungstests: Sie halten das **aktuelle** Verhalten aller Endpoints fest,
auch bekannte Bugs (markiert mit `# known issue: …`). Erwartungen werden aus `app/db/data/seed_data.json` berechnet;
die Test-DB muss daher genau diesen Seed enthalten – nach Seed-Änderungen DB zurücksetzen (`docker compose -f compose.dev.yaml down -v` im Root).
Der `TestClient` läuft als Context Manager (damit der `lifespan` Tabellen und Seed anlegt) und mit
`raise_server_exceptions=False`, damit 500er als Response prüfbar sind. Daneben prüfen `test_cors.py` (erlaubte
Origins, keine Credentials) und `test_config.py` (`Settings`, ohne DB). Behebt ein Task
einen der Bugs, stellt er den zugehörigen Test gezielt um.

Benötigt `backend/.env` (gitignored), angelegt aus `.env.example`: `cp .env.example .env`, Platzhalter ersetzen.
Schlüssel: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (Postgres-Container und API), `DB_DRIVER`, `DB_HOST`
(`db` – nur im Compose-Netz erreichbar), `DB_PORT`, optional `CORS_ORIGINS` (JSON-Liste, Default Dev- und
Prod-Frontend auf localhost), `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`. Gelesen werden sie von `Settings`
in `app/core/config.py` (Umgebung vor `.env`); fehlende Pflichtwerte brechen den Start mit Validierungsfehler ab.
Ältere `.env` mit `DRIVERNAME`/`HOST`/`PORT` einmalig umbenennen. Der Service `api` erhält sie per `env_file`, nicht
über das Image (`.dockerignore` schließt `.env` aus). `import app.main` braucht keine DB; `create_all` und der Seeder
laufen erst beim App-Start (`lifespan`).

`Dockerfile`: Multi-Stage mit uv (Version gepinnt über `ghcr.io/astral-sh/uv`): `base` → `dev` (inkl. Dev-Gruppe,
von `../compose.dev.yaml` per `target: dev` gebaut) → `prod` (letzte Stage, `uv sync --frozen --no-dev`; von
`../compose.prod.yaml` ohne `target` gebaut). Kopiert werden nur `pyproject.toml`, `uv.lock` und `app/`; das venv liegt
unter `/app/.venv` (im `PATH`), der Prozess läuft als Non-Root-User `dnd`. `CMD` startet `uvicorn app.main:app` **ohne**
`--reload`. Den Reload samt Mount von `./app` (und `./tests`) setzt nur der Dev-Stack über `command`/`volumes` in
`../compose.dev.yaml`.

## Struktur & Schichten

```
app/main.py               App `app`, lifespan (create_all + Seeder), CORS, include_router mit Prefix/Tags
app/core/config.py        Settings (pydantic-settings) und Instanz `settings`
app/db/base.py            class Base(DeclarativeBase)
app/db/session.py         engine, SessionLocal, get_db()
app/db/seed.py            Seeder; Daten in app/db/data/seed_data.json
app/models/               SQLAlchemy-Models: scene.py (Scene, scene_music_association), media.py (GraphicsWall,
                          GraphicsGround, Music); __init__.py re-exportiert alle (vollständige Base.metadata)
app/crud/scene.py         Lesezugriffe auf Scene (read_scenes, read_scene, read_scenes_with_relations,
                          read_scene_with_relations, read_scenes_by_main)
app/services/scene.py     Fachlogik Szenen (get_scenes, get_scene, get_scene_details, get_scene_detail)
app/services/map.py       Fachlogik Karten (get_maps, MapType, MapEntry)
app/api/deps.py           SessionDep
app/api/routes/*.py       je Ressource ein `router` (scenes, maps) – nur HTTP-Mapping
tests/conftest.py         Fixtures: TestClient, Seed-Daten und daraus berechnete Erwartungen
tests/test_*.py           Charakterisierungstests je Router (scenes, maps), CORS, Config
```

Neue Funktionalität folgt dem Muster **route → service → crud → model**.

## Konventionen

- Imports absolut ab `app.` (z. B. `from app.models import Scene`); Services/CRUD als Modul importieren
  (`from app.services import scene as scene_service`).
- Router: jedes Modul in `app/api/routes/` exportiert `router = APIRouter()` mit Pfaden ohne Prefix; Prefix und Tags
  stehen nur in `app/main.py` (`app.include_router(scenes.router, prefix="/scenes", tags=["scenes"])`).
- Services und CRUD sind Modul-Funktionen (keine Klassen), `db` ist immer der erste Parameter.
- DB-Session in Routen per `db: SessionDep` (`app/api/deps.py`, `Annotated[Session, Depends(get_db)]`).
- Konfiguration nur über `from app.core.config import settings` – kein `os.environ`. Neue Werte als Feld in
  `Settings` und in `.env.example` ergänzen.
- Routen geben ORM-Objekte direkt zurück (keine Pydantic-Schemas); bis zum Schema-Task mit `response_model=None` im
  Decorator, damit FastAPI die Rückgabe-Annotation nicht als Response-Modell nutzt. Relationen sind nur enthalten,
  wenn sie per `joinedload` geladen wurden (siehe `read_scenes_with_relations`). Karten liefern `MapEntry`
  (`TypedDict` aus `typing_extensions`, Pydantic verlangt das unter Python < 3.12).
- Models im typisierten 2.0-Stil: `Mapped[...]`/`mapped_column`, Nullbarkeit im Typ (`Mapped[str | None]`) spiegelt das
  Schema; Relationen zwischen Modulen per `TYPE_CHECKING`-Import und String-Annotation. Abfragen nur mit `select()`,
  `db.scalars()`, `db.get()` (kein `db.query`); bei `joinedload` von Collections `.unique()`; gefiltert wird in SQL.
- ruff: Zeilenlänge 120, Regelsets `E`, `F`, `W`, `I`, `B`, `UP`, `SIM`; ignoriert nur `B008` (`Depends(...)` als
  Default ist FastAPI-Idiom). Code ist mit `ruff format` formatiert (doppelte Quotes).
- mypy `strict` mit Pydantic-Plugin für `app/` (nicht für `tests/`); alle Funktionen mit Typannotationen. Kein
  `# type: ignore` ohne Fehlercode und Begründungskommentar.
- Tabellen-/Spaltennamen snake_case, Model-Klassen PascalCase.

## Wichtig beim Ändern

- **API-Vertrag:** Das Frontend spiegelt die Antwort von `/scenes/details` im Interface `SceneDetail`
  (`../frontend/src/models/models.ts`). Feld- oder Pfadänderungen dort mitziehen.
- **`source`-Pfade** in `seed_data.json` verweisen auf Dateien in `../frontend/public/` (z. B.
  `/assets/images/ground_screen/main_1.jpg`). Das Backend liefert keine Dateien aus.
- **Seed:** Referenzen (`graphics_wall_id`, `graphics_ground_id`, `music_id`-Liste) sind Autoincrement-IDs in
  Dateireihenfolge – Einträge nicht umsortieren. Der Seeder befüllt nur leere Tabellen; Änderungen an der JSON
  erfordern einen DB-Reset (z. B. `docker compose -f compose.dev.yaml down -v` im Root).
- **Keine Migrationen:** `create_all` legt nur fehlende Tabellen an; Schemaänderungen brauchen ebenfalls einen DB-Reset.
- `Scene.main == true` = Kampfszene (Mainmap), `false` = Nicht-Kampfszene (Sidemap). Alte Namen
  (`battlemap`, `sidemap`, `fight`) nicht wieder einführen; `v1-roguelike` (Tags `archive/*`) ist verworfen.
- Bekannte Bugs (500 statt 404, `/scenes/details/{id}` gibt bei unbekannter ID die Liste zurück, ungenutzte Spalten
  u. a.): siehe `../docs/known-issues.md`.

## CI

`../.github/workflows/backend.yml` (Root des Monorepos): bei Push auf `main`/`development` mit Änderungen unter
`backend/` drei parallele Jobs: `lint` und `test` direkt auf dem Runner (`astral-sh/setup-uv` mit Cache auf `uv.lock`,
`uv sync --frozen`) – `lint`: `uv run ruff check`, `uv run ruff format --check`, `uv run mypy app`; `test`:
`uv run pytest` gegen einen Service-Container `postgres:17` (Env wie `.env.example`, `DB_HOST=localhost`). Der Job
`docker-prod` baut das Prod-Image (`docker build --target prod`, ohne Push).
