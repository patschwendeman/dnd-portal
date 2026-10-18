# Bekannte Lücken, Bugs & Altlasten

Stand: Analyse vom 2026-09-27, Backend-Struktur/Best Practices ergänzt am 2026-10-10, Alembic-Migrationen und Medien im Backend am 2026-10-11, Spieltisch per WebSocket am 2026-10-18, Audio auf der Wall am 2026-10-18. Punkte mit „(ungeprüft)“ wurden aus dem Code abgeleitet, aber nicht zur Laufzeit verifiziert.

## Lücken gegenüber der Vision

- Player-Ressourcen sind nur lokal, nicht persistiert und nicht pro Charakter konfigurierbar.
- Keine NPC-, Charakter- oder Kampfdaten im Datenmodell – nur Markdown-Notizen.
- Soundeffekte und Notizen sind nicht mit Szenen verknüpft (nur Frontend-Dateien).
- Keine gebietsspezifische Übersichtskarte auf dem Wall Screen; Weltkarte ist ein fest eingebundenes Bild.
- Doppelte Mediendatei: `mapOverview.jpg` (Weltkarte im Wall Screen) liegt zusätzlich zu `media/` als Kopie in
  `frontend/public/assets/...`, weil sie fest im Frontend eingebunden ist und an keiner Szene hängt. Ablösen gehört zur
  Weltkarten-/Upload-Thematik. (Die Standardmusik kommt seit DND-26 nur noch aus dem Backend.)
- Grid-Einstellungen gelten global und werden nicht gespeichert; Wall-Overlay und Grid lassen sich nicht aus dem Admin
  steuern und werden nicht zwischen Geräten synchronisiert.
- Player Screens verbinden sich noch nicht mit dem Spieltisch (kein WebSocket, Theme nur lokal; geplant: DND-27).
- Der Admin zeigt nicht an, welche Screens verbunden sind (der Server kennt sie).
- Szenen lassen sich nur über `seed_data.json` pflegen (keine schreibenden Endpoints, Seeder aktualisiert bestehende DB nicht).

## Backend

### Einschränkungen

- Der WebSocket-Verbindungsmanager hält die Verbindungen im Speicher des API-Prozesses: uvicorn muss mit **einem**
  Worker laufen (so in beiden Compose-Stacks). Mehrere Worker würden Pushes nur an einen Teil der Screens senden.
- Ein Server ist ein Spieltisch: keine parallelen Sessions, keine Authentifizierung.
- Der Musikzustand (Track, Play/Pause, Lautstärke, Audioausgabe) liegt nur im Speicher des API-Prozesses: Nach einem
  Neustart ist die Musik pausiert und die Lautstärke wieder 10 %. Die Wiedergabeposition wird nicht synchronisiert
  (eine neue Ausgabe startet den Track von vorn), Überblendungen gibt es nicht.
- `POST` ist per CORS nicht freigegeben: Die Soundeffekte (`POST /table/sounds`) funktionieren über den Proxy
  (gleicher Origin), nicht bei direktem Zugriff auf Port 8000 aus einem anderen Origin (z. B. Frontend mit absoluter
  `VITE_API_URL`).

### Bugs & Daten

- Seed: doppelte/unpassende Musiknamen; Beschreibungen großteils Copy-Paste.

## Frontend

- `DocumentReader` sucht in `public/story/noneFight/` (existiert nicht) → Tab „Side“ leer.
- E2E-Tests (`npm run test:e2e`) aktivieren Szenen im Admin und speichern sie damit per `PATCH` dauerhaft in der
  Dev-DB (`adventure.active_scene_id`); Admin, Wall und Ground der Dev-Umgebung zeigen danach diese Szene. Danach schlagen die Backend-Tests fehl, die den Seed-Stand (keine aktive Szene)
  erwarten, bis die aktive Szene wieder geleert wird (z. B. `PATCH /adventures/1` mit `{"active_scene_id": null}`) oder
  die DB zurückgesetzt ist.
- `ResourceBarPlayer`: `spellData[].max` weicht von `SpellMax` ab (Stufe II: 4 vs. 3); Spezial startet bei 1 statt 3.
