# Bekannte Lücken, Bugs & Altlasten

Stand: Analyse vom 2026-09-27, Backend-Struktur/Best Practices ergänzt am 2026-10-10, Alembic-Migrationen und Medien im Backend am 2026-10-11, Spieltisch per WebSocket am 2026-10-18, Audio auf der Wall am 2026-10-18 (seit DND-36 im Admin), Smartphones angebunden am 2026-10-18, Szenen ohne Kampf-Unterscheidung am 2026-10-24, Baseline der Qualitätsprüfungen am 2026-10-24. Punkte mit „(ungeprüft)“ wurden aus dem Code abgeleitet, aber nicht zur Laufzeit verifiziert.

## Lücken gegenüber der Vision

- Player-Ressourcen sind nur lokal, nicht persistiert und nicht pro Charakter konfigurierbar (seit DND-46 hat
  jeder Charakter einen eigenen Player Screen unter `/player/:id`, die Ressourcen sind dort aber für alle gleich).
- Keine NPC-, Charakter- oder Kampfdaten im Datenmodell – nur Markdown-Notizen.
- Kampf (seit DND-43 im Admin startbar, Initiative auch auf der Wall, „Am Zug“ im Player Screen): Der Ground zeigt
  noch nichts davon, und es gibt keine Kampfdaten über die Reihenfolge hinaus (keine Lebenspunkte, Werte, Gegnerkatalog).
- Soundeffekte und Notizen sind nicht mit Szenen verknüpft (nur Frontend-Dateien).
- Keine gebietsspezifische Übersichtskarte auf dem Wall Screen; Weltkarte ist ein fest eingebundenes Bild.
- Doppelte Mediendatei: `mapOverview.jpg` (Weltkarte im Wall Screen) liegt zusätzlich zu `media/` als Kopie in
  `frontend/public/assets/...`, weil sie fest im Frontend eingebunden ist und an keiner Szene hängt. Ablösen gehört zur
  Weltkarten-/Upload-Thematik. (Die Standardmusik kommt seit DND-26 nur noch aus dem Backend.)
- Ground-Raster: Zellgröße (seit DND-44, Panel „Einstellungen“) liegt in der Datenbank; Rasterfarbe (Panel „Spieltisch“) nur im
  Speicher des API-Prozesses und ist nach einem Neustart „Aus“.
- Szenen lassen sich nur über `seed_data.json` pflegen (keine schreibenden Endpoints, Seeder aktualisiert bestehende DB nicht).

## Backend

### Einschränkungen

- Der WebSocket-Verbindungsmanager hält die Verbindungen im Speicher des API-Prozesses: uvicorn muss mit **einem**
  Worker laufen (so in beiden Compose-Stacks). Mehrere Worker würden Pushes nur an einen Teil der Screens senden.
- Ein Server ist ein Spieltisch: keine parallelen Sessions, keine Authentifizierung.
- Der Musikzustand (Track, Play/Pause, Lautstärke, Audioausgabe) liegt nur im Speicher des API-Prozesses: Nach einem
  Neustart ist die Musik pausiert und die Lautstärke wieder 10 %. Die Wiedergabeposition wird nicht synchronisiert
  (eine neue Ausgabe startet den Track von vorn), Überblendungen gibt es nicht. Ebenso liegen Wall-Overlay und
  Rasterfarbe des Grounds nur im Speicher: Nach einem Neustart ist beides aus; die Zellgröße des Rasters steht seit
  DND-44 in der Datenbank und bleibt.
- Nach einem Reload ist das Admin-Fenster keine Audioausgabe mehr, bis dort wieder geklickt oder eine Taste gedrückt
  wird (der Browser gibt die Wiedergabe erst nach einer Nutzerinteraktion frei).
- `POST` ist per CORS nicht freigegeben: Die Soundeffekte (`POST /table/sounds`) funktionieren über den Proxy
  (gleicher Origin), nicht bei direktem Zugriff auf Port 8000 aus einem anderen Origin (z. B. Frontend mit absoluter
  `VITE_API_URL`).

### Bugs & Daten

- Seed: doppelte/unpassende Musiknamen; Beschreibungen großteils Copy-Paste.

## Frontend

- E2E-Tests (`npm run test:e2e`) aktivieren Szenen im Admin und speichern sie damit per `PATCH` dauerhaft in der
  Dev-DB (`adventure.active_scene_id`); Admin, Wall und Ground der Dev-Umgebung zeigen danach diese Szene. Danach schlagen die Backend-Tests fehl, die den Seed-Stand (keine aktive Szene)
  erwarten, bis die aktive Szene wieder geleert wird (z. B. `PATCH /adventures/1` mit `{"active_scene_id": null}`) oder
  die DB zurückgesetzt ist. Ebenso hängen sie an `global_level` der Dev-DB (Seed-Stand 1, `conftest.py`
  `expected_adventure_details`): Ein per `PATCH` geänderter Wert lässt sie ebenfalls fehlschlagen.
- `ResourceBarPlayer`: `spellData[].max` weicht von `SpellMax` ab (Stufe II: 4 vs. 3); Spezial startet bei 1 statt 3.
- Kontrast (seit DND-40): Die Notizseiten sind Kacheln in `secondary`; die Text-Links in den Notizen
  (Inhaltsverzeichnisse und Querverweise, `primary`) verfehlen darauf in Tavern 4,5:1 (3,3:1, `frontend/docs/design/contrast.md`); auf den
  durchscheinenden Kacheln über einem hellen Hintergrundbild (seit DND-41, Werte seit DND-42) in Tavern 3,0:1 und
  auch in Dark 4,0:1. Lösung offen. Defekte Querverweise (seit DND-48) stehen als Text in `error` und verfehlen 4,5:1
  in beiden Themes deutlich; sie sind ein Hinweis für den Spielleiter beim Pflegen der Notizen (Tooltip, gepunktete
  Unterstreichung) und kommen im geprüften Bestand nicht vor (`npm run test:unit`).

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
- jscpd (`frontend/.jscpd.json`, `threshold` 0,28 %): 1 Duplikat, 22 von 10.600 Zeilen (0,21 %, Stand
  2026-11-07): `darkTheme.ts` ↔ `tavernTheme.ts` (22 Zeilen).

**Backend**
- vulture (`backend/vulture_baseline.py`): Relationship `Adventure.active_scene` wird nirgends gelesen (nur
  `active_scene_id`). Falsch-Positive in `backend/vulture_whitelist.py` bzw. `[tool.vulture]` (Routen, Validatoren,
  Fixtures, `model_config`, Alembic-Kennungen, Pydantic-Felder `output_ready` und `ground_grid_cell_size`, ORM-Fremdschlüssel `avatar_media_id`).
- deptry: `app/realtime/push.py` importiert `starlette` (transitiv über fastapi, nicht deklariert). Bewusste
  Ausnahmen (Falsch-Positive): `uvicorn` und `psycopg2-binary` (nicht importiert, aber zur Laufzeit gebraucht).
- Komplexität: höchster Wert nach ruff/mccabe 8 (`game_table_socket` in `app/api/routes/ws.py`), daher
  `max-complexity = 8`. xenon (radon) für `app/`: Funktionen höchstens Rang B (`seed_data` 9, `_handle_message` und
  `game_table_socket` je 8), Module höchstens B, Durchschnitt A (1,8). Außerhalb von `app/` (nur ruff):
  `downgrade` in `migrations/versions/0002_media_table.py` (mccabe 7).
- pylint `duplicate-code` (`app/`, ab 8 Zeilen): keine Duplikate, `fail-under = 10`.
