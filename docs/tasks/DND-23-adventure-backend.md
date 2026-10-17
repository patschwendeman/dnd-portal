# DND-23: Abenteuer und Spieler im Backend (Datenmodell, Migration, Adventure-API)

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Heute gibt es nur die Tabellen `scene` und `media`, beide global. Die aktive Szene existiert nur im `localStorage` des
Spieltisch-Browsers, Spieler gibt es im Datenmodell nicht. Ziel: Eine oberste Ebene **Abenteuer** (`Adventure`) bündelt
Szenen und Spieler und speichert die aktive Szene sowie das globale Level persistent. Dieser Task baut das Backend
(Modell, Migration, Seed, API). Das Frontend nutzt die neue API erst in DND-24 und läuft bis dahin unverändert über die
bestehenden Endpoints. Das spätere Session-Management mit WebSockets baut darauf auf (eigener Task).

## Scope / Non-Goals

**Im Scope**
- Tabellen `adventure` und `player`, Spalte `scene.adventure_id`, Alembic-Migration `0003` inkl. Datenübernahme.
- Seed: ein Abenteuer mit allen bestehenden Szenen und vier Platzhalter-Spielern.
- Lesende Endpoints für Abenteuer, Spieler sowie Szenen und Karten je Abenteuer.
- `PATCH /adventures/{id}` für `active_scene_id` und `global_level`; CORS erlaubt zusätzlich `PATCH`.
- Tests, OpenAPI-Export, generierte Frontend-Typen (`schema.d.ts`) und Doku.

**Nicht im Scope**
- Jede Änderung am Frontend-Code außer dem neu generierten `src/api/schema.d.ts` (folgt in DND-24).
- Entfernen der globalen Endpoints `GET /scenes` und `GET /maps/main|side` sowie Anpassen des Prod-Healthchecks (folgt in DND-24).
- Anlegen, Bearbeiten oder Löschen von Abenteuern, Szenen oder Spielern per API (kein POST/PUT/DELETE).
- Spieler-Level, Ressourcen oder sonstige Charakterwerte; Upload von Avatarbildern.
- Session-Management, WebSockets, Authentifizierung.

## Entscheidungen

### E1: Abenteuer ↔ Szene und Abenteuer ↔ Spieler jeweils 1:N
- **Entscheidung:** `scene.adventure_id` und `player.adventure_id` sind `NOT NULL` und verweisen auf `adventure.id`.
  Ein Player-Eintrag steht für „diese Person mit diesem Charakter in diesem Abenteuer“. In einem anderen Abenteuer
  bekommt dieselbe Person einen eigenen Eintrag. `media` bleibt global.
- **Verworfene Alternativen:** N:M für Szenen (Szene in mehreren Abenteuern); N:M für Spieler; getrennte Ebenen
  Person (global) und Charakter (je Abenteuer).
- **Begründung:** Einfachstes Modell. Wiederverwendung findet über die Medien statt, und die Prüfung der aktiven Szene ist trivial.

### E2: Tabelle `adventure`
- **Entscheidung:** `id`, `name` (NOT NULL), `description` (Text, nullable), `global_level` (int, NOT NULL,
  Default 1, CHECK 1–20, Constraint-Name nach Konvention `ck_adventure_global_level`), `active_scene_id` (FK → `scene.id`,
  nullable, `ON DELETE SET NULL`). Wegen der zirkulären Fremdschlüssel (`adventure` ↔ `scene`) wird der FK
  `active_scene_id` in der Migration erst nach `scene.adventure_id` angelegt, im Model mit `use_alter=True` bzw.
  `post_update=True`, falls nötig.
- **Begründung:** `global_level` gilt vorerst für alle Spieler des Abenteuers (später evtl. pro Spieler).

### E3: Tabelle `player`
- **Entscheidung:** `id`, `adventure_id` (FK, NOT NULL), `player_name`, `character_name`, `race`, `character_class`
  (alle Text, NOT NULL, Freitext), `avatar_media_id` (FK → `media.id`, nullable). Im Code und in der API heißt das
  Feld `character_class`, weil `class` in Python ein Schlüsselwort ist.
