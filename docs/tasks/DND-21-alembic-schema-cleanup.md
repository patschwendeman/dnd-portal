# DND-21: Alembic-Migrationen und bereinigtes Datenbankschema

**Typ:** setup
**Status:** Im Review

## Kontext & Ziel

Das Schema entsteht bisher per `Base.metadata.create_all` im `lifespan` – Änderungen erfordern einen DB-Reset, es gibt
keine Historie (`docs/known-issues.md`, „Bugs & Daten“). Das Schema hat außerdem Altlasten: ungenutzte Spalten
(`scene.music_id`, `graphics_ground.main`), nullable Spalten, die der API-Vertrag (DND-20) als Pflicht führt, eine
Assoziationstabelle ohne Primärschlüssel, und Klassen/Tabellen heißen noch `GraphicsWall`/`GraphicsGround`/`Music`,
während Relationen und API `wall_image`/`ground_image`/`tracks` heißen („Struktur & Benennung“). Ziel: Alembic als
einziger Weg zum Schema, eine initiale Migration mit dem bereinigten Zielschema und ein dokumentierter Ablauf für
künftige Schemaänderungen.

## Invarianten

- API-Vertrag unverändert: `backend/openapi.json` bleibt byte-gleich; alle Responses inhaltlich identisch
  (Backend-Tests `test_scenes.py`/`test_maps.py` bis auf Seed-Keys in `conftest.py` unverändert grün).
- Frontend unverändert.
- Seed-Inhalt unverändert: gleiche Datensätze, gleiche IDs in Dateireihenfolge, gleiche Zuordnungen; Seeder füllt
  weiterhin nur leere Tabellen.
- Start der Stacks unverändert (`./script.sh dev|prod`), Ports, Containernamen, Healthcheck, Hot Reload.

## Scope / Non-Goals

**Im Scope**
- Alembic einrichten (`backend/alembic.ini`, `backend/migrations/`), Ausführung im `lifespan` statt `create_all` (E2).
- Initiale Migration mit bereinigtem Zielschema (E1, E3).
- Model-Klassen umbenennen, Constraint-Namenskonvention (E3).
- Seed-JSON-Keys an die neuen Namen anpassen (E4).
- Erkennung einer Alt-DB ohne Alembic-Historie mit klarer Fehlermeldung (E1).
- Docker/Compose (Migrationen ins Image, Mount im Dev-Stack), CI (`alembic check`, Down-/Upgrade-Rundlauf) (E5).
- Doku inkl. Ablauf für Schemaänderungen.

**Nicht im Scope**
- Datenerhaltende Migration bestehender DBs (stattdessen einmaliger Reset, E1).
- Seed als Daten-Migration oder Seeder, der bestehende DBs aktualisiert (known-issues „Lücken gegenüber der Vision“).
- Seed-Inhalte (Level_up, Musiknamen, Beschreibungen).
- `ON DELETE`-Verhalten (keine schreibenden Endpoints).
- Backend-README (folgt nach dem Backend-Refactoring, eigener Schritt).

## Entscheidungen

### E1: Einmaliger Reset, eine initiale Migration
- **Entscheidung:** Statt Baseline + Bereinigung legt eine einzige Migration `0001_initial_schema` direkt das
  Zielschema an. Bestehende Dev-/Prod-DBs werden einmalig zurückgesetzt (`docker compose -f compose.dev.yaml down -v`,
  `docker compose -f compose.prod.yaml down -v`). Vor dem Upgrade prüft der Start, ob Tabellen existieren, aber keine
  `alembic_version`: dann Abbruch mit `RuntimeError` und Hinweis auf den Reset-Befehl (statt kryptischem
  „relation already exists“).
- **Verworfene Alternativen:** Baseline-Migration + `alembic stamp` + Bereinigungsmigration.
- **Begründung:** Die DB enthält nur Seed-Daten (keine schreibenden Endpoints); eine saubere Historie ohne
  Altlasten-Migration.

