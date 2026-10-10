# DND-18: SQLAlchemy 2.0 typisiert (Mapped, select) und mypy strict

**Typ:** refactor
**Status:** Fertig

## Kontext & Ziel

Nach DND-17 nutzt das Backend SQLAlchemy noch im 1.x-Stil (`declarative_base()`, `Column`, `db.query`,
`bulk_save_objects`) – Spaltentypen sind für mypy, IDE und Agents unsichtbar. Die Kartenliste und die Detailansicht
laden alle Szenen und filtern in Python. mypy läuft nur im Basis-Modus, mit einem `# type: ignore` in
`app/core/config.py`. Ziel: Models und Abfragen im typisierten 2.0-Stil, Filtern in SQL, mypy `strict` für `app/`
(siehe `docs/known-issues.md`, „FastAPI & SQLAlchemy“, „Konfiguration & Tooling“).

## Invarianten

- API-Verhalten unverändert: Pfade, Statuscodes, Response-Form und -Inhalt aller 6 Endpoints **inklusive der bekannten
  Bugs** (500 statt 404, ganze Liste bei unbekannter Detail-ID, 422 bei `/scenes/details`, Redirect bei Trailing Slash).
  Einzige bewusste Ausnahme: E4 (leere DB bei `/maps/*`).
- Charakterisierungstests (`tests/test_scenes.py`, `tests/test_maps.py`, `tests/test_cors.py`, `tests/test_config.py`)
  inhaltlich unverändert grün.
- **DB-Schema unverändert:** gleiche Tabellen, Spalten, Typen, Nullbarkeit, Indizes, Fremdschlüssel und Unique-Constraints
  (`create_all` auf leerer DB erzeugt dasselbe Schema wie vorher). Auch die ungenutzten Spalten `Scene.music_id` und
  `GraphicsGround.main` bleiben (eigener Task mit Migrationen).
- Seed-Ergebnis unverändert: gleiche Zeilen und IDs in Dateireihenfolge; Seeder füllt nur leere Tabellen.
- Struktur aus DND-17 (Module, Funktionsnamen der Services und Routen) bleibt.

## Scope / Non-Goals

**Im Scope**
- `Base` als `class Base(DeclarativeBase)`; alle Models mit `Mapped[...]`/`mapped_column`; Assoziationstabelle typisiert.
- Relation `GraphicsWall.scene` (fälschlich `uselist=False`) → `GraphicsWall.scenes: Mapped[list[Scene]]` (E2).
- `app/crud/scene.py`, `app/db/seed.py` auf `select()`/`db.scalars()`/`db.get()`/`add_all`.
- Filtern in SQL für Karten und Detail-by-ID (E3), Eager Loading der benötigten Relationen.
- mypy `strict` für `app/` inkl. Pydantic-Plugin; `# type: ignore` in `config.py` entfernen (E5).
- `sessionmaker[Session]`-Typisierung; Rückgabetypen aller Funktionen.

**Nicht im Scope**
- Pydantic-Schemas, `response_model`, Bugfixes, Umbenennung `Scene.music` (Schema-/Fehler-Task).
- Entfernen ungenutzter Spalten, Alembic, `nullable=False`-Verschärfungen (Schemaänderung → Migrations-Task).
- mypy strict für `tests/`.
- Async-SQLAlchemy.

## Entscheidungen

### E1: Typen spiegeln das bestehende Schema
- **Entscheidung:** Spalten ohne `nullable=False` bleiben nullable und werden als `Mapped[str | None]`,
  `Mapped[bool | None]`, `Mapped[int | None]` typisiert; Primärschlüssel `Mapped[int]` mit `primary_key=True, index=True`;
  `Text` bleibt per `mapped_column(Text)`. Relationen: `Scene.graphics_wall: Mapped[GraphicsWall | None]`,
  `Scene.graphics_ground: Mapped[GraphicsGround | None]`, `Scene.music: Mapped[list[Music]]`,
  `GraphicsGround.scene: Mapped[Scene | None]` (1:1 über Unique-FK), `Music.scenes: Mapped[list[Scene]]`.
  Zirkuläre Importe zwischen `models/scene.py` und `models/media.py` per `TYPE_CHECKING`-Import und String-Annotationen.
- **Begründung:** Schema-Invariante; striktere Nullbarkeit erst mit Migrationen.

### E2: `GraphicsWall.scenes` als Liste
- **Entscheidung:** `GraphicsWall.scene` (`uselist=False`) wird zu `scenes: Mapped[list[Scene]]`,
  `back_populates` auf beiden Seiten angepasst.
- **Begründung:** Mehrere Szenen teilen ein Wall-Bild; `Mapped` würde sonst den Fehler festschreiben. Reine
  ORM-Mapping-Änderung ohne DB-Schemaänderung; die Relation wird von keiner Route ausgeliefert (Tests belegen das).
  Der known-issues-Punkt wird entsprechend gekürzt.

