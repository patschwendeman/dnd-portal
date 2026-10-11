# DND-22: Szenenmedien ins Backend verlagern (Tabelle `media`, Ordner `media/`, Auslieferung per API)

**Typ:** refactor
**Status:** Entwurf

## Kontext & Ziel

Szenenbilder (Wall/Ground) und Musik liegen heute in `frontend/public/assets/` und stecken damit im Frontend-Image;
die DB kennt nur freie Pfad-Strings (`source`, z. B. `/assets/images/wall_screen/forest.jpg`), deren Existenz niemand
prüft. Inhalt und Code sind dadurch vermischt: neue Medien brauchen einen Frontend-Build, das Backend kann Medien
weder auflisten noch ausliefern. Ziel: Das Backend besitzt die Szenenmedien – Dateien in einem eigenen Ordner
`media/`, Metadaten in einer Tabelle `media`, Auslieferung über die API. Das ist die Grundlage für einen späteren
Upload im Admin Screen (eigener feat-Task).

## Invarianten (refactor, style, chore, setup)

- Sichtbares Verhalten aller Screens bleibt unverändert: dieselben Bilder auf Wall/Ground, dieselben Kacheln in den
  Kartenübersichten, dieselbe Playlist und dieselben Musiktitel im Admin Screen, Videos auf dem Ground Screen weiterhin
  möglich (Medientyp per Dateiendung).
- Endpoints `/scenes`, `/scenes/{id}`, `/maps/main`, `/maps/side` bleiben bestehen; Response-Form bleibt gleich bis auf
  den Inhalt von `source` (siehe E5) und die Felder in E4.
- Szenen-IDs und Zuordnung Szene → Bilder/Tracks bleiben gleich; bestehende Dev-/Prod-Datenbanken werden per
  Migration überführt, kein DB-Reset nötig.
- Synchronisation über `localStorage` (`activeSceneId`) unverändert.
- Soundeffekte (`assets/sounds`), Icons (`assets/icons`) und Markdown-Notizen (`story/`) bleiben im Frontend.
- Start per `dnd dev` / `dnd prod` (bzw. Compose-Befehle aus dem Root) funktioniert wie bisher.

## Scope / Non-Goals

**Im Scope**
- Ordner `media/` im Repo-Root (in Git) mit den Szenenbildern und der Musik aus `frontend/public/assets/{images,music}`.
- Tabelle `media`, Szene verweist direkt darauf; Alembic-Migration `0002` inkl. Datenübernahme.
- Auslieferung der Dateien durch das Backend unter `/media/...` (Range-Requests für Audio).
- Konfiguration des Medienordners per pydantic-settings; Bind-Mount in Dev- und Prod-Compose.
- Seeder und `seed_data.json` auf das neue Modell umstellen; Warnung bei fehlenden Dateien.
- Frontend löst `source` gegen die API-Basis-URL auf; generierte Typen aktualisieren.
- Tests (Backend, Frontend-Unit, BDD-Steps) und Doku nachziehen.

**Nicht im Scope**
- Upload, Löschen oder Umbenennen von Medien, schreibende Endpoints, Medienverwaltung im Admin Screen (Folgetask).
- Soundeffekte, Icons, `story/`-Notizen.
- Fest eingebundene Medien im Frontend: Weltkarte in `WallScreen.tsx` (`mapOverview.jpg`) und Standardmusik in
  `AdminScreen.tsx` (`From_Past_To_Present.mp3`) – siehe E7.
- Git-History bereinigen oder Git LFS.
- Inhaltliche Korrekturen am Seed (Namen, Beschreibungen, Level-Up-Ground-Bild) – bekannte Altlast, bleibt.
- Caching-/Performance-Optimierung (nginx, CDN, S3/MinIO).

## Entscheidungen

### E1: Kein Upload in diesem Task
- **Entscheidung:** Nur Verlagerung ohne sichtbare Änderung (Typ `refactor`). Upload/Verwaltung folgt als eigener `feat`-Task.
- **Verworfene Alternativen:** Upload gleich mitbauen (Typ `feat`).
- **Begründung:** Hält den Task überschaubar; schreibende Endpoints, CORS für POST und Admin-UI sind ein eigenes Thema.

### E2: Dateien im Ordner `media/` im Repo-Root, weiterhin in Git
- **Entscheidung:** `frontend/public/assets/images` → `media/images`, `frontend/public/assets/music` → `media/music`
  (per `git mv`, Unterordnerstruktur bleibt). Der Ordner wird per Bind-Mount read-only in den API-Container eingebunden
  (`./media:/app/media:ro`, Dev und Prod).
- **Verworfene Alternativen:** `media/` per `.gitignore` ausschließen; reines Named Volume.
- **Begründung:** Ein Clone bleibt vollständig (CI/E2E haben echte Bilder), Dateien sind im Dateisystem pflegbar,
  Austausch ohne Frontend-Build. Read-only, weil es noch keinen Upload gibt.

