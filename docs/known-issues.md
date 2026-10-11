# Bekannte Lücken, Bugs & Altlasten

Stand: Analyse vom 2026-09-27, Backend-Struktur/Best Practices ergänzt am 2026-10-10. Punkte mit „(ungeprüft)“ wurden aus dem Code abgeleitet, aber nicht zur Laufzeit verifiziert.

## Lücken gegenüber der Vision

- Player-Ressourcen sind nur lokal, nicht persistiert und nicht pro Charakter konfigurierbar.
- Keine NPC-, Charakter- oder Kampfdaten im Datenmodell – nur Markdown-Notizen.
- Soundeffekte und Notizen sind nicht mit Szenen verknüpft (nur Frontend-Dateien).
- Keine gebietsspezifische Übersichtskarte auf dem Wall Screen; Weltkarte ist ein fest eingebundenes Bild.
- Doppelte Mediendateien (seit DND-22): `mapOverview.jpg` (Weltkarte im Wall Screen) und `From_Past_To_Present.mp3`
  (Standardmusik im Admin Screen) liegen zusätzlich zu `media/` als Kopie in `frontend/public/assets/...`, weil sie fest
  im Frontend eingebunden sind und an keiner Szene hängen. Ablösen gehört zur Weltkarten-/Upload-Thematik.
- Grid-Einstellungen gelten global und werden nicht gespeichert.
- Szenen lassen sich nur über `seed_data.json` pflegen (keine schreibenden Endpoints, Seeder aktualisiert bestehende DB nicht).

## Backend

### Bugs & Daten

- Seed: Ground „Level_up“ zeigt auf den `wall_screen`-Ordner; doppelte/unpassende Musiknamen; Beschreibungen großteils Copy-Paste.
- README ist nur ein Zweizeiler – nicht löschen, sondern wie `frontend/README.md` aktualisieren (Zweck, Starten,
  Konfiguration, Befehle, Links auf `CLAUDE.md` und `../docs/`). **Erst nach dem Backend-Refactoring**, da sich
  Paketstruktur, Befehle und Konfiguration bis dahin noch ändern.

## Frontend

- `DocumentReader` sucht in `public/story/noneFight/` (existiert nicht) → Tab „Side“ leer.
- `ResourceBarPlayer`: `spellData[].max` weicht von `SpellMax` ab (Stufe II: 4 vs. 3); Spezial startet bei 1 statt 3.
