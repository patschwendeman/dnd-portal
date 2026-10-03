# backend (dnd-portal)

REST-API + PostgreSQL für das DnD Portal. Liefert Szenen mit ihren Wall-/Ground-Bildern und Musik-Playlists an das
Frontend (`../frontend`). Projektübergreifender Kontext (Vision, Screens, Begriffe, bekannte Probleme) liegt
eine Ebene höher in `../CLAUDE.md` und `../docs/`.

## Stack

Python 3.11 · FastAPI 0.114 · SQLAlchemy 2.0 (klassischer Stil: `declarative_base`, `Column`, `db.query`) ·
psycopg2 · PostgreSQL · pylint. Versionen gepinnt in `requirements.txt`.

## Befehle

```bash
docker compose up --build          # Postgres :5432, pgAdmin :5050, API :8000 (uvicorn --reload, ./src gemountet)
pylint src/                        # Lint (Konfig: .pylintrc)
python -m unittest discover -s __tests__ -p "*.py"   # Tests (aktuell keine vorhanden)
```

Benötigt eine `.env` im Repo-Root (gitignored, keine Vorlage vorhanden) mit
`DRIVERNAME`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `HOST`, `PORT`,
`PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`. Import von `src.main` braucht eine erreichbare DB
(beim Start laufen `create_all` und der Seeder).

## Struktur & Schichten

```
src/main.py            App, CORS, create_all, Router einbinden, Seeder beim Import
src/routes/*.py        APIRouter je Ressource (scenes_router, maps_router) – nur HTTP-Mapping
src/services/*.py      Klasse mit @staticmethod-Methoden (SceneService, MapsService) – Fachlogik
src/db/crud.py         generische DB-Helfer (read_all, read_by_id, read_join_all, create, update)
src/db/models.py       SQLAlchemy-Models: Scene, GraphicsWall, GraphicsGround, Music, scene_music_association
src/db/database.py     Engine aus Env-Variablen, SessionLocal, Base, get_db()
src/db/seed.py         Seeder; Daten in src/db/data/seed_data.json
```

Neue Funktionalität folgt dem Muster **route → service → crud → model**. Die DB-Session kommt per
`Depends(get_db)`; Services bekommen sie als Parameter.

## Konventionen

- Imports absolut ab `src.` (z. B. `from src.db.models import Scene`).
- Routen geben ORM-Objekte direkt zurück (keine Pydantic-Schemas, kein `response_model`). Relationen sind nur
  enthalten, wenn sie per `joinedload` geladen wurden (siehe `read_join_all`).
- pylint: Docstring-Warnungen (C0114–C0116) deaktiviert, max. Zeilenlänge 150.
- Tabellen-/Spaltennamen snake_case, Model-Klassen PascalCase.

## Wichtig beim Ändern

- **API-Vertrag:** Das Frontend spiegelt die Antwort von `/scenes/details` im Interface `SceneDetail`
  (`../frontend/src/models/models.ts`). Feld- oder Pfadänderungen dort mitziehen.
- **`source`-Pfade** in `seed_data.json` verweisen auf Dateien in `../frontend/public/` (z. B.
  `/assets/images/ground_screen/battle_1.jpg`). Das Backend liefert keine Dateien aus.
- **Seed:** Referenzen (`graphics_wall_id`, `graphics_ground_id`, `music_id`-Liste) sind Autoincrement-IDs in
  Dateireihenfolge – Einträge nicht umsortieren. Der Seeder befüllt nur leere Tabellen; Änderungen an der JSON
  erfordern einen DB-Reset (z. B. `docker compose down -v`).
- **Keine Migrationen:** `create_all` legt nur fehlende Tabellen an; Schemaänderungen brauchen ebenfalls einen DB-Reset.
- `Scene.main == true` = Kampfszene (Mainmap), `false` = Nicht-Kampfszene (Sidemap). Alte Namen
  (`battlemap`, `sidemap`, `fight`) nicht wieder einführen; `v1-roguelike` (Tags `archive/*`) ist verworfen.
- Bekannte Bugs (500 statt 404, `/scenes/details/{id}` gibt bei unbekannter ID die Liste zurück, ungenutzte Spalten
  u. a.): siehe `../docs/known-issues.md`.

## CI

`../.github/workflows/backend.yml` (Root des Monorepos): bei Push auf `main`/`development` mit Änderungen unter `backend/` Docker-Image bauen (ghcr.io, amd64+arm64), darin Tests und
`pylint src/` ausführen.
