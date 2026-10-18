# Domäne & Begriffe

| Begriff (fachlich) | Bedeutung | Im Code |
|---|---|---|
| Abenteuer | Oberste Ebene: eine Kampagne bzw. ein Abenteuer mit eigenen Szenen und Spielern | Tabelle/Model `Adventure` (Backend), API `/adventures`, Schemas `AdventureSummary`/`AdventureDetail`; Szenen und Spieler gehören je zu genau einem Abenteuer (`adventure_id`); aktiv ist eines je Spieltisch (`game_table.active_adventure_id`, `PATCH /table`); im Frontend: Auswahl im Admin (Dropdown der Top-Bar), `activeAdventureId` im `ActiveAdventureContext` (aus dem WebSocket-Snapshot) |
| Spieltisch | Der gemeinsame Zustand von Admin, Wall und Ground: aktives Abenteuer, dessen aktive Szene und Theme; ein Server = ein Spieltisch | Tabelle/Model `GameTable` (`game_table`, genau eine Zeile), API `GET`/`PATCH /table` (`GameTableState`, `GameTableUpdate`), WebSocket `/ws` (Snapshots); im Frontend `GameTableProvider`/`useGameTable` (`src/realtime/`) |
| Theme (global) | Farbschema `dark` oder `tavern` der Spieltisch-Screens, vom Admin umgeschaltet | `game_table.theme`, `GameTableState.theme`, Frontend-Typ `Theme`; der Player Screen hat ein eigenes, lokales Theme (`localStorage` `isDarkTheme`) |
| Spielleiter / Admin | Erzählt die Geschichte, spielt alle NPCs, steuert die App | Route `/admin`, `AdminScreen` |
| Spieler | Spielt einen Charakter, nutzt den Player Screen | Route `/` (`PlayerScreen`); geparkt: `/spells` (Branch `feature/spells-screen`) |
| Spieler / Charakter (Datenmodell) | Eine Person mit ihrem Charakter in einem Abenteuer; in einem anderen Abenteuer hat dieselbe Person einen eigenen Eintrag | Tabelle/Model `Player`: `player_name`, `character_name`, `race`, `character_class` (Freitext; `class` ist in Python reserviert), optional `avatar` (`Media`); API-Schema `Player` in `AdventureDetail.players` |
| Globales Level | Charakterlevel, das vorerst für alle Spieler eines Abenteuers gilt (1–20) | `Adventure.global_level` (Default 1) |
| Aktive Szene | Szene, die der Spielleiter gerade aktiviert hat und die Wall und Ground zeigen | Im Frontend `activeSceneId` (`number \| null`, `null` = keine Szene aktiv) im `ActiveSceneContext` (aus dem WebSocket-Snapshot, `GameTableState.active_scene_id` = aktive Szene des aktiven Abenteuers); persistent im Abenteuer: `Adventure.active_scene_id` (`PATCH /adventures/{id}`, nur Szenen desselben Abenteuers), beim Aktivieren gespeichert |
| NPC | Nicht-Spieler-Charakter, freundlich oder feindlich, vom Spielleiter gespielt | kein eigenes Datenmodell; Infos nur in Markdown-Notizen |
| Szene | Situation, die der Spielleiter aktiviert; bündelt Wall-Bild, Ground-Bild und Musik | Tabelle/Model `Scene` (Backend), API-Schema `SceneDetail` (Backend `app/schemas/`, Frontend-Typ generiert) |
| Kampfszene | Szene mit taktischem Kampf | `Scene.main == true` → „Mainmap“, Endpoint `/adventures/{id}/maps/main` |
| Nicht-Kampfszene | Dorf, Shop, Taverne, Level-Up … | `Scene.main == false` → „Sidemap“, Endpoint `/adventures/{id}/maps/side` |
| Wall-Bild | Atmosphäre-Hintergrund der Szene | `Media` (`kind` `image`) / `scene.wall_image` |
| Ground-Bild | Spielbrett/Kampfschauplatz der Szene (Bild oder Video) | `Media` (`kind` `image`) / `scene.ground_image` |
| Musik (Sound-Element einer Szene) | Playlist von Tracks einer Szene, vom Server zufällig gewählt und von der Audioausgabe abgespielt; ohne aktive Szene die Standardmusik | `Media` (`kind` `audio`), n:m über `scene_track`; `scene.tracks[]` (API-Typ `Track`); Musikzustand im Speicher des Servers (`AudioService`, `app/realtime/audio.py`), API `GET`/`PATCH /table/audio` (`AudioState`, `AudioUpdate`), Standardmusik `Settings.default_music_key` |
| Soundeffekt | Einzelner Sound, den der Admin manuell auslöst (Heilung, Buff, Zauber …) und die Audioausgabe abspielt | `POST /table/sounds` (`SoundRequest`, Name `SoundName`), WebSocket-Nachricht `sound`; Liste im Frontend `src/audio/sounds.ts` (Icons der `TopBar`, Dateien in `public/assets/sounds/`) |
| Audioausgabe | Die Wall, die Musik und Soundeffekte abspielt; immer höchstens eine (die zuletzt per „AUDIO“ aktivierte) | WebSocket-Nachrichten `audio_ready`, `audio_output`, `track_ended`; `AudioState.output_ready`; im Frontend `WallAudioPlayer` (`src/audio/wallAudioPlayer.ts`), `GameAudioContext` |
| Notizen | Markdown-Dateien zu Story, NPCs, Kämpfen, Leveling, Regeln | nur Frontend: `public/story/**.md`, `DocumentReader` |
| Ressourcen (Spieler) | Aktion, Bonusaktion, Zauberplätze I–IV, Spezial-Ressource (+ WIP: Bewegung) | nur Frontend: `ResourceBarPlayer` (lokaler State) |
| Grid | Optionales Raster auf dem Ground Screen für taktische Kämpfe | `GridOverlay`, Steuerung über `ScreenControlBar` |
| Weltkarte / Übersichtskarte | Overlay auf dem Wall Screen | WallScreen: Weltkarte = statisches Bild; Übersicht = Kacheln aller Mainmaps |

## Historische Bezeichnungen

- `battlemap(s)` → heute `mainmap(s)` bzw. `main` (Commit „Change battlemaps to mainmaps“). Assets folgen dem Schema
  (`music/main/`, `ground_screen/main_N.jpg`); der WallScreen-Button „BATTLE“ ist eine bewusste UI-Bezeichnung.
- `sidemap(s)` → heute über `/adventures/{id}/maps/side`; Musik-Ordner `music/side/`.
- `fight` (Bool auf Scene) → heute `main`.
- `v1-roguelike` (Tags `archive/*-v1-roguelike`): altes, **verworfenes** Konzept mit Tabelle `battlemaps` (loot, xp, enemies, locked,
  source_locked) und PUT-Endpoint zum Entsperren. Im Code sind keine Reste mehr vorhanden.
