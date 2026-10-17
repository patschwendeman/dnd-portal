# Architektur

```
 Rechner Spielleiter (ein Browser, mehrere Fenster/Monitore)          Smartphones
 ┌──────────┐  ┌──────────┐  ┌──────────┐                            ┌──────────┐
 │ /admin   │  │ /wall    │  │ /ground  │                            │ /        │ × n
 └────┬─────┘  └────┬─────┘  └────┬─────┘                            └──────────┘
      │  localStorage + "storage"-Event (activeSceneId, isDarkTheme)                (keine Anbindung)
      └─────────────┴─────────────┘
                    │ HTTP GET (axios, http://localhost:8000)
            ┌───────▼────────┐         ┌──────────────┐
            │ FastAPI        │────────▶│ PostgreSQL   │
            │ backend :8000  │         │ :5432        │
            └────────────────┘         └──────────────┘
 Szenenmedien (Wall-/Ground-Bilder, Musik) liefert das Backend unter /media aus (Ordner media/ im Repo-Root).
 Übrige statische Assets (Sounds, Icons, Markdown) liefert das Frontend aus public/ aus:
 Dev: Vite-Server (:5173), Production: nginx (:8080) mit dem gebauten public/.
```

## Synchronisation

- Es gibt **keine** WebSockets, SSE oder Polling.
- Der Admin setzt `activeSceneId`; `App.tsx` schreibt es in `localStorage`. Andere Fenster desselben Browsers erhalten
  das `storage`-Event, aktualisieren ihren Context und laden die Szene neu vom Backend.
- Funktioniert nur für Fenster **desselben Browser-Profils auf demselben Rechner und Origin** – passend zum Setup
  „ein Rechner, mehrere Monitore“. Player-Screens auf Smartphones sind nicht angebunden.

## Backend (`backend`)

- Python 3.11, FastAPI 0.143, SQLAlchemy 2.1 (typisierter 2.0-Stil: `DeclarativeBase`, `Mapped[...]`, `select()`), psycopg2, Alembic, PostgreSQL 17;
  Abhängigkeiten per uv (`pyproject.toml`, `uv.lock`).
- Schichten (Paket `app`): `app/api/routes/*` (je Modul ein `router`, Prefix/Tags zentral in `app/main.py`) →
  `app/services/*` (Modul-Funktionen) → `app/crud/*` → `app/models/*`. Konfiguration in `app/core/config.py`
  (pydantic-settings), Engine/Session in `app/db/session.py`. Antwortformen als Pydantic-Schemas in `app/schemas/*`
  (`response_model` bzw. Rückgabe-Annotation der Routen).
- Beim App-Start (`lifespan`) bringt `app/db/migrate.py` das Schema per Alembic auf den neuesten Stand
  (`alembic upgrade head`, Migrationen in `backend/migrations/versions/`; kein `create_all`). Danach läuft der Seeder
  (`app/db/seed.py`, Daten in `app/db/data/seed_data.json`) – je Tabelle nur, wenn sie leer ist. Enthält die DB
  Tabellen, aber keine `alembic_version` (Schema von vor den Migrationen), bricht der Start mit Reset-Hinweis ab
  (einmalig `docker compose -f compose.dev.yaml down -v` bzw. `… compose.prod.yaml down -v`). Ablauf für
  Schemaänderungen: `backend/CLAUDE.md`, Abschnitt „Migrationen“. `import app.main` allein baut keine DB-Verbindung auf.

### Endpoints (GET, nur Abenteuer zusätzlich PATCH; keine Auth)

