# DND-26: Audio auf der Wall, Admin als Fernbedienung

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Musik und Soundeffekte laufen heute im Admin-Fenster: `useMusicPlayer`/`MusicPlayer` wählt die Tracks der aktiven Szene
zufällig, ohne Szene spielt die fest eingebundene Standardmusik, und die `TopBar` spielt Soundeffekte per `playAtmoSounds`.
Seit DND-25 können Wall und Ground auf anderen Geräten laufen, der Ton kommt aber weiter aus dem Rechner des Spielleiters.
Ziel: **Die Wall ist der Lautsprecher** für Musik und Soundeffekte, der Admin ist die Fernbedienung (Play/Pause,
Weiter, Lautstärke, Sounds). Wie beim Spieltisch-Zustand ist der **Server die Quelle** des Musikzustands und
pusht ihn per WebSocket. Zweiter von drei Schritten der Zieldefinition (DND-25 Zustand, DND-27 Smartphones).

**Voraussetzung:** DND-25 (fertig).

## Scope / Non-Goals

**Im Scope**
- Musikzustand im Server (im Speicher): Playlist aus der aktiven Szene bzw. Standardmusik, aktueller Track,
  läuft/pausiert, Lautstärke, Audioausgabe bereit.
- REST-Endpoints für Play/Pause, Lautstärke, Weiter und Soundeffekte; neue WebSocket-Nachrichten in beide Richtungen
  (erstmals Client → Server, nur von der Wall).
- Wall: „Audio“-Button in der Steuerleiste, Wiedergabe von Musik und Sounds, wenn sie die Ausgabe ist.
- Admin: Musiksteuerung und Sounds senden Befehle an den Server, Anzeige von Track und Ausgabe-Status.
- Entfernen des Audios aus dem Admin samt nicht mehr genutztem Code, Tests und Doku.

**Nicht im Scope**
- Persistenz des Musikzustands über API-Neustarts (bewusst flüchtig).
- Synchrone Wiedergabeposition (z. B. Sprung an dieselbe Stelle nach einem Reconnect), Überblendungen.
- Eigene Playlists, Upload, Verwaltung von Soundeffekten im Backend (die Sounddateien bleiben im Frontend).
- Lautstärke der Soundeffekte (bleiben bei 100 %), Audio auf Ground oder Player.
- Anzeige aller verbundenen Screens im Admin.

## Entscheidungen

### E1: Der Server entscheidet über die Musik
- **Entscheidung:** Ein Audio-Dienst im API-Prozess (z. B. `app/realtime/audio.py`) hält den Musikzustand **im Speicher**:
  - `playlist`: Tracks der aktiven Szene (nach ID). Ohne aktive Szene ist es die **Standardmusik** (E2).
  - `track`: aktueller Track (`Track` aus `app/schemas/scene.py`) oder `null` bei leerer Playlist.
  - `playing` (Start: `false`), `volume` (Prozent 0–100, Start: `10`, entspricht den heutigen 0,1).
  - `output_ready`: ob eine Wall als Audioausgabe bereit ist (E4).
  Ändert sich die aktive Szene (geprüft bei jedem Push des Spieltisch-Zustands), lädt der Dienst die neue Playlist und wählt
  zufällig einen Track. `playing` bleibt unverändert (wie heute: Läuft die Musik, startet sofort ein Track der neuen Szene).
  Den nächsten Track wählt der Server zufällig aus der Playlist und, wenn möglich, nicht den aktuellen (Logik wie
  `getRandomTrack`, Zufallsquelle injizierbar). Nach einem API-Neustart ist die Musik pausiert.
- **Verworfene Alternativen:** Die Wall wählt selbst und meldet nur zur Anzeige.
- **Begründung:** Eine Quelle der Wahrheit. Der Admin zeigt den Track zuverlässig an, und beim Wechsel der Ausgabe macht die neue
  Wall nahtlos weiter.

### E2: Standardmusik aus dem Backend
- **Entscheidung:** Ohne aktive Szene besteht die Playlist aus dem Medium mit dem Storage-Key aus `Settings.default_music_key`
  (Default `music/side/forest/From_Past_To_Present.mp3`, liegt bereits in `media/` und im Seed). Fehlt das Medium, ist die
  Playlist leer. Import und Kopie im Frontend (`frontend/public/assets/music/side/forest/From_Past_To_Present.mp3`) entfallen.
