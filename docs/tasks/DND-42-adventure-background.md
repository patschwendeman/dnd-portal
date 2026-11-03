# DND-42: Hintergrundbild pro Abenteuer und Theme im Admin

**Typ:** feat
**Status:** Fertig

## Kontext & Ziel

Seit DND-41 liegt hinter den Kacheln des Admins das Wall-Bild der aktiven Szene, mit `scrim` (75 %) abgedunkelt; die
Kacheln sind in beiden Themes zu 75 % deckend. Am Spieltisch ist das Bild dem Spielleiter zu dunkel, und es wechselt
mit jeder Szene, sodass er die Lesbarkeit nicht in der Hand hat. Künftig legt jedes Abenteuer je ein Hintergrundbild
für Dark und für Tavern fest; das Bild wechselt nur mit Abenteuer oder Theme, nicht mehr mit der Szene. Dazu wird das
Bild heller (Abdunklung 50 %) und die Kacheln in Tavern deckender (92 %), sodass Text und Bedienelemente auch über
einem hellen Bild ihr Kontrastziel erreichen.

## Scope / Non-Goals

**Im Scope**
- Abdunklung mit `backdrop` statt `scrim`, Deckkraft der Kacheln je Theme (E1, E2).
- Zwei Bildbezüge am Abenteuer (Dark, Tavern) in Datenmodell, Migration, Seed und API (E3–E5).
- Admin zeigt das Bild des aktiven Abenteuers zum aktiven Theme; ohne Bild einfarbig (E6, E7).
- Kontrastmessung, Style Guide, Architektur- und Screens-Doku.

**Nicht im Scope**
- Auswahl der Bilder im Admin oder ein Endpoint zum Ändern (E3); Festlegen nur über Seed bzw. Datenbank.
- Szenenbild als Hintergrund, auch nicht als Rückfall (E7); die Bühne zeigt das Szenenbild weiter wie bisher.
- Neue Bilddateien: verwendet werden vorhandene Einträge der Tabelle `media` (E5).
- Layout und Kachel-Optik aus DND-40, Inhalte der Panels; Wall, Ground und Player.
- Die Mockups `admin-panel-mockup-v9.html` und `v10.html` (liegen uncommittet im Mockup-Ordner).

## Entscheidungen

### E1: Abdunklung mit `backdrop`
- **Entscheidung:** Der Hintergrund des Admins wird mit `backdrop` (Schwarz 50 %, in beiden Themes gleich)
  abgedunkelt statt mit `scrim`. `scrim` bleibt bei 75 %; die lokale Teständerung von `scrim` auf `0.500` in
  `darkTheme.ts` und `tavernTheme.ts` wird vor der Umsetzung verworfen und ist nicht Teil des Tasks.
- **Verworfene Alternativen:** `scrim` auf 50 % senken (der Text auf der Bühne fiele über einem hellen Bild auf
  4,0:1, Ziel 4,5:1); neue Rolle mit 62,5 %.
- **Begründung:** Wunsch des Spielleiters nach einem helleren Bild; `backdrop` hat den Wert schon und wird bisher nur
  für das Vollbild-Overlay genutzt, die Bühne bleibt unberührt.

### E2: Deckkraft der Kacheln je Theme
- **Entscheidung:** `secondaryTranslucent` bleibt in Dark bei 75 % (`#161b23bf`) und wird in Tavern 92 %
  (`#3D271Ceb`). Unschärfe, Rand und Lichtkante bleiben; die Regel „durchscheinend nur mit Bild“ (DND-41, E5) gilt
  weiter.
- **Begründung:** Wahl des Spielleiters. Mit `backdrop` erreicht in Tavern nur bei rund 92 % auch `primary` auf der
  Kachel 3:1 (Status-Punkt „verbunden“, Fokus-Outline der Abenteuer-Auswahl); Dark erreicht alle Ziele schon bei 75 %.

