# backend (dnd-portal)

REST-API, WebSocket und PostgreSQL für das DnD Portal. Liefert Abenteuer (mit Spielern, aktiver Szene und globalem Level) und
Szenen mit ihren Wall-/Ground-Bildern und Musik-Playlists an das Frontend (`../frontend`), hält den Spieltisch-Zustand
(aktives Abenteuer, aktive Szene, Theme; das Wall-Overlay nur im Speicher) und den Musikzustand (im Speicher) und pusht beides per WebSocket (`/ws`) an Admin, Wall, Ground und Player, liefert die Player-URL für den QR-Code im
Admin (`GET /table/join`, `Settings.player_url`) und die Mediendateien selbst (Ordner `../media`, unter `/media`). Projektübergreifender Kontext (Vision, Screens, Begriffe, bekannte Probleme) liegt
eine Ebene höher in `../CLAUDE.md` und `../docs/`.

## Stack

Python 3.11 · FastAPI 0.143 · Pydantic 2.14 · pydantic-settings 2.15 · SQLAlchemy 2.1 (typisierter 2.0-Stil: `DeclarativeBase`, `Mapped`, `select()`) ·
psycopg2 · Alembic 1.20 · PostgreSQL 17. Tooling: uv · ruff (Lint + Format) · mypy · pytest · vulture, deptry, xenon,
pylint (nur `duplicate-code`) für die Qualitätsprüfungen. Laufzeit-Abhängigkeiten exakt gepinnt in
`pyproject.toml`, Dev-Abhängigkeiten in `[dependency-groups] dev`; `uv.lock` ist versioniert. Tool-Konfiguration
(ruff, mypy, pytest, vulture, deptry, pylint) ebenfalls in `pyproject.toml`, die xenon-Grenzen im `Makefile`.

## Befehle

Starten der Anwendung (`./script.sh dev|prod`, Compose-Befehle, Container-Namen, Healthchecks):
`../docs/architecture.md#lokal-starten` und `#am-spieltisch-production`. Lint/Typen/Tests lokal (in `backend/`, uv
installiert Python 3.11 bei Bedarf selbst):