- **Begründung:** Die Musik kommt nur noch vom Server, und eine der Doppelungen aus DND-22 (E7) ist damit aufgelöst.

### E3: REST für Befehle, WebSocket für den Zustand
- **Entscheidung:**

  | Methode und Pfad | Antwort |
  |---|---|
  | `GET /table/audio` | `AudioState` |
  | `PATCH /table/audio` | Body `AudioUpdate`, Antwort `AudioState`; 422 bei `volume` außerhalb 0–100 |
  | `POST /table/audio/next` | `AudioState` (neuer zufälliger Track, `playing` unverändert) |
  | `POST /table/sounds` | Body `SoundRequest`, 204; 422 bei unbekanntem Namen |

  ```
  AudioState   { playing: bool, track: Track | null, volume: int, output_ready: bool }
  AudioUpdate  { playing?: bool, volume?: int (0–100) }             nur gesetzte Felder werden geändert
  SoundRequest { name: "heal" | "bottle" | "buff" | "music_1" | "music_2" | "spell_1" | "spell_2"
                       | "debuff_1" | "debuff_2" | "lock" }
  ```
  `PATCH` mit `playing: true` bei leerer Playlist ändert nichts an `playing`. Nach jeder Änderung pusht der Server
  `{"type": "audio", "payload": AudioState}` an **alle** Verbindungen, auch direkt nach dem Verbinden (nach dem
  `state`-Snapshot). Ein Soundeffekt geht als `{"type": "sound", "payload": {"name": ...}}` **nur an die Ausgabe**. Ohne
  Ausgabe verfällt er (204 trotzdem).
- **Begründung:** Gleiches Muster wie DND-25 (REST schreibt typisiert, WebSocket verteilt). Die Sounddateien bleiben im Frontend,
  der Server kennt nur ihre Namen.

### E4: Die Wall meldet sich per WebSocket, nur die zuletzt aktivierte spielt
- **Entscheidung:** Erstmals sendet ein Client Nachrichten an den Server, und nur von Verbindungen mit `screen=wall` werden
  sie ausgewertet (andere Nachrichten und andere Screens ignoriert der Server weiter):
  - `{"type": "audio_ready"}`: Diese Verbindung wird **die** Audioausgabe. Eine bisherige Ausgabe verliert die Rolle.
  - `{"type": "track_ended", "payload": {"track_id": <id>}}`: Nur von der aktuellen Ausgabe und nur, wenn `track_id` der aktuelle
    Track ist (sonst veraltet bzw. doppelt, wird ignoriert). Der Server wählt dann den nächsten Track (E1).
  Der Server teilt jeder Wall mit, ob sie die Ausgabe ist: `{"type": "audio_output", "payload": {"active": bool}}` (gezielt an die
  betroffenen Verbindungen). Trennt sich die Ausgabe, ist `output_ready` `false`, und alle bekommen den neuen `AudioState`. Nach einem
  Reconnect sendet eine Wall, die vor dem Abbruch Ausgabe war, von selbst wieder `audio_ready` (die Seite hatte bereits eine
  Nutzerinteraktion, Autoplay ist also freigegeben).
- **Verworfene Alternativen:** Meldungen per REST mit Verbindungs-ID; alle bereiten Walls spielen.
- **Begründung:** Die Bereitschaft hängt an der Verbindung und endet beim Trennen von selbst. Eine einzige Ausgabe verhindert Echo im Raum.

### E5: Ohne bereite Ausgabe merkt sich der Server den Zustand
- **Entscheidung:** Play/Pause, Weiter und Lautstärke funktionieren auch ohne Ausgabe und ändern den Zustand. Wird eine Wall
  bereit, setzt sie mit dem aktuellen Zustand ein (läuft die Musik, startet sie den aktuellen Track von vorn). Der Admin zeigt
  ohne Ausgabe den Hinweis „Keine Audioausgabe bereit“ neben der Musiksteuerung.
- **Verworfene Alternativen:** Befehle ablehnen bzw. Buttons deaktivieren.