### E2: Migrationen im `lifespan`
- **Entscheidung:** `app/db/migrate.py` mit `run_migrations()`: Alt-DB-Prüfung (E1), dann
  `alembic.command.upgrade(config, "head")` mit `Config` aus `backend/alembic.ini` (Pfad relativ zum Paket ermittelt,
  nicht zum CWD). `lifespan`: `run_migrations()` → Seeder. `create_all` entfällt. `migrations/env.py` nimmt die URL aus
  `settings.database_url` und `target_metadata = Base.metadata` (inkl. Import von `app.models`); `compare_type=True`.
- **Verworfene Alternativen:** `alembic upgrade head && uvicorn …` als Container-Command; nur manuell.
- **Begründung:** Gleiches Verhalten in Dev, Prod, Tests und lokal (`uv run`); es läuft immer genau eine API-Instanz.

### E3: Zielschema
- **Entscheidung:**
  ```
  wall_image   (id PK, name VARCHAR NOT NULL, source VARCHAR NOT NULL)
  ground_image (id PK, name VARCHAR NOT NULL, source VARCHAR NOT NULL)
  track        (id PK, name VARCHAR NOT NULL, source VARCHAR NOT NULL)
  scene        (id PK, name VARCHAR NOT NULL, description TEXT NOT NULL, main BOOLEAN NOT NULL,
                wall_image_id   INT NOT NULL FK → wall_image.id,
                ground_image_id INT NOT NULL FK → ground_image.id UNIQUE)
  scene_track  (scene_id INT FK → scene.id, track_id INT FK → track.id, PK (scene_id, track_id))
  ```
  Entfallen: `scene.music_id`, `graphics_ground.main`, redundante `index=True` auf Primärschlüsseln.
  Model-Klassen: `WallImage`, `GroundImage`, `Track` (in `app/models/media.py`), `Scene`, Tabelle `scene_track`
  (`app/models/scene.py`). Relationen und ihre Typen werden nicht-optional (`wall_image: Mapped[WallImage]`).
  `Base.metadata` mit Namenskonvention (`ix`, `uq`, `ck`, `fk`, `pk` nach Alembic-Empfehlung).
- **Begründung:** Schema entspricht dem API-Vertrag aus DND-20; einheitliche Namen in DB, ORM und API.

### E4: Seed-JSON mit neuen Keys
- **Entscheidung:** `graphics_walls` → `wall_images`, `graphics_grounds` → `ground_images`, `music` → `tracks`;
  in `scenes`: `graphics_wall_id` → `wall_image_id`, `graphics_ground_id` → `ground_image_id`, `music_id` → `track_ids`.
  Werte und Reihenfolge unverändert. `tests/conftest.py` liest die neuen Keys.
- **Begründung:** Keine Übersetzungsschicht im Seeder; Begriffe überall gleich.

### E5: Werkzeuge, Docker, CI
- **Entscheidung:**
  - `alembic` als Laufzeit-Abhängigkeit (exakt gepinnt). `migrations/` von ruff erfasst, von mypy (strict, nur `app/`) nicht.
  - Dockerfile kopiert `alembic.ini` und `migrations/`; `compose.dev.yaml` mountet zusätzlich `./backend/migrations`.
  - CI-Job `test`: vor `pytest` `alembic upgrade head`, `alembic check` (Modelle ↔ Migrationen ohne Drift),
    `alembic downgrade base`, `alembic upgrade head` (Rundlauf beweist `downgrade`).
  - Ablauf für Schemaänderungen (Doku): Model ändern → `uv run alembic revision --autogenerate -m "<beschreibung>"`
    (gegen laufende Dev-DB, `DB_HOST=localhost`) → Migration prüfen/anpassen → Tests → committen.
- **Begründung:** `alembic check` verhindert vergessene Migrationen; ein reproduzierbarer Ablauf für Menschen und Agents.

## Subtasks

### Schema & Models
- [x] `alembic` hinzufügen (`uv add alembic==<aktuell>`), `alembic init migrations` als Ausgangspunkt; `alembic.ini`
      ohne URL (kommt aus `env.py`), Dateinamen-Template mit Nummernpräfix (`%%(rev)s_%%(slug)s`, Revision `0001`).
