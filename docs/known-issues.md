# Bekannte Lücken, Bugs & Altlasten

Stand: Analyse vom 2026-09-27. Punkte mit „(ungeprüft)“ wurden aus dem Code abgeleitet, aber nicht zur Laufzeit verifiziert.

## Lücken gegenüber der Vision

- Player-Ressourcen sind nur lokal, nicht persistiert und nicht pro Charakter konfigurierbar.
- Keine NPC-, Charakter- oder Kampfdaten im Datenmodell – nur Markdown-Notizen.
- Soundeffekte und Notizen sind nicht mit Szenen verknüpft (nur Frontend-Dateien).
- Keine gebietsspezifische Übersichtskarte auf dem Wall Screen; Weltkarte ist ein fest eingebundenes Bild.
- Grid-Einstellungen gelten global und werden nicht gespeichert.
- Szenen lassen sich nur über `seed_data.json` pflegen (keine schreibenden Endpoints, Seeder aktualisiert bestehende DB nicht).

## Backend

- Nicht gefundene Datensätze erzeugen 500 statt 404 (Services werfen `ValueError`, Routen prüfen auf `None`).
- `/scenes/details/{id}` lädt alle Szenen und gibt bei unbekannter ID die **ganze Liste** zurück.
- `/scenes/details` ohne Slash landet vermutlich auf `/scenes/{scene_id}` → 422 (ungeprüft).
- `Scene.music_id` und `GraphicsGround.main` sind ungenutzte Spalten; `GraphicsWall.scene` hat fälschlich `uselist=False`.
- `crud.create`/`crud.update` ungenutzt; `crud.py` definiert eine Dummy-Klasse `Base`, die den ORM-Namen überschattet.
- Keine Migrationen: Schemaänderungen erfordern DB-Reset.
- `python-dotenv` wird importiert, steht aber nicht in `requirements.txt`.
- Keine Tests; CI läuft trotzdem grün.
- Seed: Ground „Level_up“ zeigt auf den `wall_screen`-Ordner; doppelte/unpassende Musiknamen; Beschreibungen großteils Copy-Paste.

## Frontend

- `DocumentReader` sucht in `public/story/noneFight/` (existiert nicht) → Tab „Side“ leer.
- Musik: Zufalls-Track-Auswahl nutzt teils die alte Playlist; Wiedergabe kann nach Trackende stoppen (ungeprüft).
- API-Base-URL fest verdrahtet, keine Env-Variablen; Fehler werden in Effects geworfen (unhandled rejections).
- `ResourceBarPlayer`: `spellData[].max` weicht von `SpellMax` ab (Stufe II: 4 vs. 3); Spezial startet bei 1 statt 3.
- E2E-Tests teilweise veraltet (`groundImg`-Selector existiert nicht mehr); `SceneDetailMock.json` nutzt noch `fight`.
- `eslint-plugin-react-hooks` installiert, aber nicht aktiv; viele `useEffect`-Abhängigkeiten fehlen.
- Docker-Image startet den Vite-Dev-Server (gedacht für die lokale Entwicklung mit Hot-Reload); ein Production-Image fehlt.
- README ist das unveränderte Vite-Template.

## Altlasten aus `v1-roguelike` (verworfen)

`map_locked.png`, `players`-Query-Parameter auf `/maps/main`,
Fehlermeldung „…on BattleMap“ in `crud.update`, Asset-Ordner `battle_maps`/`side_maps`.