### E6: „Audio“-Button in der Steuerleiste der Wall
- **Entscheidung:** Die Hover-Steuerleiste der Wall (`ScreenControlBar`, neben BATTLE / WORLD / OFF) bekommt einen Button
  „AUDIO“. Ein Klick sendet `audio_ready` und schaltet mit dieser Nutzerinteraktion die Wiedergabe frei. Er ist hervorgehoben,
  solange diese Wall die Ausgabe ist. Darüber hinaus zeigt die Wall nichts an. Schlägt `play()` fehl (Autoplay), loggt die Wall
  per `console.error`, der Spielleiter klickt erneut.
- **Verworfene Alternativen:** Overlay „Klicken, um Audio zu aktivieren“.
- **Begründung:** Für die Spieler unsichtbar, gestaltet nach `frontend/DESIGN.md` wie die bestehenden Buttons.

### E7: Wiedergabe auf der Wall
- **Entscheidung:** Ist die Wall Ausgabe, folgt sie dem `AudioState`: Track-Wechsel → `src = mediaUrl(track.source)` und
  von vorn. `playing` → `play()` bzw. `pause()`. `volume / 100` → Lautstärke. Endet ein Track, sendet sie `track_ended`.
  Verliert sie die Rolle, pausiert sie sofort. Soundeffekte spielt sie bei voller Lautstärke parallel zur Musik (Zuordnung
  Name → Datei aus `public/assets/sounds`, eine gemeinsame Liste, die auch die Admin-`TopBar` für die Icons nutzt). Die
  Wiedergabelogik steckt in einer testbaren Klasse mit injizierbarem Audio (Muster `MusicAudio` aus `src/utils/musicPlayer.ts`).
- **Begründung:** Die Wall setzt nur den Serverzustand um und trifft keine eigenen Entscheidungen.

### E8: Admin als Fernbedienung
- **Entscheidung:** Die Musiksteuerung in der Bottom-Bar zeigt `playing` und den Tracktitel (`getMusicTitle(track.source)`)
  aus dem `AudioState`. Play/Pause schickt `PATCH /table/audio {playing}`, dazu kommen ein Button „Weiter“ (`POST
  /table/audio/next`), ein Lautstärke-Slider (`PATCH /table/audio {volume}`, gesendet beim Loslassen) und der Hinweis aus E5. Alles
  ohne lokale Vorwegnahme, die Anzeige folgt dem Push. Fehler bei Musik-Befehlen landen in der gemeinsamen Speicherfehler-Leiste (DND-25 E7)
  inkl. „Erneut versuchen“. Die Sound-Buttons der `TopBar` schicken `POST /table/sounds`. Fehler dabei werden nur geloggt (ein verspäteter
  Sound ist sinnlos, daher kein Retry). Im Admin wird nichts mehr abgespielt.
- **Begründung:** Der Spielleiter sieht jederzeit den tatsächlichen Zustand der Ausgabe.

## Subtasks

### Vertrag
- [x] Schemas `AudioState`, `AudioUpdate`, `SoundRequest` (`app/schemas/audio.py`), Endpoints gemäß E3.
- [x] WebSocket-Nachrichten `audio`, `audio_output`, `sound` (Server → Client) sowie `audio_ready` und `track_ended`
      (Client → Server) in `docs/architecture.md` dokumentieren.

### Backend
- [x] `Settings.default_music_key` (`app/core/config.py`, `backend/.env.example`).
- [x] Audio-Dienst gemäß E1/E2/E5: Playlist laden (Tracks der aktiven Szene bzw. Standardmusik, per CRUD), zufällige
      Track-Wahl mit injizierbarer Zufallsquelle, Zustandswechsel, Ausgabe-Verwaltung. Beim Start (`lifespan`) mit dem aktuellen
      Spieltisch-Zustand initialisieren.
- [x] `push_state` (`app/realtime/push.py`): Bei geänderter aktiver Szene Playlist neu laden und zusätzlich `audio` pushen.
      Beim Verbinden nach dem `state`-Snapshot auch `audio` senden (bzw. `audio_output` für die betroffene Wall). Reihenfolge
      wie bisher über `manager.state_lock` serialisieren.
