# DND-17: Backend-Struktur nach FastAPI-Konvention, Konfiguration per pydantic-settings

**Typ:** refactor
**Status:** Im Review

## Kontext & Ziel

Nach DND-16 (Tooling, Tests, Paket `app`) weicht das Backend noch in Struktur und Stil von den FastAPI-/Python-Konventionen
ab (siehe `docs/known-issues.md`, Abschnitte „Struktur & Benennung“, „FastAPI & SQLAlchemy“, „Konfiguration & Tooling“):
`app/db/` mischt Engine, Models, CRUD und Seeder; Router heißen `scenes_router`/`maps_router` und wiederholen ihr Prefix;
Services sind Klassen mit nur `@staticmethod`; `main.py` legt beim Import Tabellen an und seedet (Session wird nie
geschlossen); Konfiguration per `os.environ` ohne Validierung; CORS erlaubt `*` mit Credentials. Ziel: eine
vorhersagbare, konventionelle Struktur – für Menschen und Agents – ohne Änderung am API-Verhalten.

## Invarianten

- API-Verhalten unverändert: Pfade, Statuscodes, Response-Form und -Inhalt aller 6 Endpoints, **inklusive der bekannten
  Bugs** (500 statt 404, ganze Liste bei unbekannter Detail-ID, 422 bei `/scenes/details` ohne Slash, Redirect bei
  Trailing Slash). Behoben werden sie erst im Schema-/Fehler-Task.
- Die Charakterisierungstests in `backend/tests/test_scenes.py` und `test_maps.py` bleiben inhaltlich unverändert
  (nur Importe/Fixtures dürfen sich ändern).
- Datenbankschema, Tabellen- und Spaltennamen, Seed-Daten und Seeder-Verhalten (füllt nur leere Tabellen) unverändert.
- DB-Zugriff weiter im bisherigen Stil (`db.query`, `Column`) – SQLAlchemy-2.0-Stil folgt in einem eigenen Task.
- Start der Stacks unverändert (`./script.sh dev|prod`, `docker compose up --build` in `backend/`), Ports,
  Containernamen, Healthcheck, Hot Reload; Modulpfad `app.main:app`.
- Frontend unverändert (Admin, Wall, Ground laden Szenen wie bisher).

## Scope / Non-Goals

**Im Scope**
- Neue Ordnerstruktur unter `app/` (E1), alle Module verschoben/aufgeteilt, Importe angepasst.
- Router: je Modul `router`, Prefix und Tags zentral in `main.py` (E2).
- Services als Modul-Funktionen, `db` immer erster Parameter, `map_type: Literal["main", "side"]` (E3).
- `SessionDep = Annotated[Session, Depends(get_db)]` in `app/api/deps.py`.
- `lifespan`-Handler für `create_all` und Seeder; eigene, geschlossene Session für den Seeder (E4).
- `pydantic-settings` statt `os.environ`/`python-dotenv` (E5), Env-Variablen umbenannt (E6).
- CORS: Origins aus der Konfiguration, ohne Credentials (E7).
- `.env.example`, CI-Env, Doku und Skill-Befehle nachziehen; erledigte known-issues-Punkte entfernen.

**Nicht im Scope**
- Pydantic-Schemas, `response_model`, Bugfixes (404, Detail-Liste, Slash-Routen), Umbenennung der Relation
  `Scene.music` – gehört zum Schema-/Fehler-Task (API-Vertrag).
- SQLAlchemy-2.0-Stil (`DeclarativeBase`, `Mapped`, `select()`), Filtern in SQL statt Python.
- Ungenutzte Spalten, `uselist`-Fehler, Alembic.
- Ordner `schemas/` (entsteht erst mit dem Schema-Task).
- mypy `strict`.
- README (erst nach dem Backend-Refactoring, siehe known-issues).

## Entscheidungen