- **Verworfene Alternativen:** Feste Liste (Enum/CHECK) für Rasse und Klasse; Avatar als freier Pfad-String.
- **Begründung:** Freitext erlaubt Homebrew und Unterklassen ohne Migration. Der Avatar folgt demselben Muster wie
  Wall- und Ground-Bild (Datei in `media/`, `source` berechnet).

### E4: Migration `0003` mit Datenübernahme
- **Entscheidung:** `upgrade` legt `adventure` und `player` an und ergänzt `scene.adventure_id` zunächst als nullable.
  **Nur wenn `scene` Zeilen enthält**, fügt die Migration das Abenteuer aus dem Seed ein (gleicher Name und gleiche Beschreibung wie in E5,
  `global_level` 1, `active_scene_id` NULL) und weist ihm alle Szenen zu. Danach wird `adventure_id` NOT NULL, und der FK
  `active_scene_id` wird angelegt. Auf einer leeren DB legt die Migration kein Abenteuer an (das macht der Seeder).
  Spieler legt die Migration nicht an, die ergänzt der Seeder, weil `player` leer ist. `downgrade` entfernt FK, Spalte und
  beide Tabellen. Die Szenen bleiben erhalten.
- **Begründung:** Bestehende Dev- und Prod-DBs laufen ohne Reset weiter. Danach ergibt sich auf einer frischen und einer migrierten DB derselbe Stand.

### E5: Seed
- **Entscheidung:** `seed_data.json` bekommt die Listen `adventures` (ein Eintrag: `name` „Erstes Abenteuer“,
  `description` „Das erste Abenteuer“, `global_level` 1) und `players` (vier Platzhalter, `adventure_id` 1, `avatar_media_id`
  null, z. B. „Spieler 1“ / „Aragorn“ / „Mensch“ / „Waldläufer“). Jede Szene bekommt `"adventure_id": 1`.
  Reihenfolge im Seeder: `adventure` → `media` → `scene` → `player`, jede Tabelle wie bisher nur, wenn sie leer ist.
  `active_scene_id` bleibt im Seed leer (NULL).
- **Begründung:** Platzhalter genügen, bis Spieler im Frontend gepflegt werden können.

### E6: API-Form
- **Entscheidung:** Neue Router `adventures` (Prefix `/adventures`, Tag `adventures`). Pfade ohne Slash am Ende,
  Feldnamen in snake_case wie bisher:

  | Methode und Pfad | Antwort |
  |---|---|
  | `GET /adventures` | `list[AdventureSummary]` nach ID, ggf. `[]` |
  | `GET /adventures/{adventure_id}` | `AdventureDetail` bzw. 404 `{"detail": "Adventure not found"}` |
  | `PATCH /adventures/{adventure_id}` | Body `AdventureUpdate`, Antwort `AdventureDetail`; 404 wie oben; 422 (siehe E7) |
  | `GET /adventures/{adventure_id}/scenes` | `list[SceneDetail]` der Szenen des Abenteuers nach ID; 404 wie oben |
  | `GET /adventures/{adventure_id}/maps/main` | `list[MapEntry]` der Kampfszenen des Abenteuers; 404 wie oben |
  | `GET /adventures/{adventure_id}/maps/side` | `list[MapEntry]` der Nicht-Kampfszenen des Abenteuers; 404 wie oben |

  Schemas:
  ```
  AdventureSummary { id: int, name: str, description: str | null }
  AdventureDetail  { id: int, name: str, description: str | null, global_level: int,
                     active_scene_id: int | null, players: list[Player] }          players nach ID
  Player           { id: int, player_name: str, character_name: str, race: str,
                     character_class: str, avatar: Image | null }
  AdventureUpdate  { active_scene_id?: int | null, global_level?: int (1–20) }    nur gesetzte Felder werden geändert
  ```
  `SceneDetail` bleibt unverändert (kein `adventure_id` im Vertrag). `GET /scenes`, `GET /scenes/{id}` und
  `GET /maps/main|side` bleiben unverändert bestehen (global über alle Abenteuer). Die globalen Listen-Endpoints entfallen in DND-24.