- [x] `app/db/base.py`: `MetaData(naming_convention=…)`.
- [x] `app/models/{media,scene,__init__}.py` gemäß E3.
- [x] `migrations/env.py` (E2), `migrations/versions/0001_initial_schema.py` (autogenerate, danach von Hand geprüft;
      `upgrade` und `downgrade` vollständig).

### Start & Seeder
- [x] `app/db/migrate.py` (`run_migrations`, Alt-DB-Prüfung), `app/main.py` (`lifespan` ohne `create_all`).
- [x] `app/db/seed.py` und `app/db/data/seed_data.json` (E4); Seeder-Typen auf neue Klassen.
- [x] `app/crud/scene.py`, `app/services/*.py`, `app/schemas/*` nur soweit Klassen-/Feldnamen sich ändern;
      `uv run python scripts/export_openapi.py` → `openapi.json` unverändert (Invariante).

### Tests
- [x] `tests/conftest.py` auf neue Seed-Keys.
- [x] `tests/test_migrate.py`: Alt-DB-Prüfung (Tabellen ohne `alembic_version` → `RuntimeError` mit Reset-Hinweis;
      leere DB bzw. DB mit `alembic_version` → kein Fehler) – über die Prüffunktion mit Inspector-/Tabellenliste als
      Eingabe, ohne die gemeinsame Test-DB zu verändern.
- [x] Bestehende API-Tests unverändert grün.

### Docker & CI
- [x] `backend/Dockerfile`, `compose.dev.yaml` (E5); `compose.prod.yaml` prüfen.
- [x] `.github/workflows/backend.yml` (E5).

### Doku
- [x] `backend/CLAUDE.md`: Abschnitt „Migrationen“ (Ablauf E5, Befehle, Reset-Hinweis), Struktur (`migrations/`,
      `app/db/migrate.py`), Seed-Hinweise mit neuen Keys; „Keine Migrationen“ entfernen.
- [x] `docs/architecture.md`: Datenmodell (Tabellen/Klassen E3), Start-Ablauf (Migrationen → Seeder), Reset-Befehle.
- [x] `docs/domain.md`: Code-Namen (`WallImage`/`scene.wall_image`, `GroundImage`, `Track`/`scene.tracks`).
- [x] `docs/known-issues.md`: Punkte „ungenutzte Spalten/nullable“, „Keine Migrationen“ und
      „Model-Klassen und Tabellen heißen noch …“ entfernen.
- [x] Commit-Body: Hinweis auf einmaligen Reset von Dev- und Prod-DB.

## Akzeptanzkriterien

- [x] AK1: Auf leerer DB legt der App-Start per Alembic das Zielschema aus E3 an und seedet; `create_all` wird nicht
      mehr verwendet; `alembic current` zeigt `0001`.
- [x] AK2: `alembic check` meldet keine Abweichung; `downgrade base` + `upgrade head` laufen fehlerfrei (CI).
- [x] AK3: Eine Alt-DB (Tabellen ohne `alembic_version`) bricht den Start mit verständlicher Meldung inkl.
      Reset-Befehl ab (Test + einmal manuell mit altem Volume nachgewiesen).
- [x] AK4: Klassen/Tabellen/Seed-Keys heißen wie in E3/E4; keine Verweise mehr auf `GraphicsWall`, `GraphicsGround`,
      `Music`, `graphics_wall`, `graphics_ground`, `music_id`, `scene_music_association` außerhalb von `docs/tasks/`
      (Asset-Pfade wie `/assets/music/…` ausgenommen).
- [x] AK5: Alle Invarianten eingehalten – `openapi.json` byte-gleich, API-Tests grün, Frontend unverändert.
- [ ] AK6: ruff, mypy strict, pytest, CI und Docker-Build grün; `./script.sh dev` und `./script.sh prod` nach Reset lauffähig.

## Teststrategie / Verifikation

**Automatisch**
- Backend: API-Tests (unverändert), `tests/test_migrate.py`, CI-Schritte `alembic check` und Down-/Upgrade-Rundlauf.

**Manuell**
1. Mit **altem** Dev-Volume `./script.sh dev` → API startet nicht, Log zeigt Reset-Hinweis.
2. `docker compose -f compose.dev.yaml down -v && ./script.sh dev` → Schema per Migration, Seed, Admin/Wall/Ground
   funktionieren; in pgAdmin bzw. `psql \d` Tabellen und `NOT NULL` gemäß E3.
