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
- Seed: `name`-Werte der Ground-Bilder (`graphics_ground`) heißen noch `battle_N` – sollten analog zu den Dateien
  `main_N` heißen.

## Frontend

- `DocumentReader` sucht in `public/story/noneFight/` (existiert nicht) → Tab „Side“ leer.
- `ResourceBarPlayer`: `spellData[].max` weicht von `SpellMax` ab (Stufe II: 4 vs. 3); Spezial startet bei 1 statt 3.
- README ist das unveränderte Vite-Template.