```bash
uv sync                            # .venv mit Laufzeit- und Dev-Abhängigkeiten (Dev-Stack muss nicht laufen)
uv run ruff check                  # Lint (--fix behebt Import-Sortierung u. a.)
uv run ruff format                 # Formatierung (CI: --check)
uv run mypy app                    # Typprüfung (strict, Pydantic-Plugin)
DB_HOST=localhost uv run pytest    # Tests gegen die DB des laufenden Dev-Stacks (Port 5432); DB_HOST aus .env (db) überschreiben
uv run python scripts/export_openapi.py   # API-Vertrag nach openapi.json schreiben (nach jeder Schema-/Routenänderung)
make check-quality                 # alle Qualitätsprüfungen (Makefile), einzeln:
make check-deadcode                #   vulture: toter Code (inkl. vulture_whitelist.py, vulture_baseline.py)
make check-deps                    #   deptry: ungenutzte, fehlende oder transitive Dependencies
make check-complexity              #   xenon: Komplexitätsgrenzen für app/ (radon-Ränge)
make check-dupes                   #   pylint duplicate-code: Duplikate in app/ ab 8 Zeilen

# Tests im Dev-Container (im Root; DB `db` aus dem Compose-Netz, Image mit Dev-Gruppe)
docker compose -f compose.dev.yaml run --rm api pytest
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
CRUD-Funktion geprüft. Daneben prüfen `test_cors.py` (erlaubte Origins und Methoden `GET`/`PATCH`, keine Credentials), `test_config.py`
(`Settings`, ohne DB), `test_migrate.py` (Alt-DB-Prüfung über eine Tabellenliste, ohne die Test-DB zu verändern),
`test_media.py` (Auslieferung unter `/media` inkl. `Range`, 404 und Pfad-Traversal; `source`-Format; alle Seed-Dateien
in `../media` vorhanden), `test_seed.py` (Seeder inkl. Abenteuer, Spieler und fehlender Datei, in einer zurückgerollten
Transaktion) sowie `test_migration_0002.py` bis `test_migration_0005.py` (Migration `0001` → `0002`, `0002` → `0003`,
`0003` → `0004` bzw. `0004` → `0005` und zurück mit Daten, in einer eigenen temporären Datenbank – braucht
`CREATE DATABASE`). `test_table.py` prüft `GET`/`PATCH /table` und `GET /table/join` (`player_url` per `monkeypatch` auf `settings`),
`test_ws.py` den WebSocket `/ws` per
`TestClient.websocket_connect` (Snapshot, Push nach `PATCH`, `screen`- und Origin-Prüfung, Ping mit per `monkeypatch`
verkürztem `PING_INTERVAL_SECONDS`, Entfernen getrennter Verbindungen, Audioausgabe per `audio_ready`/`track_ended`,
`sound` nur an die Ausgabe, `screens`: Verbindungszahlen je Screen-Typ nur an Admins, Admins nicht gezählt, Push
bei Verbinden, Trennen und fehlgeschlagenem Senden); Nachrichten werden mit Timeout gelesen, damit ein fehlender Push den Test scheitern lässt
statt ihn zu blockieren. `test_audio.py` prüft `GET`/`PATCH /table/audio`, die Track-Wahl beim Trackende und
`POST /table/sounds` (Zufall per `monkeypatch` auf `audio.random` gesteuert). Der Musikzustand liegt im Speicher: Die
Fixture `reset_audio` setzt ihn nach dem Test zurück (`test_audio.py`, `test_ws.py` und alle Tests mit `db`); das
ebenfalls im Speicher gehaltene Wall-Overlay setzt die Fixture `db` nach dem Test auf `off` zurück.
Schreibende Tests (`PATCH` in `test_adventures.py`, `test_table.py`, `test_ws.py`) laufen über die Fixture `db`
(`tests/conftest.py`): Sie ersetzt `get_db` per `app.dependency_overrides` und die Session des WebSocket-Push
(`app.realtime.push.SessionLocal`) durch eine Session in einer äußeren, danach zurückgerollten Transaktion (Commits
werden Savepoints), sodass die Test-DB den Seed-Stand behält; dort legt `other_adventure` ein zweites Abenteuer mit
eigenen Szenen an (Filter je Abenteuer, fremde Szene bei `PATCH`, Abenteuerwechsel). Der Medienordner der Tests ist ein temporäres Verzeichnis:
`tests/conftest.py` setzt `MEDIA_DIR` vor dem Import von `app` (Fixture `media_dir`).

Konfiguration: `backend/.env` aus `.env.example`, Schlüssel siehe [README.md](README.md#konfiguration). Gelesen von
`Settings` in `app/core/config.py` (Umgebung vor `.env`); der Service `api` erhält die Datei per `env_file`, nicht über
das Image (`.dockerignore` schließt `.env` aus). `import app.main` braucht keine DB; Migrationen und Seeder laufen erst
beim App-Start (`lifespan`).

`Dockerfile`: Multi-Stage mit uv (Version gepinnt über `ghcr.io/astral-sh/uv`): `base` → `dev` (inkl. Dev-Gruppe,
von `../compose.dev.yaml` per `target: dev` gebaut) → `prod` (letzte Stage, `uv sync --frozen --no-dev`; von
`../compose.prod.yaml` ohne `target` gebaut). Kopiert werden nur `pyproject.toml`, `uv.lock`, `alembic.ini`, `migrations/` und `app/`; das venv liegt
unter `/app/.venv` (im `PATH`), der Prozess läuft als Non-Root-User `dnd`. `CMD` startet `uvicorn app.main:app` **ohne**
`--reload`. Den Reload samt Mount von `./app` (sowie `./migrations` und `./tests`) setzt nur der Dev-Stack über `command`/`volumes` in
`../compose.dev.yaml`.

## Struktur & Schichten

```
app/main.py               App `app`, lifespan (Migrationen + Seeder + Start-Musikzustand), CORS, include_router mit Prefix/Tags (WebSocket
                          `ws` mit Prefix `/ws`, ohne Tag),
                          StaticFiles des Medienordners unter /media