3. Prod analog nach `down -v`: `./script.sh prod` wird healthy.

## Offene Fragen
- keine

## Review

### Runde 1 – Review (6e3b975)

**Empfehlung:** Nacharbeiten. E1–E5 umgesetzt, lokale Checks grün, Down-/Upgrade-Rundlauf auf frischer DB ok. AK4 knapp
verfehlt (alte Tabellennamen in einer Testkonstante); AK6 erst nach Push (CI) und Volume-Reset durch den User prüfbar.

**Akzeptanzkriterien**

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `lifespan` ruft `run_migrations()` + Seeder, kein `create_all`; leere DB → `alembic current` = `0001 (head)`, `\d` wie E3, 29 Szenen / 327 `scene_track`-Zeilen; Prod-Image gegen leere DB: `GET /scenes` 200 |
| AK2 | erfüllt lokal (CI offen) | `alembic check` ohne Drift, `downgrade base` + `upgrade head` fehlerfrei; CI-Schritt „Migrations“ in `.github/workflows/backend.yml` |
| AK3 | erfüllt (manuell nachgestellt) | `app/db/migrate.py`, `tests/test_migrate.py` grün; Wegwerf-DB mit Alt-Tabelle → `RuntimeError` mit Reset-Befehlen; echtes Alt-Volume nicht geprüft (siehe AK6) |
| AK4 | **nicht erfüllt (knapp)** | `backend/tests/test_migrate.py:7` `LEGACY_TABLES` enthält `graphics_wall`, `graphics_ground`, `scene_music_association`; sonst keine Treffer (Asset-Pfade ausgenommen) |
| AK5 | erfüllt | `openapi.json` nach Export unverändert; kein Diff in `frontend`, Schemas, Services, Routen; pytest 28 passed; Seed-Werte und Reihenfolge unverändert |
| AK6 | offen | lokal grün (ruff, format, mypy, pytest, Docker-Build prod/dev); offen: CI nach Push, `./script.sh dev`/`prod` nach `down -v` |

**Blockierende Befunde**
- [x] AK4: `backend/tests/test_migrate.py:7` – alte Tabellennamen durch neutrale ersetzen (z. B. `["scene", "legacy_table"]`;
  `check_legacy_schema` prüft nur das Fehlen von `alembic_version`) oder Ausnahme im Plan durch den User.
- [ ] AK6: CI-Lauf nach Push prüfen (`lint`, `test` inkl. „Migrations“, `docker-prod`).
- [ ] AK6: User setzt Volumes zurück, `./script.sh dev` und `./script.sh prod` müssen healthy werden; vorher einmal mit
  altem Dev-Volume starten (Reset-Hinweis im Log = Original-Nachweis AK3).

**Hinweise (nicht blockierend)**
- Invariante „Tests bis auf Seed-Keys in `conftest.py` unverändert“: auch `tests/test_maps.py` angepasst (nur Seed-Keys,
  Assertions unverändert) – zwangsläufige Folge von E4, Entscheidung beim User.
- Weitere Abweichungen (ruff-`post_write_hooks`, `script.py.mako`, `migrations/README` entfernt, `configure_logger`-Flag,
  Import `from app import models` in `main.py` entfallen) verletzen keine Plan-Entscheidung.
- `backend/CLAUDE.md` nennt `Mapped[str | None]` als Beispiel, obwohl keine nullable Spalte mehr existiert – kosmetisch.
- INFO zu `ground_image_id_seq` („assuming SERIAL“) bei `alembic check` ist erwartetes Verhalten.
- Konventionen und Scope eingehalten (ein Commit, Typ passt, keine KI-Signatur, `development`).

**Checks**
- `ruff check`, `ruff format --check`, `mypy app`: grün
- `pytest -q` (Wegwerf-DB postgres:17): 28 passed
- `alembic upgrade head`/`check`/`downgrade base`/`upgrade head`: fehlerfrei
- `export_openapi.py` + `git diff --exit-code openapi.json`: unverändert
- `docker build --target prod`/`dev`: ok