- **Verworfene Alternativen:** Query-Parameter (`/scenes?adventure_id=`); Szenen direkt im `AdventureDetail` einbetten.
- **Begründung:** Verschachtelte Pfade machen die Zugehörigkeit explizit. `/scenes/{id}` bleibt der Einstieg für Wall und
  Ground, weil die Szenen-ID global eindeutig ist.

### E7: Validierung der aktiven Szene im Service
- **Entscheidung:** `PATCH` mit einer `active_scene_id`, die nicht existiert oder zu einem anderen Abenteuer gehört,
  antwortet mit 422 `{"detail": "Scene does not belong to adventure"}` und ändert nichts. `null` ist erlaubt und
  leert die aktive Szene. Ein `global_level` außerhalb 1–20 lehnt das Pydantic-Schema ab (422 im FastAPI-Standardformat), zusätzlich
  greift der CHECK in der DB.
- **Verworfene Alternativen:** Zusammengesetzter FK `(active_scene_id, id)` → `scene(id, adventure_id)` in der DB.
- **Begründung:** Die Regel ist einfach im Service prüfbar. Ein zusammengesetzter FK verkompliziert Schema und Migration für wenig Gewinn.

### E8: CORS erlaubt `PATCH`
- **Entscheidung:** `allow_methods=["GET", "PATCH"]`, sonst unverändert (keine Credentials, Origins aus `CORS_ORIGINS`).
- **Begründung:** Der Admin speichert die aktive Szene ab DND-24 per `PATCH` mit JSON-Body (Preflight).

## Subtasks

### Vertrag
- [x] Schemas `AdventureSummary`, `AdventureDetail`, `Player`, `AdventureUpdate` in `app/schemas/adventure.py` gemäß E6,
      re-exportiert in `app/schemas/__init__.py`.

### Backend
- [x] Models `Adventure` (`app/models/adventure.py`) und `Player` (`app/models/player.py`) gemäß E2/E3; `Scene.adventure_id`
      plus Relationen (`Adventure.scenes`, `Adventure.players`, `Adventure.active_scene`, `Player.avatar`); Re-Export in
      `app/models/__init__.py`.
- [x] Alembic-Revision `0003` gemäß E4 (upgrade und downgrade); `alembic check` ohne Drift.
- [x] `seed_data.json` und `app/db/seed.py` gemäß E5.
- [x] CRUD `app/crud/adventure.py` (Lesen mit Spielern und Avatar, Update); `app/crud/scene.py` um Filter nach
      `adventure_id` erweitern (Szenenliste und `read_scenes_by_main`), vorhandenes `_select_scenes_with_relations` wiederverwenden.
- [x] Services `app/services/adventure.py` (inkl. Prüfung E7); `app/services/map.py` um optionales `adventure_id` erweitern.
- [x] Router `app/api/routes/adventures.py` gemäß E6, Registrierung in `app/main.py`; CORS gemäß E8.
- [x] `uv run python scripts/export_openapi.py`.
- [x] Tests:
  - `tests/test_adventures.py`: Liste, Detail inkl. Spieler (Erwartungen aus dem Seed), 404, verschachtelte Szenen und Maps
    (Inhalt gleich den bisherigen globalen Antworten, da nur ein Abenteuer existiert), PATCH (Szene setzen, auf `null`
    setzen, `global_level` setzen, 422 für fremde/unbekannte Szene und Level 0/21, 404). PATCH-Tests stellen den
    Ausgangszustand wieder her bzw. laufen isoliert, damit andere Tests den Seed-Stand sehen.
  - Isolation: ein zweites Abenteuer mit eigener Szene als Test-Fixture (in einer zurückgerollten Transaktion oder
    vor dem Test angelegt und danach entfernt), um zu prüfen, dass Szenen/Maps je Abenteuer gefiltert werden und PATCH
    eine Szene des anderen Abenteuers ablehnt.
  - `tests/test_migration_0003.py` nach dem Muster von `test_migration_0002.py`: DB auf `0002` mit Szenen →
    `upgrade` → alle Szenen im Abenteuer 1, Spalte NOT NULL; leere DB → kein Abenteuer; `downgrade` → Szenen
    unverändert.
  - `tests/test_seed.py` um Abenteuer und Spieler ergänzen; `tests/conftest.py` um Erwartungen für Abenteuer/Spieler.
  - `tests/test_cors.py`: Preflight für `PATCH` von erlaubtem Origin erlaubt, von fremdem abgelehnt.