app/core/config.py        Settings (pydantic-settings) und Instanz `settings`
app/db/base.py            class Base(DeclarativeBase), MetaData mit Namenskonvention für Constraints
app/db/session.py         engine, SessionLocal, get_db()
app/db/migrate.py         run_migrations(): Alt-DB-Prüfung (check_legacy_schema), dann alembic upgrade head
app/db/seed.py            Seeder; Daten in app/db/data/seed_data.json
app/models/               SQLAlchemy-Models: adventure.py (Adventure), player.py (Player), scene.py (Scene, scene_track),
                          game_table.py (GameTable, genau eine Zeile `GAME_TABLE_ID`),
                          media.py (Media, berechnetes `source`); __init__.py re-exportiert alle (vollständige Base.metadata)
app/schemas/              Pydantic-Schemas des API-Vertrags: game_table.py (GameTableState, GameTableUpdate, Theme,
                          WallOverlay, JoinInfo),
                          audio.py (AudioState, AudioUpdate, SoundRequest, SoundName),
                          adventure.py (AdventureSummary, AdventureDetail, Player,
                          AdventureUpdate), scene.py (SceneDetail, Image, Track)
app/crud/adventure.py     Abenteuer lesen (mit Spielern und Avatar), Existenzprüfung, Update
app/crud/game_table.py    Spieltisch-Zeile lesen (mit aktivem Abenteuer), Update
app/crud/media.py         read_media_by_storage_key (Standardmusik)
app/crud/scene.py         Lesezugriffe auf Scene, immer mit Relationen (read_scenes je adventure_id, read_scene),
                          read_scene_adventure_id
app/services/adventure.py Fachlogik Abenteuer (Liste, Detail, Szenen je Abenteuer → None bei unbekannter ID,
                          update_adventure inkl. Prüfung der aktiven Szene → SceneNotInAdventureError)
app/services/scene.py     Fachlogik Szenen (get_scene → Scene | None)
app/services/audio.py     get_playlist: Tracks der aktiven Szene bzw. Standardmusik (Settings.default_music_key)
app/services/game_table.py Spieltisch-Zustand (get_state inkl. aktiver Szene des aktiven Abenteuers, update_state mit
                          Prüfung des Abenteuers → AdventureNotFoundError, setzt das Wall-Overlay; Abenteuerwechsel
                          → `off`), scene_changed (Szenenwechsel des aktiven Abenteuers → Wall-Overlay `off`, von
                          services/adventure.update_adventure aufgerufen), get_join_info (Settings.player_url)
app/realtime/             WebSocket: manager.py (ConnectionManager `manager` im Prozess, Connection je Verbindung mit
                          Sende-Lock, Broadcast entfernt Verbindungen bei Sendefehler/Timeout, PING_INTERVAL_SECONDS),
                          audio.py (AudioService `audio`: Musikzustand im Speicher, zufällige Track-Wahl, Ausgabe),
                          push.py (push_state als BackgroundTask nach dem Commit, eigene Session, lädt bei Szenenwechsel
                          die Playlist; send_initial_state, push_audio, send_sound, Ausgabe-Wechsel, reset_audio),
                          origin.py (is_origin_allowed: ohne Origin, CORS_ORIGINS oder gleicher Host/Port wie `Host`),
                          wall_overlay.py (WallOverlayState `wall_overlay`: Wall-Overlay im Speicher, Default `off`)