- [x] Router `app/api/routes/audio.py` (Prefix `/table`, Tag `table` bzw. eigener Tag) gemäß E3. Push als `BackgroundTask`.
- [x] WebSocket-Route (`app/api/routes/ws.py`): eingehende Nachrichten parsen (JSON, ungültige ignorieren) und `audio_ready`/
      `track_ended` von Walls an den Audio-Dienst geben. Beim Trennen die Ausgabe freigeben und `audio` pushen.
- [x] `uv run python scripts/export_openapi.py`.
- [x] Tests:
  - `tests/test_audio.py`: GET-Startzustand (pausiert, 10 %, Track aus der Playlist bzw. Standardmusik ohne Szene), PATCH
    `playing`/`volume`, 422 für `volume` −1/101 und unbekannten Sound, `next` wählt einen anderen Track (Zufall gesteuert),
    leere Playlist (z. B. Szene ohne Tracks), Szenenwechsel lädt die neue Playlist und behält `playing`. Zustand nach jedem Test zurücksetzen.
  - `tests/test_ws.py` erweitern: `audio` nach `state` beim Verbinden; `audio_ready` einer Wall → `output_ready` true und
    `audio_output` active; zweite Wall übernimmt → erste bekommt `active: false`; `audio_ready` von Admin/Ground/Player wird
    ignoriert; `track_ended` mit aktuellem Track → neuer Track, mit veraltetem oder von Nicht-Ausgabe → ignoriert; `sound`
    nur an die Ausgabe; Trennen der Ausgabe → `output_ready` false an alle; ungültiges JSON bricht die Verbindung nicht ab.

### Frontend
- [x] `npm run generate:api`; `src/models/models.ts`: `AudioState`, `SoundName` ableiten.
- [x] `src/realtime/messages.ts`: `audio`, `audio_output`, `sound` parsen und validieren (Unit-Tests). `connection.ts`/`SocketLike`
      um `send` erweitern. Senden nur bei offener Verbindung, sonst verwerfen.
- [x] `GameTableProvider`/`useGameTable`: `AudioState` und (für die Wall) `isAudioOutput`, eingehende `sound`-Events sowie
      `send` bereitstellen, z. B. über einen `AudioContext`. Nach einem Reconnect erneut `audio_ready` senden, wenn die Wall
      vorher Ausgabe war (E4).
- [x] Gemeinsame Soundliste (Name → Icon, Datei) z. B. `src/audio/sounds.ts`, genutzt von `TopBar` (Icons, `POST /table/sounds`)
      und Wall (Wiedergabe).
- [x] Wiedergabeklasse für die Wall (E7) mit Unit-Tests (Fake-Audio: Track-Wechsel, Play/Pause, Lautstärke, `ended` → Callback,
      Rollenverlust pausiert, abgelehntes `play()` wirft nicht).
- [x] `WallScreen.tsx` und `ScreenControlBar`: Button „AUDIO“ (E6), Wiedergabe einbinden.
- [x] `AdminScreen.tsx`, `src/service/adminScreen.ts`, `TopBar.tsx`: Fernbedienung gemäß E8 (Play/Pause, Weiter, Slider,
      Hinweis), Sounds per API. `useMusicPlayer`, `MusicPlayer`, `getRandomTrack`, `playAtmoSounds`, Import und Datei der
      Standardmusik samt zugehöriger Tests (`musicPlayer.spec.ts`, Teile von `utils.spec.ts`) entfernen. `getMusicTitle` bleibt.

### Doku
- [x] `docs/architecture.md`: Abschnitt „Audio“ (Server-Zustand, Ausgabe, Nachrichten, Endpoints), WebSocket-Tabelle
      (Nachrichten in beide Richtungen), Settings, Assets (Standardmusik nur noch im Backend).
- [x] `docs/screens.md` (Ist: Admin-Musiksteuerung und -Hinweis, Wall-Button „AUDIO“), `docs/domain.md` (Musik, Soundeffekt,
      Audioausgabe), `docs/known-issues.md` (Doppelung der Standardmusik entfernt; Musikzustand flüchtig),
      `CLAUDE.md` (Monorepo-Tabelle: `From_Past_To_Present.mp3` nicht mehr im Frontend), `frontend/CLAUDE.md`,
      `backend/CLAUDE.md`, `backend/README.md`.

