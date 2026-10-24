# Architektur

```
 Spieltisch-Screens (beliebige Browser/Geräte im LAN)                 Smartphones
 ┌──────────┐  ┌──────────┐  ┌──────────┐                            ┌──────────┐
 │ /admin   │  │ /wall    │  │ /ground  │                            │ /        │ × n
 └────┬─────┘  └────┬─────┘  └────┬─────┘                            └────┬─────┘
      │ HTTP GET/PATCH/POST (axios, /api/...)                             │ nur WebSocket (Theme)
      │ WebSocket /ws?screen=… (Snapshots, Audio, Ping, an Admins Screen-Zahlen; Wall → Server: Audio-Meldungen)
      └─────────────┴─────────────┴──────────────────────────────────────┘
                    │ gleicher Origin: Vite-Proxy (Dev :5173) bzw. nginx (Prod :8080)
                    │ /api/… → API (Präfix entfernt), /ws → API
            ┌───────▼────────┐         ┌──────────────┐
            │ FastAPI        │────────▶│ PostgreSQL   │
            │ backend :8000  │         │ :5432        │
            └────────────────┘         └──────────────┘
 Szenenmedien (Wall-/Ground-Bilder, Musik) liefert das Backend unter /media aus (Ordner media/ im Repo-Root),
 das Frontend lädt sie über den Proxy (/api/media/...).
 Übrige statische Assets (Soundeffekte, Icons, Markdown) liefert das Frontend aus public/ aus:
 Dev: Vite-Server (:5173), Production: nginx (:8080) mit dem gebauten public/.
```

## Synchronisation

- **Der Server ist die einzige Quelle** des Spieltisch-Zustands: aktives Abenteuer, dessen aktive Szene und Theme
  (Tabelle `game_table`, die aktive Szene steht in `adventure.active_scene_id`). Ein Server ist ein Spieltisch (eine
  globale Session, kein Beitreten).
- Admin, Wall, Ground und Player verbinden sich beim Laden per WebSocket mit `/ws?screen=admin|wall|ground|player`
  (`GameTableProvider`/`useGameTable`, `src/realtime/`). Der Server schickt direkt nach dem Verbinden und nach **jeder**
  erfolgreichen Änderung per `PATCH /table` oder `PATCH /adventures/{id}` einen vollständigen Snapshot an alle
  Verbindungen (auch an andere Admins; der letzte Schreibzugriff gewinnt, keine Sperren). Der Provider speist daraus
  `ActiveAdventureContext`, `ActiveSceneContext` (nur lesend) und das Theme. Die Screens laden daraufhin neu vom
  Backend: Wall und Ground die Szene, der Admin bei einem Abenteuerwechsel dessen Szenen. Ohne aktive Szene zeigen Wall und Ground
  nur die Hintergrundfarbe und stellen keinen Request. Bis zum ersten Snapshot gilt „kein Abenteuer, keine Szene,
  Theme `dark`“.
- Schreiben nur per REST, **ohne lokale Vorwegnahme**: Der Admin wechselt das Abenteuer per `PATCH /table
  {"active_adventure_id": <id>}`, die Szene per `PATCH /adventures/{id} {"active_scene_id": <id>}` und das Theme per
  `PATCH /table {"theme": …}`. Admin, Wall und Ground wechseln erst mit dem Push; ein Abenteuerwechsel liefert direkt
  die gespeicherte Szene des neuen Abenteuers, nie die eines anderen. Ist im Snapshot kein Abenteuer gesetzt, aktiviert
  der Admin das erste der Liste (`selectDefaultAdventureId`) per `PATCH /table`. Schlägt ein Schreibzugriff fehl,
  zeigt der Admin „Änderung konnte nicht gespeichert werden“; „Erneut versuchen“ wiederholt den zuletzt
  fehlgeschlagenen Schreibzugriff (nur das Ergebnis des jüngsten zählt, keine automatischen Wiederholungen).
- **Heartbeat:** Der Server sendet jeder Verbindung alle 15 s `{"type": "ping"}` (`PING_INTERVAL_SECONDS`,
  `app/realtime/manager.py`); zusätzlich bleiben die Protokoll-Pings von uvicorn aktiv. Empfängt ein Client 35 s lang
  keine Nachricht, schließt er die Verbindung und verbindet sich neu.
- **Reconnect:** Nach jedem Abbruch verbinden sich die Screens selbst neu, mit Backoff 1 s, 2 s, 4 s … höchstens 10 s
  (nach erfolgreichem Verbinden zurückgesetzt). Währenddessen behalten alle Screens den letzten Stand. Nur der Admin
  zeigt die Leiste „Verbindung zum Server getrennt“, deren „Erneut versuchen“ sofort neu verbindet. Wird der Tab
  wieder sichtbar (`visibilitychange`, z. B. entsperrtes Smartphone) und ist die Verbindung nicht offen, verbindet
  jeder Screen sofort neu, statt auf Heartbeat oder Backoff zu warten (`src/realtime/connection.ts`, Sichtbarkeit über
  `VisibilitySource` aus `src/realtime/visibility.ts`, für Tests ersetzbar).
- **Ein Worker:** Der Verbindungsmanager hält die offenen Verbindungen im Speicher des API-Prozesses; uvicorn läuft
  deshalb mit genau einem Worker (Default, so in beiden Compose-Stacks).