app/api/deps.py           SessionDep
app/api/routes/*.py       je Ressource ein `router` (adventures inkl. Szenen je Abenteuer, scenes nur
                          Einzelszene, table, audio mit Prefix `/table` und Tag `audio`, ws) – nur HTTP-Mapping
tests/conftest.py         Fixtures: TestClient, Seed-Daten und daraus berechnete Erwartungen
tests/test_*.py           Tests je Router (adventures inkl. Szenen, scenes, table, audio), WebSocket (ws), Medien (media), CORS,
                          Config, Migrationsstart (migrate), Seeder (seed), Migrationen 0002–0005 (migration_000n)
alembic.ini               Alembic-Konfiguration (ohne DB-URL; Dateinamen <revision>_<slug>.py, ruff als post_write_hook)
migrations/env.py         URL aus settings.database_url, target_metadata = Base.metadata, compare_type=True
migrations/versions/      Migrationen, nummeriert (0001_initial_schema.py, 0002_…, 0003_adventure_and_player.py,
                          0004_game_table.py, 0005_drop_scene_main.py)
scripts/export_openapi.py schreibt app.openapi() nach openapi.json (versioniert, Basis der Frontend-Typen)
Makefile                  Qualitätsprüfungen (check-deadcode, check-deps, check-complexity, check-dupes, check-quality)
vulture_whitelist.py      Falsch-Positive von vulture; vulture_baseline.py: bestehender toter Code (Baseline DND-31)
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
  ORM-Objekte zurück, steht das Schema als `response_model` im Decorator (`/scenes/{id}`, `/adventures*`: Services
  liefern ORM-Objekte bzw. `None`); sonst reicht die Rückgabe-Annotation (`/table` liefert `GameTableState`, `/table/join` liefert `JoinInfo`). Kein `response_model=None`.
  „Nicht gefunden“ meldet der Service mit `None`, die Route wirft `HTTPException(404, "Scene not found")` und
  dokumentiert sie per `responses={404: …}`. Fachliche Ablehnungen meldet der Service per Exception
  (`SceneNotInAdventureError`, `AdventureNotFoundError`), die Route übersetzt sie in 422.
- Schreibende Routen, die den Spieltisch-Zustand ändern können (`PATCH /table`, `PATCH /adventures/{id}`), hängen nach
  Erfolg `push_state` als `BackgroundTask` an (läuft nach dem Commit; die Routen bleiben synchron). Die Audio-Routen
  (`app/api/routes/audio.py`) sind `async` (kein DB-Zugriff), ändern den Musikzustand unter `manager.state_lock` und
  hängen `push_audio` bzw. `send_sound` an. uvicorn läuft mit
  einem Worker, weil der Verbindungsmanager im Prozess liegt.
  Relationen, die ein Schema braucht, lädt die CRUD-Funktion eager (`joinedload`/`contains_eager`, die Spieler
  eines Abenteuers per `selectinload`).
- Models im typisierten 2.0-Stil: `Mapped[...]`/`mapped_column`, Nullbarkeit im Typ spiegelt das Schema (aktuell
  sind alle Spalten außer `media.size`, `adventure.description`, `adventure.active_scene_id`,
  `player.avatar_media_id` und `game_table.active_adventure_id` (`Mapped[... | None]`) `NOT NULL`); Relationen zwischen Modulen per
  `TYPE_CHECKING`-Import und String-Annotation. Abfragen nur mit `select()`,
  `db.scalars()`, `db.get()` (kein `db.query`); bei `joinedload` von Collections `.unique()`; gefiltert wird in SQL.
- ruff: Zeilenlänge 120, Regelsets `E`, `F`, `W`, `I`, `B`, `UP`, `SIM`, `C90` (`max-complexity = 8`), `PIE`, `RET`;
  ignoriert nur `B008` (`Depends(...)` als Default ist FastAPI-Idiom). Code ist mit `ruff format` formatiert
  (doppelte Quotes).
- Qualitätsprüfungen (`make check-*`): Der Stand von DND-31 ist die Baseline. vulture läuft mit `min_confidence = 60`;
  indirekt genutzte Namen stehen in `[tool.vulture]` (`ignore_decorators`, `ignore_names`) bzw. in
  `vulture_whitelist.py` (Falsch-Positive), echter toter Code getrennt in `vulture_baseline.py`. Ausnahmen für deptry
  stehen kommentiert in `[tool.deptry.per_rule_ignores]`. Grenzen (`max-complexity`, xenon-Ränge, pylint
  `fail-under`) sind der Ist-Stand. Keine neuen Baseline-Einträge, Grenzen nicht lockern; beim Aufräumen Eintrag
  entfernen bzw. Grenze verschärfen. Funde: `../docs/known-issues.md`.
- mypy `strict` mit Pydantic-Plugin für `app/` (nicht für `tests/` und `migrations/`; ruff erfasst beide); alle Funktionen mit Typannotationen. Kein
  `# type: ignore` ohne Fehlercode und Begründungskommentar.
- Tabellen-/Spaltennamen snake_case, Model-Klassen PascalCase.

## Wichtig beim Ändern

- **API-Vertrag:** `openapi.json` ist versioniert und Basis der Frontend-Typen; nach Änderungen an Schemas oder
  Routen neu exportieren (Ablauf: `../docs/architecture.md#api-vertrag--typgenerierung`). Alle Mediendateien stehen
  in einer Tabelle `media` (Model `Media`, `kind` `image` | `audio`); die ORM-Relationen heißen wie die API-Felder
  (`Scene.wall_image`, `Scene.ground_image`, `Scene.tracks` über `scene_track(scene_id, media_id)`), die API-Schemas
  `Image` und `Track` bleiben Response-Typen.
- **Medien:** Dateien liegen in `../media` (im Container `/app/media`, `Settings.media_dir`), `media.storage_key` ist
  der Pfad relativ dazu (z. B. `images/ground_screen/main_1.jpg`). Die API liefert `source` = `/media/<storage_key>`
  (berechnet, nicht gespeichert) und die Dateien per `StaticFiles` unter `/media` (inkl. `Range`).
- **Seed:** Listen `adventures`, `media` (`kind`, `name`, `storage_key`), `scenes` und `players`, befüllt in der
  Reihenfolge `adventure` → `media` → `scene` → `player`; Referenzen (`adventure_id`, `wall_image_id`, `ground_image_id`,
  `track_ids`-Liste, `avatar_media_id`) sind Autoincrement-IDs in Dateireihenfolge – Einträge nicht umsortieren. Der Seeder
  ermittelt `content_type` und `size` aus der Datei; fehlt sie, warnt er im Log und legt den Eintrag ohne `size` an.
  Er befüllt nur leere Tabellen; Änderungen an der JSON erfordern einen DB-Reset (z. B.
  `docker compose -f compose.dev.yaml down -v` im Root).
- Alle Szenen sind gleich: Die Spalte `scene.main` (Kampf-/Nicht-Kampfszene) hat Migration `0005` entfernt, die
  Endpoints `/adventures/{id}/maps/main|side` gibt es nicht mehr. Alte Namen (`main`, `side`, `battlemap`, `sidemap`,
  `fight`) nur noch in Asset-Pfaden, nicht wieder einführen; `v1-roguelike` (Tags `archive/*`) ist verworfen.
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
   z. B. `0003`; die DB muss auf `head` stehen). Die Datei wird per ruff formatiert.
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

`../.github/workflows/backend.yml`: Jobs `lint` (ruff, mypy, `openapi.json` aktuell), danach `quality` (`make check-*`),
`test` (Alembic-Rundlauf, pytest gegen `postgres:17`) und `docker-prod` (Image-Build) – Details: `../docs/architecture.md#qualitätssicherung`.