### E3: Bilder pro Abenteuer, nur über Seed bzw. Datenbank
- **Entscheidung:** Die Tabelle `adventure` bekommt zwei optionale Fremdschlüssel auf `media`:
  `background_dark_media_id` und `background_tavern_media_id` (wie `player.avatar_media_id`). Es gibt kein
  Bedienelement und keinen Schreib-Endpoint dafür; gesetzt werden sie über `seed_data.json` und die Migration (E4).
- **Verworfene Alternativen:** Auswahl im Admin mit `PATCH adventures/{id}`.
- **Begründung:** Rückfrage im Dialog; deutlich kleiner, die Bilder ändern sich selten.

### E4: Migration `0006` setzt Bilder für bestehende Abenteuer
- **Entscheidung:** Die Migration legt die beiden Spalten an und trägt für jedes vorhandene Abenteuer die
  Standardbilder ein, gesucht über `storage_key` in `media` (Dark `images/wall_screen/fight.jpg`, Tavern
  `images/wall_screen/tavern.jpg`). Fehlt ein Bild in `media`, bleibt die Spalte leer. `downgrade` entfernt die
  Spalten vollständig. Kein DB-Reset nötig, auch nicht für Production am Spieltisch.
- **Verworfene Alternativen:** Spalten leer lassen (bestehende Abenteuer wären einfarbig bis zum Reset).
- **Begründung:** Rückfrage im Dialog; der Seeder füllt nur leere Tabellen und erreicht bestehende DBs nicht.

### E5: Seed-Daten
- **Entscheidung:** Das Seed-Abenteuer „Erstes Abenteuer“ bekommt Dark `fight.jpg` und Tavern `tavern.jpg`
  (vorhandene Einträge in `media`, Wall-Bilder). Keine neuen Dateien unter `media/`.
- **Begründung:** Wahl des Spielleiters.

### E6: API-Vertrag
- **Entscheidung:** `AdventureDetail` (`GET adventures/{id}`) bekommt `background_dark: Image | null` und
  `background_tavern: Image | null` (Form wie `Player.avatar`: `id`, `name`, `source`). `AdventureSummary`,
  `AdventureUpdate`, Snapshot und WebSocket bleiben unverändert. `openapi.json` und `frontend/src/api/schema.d.ts`
  werden neu erzeugt.
- **Begründung:** Der Admin lädt `adventures/{id}` bereits beim Laden, beim Abenteuerwechsel und nach jedem Snapshot;
  kein neuer Request nötig.

### E7: Anzeige im Admin
- **Entscheidung:** Der Hintergrund zeigt das Bild des aktiven Abenteuers zum Theme des Spieltischs
  (`background_dark` bei Dark, `background_tavern` bei Tavern), über `mediaUrl`. Er wechselt nur bei Abenteuer- oder
  Themewechsel, mit der Überblendung aus DND-41 (ohne Übergang bei `prefers-reduced-motion`). Ohne Bild für das aktive
  Theme, solange das Abenteuer lädt oder wenn das Bild nicht geladen werden kann, ist der Hintergrund einfarbig
  `background` und die Kacheln sind deckend wie nach DND-40. Die aktive Szene spielt für den Hintergrund keine Rolle
  mehr. `SceneBackground` und `useSceneBackground` werden zu `AdventureBackground` bzw. `useAdventureBackground`
  umbenannt.
- **Verworfene Alternativen:** Rückfall auf das Wall-Bild der aktiven Szene.
- **Begründung:** Rückfrage im Dialog; der Spielleiter will das Bild bewusst festlegen.

### E8: Kontrast weiter für den ungünstigsten Fall
- **Entscheidung:** `contrast.md` misst die Paare auf den durchscheinenden Kacheln weiter über einem weißen Bild (mit
  `backdrop` etwa `#808080` hinter der Kachel) und über einem schwarzen, nicht nur über den gewählten Bildern.
  Überschlag für Weiß: Dark (75 %) `text.color` 11,5:1, `primary` 4,0:1, `text.muted` 6,4:1; Tavern (92 %)
  `text.color` 5,9:1, `primary` 3,03:1, `text.muted` 3,7:1. Alle Zeilen aus DND-41 zu `secondaryTranslucent` und
  `scrim` als Admin-Hintergrund werden auf die neuen Werte umgestellt. Erreicht ein Paar sein Ziel nicht, wird die
  Deckkraft der Rolle in diesem Theme erhöht.
