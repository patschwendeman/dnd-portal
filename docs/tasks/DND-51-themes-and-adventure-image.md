# DND-51: Themes „Cyber“ und „Taverne“, ein Abenteuerbild für beide Themes

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Bisher hängen Themes und Abenteuer zusammen: Jedes Abenteuer hat ein Hintergrundbild je Theme
(`background_dark` = `fight.jpg`, `background_tavern` = `tavern.jpg`, seit DND-42). Künftig sind die Themes
unabhängig vom Abenteuer. Die App bietet genau zwei Themes, „Cyber“ (das bisherige „Dunkel“) und „Taverne“. Vom
Abenteuer kommt nur noch ein Bild, das **Abenteuerbild**. Es liegt in beiden Themes hinter den Kacheln (Admin) bzw.
Karten (Charakterauswahl, Player Screen). Im bestehenden Abenteuer ist es `forest.jpg`. Am Spieltisch sieht man das
so: Ein Theme-Wechsel ändert nur die Farben, das Bild bleibt.

## Scope / Non-Goals

**Im Scope**
- Theme `dark` wird zu `cyber` (Label „Cyber“), `tavern` bleibt (Label „Taverne“). Die Farbpaletten bleiben
  unverändert. Das betrifft Backend, DB, API, WebSocket, Frontend und die Player-Abweichung.
- Abenteuer: Die Felder `background_dark`/`background_tavern` fallen weg, es gibt nur noch `image` (Abenteuerbild).
- Hintergrund in Admin, Charakterauswahl und Player Screen aus dem Abenteuerbild, in beiden Themes gleich
  abgedunkelt wie heute.
- Migration bestehender Datenbanken und Seed (`forest.jpg`).
- Doku (domain, screens, architecture, DESIGN.md, contrast.md) und Tests.

**Nicht im Scope**
- Abenteuerbild in der Abenteuerauswahl (späterer Task).
- Neue oder geänderte Farbpaletten, ein helles Theme.
- Bild im Admin wählen oder hochladen (es wird weiterhin per Seed bzw. Migration gesetzt).
- Wall und Ground (sie zeigen Szenenbilder, keinen Abenteuer-Hintergrund).

## Entscheidungen

### E1: Zwei Themes, Cyber und Taverne
- **Entscheidung:** Die Themes heißen „Cyber“ (`cyber`, die bisherige Palette `darkTheme`) und „Taverne“ (`tavern`,
  Palette unverändert). Der Bezeichner `dark` wird überall zu `cyber`, damit Code und UI denselben Namen tragen:
  `GameTableState.theme`/`GameTableUpdate.theme` = `"cyber" | "tavern"`, `game_table.theme` mit CHECK
  `IN ('cyber', 'tavern')`, Default `cyber`, `darkTheme.ts` → `cyberTheme.ts`.
- **Verworfene Alternativen:** Ein neues helles Theme statt der Taverne; nur das Label ändern und `dark` im Code
  behalten.
- **Begründung:** Wunsch des Users. Ohne gleichen Bezeichner würde `dark` im Code auf „Cyber“ in der UI zeigen.

### E2: Ein Abenteuerbild statt zwei Hintergründen
- **Entscheidung:** `adventure.image_media_id` (FK `media.id`, nullable), in der API `AdventureDetail.image:
  Image | null`. Die Felder `background_dark`/`background_tavern` und ihre Spalten entfallen. Das Feld heißt `image`
  und nicht `background`, weil dasselbe Bild später auch in der Abenteuerauswahl erscheinen soll.
- **Verworfene Alternativen:** Die Felder pro Theme behalten und auf dasselbe Bild setzen.
- **Begründung:** Themes sollen nicht mehr vom Abenteuer abhängen.

### E3: Darstellung in beiden Themes gleich
- **Entscheidung:** Das Bild wird in beiden Themes so abgedunkelt wie heute. Es wechselt nur mit dem Abenteuer.
  Ein Theme-Wechsel ändert das Bild nicht und löst keine Überblendung aus.
- **Verworfene Alternativen:** Ein Bild, das im jeweiligen Theme anders aussieht (aufgehellt oder abgedunkelt).

### E4: Bestehende Werte werden übernommen
- **Entscheidung:** Die Migration `0009` setzt `game_table.theme` von `dark` auf `cyber`. Sie füllt `image_media_id`
  für jedes Abenteuer mit dem Medium `storage_key = images/wall_screen/forest.jpg` (fehlt es, bleibt die Spalte leer)
  und entfernt die beiden Hintergrundspalten. `downgrade` stellt `dark` und die beiden Spalten wieder her und füllt
  sie wie `0006` (`fight.jpg`/`tavern.jpg`). Auf dem Player wird eine gespeicherte Abweichung `dark`
  (`localStorage` `playerThemeOverride`) als `cyber` gelesen und umgeschrieben, statt verworfen zu werden.
- **Begründung:** Bestehende Datenbanken und Geräte laufen ohne Reset weiter (wie bei den bisherigen Migrationen).

## Subtasks

### Vertrag
- [x] `Theme = "cyber" | "tavern"` in `GameTableState`/`GameTableUpdate` (`theme: "dark"` → 422).
- [x] `AdventureDetail`: `image: Image | null` statt `background_dark`/`background_tavern`.

### Backend
- [x] `schemas/game_table.py`, `models/game_table.py` (CHECK, Default `cyber`) anpassen.
- [x] `models/adventure.py`: Relationship `image` statt der beiden Hintergründe. Dazu `schemas/adventure.py` und
      `crud/adventure.py` (joinedload) anpassen.