### E1: Layer-basierte, feine Struktur
- **Entscheidung:**
  ```
  app/
    main.py                  # App-Instanz `app`, lifespan, CORS, include_router
    core/config.py           # Settings (pydantic-settings), `settings`-Instanz
    db/base.py               # Base = declarative_base()
    db/session.py            # engine, SessionLocal, get_db()
    db/seed.py               # Seeder (unverändertes Verhalten)
    db/data/seed_data.json
    models/__init__.py       # re-exportiert alle Models (damit Base.metadata vollständig ist)
    models/scene.py          # Scene, scene_music_association
    models/media.py          # GraphicsWall, GraphicsGround, Music
    crud/scene.py            # Lesezugriffe auf Scene (bisher app/db/crud.py)
    services/scene.py        # Fachlogik Szenen
    services/map.py          # Fachlogik Karten
    api/deps.py              # SessionDep
    api/routes/scenes.py
    api/routes/maps.py
  ```
  Alte Module (`app/db/database.py`, `app/db/models.py`, `app/db/crud.py`, `app/routes/`, `app/services/maps.py`,
  `app/services/scenes.py`) entfallen; Verschiebungen per `git mv`, wo möglich.
- **Verworfene Alternativen:** flache Struktur (`app/config.py`, `app/db.py` …), feature-basiert (`app/scenes/…`).
- **Begründung:** FastAPI-Konvention („Bigger Applications“, Full-Stack-Template), wächst ohne erneuten Umbau mit
  (z. B. `schemas/`, weitere Domänen), für Agents gut vorhersagbar.

### E2: Router-Benennung und zentrales Prefix
- **Entscheidung:** Jedes Routenmodul exportiert `router = APIRouter()`; Pfade ohne Prefix (`""`, `"/{scene_id}"`,
  `"/details/"`, `"/details/{scene_id}"`, `"/main"`, `"/side"`). `main.py`:
  `app.include_router(scenes.router, prefix="/scenes", tags=["scenes"])`, analog `maps`. Handler-Namen bleiben.
- **Begründung:** FastAPI-Konvention; Prefix an einer Stelle. Die resultierenden Pfade sind identisch (Invariante,
  durch die Tests belegt – auch Reihenfolge `"/{scene_id}"` vor `"/details/"`, die den 422 bei `/scenes/details`
  verursacht, bleibt bis zum Fix-Task erhalten).

### E3: Services als Modul-Funktionen
- **Entscheidung:** `services/scene.py`: `get_scenes(db)`, `get_scene(db, scene_id)`, `get_scene_details(db)`,
  `get_scene_detail(db, scene_id)`; `services/map.py`: `get_maps(db, map_type: MapType)` mit
  `MapType = Literal["main", "side"]`. Routen importieren `from app.services import scene as scene_service`.
  `crud/scene.py`: `read_scenes(db)`, `read_scene(db, scene_id)`, `read_scenes_with_relations(db)` (statt der
  generischen `read_all`/`read_by_id` mit `type: ignore`). Logik inkl. der bestehenden `ValueError`s 1:1 übernehmen.
- **Verworfene Alternativen:** Klassen mit `@staticmethod` behalten.
- **Begründung:** Pythonischer, kein `too-few-public-methods`-Muster; einheitliche Signaturen (`db` zuerst).

### E4: `lifespan` statt Seiteneffekten beim Import
- **Entscheidung:** `create_all` und Seeder laufen im `lifespan` von `FastAPI(lifespan=...)`; der Seeder bekommt
  eine Session per `with SessionLocal() as db:`. `import app.main` baut keine DB-Verbindung mehr auf (die Engine wird
  lazy verbunden). Die Test-Fixture nutzt `with TestClient(app, raise_server_exceptions=False) as client:`, damit
  der `lifespan` läuft.
- **Begründung:** FastAPI-Empfehlung; Session wird geschlossen; App ist ohne DB importierbar.

### E5: pydantic-settings
- **Entscheidung:** `app/core/config.py` mit `class Settings(BaseSettings)` (`model_config = SettingsConfigDict(env_file=".env",
  extra="ignore")`), Felder siehe E6, Property `database_url` (via `sqlalchemy.engine.URL.create`), Modul-Instanz
  `settings = Settings()`. Pflichtfelder ohne Default → fehlende Werte führen beim Start zu einer klaren
  Validierungsmeldung. `python-dotenv` entfällt aus `pyproject.toml`, `pydantic-settings` (exakt gepinnt) kommt dazu.
  Die `# type: ignore` in der bisherigen `database.py` entfallen.
