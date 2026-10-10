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
- `/scenes/details` ohne Slash landet auf `/scenes/{scene_id}` → 422 (`int_parsing`).
- Die Bugs dieses Abschnitts sind durch Charakterisierungstests (`backend/tests/`, `# known issue: …`) festgehalten;
  ein Fix-Task stellt die betroffenen Tests gezielt um.
- `Scene.music_id` und `GraphicsGround.main` sind ungenutzte Spalten; `GraphicsWall.scene` hat fälschlich `uselist=False`.
- Keine Migrationen: Schemaänderungen erfordern DB-Reset.
- Seed: Ground „Level_up“ zeigt auf den `wall_screen`-Ordner; doppelte/unpassende Musiknamen; Beschreibungen großteils Copy-Paste.
- README ist nur ein Zweizeiler – nicht löschen, sondern wie `frontend/README.md` aktualisieren (Zweck, Starten,
  Konfiguration, Befehle, Links auf `CLAUDE.md` und `../docs/`). **Erst nach dem Backend-Refactoring**, da sich
  Paketstruktur, Befehle und Konfiguration bis dahin noch ändern.

### Struktur & Benennung

- `app/db/` mischt Engine, Models, CRUD, Seeder und Seed-JSON. Üblich: getrennt in `core/config`, `db/session`,
  `models/`, `schemas/`, `crud/`, `services/`, `api/routes/`.
- Router heißen `scenes_router`/`maps_router` statt `router`; das Prefix `/scenes` bzw. `/maps` steht in jedem Pfad
  statt zentral über `include_router(..., prefix=..., tags=...)`.
- Services sind Klassen mit nur `@staticmethod` (`SceneService`, `MapsService`). Pythonischer: Modul-Funktionen.
- Uneinheitliche Parameterreihenfolge (`read_scene_by_id(scene_id, db)` vs. `read_maps(db, maptype)`); `maptype` ist
  ein String mit Laufzeit-Check statt `map_type: Literal`/`Enum`.
- Singular/Plural gemischt (`MapsService` vs. `SceneService`; Relation `Scene.music` ist eine Liste).

### FastAPI & SQLAlchemy

- Keine Pydantic-Schemas, kein `response_model`: OpenAPI ohne Antworttypen, Antwortform hängt von `joinedload` ab,
  Vertrag zu `SceneDetail` im Frontend nicht abgesichert.
- Seiteneffekte beim Import von `main.py`: `create_all` und Seeder laufen beim Import, die Session aus `next(get_db())`
  wird nie geschlossen. Üblich: `lifespan`-Handler – dann wäre `app.main` ohne DB importierbar (Tests laufen bisher nur gegen eine echte DB).
- Dependencies im alten Stil `db: Session = Depends(get_db)` statt `Annotated` (`SessionDep`).
- CORS: `allow_origins=["*"]` zusammen mit `allow_credentials=True` ist widersprüchlich; Origins gehören in die Konfiguration.
  Seit Starlette 1.x spiegelt die Middleware in dieser Kombination den `Origin` des Requests in
  `Access-Control-Allow-Origin` (vorher `*`).
- SQLAlchemy im 1.x-Stil: `declarative_base()`, `Column`, `db.query`.
  2.0-Stil: `DeclarativeBase`, `Mapped[...]`/`mapped_column`, `select()`.

### Konfiguration & Tooling

- Konfiguration per `os.environ.get` + `load_dotenv` ohne Validierung. Üblich: `pydantic-settings`.
- mypy nur im Basis-Modus (kein `strict`); gezielte `# type: ignore` in `app/db/crud.py` und `app/db/database.py`.
  Verschärfung sinnvoll nach Umstellung auf SQLAlchemy-2.0-Stil und Pydantic-Schemas.

## Frontend

- `DocumentReader` sucht in `public/story/noneFight/` (existiert nicht) → Tab „Side“ leer.
- `ResourceBarPlayer`: `spellData[].max` weicht von `SpellMax` ab (Stufe II: 4 vs. 3); Spezial startet bei 1 statt 3.
