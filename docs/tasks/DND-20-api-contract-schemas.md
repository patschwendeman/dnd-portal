# DND-20: API-Vertrag mit Pydantic-Schemas, 404 statt 500, generierte Frontend-Typen

**Typ:** fix
**Status:** Entwurf

## Kontext & Ziel

Die Szenen-Endpoints haben mehrere bekannte Fehler (`docs/known-issues.md`, „Bugs & Daten“): unbekannte IDs erzeugen
500 statt 404, `/scenes/details/{id}` liefert bei unbekannter ID die ganze Liste, `/scenes/details` ohne Slash
endet in 422. Ursache ist u. a., dass `/scenes*` ORM-Objekte ohne Schema zurückgibt: Die Antwortform hängt vom
Eager Loading ab, enthält redundante bzw. ungenutzte Felder (`music_id` immer `null`, `*_id` doppelt, `graphics_ground.main`)
und ist im Frontend (`SceneDetail` in `frontend/src/models/models.ts`) von Hand und teils falsch gespiegelt
(`music_id: number`). Ziel: ein schlanker, per Pydantic-Schemas definierter Vertrag mit korrekten Statuscodes,
sprechenden Feldnamen und Frontend-Typen, die aus dem OpenAPI-Schema generiert werden – damit Backend und Frontend
nicht mehr auseinanderlaufen können. Betrifft Spielleiter (Admin) sowie Wall und Ground Screen.

## Fehlerbild

**Reproduktion**
1. `GET /scenes/999` bzw. `GET /scenes/details/999` bei laufendem Dev-Stack.
2. `GET /scenes/details` (ohne Slash).

**Ist:** (1) `/scenes/999` → 500 (`ValueError` im Service); `/scenes/details/999` → 200 mit der Liste aller Szenen.
(2) → 422 (`int_parsing`, Route `/scenes/{scene_id}` greift). Bei leerer DB liefert `GET /scenes` 500.
**Soll:** Unbekannte Szene → 404 `{"detail": "Scene not found"}`; Listen liefern immer 200 (ggf. `[]`); es gibt
keine Pfade mehr, die von einer `{scene_id}`-Route verschluckt werden.

## Ursache

- Services werfen `ValueError` statt `None` zurückzugeben; die Routen prüfen auf `None`/Falsy
  (`backend/app/services/scene.py`, `backend/app/api/routes/scenes.py`).
- `get_scene_detail` fällt bei unbekannter ID bewusst (Charakterisierung) auf die ganze Liste zurück.
- `/{scene_id}` ist vor `/details/` registriert; `/details` ohne Slash matcht daher `/{scene_id}`.

## Entscheidungen

### E1: Konsolidierte Endpoints
- **Entscheidung:**
  ```
  GET /scenes          -> list[SceneDetail]      (200, ggf. [])
  GET /scenes/{id}     -> SceneDetail            (200 | 404)
  GET /maps/main       -> list[MapEntry]         (200, ggf. [])
  GET /maps/side       -> list[MapEntry]         (200, ggf. [])
  ```
  Die schlanken Varianten ohne Relationen und das Segment `/details` entfallen. Kanonische Pfade **ohne**
  Slash am Ende; das Frontend ruft sie ohne Slash auf (FastAPIs Redirect bei Slash bleibt als Default bestehen).
  Der Healthcheck in `compose.prod.yaml` (`GET /scenes`) bleibt gültig.
- **Verworfene Alternativen:** Alle 6 Pfade behalten und nur die Bugs fixen.
- **Begründung:** Das Frontend braucht nur die Varianten mit Relationen; weniger Endpoints, kein Routen-Konflikt.

### E2: Sprechende Feldnamen
- **Entscheidung:** In API **und** ORM-Relationen: `graphics_wall` → `wall_image`, `graphics_ground` → `ground_image`,
  `music` → `tracks`. Model-Klassen (`GraphicsWall`, `GraphicsGround`, `Music`), Tabellen und Spalten bleiben unverändert
  (Umbenennung von Klassen/Tabellen erst mit Migrationen, Punkt in known-issues). `back_populates` entsprechend.