## Akzeptanzkriterien

### AK1: Wall wird zur Audioausgabe
- **Given** Admin und Wall sind verbunden, die Musik ist pausiert
- **When** der Spielleiter auf der Wall in der Steuerleiste „AUDIO“ klickt und danach im Admin Play drückt
- **Then** spielt die Wall einen Track der aktiven Szene. Der Admin zeigt dessen Titel, den Zustand „läuft“, und der Hinweis
  „Keine Audioausgabe bereit“ ist verschwunden. Aus dem Admin-Rechner kommt kein Ton.

### AK2: Fernbedienung
- **Given** die Wall ist Ausgabe und die Musik läuft
- **When** der Spielleiter im Admin Pause, Play, „Weiter“ oder den Lautstärke-Slider benutzt
- **Then** reagiert die Wall entsprechend (Pause, Fortsetzen, anderer Track, andere Lautstärke), und der Admin zeigt den neuen Zustand.

### AK3: Szenenwechsel und Playlist
- **Given** die Musik läuft
- **When** der Spielleiter eine andere Szene aktiviert
- **Then** spielt die Wall sofort einen Track der neuen Szene. Endet ein Track, folgt ein anderer zufälliger Track derselben Playlist.
- **And given** keine Szene ist aktiv, **then** ist die Standardmusik die Playlist.

### AK4: Soundeffekte
- **Given** die Wall ist Ausgabe
- **When** der Spielleiter in der TopBar einen Sound auslöst
- **Then** spielt die Wall den Sound über die Musik. Ohne Ausgabe passiert nichts, und es erscheint kein Fehler.

### AK5: Nur eine Ausgabe
- **Given** zwei Walls (z. B. auf zwei Geräten), Wall A ist Ausgabe
- **When** auf Wall B „AUDIO“ geklickt wird
- **Then** verstummt A (ihr Button ist nicht mehr hervorgehoben), und B setzt mit dem aktuellen Zustand ein.

### AK6: Ausgabe weg und zurück
- **Given** die Wall ist Ausgabe und die Musik läuft
- **When** die Wall-Verbindung abbricht (z. B. API-Neustart oder WLAN)
- **Then** zeigt der Admin „Keine Audioausgabe bereit“. Nach dem automatischen Reconnect meldet sich die Wall ohne neuen Klick
  wieder als Ausgabe. Nach einem API-Neustart ist die Musik pausiert.

### AK7: Befehle ohne Ausgabe
- **Given** keine Wall ist Ausgabe
- **When** der Spielleiter Play drückt und anschließend auf einer Wall „AUDIO“ klickt
- **Then** startet die Wall direkt mit der Musik.

## Teststrategie / Verifikation

**Automatisch**
- Backend: `uv run pytest` (siehe Subtasks), `ruff check`, `ruff format --check`, `mypy app`, `openapi.json` aktuell.
- Frontend: `npm run typecheck`, `npm run lint`, `npm run test:unit` (Nachrichten, Wiedergabeklasse, Soundliste),
  `npm run build`, `docker build --target prod`.
- E2E: `npm run test:e2e` gegen den Dev-Stack (bestehende Features laufen weiter).

**Manuell** (`dnd prod`)
1. Admin auf dem Rechner, Wall auf einem zweiten Gerät bzw. in einem zweiten Browser: „AUDIO“ klicken, Play (AK1), Pause,
   Weiter, Slider (AK2).
2. Szene wechseln, einen kurzen Track zu Ende laufen lassen (AK3). Szene leeren (zweites Abenteuer ohne Szene) → Standardmusik.
3. Sounds in der TopBar (AK4), danach Wall schließen und erneut Sounds auslösen (kein Fehler).
4. Zweite Wall „AUDIO“ (AK5).
5. `docker restart dnd-prod-api` → Hinweis im Admin, die Wall meldet sich nach dem Reconnect selbst, die Musik ist pausiert (AK6).
6. Ohne Ausgabe Play drücken, dann „AUDIO“ auf der Wall (AK7).

## Offene Fragen
- keine

## Review
