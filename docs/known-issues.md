# Bekannte Lücken, Bugs & Altlasten

Stand: Analyse vom 2026-09-27, Backend-Struktur/Best Practices ergänzt am 2026-10-10, Alembic-Migrationen und Medien im Backend am 2026-10-11. Punkte mit „(ungeprüft)“ wurden aus dem Code abgeleitet, aber nicht zur Laufzeit verifiziert.

## Lücken gegenüber der Vision

- Player-Ressourcen sind nur lokal, nicht persistiert und nicht pro Charakter konfigurierbar.
- Keine NPC-, Charakter- oder Kampfdaten im Datenmodell – nur Markdown-Notizen.
- Soundeffekte und Notizen sind nicht mit Szenen verknüpft (nur Frontend-Dateien).
- Keine gebietsspezifische Übersichtskarte auf dem Wall Screen; Weltkarte ist ein fest eingebundenes Bild.
- Doppelte Mediendateien: `mapOverview.jpg` (Weltkarte im Wall Screen) und `From_Past_To_Present.mp3`
  (Standardmusik im Admin Screen) liegen zusätzlich zu `media/` als Kopie in `frontend/public/assets/...`, weil sie fest
  im Frontend eingebunden sind und an keiner Szene hängen. Ablösen gehört zur Weltkarten-/Upload-Thematik.
- Grid-Einstellungen gelten global und werden nicht gespeichert.
- Szenen lassen sich nur über `seed_data.json` pflegen (keine schreibenden Endpoints, Seeder aktualisiert bestehende DB nicht).

## Backend

### Bugs & Daten

- Seed: doppelte/unpassende Musiknamen; Beschreibungen großteils Copy-Paste.

## Frontend

- `DocumentReader` sucht in `public/story/noneFight/` (existiert nicht) → Tab „Side“ leer.
- E2E-Tests (`npm run test:e2e`) aktivieren Szenen im Admin und speichern sie damit per `PATCH` dauerhaft in der
  Dev-DB (`adventure.active_scene_id`). Danach schlagen die Backend-Tests fehl, die den Seed-Stand (keine aktive Szene)
  erwarten, bis die aktive Szene wieder geleert wird (z. B. `PATCH /adventures/1` mit `{"active_scene_id": null}`) oder
  die DB zurückgesetzt ist.
- `ResourceBarPlayer`: `spellData[].max` weicht von `SpellMax` ab (Stufe II: 4 vs. 3); Spezial startet bei 1 statt 3.