### E3: Filtern in SQL, Bug-Verhalten bleibt
- **Entscheidung:**
  - `crud/scene.py`: `read_scenes(db)`, `read_scene(db, scene_id)` (`db.get`), `read_scenes_with_relations(db)`,
    neu `read_scene_with_relations(db, scene_id)` und `read_scenes_by_main(db, main: bool)` (mit Eager Loading von
    `graphics_wall`/`graphics_ground`, sortiert nach ID).
  - `services/scene.get_scene_detail`: lädt erst gezielt per ID; nur wenn nicht gefunden, wird wie bisher die ganze
    Liste zurückgegeben bzw. bei leerer DB `ValueError` geworfen (known issue bleibt bis zum Fix-Task).
  - `services/map.get_maps`: nutzt `read_scenes_by_main`; Rest unverändert.
- **Begründung:** Kein Laden aller Szenen mehr für Einzelabfragen; keine N+1-Abfragen bei den Karten.

### E4: Leere DB bei `/maps/*` – bewusste Abweichung
- **Entscheidung:** Bisher warf `get_maps` bei komplett leerer `scene`-Tabelle `ValueError` (→ 500). Nach der
  SQL-Filterung liefert eine leere Ergebnismenge `[]` (200) – unabhängig davon, ob die Tabelle leer ist oder nur keine
  passenden Szenen hat. Der `ValueError`-Zweig für die leere Tabelle entfällt.
- **Verworfene Alternativen:** Zusätzliche Abfrage nur zur Erhaltung des 500ers.
- **Begründung:** Der Zustand tritt praktisch nicht auf (Seeder läuft im `lifespan` vor dem ersten Request), ist durch
  keinen Test abgedeckt und entspricht der Richtung des Fix-Tasks.

### E5: mypy strict für `app/`
- **Entscheidung:** `[tool.mypy]` mit `strict = true`, `plugins = ["pydantic.mypy"]`, `files = ["app"]`. Routen geben
  ORM-Objekte zurück; damit FastAPI die Rückgabe-Annotation nicht als `response_model` interpretiert, bekommen diese
  Routen `response_model=None` im Decorator (bis der Schema-Task echte Schemas einführt). Karten-Einträge als
  `TypedDict` (`MapEntry: {id: int, source: str | None}`) statt `dict[str, object]`.
  `Settings()` ohne `# type: ignore` (Pydantic-Plugin). Keine neuen `# type: ignore` ohne Begründungskommentar.
- **Begründung:** Wunsch des Users; mit `Mapped` ist strict ohne Workarounds erreichbar.
- **Hinweis:** `TypedDict` als Rückgabe-Annotation wird von FastAPI als Response-Typ genutzt – Ausgabe identisch
  (`{"id", "source"}`), durch `test_maps.py` belegt.

## Subtasks

### Schritt 1: Models
- [x] `app/db/base.py`: `class Base(DeclarativeBase)`.
- [x] `app/models/scene.py`, `app/models/media.py` auf `Mapped`/`mapped_column` (E1, E2); `scene_music_association`
      unverändert als `Table` (Spalten, Namen, FKs gleich).
- [x] Schema-Vergleich: `CreateTable` für alle Tabellen vor und nach der Umstellung als DDL ausgeben
      (`str(CreateTable(t).compile(dialect=postgresql.dialect()))`) und vergleichen – identisch (Beleg im Review).

### Schritt 2: Abfragen & Seeder
- [x] `app/crud/scene.py` auf `select()`/`db.scalars()`/`db.get()`; neue Funktionen (E3). `.unique()` bei
      `joinedload` von Collections.
- [x] `app/services/scene.py`, `app/services/map.py` (E3, E4).
- [x] `app/db/seed.py`: `select(...).limit(1)`/`db.scalar` statt `db.query(...).first()`, `add_all` statt
      `bulk_save_objects`, Musik per `select(Music).where(Music.id.in_(...))`; Typen für alle Funktionen.
- [x] `app/db/session.py`: `sessionmaker[Session]` bzw. `sessionmaker(..., class_=Session)` typisiert.

### Schritt 3: mypy strict
- [x] `pyproject.toml` (E5); Routen mit `response_model=None` und Rückgabetypen; `MapEntry`.
- [x] `uv run mypy app` grün ohne neue `# type: ignore`.

### Schritt 4: Tests & Verifikation
- [x] Alle Tests unverändert grün (DB vorher zurücksetzen, damit das Seed-Ergebnis frisch geprüft wird).
- [x] Gegenprobe Seed: IDs und Musik-Zuordnung wie vorher (durch `expected_scene_details` abgedeckt).

### Doku
- [x] `backend/CLAUDE.md`: Stack-Zeile (SQLAlchemy 2.0 typisiert statt „klassischer Stil“), Konventionen
      (`Mapped`, `select()`, mypy strict, `response_model=None` bis Schemas), Befehle (`mypy app` strict).