| Pfad | Liefert |
|---|---|
| `/adventures` | `list[AdventureSummary]`: alle Abenteuer nach ID (200, ggf. `[]`) |
| `/adventures/{adventure_id}` | `AdventureDetail` inkl. Spieler (200) bzw. 404 `{"detail": "Adventure not found"}` |
| `PATCH /adventures/{adventure_id}` | Body `AdventureUpdate`, Antwort `AdventureDetail` (200); 404 wie oben; 422 `{"detail": "Scene does not belong to adventure"}`, wenn `active_scene_id` nicht existiert oder zu einem anderen Abenteuer gehört (nichts wird geändert), 422 im FastAPI-Standardformat bei `global_level` außerhalb 1–20 |
| `/adventures/{adventure_id}/scenes` | `list[SceneDetail]`: Szenen des Abenteuers nach ID (200, ggf. `[]`); 404 wie oben |
| `/adventures/{adventure_id}/maps/main` | `list[MapEntry]` der Kampfszenen des Abenteuers (wie `/maps/main`); 404 wie oben |
| `/adventures/{adventure_id}/maps/side` | `list[MapEntry]` der Nicht-Kampfszenen des Abenteuers (wie `/maps/side`); 404 wie oben |
| `/scenes` | `list[SceneDetail]`: alle Szenen aller Abenteuer nach ID (200, ggf. `[]`) |
| `/scenes/{scene_id}` | `SceneDetail` (200) bzw. 404 `{"detail": "Scene not found"}` |
| `/maps/main` | `list[MapEntry]`: `{id: scene.id, source: ground_image.source}` je Kampfszene (200, ggf. `[]`) |
| `/maps/side` | `list[MapEntry]`: `{id: scene.id, source: wall_image.source}` je Nicht-Kampfszene (200, ggf. `[]`) |
| `/media/{storage_key}` | Mediendatei aus dem Medienordner (`StaticFiles`, nicht in OpenAPI): 200 bzw. 206 bei `Range`-Header (Audio-Seek), 404 bei fehlender Datei oder Pfad außerhalb des Ordners |

`/scenes` und `/maps/*` gelten global über alle Abenteuer; das Frontend nutzt bisher nur sie (die Umstellung auf die
Pfade je Abenteuer folgt in DND-24). `/scenes/{scene_id}` bleibt der Einstieg für Wall und Ground, weil die Szenen-ID
global eindeutig ist.

Kanonische Pfade sind ohne Slash am Ende (mit Slash antwortet FastAPI mit 307-Redirect). Fehler im Default-Format
`{"detail": "..."}`.

### Antwortformat

```
SceneDetail { id: int, name: str, description: str, main: bool,
              wall_image: Image, ground_image: Image, tracks: list[Track] }   tracks nach ID sortiert
Image       { id: int, name: str, source: str }
Track       { id: int, name: str, source: str }
MapEntry    { id: int, source: str }                                         id = Szenen-ID

AdventureSummary { id: int, name: str, description: str | null }
AdventureDetail  { id: int, name: str, description: str | null, global_level: int,
                   active_scene_id: int | null, players: list[Player] }       players nach ID sortiert
Player           { id: int, player_name: str, character_name: str, race: str,
                   character_class: str, avatar: Image | null }
AdventureUpdate  { active_scene_id?: int | null, global_level?: int (1–20) }  Request-Body von PATCH
```

Alle Felder sind Pflicht; nullable sind nur `description` und `active_scene_id` des Abenteuers sowie `avatar` des
Spielers. Die Fremdschlüssel (`wall_image_id`, `adventure_id` …) sind nicht Teil der Antwort, `SceneDetail` enthält
kein `adventure_id`. Bei `AdventureUpdate` ändert `PATCH` nur die gesetzten Felder; `"active_scene_id": null` leert
die aktive Szene, `"global_level": null` wird abgelehnt (422).
`source` ist der API-relative Pfad der Datei, `/media/<storage_key>` (aus `media.storage_key` berechnet, nicht
gespeichert), z. B. `/media/images/ground_screen/main_1.jpg`. Das Frontend macht daraus per `mediaUrl(source)`
(`src/api/mediaUrl.ts`) eine absolute URL auf Basis von `VITE_API_URL` – dieselbe Basis wie der axios-Client.

### API-Vertrag & Typgenerierung

`backend/openapi.json` (versioniert) ist die Single Source of Truth für den Vertrag: Das Skript
`backend/scripts/export_openapi.py` schreibt `app.openapi()` deterministisch dorthin (ohne DB-Verbindung, die
`Settings`-Werte aus `.env` bzw. Umgebung reichen). Das Frontend erzeugt daraus per `openapi-typescript`
`frontend/src/api/schema.d.ts` (versioniert, von ESLint ausgenommen); `src/models/models.ts` leitet `SceneDetail`,
`Image`, `Track` und `MapResponse` (= `MapEntry`) davon ab.

