# backend (dnd-portal)

REST-API + PostgreSQL für das DnD Portal. Liefert Szenen mit ihren Wall-/Ground-Bildern und Musik-Playlists an das
Frontend (`../frontend`). Projektübergreifender Kontext (Vision, Screens, Begriffe, bekannte Probleme) liegt
eine Ebene höher in `../CLAUDE.md` und `../docs/`.

## Stack

Python 3.11 · FastAPI 0.143 · Pydantic 2.14 · pydantic-settings 2.15 · SQLAlchemy 2.1 (typisierter 2.0-Stil: `DeclarativeBase`, `Mapped`, `select()`) ·
psycopg2 · Alembic 1.20 · PostgreSQL 17. Tooling: uv · ruff (Lint + Format) · mypy · pytest. Laufzeit-Abhängigkeiten exakt gepinnt in
`pyproject.toml`, Dev-Abhängigkeiten in `[dependency-groups] dev`; `uv.lock` ist versioniert. Tool-Konfiguration
(ruff, mypy, pytest) ebenfalls in `pyproject.toml`.

## Befehle

```bash
# im Monorepo-Root: ganze Anwendung (DB, API, Frontend) – siehe ../docs/architecture.md#lokal-starten
./script.sh dev                    # Postgres :5432, API :8000 (uvicorn --reload, ./app, ./migrations und ./tests gemountet), Frontend :5173
./script.sh dev --tools            # zusätzlich pgAdmin :5050
docker compose -f compose.dev.yaml logs -f api   # API-Logs (Container dnd-dev-api)
docker compose -f compose.dev.yaml down          # stoppen (-v: DB-Reset); ./script.sh stop stoppt Dev und Prod

docker compose -f compose.dev.yaml up --build db api   # im Root: nur Backend (DB + API)
docker compose -f compose.dev.yaml --profile tools up --build db api pgadmin   # im Root: nur Backend mit pgAdmin

# Production-Stack am Spieltisch (im Root): API ohne Reload und ohne Code-Mount (Container dnd-prod-api)
./script.sh prod                   # bzw. dnd prod (nach einmaligem ./script.sh install) oder docker compose -f compose.prod.yaml up -d --build --wait
# Healthcheck in compose.prod.yaml: GET /scenes per Python (kein curl im Image); dnd prod wartet per --wait auf healthy

# Lint/Typen/Tests lokal (in backend/, uv installiert Python 3.11 bei Bedarf selbst)
uv sync                            # .venv mit Laufzeit- und Dev-Abhängigkeiten (Dev-Stack muss nicht laufen)
uv run ruff check                  # Lint (--fix behebt Import-Sortierung u. a.)
uv run ruff format                 # Formatierung (CI: --check)
uv run mypy app                    # Typprüfung (strict, Pydantic-Plugin)
DB_HOST=localhost uv run pytest    # Tests gegen die DB des laufenden Dev-Stacks (Port 5432); DB_HOST aus .env (db) überschreiben
uv run python scripts/export_openapi.py   # API-Vertrag nach openapi.json schreiben (nach jeder Schema-/Routenänderung)

# Tests im Dev-Container (DB `db` aus dem Compose-Netz, Image mit Dev-Gruppe)
docker compose -f compose.dev.yaml run --rm api pytest      # im Root (startet bei Bedarf die DB mit)
docker compose -f compose.dev.yaml run --rm --no-deps api sh -c 'ruff check && ruff format --check && mypy app'
# Nach Änderungen an pyproject.toml/uv.lock das Image neu bauen (--build bzw. ./script.sh dev).
```

Abhängigkeiten ändern: `uv add <paket>==<version>` (Laufzeit) bzw. `uv add --dev <paket>`; Upgrade per Pin-Anpassung
in `pyproject.toml` und `uv lock`. `requirements.txt` gibt es nicht mehr.

**Tests** (`tests/`, pytest) prüfen alle Endpoints gegen den Vertrag aus `app/schemas/` (Felder, Statuscodes, 404,
leere Listen). Erwartungen werden aus `app/db/data/seed_data.json` berechnet;
die Test-DB muss daher genau diesen Seed enthalten – nach Seed-Änderungen DB zurücksetzen (`docker compose -f compose.dev.yaml down -v` im Root).
Der `TestClient` läuft als Context Manager (damit der `lifespan` Migrationen und Seeder ausführt) und mit
`raise_server_exceptions=False`, damit 500er als Response prüfbar sind. Leere Listen werden per `monkeypatch` auf die
CRUD-Funktion geprüft. Daneben prüfen `test_cors.py` (erlaubte Origins, keine Credentials), `test_config.py`
(`Settings`, ohne DB) und `test_migrate.py` (Alt-DB-Prüfung über eine Tabellenliste, ohne die Test-DB zu verändern).