- **Verworfene Alternativen:** nur `music` → `tracks`; Namen behalten.
- **Begründung:** Wunsch des Users; Namen beschreiben den Inhalt aus Sicht der Screens.

### E3: Schlanke Antwort ohne redundante Felder
- **Entscheidung:** Schemas in `backend/app/schemas/` (`ConfigDict(from_attributes=True)`):
  ```
  Image       { id: int, name: str, source: str }
  Track       { id: int, name: str, source: str }
  SceneDetail { id: int, name: str, description: str, main: bool,
                wall_image: Image, ground_image: Image, tracks: list[Track] }
  MapEntry    { id: int, source: str }
  ```
  Entfallen: `music_id`, `graphics_wall_id`, `graphics_ground_id`, `graphics_ground.main`. Die DB-Spalten bleiben
  (Entfernen erst im Migrations-Task). `tracks` nach ID sortiert (bisher undefinierte Reihenfolge).
  `MapEntry` wird vom `TypedDict` zum Pydantic-Schema.
- **Begründung:** Wunsch des Users; das Frontend nutzt diese Felder nicht (nur `frontend/__tests__/unit/utils.spec.ts`
  verwendet `graphics_ground_id` als Beispiel-Key).

### E4: Nicht-nullbare Felder im Schema
- **Entscheidung:** `name`, `description`, `source`, `main`, `wall_image`, `ground_image` sind im Schema Pflicht und
  nicht nullable, obwohl die DB-Spalten (noch) nullable sind. Der Seed füllt alle Werte; fehlt einer, schlägt die
  Response-Validierung fehl (500) – der Migrations-Task ergänzt `NOT NULL`. Im Frontend entstehen so `string` statt
  `string | null`.
- **Verworfene Alternativen:** Nullable Typen bis ins Frontend durchreichen (viele Null-Checks ohne realen Fall).
- **Begründung:** Vertrag beschreibt die fachliche Wahrheit; das DB-Schema wird nachgezogen.

### E5: Fehlerbehandlung
- **Entscheidung:** Services geben `SceneDetail`-Quellen bzw. `None` zurück und werfen keine `ValueError` mehr
  für „nicht gefunden“ oder leere Listen; die Route wirft `HTTPException(404, "Scene not found")`. Fehlerformat ist
  FastAPIs Default `{"detail": "..."}`. Routen deklarieren `responses={404: ...}` für OpenAPI.
  `response_model=None` entfällt überall; die Routen sind über Rückgabe-Annotation bzw. `response_model` typisiert.
- **Begründung:** FastAPI-Konvention; einfacher als eigene Exception-Klassen bei vier Endpoints.

### E6: Frontend-Typen aus OpenAPI generiert
- **Entscheidung:**
  - Backend: `backend/scripts/export_openapi.py` schreibt `app.openapi()` deterministisch (sortierte Keys, 2er-Einrückung,
    Newline am Ende) nach `backend/openapi.json` (versioniert). Aufruf `uv run python scripts/export_openapi.py`
    (Import von `app.main` braucht keine DB, seit DND-17).
  - Frontend: Dev-Abhängigkeit `openapi-typescript` (exakt gepinnt), Script
    `"generate:api": "openapi-typescript ../backend/openapi.json -o src/api/schema.d.ts"`; `schema.d.ts` versioniert,
    von ESLint ausgenommen.
  - `frontend/src/models/models.ts` leitet die API-Typen ab:
    `SceneDetail = components['schemas']['SceneDetail']`, `Image`, `Track`, `MapResponse = components['schemas']['MapEntry']`;
    Frontend-eigene Typen (`Map`) bleiben handgeschrieben. Interfaces `Screen`/`Music` entfallen.
  - CI: Backend-Job `lint` prüft per Export + `git diff --exit-code backend/openapi.json`, dass das Schema aktuell ist;
    Frontend-Job `typecheck` prüft per `npm run generate:api` + `git diff --exit-code src/api/schema.d.ts` die Typen.
    `frontend.yml` triggert zusätzlich auf `backend/openapi.json`.
