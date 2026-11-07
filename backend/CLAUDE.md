# backend (dnd-portal)

REST-API, WebSocket `/ws` und PostgreSQL; liefert `../media` unter `/media` aus. Endpoints, WebSocket, Datenmodell,
Synchronisation, Audio, Konfiguration (`.env`, auch [README.md](README.md#konfiguration)), Docker und CI:
[../docs/architecture.md](../docs/architecture.md).

## Stack

FastAPI · Pydantic 2 · pydantic-settings · SQLAlchemy 2.1 (typisierter 2.0-Stil) · psycopg2 · Alembic. Tooling: uv,
ruff, mypy, pytest, vulture, deptry, xenon, pylint (nur `duplicate-code`). Versionen exakt gepinnt in
`pyproject.toml` (Dev-Gruppe `[dependency-groups] dev`, `uv.lock` versioniert), dort auch die Tool-Konfiguration;
xenon-Grenzen im `Makefile`.

## Befehle

Starten: [../docs/architecture.md](../docs/architecture.md#lokal-starten). Lokal in `backend/` (uv installiert
Python 3.11 bei Bedarf selbst):

```bash
uv sync                            # .venv mit Laufzeit- und Dev-Abhängigkeiten
uv run ruff check                  # Lint (--fix behebt Import-Sortierung u. a.)
uv run ruff format                 # Formatierung (CI: --check)
uv run mypy app                    # Typprüfung (strict, Pydantic-Plugin)
DB_HOST=localhost uv run pytest    # Tests gegen die DB des laufenden Dev-Stacks (Port 5432)
uv run python scripts/export_openapi.py   # openapi.json schreiben (nach jeder Schema-/Routenänderung)
make check-quality                 # alle Qualitätsprüfungen, einzeln:
make check-deadcode                #   vulture (inkl. vulture_whitelist.py, vulture_baseline.py)
make check-deps                    #   deptry
make check-complexity              #   xenon (radon-Ränge für app/)
make check-dupes                   #   pylint duplicate-code (app/, ab 8 Zeilen)

# im Dev-Container (im Root; nach Änderungen an pyproject.toml/uv.lock mit --build)
docker compose -f compose.dev.yaml run --rm api pytest
docker compose -f compose.dev.yaml run --rm --no-deps api sh -c 'ruff check && ruff format --check && mypy app'
```

Abhängigkeiten: `uv add <paket>==<version>` bzw. `uv add --dev <paket>`; Upgrade per Pin in `pyproject.toml` und
`uv lock`.

## Tests

- Erwartungen werden aus `app/db/data/seed_data.json` berechnet; die Test-DB muss genau diesen Seed enthalten –
  nach Seed-Änderungen DB zurücksetzen (`docker compose -f compose.dev.yaml down -v` im Root).
- `tests/conftest.py` setzt `MEDIA_DIR` vor dem Import von `app` auf ein temporäres Verzeichnis (Fixture `media_dir`).
- `TestClient` als Context Manager (der `lifespan` führt Migrationen und Seeder aus), mit
  `raise_server_exceptions=False`, damit 500er als Response prüfbar sind.
- Schreibende Tests nutzen die Fixture `db`: Sie ersetzt `get_db` (`app.dependency_overrides`) und
  `app.realtime.push.SessionLocal` durch eine Session in einer äußeren, danach zurückgerollten Transaktion (Commits
  werden Savepoints); danach setzt sie Wall-Overlay und Rasterfarbe (im Speicher) auf `off`. `other_adventure` legt
  ein zweites Abenteuer an.
- Der Musikzustand liegt im Speicher; die Fixture `reset_audio` setzt ihn nach dem Test zurück (in `db` enthalten).
- Migrationstests (`test_migration_000n.py`) laufen in einer eigenen temporären DB – braucht `CREATE DATABASE`.
- WebSocket-Tests lesen mit Timeout (ein fehlender Push lässt den Test scheitern statt zu blockieren);
  `receive_any` überspringt `fight`. Zufall, Intervalle, Settings und leere Listen per `monkeypatch`.

## Struktur

```
app/main.py      App, lifespan (Migrationen, Seeder, Musikzustand), CORS, Router mit Prefix/Tags, /media
app/core/        Settings und Instanz `settings`
app/db/          Base (Namenskonvention), Session, Migrationsstart, Seeder (data/seed_data.json)
app/models/      SQLAlchemy-Models; __init__.py re-exportiert alle
app/schemas/     Pydantic-Schemas des API-Vertrags
app/api/         deps.py (SessionDep), routes/ (je Ressource ein `router`, nur HTTP-Mapping)
app/services/    Fachlogik
app/crud/        DB-Zugriffe
app/realtime/    WebSocket: Verbindungsmanager, Push, Musikzustand, Origin-Prüfung, Zustand im Speicher
migrations/      Alembic: env.py, versions/ (nummeriert, 0001_…)
tests/           pytest; Fixtures in conftest.py
scripts/         export_openapi.py → openapi.json (versioniert, Basis der Frontend-Typen)
```

Neue Funktionalität folgt dem Muster **route → service → crud → model**.

## Konventionen

- Imports absolut ab `app.`; Services/CRUD als Modul (`from app.services import scene as scene_service`).
- Routen-Module exportieren `router = APIRouter()` mit Pfaden ohne Prefix; Prefix und Tags nur in `app/main.py`.
  DB-Session per `db: SessionDep`.
- Services und CRUD sind Modul-Funktionen, `db` ist immer der erste Parameter.
- Konfiguration nur über `settings` (`app/core/config.py`), kein `os.environ`; neue Werte als Feld in `Settings` und
  in `.env.example`.
- Antworten sind Pydantic-Schemas (`from_attributes=True`): bei ORM-Rückgabe `response_model`, sonst
  Rückgabe-Annotation; kein `response_model=None`. „Nicht gefunden“ meldet der Service mit `None`, die Route wirft
  404 und dokumentiert sie per `responses`. Fachliche Ablehnungen meldet der Service per Exception, die Route
  übersetzt sie (422 bzw. 409).
- Änderungen am Spieltisch pusht die Route per `BackgroundTask` nach dem Commit (`push_state`, `push_fight`,
  `push_audio`, `send_sound`); Audio-Routen sind `async` (ohne DB) und ändern den Zustand unter
  `manager.state_lock`. Ein uvicorn-Worker, weil der Verbindungsmanager im Prozess liegt.
- Abfragen nur mit `select()`, `db.scalars()`, `db.get()` (kein `db.query`), gefiltert in SQL; Relationen fürs
  Schema eager laden, bei `joinedload` von Collections `.unique()`.
- Models: `Mapped[...]`/`mapped_column`, Nullbarkeit im Typ wie im Schema
  ([Datenmodell](../docs/architecture.md#datenmodell)); Relationen zwischen Modulen per `TYPE_CHECKING`-Import.
- ruff: Zeilenlänge 120, `max-complexity = 8`, doppelte Quotes; Regelsets in `pyproject.toml`.
- mypy `strict` für `app/` (nicht `tests/`, `migrations/`); kein `# type: ignore` ohne Fehlercode und Begründung.
- Docstrings und Kommentare: [CONTRIBUTING.md](../CONTRIBUTING.md#code-comments).
- Qualitätsprüfungen: Stand von DND-31 ist die Baseline (`vulture_baseline.py`, `[tool.deptry.per_rule_ignores]`,
  Grenzen im `Makefile`). Keine neuen Baseline-Einträge, Grenzen nicht lockern; beim Aufräumen Eintrag entfernen
  bzw. Grenze verschärfen. Funde: `../docs/known-issues.md`.
- Tabellen-/Spaltennamen snake_case, Model-Klassen PascalCase.

## Wichtig beim Ändern

- **API-Vertrag:** nach Änderungen an Schemas oder Routen `openapi.json` neu exportieren
  ([Ablauf](../docs/architecture.md#api-vertrag--typgenerierung)).
- **Medien:** alle in Tabelle `media`; `storage_key` relativ zu `../media`, `source` wird berechnet.
- **Seed:** Referenzen sind Autoincrement-IDs in Dateireihenfolge – nicht umsortieren. Der Seeder befüllt nur leere
  Tabellen, Änderungen an der JSON brauchen einen DB-Reset.
- Keine Szenenarten wieder einführen (`scene.main` seit Migration `0005` entfernt).
- Bekannte Lücken: `../docs/known-issues.md`.

## Migrationen

Das Schema entsteht nur über Alembic, nie per `create_all`; der App-Start führt `alembic upgrade head` und danach
den Seeder aus. Ablauf für Schemaänderungen (Dev-Stack läuft, in `backend/`):

1. Model in `app/models/` ändern.
2. `DB_HOST=localhost uv run alembic revision --autogenerate --rev-id <nnnn> -m "<beschreibung>"` (nächste Nummer;
   DB auf `head`). Die Datei wird per ruff formatiert.
3. Migration prüfen und anpassen (Autogenerate erkennt z. B. Umbenennungen nicht); `upgrade` und `downgrade`
   vollständig.
4. `DB_HOST=localhost uv run alembic upgrade head`, `… alembic check`, `… alembic downgrade -1`, wieder
   `upgrade head`; dann Tests.
5. Model und Migration gemeinsam committen.

```bash
DB_HOST=localhost uv run alembic current     # aktuelle Revision der DB
DB_HOST=localhost uv run alembic history     # alle Revisionen
DB_HOST=localhost uv run alembic check       # Modelle ↔ Migrationen ohne Drift (auch in CI)
```