Benötigt `backend/.env` (gitignored), angelegt aus `.env.example`: `cp .env.example .env`, Platzhalter ersetzen.
Schlüssel: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (Postgres-Container und API), `DB_DRIVER`, `DB_HOST`
(`db` – nur im Compose-Netz erreichbar), `DB_PORT`, optional `CORS_ORIGINS` (JSON-Liste, Default Dev- und
Prod-Frontend auf localhost), `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`. Gelesen werden sie von `Settings`
in `app/core/config.py` (Umgebung vor `.env`); fehlende Pflichtwerte brechen den Start mit Validierungsfehler ab.
Ältere `.env` mit `DRIVERNAME`/`HOST`/`PORT` einmalig umbenennen. Der Service `api` erhält sie per `env_file`, nicht
über das Image (`.dockerignore` schließt `.env` aus). `import app.main` braucht keine DB; Migrationen und Seeder
laufen erst beim App-Start (`lifespan`).

`Dockerfile`: Multi-Stage mit uv (Version gepinnt über `ghcr.io/astral-sh/uv`): `base` → `dev` (inkl. Dev-Gruppe,
von `../compose.dev.yaml` per `target: dev` gebaut) → `prod` (letzte Stage, `uv sync --frozen --no-dev`; von
`../compose.prod.yaml` ohne `target` gebaut). Kopiert werden nur `pyproject.toml`, `uv.lock`, `alembic.ini`, `migrations/` und `app/`; das venv liegt
unter `/app/.venv` (im `PATH`), der Prozess läuft als Non-Root-User `dnd`. `CMD` startet `uvicorn app.main:app` **ohne**
`--reload`. Den Reload samt Mount von `./app` (sowie `./migrations` und `./tests`) setzt nur der Dev-Stack über `command`/`volumes` in
`../compose.dev.yaml`.

## Struktur & Schichten