- [x] Migration `0009_adventure_image_and_cyber_theme.py` nach E4 (upgrade + downgrade).
- [x] `seed_data.json`: `image_media_id` = Forest (Media 1) statt der beiden Hintergrund-IDs, Seeder anpassen.
- [x] `openapi.json` neu erzeugen.
- [x] Tests: `test_table`, `test_adventures`, `test_ws`, `test_seed`, `test_fight`, `conftest` anpassen. Neu
      `test_migration_0009.py` (Upgrade mit Daten aus 0008 inkl. `dark` → `cyber`, Bild = forest, fehlendes
      Medium → NULL; Downgrade).

### Frontend
- [x] `api/schema.d.ts` regenerieren, `models/models.ts` (`Theme`, `AdventureDetail`) anpassen.
- [x] `style/darkTheme.ts` → `style/cyberTheme.ts` (Inhalt unverändert), `appTheme.ts`, `styled.d.ts` anpassen.
- [x] `realtime/messages.ts`, `GameTableProvider.tsx`, `context/context.ts`: `dark` → `cyber` (auch
      Default-/Fallback-Werte).
- [x] `utils/playerTheme.ts`: Themes `cyber`/`tavern`, gespeichertes `dark` wird als `cyber` gelesen und
      umgeschrieben (E4).
- [x] `utils/adventureBackground.ts`: `adventureBackgroundSource(adventure)` liefert `adventure?.image?.source`
      ohne Theme-Parameter. Aufrufer (Admin, Charakterauswahl, Player) anpassen.
- [x] `SettingsPanel.tsx`, `SettingsMenu.tsx`: Optionen „Cyber“ (`cyber`) und „Taverne“ (`tavern`). Im Player-Menü
      bleibt „Wie Spieltisch“.
- [x] Tests: Unit (`adventureBackground`, `playerTheme`, `realtimeMessages`, `gameTableConnection`, `saveData`
      u. a.) und BDD (`adminSettings.feature` + Steps, `playerSelect`, `selectScene`) auf `cyber`/„Cyber“ und das
      Abenteuerbild umstellen.

### Doku
- [x] `docs/domain.md`: Theme (`cyber`/`tavern`), neuer Begriff „Abenteuerbild“ (`adventure.image`).
- [x] `docs/screens.md`: Admin (Hintergrund, Einstellungen), Charakterauswahl/Player (Hintergrund, Theme-Wahl).
- [x] `docs/architecture.md`: Schemas, Tabelle `adventure`/`game_table`, Migration `0009`, Player-Abweichung,
      Ordner `src/style`.
- [x] `frontend/DESIGN.md`, `frontend/docs/design/contrast.md`: Dark → Cyber (Werte unverändert).
- [x] `docs/known-issues.md` prüfen (Verweis `darkTheme.ts` ↔ `tavernTheme.ts`).

## Akzeptanzkriterien

### AK1: Theme-Auswahl im Admin
- **Given** der Admin ist geöffnet
- **When** der Spielleiter in „Einstellungen“ → „Darstellung“ die Theme-Auswahl öffnet
- **Then** stehen genau „Cyber“ und „Taverne“ zur Wahl, und eine Wahl gilt wie bisher für alle verbundenen Screens

### AK2: Abenteuerbild in beiden Themes
- **Given** das aktive Abenteuer hat das Abenteuerbild `forest.jpg`
- **When** Admin, Charakterauswahl oder Player Screen im Theme „Cyber“ oder „Taverne“ angezeigt werden
- **Then** liegt in beiden Themes `forest.jpg` abgedunkelt hinter den Kacheln bzw. Karten

### AK3: Theme-Wechsel lässt das Bild stehen
- **Given** das Abenteuerbild wird angezeigt
- **When** der Spielleiter das Theme wechselt
- **Then** ändern sich nur die Farben, das Bild bleibt ohne Neuladen und ohne Überblendung

### AK4: Ohne Abenteuerbild
- **Given** das aktive Abenteuer hat kein Abenteuerbild (oder es lädt nicht)
- **When** Admin oder Player angezeigt werden
- **Then** ist der Hintergrund einfarbig in der Hintergrundfarbe des Themes und die Flächen sind deckend (wie heute)

### AK5: Bestehende Installation läuft weiter
- **Given** eine Datenbank auf Stand `0008` mit Theme `dark` und ein Player-Gerät mit gespeicherter Abweichung `dark`
- **When** das Backend mit `0009` startet und der Player geöffnet wird
- **Then** ist das Spieltisch-Theme „Cyber“, das Abenteuer hat `forest.jpg` als Abenteuerbild, und der Player zeigt
  weiterhin „Cyber“ als eigene Wahl

### AK6: Alter Theme-Wert wird abgelehnt
- **Given** das Backend läuft mit `0009`
- **When** `PATCH /table {"theme": "dark"}` gesendet wird
- **Then** antwortet es mit 422 und nichts ändert sich

## Teststrategie / Verifikation

**Automatisch**
- Backend: angepasste Tests, neu `test_migration_0009.py`. `pytest`, Lint und Typcheck grün.
- Frontend: Unit- und BDD-Tests angepasst (Theme-Optionen, Bildquelle ohne Theme, Abweichung `dark` → `cyber`).
  Lint, `tsc` und Build grün.

**Manuell**
1. Bestehende DB migrieren, Admin öffnen: Wald-Bild hinter den Kacheln, Theme „Cyber“ gewählt.
2. Auf „Taverne“ wechseln: Farben wechseln, das Bild bleibt stehen.
3. Player auf zweitem Gerät/Fenster: gleiches Bild, Theme folgt dem Spieltisch, die eigene Wahl funktioniert.

## Offene Fragen
- keine

## Review