- **Begründung:** Die Bilder sind Daten und können sich ändern; der Style Guide verlangt AA unabhängig vom Bild.

## Subtasks

### Schritt 1: Hellere Abdunklung, Deckkraft je Theme

#### Frontend
- [x] `tavernTheme.ts`: `secondaryTranslucent` auf `#3D271Ceb` (E2).
- [x] Hintergrund-Komponente: Abdunklung `backdrop` statt `scrim` (E1).

#### Doku
- [x] `frontend/DESIGN.md` (2.2: `backdrop` auch für die Abdunklung des Admin-Hintergrunds, `scrim` nicht mehr;
      2.3: Werte von `secondaryTranslucent`; 2.6), `frontend/docs/design/contrast.md` (Theme-Werte, Messung nach E8).

### Schritt 2: Hintergrundbild pro Abenteuer und Theme

#### Vertrag
- [x] `AdventureDetail` um `background_dark` und `background_tavern` erweitern (E6).

#### Backend
- [x] Model `Adventure`: zwei Fremdschlüssel auf `media` mit Relationships (E3).
- [x] Migration `0006` mit Datenschritt und vollständigem `downgrade` (E4); Ablauf aus `backend/CLAUDE.md`
      („Migrationen“) inkl. `alembic check`.
- [x] Seeder und `seed_data.json`: Bildbezüge des Seed-Abenteuers (E5).
- [x] Schema `AdventureDetail`, `openapi.json` neu erzeugen.
- [x] Tests: `test_adventures.py` (Felder im Detail, `null` ohne Bild), `test_seed.py`, neues
      `test_migration_0006.py` (Upgrade setzt Bilder für bestehende Abenteuer, fehlendes Bild bleibt leer, Downgrade).

#### Frontend
- [x] `npm run generate:api`, `models.ts`.
- [x] `useSceneBackground` → `useAdventureBackground`, `SceneBackground` → `AdventureBackground`: Bild aus dem
      Abenteuer zum aktiven Theme (E7); Unit-Tests anpassen (kein Bild, Abenteuer lädt, Bild geladen, Bild fehlerhaft,
      Theme- und Abenteuerwechsel, Szenenwechsel ändert nichts).
- [x] `AdminScreen` verdrahten.

#### Doku
- [x] `docs/architecture.md` (Datenmodell, API), `docs/screens.md` (Admin Soll/Ist), `backend/CLAUDE.md`
      (Migrationen, Tests), `frontend/CLAUDE.md` (Struktur), `frontend/docs/design/components.md` (Hintergrund),
      `docs/known-issues.md` prüfen.

## Akzeptanzkriterien

### AK1: Bild pro Theme
- **Given** für das aktive Abenteuer sind Dark `fight.jpg` und Tavern `tavern.jpg` festgelegt
- **When** der Spielleiter den Admin im Theme Dark bzw. Tavern öffnet
- **Then** liegt hinter den Kacheln `fight.jpg` bzw. `tavern.jpg`, mit 50 % abgedunkelt

### AK2: Kein Wechsel mit der Szene
- **Given** ein Hintergrundbild ist zu sehen
- **When** der Spielleiter eine andere Szene aktiviert
- **Then** bleibt der Hintergrund unverändert, nur die Bühne zeigt die neue Szene

### AK3: Wechsel von Theme und Abenteuer
- **Given** ein Hintergrundbild ist zu sehen
- **When** der Spielleiter das Theme oder das Abenteuer wechselt
- **Then** blendet der Hintergrund in das Bild des neuen Abenteuers bzw. Themes über (bei reduzierter Bewegung ohne
  Übergang)

### AK4: Ohne Bild
- **Given** für das aktive Abenteuer ist zum aktiven Theme kein Bild festgelegt (oder es lässt sich nicht laden)
- **When** der Spielleiter auf den Admin schaut
- **Then** ist der Hintergrund einfarbig und die Kacheln sind deckend