```
app/main.py               App `app`, lifespan (Migrationen + Seeder), CORS, include_router mit Prefix/Tags
app/core/config.py        Settings (pydantic-settings) und Instanz `settings`
app/db/base.py            class Base(DeclarativeBase), MetaData mit Namenskonvention für Constraints
app/db/session.py         engine, SessionLocal, get_db()
app/db/migrate.py         run_migrations(): Alt-DB-Prüfung (check_legacy_schema), dann alembic upgrade head
app/db/seed.py            Seeder; Daten in app/db/data/seed_data.json
app/models/               SQLAlchemy-Models: scene.py (Scene, scene_track), media.py (WallImage, GroundImage,
                          Track); __init__.py re-exportiert alle (vollständige Base.metadata)
app/schemas/              Pydantic-Schemas des API-Vertrags: scene.py (SceneDetail, Image, Track), map.py (MapEntry)
app/crud/scene.py         Lesezugriffe auf Scene, immer mit Relationen (read_scenes, read_scene, read_scenes_by_main)
app/services/scene.py     Fachlogik Szenen (get_scenes, get_scene → Scene | None)
app/services/map.py       Fachlogik Karten (get_maps → list[MapEntry], MapType)
app/api/deps.py           SessionDep
app/api/routes/*.py       je Ressource ein `router` (scenes, maps) – nur HTTP-Mapping
tests/conftest.py         Fixtures: TestClient, Seed-Daten und daraus berechnete Erwartungen
tests/test_*.py           Tests je Router (scenes, maps), CORS, Config, Migrationsstart (migrate)
alembic.ini               Alembic-Konfiguration (ohne DB-URL; Dateinamen <revision>_<slug>.py, ruff als post_write_hook)
migrations/env.py         URL aus settings.database_url, target_metadata = Base.metadata, compare_type=True
migrations/versions/      Migrationen, nummeriert (0001_initial_schema.py, 0002_…)
scripts/export_openapi.py schreibt app.openapi() nach openapi.json (versioniert, Basis der Frontend-Typen)
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
- Antworten sind Pydantic-Schemas in `app/schemas/` (`ConfigDict(from_attributes=True)`). Geben Route/Service
  ORM-Objekte zurück, steht das Schema als `response_model` im Decorator (`/scenes*`: Services liefern `Scene` bzw.
  `None`); sonst reicht die Rückgabe-Annotation (`/maps/*` liefert `list[MapEntry]`). Kein `response_model=None`.
  „Nicht gefunden“ meldet der Service mit `None`, die Route wirft `HTTPException(404, "Scene not found")` und
  dokumentiert sie per `responses={404: …}`.
  Relationen, die ein Schema braucht, lädt die CRUD-Funktion eager (`joinedload`/`contains_eager`).
- Models im typisierten 2.0-Stil: `Mapped[...]`/`mapped_column`, Nullbarkeit im Typ (`Mapped[str | None]`) spiegelt das
  Schema; Relationen zwischen Modulen per `TYPE_CHECKING`-Import und String-Annotation. Abfragen nur mit `select()`,
  `db.scalars()`, `db.get()` (kein `db.query`); bei `joinedload` von Collections `.unique()`; gefiltert wird in SQL.
- ruff: Zeilenlänge 120, Regelsets `E`, `F`, `W`, `I`, `B`, `UP`, `SIM`; ignoriert nur `B008` (`Depends(...)` als
  Default ist FastAPI-Idiom). Code ist mit `ruff format` formatiert (doppelte Quotes).
- mypy `strict` mit Pydantic-Plugin für `app/` (nicht für `tests/` und `migrations/`; ruff erfasst beide); alle Funktionen mit Typannotationen. Kein
  `# type: ignore` ohne Fehlercode und Begründungskommentar.
- Tabellen-/Spaltennamen snake_case, Model-Klassen PascalCase.

## Wichtig beim Ändern

- **API-Vertrag:** `openapi.json` ist versioniert und Basis der Frontend-Typen; nach Änderungen an Schemas oder
  Routen neu exportieren (Ablauf: `../docs/architecture.md#api-vertrag--typgenerierung`). Klassen, Tabellen und
  ORM-Relationen heißen wie die API-Felder (`WallImage`/`wall_image`/`Scene.wall_image`, `GroundImage`/`ground_image`/
  `Scene.ground_image`, `Track`/`track`/`Scene.tracks`, Zuordnung `scene_track`).
- **`source`-Pfade** in `seed_data.json` verweisen auf Dateien in `../frontend/public/` (z. B.
  `/assets/images/ground_screen/main_1.jpg`). Das Backend liefert keine Dateien aus.
- **Seed:** Listen `wall_images`, `ground_images`, `tracks`, `scenes`; Referenzen (`wall_image_id`, `ground_image_id`,
  `track_ids`-Liste) sind Autoincrement-IDs in Dateireihenfolge – Einträge nicht umsortieren. Der Seeder befüllt nur leere Tabellen; Änderungen an der JSON
  erfordern einen DB-Reset (z. B. `docker compose -f compose.dev.yaml down -v` im Root).
- `Scene.main == true` = Kampfszene (Mainmap), `false` = Nicht-Kampfszene (Sidemap). Alte Namen
  (`battlemap`, `sidemap`, `fight`) nicht wieder einführen; `v1-roguelike` (Tags `archive/*`) ist verworfen.
- Bekannte Lücken und Altlasten: siehe `../docs/known-issues.md`.

## Migrationen

Das Schema entsteht ausschließlich über Alembic (`alembic.ini`, `migrations/`), nie per `create_all`. Der App-Start
(`lifespan` → `app/db/migrate.py`) führt `alembic upgrade head` aus, danach den Seeder – in Dev, Prod, Tests und lokal
gleich. Findet er Tabellen, aber keine `alembic_version` (DB von vor DND-21), bricht er mit `RuntimeError` und
Reset-Hinweis ab: einmalig `docker compose -f compose.dev.yaml down -v` bzw. `docker compose -f compose.prod.yaml down -v`
im Root, dann neu starten.

Ablauf für Schemaänderungen (Dev-Stack läuft, Befehle in `backend/`):

1. Model in `app/models/` ändern.
2. `DB_HOST=localhost uv run alembic revision --autogenerate --rev-id <nnnn> -m "<beschreibung>"` (nächste Nummer,
   z. B. `0002`; die DB muss auf `head` stehen). Die Datei wird per ruff formatiert.
3. Migration prüfen und anpassen (Autogenerate erkennt z. B. Umbenennungen nicht); `upgrade` und `downgrade`
   vollständig.
4. `DB_HOST=localhost uv run alembic upgrade head`, `… alembic check` (keine Abweichung), `… alembic downgrade -1` und
   wieder `upgrade head`; dann Tests (`DB_HOST=localhost uv run pytest`).
5. Model und Migration gemeinsam committen.

```bash
DB_HOST=localhost uv run alembic current     # aktuelle Revision der DB
DB_HOST=localhost uv run alembic history     # alle Revisionen
DB_HOST=localhost uv run alembic check       # Modelle ↔ Migrationen ohne Drift (auch in CI)
```

## CI

`../.github/workflows/backend.yml` (Root des Monorepos): bei Push auf `main`/`development` mit Änderungen unter
`backend/` drei parallele Jobs: `lint` und `test` direkt auf dem Runner (`astral-sh/setup-uv` mit Cache auf `uv.lock`,
`uv sync --frozen`) – `lint`: `uv run ruff check`, `uv run ruff format --check`, `uv run mypy app`, danach
`scripts/export_openapi.py` + `git diff --exit-code openapi.json` (Settings-Werte per `env`, keine DB); `test`:
vor `uv run pytest` gegen einen Service-Container `postgres:17` (Env wie `.env.example`, `DB_HOST=localhost`)
`alembic upgrade head`, `alembic check`, `alembic downgrade base` und erneut `alembic upgrade head` (Rundlauf beweist
`downgrade`). Der Job
`docker-prod` baut das Prod-Image (`docker build --target prod`, ohne Push).