- **Begründung:** Standard in FastAPI-Projekten, Validierung und Typen statt `os.environ.get`.

### E6: Env-Variablen – `DB_*` für die API-eigenen, `POSTGRES_*` geteilt
- **Entscheidung:** `DRIVERNAME` → `DB_DRIVER`, `HOST` → `DB_HOST`, `PORT` → `DB_PORT`. `POSTGRES_USER`,
  `POSTGRES_PASSWORD`, `POSTGRES_DB` bleiben (vom Postgres-Container vorgegeben, die API liest dieselben Werte).
  Neu: `CORS_ORIGINS` (optional, JSON-Liste). `PGADMIN_*` unverändert.
- **Verworfene Alternativen:** Namen beibehalten; alles `DB_*` mit Mapping in Compose; eine `DATABASE_URL`.
- **Begründung:** Eindeutige Namen (`HOST`/`PORT` sind generisch und kollidieren leicht), ohne doppelte Werte in der `.env`.
- **Folge:** Bestehende `backend/.env` müssen einmalig angepasst werden – Hinweis im Commit-Body und in der Doku.

### E7: CORS aus der Konfiguration, LAN-fähig
- **Entscheidung:** `cors_origins: list[str]` mit Default `["http://localhost:5173", "http://localhost:8080"]`
  (Dev-Frontend, Prod-Frontend am Spieltisch-Rechner), per `CORS_ORIGINS` überschreibbar – z. B. für Zugriff
  über das LAN: `CORS_ORIGINS=["http://localhost:5173","http://localhost:8080","http://192.168.x.y:8080"]`
  (zusätzlich `VITE_API_URL=http://192.168.x.y:8000/` beim Frontend-Build, siehe `docs/architecture.md`).
  `allow_credentials=False` (das Frontend sendet keine Cookies/Credentials, `frontend/src/api/apiClient.ts`),
  `allow_methods=["GET"]`, `allow_headers=["*"]`.
- **Verworfene Alternativen:** `*` beibehalten; nur localhost ohne Konfiguration.
- **Begründung:** Gewünschter LAN-Zugriff bleibt per Konfiguration möglich, ohne alles freizugeben. Der Player Screen
  (Smartphones) ruft die API nicht auf und ist nicht betroffen.
- **Hinweis:** Bewusste Änderung der CORS-Header (nicht durch die Charakterisierungstests abgedeckt); neue Tests
  in `tests/test_cors.py` belegen das Soll.

## Subtasks

### Schritt 1: Konfiguration & DB-Basis
- [x] `pydantic-settings` hinzufügen, `python-dotenv` entfernen (`uv add`/`uv remove`, `uv.lock`).
- [x] `app/core/config.py` (E5, E6, E7).
- [x] `app/db/base.py`, `app/db/session.py` (Engine aus `settings.database_url`, `SessionLocal`, `get_db`).
- [x] `backend/.env.example` auf neue Namen und `CORS_ORIGINS` (auskommentiertes LAN-Beispiel) umstellen;
      `.github/workflows/backend.yml` (Test-Job-Env: `DB_DRIVER`, `DB_HOST=localhost`, `DB_PORT`).

### Schritt 2: Models & CRUD
- [x] `app/models/{__init__,scene,media}.py` (Inhalt 1:1 aus `app/db/models.py`, nur aufgeteilt).
- [x] `app/crud/scene.py` (E3); `app/db/seed.py` Importe anpassen.

### Schritt 3: Services, Routen, App
- [x] `app/services/{scene,map}.py` als Modul-Funktionen (E3).
- [x] `app/api/deps.py` (`SessionDep`), `app/api/routes/{scenes,maps}.py` mit `router` (E2).
- [x] `app/main.py`: `lifespan` (E4), CORS (E7), `include_router` mit Prefix/Tags.
- [x] Alte Module löschen; leere `__init__.py` für alle neuen Pakete.

