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
 Statische Assets (Bilder, Musik, Sounds, Markdown) liefert das Frontend aus public/ aus:
 Dev: Vite-Server (:5173), Production: nginx (:8080) mit dem gebauten public/.
```

## Synchronisation

- Es gibt **keine** WebSockets, SSE oder Polling.
- Der Admin setzt `activeSceneId`; `App.tsx` schreibt es in `localStorage`. Andere Fenster desselben Browsers erhalten
  das `storage`-Event, aktualisieren ihren Context und laden die Szene neu vom Backend.
- Funktioniert nur für Fenster **desselben Browser-Profils auf demselben Rechner und Origin** – passend zum Setup
  „ein Rechner, mehrere Monitore“. Player-Screens auf Smartphones sind nicht angebunden.

## Backend (`backend`)

- Python 3.11, FastAPI 0.143, SQLAlchemy 2.1 (typisierter 2.0-Stil: `DeclarativeBase`, `Mapped[...]`, `select()`), psycopg2, PostgreSQL 17;
  Abhängigkeiten per uv (`pyproject.toml`, `uv.lock`).
- Schichten (Paket `app`): `app/api/routes/*` (je Modul ein `router`, Prefix/Tags zentral in `app/main.py`) →
  `app/services/*` (Modul-Funktionen) → `app/crud/*` → `app/models/*`. Konfiguration in `app/core/config.py`
  (pydantic-settings), Engine/Session in `app/db/session.py`. Kein Pydantic-Schema-Layer, keine `response_model`s.
- Beim App-Start (`lifespan`) werden die Tabellen per `Base.metadata.create_all` angelegt (keine Migrationen). Danach
  läuft der Seeder (`app/db/seed.py`, Daten in `app/db/data/seed_data.json`) – je Tabelle nur, wenn sie leer ist.
  `import app.main` allein baut keine DB-Verbindung auf.

### Endpoints (alle GET, keine Auth)

| Pfad | Liefert |
|---|---|
| `/scenes` | Szenen (nur Spalten) |
| `/scenes/{scene_id}` | eine Szene (nur Spalten) |
| `/scenes/details/` | alle Szenen inkl. `graphics_wall`, `graphics_ground`, `music[]` |
| `/scenes/details/{scene_id}` | eine Szene inkl. Relationen |
| `/maps/main` | `[{id: scene.id, source: graphics_ground.source}]` für Kampfszenen |
| `/maps/side` | `[{id: scene.id, source: graphics_wall.source}]` für Nicht-Kampfszenen |

### Datenmodell

```
Scene(id, name, description, main: bool, graphics_wall_id → GraphicsWall, graphics_ground_id → GraphicsGround (unique), music_id [ungenutzt])
GraphicsWall(id, name, source)            Scene N:1 (z. B. teilen sich alle Kampfszenen ein Wall-Bild; Relation GraphicsWall.scenes ist eine Liste)
GraphicsGround(id, name, source, main)    Scene 1:1; Feld main ungenutzt
Music(id, name, source)                   Scene N:M über scene_music_association(scene_id, music_id)
```

`source` ist jeweils ein Pfad-String relativ zum Frontend-Public-Ordner, z. B. `/assets/images/ground_screen/main_1.jpg`.
Das Backend speichert/liefert **keine Dateien**.

**Seed-Daten:** 4 Nicht-Kampfszenen (Default/Dorf, Shop, Taverne, Level Up) und 25 Kampfszenen („Fight 1..25“, teils
mit Tags wie Boss, Loot, Ereignis, Key), 5 Wall-Bilder, 29 Ground-Bilder, 43 Musiktracks.
IDs ergeben sich aus der Reihenfolge in der JSON-Datei (Autoincrement).

## Frontend (`frontend`)

- React 18, Vite 5, TypeScript 5 (strict), react-router-dom 6, styled-components 6 (Haupt-Styling, zwei Themes),
  MUI nur für `Box`/`Slider`, axios, react-markdown, react-svg.
- State: React-State + ein Context (`ActiveSceneContext`) + `localStorage`. Kein Store-Framework. Die aktive Kachel in
  den Kartenübersichten ergibt sich aus `activeSceneId` (Kachel-ID = Szenen-ID, im Frontend `Map.sceneId`).
- Struktur: `src/app` (Routing, globaler State), `src/screens` (Screens), `src/components`, `src/service` (Datenladen je Screen),
  `src/api` (axios-Client, Base-URL aus `VITE_API_URL`, Default `http://localhost:8000/`, Timeout 5000 ms), `src/models`, `src/utils` (Audio, Filter),
  `src/style` (Themes), `src/context`.
- Fehlerbehandlung beim Datenladen (seit DND-11): `getData` reicht Fehler weiter. Die Services laden über `loadData`
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
- Assets in `public/`: `assets/images/{ground_screen,wall_screen}`, `assets/music/{main,side}/…`,
  `assets/sounds` (Soundeffekte), `assets/icons`, `story/**` (Markdown-Notizen, deutsch).

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
Compose-Netz), `DB_PORT`, optional `CORS_ORIGINS`, `PGADMIN_DEFAULT_EMAIL/PASSWORD`. Die API erhält sie per
`env_file`; `backend/.dockerignore` hält die `.env` aus dem Image. Fehlt ein Pflichtwert, bricht die API beim Start mit
einem Validierungsfehler ab (Feldname im Log). Ältere `.env` mit `DRIVERNAME`/`HOST`/`PORT` einmalig auf
`DB_DRIVER`/`DB_HOST`/`DB_PORT` umbenennen.

| Befehl (im Root, ohne Skript) | Wirkung |
|---|---|
| `docker compose -f compose.dev.yaml up --build` | `db` (Postgres :5432), `api` (API :8000, uvicorn `--reload`, `backend/app` und `backend/tests` gemountet), `ui` (Vite :5173, `frontend/` gemountet) |
| `docker compose -f compose.dev.yaml --profile tools up` | zusätzlich `pgadmin` (:5050) |
| `docker compose -f compose.dev.yaml up --build db api` | nur Backend (DB und API) |
| `docker compose -f compose.dev.yaml up --build ui` | nur Frontend (alternativ nativ `npm run dev` in `frontend/`) |
| `docker compose -f compose.dev.yaml run --rm api pytest` | Backend-Tests im Dev-Container |
| `docker compose -f compose.dev.yaml logs -f <service>` | Logs verfolgen |
| `docker compose -f compose.dev.yaml down` | stoppen; mit `-v` auch DB-Volume löschen (DB-Reset, Seeder läuft neu) |

Container-Namen nach dem Schema `dnd-<umgebung>-<rolle>`:

| Rolle | Dev | Prod |
|---|---|---|
| DB | `dnd-dev-db` | `dnd-prod-db` |
| API | `dnd-dev-api` | `dnd-prod-api` |
| Frontend | `dnd-dev-ui` | `dnd-prod-ui` |
| pgAdmin | `dnd-dev-pgadmin` | – |

Das DB-Volume des Dev-Stacks heißt `dnd-portal-dev_postgres_data` (der Seeder füllt es beim ersten Start).

UI unter http://localhost:5173 (`/admin`, `/wall`, `/ground`, `/`); das Frontend ruft die API über
`http://localhost:8000/` auf.
Node-Version: `frontend/.nvmrc` (CI) und `frontend/Dockerfile` (`node:18-slim`, Stages `dev` und `build`) synchron halten.

**API-URL:** Das Frontend liest die Base-URL der API aus `VITE_API_URL` (Build-Zeit, von Vite ins Bundle
eingesetzt); ohne Variable gilt `http://localhost:8000/`. Lokal per `frontend/.env` (Vorlage `frontend/.env.example`),
im Production-Image per Build-Argument. Eine andere URL erfordert einen neuen Build.

**LAN/CORS:** Die API erlaubt per CORS nur die Origins aus `CORS_ORIGINS` (`backend/.env`, JSON-Liste; Default
`["http://localhost:5173","http://localhost:8080"]` = Dev- und Prod-Frontend), nur `GET`, ohne Credentials. Wird das
Frontend über das LAN geöffnet (z. B. `http://192.168.x.y:8080`), muss dieser Origin in `CORS_ORIGINS` stehen und das
Frontend mit `VITE_API_URL=http://192.168.x.y:8000/` gebaut sein. Der Player Screen ruft die API nicht auf.

### Am Spieltisch (Production)

Für den Spielabend gibt es einen eigenen Stack ohne Hot-Reload und ohne Code-Mounts: `compose.prod.yaml` im Root
(Projektname `dnd-portal-prod`, eigenes DB-Volume; der Seeder füllt die DB beim ersten Start). Voraussetzung wie
oben: `backend/.env`.

| Befehl (im Root, ohne Skript; mit Skript: `./script.sh prod` bzw. `dnd prod`) | Wirkung |
|---|---|
| `docker compose -f compose.prod.yaml up -d --build --wait` | `db` (Postgres :5432), `api` (API :8000, uvicorn ohne `--reload`, Code im Image), `ui` (nginx :8080 mit dem statischen Build) – alle mit `restart: unless-stopped` |
| `VITE_API_URL=http://<host>:8000/ docker compose -f compose.prod.yaml up -d --build --wait` | Frontend mit anderer API-URL bauen (Default `http://localhost:8000/`) |
| `docker compose -f compose.prod.yaml logs -f <service>` | Logs verfolgen |
| `docker compose -f compose.prod.yaml down` | stoppen; mit `-v` auch DB-Volume löschen |

UI unter http://localhost:8080/admin, `/wall` und `/ground` (Fenster im selben Browser auf dem Spieltisch-Rechner);
Smartphones öffnen den Player Screen über `http://<IP des Rechners>:8080/`. nginx liefert `index.html` auch für
direkt aufgerufene Unterrouten aus (SPA-Fallback); die Medien aus `public/` stecken im Image, Änderungen daran
brauchen einen neuen Build (`--build`). pgAdmin ist nicht enthalten.
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
| Unit-Tests | `uv run pytest` – Charakterisierungstests aller Endpoints in `tests/`, gegen PostgreSQL (lokal Dev-DB bzw. Dev-Container) | `npm run test:unit` (vitest, nur `utils.spec.ts`) |
| E2E | – | `npm run test:e2e` (jest-cucumber + Selenium/Chrome, braucht laufendes Backend mit Seed-Daten) |
| CI | `.github/workflows/backend.yml` – bei Push auf `main`/`development` mit Änderungen unter `backend/`: parallele Jobs `lint` (ruff check, ruff format --check, mypy) und `test` (pytest gegen Service-Container `postgres:17`) direkt auf dem Runner, uv mit Cache auf `uv.lock`; Job `docker-prod` baut das Image (`--target prod`, ohne Push) | `.github/workflows/frontend.yml` – analog für `frontend/`: zuerst Job `build` (`vite build`), danach parallel `typecheck` (`tsc -b`), `lint` und `test` (`npm run test:unit`) mit `needs: build`, Node aus `frontend/.nvmrc` (18) mit npm-Cache, `npm ci`; Job `docker-prod` baut das Production-Image (`--target prod`, ohne Push); kein E2E in CI |

Die alten Branches `test` und `v1-roguelike` (verworfen) der früheren Einzel-Repos liegen als Tags `archive/{backend,frontend}-{test,v1-roguelike}` vor.
