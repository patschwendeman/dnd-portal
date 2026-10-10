# Bekannte Lücken, Bugs & Altlasten

Stand: Analyse vom 2026-09-27, Backend-Struktur/Best Practices ergänzt am 2026-10-10. Punkte mit „(ungeprüft)“ wurden aus dem Code abgeleitet, aber nicht zur Laufzeit verifiziert.

## Lücken gegenüber der Vision

- Player-Ressourcen sind nur lokal, nicht persistiert und nicht pro Charakter konfigurierbar.
- Keine NPC-, Charakter- oder Kampfdaten im Datenmodell – nur Markdown-Notizen.
- Soundeffekte und Notizen sind nicht mit Szenen verknüpft (nur Frontend-Dateien).
- Keine gebietsspezifische Übersichtskarte auf dem Wall Screen; Weltkarte ist ein fest eingebundenes Bild.
- Grid-Einstellungen gelten global und werden nicht gespeichert.
- Szenen lassen sich nur über `seed_data.json` pflegen (keine schreibenden Endpoints, Seeder aktualisiert bestehende DB nicht).

## Backend

### Bugs & Daten

- Nicht gefundene Datensätze erzeugen 500 statt 404 (Services werfen `ValueError`, Routen prüfen auf `None`).
- `/scenes/details/{id}` gibt bei unbekannter ID die **ganze Liste** zurück.
- `/scenes/details` ohne Slash landet auf `/scenes/{scene_id}` → 422 (`int_parsing`).
- Die Bugs dieses Abschnitts sind durch Charakterisierungstests (`backend/tests/`, `# known issue: …`) festgehalten;
  ein Fix-Task stellt die betroffenen Tests gezielt um.
- `Scene.music_id` und `GraphicsGround.main` sind ungenutzte Spalten.
- Keine Migrationen: Schemaänderungen erfordern DB-Reset.
- Seed: Ground „Level_up“ zeigt auf den `wall_screen`-Ordner; doppelte/unpassende Musiknamen; Beschreibungen großteils Copy-Paste.
- README ist nur ein Zweizeiler – nicht löschen, sondern wie `frontend/README.md` aktualisieren (Zweck, Starten,
  Konfiguration, Befehle, Links auf `CLAUDE.md` und `../docs/`). **Erst nach dem Backend-Refactoring**, da sich
  Paketstruktur, Befehle und Konfiguration bis dahin noch ändern.

### Struktur & Benennung

- Relation `Scene.music` ist eine Liste, heißt aber im Singular (Umbenennung ändert den API-Vertrag → Schema-Task).

### FastAPI & SQLAlchemy

- Keine Pydantic-Schemas, kein `response_model`: OpenAPI ohne Antworttypen, Antwortform hängt von `joinedload` ab,
  Vertrag zu `SceneDetail` im Frontend nicht abgesichert.

## Frontend

- `DocumentReader` sucht in `public/story/noneFight/` (existiert nicht) → Tab „Side“ leer.
- `ResourceBarPlayer`: `spellData[].max` weicht von `SpellMax` ab (Stufe II: 4 vs. 3); Spezial startet bei 1 statt 3.