### Schritt 4: Tests
- [x] `tests/conftest.py`: `TestClient` als Context Manager (E4), Docstring auf neue Env-Namen.
- [x] `tests/test_cors.py`: Preflight/GET mit erlaubtem Origin → `Access-Control-Allow-Origin` = Origin, ohne
      `Access-Control-Allow-Credentials`; mit fremdem Origin → kein `Access-Control-Allow-Origin`.
- [x] `tests/test_config.py`: `Settings` liest `DB_*`/`POSTGRES_*`/`CORS_ORIGINS` und baut die URL korrekt;
      fehlendes Pflichtfeld → `ValidationError` (mit `monkeypatch`, ohne `.env`: `Settings(_env_file=None)`).
- [x] Charakterisierungstests unverändert grün; Gegenprobe: `python -c "import app.main"` ohne erreichbare DB wirft nicht.

### Schritt 5: Doku
- [x] `backend/CLAUDE.md`: Struktur & Schichten, Konventionen (Router, Services, `SessionDep`, Settings), Env-Schlüssel,
      Befehle (`DB_HOST=localhost uv run pytest`), Hinweis „Import von `app.main` braucht DB“ entfernen.
- [x] `docs/architecture.md` (Schichten, Env-Schlüssel, Abschnitt LAN/CORS bei `VITE_API_URL`),
      `.claude/skills/quick-task/SKILL.md` (`HOST=localhost` → `DB_HOST=localhost`).
- [x] `docs/known-issues.md`: erledigte Punkte entfernen (`app/db/`-Mischung, Router-Benennung/Prefix, Services als
      Klassen, Parameterreihenfolge/`maptype`, `MapsService`/`SceneService`-Teil des Singular/Plural-Punkts,
      Seiteneffekte beim Import, `Depends` ohne `Annotated`, CORS, `os.environ`/`load_dotenv`); `# type: ignore`-Hinweis
      zu `database.py` anpassen. Verbleibend: Relation `Scene.music` (Schema-Task).

## Akzeptanzkriterien

- [x] AK1: Struktur unter `app/` entspricht E1; keine Module mehr unter `app/routes/`, `app/db/{database,models,crud}.py`;
      Routen heißen `router`, Prefix/Tags zentral; Services sind Modul-Funktionen mit `db` als erstem Parameter.
- [x] AK2: `import app.main` funktioniert ohne erreichbare DB; Tabellen und Seed entstehen beim App-Start (`lifespan`);
      die Seeder-Session wird geschlossen.
- [x] AK3: Konfiguration über `Settings` mit `DB_DRIVER`, `DB_HOST`, `DB_PORT`, `POSTGRES_*`, `CORS_ORIGINS`;
      `python-dotenv` und `os.environ`-Zugriffe sind entfernt; fehlende Pflichtwerte → klare Fehlermeldung beim Start.
- [x] AK4: CORS erlaubt nur konfigurierte Origins, ohne Credentials; per `CORS_ORIGINS` um LAN-Origins erweiterbar
      (durch `tests/test_cors.py` belegt).
- [x] AK5: Alle Invarianten eingehalten – Charakterisierungstests inhaltlich unverändert grün.
- [ ] AK6: `uv run ruff check`, `ruff format --check`, `mypy app`, `pytest` und CI grün; Docker-Build ok.
      (lokal grün inkl. Docker-Build; CI nach Push zu prüfen)

## Teststrategie / Verifikation

**Automatisch**
- Backend: bestehende Charakterisierungstests (unverändert), neu `tests/test_cors.py`, `tests/test_config.py`;
  ruff, mypy, Docker-Build; CI.

**Manuell**
1. `backend/.env` auf neue Namen umstellen, `./script.sh dev` → Admin lädt Szenen, Wall/Ground zeigen Bilder, kein
   CORS-Fehler in der Browser-Konsole; Änderung in `app/` löst Reload aus.
2. `./script.sh prod` → Stack healthy, Admin unter `http://localhost:8080/admin` lädt Szenen.
3. `.env` mit fehlendem `DB_HOST` → API startet nicht, Log zeigt Validierungsfehler mit Feldname.
4. `http://localhost:8000/docs` zeigt die Endpoints gruppiert nach Tags `scenes`/`maps`.

## Offene Fragen
- keine

## Review
