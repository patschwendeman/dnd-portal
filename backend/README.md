# dnd-portal – Backend

REST-API und PostgreSQL-Datenbank des DnD Portals (FastAPI, SQLAlchemy, Alembic). Liefert dem Frontend
([`../frontend`](../frontend/)) die Szenen mit ihren Wall-/Ground-Bildern und Musik-Tracks sowie die Mediendateien
selbst (Ordner [`../media`](../media/)). Abenteuer bündeln Szenen und Spieler; einzig schreibend ist das Setzen
von aktiver Szene und globalem Level eines Abenteuers (`PATCH`).

| Endpoint | Zweck |
|---|---|
| `GET /adventures` | alle Abenteuer (ID, Name, Beschreibung) |
| `GET /adventures/{adventure_id}` | ein Abenteuer mit globalem Level, aktiver Szene und Spielern (404, wenn unbekannt) |
| `PATCH /adventures/{adventure_id}` | aktive Szene (`active_scene_id`, nur Szenen des Abenteuers, `null` leert sie) und/oder `global_level` (1–20) setzen; 404 bzw. 422 |
| `GET /adventures/{adventure_id}/scenes` | Szenen des Abenteuers (wie `/scenes`) |
| `GET /adventures/{adventure_id}/maps/main` | Kartenübersicht der Kampfszenen des Abenteuers |
| `GET /adventures/{adventure_id}/maps/side` | Kartenübersicht der Nicht-Kampfszenen des Abenteuers |
| `GET /scenes` | alle Szenen (aller Abenteuer) mit Wall-/Ground-Bild und Tracks |
| `GET /scenes/{scene_id}` | eine Szene (404, wenn unbekannt) |
| `GET /maps/main` | Kartenübersicht der Kampfszenen (`main: true`): Szenen-ID und Ground-Bild |
| `GET /maps/side` | Kartenübersicht der Nicht-Kampfszenen (`main: false`): Szenen-ID und Wall-Bild |
| `GET /media/...` | Mediendateien (Bilder, Musik) aus `../media`, inkl. `Range` |

Der API-Vertrag liegt versioniert in [`openapi.json`](openapi.json); daraus erzeugt das Frontend seine Typen.

## Starten

Empfohlen ist der Start der ganzen Anwendung aus dem Monorepo-Root (siehe [README](../README.md)):

```bash
./script.sh dev    # DB :5432, API :8000 mit Reload, Frontend :5173 (--tools: zusätzlich pgAdmin :5050)
./script.sh prod   # Production-Stack am Spieltisch: API ohne Reload, Frontend :8080
```

Nur das Backend (im Root):

```bash
docker compose -f compose.dev.yaml up --build db api
```

Lokal ohne Container (in `backend/`, die DB des Dev-Stacks muss auf `:5432` laufen; uv installiert Python 3.11 bei
Bedarf selbst):

```bash
uv sync
DB_HOST=localhost MEDIA_DIR=../media uv run uvicorn app.main:app --reload
```

## Konfiguration

Benötigt `backend/.env` (gitignored), angelegt aus der Vorlage [`.env.example`](.env.example):
`cp .env.example .env`, Platzhalter ersetzen. Die Datei nutzen Postgres-Container, API und pgAdmin gemeinsam;
Umgebungsvariablen haben Vorrang vor `.env`.

| Schlüssel | Bedeutung |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Zugangsdaten und Datenbank (Postgres-Container und API) |
| `DB_DRIVER` | SQLAlchemy-Treiber, `postgresql+psycopg2` |
| `DB_HOST` | `db` (Service-Name im Compose-Netz); für API, Tests oder Alembic außerhalb von Docker `localhost` |
| `DB_PORT` | `5432` |
| `CORS_ORIGINS` | optional, JSON-Liste; Default `["http://localhost:5173","http://localhost:8080"]` (Dev- und Prod-Frontend) |
| `MEDIA_DIR` | optional, Medienordner; Default `/app/media` (Container), lokal `../media` |
| `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` | Login für pgAdmin (`http://localhost:5050`, nur mit `--tools`) |

Für Zugriff über das LAN (Smartphones der Spieler) die Adresse des Spieltisch-Rechners in `CORS_ORIGINS` ergänzen,
z. B. `["http://localhost:5173","http://localhost:8080","http://192.168.x.y:8080"]`, und das Frontend mit passender
`VITE_API_URL` bauen. Fehlende Pflichtwerte brechen den Start mit einem Validierungsfehler ab.

## Seed

Beim Start befüllt der Seeder die Tabellen aus [`app/db/data/seed_data.json`](app/db/data/seed_data.json) – **nur
wenn sie leer sind**. Änderungen an der Seed-Datei wirken daher erst nach einem DB-Reset (im Root):

```bash
docker compose -f compose.dev.yaml down -v    # bzw. -f compose.prod.yaml; löscht das DB-Volume
```

Eine Datenbank aus der Zeit vor Alembic (Tabellen ohne `alembic_version`) wird beim Start mit Reset-Hinweis
abgelehnt; auch dann hilft `down -v`.

## Weiterführend

- [CLAUDE.md](CLAUDE.md) – Entwickler-Referenz: Stack, Lint-/Test-Befehle, Tests, Struktur, Konventionen, Seed, Migrationen
- [../docs/architecture.md](../docs/architecture.md) – Zusammenspiel mit dem Frontend, API, Datenmodell, Setup (Compose, `script.sh`), CI
- [../docs/known-issues.md](../docs/known-issues.md) – bekannte Lücken und Altlasten
- [../CONTRIBUTING.md](../CONTRIBUTING.md) – Branches, Commits, Tasks