- **Verworfene Alternativen:** Eigener Task; Typen weiter von Hand pflegen; Typen zur Laufzeit von `/openapi.json`
  eines laufenden Servers generieren (CI bräuchte DB/Server).
- **Begründung:** Wunsch des Users; die versionierte `openapi.json` ist die Single Source of Truth und im Diff sichtbar.

## Scope / Non-Goals

**Im Scope**
- Schemas, Routen, Services, CRUD-Relationen, ORM-Relationsnamen (E1–E5).
- Tests: Charakterisierungstests auf den neuen Vertrag umstellen, 404-Fälle, `# known issue`-Markierungen entfernen.
- OpenAPI-Export, Typgenerierung, CI-Checks (E6).
- Frontend: Pfade ohne Slash und ohne `/details`, neue Feldnamen in Screens/Komponenten, `SceneDetailMock.json`,
  Unit-/BDD-Tests.
- Doku.

**Nicht im Scope**
- Entfernen ungenutzter DB-Spalten, `NOT NULL`, Umbenennen von Model-Klassen/Tabellen, Alembic (Migrations-Task).
- Schreibende Endpoints.
- Umbenennung von `MapEntry.id` in `scene_id` (Frontend mappt bereits auf `sceneId`).
- Seed-Inhalte (Level_up, Musiknamen, Beschreibungen).
- Änderungen am Verhalten der Screens.

## Subtasks

### Vertrag
- [ ] `backend/app/schemas/{__init__,scene,map}.py` (E3, E4).
- [ ] Endpoints gemäß E1, Fehler gemäß E5.

### Backend
- [ ] ORM-Relationen umbenennen (E2) in `app/models/scene.py`, `app/models/media.py`; `app/crud/scene.py`
      (Eager Loading der neuen Namen, `tracks` sortiert), `app/services/{scene,map}.py`, `app/db/seed.py`
      (`scene.tracks = …`; Seed-JSON-Key `music_id` bleibt, da Datenformat – nur Zuweisung anpassen).
- [ ] `app/api/routes/scenes.py`: zwei Routen (`""`, `"/{scene_id}"`) mit `response_model`; `maps.py` mit `list[MapEntry]`.
- [ ] `MapEntry`-`TypedDict` durch Schema ersetzen; `get_maps` ohne `ValueError` für „kein Bild“ → Schema-Validierung
      (E4) übernimmt.
- [ ] Tests: `tests/conftest.py` (Erwartungen im neuen Format aus dem Seed); `tests/test_scenes.py`: Liste, by ID,
      404 bei unbekannter ID, entfernte Pfade (AK3); `tests/test_maps.py` bis auf das neue Schema unverändert.
      `# known issue`-Markierungen entfernen. Regressionstests für alle Reproduktionsschritte.
- [ ] `backend/scripts/export_openapi.py`, `backend/openapi.json` (E6).

### Frontend
- [ ] `openapi-typescript` + Script `generate:api`, `src/api/schema.d.ts` generieren; ESLint-Ignore.
- [ ] `src/models/models.ts` (E6).
- [ ] `src/service/{adminScreen,WallScreen,groundScreen}.ts`: Pfade `scenes`, `scenes/{id}`, `maps/main`, `maps/side`.
- [ ] `src/screens/{AdminScreen,WallScreen,GroundScreen}.tsx`, `src/components/{Dialogue,DetailsSideBar}.tsx` u. a.:
      `graphics_wall` → `wall_image`, `graphics_ground` → `ground_image`, `music` → `tracks`; `MapResponse.source` nicht
      mehr optional.
- [ ] `__tests__/unit/SceneDetailMock.json` auf neues Format; `utils.spec.ts` mit vorhandenem Key (z. B. `id`);
      BDD-Steps/Mocks prüfen.

### CI
- [ ] `.github/workflows/backend.yml`: OpenAPI-Aktualitätscheck (E6).
- [ ] `.github/workflows/frontend.yml`: Trigger-Pfad `backend/openapi.json`, Typ-Aktualitätscheck (E6).

