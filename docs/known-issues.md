# Bekannte Lücken, Bugs & Altlasten

Stand: Analyse vom 2026-09-27, Backend-Struktur/Best Practices ergänzt am 2026-10-10. Punkte mit „(ungeprüft)“ wurden aus dem Code abgeleitet, aber nicht zur Laufzeit verifiziert.

## Lücken gegenüber der Vision

- Player-Ressourcen sind nur lokal, nicht persistiert und nicht pro Charakter konfigurierbar.
- Keine NPC-, Charakter- oder Kampfdaten im Datenmodell – nur Markdown-Notizen.
- Soundeffekte und Notizen sind nicht mit Szenen verknüpft (nur Frontend-Dateien).
- Keine gebietsspezifische Übersichtskarte auf dem Wall Screen; Weltkarte ist ein fest eingebundenes Bild.
- Grid-Einstellungen gelten global und werden nicht gespeichert.
- Szenen lassen sich nur über `seed_data.json` pflegen (keine schreibenden Endpoints, Seeder aktualisiert bestehende DB nicht).

## Backend

### Bugs & Daten

- Nicht gefundene Datensätze erzeugen 500 statt 404 (Services werfen `ValueError`, Routen prüfen auf `None`).
- `/scenes/details/{id}` lädt alle Szenen und gibt bei unbekannter ID die **ganze Liste** zurück. Auch
  `MapsService.read_maps` lädt alle Szenen und filtert in Python statt per SQL (`where`/`get`).
- `/scenes/details` ohne Slash landet vermutlich auf `/scenes/{scene_id}` → 422 (ungeprüft).
- `Scene.music_id` und `GraphicsGround.main` sind ungenutzte Spalten; `GraphicsWall.scene` hat fälschlich `uselist=False`.
- `crud.create`/`crud.update` ungenutzt; `crud.py` definiert eine Dummy-Klasse `Base`, die den ORM-Namen überschattet.
- Keine Migrationen: Schemaänderungen erfordern DB-Reset.
- Keine Tests; CI läuft trotzdem grün. Testordner `__tests__/` folgt der JS-Konvention – in Python üblich: `tests/`
  mit `test_*.py` und pytest.
- Seed: Ground „Level_up“ zeigt auf den `wall_screen`-Ordner; doppelte/unpassende Musiknamen; Beschreibungen großteils Copy-Paste.
- Seed: `name`-Werte der Ground-Bilder (`graphics_ground`) heißen noch `battle_N` – sollten analog zu den Dateien
  `main_N` heißen.
- README ist nur ein Zweizeiler – nicht löschen, sondern wie `frontend/README.md` aktualisieren (Zweck, Starten,
  Konfiguration, Befehle, Links auf `CLAUDE.md` und `../docs/`). **Erst nach dem Backend-Refactoring**, da sich
  Paketstruktur, Befehle und Konfiguration bis dahin noch ändern.

### Struktur & Benennung

- Paketname `src` (Imports `from src.…`): `src/` ist üblicherweise ein Layout-Ordner, kein Paket; `.pylintrc` hängt
  zusätzlich `src` an `sys.path` → zwei Import-Wurzeln. Üblich: `app/`.
- `src/db/` mischt Engine, Models, CRUD, Seeder und Seed-JSON. Üblich: getrennt in `core/config`, `db/session`,
  `models/`, `schemas/`, `crud/`, `services/`, `api/routes/`.
- Router heißen `scenes_router`/`maps_router` statt `router`; das Prefix `/scenes` bzw. `/maps` steht in jedem Pfad
  statt zentral über `include_router(..., prefix=..., tags=...)`.
- Services sind Klassen mit nur `@staticmethod` (`SceneService`, `MapsService`), dafür ist `too-few-public-methods`
  deaktiviert. Pythonischer: Modul-Funktionen.
- Uneinheitliche Parameterreihenfolge (`read_scene_by_id(scene_id, db)` vs. `read_maps(db, maptype)`); `maptype` ist
  ein String mit Laufzeit-Check statt `map_type: Literal`/`Enum`.
- Singular/Plural gemischt (`MapsService` vs. `SceneService`; Relation `Scene.music` ist eine Liste).

### FastAPI & SQLAlchemy

- Keine Pydantic-Schemas, kein `response_model`: OpenAPI ohne Antworttypen, Antwortform hängt von `joinedload` ab,
  Vertrag zu `SceneDetail` im Frontend nicht abgesichert.
- Seiteneffekte beim Import von `main.py`: `create_all` und Seeder laufen beim Import, die Session aus `next(get_db())`
  wird nie geschlossen. Üblich: `lifespan`-Handler – dann wäre `app` ohne DB importierbar (Tests).
- Dependencies im alten Stil `db: Session = Depends(get_db)` statt `Annotated` (`SessionDep`).
- CORS: `allow_origins=["*"]` zusammen mit `allow_credentials=True` ist widersprüchlich; Origins gehören in die Konfiguration.
- SQLAlchemy im 1.x-Stil: `declarative_base` aus dem veralteten `sqlalchemy.ext.declarative`, `Column`, `db.query`.
  2.0-Stil: `DeclarativeBase`, `Mapped[...]`/`mapped_column`, `select()`.

### Konfiguration & Tooling

- Konfiguration per `os.environ.get` + `load_dotenv` ohne Validierung. Üblich: `pydantic-settings`.
- `python-dotenv` wird importiert, steht aber nicht in `requirements.txt`.
- Nur `requirements.txt`: `pylint` landet als Laufzeit-Abhängigkeit im Prod-Image. Üblich: `pyproject.toml` mit
  getrennten Dev-Abhängigkeiten.
- Lint nur mit pylint, keine Typprüfung. Üblich: ruff (Lint + Format) und mypy/pyright.
- Dockerfile: `COPY . /app` kopiert auch Tests/Configs; kein Non-Root-User.
- Versionen von 2024 (FastAPI 0.114, Pydantic 2.9).

## Frontend

- `DocumentReader` sucht in `public/story/noneFight/` (existiert nicht) → Tab „Side“ leer.
- `ResourceBarPlayer`: `spellData[].max` weicht von `SpellMax` ab (Stufe II: 4 vs. 3); Spezial startet bei 1 statt 3.