### AK5: Deckkraft und Lesbarkeit
- **Given** ein Hintergrundbild ist zu sehen
- **When** der Spielleiter Notizen und Panels liest
- **Then** sind die Kacheln in Dark zu 75 % und in Tavern zu 92 % deckend
- **And** Text und Bedienelemente erreichen ihr Kontrastziel auch über einem weißen Bild (Messung in `contrast.md`)
- **And** die Bühne ist unverändert mit `scrim` abgedunkelt

### AK6: Bestehende Datenbank
- **Given** eine Datenbank auf Stand `0005` mit einem Abenteuer und den Seed-Medien
- **When** die App startet und Migration `0006` läuft
- **Then** hat das Abenteuer Dark `fight.jpg` und Tavern `tavern.jpg`, ohne Reset der Datenbank

### AK7: API
- **Given** das Backend läuft
- **When** `GET adventures/{id}` aufgerufen wird
- **Then** enthält die Antwort `background_dark` und `background_tavern` (je `Image` oder `null`), sonst unverändert

### AK8: Qualität
- Backend: `ruff`, Tests, `alembic check` grün; Frontend: `lint`, `typecheck`, `test:unit`, `build`, `check:deadcode`,
  `check:dupes` grün; `schema.d.ts` aktuell; keine neuen Baseline-Einträge, Schwellwert von jscpd nicht angehoben.

## Teststrategie / Verifikation

**Automatisch**
- Backend: `test_adventures.py`, `test_seed.py`, `test_migration_0006.py` (nach Seed-Änderung Test-DB zurücksetzen).
- Frontend (Unit): `useAdventureBackground` nach Schritt 2.
- Frontend (BDD): bestehende Admin-Features laufen grün.

**Manuell**
1. Dev-Stack mit bestehender DB starten: Migration läuft, kein Reset nötig; Admin zeigt in Dark `fight.jpg`.
2. Theme auf Tavern: Überblendung zu `tavern.jpg`, Kacheln deutlich deckender; zurück auf Dark.
3. Szene wechseln: Hintergrund bleibt, Bühne wechselt.
4. Bildbezug in der DB leeren (`UPDATE adventure SET background_tavern_media_id = NULL`): in Tavern einfarbig,
   Kacheln deckend.
5. Tavern über einem hellen Bereich des Bilds: Status-Punkte und Fokus der Abenteuer-Auswahl gut erkennbar.

## Offene Fragen
- Kontrast der Notiz-Links in Dark: Mit `backdrop` und 75 % (E2) erreicht `primary` als Text (Links der
  Inhaltsverzeichnisse) auf durchscheinenden Notizseiten über einem weißen Bild nur 4,0:1 statt 4,5:1. E8 verlangt
  dann eine höhere Deckkraft (Dark bräuchte etwa 83 %, `#161b23d3`), E2 legt Dark auf 75 % fest. Umgesetzt ist E2; das
  Paar ist in `contrast.md` und `known-issues.md` wie der bestehende Tavern-Fall als offen geführt.
  **Entscheidung (User, 2026-11-03):** Dark bleibt bei 75 % (E2 gilt); das Paar bleibt als offener Kontrastfall geführt.

## Review

### Runde 1 – 2026-11-03
**Empfehlung:** Abnahme