Ablauf bei einer Vertragsänderung:
1. Backend ändern (Schema in `app/schemas/`, Route, Tests).
2. `uv run python scripts/export_openapi.py` (in `backend/`).
3. `npm run generate:api` (in `frontend/`).
4. Frontend an die geänderten Typen anpassen (`npm run typecheck` zeigt die Stellen).

CI prüft beide Dateien auf Aktualität (Export bzw. Generierung + `git diff --exit-code`).

### Datenmodell

```
Adventure → adventure (id, name, description (Text, nullable), global_level (1–20, Default 1),
                       active_scene_id → scene (nullable, ON DELETE SET NULL))
              Adventure.scenes: 1:N, Adventure.players: 1:N (beide nach ID), Adventure.active_scene: N:1
Player    → player    (id, adventure_id → adventure, player_name, character_name, race, character_class,
                       avatar_media_id → media (nullable))
              Player.avatar: N:1
Scene     → scene     (id, adventure_id → adventure, name, description, main: bool, wall_image_id → media,
                       ground_image_id → media (unique))
              Scene.wall_image: N:1 (z. B. teilen sich alle Kampfszenen ein Wall-Bild), Scene.ground_image: 1:1
              Scene.tracks: N:M über scene_track(scene_id, media_id; PK aus beiden)
Media     → media     (id, kind: 'image' | 'audio', name, storage_key (unique), content_type, size (Bytes, nullable))
```

Ein Abenteuer bündelt Szenen und Spieler (je 1:N); `media` ist global. Ein Spieler-Datensatz steht für „diese Person
mit diesem Charakter in diesem Abenteuer“ – in einem anderen Abenteuer bekommt dieselbe Person einen eigenen
Datensatz. `race` und `character_class` sind Freitext (`character_class`, weil `class` in Python ein Schlüsselwort
ist). Die aktive Szene und das globale Level stehen persistent im Abenteuer; dass `active_scene_id` zu einer Szene
desselben Abenteuers gehört, prüft der Service (nicht die DB). Wegen der zirkulären Fremdschlüssel `adventure` ↔ `scene`
legt die Migration den FK `active_scene_id` zuletzt an (im Model `use_alter=True`, Relation mit `post_update=True`).

Nullable sind nur `media.size`, `adventure.description`, `adventure.active_scene_id` und `player.avatar_media_id`. `kind` beschreibt die Dateiart, nicht die Verwendung: Eine Datei ist
genau ein Datensatz und kann mehrfach genutzt werden (z. B. das Level-Up-Bild als Wall- und Ground-Bild).
`storage_key` ist der Pfad relativ zum Medienordner (z. B. `images/wall_screen/forest.jpg`); die API bildet daraus
`source`. Constraint-Namen folgen der Namenskonvention in `app/db/base.py` (z. B. `pk_scene`,
`fk_scene_wall_image_id_media`, `uq_scene_ground_image_id`, `ck_media_kind`, `ck_adventure_global_level`).

**Medienordner:** Die Dateien liegen im Ordner `media/` im Repo-Root (in Git; `images/{ground_screen,wall_screen}`,
`music/{main,side}/…`). Die API liest ihn aus `MEDIA_DIR` (`Settings.media_dir`, Default `/app/media`); die
Compose-Dateien binden `./media` read-only dorthin ein. FastAPI liefert ihn per `StaticFiles` unter `/media` aus
(inkl. `Range`-Requests); eine neue Datei in `media/` ist ohne Frontend-Build per Seed-/DB-Eintrag nutzbar. Upload
gibt es noch nicht.