### Frontend
- [x] `npm run generate:api` → `src/api/schema.d.ts` neu (sonst keine Frontend-Änderung; `npm run typecheck` grün).

### Doku
- [x] `docs/architecture.md`: Datenmodell, Endpoints, Antwortformat, CORS (`GET`, `PATCH`), Migrationen (`0003`),
      Seed-Daten.
- [x] `docs/domain.md`: Begriffe Abenteuer, Spieler/Charakter, globales Level, aktive Szene (persistent im Abenteuer).
- [x] `backend/CLAUDE.md` (Struktur, Tests) und `backend/README.md` (Endpoint-Tabelle).

## Akzeptanzkriterien

### AK1: Abenteuer abrufen
- **Given** eine frisch gestartete DB mit Seed
- **When** `GET /adventures` und `GET /adventures/1` aufgerufen werden
- **Then** liefert die Liste genau „Erstes Abenteuer“, das Detail enthält `global_level` 1, `active_scene_id` null und
  die vier Platzhalter-Spieler mit `avatar` null.

### AK2: Szenen und Karten je Abenteuer
- **Given** zwei Abenteuer mit jeweils eigenen Szenen (Test-Fixture)
- **When** `GET /adventures/{id}/scenes` bzw. `/maps/main|side` für eines der Abenteuer aufgerufen wird
- **Then** enthält die Antwort nur dessen Szenen, im selben Format wie `/scenes` bzw. `/maps/*`. Für eine unbekannte ID kommt 404.

### AK3: Aktive Szene persistent setzen
- **Given** Abenteuer 1 ohne aktive Szene
- **When** `PATCH /adventures/1` mit `{"active_scene_id": 5}` und danach `GET /adventures/1` aufgerufen werden
- **Then** ist `active_scene_id` 5, auch nach einem Neustart der API.
- **And** `{"active_scene_id": null}` leert sie wieder.

### AK4: Ungültige Werte werden abgelehnt
- **Given** eine Szene, die zu einem anderen Abenteuer gehört oder nicht existiert
- **When** sie per `PATCH` als `active_scene_id` gesetzt werden soll
- **Then** antwortet die API mit 422, und das Abenteuer bleibt unverändert. Dasselbe gilt für `global_level` 0 oder 21.

### AK5: Bestehende DB wird migriert
- **Given** eine Dev- oder Prod-DB auf Stand `0002` mit den bisherigen Szenen
- **When** die API startet
- **Then** liegt die DB auf `0003`, alle Szenen gehören zu „Erstes Abenteuer“, die vier Spieler sind ergänzt, und ein Reset war nicht nötig.

### AK6: Frontend unverändert lauffähig
- **Given** der Stand nach diesem Task
- **When** Admin, Wall und Ground wie bisher genutzt werden
- **Then** verhalten sie sich unverändert (globale Endpoints bestehen weiter). `npm run typecheck` ist mit den neu
  generierten Typen grün.

## Teststrategie / Verifikation

**Automatisch**
- Backend: `uv run pytest` (neue und erweiterte Tests siehe Subtasks), `ruff check`, `ruff format --check`,
  `mypy app`, `alembic check`, CI-Rundlauf `upgrade head` → `downgrade base` → `upgrade head`.
- Frontend: `npm run generate:api` ohne Diff zu `schema.d.ts` im Commit, `npm run typecheck`, `npm run test:unit`.

**Manuell**
1. Bestehende Dev-DB (Stand `0002`) behalten, `dnd dev` starten: Log ohne Fehler, `GET /adventures/1` zeigt 4 Spieler.
2. `curl -X PATCH -H 'Content-Type: application/json' -d '{"active_scene_id": 5}' localhost:8000/adventures/1`,
   API neu starten, `GET /adventures/1` → `active_scene_id` 5.
3. Admin, Wall und Ground öffnen: Szenenwechsel funktioniert wie vorher.

## Offene Fragen
- keine

## Review
