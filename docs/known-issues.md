# Bekannte Lücken, Bugs & Altlasten

Stand: Analyse vom 2026-09-27, Backend-Struktur/Best Practices ergänzt am 2026-10-10, Alembic-Migrationen und Medien im Backend am 2026-10-11, Spieltisch per WebSocket am 2026-10-18, Audio auf der Wall am 2026-10-18, Smartphones angebunden am 2026-10-18, Szenen ohne Kampf-Unterscheidung am 2026-10-24, Baseline der Qualitätsprüfungen am 2026-10-24. Punkte mit „(ungeprüft)“ wurden aus dem Code abgeleitet, aber nicht zur Laufzeit verifiziert.

## Lücken gegenüber der Vision

- Player-Ressourcen sind nur lokal, nicht persistiert und nicht pro Charakter konfigurierbar.
- Keine NPC-, Charakter- oder Kampfdaten im Datenmodell – nur Markdown-Notizen.
- Einen Kampf kann der Spielleiter noch nicht starten: Seit DND-29 sind alle Szenen gleich, der Menüpunkt „Kampf“
  im Admin (und was Wall und Ground bei einem Kampf zeigen) folgt in einem eigenen Task.
- Soundeffekte und Notizen sind nicht mit Szenen verknüpft (nur Frontend-Dateien).
- Keine gebietsspezifische Übersichtskarte auf dem Wall Screen; Weltkarte ist ein fest eingebundenes Bild.
- Doppelte Mediendatei: `mapOverview.jpg` (Weltkarte im Wall Screen) liegt zusätzlich zu `media/` als Kopie in
  `frontend/public/assets/...`, weil sie fest im Frontend eingebunden ist und an keiner Szene hängt. Ablösen gehört zur
  Weltkarten-/Upload-Thematik. (Die Standardmusik kommt seit DND-26 nur noch aus dem Backend.)
- Grid-Einstellungen gelten global und werden nicht gespeichert; das Grid lässt sich nicht aus dem Admin steuern und
  wird nicht zwischen Geräten synchronisiert.
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

## Baseline der Qualitätsprüfungen

Bestehende Funde bei Einführung der Prüfungen (DND-31); sie sind als Baseline erfasst und brechen die CI nicht. Aufräumen
in Folge-Tasks, danach den Eintrag in der jeweiligen Ignore-Liste entfernen bzw. die Grenze verschärfen.

**Frontend**
- knip (`frontend/knip.jsonc`): Dev-Dependency `eslint-plugin-react-refresh` wird nicht genutzt (nicht in
  `eslint.config.js`). Exporte, die nur in der eigenen Datei verwendet werden: `MEDIA_PATH`, `getRandomNumber`
  (`__tests__/bdd/support/helpers.ts`), `LoadError` (`src/api/loadData.ts`), `RECONNECT_BASE_DELAY_MS`,
  `RECONNECT_MAX_DELAY_MS` (`src/realtime/backoff.ts`); Typen `TextButtonVariant` (`TextButton.tsx`), `Image`
  (`models.ts`), `OtherServerMessage` (`connection.ts`), `SoundListener` (`useGameTable.ts`). Falsch-Positive: die
  Exporte des generierten `src/api/schema.d.ts`.
- jscpd (`frontend/.jscpd.json`, `threshold` 2,09 %): 6 Duplikate, 88 von 4221 Zeilen (2,08 %), u. a.
  `AdventureSelect.tsx` ↔ `ThemeMenu.tsx` (3 Blöcke, 11–16 Zeilen), `darkTheme.ts` ↔ `tavernTheme.ts` (17 Zeilen),
  `ScreenControlBar.tsx` ↔ `AdminScreen.tsx` (17 Zeilen), `NavRail.tsx` ↔ `SideBarLeftElement.tsx` (11 Zeilen).

**Backend**
- vulture (`backend/vulture_baseline.py`): Relationship `Adventure.active_scene` wird nirgends gelesen (nur
  `active_scene_id`). Falsch-Positive in `backend/vulture_whitelist.py` bzw. `[tool.vulture]` (Routen, Validatoren,
  Fixtures, `model_config`, Alembic-Kennungen, Pydantic-Feld `output_ready`, ORM-Fremdschlüssel `avatar_media_id`).
- deptry: `app/realtime/push.py` importiert `starlette` (transitiv über fastapi, nicht deklariert). Bewusste
  Ausnahmen (Falsch-Positive): `uvicorn` und `psycopg2-binary` (nicht importiert, aber zur Laufzeit gebraucht).
- Komplexität: höchster Wert nach ruff/mccabe 8 (`game_table_socket` in `app/api/routes/ws.py`), daher
  `max-complexity = 8`. xenon (radon) für `app/`: Funktionen höchstens Rang B (`seed_data` 9, `_handle_message` und
  `game_table_socket` je 8), Module höchstens B, Durchschnitt A (1,8). Außerhalb von `app/` (nur ruff):
  `downgrade` in `migrations/versions/0002_media_table.py` (mccabe 7).
- pylint `duplicate-code` (`app/`, ab 8 Zeilen): keine Duplikate, `fail-under = 10`.