**Migrationen:** `0001` legt das ursprüngliche Schema an (`wall_image`, `ground_image`, `track` mit Pfad-Strings
`source`), `0002` führt diese in `media` zusammen (`/assets/<rest>` → `storage_key` `<rest>`, gleiche Datei = ein
Datensatz, `size` = NULL) und biegt die Fremdschlüssel um. `0003` legt `adventure` und `player` an und ergänzt
`scene.adventure_id`: Enthält `scene` Zeilen, legt sie das Abenteuer aus dem Seed an („Erstes Abenteuer“,
`global_level` 1, keine aktive Szene) und weist ihm alle Szenen zu; auf einer leeren DB legt sie kein Abenteuer an
(das macht der Seeder). Die Spieler ergänzt der Seeder, weil `player` danach leer ist. `downgrade` entfernt Tabellen,
Spalte und Fremdschlüssel, die Szenen bleiben erhalten. Bestehende Datenbanken laufen jeweils ohne Reset weiter.

**Seed-Daten:** Listen `adventures` (`name`, `description`, `global_level`), `media` (`kind`, `name`, `storage_key`),
`scenes` (Referenz `adventure_id` sowie `wall_image_id`, `ground_image_id`, `track_ids` auf Media-IDs) und `players`
(`adventure_id`, `player_name`, `character_name`, `race`, `character_class`, `avatar_media_id`). Reihenfolge im
Seeder: `adventure` → `media` → `scene` → `player`, `active_scene_id` bleibt leer. Ein Abenteuer („Erstes Abenteuer“)
mit allen Szenen und vier Platzhalter-Spielern („Spieler 1..4“, ohne Avatar). 4 Nicht-Kampfszenen (Default/Dorf, Shop, Taverne, Level Up) und 25
Kampfszenen („Fight 1..25“, teils mit Tags wie Boss, Loot, Ereignis, Key), 76 Medien (33 Bilder, 43 Musiktracks).
IDs ergeben sich aus der Reihenfolge in der JSON-Datei (Autoincrement). Der Seeder ermittelt `content_type` (per
Dateiendung) und `size` aus der Datei im Medienordner; fehlt sie, schreibt er eine Warnung ins Log und legt den
Datensatz trotzdem an (`size` = NULL).

## Frontend (`frontend`)

- React 18, Vite 5, TypeScript 5 (strict), react-router-dom 6, styled-components 6 (Haupt-Styling, zwei Themes),
  MUI nur für `Box`/`Slider`, axios, react-markdown, react-svg.
- State: React-State + ein Context (`ActiveSceneContext`) + `localStorage`. Kein Store-Framework. Die aktive Kachel in
  den Kartenübersichten ergibt sich aus `activeSceneId` (Kachel-ID = Szenen-ID, im Frontend `Map.sceneId`).
- Struktur: `src/app` (Routing, globaler State), `src/screens` (Screens), `src/components`, `src/service` (Datenladen je Screen),
  `src/api` (axios-Client, Base-URL aus `VITE_API_URL`, Default `http://localhost:8000/`, Timeout 5000 ms), `src/models`, `src/utils` (Audio/Musik, Filter, Grid-Layout `getGridLayout`,
  Fehlerbehandlung `loadSafely`), `src/hooks` (`useMusicPlayer`), `src/style` (Themes), `src/context`.
- Fehlerbehandlung beim Datenladen: `getData` reicht Fehler weiter. Die Services laden über `loadData`
  (`src/api/loadData.ts`) und werfen einen `LoadError`, dessen Meldung Netzwerkfehler/Timeout („backend not
  reachable“), HTTP-Status („HTTP 500“) und leere Antwort („… not found“) unterscheidet. Die Screens fangen genau
  einmal über `loadSafely` (`src/utils/loadSafely.ts`), sodass aus Effects keine unhandled rejections entstehen:
  Admin zeigt eine Hinweisleiste mit Icon-Button „Erneut versuchen“, Wall und Ground loggen per `console.error` und behalten den
  letzten Stand. Keine automatischen Wiederholungen. Der `DocumentReader` prüft `response.ok` der Notizdateien.
  Die Ladevorgänge in Effects (Admin, Wall, Ground, `DocumentReader`) laufen über `loadLatest` (ebenfalls
  `src/utils/loadSafely.ts`, aufgebaut auf `loadSafely`): Der Cleanup des Effects markiert die Anfrage als veraltet,
  danach eintreffende Ergebnisse und Fehler werden verworfen. Beim schnellen Szenen- bzw. Tab-Wechsel zählt so nur die
  Antwort zum aktuellen Stand. Die HTTP-Requests selbst werden nicht abgebrochen. Der Retry im Admin Screen erhöht nur
  einen Zähler (`reloadCount`), von dem beide Lade-Effects abhängen.
