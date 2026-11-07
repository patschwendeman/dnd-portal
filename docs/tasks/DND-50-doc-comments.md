# DND-50: Fehlende Doc-Kommentare nach CONTRIBUTING.md ergänzen

**Typ:** chore
**Status:** Entwurf

## Kontext & Ziel

CONTRIBUTING.md legt unter [„Code comments“](../../CONTRIBUTING.md#code-comments) fest: Docstrings an jeder Route und
an Service-Funktionen mit nicht offensichtlichem Verhalten, im Frontend `/** */` an Exporten mit nicht offensichtlichem
Verhalten. Der Code hält das noch nicht ein: 15 Routen haben keinen Docstring (ihre OpenAPI-`description` fehlt),
mehrere Service- und Realtime-Funktionen erklären ihr Verhalten nicht, und im Frontend gibt es kein einziges `/** */`.
Bestehende Erklärungen stehen dort als `//` und erscheinen deshalb nicht beim Hovern im Editor. Ziel: Die Regel gilt
im ganzen Code, ohne dass sich Verhalten ändert.

## Invarianten
- Kein Verhalten geändert: nur Kommentare, Docstrings und die daraus generierten Vertragsdateien
  (`backend/openapi.json`, `frontend/src/api/schema.d.ts`).
- Der Diff von `openapi.json` enthält nur neue `description`-Felder an Operationen, der Diff von `schema.d.ts` nur die
  daraus erzeugten Kommentarzeilen. Pfade, Schemas, `summary`, `operationId` und Responses bleiben gleich.
- Beim Umwandeln von `//` in `/** */` bleibt der Wortlaut gleich. Erlaubt sind nur Zeilenumbrüche, damit die
  Zeilenlänge passt (Frontend-Lint).
- Kommentare im Inneren von Funktionen bleiben `//`.
- Neue Kommentare folgen CONTRIBUTING.md: englisch, erklären das Warum bzw. nicht Offensichtliche; keine Historie,
  keine Ticketnummern, keine Verweise auf Docs-Abschnitte.

## Scope / Non-Goals

**Im Scope**
- Backend: Docstrings an den 15 Routen ohne und an den unten genannten Service-/Realtime-Funktionen; danach
  `openapi.json` exportieren und `schema.d.ts` generieren.
- Frontend: `//` → `/** */` nach E1 und E2; neue `/** */` an den unten genannten Exporten.

**Nicht im Scope**
- Inhaltliche Überarbeitung bestehender Kommentare (Wortlaut bleibt).
- Docstrings an CRUD-Funktionen, trivialen Gettern und selbsterklärenden Exporten, z. B. `get_adventures`,
  `get_join_info`, `AudioService.state`, `canGoBack`, `getData`, `darkTheme` oder Service-Funktionen, deren Name den
  Endpoint nennt (`service/*.ts`).
- `//` über nicht exportierten Deklarationen (z. B. lokale styled-components, Konstanten, Helfer) bleibt `//`.
- Tests (`__tests__/`, `backend/tests/`), Migrationen, `schema.d.ts` von Hand.
- Docs unter `docs/` (keine Ist-Änderung).

## Entscheidungen

### E1: Kommentare an Feldern von Interfaces und Types werden `/** */`
- **Entscheidung:** Jeder `//`-Kommentar an einem Feld eines `interface` oder Objekt-`type` wird `/** */`, unabhängig
  davon, ob der Typ exportiert ist (aktuell rund 110 Stellen, u. a. `GameTable` in `useGameTable.ts`, Props von
  `NavRail`, `HeroCard`, `SelectList`, Context-Typen in `context.ts`).
- **Verworfene Alternativen:** nur Felder exportierter Typen; Felder bleiben `//`.
- **Begründung:** Erst mit `/** */` zeigt der Editor die Erklärung beim Hovern über eine Prop in JSX und beim
  Feldzugriff. Eine einheitliche Regel ist mechanisch umsetzbar und gut prüfbar.

### E2: Alle Exporte mit `//`-Kommentar direkt darüber werden `/** */`
- **Entscheidung:** Jede exportierte Top-Level-Deklaration, über der direkt ein `//`-Kommentar steht, bekommt ihn als
  `/** */`: Funktionen, Hooks, Komponenten, aber auch Konstanten, Types und Interfaces (z. B. `API_BASE_URL`,
  `HEARTBEAT_TIMEOUT_MS`, `SOUND_GROUPS`, Types in `models.ts`, `ServerMessage`). Als exportiert gilt auch eine
  Deklaration, die erst über `export { … }` oder `export default` am Dateiende exportiert wird.
- **Verworfene Alternativen:** nur Funktionen, Hooks und Komponenten.
- **Begründung:** Eine einheitliche Regel; auch bei Konstanten und Types erscheint die Erklärung beim Hovern an der
  Verwendungsstelle.

### E3: Format von `/** */`
- **Entscheidung:** Passt der Kommentar in eine Zeile, `/** … */` einzeilig; sonst mehrzeilig mit `/**`, Zeilen mit
  ` * ` und abschließendem ` */`. Keine JSDoc-Tags (`@param`, `@returns`), solange der Kommentar ohne sie verständlich
  ist.
- **Begründung:** Gleiche Form wie die Python-Docstrings (Fließtext), kein Pflegeaufwand für Tags, die die Typen ohnehin
  ausdrücken.

## Subtasks

### Backend
- [ ] Docstrings an den 15 Routen: `adventures.py` (`read_adventures`, `read_adventure`, `update_adventure`,
      `read_adventure_scenes`), `audio.py` (`read_audio`), `fight.py` (`start_fight`, `end_fight`, `add_combatant`,
      `update_combatant`, `remove_combatant`, `reorder`), `scenes.py` (`read_scene`), `table.py` (`read_table`,
      `read_join_info`, `update_table`). Inhalt knapp: Verhalten und Fehlerfälle laut Endpoint-Tabelle in
      `docs/architecture.md` und laut Code (z. B. `update_adventure`: 404 unbekanntes Abenteuer, 422 Szene gehört nicht
      zum Abenteuer, 409 laufender Kampf beim Szenenwechsel; Push an alle Screens). Stil wie die vorhandenen
      Route-Docstrings (`update_audio`, `play_sound`, `read_fight`, `end_turn`).
- [ ] Docstrings an Service-Funktionen:
  - `services/adventure.py`: `get_adventure`, `get_scenes` (`None` bei unbekannter ID, `get_scenes` auch ohne Szenen
    eine leere Liste statt `None`); `update_adventure` (`None` bei unbekannter ID, `SceneNotInAdventureError`,
    `FightInProgressError` nur bei tatsächlichem Szenenwechsel, danach `scene_changed`).
  - `services/game_table.py`: `get_state` (setzt den gespeicherten Stand mit Overlay und Rasterfarbe aus dem Speicher
    zusammen); `update_state` (`AdventureNotFoundError`, Kampf-Sperre beim Abenteuerwechsel, Overlay-Reset beim
    Abenteuerwechsel, außer ein Overlay kommt im selben Request mit).
  - `services/fight.py`: `end_fight`, `reorder` (`InvalidFightChangeError`, wenn die IDs nicht genau die Kämpfer
    des Kampfes sind).
- [ ] Docstrings an Realtime-Funktionen:
  - `realtime/audio.py` `AudioService`: `update` (Abspielen nur mit Track; Pause immer), `set_output` (gibt die
    vorherige Ausgabe zurück, die benachrichtigt werden muss), `release_output`, `track_ended` (nur von der aktuellen
    Ausgabe und nur für den laufenden Track; Rückgabe = geändert).
  - `realtime/push.py`: `reset_audio`, `push_audio`, `send_sound` (nur an die Audioausgabe, ohne Ausgabe nichts),
    `make_audio_output`, `report_track_ended`, `release_audio_output`.
  - `realtime/manager.py`: `broadcast`, `send_admins`, `send_screen` (fehlgeschlagene Sends entfernen die Verbindung,
    siehe `send`).
- [ ] `uv run python scripts/export_openapi.py` (in `backend/`).

### Frontend
- [ ] `npm run generate:api`; Diff von `src/api/schema.d.ts` nur Kommentarzeilen.
- [ ] `//` → `/** */` nach E1, E2 und E3 in `src/` (ohne `schema.d.ts`).
- [ ] Neue `/** */` an Exporten mit nicht offensichtlichem Verhalten:
  - `realtime/useGameTable.ts`: `useGameTable` (Verbindungsaufbau und Reconnect für den übergebenen Screen, was der Hook
    liefert – laut Code).
  - `api/loadData.ts`: `loadData`, `describeFailure` (Fehlertexte; leere Antwort gilt als „nicht gefunden“).
  - `api/saveData.ts`: `saveData`, `postCommand`, `replaceData`, `deleteCommand` (HTTP-Methode, wirft `SaveError`).
  - `utils/utils.ts`: `getMusicTitle` (entfernt Dateiendung und Vite-Hash).
  - `service/adminScreen.ts`: `getAdminData` (lädt die Szenen des Abenteuers).
  - `notes/noteLinks.ts`: `buildNoteIndex`.
  - `notes/noteHistory.ts`: `goBack`, `goForward` (speichern `scrollTop` des verlassenen Eintrags).
  - `utils/adventureBackground.ts`: `adventureBackgroundReducer`.
  - `utils/wallInitiative.ts`: `planTransitions`.
  - `style/tokens.ts`: `textStyle`; `style/appTheme.ts`: `appTheme`.
  - Komponenten: `Dialogue` (Szenenwechsel mit Bildern, im Unterschied zu `ConfirmDialog`), `ResourceBarPlayer` (nur
    lokaler Zustand, Maxima hart codiert), `DocumentReader`, `SelectList`, `NavRail`, `DashboardPanel`,
    `CombatantAvatar`, `GridOverlay`.

  Hat einer dieser Exporte schon einen `//`-Kommentar, wird dieser umgewandelt (E2) und nur ergänzt, wenn etwas
  Wesentliches fehlt. Jede Aussage muss mit dem Code übereinstimmen.

## Akzeptanzkriterien (refactor, style, chore)
- [ ] AK1: Alle 15 genannten Routen haben einen Docstring; in `openapi.json` hat jede Operation eine `description`.
- [ ] AK2: Die genannten Service- und Realtime-Funktionen haben Docstrings, deren Aussagen mit dem Code übereinstimmen.
- [ ] AK3: Im Frontend steht über keiner exportierten Top-Level-Deklaration mehr ein `//`-Kommentar und an keinem
      Feld eines Interface/Type mehr ein `//`-Kommentar (E1, E2); Kommentare in Funktionsrümpfen und über nicht
      exportierten Deklarationen sind unverändert `//`.
- [ ] AK4: Die genannten Frontend-Exporte haben ein `/** */`, das mit dem Code übereinstimmt.
- [ ] AK5: Alle Invarianten eingehalten – keine Verhaltensänderung; Diff von `openapi.json`/`schema.d.ts` nur
      `description` bzw. Kommentarzeilen.
- [ ] AK6: Lint, Tests und Build sind so grün wie vorher (bekannte Altfehler ausgenommen).
- [ ] AK7: Bestehende Tests unverändert.

## Teststrategie / Verifikation

**Automatisch**
- Backend: `uv run ruff check`, `uv run ruff format --check`, `uv run mypy`, `uv run pytest`; `export_openapi.py`
  erneut ausführen, danach `git diff --exit-code openapi.json` (wie CI).
- Frontend: `npm run lint`, `npm run typecheck`, `npm run test:unit`; `npm run generate:api` erneut, danach kein Diff
  an `schema.d.ts`.
- Diff-Prüfung: `git diff -- backend/openapi.json` enthält nur `"description"`-Zeilen; `git diff` außerhalb von
  Kommentaren/Docstrings leer (z. B. `git diff -U0` durchsehen bzw. `git diff --word-diff` auf Code-Zeilen).
- Vollständigkeit: Skript bzw. grep, das `//`-Kommentare direkt über exportierten Top-Level-Deklarationen und an
  Interface-/Type-Feldern findet – Ergebnis leer.

**Manuell**
1. In VS Code über `useGameTable` und über eine Prop von `NavRail` in JSX hovern: Der Kommentar erscheint.

## Offene Fragen
- keine

## Review