### E3: Auslieferung durch das Backend
- **Entscheidung:** FastAPI mountet den Medienordner unter `/media` (`StaticFiles`); Range-Requests müssen für Audio
  funktionieren. Keine nginx-Änderung.
- **Verworfene Alternativen:** nginx im UI-Container liefert das Volume aus.
- **Begründung:** Dev und Prod gleich, ein Ort für Medien; Performance reicht für einen Rechner am Spieltisch.

### E4: Eine Tabelle `media`
- **Entscheidung:** `wall_image`, `ground_image` und `track` werden durch eine Tabelle `media` ersetzt:
  `id`, `kind` (`image` | `audio`), `name`, `storage_key` (Pfad relativ zum Medienordner, unique, z. B.
  `images/wall_screen/forest.jpg`), `content_type`, `size` (Bytes, nullable). `scene.wall_image_id`,
  `scene.ground_image_id` (unique bleibt) und `scene_track.track_id` (umbenannt zu `media_id`) verweisen auf `media.id`.
  Gleiche Datei = ein Datensatz (z. B. Level-Up-Bild für Wall und Ground).
  API-Schemas `Image` und `Track` bleiben als Response-Typen erhalten (`id`, `name`, `source`).
- **Verworfene Alternativen:** Drei Tabellen behalten und nur `source` ersetzen.
- **Begründung:** Eine Stelle für Medien-Metadaten, gute Basis für Upload; `kind` beschreibt die Dateiart, nicht die
  Verwendung, damit eine Datei mehrfach genutzt werden kann.

### E5: `source` enthält den API-relativen Pfad, das Frontend löst ihn auf
- **Entscheidung:** Das Backend liefert `source` als `/media/<storage_key>` (aus `storage_key` berechnet, nicht
  gespeichert). Das Frontend macht daraus über einen Helfer `mediaUrl(source)` eine absolute URL auf Basis von
  `VITE_API_URL` (dieselbe Basis wie `apiClient`).
- **Verworfene Alternativen:** Backend liefert absolute URLs (bräuchte zusätzliche Konfiguration der öffentlichen
  API-URL, die heute nur das Frontend kennt); Feld in `url` umbenennen.
- **Begründung:** Keine neue Konfiguration, Feldname und Typen bleiben stabil, `getMusicTitle` und die
  Medientyp-Erkennung über die Dateiendung funktionieren unverändert.

### E6: Migration statt Reset
- **Entscheidung:** Alembic-Revision `0002` legt `media` an, übernimmt die Daten aus den drei Tabellen
  (`source` `/assets/<rest>` → `storage_key` `<rest>`, Duplikate über `storage_key` zusammengeführt, `kind` aus der
  Herkunftstabelle, `content_type` per Endung, `size` = NULL), biegt die Fremdschlüssel um und löscht die alten Tabellen.
  `downgrade` stellt die drei Tabellen wieder her.
- **Begründung:** Bestehende Dev-/Prod-DBs laufen ohne Reset weiter.

### E7: Fest eingebundene Medien bleiben vorerst im Frontend
- **Entscheidung:** `mapOverview.jpg` (Weltkarte im Wall Screen) und `From_Past_To_Present.mp3` (Standardmusik im
  Admin Screen) bleiben als Kopie in `frontend/public/assets/...` an ihrem bisherigen Pfad, die Imports ändern sich nicht.
  Die Doppelung wird in `docs/known-issues.md` vermerkt.
- **Begründung:** Diese Medien hängen an keiner Szene; das Ablösen gehört zur Weltkarten-/Upload-Thematik.

### E8: Seeder und fehlende Dateien
- **Entscheidung:** `seed_data.json` bekommt eine Liste `media` (`kind`, `name`, `storage_key`); Szenen verweisen per
  `wall_image_id`, `ground_image_id`, `track_ids` auf Media-IDs. Der Seeder ermittelt `content_type` und `size` aus der
  Datei; fehlt sie, schreibt er eine Warnung ins Log und legt den Datensatz trotzdem an (`size` = NULL). Fehlende
  Dateien verhindern den Start nicht.
- **Begründung:** Fehler werden sichtbar, ohne den Spielabend zu blockieren.

## Subtasks

### Vertrag
- [ ] `Image`/`Track`/`MapEntry`: Feld `source` = `/media/<storage_key>`; sonst unverändert.
- [ ] Neuer statischer Pfad `GET /media/{storage_key}` (keine OpenAPI-Route nötig).

### Backend
- [ ] `git mv frontend/public/assets/images media/images` und `… /music media/music`; Kopien gemäß E7 in
      `frontend/public/assets/...` belassen.