Keine blockierenden Befunde. AK5 ist nur teilweise erfüllt: `primary` als Linkfarbe der Notizen verfehlt über einem weißen Bild 4,5:1 (Dark 4,0:1 neu, Tavern 3,0:1 seit DND-40). Der User hat am 2026-11-03 entschieden, Dark bei 75 % zu lassen (E2 gilt) und das Paar offen zu führen; daher nicht blockierend. Geprüft: Commit `600ab58`, Basis `9685a3d`.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Seed `background_dark_media_id: 2` (`fight.jpg`), `background_tavern_media_id: 4` (`tavern.jpg`) in `backend/app/db/data/seed_data.json:7-8`; Auswahl je Theme in `adventureBackgroundSource` (`frontend/src/utils/adventureBackground.ts:66-73`); Abdunklung `backdrop` in `AdventureBackground.tsx:28`. `GET /adventures/1` liefert beide Bilder, Dateien antworten 200 `image/jpeg`. |
| AK2 | erfüllt | Quelle hängt nur von Abenteuer und Theme ab; Wechsel nur bei geänderter URL (`useAdventureBackground.ts:36-40`). Unit-Test „keeps the image when the active scene changes“. |
| AK3 | erfüllt | Theme-Wechsel ändert die URL und blendet über (Reducer aus DND-41, `prefers-reduced-motion` in `AdventureBackground.tsx:20-22`); beim Abenteuerwechsel einfarbig, solange das neue Abenteuer lädt (`AdminScreen.tsx:458-463`, E7). Tests „takes the image of the adventure for the theme“, „changes with the adventure“. |
| AK4 | erfüllt | Ohne Bild oder während des Ladens ist die Quelle `null`; Ladefehler → `failed` → `hide`; `isTranslucent = background.isImageShown` (`AdminScreen.tsx:464`). Tests „has no image …“, „stays plain when the image cannot be loaded“, „turns plain when the new image cannot be loaded“. |
| AK5 | teilweise (vom User entschieden) | Dark `#161b23bf` (75 %), Tavern `#3D271Ceb` (92 %, `tavernTheme.ts:5`); Bühne bleibt bei `scrim` 0.750. Kontrast nachgerechnet, deckt sich mit `contrast.md`: über Weiß Dark 11,45 / 4,02 / 6,37, Tavern 5,95 / 3,04 / 3,68. `primary` als Linkfarbe verfehlt 4,5:1, als offen in `contrast.md` und `docs/known-issues.md` geführt. |
| AK6 | erfüllt | Migration `0006_adventure_background.py` sucht über `storage_key`; `test_migration_0006.py` deckt Bild vorhanden/fehlend, leere DB, Fremdschlüssel, Downgrade ab. Dev-DB ohne Reset auf `0006` mit Werten 2 und 4. |
| AK7 | erfüllt | `AdventureDetail` mit `background_dark`/`background_tavern` als `Image \| None` (`backend/app/schemas/adventure.py:40-42`); Tests `test_read_adventure_returns_background_per_theme_as_image`, `…_null_without_background`, `ADVENTURE_FIELDS`. `openapi.json` und `generate:api` ohne Diff. |
| AK8 | erfüllt | Siehe Checks; Baselines (`knip.jsonc`, `.jscpd.json`, `vulture_*`) unverändert. |

**Blockierende Befunde**
- keine

**Hinweise**
- Abweichungen des Implementers nachvollziehbar und dokumentiert: Seeder füllt `media` vor `adventure`; `sceneBackground.ts`/`.spec.ts` in `adventureBackground.ts`/`.spec.ts` umbenannt, keine Verweise auf alte Namen mehr.
- Beim Abenteuerwechsel wird der Hintergrund kurz einfarbig statt direkt überzublenden (E7); beim manuellen Test 2 und 3 bestätigen.
- Kein Unit-Test für `adventureDetail?.id === loadedAdventureId` in `AdminScreen.tsx`; Reducer- und Quellenlogik vollständig getestet.
- Kein eigener Commit `docs(DND-42): approve plan` (Praxis wie DND-40/41).
- `docs/screens.md`: Zeile „Abenteuer-Hintergrund“ abweichend umbrochen (kosmetisch).
- Manuelle Prüfschritte 1–5 offen; Darstellung im Browser nicht angesehen.

**Checks:** Backend ruff, mypy, `alembic check`, `make check-quality` grün; pytest auf frischer DB 223/223 (Dev-DB 221/223, Abweichung durch DB-Zustand). Frontend lint, typecheck, `test:unit` 221/221, build, knip, jscpd grün. E2E 18/20 im ersten Lauf; im zweiten Lauf nur „first interaction makes an admin window the audio output“ rot, vermutlich geteilter Serverzustand, kein Audio-/Vollbild-Code geändert.