- Assets in `public/`: `assets/sounds` (Soundeffekte), `assets/icons`, `story/**` (Markdown-Notizen, deutsch) sowie die
  zwei fest eingebundenen Medien `assets/images/ground_screen/mapOverview.jpg` (Weltkarte im Wall Screen) und
  `assets/music/side/forest/From_Past_To_Present.mp3` (Standardmusik im Admin Screen). Szenenbilder und Musik kommen
  vom Backend (`/media/...`, siehe Datenmodell).

## Lokal starten

Die ganze Anwendung läuft lokal in Docker und wird aus dem Root gestartet, am einfachsten per Start-Skript `script.sh`
(macOS). `compose.dev.yaml` (Projektname `dnd-portal-dev`) definiert alle Dev-Services (`db`, `api`, `pgadmin`,
`ui`) selbst, aufgebaut wie `compose.prod.yaml`; `db`, `api` und `pgadmin` lesen ihre Variablen per
`env_file: backend/.env`. Eigene Compose-Dateien in `backend/` bzw. `frontend/` gibt es nicht.

| `./script.sh …` | Wirkung |
|---|---|
| `dev [--tools]` | Docker sicherstellen, Prod-Stack stoppen, Dev-Stack im Vordergrund starten (`--tools`: mit pgAdmin); Ctrl+C beendet |
| `prod` | Docker sicherstellen, Dev-Stack stoppen, Prod-Stack im Hintergrund starten (`up -d --build --wait --wait-timeout 180`: wartet, bis DB und API healthy sind und nginx läuft; sonst Fehlermeldung, Exit ≠ 0, keine Tabs), dann `/admin`, `/wall`, `/ground` im Browser öffnen, Smartphone-URL (`http://<IP von en0>:8080/`) ausgeben; `VITE_API_URL` aus der Umgebung wird durchgereicht |
| `stop` | beide Stacks stoppen (`down` ohne `-v`, DB-Volumes bleiben) |
| `logs [service]` | Logs des Prod-Stacks verfolgen |
| `install` | globalen Befehl `dnd` anlegen: Symlink `dnd` → `<repo>/script.sh` im ersten beschreibbaren Verzeichnis aus `/opt/homebrew/bin`, `/usr/local/bin`, das im `PATH` liegt; ein fremder `dnd` wird nicht überschrieben |
| `uninstall` | Symlink `dnd` entfernen, nur wenn er auf dieses Skript zeigt |
| ohne/unbekanntes Argument | Hilfe, Exit 1 |

„Docker sicherstellen“: Antwortet `docker info` nicht, startet das Skript Docker Desktop (`open -a Docker`) und wartet
bis zu 120 s.

Einmalig `./script.sh install`, danach funktionieren alle Befehle aus jedem Ordner als `dnd prod|dev|stop|logs` (das
Skript ermittelt sein Verzeichnis über die Symlink-Kette; Hilfe und Ausgaben zeigen den aufgerufenen Namen).
`./script.sh <befehl>` funktioniert weiterhin ohne Installation.

**Voraussetzung:** `backend/.env` (gitignored) aus `backend/.env.example` anlegen: `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB` (Postgres-Container und API), `DB_DRIVER`, `DB_HOST` (`db` = Service-Name im
Compose-Netz), `DB_PORT`, optional `CORS_ORIGINS`, `MEDIA_DIR`, `PGADMIN_DEFAULT_EMAIL/PASSWORD`. Die API erhält sie per
`env_file`; `backend/.dockerignore` hält die `.env` aus dem Image. Fehlt ein Pflichtwert, bricht die API beim Start mit
einem Validierungsfehler ab (Feldname im Log). Ältere `.env` mit `DRIVERNAME`/`HOST`/`PORT` einmalig auf
`DB_DRIVER`/`DB_HOST`/`DB_PORT` umbenennen.