- **Audio** (Musik, Soundeffekte) folgt demselben Muster, siehe [Audio](#audio): Der Server hält den Musikzustand,
  eine Wall spielt ihn ab, der Admin steuert per REST.
- Der **Player Screen** (Smartphones) nutzt vom Spieltisch nur das Theme; `state`, `audio` und `sound` empfängt er,
  zeigt sie aber nicht an, und er sendet nichts. Er zeigt keinen Verbindungsstatus. Im Settings-Menü kann ein Spieler
  auf seinem Gerät vom Spieltisch-Theme abweichen („Wie Spieltisch“, „Dunkel“, „Taverne“): gespeichert in
  `localStorage` `playerThemeOverride` (`dark` | `tavern`, fehlend oder ungültig = „Wie Spieltisch“,
  `src/utils/playerTheme.ts`); wirksam ist `Abweichung ?? Spieltisch-Theme` (Prop `themeOverride` des
  `GameTableProvider`, die Contexts behalten das Spieltisch-Theme). Ein Theme-Wechsel im Admin ändert eine gesetzte
  Abweichung nicht. Den alten Schlüssel `isDarkTheme` entfernt das Frontend beim Start, ohne ihn zu übernehmen.

### WebSocket `/ws`

`GET /ws?screen=<admin|wall|ground|player>` (WebSocket, nicht in OpenAPI). JSON im Format `{type, payload}`.

Server → Client:

| Nachricht | An | Wann |
|---|---|---|
| `{"type": "state", "payload": GameTableState}` | alle | direkt nach dem Verbinden und nach jeder erfolgreichen Änderung per `PATCH /table` oder `PATCH /adventures/{id}` (auch für nicht aktive Abenteuer) |
| `{"type": "audio", "payload": AudioState}` | alle | direkt nach dem Verbinden (nach `state`), nach jeder Änderung des Musikzustands (Audio-Endpoints, Wechsel der aktiven Szene nach dem `state`-Push, Ausgabe bereit bzw. getrennt, Trackende) |
| `{"type": "audio_output", "payload": {"active": bool}}` | betroffene Wall | `true` an die Wall, die per `audio_ready` Ausgabe wird; `false` an die bisherige Ausgabe, die die Rolle verliert |
| `{"type": "sound", "payload": {"name": SoundName}}` | nur die Ausgabe | nach `POST /table/sounds`; ohne Ausgabe verfällt der Sound |
| `{"type": "screens", "payload": {"wall": int, "ground": int, "player": int, "fullscreen": {"wall": int, "ground": int}}}` | nur Admins | direkt nach dem Verbinden eines Admins (nach `state` und `audio`) und an alle Admins, sobald sich eine Zahl ändert (Verbinden, Trennen, Entfernen nach fehlgeschlagenem Senden, `fullscreen_state`); Admins werden nicht gezählt; `fullscreen`: wie viele Walls bzw. Grounds im Vollbild sind |
| `{"type": "fullscreen", "payload": {"active": bool}}` | alle Walls bzw. alle Grounds | nach `fullscreen` eines Admins für diesen Screen-Typ: Vollbild an bzw. aus |
| `{"type": "fullscreen_rejected", "payload": {"screen": "wall" \| "ground"}}` | nur Admins | eine Wall bzw. ein Ground meldet, dass der Browser das Vollbild abgelehnt hat |
| `{"type": "ping"}` | alle | alle 15 s (Heartbeat) |

Client → Server (nur von den genannten Screens ausgewertet; andere Screens, ungültiges JSON bzw. ungültige Payloads und
unbekannte Typen ignoriert der Server, die Verbindung bleibt bestehen):

| Nachricht | Von | Wirkung |
|---|---|---|
| `{"type": "audio_ready"}` | Wall | diese Verbindung wird die Audioausgabe, eine bisherige verliert die Rolle |
| `{"type": "track_ended", "payload": {"track_id": int}}` | Wall | nur von der Ausgabe und nur für den aktuellen Track (sonst veraltet bzw. doppelt, ignoriert): der Server wählt den nächsten Track |
| `{"type": "fullscreen", "payload": {"screen": "wall" \| "ground", "active": bool}}` | Admin | der Server reicht `fullscreen` an alle Verbindungen dieses Typs weiter |
| `{"type": "fullscreen_state", "payload": {"active": bool}}` | Wall, Ground | Vollbild-Zustand dieser Verbindung (nach jeder Änderung und nach dem Verbinden); ändert er die Zahlen, erhalten die Admins `screens` |
| `{"type": "fullscreen_rejected"}` | Wall, Ground | der Server schickt `fullscreen_rejected` mit dem Screen-Typ an alle Admins |

Ein fehlender oder
unbekannter `screen` wird mit Close-Code 1008 abgewiesen. **Origin-Prüfung** (CORS greift bei WebSockets nicht): Der
Server nimmt die Verbindung nur an, wenn der `Origin`-Header fehlt (kein Browser), in `CORS_ORIGINS` steht oder Host
und Port des `Origin` dem `Host`-Header entsprechen (gleicher Origin über den Proxy); sonst lehnt er den Handshake ab
(HTTP 403). Der Push läuft als async `BackgroundTask` der Schreib-Route nach dem Commit mit eigener DB-Session; das
Lesen und Senden der Snapshots ist serialisiert, damit jeder Client sie in Lesereihenfolge erhält. Schlägt das Senden
fehl (oder dauert länger als 5 s), entfernt der Manager die Verbindung, der Client verbindet sich neu. Unbekannte
Nachrichtentypen ignoriert der Client (`parseServerMessage`, `src/realtime/messages.ts`). Die Verbindungszahlen für
`screens` zählt der `ConnectionManager` aus seinen offenen Verbindungen (nur im Speicher, nicht in `GameTableState`);
er merkt sich die zuletzt gepushten Zahlen und sendet nur bei einer Änderung, serialisiert über ein eigenes Lock. Im
Frontend stellt der `GameTableProvider` sie als `screens` im `GameTableContext` bereit (bis zur ersten Nachricht
`null`). **Vollbild per Fernsteuerung:** Browser erlauben `requestFullscreen` nur mit einer Nutzeraktion im selben
Fenster; ein Befehl über den WebSocket hat keine, der Browser lehnt ihn meist ab (in Chrome geprüft: „Permissions
check failed“). Wall und Ground (`src/realtime/remoteFullscreen.ts`, eingebunden in `useGameTable`, ohne Änderung an
den Screens selbst) melden dann `fullscreen_rejected` und holen das Vollbild mit dem nächsten Klick in ihr Fenster
nach (`pointerdown`); `fullscreen` mit `active: false` verwirft einen wartenden Wechsel, `exitFullscreen` braucht
keine Nutzeraktion. Für ein Fenster, das der Admin selbst geöffnet hat (`window.open` im Panel „Screens“), gibt er die
Nutzeraktion seines Klicks per `postMessage` mit `delegate: "fullscreen"` (Capability Delegation, Chrome) weiter;
dieses Fenster wechselt sofort, eine doppelte Anfrage über den Server ignoriert es. Den Hinweis im Admin
(`fullscreenHints` im `GameTableContext`) setzt `fullscreen_rejected`; er fällt weg, sobald `screens` einen Screen des
Typs im Vollbild oder keinen mehr zeigt oder der Admin erneut schaltet. Das Vollbild des Admin-Fensters selbst
schaltet die Top-Bar direkt (Fullscreen API, Zustand über `fullscreenchange`). Der Client sendet nur über
eine offene Verbindung, sonst verwirft er die Nachricht.

### Audio

- **Der Server entscheidet über die Musik.** `AudioService` (`app/realtime/audio.py`, Instanz `audio`) hält den
  Musikzustand im Speicher des API-Prozesses (bewusst flüchtig, nach einem API-Neustart ist die Musik pausiert):
  Playlist, aktueller Track (`Track` oder `null` bei leerer Playlist), `playing` (Start `false`), `volume` (Prozent
  0–100, Start 10) und die Audioausgabe (eine Wall-Verbindung oder keine, `output_ready`). Beim App-Start (`lifespan`)
  initialisiert `reset_audio` (`app/realtime/push.py`) ihn für den gespeicherten Spieltisch.
- **Playlist:** die Tracks der aktiven Szene (nach ID, `get_playlist` in `app/services/audio.py`); ohne aktive Szene
  die **Standardmusik**, das Medium mit dem Storage-Key `Settings.default_music_key` (Default
  `music/side/forest/From_Past_To_Present.mp3`; fehlt es, ist die Playlist leer). Bei jedem `state`-Push prüft der
  Server, ob sich die aktive Szene geändert hat; dann lädt er die neue Playlist, wählt zufällig einen Track und pusht
  zusätzlich `audio`. `playing` bleibt dabei unverändert (läuft die Musik, startet sofort ein Track der neuen Szene).
- **Nächster Track:** zufällig aus der Playlist und, wenn möglich, nicht der aktuelle (Zufallsquelle `audio.random`,
  für Tests ersetzbar) – bei `track_ended` der Ausgabe.
- **Ausgabe:** Genau eine Wall spielt (kein Echo im Raum): die zuletzt per `audio_ready` gemeldete. Trennt sich die
  Ausgabe, ist `output_ready` `false` und alle bekommen den neuen `AudioState`. Befehle funktionieren auch ohne
  Ausgabe und ändern den Zustand; eine Wall, die Ausgabe wird, setzt mit dem aktuellen Zustand ein (läuft die Musik,
  startet sie den aktuellen Track von vorn). Synchrone Wiedergabepositionen gibt es nicht.
- **Wall:** Der Button „AUDIO“ in der Steuerleiste sendet `audio_ready` (die Nutzerinteraktion gibt die Wiedergabe im
  Browser frei) und ist hervorgehoben, solange die Wall Ausgabe ist. `WallAudioPlayer` (`src/audio/wallAudioPlayer.ts`)
  setzt den `AudioState` um: Track-Wechsel → `mediaUrl(track.source)` von vorn, `playing` → `play()`/`pause()`,
  `volume / 100` → Lautstärke, Trackende → `track_ended`; verliert die Wall die Rolle oder die Verbindung, pausiert sie
  sofort. Soundeffekte spielt sie bei voller Lautstärke parallel (Dateien aus `public/assets/sounds`, Liste in
  `src/audio/sounds.ts`). Scheitert `play()` (Autoplay), loggt sie per `console.error`. Nach einem Reconnect meldet
  sich eine Wall, die vorher Ausgabe war, von selbst wieder mit `audio_ready`, bis eine andere Wall übernimmt.
- **Admin als Fernbedienung** (Panels „Musik“ und „Sounds“ im Dashboard): zeigt `playing`, den Tracktitel (`getMusicTitle(track.source)`) und ohne Ausgabe den
  Hinweis „Keine Audioausgabe bereit“; Play/Pause (`PATCH /table/audio {playing}`), Lautstärke-Slider
  (`PATCH /table/audio {volume}` beim Loslassen) – ohne lokale Vorwegnahme, Fehler in der Speicherfehler-Leiste mit
  „Erneut versuchen“. Die Sound-Buttons senden `POST /table/sounds`; Fehler werden nur geloggt (kein
  Retry). Im Admin wird nichts abgespielt.

## Backend (`backend`)

- Python 3.11, FastAPI 0.143, SQLAlchemy 2.1 (typisierter 2.0-Stil: `DeclarativeBase`, `Mapped[...]`, `select()`), psycopg2, Alembic, PostgreSQL 17;
  Abhängigkeiten per uv (`pyproject.toml`, `uv.lock`).
- Schichten (Paket `app`): `app/api/routes/*` (je Modul ein `router`, Prefix/Tags zentral in `app/main.py`) →
  `app/services/*` (Modul-Funktionen) → `app/crud/*` → `app/models/*`. Konfiguration in `app/core/config.py`
  (pydantic-settings), Engine/Session in `app/db/session.py`. Antwortformen als Pydantic-Schemas in `app/schemas/*`
  (`response_model` bzw. Rückgabe-Annotation der Routen).
- Beim App-Start (`lifespan`) bringt `app/db/migrate.py` das Schema per Alembic auf den neuesten Stand
  (`alembic upgrade head`, Migrationen in `backend/migrations/versions/`; kein `create_all`). Danach läuft der Seeder
  (`app/db/seed.py`, Daten in `app/db/data/seed_data.json`) – je Tabelle nur, wenn sie leer ist. Enthält die DB
  Tabellen, aber keine `alembic_version` (Schema von vor den Migrationen), bricht der Start mit Reset-Hinweis ab
  (einmalig `docker compose -f compose.dev.yaml down -v` bzw. `… compose.prod.yaml down -v`). Ablauf für
  Schemaänderungen: `backend/CLAUDE.md`, Abschnitt „Migrationen“. `import app.main` allein baut keine DB-Verbindung auf.

### Endpoints (GET, Abenteuer und Spieltisch zusätzlich PATCH, Audio-Befehle POST; keine Auth)

| Pfad | Liefert |
|---|---|
| `/adventures` | `list[AdventureSummary]`: alle Abenteuer nach ID (200, ggf. `[]`) |
| `/adventures/{adventure_id}` | `AdventureDetail` inkl. Spieler (200) bzw. 404 `{"detail": "Adventure not found"}` |
| `PATCH /adventures/{adventure_id}` | Body `AdventureUpdate`, Antwort `AdventureDetail` (200); 404 wie oben; 422 `{"detail": "Scene does not belong to adventure"}`, wenn `active_scene_id` nicht existiert oder zu einem anderen Abenteuer gehört (nichts wird geändert), 422 im FastAPI-Standardformat bei `global_level` außerhalb 1–20 |
| `/adventures/{adventure_id}/scenes` | `list[SceneDetail]`: Szenen des Abenteuers nach ID (200, ggf. `[]`); 404 wie oben |
| `/scenes/{scene_id}` | `SceneDetail` (200) bzw. 404 `{"detail": "Scene not found"}` |
| `/table` | `GameTableState`: Zustand des Spieltischs (200) |
| `PATCH /table` | Body `GameTableUpdate`, Antwort `GameTableState` (200); 422 `{"detail": "Adventure not found"}` bei unbekanntem Abenteuer (nichts wird geändert), 422 im FastAPI-Standardformat bei ungültigem `theme` |
| `/table/audio` | `AudioState`: Musikzustand (200), siehe [Audio](#audio) |
| `PATCH /table/audio` | Body `AudioUpdate`, Antwort `AudioState` (200); 422 im FastAPI-Standardformat bei `volume` außerhalb 0–100 bzw. `null`; `playing: true` bei leerer Playlist ändert `playing` nicht |
| `POST /table/sounds` | Body `SoundRequest`, 204 (auch ohne Audioausgabe); 422 bei unbekanntem Namen |
| `/table/join` | `JoinInfo { player_url: str \| null }`: URL des Player Screens im LAN aus `Settings.player_url` (Umgebungsvariable `PLAYER_URL`, leer = `null`), Basis des QR-Codes im Admin (200) |
| `/ws` | WebSocket des Spieltischs (nicht in OpenAPI), siehe [WebSocket `/ws`](#websocket-ws) |
| `/media/{storage_key}` | Mediendatei aus dem Medienordner (`StaticFiles`, nicht in OpenAPI): 200 bzw. 206 bei `Range`-Header (Audio-Seek), 404 bei fehlender Datei oder Pfad außerhalb des Ordners |

Globale Listen (`GET /scenes`, `GET /maps/main|side`) gibt es seit DND-24 nicht mehr: Szenen gibt es nur je
Abenteuer. Die Kartenübersichten je Abenteuer (`GET /adventures/{id}/maps/main|side`, Schema `MapEntry`) sind seit
DND-29 entfernt (404), weil es keine Kampf-/Nicht-Kampfszenen mehr gibt. `/scenes/{scene_id}` bleibt der Einstieg für Wall, Ground und die Karte „Aktive Szene“ im Admin, weil die
Szenen-ID global eindeutig ist.

Kanonische Pfade sind ohne Slash am Ende (mit Slash antwortet FastAPI mit 307-Redirect). Fehler im Default-Format
`{"detail": "..."}`.

### Antwortformat

```
SceneDetail { id: int, name: str, description: str,
              wall_image: Image, ground_image: Image, tracks: list[Track] }   tracks nach ID sortiert
Image       { id: int, name: str, source: str }
Track       { id: int, name: str, source: str }

AdventureSummary { id: int, name: str, description: str | null }
AdventureDetail  { id: int, name: str, description: str | null, global_level: int,
                   active_scene_id: int | null, players: list[Player] }       players nach ID sortiert
Player           { id: int, player_name: str, character_name: str, race: str,
                   character_class: str, avatar: Image | null }
AdventureUpdate  { active_scene_id?: int | null, global_level?: int (1–20) }  Request-Body von PATCH

GameTableState   { active_adventure_id: int | null, active_scene_id: int | null, theme: "dark" | "tavern" }
                   active_scene_id = active_scene_id des aktiven Abenteuers (null ohne Abenteuer)
GameTableUpdate  { active_adventure_id?: int | null, theme?: "dark" | "tavern" }  Request-Body von PATCH /table

AudioState       { playing: bool, track: Track | null, volume: int, output_ready: bool }   volume in Prozent
AudioUpdate      { playing?: bool, volume?: int (0–100) }                       Request-Body von PATCH /table/audio
SoundRequest     { name: SoundName }                                            Request-Body von POST /table/sounds
SoundName        "heal" | "bottle" | "buff" | "music_1" | "music_2" | "spell_1" | "spell_2"
                 | "debuff_1" | "debuff_2" | "lock"
```

Alle Felder sind Pflicht; nullable sind nur `description` und `active_scene_id` des Abenteuers sowie `avatar` des
Spielers. Die Fremdschlüssel (`wall_image_id`, `adventure_id` …) sind nicht Teil der Antwort, `SceneDetail` enthält
kein `adventure_id`. Bei `AdventureUpdate` ändert `PATCH` nur die gesetzten Felder; `"active_scene_id": null` leert
die aktive Szene, `"global_level": null` wird abgelehnt (422). Ebenso ändert `PATCH /table` nur die gesetzten Felder;
`"active_adventure_id": null` leert das aktive Abenteuer, `"theme": null` wird abgelehnt (422). `PATCH /table/audio`
ändert ebenfalls nur die gesetzten Felder; `null` wird abgelehnt (422).
`source` ist der API-relative Pfad der Datei, `/media/<storage_key>` (aus `media.storage_key` berechnet, nicht
gespeichert), z. B. `/media/images/ground_screen/main_1.jpg`. Das Frontend macht daraus per `mediaUrl(source)`
(`src/api/mediaUrl.ts`) eine URL auf Basis von `VITE_API_URL` – dieselbe Basis wie der axios-Client (Default `/api/`,
also z. B. `/api/media/images/ground_screen/main_1.jpg` über den Proxy).

### API-Vertrag & Typgenerierung

`backend/openapi.json` (versioniert) ist die Single Source of Truth für den Vertrag: Das Skript
`backend/scripts/export_openapi.py` schreibt `app.openapi()` deterministisch dorthin (ohne DB-Verbindung, die
`Settings`-Werte aus `.env` bzw. Umgebung reichen). Das Frontend erzeugt daraus per `openapi-typescript`
`frontend/src/api/schema.d.ts` (versioniert, von ESLint ausgenommen); `src/models/models.ts` leitet `SceneDetail`,
`Image`, `Track`, `GameTableState`, `Theme`, `AudioState`, `AudioUpdate` und
`SoundName` davon ab. Das Nachrichtenformat des
WebSockets `/ws` ist nicht Teil der OpenAPI, es steht oben unter [WebSocket `/ws`](#websocket-ws).

Ablauf bei einer Vertragsänderung:
1. Backend ändern (Schema in `app/schemas/`, Route, Tests).
2. `uv run python scripts/export_openapi.py` (in `backend/`).
3. `npm run generate:api` (in `frontend/`).
4. Frontend an die geänderten Typen anpassen (`npm run typecheck` zeigt die Stellen).

CI prüft beide Dateien auf Aktualität (Export bzw. Generierung + `git diff --exit-code`).

### Datenmodell

```
Adventure → adventure (id, name, description (Text, nullable), global_level (1–20, Default 1),
                       active_scene_id → scene (nullable, ON DELETE SET NULL))
              Adventure.scenes: 1:N, Adventure.players: 1:N (beide nach ID), Adventure.active_scene: N:1
Player    → player    (id, adventure_id → adventure, player_name, character_name, race, character_class,
                       avatar_media_id → media (nullable))
              Player.avatar: N:1
Scene     → scene     (id, adventure_id → adventure, name, description, wall_image_id → media,
                       ground_image_id → media (unique))
              Scene.wall_image: N:1 (z. B. teilen sich alle „Fight“-Szenen ein Wall-Bild), Scene.ground_image: 1:1
              Scene.tracks: N:M über scene_track(scene_id, media_id; PK aus beiden)
Media     → media     (id, kind: 'image' | 'audio', name, storage_key (unique), content_type, size (Bytes, nullable))
GameTable → game_table (id (CHECK id = 1), active_adventure_id → adventure (nullable, ON DELETE SET NULL),
                        theme (Text, Default 'dark', CHECK theme IN ('dark', 'tavern')))
              GameTable.active_adventure: N:1; genau eine Zeile (ein Server = ein Spieltisch)
```

Ein Abenteuer bündelt Szenen und Spieler (je 1:N); `media` ist global. Ein Spieler-Datensatz steht für „diese Person
mit diesem Charakter in diesem Abenteuer“ – in einem anderen Abenteuer bekommt dieselbe Person einen eigenen
Datensatz. `race` und `character_class` sind Freitext (`character_class`, weil `class` in Python ein Schlüsselwort
ist). Die aktive Szene und das globale Level stehen persistent im Abenteuer; dass `active_scene_id` zu einer Szene
desselben Abenteuers gehört, prüft der Service (nicht die DB). Wegen der zirkulären Fremdschlüssel `adventure` ↔ `scene`
legt die Migration den FK `active_scene_id` zuletzt an (im Model `use_alter=True`, Relation mit `post_update=True`).

Nullable sind nur `media.size`, `adventure.description`, `adventure.active_scene_id`, `player.avatar_media_id` und
`game_table.active_adventure_id`. `kind` beschreibt die Dateiart, nicht die Verwendung: Eine Datei ist
genau ein Datensatz und kann mehrfach genutzt werden (z. B. das Level-Up-Bild als Wall- und Ground-Bild).
`storage_key` ist der Pfad relativ zum Medienordner (z. B. `images/wall_screen/forest.jpg`); die API bildet daraus
`source`. Constraint-Namen folgen der Namenskonvention in `app/db/base.py` (z. B. `pk_scene`,
`fk_scene_wall_image_id_media`, `uq_scene_ground_image_id`, `ck_media_kind`, `ck_adventure_global_level`,
`ck_game_table_single_row`, `ck_game_table_theme`).

**Medienordner:** Die Dateien liegen im Ordner `media/` im Repo-Root (in Git; `images/{ground_screen,wall_screen}`,
`music/{main,side}/…`). Die API liest ihn aus `MEDIA_DIR` (`Settings.media_dir`, Default `/app/media`); die
Compose-Dateien binden `./media` read-only dorthin ein. FastAPI liefert ihn per `StaticFiles` unter `/media` aus
(inkl. `Range`-Requests); eine neue Datei in `media/` ist ohne Frontend-Build per Seed-/DB-Eintrag nutzbar. Upload
gibt es noch nicht.

**Migrationen:** `0001` legt das ursprüngliche Schema an (`wall_image`, `ground_image`, `track` mit Pfad-Strings
`source`), `0002` führt diese in `media` zusammen (`/assets/<rest>` → `storage_key` `<rest>`, gleiche Datei = ein
Datensatz, `size` = NULL) und biegt die Fremdschlüssel um. `0003` legt `adventure` und `player` an und ergänzt
`scene.adventure_id`: Enthält `scene` Zeilen, legt sie das Abenteuer aus dem Seed an („Erstes Abenteuer“,
`global_level` 1, keine aktive Szene) und weist ihm alle Szenen zu; auf einer leeren DB legt sie kein Abenteuer an
(das macht der Seeder). Die Spieler ergänzt der Seeder, weil `player` danach leer ist. `downgrade` entfernt Tabellen,
Spalte und Fremdschlüssel, die Szenen bleiben erhalten. `0004` legt `game_table` an und fügt die eine Zeile ein:
aktives Abenteuer = kleinste Abenteuer-ID (auf einer leeren DB NULL, weil der Seeder erst danach läuft; dann ist kein
Abenteuer aktiv und Wall und Ground bleiben leer, bis ein Admin geöffnet wird und das erste Abenteuer aktiviert), Theme
`dark`; `downgrade` entfernt die Tabelle. `0005` entfernt die Spalte `scene.main` (Kampf-/Nicht-Kampfszene); Szenen,
Bilder, Tracks und die aktive Szene bleiben erhalten. `downgrade` legt sie wieder an (`NOT NULL`, alle Szenen
`false`), die frühere Einteilung ist dann verloren. Bestehende Datenbanken laufen jeweils
ohne Reset weiter.

**Seed-Daten:** Listen `adventures` (`name`, `description`, `global_level`), `media` (`kind`, `name`, `storage_key`),
`scenes` (Referenz `adventure_id` sowie `wall_image_id`, `ground_image_id`, `track_ids` auf Media-IDs) und `players`
(`adventure_id`, `player_name`, `character_name`, `race`, `character_class`, `avatar_media_id`). Reihenfolge im
Seeder: `adventure` → `media` → `scene` → `player`, `active_scene_id` bleibt leer. Ein Abenteuer („Erstes Abenteuer“)
mit allen Szenen und vier Platzhalter-Spielern („Spieler 1..4“, ohne Avatar). 29 Szenen in dieser Reihenfolge:
Default (Dorf), Shop, Tavern, Level Up und „Fight 1..25“ (teils mit Tags wie Boss, Loot, Ereignis, Key), 76 Medien (33 Bilder, 43 Musiktracks).
IDs ergeben sich aus der Reihenfolge in der JSON-Datei (Autoincrement). Der Seeder ermittelt `content_type` (per
Dateiendung) und `size` aus der Datei im Medienordner; fehlt sie, schreibt er eine Warnung ins Log und legt den
Datensatz trotzdem an (`size` = NULL).

## Frontend (`frontend`)

- React 18, Vite 5, TypeScript 5 (strict), react-router-dom 6, styled-components 6 (Haupt-Styling, zwei Themes),
  MUI nur für `Box`/`Slider`, axios, react-markdown, react-svg.
- State: React-State + vier Contexts (`ActiveAdventureContext`, `ActiveSceneContext`, `GameTableContext` mit Theme,
  Verbindungsstatus und `reconnectNow`, `GameAudioContext` mit `AudioState`, Ausgabe-Rolle der Wall, `audio_ready`/
  `track_ended` und Soundeffekten; `src/context/context.ts`), gespeist vom `GameTableProvider` aus dem
  WebSocket-Snapshot (siehe [Synchronisation](#synchronisation)). Kein Store-Framework. Der aktive Eintrag im Panel
  „Szenen“ des Admins ergibt sich aus `activeSceneId` (Vergleich mit der Szenen-ID, Attribute `aria-current` und
  `data-active`); ist sie `null`, ist kein Eintrag hervorgehoben. Die Wahl des Default-Abenteuers trifft
  `selectDefaultAdventureId` (`src/utils/adventure.ts`).
- Struktur: `src/app` (Routing, Theme-Abweichung des Player Screens), `src/realtime` (WebSocket-Client:
  `GameTableProvider`, `useGameTable`, Verbindung mit Reconnect `connection.ts`, `messages.ts`, `backoff.ts`,
  `heartbeat.ts`, `visibility.ts`),
  `src/screens` (Screens), `src/components`, `src/service` (Datenladen und Schreibzugriffe je Screen),
  `src/audio` (Soundliste `sounds.ts`, Wiedergabe auf der Wall `wallAudioPlayer.ts`),
  `src/api` (axios-Client, Base-URL aus `VITE_API_URL`, Default `/api/`, Timeout 5000 ms; `wsUrl` leitet daraus die
  WebSocket-URL ab), `src/models`, `src/utils` (Musiktitel, Filter, Panel der Navigationsleiste,
  Fehlerbehandlung `loadSafely`), `src/style` (Themes, `appTheme`), `src/context`.
- Fehlerbehandlung beim Datenladen: `getData` reicht Fehler weiter. Die Services laden über `loadData`
  (`src/api/loadData.ts`) und werfen einen `LoadError`, dessen Meldung Netzwerkfehler/Timeout („backend not
  reachable“), HTTP-Status („HTTP 500“) und leere Antwort („… not found“) unterscheidet. Die Screens fangen genau
  einmal über `loadSafely` (`src/utils/loadSafely.ts`), sodass aus Effects keine unhandled rejections entstehen:
  Admin zeigt eine Hinweisleiste mit Icon-Button „Erneut versuchen“, Wall und Ground loggen per `console.error` und behalten den
  letzten Stand. Keine automatischen Wiederholungen. Der `DocumentReader` prüft `response.ok` der Notizdateien.
  Die Ladevorgänge in Effects (Admin, Wall, Ground, `DocumentReader`) laufen über `loadLatest` (ebenfalls
  `src/utils/loadSafely.ts`, aufgebaut auf `loadSafely`): Der Cleanup des Effects markiert die Anfrage als veraltet,
  danach eintreffende Ergebnisse und Fehler werden verworfen. Beim schnellen Szenen- bzw. Tab-Wechsel zählt so nur die
  Antwort zum aktuellen Stand. Die HTTP-Requests selbst werden nicht abgebrochen. Der Retry im Admin Screen erhöht nur
  einen Zähler (`reloadCount`), von dem alle Lade-Effects (Abenteuerliste, Daten des Abenteuers, aktive Szene) abhängen.
- Fehlerbehandlung beim Speichern: `patchData`/`postData` (`src/api/apiMethods.ts`) reichen Fehler weiter, `saveData`
  bzw. `postCommand` (`src/api/saveData.ts`) werfen einen `SaveError` mit derselben Aufbereitung wie `loadData`
  („Saving … failed: backend not reachable“ bzw. „HTTP 422“). Der Admin wertet nur das Ergebnis des jüngsten
  Speicherns aus (Szene, Abenteuer, Theme und Musik-Befehle gemeinsam).
- Assets in `public/`: `assets/sounds` (Soundeffekte, auf der Wall abgespielt), `assets/icons`, `story/**`
  (Markdown-Notizen, deutsch) sowie das fest eingebundene Medium `assets/images/ground_screen/mapOverview.jpg`
  (Weltkarte im Wall Screen). Szenenbilder und Musik, auch die Standardmusik, kommen vom Backend (`/media/...`, siehe
  Datenmodell und [Audio](#audio)).

## Lokal starten

Die ganze Anwendung läuft lokal in Docker und wird aus dem Root gestartet, am einfachsten per Start-Skript `script.sh`
(macOS). `compose.dev.yaml` (Projektname `dnd-portal-dev`) definiert alle Dev-Services (`db`, `api`, `pgadmin`,
`ui`) selbst, aufgebaut wie `compose.prod.yaml`; `db`, `api` und `pgadmin` lesen ihre Variablen per
`env_file: backend/.env`. Eigene Compose-Dateien in `backend/` bzw. `frontend/` gibt es nicht.

| `./script.sh …` | Wirkung |
|---|---|
| `dev [--tools]` | Docker sicherstellen, Prod-Stack stoppen, `PLAYER_URL` setzen (siehe unten, Port 5173), Dev-Stack im Vordergrund starten (`--tools`: mit pgAdmin); Ctrl+C beendet |
| `prod` | Docker sicherstellen, Dev-Stack stoppen, `PLAYER_URL` setzen (siehe unten, Port 8080), Prod-Stack im Hintergrund starten (`up -d --build --wait --wait-timeout 180`: wartet, bis DB und API healthy sind und nginx läuft; sonst Fehlermeldung, Exit ≠ 0, keine Tabs), dann `/admin`, `/wall`, `/ground` im Browser öffnen, Smartphone-URL (`http://<IP von en0>:8080/`) ausgeben; `VITE_API_URL` aus der Umgebung wird durchgereicht |
| `stop` | beide Stacks stoppen (`down` ohne `-v`, DB-Volumes bleiben) |
| `reset` | nach Rückfrage (`y`) den Dev-Stack stoppen und sein DB-Volume löschen (`down -v`, inkl. Profil `tools`); beim nächsten `dev` entstehen Schema und Seed neu. Der Prod-Stack bleibt unberührt |
| `logs [service]` | Logs des Prod-Stacks verfolgen |
| `install` | globalen Befehl `dnd` anlegen: Symlink `dnd` → `<repo>/script.sh` im ersten beschreibbaren Verzeichnis aus `/opt/homebrew/bin`, `/usr/local/bin`, das im `PATH` liegt; ein fremder `dnd` wird nicht überschrieben |
| `uninstall` | Symlink `dnd` entfernen, nur wenn er auf dieses Skript zeigt |
| ohne/unbekanntes Argument | Hilfe, Exit 1 |

„Docker sicherstellen“: Antwortet `docker info` nicht, startet das Skript Docker Desktop (`open -a Docker`) und wartet
bis zu 120 s.

„`PLAYER_URL` setzen“: Das Skript ermittelt die IP von `en0` und exportiert vor `docker compose … up` die URL des Player
Screens, `prod` → `http://<IP>:8080/`, `dev` → `http://<IP>:5173/`; ohne IP bleibt sie leer. Eine bereits gesetzte
`PLAYER_URL` aus der Umgebung hat Vorrang. `compose.dev.yaml` und `compose.prod.yaml` reichen sie per `environment` an
den Service `api` weiter (leer als Default, überschreibt einen Wert aus `backend/.env`); die API liefert sie unter
`GET /table/join` an den QR-Code-Dialog des Admins. Der Container selbst kennt die LAN-IP nicht.

Einmalig `./script.sh install`, danach funktionieren alle Befehle aus jedem Ordner als `dnd prod|dev|stop|reset|logs` (das
Skript ermittelt sein Verzeichnis über die Symlink-Kette; Hilfe und Ausgaben zeigen den aufgerufenen Namen).
`./script.sh <befehl>` funktioniert weiterhin ohne Installation.

**Voraussetzung:** `backend/.env` (gitignored) aus `backend/.env.example` anlegen: `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB` (Postgres-Container und API), `DB_DRIVER`, `DB_HOST` (`db` = Service-Name im
Compose-Netz), `DB_PORT`, optional `CORS_ORIGINS`, `MEDIA_DIR`, `DEFAULT_MUSIC_KEY`, `PGADMIN_DEFAULT_EMAIL/PASSWORD`. Die API erhält sie per
`env_file`; `backend/.dockerignore` hält die `.env` aus dem Image. Fehlt ein Pflichtwert, bricht die API beim Start mit
einem Validierungsfehler ab (Feldname im Log). Ältere `.env` mit `DRIVERNAME`/`HOST`/`PORT` einmalig auf
`DB_DRIVER`/`DB_HOST`/`DB_PORT` umbenennen.

| Befehl (im Root, ohne Skript) | Wirkung |
|---|---|
| `docker compose -f compose.dev.yaml up --build` | `db` (Postgres :5432), `api` (API :8000, uvicorn `--reload`, `backend/app`, `backend/migrations` und `backend/tests` gemountet, `media/` read-only unter `/app/media`), `ui` (Vite :5173, `frontend/` gemountet) |
| `docker compose -f compose.dev.yaml --profile tools up` | zusätzlich `pgadmin` (:5050) |
| `docker compose -f compose.dev.yaml up --build db api` | nur Backend (DB und API) |
| `docker compose -f compose.dev.yaml up --build ui` | nur Frontend (alternativ nativ `npm run dev` in `frontend/`) |
| `docker compose -f compose.dev.yaml run --rm api pytest` | Backend-Tests im Dev-Container |
| `docker compose -f compose.dev.yaml logs -f <service>` | Logs verfolgen |
| `docker compose -f compose.dev.yaml down` | stoppen; mit `-v` auch DB-Volume löschen (DB-Reset; Migrationen und Seeder laufen neu) |

Container-Namen nach dem Schema `dnd-<umgebung>-<rolle>`:

| Rolle | Dev | Prod |
|---|---|---|
| DB | `dnd-dev-db` | `dnd-prod-db` |
| API | `dnd-dev-api` | `dnd-prod-api` |
| Frontend | `dnd-dev-ui` | `dnd-prod-ui` |
| pgAdmin | `dnd-dev-pgadmin` | – |

Das DB-Volume des Dev-Stacks heißt `dnd-portal-dev_postgres_data` (Migrationen und Seeder füllen es beim ersten Start).
Nach Änderungen an `frontend/package.json`: `docker compose -f compose.dev.yaml up --build -V` (erneuert das
`node_modules`-Volume). Alte Container aus den früheren Einzel-Repos belegen dieselben Ports (5432, 8000, 5050, 5173) –
vorher stoppen.

UI unter http://localhost:5173 (`/admin`, `/wall`, `/ground`, `/`); das Frontend ruft die API über den Proxy des
Vite-Dev-Servers auf (`/api/…` → API ohne Präfix, `/ws` → API, `server.proxy` in `frontend/vite.config.ts`). Ziel aus
`API_PROXY_TARGET` (Default `http://localhost:8000`, im Dev-Compose `http://api:8000`).
Node-Version: `frontend/.nvmrc` (CI) und `frontend/Dockerfile` (`node:24-slim`, Stages `dev` und `build`) synchron halten.

**API-URL:** Das Frontend liest die Base-URL der API aus `VITE_API_URL` (Build-Zeit, von Vite ins Bundle
eingesetzt); ohne Variable gilt `/api/` (relativ, über den Proxy desselben Origins). Die WebSocket-URL leitet `wsUrl`
(`src/api/wsUrl.ts`) daraus ab: Endet der Pfad der Basis auf `/api/`, ist es `ws(s)://<host>/ws`, sonst `<basis>ws`
(z. B. `ws://localhost:8000/ws`). Lokal per `frontend/.env` (Vorlage `frontend/.env.example`), im Production-Image
per Build-Argument. Eine andere URL erfordert einen neuen Build.

**LAN/CORS:** Über den Proxy laufen Frontend, API und WebSocket unter demselben Origin; andere Geräte öffnen nur
`http://<IP>:8080` (bzw. `:5173` in Dev), ohne besonderen Build und ohne CORS-Eintrag. Für direkte Zugriffe auf Port
8000 erlaubt die API per CORS weiterhin die Origins aus `CORS_ORIGINS` (`backend/.env`, JSON-Liste; Default
`["http://localhost:5173","http://localhost:8080"]`), nur `GET` und `PATCH` (Preflight für JSON-Body), ohne
Credentials. `POST` ist per CORS nicht freigegeben: Die Soundeffekte (`POST /table/sounds`)
funktionieren über den Proxy (gleicher Origin), bei direktem Zugriff aus einem anderen Origin scheitert der Preflight. Der WebSocket prüft den Origin selbst (siehe [WebSocket `/ws`](#websocket-ws)). Der Player Screen ruft die
REST-API nicht auf, er nutzt nur den WebSocket.

### Am Spieltisch (Production)

Für den Spielabend gibt es einen eigenen Stack ohne Hot-Reload und ohne Code-Mounts: `compose.prod.yaml` im Root
(Projektname `dnd-portal-prod`, eigenes DB-Volume; Migrationen und Seeder füllen die DB beim ersten Start). Voraussetzung wie
oben: `backend/.env`.

| Befehl (im Root, ohne Skript; mit Skript: `./script.sh prod` bzw. `dnd prod`) | Wirkung |
|---|---|
| `docker compose -f compose.prod.yaml up -d --build --wait` | `db` (Postgres :5432), `api` (API :8000, uvicorn ohne `--reload`, Code im Image, `media/` read-only unter `/app/media` gemountet), `ui` (nginx :8080 mit dem statischen Build) – alle mit `restart: unless-stopped` |
| `VITE_API_URL=http://<host>:8000/ docker compose -f compose.prod.yaml up -d --build --wait` | Frontend mit anderer API-URL bauen (Default `/api/` über nginx; eine absolute URL umgeht den Proxy und braucht den Frontend-Origin in `CORS_ORIGINS`) |
| `docker compose -f compose.prod.yaml logs -f <service>` | Logs verfolgen |
| `docker compose -f compose.prod.yaml down` | stoppen; mit `-v` auch DB-Volume löschen (DB-Reset) |

UI unter http://localhost:8080/admin, `/wall` und `/ground`; Wall und Ground können auch in anderen Browsern oder auf
anderen Geräten laufen (`http://<IP des Rechners>:8080/wall`). Smartphones öffnen den Player Screen über
`http://<IP des Rechners>:8080/` (gleicher Build, kein Sonder-Build): am einfachsten per QR-Code im Admin (Dashboard,
Panel „Screens“, Icon-Button „QR-Code“) oder über die URL, die `dnd prod` ausgibt. Der Dialog nimmt `player_url` aus `GET /table/join`;
ist sie `null` (Stack ohne Skript gestartet), nimmt er den Origin des Admins, sofern dieser nicht über `localhost`,
`127.0.0.1` oder `[::1]` geöffnet ist (`selectPlayerUrl`, `src/utils/playerUrl.ts`), sonst zeigt er den Hinweis
„Player-URL unbekannt …“. nginx (`frontend/nginx.conf`) leitet `/api/` an die API weiter (Präfix entfernt,
`Range` für Medien funktioniert) und `/ws` als WebSocket (`Upgrade`/`Connection`, `proxy_read_timeout` 120 s), beide
mit dem ursprünglichen `Host`-Header; Port 8000 bleibt für direkte Zugriffe veröffentlicht. nginx liefert `index.html`
auch für direkt aufgerufene Unterrouten aus (SPA-Fallback); die Dateien aus `public/` (Sounds, Icons, Notizen) stecken im
Image, Änderungen daran brauchen einen neuen Build (`--build`). Szenenmedien in `media/` sind per Bind-Mount
eingebunden und brauchen keinen Build. pgAdmin ist nicht enthalten.
Dev- und Prod-Stack nicht gleichzeitig betreiben: API (:8000) und DB (:5432) nutzen dieselben Ports.
Healthchecks: `db` per `pg_isready`, `api` per Python-Einzeiler gegen `http://localhost:8000/adventures` (das Image hat
kein curl); `api` startet erst bei gesunder DB, `ui` erst bei gesunder API. `docker ps` zeigt `dnd-prod-api (healthy)`.

Frontend-Image: `frontend/Dockerfile` mit Stages `dev` (Vite-Dev-Server, von `compose.dev.yaml` per
`target: dev` genutzt), `build` (`npm ci`, `npm run build`) und `prod` (nginx, Konfiguration `frontend/nginx.conf`).
Backend-Image: `backend/Dockerfile` mit uv und Stages `base`, `dev` (inkl. Dev-Abhängigkeiten, von
`compose.dev.yaml` per `target: dev` genutzt) und `prod` (letzte Stage, ohne Dev-Abhängigkeiten, Non-Root-User);
startet `uvicorn app.main:app` ohne `--reload`; den Reload setzt nur der Dev-Stack per `command`.

## Qualitätssicherung

| | Backend | Frontend |
|---|---|---|
| Lint | `uv run ruff check`, `uv run ruff format --check`, `uv run mypy app` (strict, Pydantic-Plugin; Konfig in `pyproject.toml`) | `npm run lint` (ESLint 9, flat config auf Basis von Airbnb (`eslint-config-airbnb-extended`: base + react, jeweils recommended + typescript), keine Semikolons; 0 Fehler und 0 Warnungen) |
| Unit-Tests | `uv run pytest` – Tests aller Endpoints in `tests/` (Erwartungen aus dem Seed), gegen PostgreSQL (lokal Dev-DB bzw. Dev-Container) | `npm run test:unit` (vitest, `__tests__/unit/*.spec.ts`) |
| E2E | – | `npm run test:e2e` (jest-cucumber + Selenium/Chrome, braucht laufendes Backend mit Seed-Daten) |
| Toter Code, Dependencies, Duplikate, Komplexität | `make check-quality` (`backend/Makefile`): vulture (`min_confidence = 60`, Whitelist und Baseline), deptry, xenon (Ränge für `app/`), pylint nur `duplicate-code` (`app/`, ab 8 Zeilen); dazu ruff `C90` (`max-complexity`), `PIE`, `RET` im Lint | `npm run check:deadcode` (knip: Dateien, Exporte, Dependencies) und `npm run check:dupes` (jscpd: `src/`, ab 8 Zeilen, `threshold`) |
| CI | `.github/workflows/backend.yml` – bei Push auf `main`/`development` mit Änderungen unter `backend/`: parallele Jobs `lint` (ruff check, ruff format --check, mypy, `openapi.json` aktuell), danach `quality` (`make check-deadcode`, `check-deps`, `check-complexity`, `check-dupes`, `needs: lint`), und `test` (Alembic-Rundlauf `upgrade head`, `check`, `downgrade base`, `upgrade head`, danach pytest gegen Service-Container `postgres:17`) direkt auf dem Runner, uv mit Cache auf `uv.lock`; Job `docker-prod` baut das Image (`--target prod`, ohne Push) | `.github/workflows/frontend.yml` – analog für `frontend/` und `backend/openapi.json`: zuerst Job `build` (`vite build`), danach parallel `typecheck` (`src/api/schema.d.ts` aktuell, `tsc -b`), `lint` und `test` (`npm run test:unit`) mit `needs: build`, nach `lint` Job `quality` (`check:deadcode`, `check:dupes`), Node aus `frontend/.nvmrc` (24) mit npm-Cache, `npm ci`; Job `docker-prod` baut das Production-Image (`--target prod`, ohne Push); kein E2E in CI |

Schlägt ein Job fehl (Build, Typecheck, Lint, Qualitätsprüfungen, Test oder Image-Build), ist der Workflow rot.

Für die Qualitätsprüfungen ist der Stand von DND-31 die Baseline: Die Grenzen entsprechen dem Ist-Stand, bestehende
Funde stehen in Ignore-Listen (`frontend/knip.jsonc`, `[tool.deptry]`) bzw. `backend/vulture_baseline.py`, getrennt von
den Falsch-Positiven. Neue Verschlechterungen brechen den Job; die Funde stehen in [known-issues.md](known-issues.md#baseline-der-qualitätsprüfungen).