- [x] `docs/architecture.md`: Datenmodell-Abschnitt, falls dort Stil/Relationen beschrieben (`GraphicsWall.scenes`).
- [x] `docs/known-issues.md`: Punkt „SQLAlchemy im 1.x-Stil“ und mypy-Punkt entfernen; `uselist`-Teil aus dem
      Punkt zu ungenutzten Spalten streichen; „filtert in Python statt per SQL“ aus dem Detail-Punkt streichen.

## Akzeptanzkriterien

- [ ] AK1: Keine Verwendung mehr von `declarative_base`, `Column` (außer in der `Table`-Definition), `db.query`,
      `bulk_save_objects` in `app/`; alle Models mit `Mapped[...]`.
- [ ] AK2: `GraphicsWall.scenes` ist eine Liste; DB-Schema per DDL-Vergleich identisch.
- [ ] AK3: `/maps/*` und `/scenes/details/{id}` laden nicht mehr alle Szenen, sondern filtern per SQL (Beleg: Code;
      optional SQL-Echo).
- [ ] AK4: `uv run mypy app` grün im `strict`-Modus mit Pydantic-Plugin; kein `# type: ignore` ohne Begründung,
      das in `config.py` ist entfernt.
- [ ] AK5: Alle Invarianten eingehalten – Tests inhaltlich unverändert grün; einzige Abweichung E4.
- [ ] AK6: ruff, pytest, CI und Docker-Build grün.

## Teststrategie / Verifikation

**Automatisch**
- Backend: bestehende Tests unverändert; ruff, mypy strict, Docker-Build; CI.

**Manuell**
1. `docker compose -f compose.dev.yaml down -v && ./script.sh dev` → frische DB wird geseedet; Admin lädt Szenen,
   Wall/Ground zeigen Bilder, Musik spielt.
2. DDL-Vergleich aus Schritt 1 dem Review beilegen.

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-10-11 (Commit 06ff26b)
**Empfehlung:** Abnahme (CI-Lauf nach Push noch nachzuweisen)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Kein `declarative_base`, `db.query`, `bulk_save_objects`, `# type: ignore` mehr in `backend/app`; `Column(` nur in der Assoziationstabelle; `class Base(DeclarativeBase)`; alle Model-Felder `Mapped[...]` |
| AK2 | erfüllt | `GraphicsWall.scenes: Mapped[list["Scene"]]` mit `back_populates`; DDL-Vergleich (`CreateTable`/`CreateIndex`, postgresql) 06ff26b^ vs. 06ff26b identisch – 5 Tabellen inkl. Indizes, FKs, `UNIQUE (graphics_ground_id)` |
| AK3 | erfüllt (Code) | `/maps/*` via `crud.read_scenes_by_main` (`where(Scene.main == main)`, joinedload, `order_by(id)`); Detail via `crud.read_scene_with_relations` (`.unique().one_or_none()`); Gesamtliste nur bei unbekannter ID (E3); SQL-Echo laut Implementer je eine Abfrage |
| AK4 | erfüllt | `mypy app` strict + `pydantic.mypy`: no issues (21 files); kein `# type: ignore` in `app/` |
| AK5 | erfüllt | `backend/tests/` unverändert, 21 passed (Dev-DB und frische DB); Seed-Dump alt/neu identisch (433 INSERTs); 12 Requests über alle 6 Endpoints (inkl. 500/422/307) alt/neu auf derselben DB byte-identisch; E4 (leere DB → `[]`) nur im Code geprüft |
| AK6 | lokal erfüllt, CI nach Push | `ruff check`, `ruff format --check` (29 files), `mypy` grün; pytest 21 passed; `docker build --target prod` ok |

**Blockierende Befunde**
- keine

**Hinweise**
- `docs/known-issues.md` sagt weiter „kein `response_model`“ – gilt nur noch für `/scenes*`; `/maps/*` haben jetzt `array[MapEntry]` im OpenAPI (E5, Ausgabe identisch)
- `MapEntry` aus `typing_extensions` (Pydantic verlangt das unter Python < 3.12), nur transitiv in `uv.lock`, nicht direkt in `pyproject.toml`
- `get_maps` wirft bei Szene ohne passendes Bild `ValueError` statt `AttributeError` – nach außen weiterhin 500; tritt mit Seed nicht auf
- `/maps/*` ohne `response_model=None` → FastAPI validiert gegen `MapEntry` (E5)
- Reihenfolge von `Scene.music` weiterhin undefiniert (Altbestand)
- Lokale `backend/.env` noch im alten Format; Checks mit `DB_HOST=localhost DB_PORT=5432 DB_DRIVER=postgresql+psycopg2`

**Checks:** ruff/mypy strict grün, pytest 21 passed (Dev-DB + frische DB), Build prod grün, DDL/Seed/Endpoint-Antworten alt vs. neu identisch; nach Push zu prüfen: Backend-CI und manueller Test (`down -v`, `./script.sh dev`, Admin/Wall/Ground/Musik)