### Doku
- [ ] `docs/architecture.md`: Endpoint-Tabelle, Antwortformat, Abschnitt „API-Vertrag & Typgenerierung“ (Ablauf bei
      Vertragsänderung: Backend ändern → `export_openapi.py` → `npm run generate:api` → Frontend anpassen).
- [ ] `docs/domain.md` (Code-Namen `scene.wall_image`, `scene.ground_image`, `scene.tracks`), `docs/screens.md`
      (Feldnamen), `frontend/CLAUDE.md` (Pfad `scenes/{id}`, Typgenerierung), `backend/CLAUDE.md` (API-Vertrag,
      Schemas, `response_model`, Export-Befehl; Hinweis auf `response_model=None` entfernen).
- [ ] `docs/known-issues.md`: Bugs (500/404, Liste, 422), Punkt „Relation `Scene.music`“ und „ohne Pydantic-Schemas“
      entfernen; neuen Punkt: Model-Klassen/Tabellen heißen noch `GraphicsWall`/`GraphicsGround`/`Music` – Umbenennung
      mit Migrationen; Satz zu Charakterisierungstests anpassen.

## Akzeptanzkriterien

### AK1: Unbekannte Szene
- **Given** der Seed ist geladen
- **When** `GET /scenes/999` aufgerufen wird
- **Then** antwortet die API mit 404 und `{"detail": "Scene not found"}`

### AK2: Szenen mit Relationen
- **Given** der Seed ist geladen
- **When** `GET /scenes` bzw. `GET /scenes/{id}` aufgerufen wird
- **Then** enthält jede Szene genau `id, name, description, main, wall_image, ground_image, tracks` (Bilder/Tracks mit
  `id, name, source`, Tracks nach ID sortiert) und keine `*_id`- oder `music`-Felder

### AK3: Keine verschluckten Pfade
- **Given** die API läuft
- **When** die entfernten Pfade `GET /scenes/details/1` bzw. `GET /scenes/details` aufgerufen werden
- **Then** liefert sie keine Szenendaten und keinen 500: `/scenes/details/1` → 404 (Route existiert nicht),
  `/scenes/details` → 422 (`details` ist keine gültige `scene_id`); beides im Test festgehalten

### AK4: Leere Listen
- **Given** keine passende Szene existiert
- **When** eine Listen-Route aufgerufen wird
- **Then** antwortet sie mit 200 und `[]`

### AK5: Generierte Typen
- `backend/openapi.json` und `frontend/src/api/schema.d.ts` sind aktuell (CI-Checks grün; ein absichtlich
  veraltetes Schema lässt den Check fehlschlagen – lokal nachgewiesen); `models.ts` nutzt die generierten Typen.

### AK6: Screens unverändert nutzbar
- **Given** `./script.sh dev`
- **When** im Admin Screen eine Kampf- und eine Nicht-Kampfszene aktiviert werden
- **Then** zeigen Wall und Ground die richtigen Bilder, die Playlist spielt, Beschreibung und Dialog-Vorschau stimmen

### AK7: Regressionstests
- Backend-Tests bilden alle Reproduktionsschritte ab, schlagen gegen den alten Stand fehl und danach nicht.
- Backend (ruff, mypy strict, pytest), Frontend (lint, typecheck, unit, build) und CI grün.

## Teststrategie / Verifikation

**Automatisch**
- Backend: `tests/test_scenes.py`, `tests/test_maps.py` auf neuen Vertrag; 404-/Leere-Liste-Fälle; OpenAPI-Check.
- Frontend (Unit / BDD): `utils.spec.ts`, `apiErrors.spec.ts`, Mock; Typcheck gegen generierte Typen; E2E lokal
  (`npm run test:e2e`), soweit lauffähig.

**Manuell**
1. DB zurücksetzen, `./script.sh dev`; Admin: Szenen laden, Kampf-/Nicht-Kampfszene aktivieren → Wall/Ground/Musik korrekt.
2. `http://localhost:8000/docs`: vier Endpoints mit Schemas `SceneDetail`, `MapEntry`, 404-Response dokumentiert.
3. Netzwerk-Tab: keine 307-Redirects mehr (Pfade ohne Slash).

## Offene Fragen
- keine

## Review