| Befehl (im Root, ohne Skript) | Wirkung |
|---|---|
| `docker compose -f compose.dev.yaml up --build` | `db` (Postgres :5432), `api` (API :8000, uvicorn `--reload`, `backend/app`, `backend/migrations` und `backend/tests` gemountet, `media/` read-only unter `/app/media`), `ui` (Vite :5173, `frontend/` gemountet) |
| `docker compose -f compose.dev.yaml --profile tools up` | zusätzlich `pgadmin` (:5050) |
| `docker compose -f compose.dev.yaml up --build db api` | nur Backend (DB und API) |
| `docker compose -f compose.dev.yaml up --build ui` | nur Frontend (alternativ nativ `npm run dev` in `frontend/`) |
| `docker compose -f compose.dev.yaml run --rm api pytest` | Backend-Tests im Dev-Container |
| `docker compose -f compose.dev.yaml logs -f <service>` | Logs verfolgen |
| `docker compose -f compose.dev.yaml down` | stoppen; mit `-v` auch DB-Volume löschen (DB-Reset; Migrationen und Seeder laufen neu) |

Container-Namen nach dem Schema `dnd-<umgebung>-<rolle>`:

| Rolle | Dev | Prod |
|---|---|---|
| DB | `dnd-dev-db` | `dnd-prod-db` |
| API | `dnd-dev-api` | `dnd-prod-api` |
| Frontend | `dnd-dev-ui` | `dnd-prod-ui` |
| pgAdmin | `dnd-dev-pgadmin` | – |

Das DB-Volume des Dev-Stacks heißt `dnd-portal-dev_postgres_data` (Migrationen und Seeder füllen es beim ersten Start).
Nach Änderungen an `frontend/package.json`: `docker compose -f compose.dev.yaml up --build -V` (erneuert das
`node_modules`-Volume). Alte Container aus den früheren Einzel-Repos belegen dieselben Ports (5432, 8000, 5050, 5173) –
vorher stoppen.

UI unter http://localhost:5173 (`/admin`, `/wall`, `/ground`, `/`); das Frontend ruft die API über
`http://localhost:8000/` auf.
Node-Version: `frontend/.nvmrc` (CI) und `frontend/Dockerfile` (`node:18-slim`, Stages `dev` und `build`) synchron halten.

**API-URL:** Das Frontend liest die Base-URL der API aus `VITE_API_URL` (Build-Zeit, von Vite ins Bundle
eingesetzt); ohne Variable gilt `http://localhost:8000/`. Lokal per `frontend/.env` (Vorlage `frontend/.env.example`),
im Production-Image per Build-Argument. Eine andere URL erfordert einen neuen Build.

**LAN/CORS:** Die API erlaubt per CORS nur die Origins aus `CORS_ORIGINS` (`backend/.env`, JSON-Liste; Default
`["http://localhost:5173","http://localhost:8080"]` = Dev- und Prod-Frontend), nur `GET` und `PATCH` (Preflight für
JSON-Body), ohne Credentials. Wird das
Frontend über das LAN geöffnet (z. B. `http://192.168.x.y:8080`), muss dieser Origin in `CORS_ORIGINS` stehen und das
Frontend mit `VITE_API_URL=http://192.168.x.y:8000/` gebaut sein. Der Player Screen ruft die API nicht auf.

### Am Spieltisch (Production)

Für den Spielabend gibt es einen eigenen Stack ohne Hot-Reload und ohne Code-Mounts: `compose.prod.yaml` im Root
(Projektname `dnd-portal-prod`, eigenes DB-Volume; Migrationen und Seeder füllen die DB beim ersten Start). Voraussetzung wie
oben: `backend/.env`.