- [ ] `Settings.media_dir` (Default `/app/media`, in `.env.example` dokumentiert).
- [ ] Modell `Media` in `app/models/media.py` statt `WallImage`/`GroundImage`/`Track`; `Scene` und `scene_track`
      anpassen; `source` als berechnetes Attribut bzw. im Schema aus `storage_key` bilden.
- [ ] Alembic-Revision `0002` gemäß E6 (upgrade und downgrade).
- [ ] `seed_data.json` und `app/db/seed.py` gemäß E8.
- [ ] `app/main.py`: `StaticFiles` unter `/media` mounten; CORS (nur `GET`) bleibt.
- [ ] `services/map.py` auf `Media` umstellen.
- [ ] Compose: Bind-Mount `./media:/app/media:ro` für `api` in `compose.dev.yaml` und `compose.prod.yaml`.
- [ ] `scripts/export_openapi.py` ausführen.
- [ ] Tests: Migration `0001`→`0002` mit Daten (Werte bleiben zugeordnet), Seeder inkl. fehlender Datei,
      `source`-Format in `/scenes` und `/maps/*`, Auslieferung `/media/...` inkl. `Range`-Header (206) und 404,
      Pfad-Traversal (`/media/../...`) wird abgewiesen. Testmedien in einem temporären Ordner.

### Frontend
- [ ] `src/api/schema.d.ts` neu generieren (`npm run generate:api`).
- [ ] Helfer `mediaUrl(source)` neben `apiClient` (gleiche Basis-URL); in `WallScreen`, `GroundScreen`,
      `MapOverview`, `SideMaps`, `Dialogue` und der Playlist im `AdminScreen` verwenden.
- [ ] Unit-Test für `mediaUrl` (mit und ohne abschließenden Slash in der Basis-URL).
- [ ] `__tests__/unit/SceneDetailMock.json`, `musicTitle.spec.ts` (Pfadbeispiele) und BDD-Steps
      `selectMainScene.ts`/`selectSideScene.ts` auf die neuen URLs anpassen.

### Doku
- [ ] `docs/architecture.md`: Assets-Abschnitt, Datenmodell, Ordnerstruktur, Compose/Mounts, „Backend speichert keine Dateien“ korrigieren.
- [ ] `docs/domain.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md` wo Asset-Pfade/Tabellen erwähnt sind.
- [ ] `docs/known-issues.md`: Doppelung aus E7 ergänzen, Eintrag „Szenen nur über seed_data.json pflegbar“ bleibt.

## Akzeptanzkriterien (refactor, style, chore)
- [ ] AK1: Szenenbilder und Musik liegen unter `media/` und nicht mehr in `frontend/public/assets/{images,music}`
      (Ausnahme E7); die DB hat eine Tabelle `media`, die Tabellen `wall_image`, `ground_image`, `track` gibt es nicht mehr.
- [ ] AK2: Das Backend liefert alle in der DB referenzierten Dateien unter `/media/...` aus (200, Audio mit Range → 206);
      ein neues Bild in `media/` ist ohne Frontend-Build per Seed/DB-Eintrag nutzbar.
- [ ] AK3: Eine bestehende DB mit Stand `0001` wird beim Start auf `0002` migriert; Szenen zeigen danach dieselben
      Medien wie vorher.
- [ ] AK4: Alle Invarianten eingehalten – sichtbares Verhalten in Admin, Wall, Ground und Player unverändert (Dev und Prod).
- [ ] AK5: Lint (ruff, eslint), Typecheck (mypy strict, tsc), Tests (pytest, Jest, BDD) und Build sind grün.
- [ ] AK6: Bestehende Tests nur in Pfaden/Mocks angepasst, nicht in ihrer Aussage; neue Tests gemäß Subtasks vorhanden.

## Teststrategie / Verifikation

**Automatisch**
- Backend: pytest (Migration mit Daten, Seeder, Schemas/Endpoints, StaticFiles inkl. Range und Traversal), ruff, mypy.
- Frontend (Unit / BDD): Jest inkl. `mediaUrl`, angepasste Mocks; BDD-Szenarien Haupt-/Nebenszene auswählen.

**Manuell**
1. Dev-DB auf Stand vor dem Task starten (`dnd dev`), dann Task-Stand starten → Migration läuft, keine Fehler im Log.
2. Admin: Nicht-Kampfszene und Kampfszene wählen → Wall- und Ground-Bild wie vorher, Kartenübersicht vollständig.
3. Musik: Playlist einer Szene läuft, Titelanzeige wie vorher, Vorspulen/Seek funktioniert.
4. Netzwerk-Tab: Bilder/Musik kommen von `:8000/media/...`, keine 404.
5. `dnd prod`: Schritte 2–4 auf `:8080` wiederholen.
6. Eine Datei in `media/` testweise umbenennen → Seeder-Warnung bei leerer DB, Start läuft trotzdem.

## Offene Fragen
- keine

## Review
