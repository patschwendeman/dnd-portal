# Domäne & Begriffe

| Begriff (fachlich) | Bedeutung | Im Code |
|---|---|---|
| Spielleiter / Admin | Erzählt die Geschichte, spielt alle NPCs, steuert die App | Route `/admin`, `AdminScreen` |
| Spieler | Spielt einen Charakter, nutzt den Player Screen | Route `/` (`PlayerScreen`); geparkt: `/spells` (Branch `feature/spells-screen`) |
| NPC | Nicht-Spieler-Charakter, freundlich oder feindlich, vom Spielleiter gespielt | kein eigenes Datenmodell; Infos nur in Markdown-Notizen |
| Szene | Situation, die der Spielleiter aktiviert; bündelt Wall-Bild, Ground-Bild und Musik | Tabelle/Model `Scene` (Backend), `SceneDetail` (Frontend) |
| Kampfszene | Szene mit taktischem Kampf | `Scene.main == true` → „Mainmap“, Endpoint `/maps/main` |
| Nicht-Kampfszene | Dorf, Shop, Taverne, Level-Up … | `Scene.main == false` → „Sidemap“, Endpoint `/maps/side` |
| Wall-Bild | Atmosphäre-Hintergrund der Szene | `GraphicsWall` / `scene.graphics_wall` |
| Ground-Bild | Spielbrett/Kampfschauplatz der Szene (Bild oder Video) | `GraphicsGround` / `scene.graphics_ground` |
| Musik (Sound-Element einer Szene) | Playlist von Tracks einer Szene, zufällig abgespielt | `Music`, n:m über `scene_music_association`; `scene.music[]` |
| Soundeffekt | Einzelner Sound, den der Admin manuell abspielt (Heilung, Buff, Zauber …) | nur Frontend: `TopBar`, Dateien in `public/assets/sounds/` |
| Notizen | Markdown-Dateien zu Story, NPCs, Kämpfen, Leveling, Regeln | nur Frontend: `public/story/**.md`, `DocumentReader` |
| Ressourcen (Spieler) | Aktion, Bonusaktion, Zauberplätze I–IV, Spezial-Ressource (+ WIP: Bewegung) | nur Frontend: `ResourceBarPlayer` (lokaler State) |
| Grid | Optionales Raster auf dem Ground Screen für taktische Kämpfe | `GridOverlay`, Steuerung über `ScreenControlBar` |
| Weltkarte / Übersichtskarte | Overlay auf dem Wall Screen | WallScreen: Weltkarte = statisches Bild; Übersicht = Kacheln aller Mainmaps |

## Historische Bezeichnungen

- `battlemap(s)` → heute `mainmap(s)` bzw. `main` (Commit „Change battlemaps to mainmaps“). Asset-Ordner heißen noch
  `battle_maps`, Bilder `battle_N.jpg`, die WallScreen-Buttons „BATTLE“.
- `sidemap(s)` → heute über `/maps/side`; Musik-Ordner heißen noch `side_maps`.
- `fight` (Bool auf Scene) → heute `main`. Veraltet u. a. noch in `__tests__/unit/SceneDetailMock.json`.
- `v1-roguelike` (Tags `archive/*-v1-roguelike`): altes, **verworfenes** Konzept mit Tabelle `battlemaps` (loot, xp, enemies, locked,
  source_locked) und PUT-Endpoint zum Entsperren. Im Code sind keine Reste mehr vorhanden.