| Befehl (im Root, ohne Skript; mit Skript: `./script.sh prod` bzw. `dnd prod`) | Wirkung |
|---|---|
| `docker compose -f compose.prod.yaml up -d --build --wait` | `db` (Postgres :5432), `api` (API :8000, uvicorn ohne `--reload`, Code im Image, `media/` read-only unter `/app/media` gemountet), `ui` (nginx :8080 mit dem statischen Build) – alle mit `restart: unless-stopped` |
| `VITE_API_URL=http://<host>:8000/ docker compose -f compose.prod.yaml up -d --build --wait` | Frontend mit anderer API-URL bauen (Default `http://localhost:8000/`) |
| `docker compose -f compose.prod.yaml logs -f <service>` | Logs verfolgen |
| `docker compose -f compose.prod.yaml down` | stoppen; mit `-v` auch DB-Volume löschen (DB-Reset) |

UI unter http://localhost:8080/admin, `/wall` und `/ground` (Fenster im selben Browser auf dem Spieltisch-Rechner);
Smartphones öffnen den Player Screen über `http://<IP des Rechners>:8080/`. nginx liefert `index.html` auch für
direkt aufgerufene Unterrouten aus (SPA-Fallback); die Dateien aus `public/` (Sounds, Icons, Notizen) stecken im
Image, Änderungen daran brauchen einen neuen Build (`--build`). Szenenmedien in `media/` sind per Bind-Mount
eingebunden und brauchen keinen Build. pgAdmin ist nicht enthalten.
Dev- und Prod-Stack nicht gleichzeitig betreiben: API (:8000) und DB (:5432) nutzen dieselben Ports.
Healthchecks: `db` per `pg_isready`, `api` per Python-Einzeiler gegen `http://localhost:8000/scenes` (das Image hat
kein curl); `api` startet erst bei gesunder DB, `ui` erst bei gesunder API. `docker ps` zeigt `dnd-prod-api (healthy)`.

Frontend-Image: `frontend/Dockerfile` mit Stages `dev` (Vite-Dev-Server, von `compose.dev.yaml` per
`target: dev` genutzt), `build` (`npm ci`, `npm run build`) und `prod` (nginx, Konfiguration `frontend/nginx.conf`).
Backend-Image: `backend/Dockerfile` mit uv und Stages `base`, `dev` (inkl. Dev-Abhängigkeiten, von
`compose.dev.yaml` per `target: dev` genutzt) und `prod` (letzte Stage, ohne Dev-Abhängigkeiten, Non-Root-User);
startet `uvicorn app.main:app` ohne `--reload`; den Reload setzt nur der Dev-Stack per `command`.

## Qualitätssicherung

| | Backend | Frontend |
|---|---|---|
| Lint | `uv run ruff check`, `uv run ruff format --check`, `uv run mypy app` (strict, Pydantic-Plugin; Konfig in `pyproject.toml`) | `npm run lint` (ESLint flat config, einfache Quotes, keine Semikolons) |
| Unit-Tests | `uv run pytest` – Tests aller Endpoints in `tests/` (Erwartungen aus dem Seed), gegen PostgreSQL (lokal Dev-DB bzw. Dev-Container) | `npm run test:unit` (vitest, `__tests__/unit/*.spec.ts`) |
| E2E | – | `npm run test:e2e` (jest-cucumber + Selenium/Chrome, braucht laufendes Backend mit Seed-Daten) |
| CI | `.github/workflows/backend.yml` – bei Push auf `main`/`development` mit Änderungen unter `backend/`: parallele Jobs `lint` (ruff check, ruff format --check, mypy, `openapi.json` aktuell) und `test` (Alembic-Rundlauf `upgrade head`, `check`, `downgrade base`, `upgrade head`, danach pytest gegen Service-Container `postgres:17`) direkt auf dem Runner, uv mit Cache auf `uv.lock`; Job `docker-prod` baut das Image (`--target prod`, ohne Push) | `.github/workflows/frontend.yml` – analog für `frontend/` und `backend/openapi.json`: zuerst Job `build` (`vite build`), danach parallel `typecheck` (`src/api/schema.d.ts` aktuell, `tsc -b`), `lint` und `test` (`npm run test:unit`) mit `needs: build`, Node aus `frontend/.nvmrc` (18) mit npm-Cache, `npm ci`; Job `docker-prod` baut das Production-Image (`--target prod`, ohne Push); kein E2E in CI |

Schlägt ein Job fehl (Build, Typecheck, Lint, Test oder Image-Build), ist der Workflow rot.
