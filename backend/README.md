# dnd-portal – Backend

REST-API, WebSocket und PostgreSQL-Datenbank des DnD Portals (FastAPI, SQLAlchemy, Alembic). Liefert dem Frontend
([`../frontend`](../frontend/)) die Szenen mit ihren Wall-/Ground-Bildern und Musik-Tracks sowie die Mediendateien
selbst (Ordner [`../media`](../media/)). Abenteuer bündeln Szenen und Spieler. Der Server ist die einzige Quelle des
Spieltisch-Zustands (aktives Abenteuer, aktive Szene, Theme) und pusht ihn per WebSocket an Admin, Wall und Ground.
Ebenso hält er den Musikzustand (im Speicher) und schickt Musik und Soundeffekte an die Wall, die Audioausgabe ist.
Schreibend sind nur das Setzen von aktiver Szene und globalem Level eines Abenteuers, von aktivem Abenteuer und
Theme des Spieltischs (`PATCH`) sowie die Audio-Befehle (`PATCH`/`POST`).

| Endpoint | Zweck |
|---|---|
| `GET /adventures` | alle Abenteuer (ID, Name, Beschreibung) |
| `GET /adventures/{adventure_id}` | ein Abenteuer mit globalem Level, aktiver Szene und Spielern (404, wenn unbekannt) |
| `PATCH /adventures/{adventure_id}` | aktive Szene (`active_scene_id`, nur Szenen des Abenteuers, `null` leert sie) und/oder `global_level` (1–20) setzen; 404 bzw. 422 |
| `GET /adventures/{adventure_id}/scenes` | Szenen des Abenteuers mit Wall-/Ground-Bild und Tracks |
| `GET /adventures/{adventure_id}/maps/main` | Kartenübersicht der Kampfszenen (`main: true`) des Abenteuers: Szenen-ID und Ground-Bild |
| `GET /adventures/{adventure_id}/maps/side` | Kartenübersicht der Nicht-Kampfszenen (`main: false`) des Abenteuers: Szenen-ID und Wall-Bild |
| `GET /scenes/{scene_id}` | eine Szene (404, wenn unbekannt) |
| `GET /table` | Spieltisch-Zustand: aktives Abenteuer, dessen aktive Szene, Theme (`dark` \| `tavern`) |
| `PATCH /table` | aktives Abenteuer (`active_adventure_id`, `null` leert es) und/oder `theme` setzen; 422 bei unbekanntem Abenteuer |
| `GET /table/audio` | Musikzustand: läuft/pausiert, aktueller Track, Lautstärke (0–100), ob eine Audioausgabe bereit ist |
| `PATCH /table/audio` | `playing` und/oder `volume` (0–100) setzen; 422 bei ungültigen Werten |
| `POST /table/audio/next` | nächster zufälliger Track der Playlist |
| `POST /table/sounds` | Soundeffekt (`name`) an die Audioausgabe schicken; 204, auch ohne Ausgabe; 422 bei unbekanntem Namen |
| `WS /ws?screen=admin\|wall\|ground\|player` | WebSocket: Snapshot des Spieltischs und Musikzustand beim Verbinden und nach jeder Änderung, alle 15 s ein Ping, Audio-Meldungen der Wall; Origin-Prüfung (nicht in OpenAPI) |
| `GET /media/...` | Mediendateien (Bilder, Musik) aus `../media`, inkl. `Range` |

Der API-Vertrag liegt versioniert in [`openapi.json`](openapi.json); daraus erzeugt das Frontend seine Typen. Das
Nachrichtenformat des WebSockets beschreibt [architecture.md](../docs/architecture.md#websocket-ws). uvicorn läuft mit
einem Worker (der Verbindungsmanager liegt im Prozess).

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
| `CORS_ORIGINS` | optional, JSON-Liste; Default `["http://localhost:5173","http://localhost:8080"]` (Dev- und Prod-Frontend); gilt auch für die Origin-Prüfung des WebSockets |
| `MEDIA_DIR` | optional, Medienordner; Default `/app/media` (Container), lokal `../media` |
| `DEFAULT_MUSIC_KEY` | optional, Storage-Key der Standardmusik ohne aktive Szene; Default `music/side/forest/From_Past_To_Present.mp3` (fehlt das Medium, bleibt die Playlist leer) |
| `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` | Login für pgAdmin (`http://localhost:5050`, nur mit `--tools`) |

Für Zugriff über das LAN ist nichts zu konfigurieren: Das Frontend erreicht API und WebSocket über den Proxy desselben
Origins (`/api/`, `/ws`; nginx bzw. Vite), andere Geräte öffnen nur `http://<IP>:8080`. Der WebSocket nimmt
Verbindungen ohne `Origin`, aus `CORS_ORIGINS` oder mit gleichem Host und Port wie der `Host`-Header an. Nur wer die API
direkt (Port 8000) aus einem anderen Origin aufruft, muss diesen in `CORS_ORIGINS` ergänzen (`POST`, also die
Audio-Befehle, ist per CORS nicht freigegeben). Fehlende Pflichtwerte
brechen den Start mit einem Validierungsfehler ab.

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
