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

- Python 3.11, FastAPI 0.114, SQLAlchemy 2.0 (klassischer `declarative_base`/`db.query`-Stil), psycopg2, PostgreSQL.
- Schichten: `src/routes/*` → `src/services/*` (statische Methoden) → `src/db/crud.py` (generische Helfer) → `src/db/models.py`.
  Kein Pydantic-Schema-Layer, keine `response_model`s.
- Tabellen werden beim Start per `Base.metadata.create_all` angelegt (keine Migrationen). Danach läuft der Seeder
  (`src/db/seed.py`, Daten in `src/db/data/seed_data.json`) – je Tabelle nur, wenn sie leer ist.

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
GraphicsWall(id, name, source)            Scene N:1 (z. B. teilen sich alle Kampfszenen ein Wall-Bild)
GraphicsGround(id, name, source, main)    Scene 1:1; Feld main ungenutzt
Music(id, name, source)                   Scene N:M über scene_music_association(scene_id, music_id)
```

`source` ist jeweils ein Pfad-String relativ zum Frontend-Public-Ordner, z. B. `/assets/images/ground_screen/battle_1.jpg`.
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
- Assets in `public/`: `assets/images/{ground_screen,wall_screen,maps}`, `assets/music/{battle_maps,side_maps}/…`,
  `assets/sounds` (Soundeffekte), `assets/icons`, `story/**` (Markdown-Notizen, deutsch).

## Lokal starten

Die ganze Anwendung läuft lokal in Docker und wird aus dem Root gestartet, am einfachsten per Start-Skript `dnd.sh`
(macOS). `compose.dev.yaml` (Projektname `dnd-portal-dev`) bindet per `include` `backend/docker-compose.yml` (mit
`backend/.env` für die Interpolation) und `frontend/docker-compose.yml` ein.

| `./dnd.sh …` | Wirkung |
|---|---|
| `dev [--tools]` | Docker sicherstellen, Prod-Stack stoppen, Dev-Stack im Vordergrund starten (`--tools`: mit pgAdmin); Ctrl+C beendet |
| `prod` | Docker sicherstellen, Dev-Stack stoppen, Prod-Stack im Hintergrund starten (`up -d --build --wait --wait-timeout 180`: wartet, bis DB und API healthy sind und nginx läuft; sonst Fehlermeldung, Exit ≠ 0, keine Tabs), dann `/admin`, `/wall`, `/ground` im Browser öffnen, Smartphone-URL (`http://<IP von en0>:8080/`) ausgeben; `VITE_API_URL` aus der Umgebung wird durchgereicht |
| `stop` | beide Stacks stoppen (`down` ohne `-v`, DB-Volumes bleiben) |
| `logs [service]` | Logs des Prod-Stacks verfolgen |
| `install` | globalen Befehl `dnd` anlegen: Symlink `dnd` → `<repo>/dnd.sh` im ersten beschreibbaren Verzeichnis aus `/opt/homebrew/bin`, `/usr/local/bin`, das im `PATH` liegt; ein fremder `dnd` wird nicht überschrieben |
| `uninstall` | Symlink `dnd` entfernen, nur wenn er auf dieses Skript zeigt |
| ohne/unbekanntes Argument | Hilfe, Exit 1 |

„Docker sicherstellen“: Antwortet `docker info` nicht, startet das Skript Docker Desktop (`open -a Docker`) und wartet
bis zu 120 s.

Einmalig `./dnd.sh install`, danach funktionieren alle Befehle aus jedem Ordner als `dnd prod|dev|stop|logs` (das
Skript ermittelt sein Verzeichnis über die Symlink-Kette; Hilfe und Ausgaben zeigen den aufgerufenen Namen).
`./dnd.sh <befehl>` funktioniert weiterhin ohne Installation.

**Voraussetzung:** `backend/.env` (gitignored) aus `backend/.env.example` anlegen: `DRIVERNAME`, `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB`, `HOST` (`db` = Service-Name im Compose-Netz), `PORT`,
`PGADMIN_DEFAULT_EMAIL/PASSWORD`. Die API erhält sie per `env_file`; `backend/.dockerignore` hält die `.env` aus dem Image.

| Befehl (im Root, ohne Skript) | Wirkung |
|---|---|
| `docker compose -f compose.dev.yaml up --build` | `db` (Postgres :5432), `app` (API :8000, uvicorn `--reload`, `backend/src` gemountet), `react-app` (Vite :5173, `frontend/` gemountet) |
| `docker compose -f compose.dev.yaml --profile tools up` | zusätzlich `pgadmin` (:5050) |
| `docker compose -f compose.dev.yaml logs -f <service>` | Logs verfolgen |
| `docker compose -f compose.dev.yaml down` | stoppen; mit `-v` auch DB-Volume löschen (DB-Reset, Seeder läuft neu) |

Container-Namen nach dem Schema `dnd-<umgebung>-<rolle>`:

| Rolle | Dev | Prod |
|---|---|---|
| DB | `dnd-dev-db` | `dnd-prod-db` |
| API | `dnd-dev-api` | `dnd-prod-api` |
| Frontend | `dnd-dev-frontend` | `dnd-prod-frontend` |
| pgAdmin | `dnd-dev-pgadmin` | – |

Das DB-Volume des Dev-Stacks heißt `dnd-portal-dev_postgres_data` (der Seeder füllt es beim ersten Start). Das Volume
`dnd-portal_postgres_data` aus der Zeit vor `compose.dev.yaml` wird nicht mehr genutzt und nicht automatisch
gelöscht (bei Bedarf `docker volume rm dnd-portal_postgres_data`).

UI unter http://localhost:5173 (`/admin`, `/wall`, `/ground`, `/`); das Frontend ruft die API über
`http://localhost:8000/` auf. Einzelstart weiterhin mit `docker compose up` in `backend/` bzw. `frontend/`.
Node-Version: `frontend/.nvmrc` (CI) und `frontend/Dockerfile` (`node:18-slim`, Stages `dev` und `build`) synchron halten.

**API-URL:** Das Frontend liest die Base-URL der API aus `VITE_API_URL` (Build-Zeit, von Vite ins Bundle
eingesetzt); ohne Variable gilt `http://localhost:8000/`. Lokal per `frontend/.env` (Vorlage `frontend/.env.example`),
im Production-Image per Build-Argument. Eine andere URL erfordert einen neuen Build.

### Am Spieltisch (Production)

Für den Spielabend gibt es einen eigenen Stack ohne Hot-Reload und ohne Code-Mounts: `compose.prod.yaml` im Root
(Projektname `dnd-portal-prod`, eigenes DB-Volume; der Seeder füllt die DB beim ersten Start). Voraussetzung wie
oben: `backend/.env`.

| Befehl (im Root, ohne Skript; mit Skript: `./dnd.sh prod` bzw. `dnd prod`) | Wirkung |
|---|---|
| `docker compose -f compose.prod.yaml up -d --build` | `db` (Postgres :5432), `app` (API :8000, uvicorn ohne `--reload`, Code im Image), `web` (nginx :8080 mit dem statischen Build) – alle mit `restart: unless-stopped` |
| `VITE_API_URL=http://<host>:8000/ docker compose -f compose.prod.yaml up -d --build` | Frontend mit anderer API-URL bauen (Default `http://localhost:8000/`) |
| `docker compose -f compose.prod.yaml logs -f <service>` | Logs verfolgen |
| `docker compose -f compose.prod.yaml down` | stoppen; mit `-v` auch DB-Volume löschen |

UI unter http://localhost:8080/admin, `/wall` und `/ground` (Fenster im selben Browser auf dem Spieltisch-Rechner);
Smartphones öffnen den Player Screen über `http://<IP des Rechners>:8080/`. nginx liefert `index.html` auch für
direkt aufgerufene Unterrouten aus (SPA-Fallback); die Medien aus `public/` stecken im Image, Änderungen daran
brauchen einen neuen Build (`--build`). pgAdmin ist nicht enthalten.
Dev- und Prod-Stack nicht gleichzeitig betreiben: API (:8000) und DB (:5432) nutzen dieselben Ports.
Healthchecks: `db` per `pg_isready`, `app` per Python-Einzeiler gegen `http://localhost:8000/scenes` (das Image hat
kein curl); `app` startet erst bei gesunder DB, `web` erst bei gesunder API. `docker ps` zeigt `dnd-prod-api (healthy)`.

Frontend-Image: `frontend/Dockerfile` mit Stages `dev` (Vite-Dev-Server, von `frontend/docker-compose.yml` per
`target: dev` genutzt), `build` (`npm ci`, `npm run build`) und `prod` (nginx, Konfiguration `frontend/nginx.conf`).
Backend-Image: `backend/Dockerfile` startet uvicorn ohne `--reload`; den Reload setzt nur der Dev-Stack per `command`.

## Qualitätssicherung

| | Backend | Frontend |
|---|---|---|
| Lint | `pylint src/` (`.pylintrc`) | `npm run lint` (ESLint flat config, einfache Quotes, keine Semikolons) |
| Unit-Tests | `python -m unittest discover -s __tests__` – aktuell **keine Tests** | `npm run test:unit` (vitest, nur `utils.spec.ts`) |
| E2E | – | `npm run test:e2e` (jest-cucumber + Selenium/Chrome, braucht Backend; teilweise veraltet) |
| CI | `.github/workflows/backend.yml` – bei Push auf `main`/`development` mit Änderungen unter `backend/`: parallele Jobs `lint` (`pylint src/`) und `test` (unittest) direkt auf dem Runner, Python 3.11 mit pip-Cache; Job `docker-prod` baut das Image (ohne Push, ohne `--target`, da einstufig) | `.github/workflows/frontend.yml` – analog für `frontend/`: zuerst Job `build` (`vite build`), danach parallel `typecheck` (`tsc -b`), `lint` und `test` (`npm run test:unit`) mit `needs: build`, Node aus `frontend/.nvmrc` (18) mit npm-Cache, `npm ci`; Job `docker-prod` baut das Production-Image (`--target prod`, ohne Push); kein E2E in CI |

Die alten Branches `test` und `v1-roguelike` (verworfen) der früheren Einzel-Repos liegen als Tags `archive/{backend,frontend}-{test,v1-roguelike}` vor.
