# DND-24: Abenteuer im Frontend (Auswahl im Admin, aktive Szene persistent)

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Mit DND-23 kennt das Backend Abenteuer, Szenen je Abenteuer und eine persistente aktive Szene. Das Frontend lädt aber
weiterhin alle Szenen global und hält die aktive Szene nur im `localStorage`. Ziel: Der Spielleiter wählt im Admin Screen ein
Abenteuer. Admin und Wall zeigen nur dessen Szenen, und die aktive Szene wird im Abenteuer gespeichert, sodass sie
einen Reload und einen Wechsel des Browsers übersteht. Wall und Ground folgen wie bisher live über den `localStorage`.
Abschließend entfallen die globalen Listen-Endpoints im Backend.

**Voraussetzung:** DND-23 ist umgesetzt.

## Scope / Non-Goals

**Im Scope**
- Abenteuer-Auswahl (Dropdown) in der TopBar des Admin Screens.
- `activeAdventureId` im `localStorage` mit Sync per `storage`-Event an Wall und Ground.
- Admin und Wall laden Szenen bzw. Karten über `/adventures/{id}/...`.
- Aktive Szene: beim Start und Wechsel aus der API übernehmen, beim Auswählen per `PATCH` speichern.
- `activeSceneId` darf leer sein (keine Szene aktiv); Leerzustand in Admin, Wall und Ground.
- Backend: globale Endpoints `GET /scenes` (Liste) und `GET /maps/main|side` entfernen, Prod-Healthcheck umstellen.
- Tests und Doku.

**Nicht im Scope**
- Anzeige oder Bearbeitung von Spielern und `global_level` (folgt in eigenen Tasks).
- Anlegen, Umbenennen oder Löschen von Abenteuern.
- Player Screen (bleibt ohne API-Anbindung).
- WebSockets, Polling, Synchronisation über Rechnergrenzen hinweg (Session-Management, eigener Task).
- Änderungen an `GET /scenes/{id}` (bleibt für Wall und Ground).

## Entscheidungen

### E1: Zustand und Synchronisation
- **Entscheidung:** Neben `activeSceneId` gibt es `activeAdventureId` (beide `number | null`) in `App.tsx`. Bereitgestellt wird es
  über einen eigenen Context `ActiveAdventureContext` neben dem bestehenden `ActiveSceneContext`. Beide Werte liegen im
  `localStorage` (`activeAdventureId`, `activeSceneId`). Ein fehlender oder leerer Wert bedeutet `null`, der bisherige Fallback `1` entfällt.
  Andere Fenster übernehmen Änderungen wie bisher über das `storage`-Event.
- **Begründung:** Das bewährte Sync-Muster bleibt. WebSockets folgen später.

### E2: Abenteuer-Auswahl als Dropdown in der TopBar
- **Entscheidung:** Links in der TopBar (statt des Titels „DnD Portal“) steht ein Select mit allen Abenteuern aus
  `GET /adventures`, gestylt nach `frontend/DESIGN.md`. Ist beim Laden des Admin Screens kein oder ein unbekanntes
  `activeAdventureId` gespeichert, wählt der Admin automatisch das erste Abenteuer der Liste. Bei einer leeren Liste ist
  kein Abenteuer aktiv, und es werden keine Szenen geladen.
- **Verworfene Alternativen:** Startdialog mit Wechsel-Button.
- **Begründung:** Immer sichtbar, kein zusätzlicher Screen. Mit nur einem Abenteuer funktioniert alles wie bisher ohne Zutun.

### E3: Aktive Szene kommt beim Start und Wechsel aus der API
- **Entscheidung:** Beim Start bzw. Reload des Admin Screens lädt der Admin `GET /adventures/{id}` und übernimmt
  `active_scene_id` (ggf. `null`) in `activeSceneId`. Bei einer Auswahl im Dropdown setzt er `activeSceneId` zuerst auf
  `null` und übernimmt danach ebenso die gespeicherte Szene des neuen Abenteuers. Wall und Ground fragen die API nicht
  nach der aktiven Szene, sondern folgen dem `localStorage`.
- **Verworfene Alternativen:** Beim Wechsel keine Szene übernehmen bzw. die gespeicherte Szene per `PATCH` leeren.
- **Begründung:** Jedes Abenteuer merkt sich seine Szene. Das Zurücksetzen beim Wechsel verhindert, dass kurz die Szene
  des vorherigen Abenteuers zu sehen ist. Beim Reload entfällt es, damit Wall und Ground nicht kurz leer werden.

### E4: Szene auswählen speichert per PATCH
- **Entscheidung:** Bestätigt der Spielleiter im Dialog eine Szene, wird sie sofort lokal aktiv (Wall und Ground
  wechseln wie bisher). Parallel sendet der Admin `PATCH /adventures/{id}` mit `{"active_scene_id": <id>}`. Schlägt das fehl,
  zeigt der Admin die vorhandene Hinweisleiste (`ErrorBar`) mit eigener Meldung („Aktive Szene konnte nicht gespeichert
  werden“), und „Erneut versuchen“ wiederholt das Speichern. Keine automatischen Wiederholungen. Für das Schreiben
  kommt `patchData` zu `src/api/apiMethods.ts` hinzu, mit Fehleraufbereitung analog zu `loadData`/`LoadError`.
- **Begründung:** Das Spiel am Tisch darf nicht am Speichern hängen. Der Fehler ist trotzdem sichtbar.

### E5: Leerzustand ohne aktive Szene
- **Entscheidung:** Ist `activeSceneId` `null`, zeigen Wall und Ground nur die Hintergrundfarbe des Themes, ohne Bild und ohne
  Text. Im Admin zeigt die Karte „Aktive Szene“ den Hinweis „Keine Szene aktiv“, keine Kachel ist hervorgehoben, und die Musik
  bleibt beim Standardtrack. Die Kartenübersichten (Admin, Overlay „Übersicht“ auf der Wall) funktionieren unabhängig davon.
- **Verworfene Alternativen:** Weltkarte auf der Wall; Hinweistext auf Wall und Ground.
- **Begründung:** Am Spieltisch neutral, nichts verrät den technischen Zustand.

### E6: Globale Listen-Endpoints entfallen
- **Entscheidung:** Im Backend werden `GET /scenes` (Liste) und `GET /maps/main|side` samt nicht mehr genutzter
  Service- und CRUD-Funktionen und Tests entfernt. `GET /scenes/{id}` bleibt. Der Healthcheck in `compose.prod.yaml`
  prüft künftig `http://localhost:8000/adventures`. Tests, die heute `/scenes` nur als beliebigen Endpoint nutzen
  (`test_cors.py`, `test_media.py`), werden auf `/adventures` bzw. `/adventures/1/scenes` umgestellt. OpenAPI wird neu exportiert,
  die Typen neu generiert.
- **Begründung:** Ab diesem Task nutzt das Frontend sie nicht mehr. Es bleibt nur ein Weg zu den Szenen.

### E7: Abenteuer-Auswahl als eigene Listbox statt nativem `select` (Nacharbeit nach Runde 2)
- **Entscheidung:** Das native `select` aus E2 wird durch eine eigene Komponente `AdventureSelect`
  (`src/components/AdventureSelect.tsx`) ersetzt: ein Button und eine aufklappende Liste nach dem ARIA-Muster „Listbox“.
  Datenfluss, Position in der TopBar und Verhalten aus E2 bleiben gleich.
  - **Button:** wie bisher (Höhe `size.control.md`, Innenabstand `0 space.3`, `text.md` `bold`, Fläche `secondary`,
    `radius.md`, Fokus-Outline), zusätzlich rechts ein Chevron (SVG-`polygon`, `viewBox 0 0 20 20`, `size.icon`, `fill`
    `text.color`; geöffnet nach oben gedreht). Langer Name: einzeilig mit Ellipse innerhalb der Außenspalte.
    `aria-haspopup="listbox"`, `aria-expanded`, zugänglicher Name „Abenteuer“. Ohne Abenteuer deaktiviert.
  - **Liste:** direkt unter dem Button (`position: absolute`, `top: calc(100% + space.1)`, `left: 0`, mindestens so
    breit wie der Button), Fläche `secondary`, Rand `borderWidth.thin` in `border` (Abgrenzung zu Karten darunter),
    `radius.lg`, Innenabstand `space.1`, Einträge mit `gap` `space.1`. Maximale Höhe als Layout-Konstante
    `ADVENTURE_LIST_MAX_HEIGHT`, darüber scrollt die Liste. Kein `box-shadow`.
  - **Einträge:** wie Navigationseinträge (Höhe `size.control.md`, `0 space.3`, linksbündig, `text.sm` `medium`,
    `radius.md`). Gewähltes Abenteuer: Fläche `primary`, Text `onPrimary`. Hover und Tastatur-Fokus: Fläche
    `background`. `role="option"`, `aria-selected`.
  - **Ebene:** neuer Token `layer.popover` (zwischen `controls` und `dialog`), damit die Liste über dem Admin-Inhalt liegt.
  - **Bedienung:** Klick auf den Button öffnet/schließt. Tastatur am Button: Enter, Leertaste, Pfeil runter/hoch öffnen
    (Fokus auf dem gewählten Eintrag). In der Liste: Pfeile, Pos1/Ende bewegen; Enter/Leertaste wählen und schließen;
    Esc schließt und gibt den Fokus an den Button zurück; Tab und Klick außerhalb schließen. Das bereits gewählte Abenteuer
    erneut zu wählen schließt nur (kein `onSelectAdventure`).
- **Verworfene Alternativen:** `appearance: base-select` (nur aktuelle Chromium-Browser); MUI `Select` (eigenes Styling,
  MUI nur für `Box`/`Slider`).
- **Begründung:** Das Menü des nativen `select` zeichnet das Betriebssystem. Position und Farben sind per CSS nicht
  steuerbar. Eine eigene Komponente sieht in jedem Browser gleich aus und folgt Tokens und Farbrollen.

## Subtasks

### Vertrag
- [x] Entfernen gemäß E6; `uv run python scripts/export_openapi.py`, `npm run generate:api`.
- [x] `src/models/models.ts`: Typen `AdventureSummary`, `AdventureDetail` aus dem Schema ableiten; Kommentar zu
      `MapResponse` auf die neuen Pfade anpassen.

### Backend
- [x] Router `scenes` (Liste) und `maps` entfernen bzw. kürzen, `app/main.py`, ungenutzte Funktionen in
      `app/services/map.py`, `app/services/scene.py`, `app/crud/scene.py` entfernen (der Filter nach Abenteuer bleibt).
- [x] Tests anpassen: `test_scenes.py` (nur Einzelszene), `test_maps.py` in `test_adventures.py` aufgehen lassen bzw.
      entfernen, `test_cors.py` und `test_media.py` gemäß E6; Test, dass `GET /scenes` und `GET /maps/main` 404/405 liefern.
- [x] `compose.prod.yaml`: Healthcheck auf `/adventures`.

### Frontend
- [x] `src/context/context.ts`: `activeSceneId: number | null`; neuer `ActiveAdventureContext`.
- [x] `src/app/App.tsx`: beide Werte aus dem und in den `localStorage`, `storage`-Event für beide Schlüssel, ohne Fallback `1`. Das
      Parsen gespeicherter IDs als kleine reine Funktion in `src/utils/` (Unit-Test).
- [x] `src/api/apiMethods.ts`: `patchData`; Speichern mit Fehleraufbereitung analog `loadData` (z. B. `saveData` in
      `src/api/`), Unit-Test analog `apiErrors.spec.ts`.
- [x] `src/service/adminScreen.ts`: `getAdventures`, `getAdventure(id)`, `getAdminData(adventureId)` über die verschachtelten
      Pfade, `saveActiveScene(adventureId, sceneId)`; `handleDialogue` an `number | null` anpassen.
- [x] `src/service/WallScreen.ts`: Mainmaps über `/adventures/{id}/maps/main`; Szene nur laden, wenn `activeSceneId` gesetzt ist.
- [x] `src/service/groundScreen.ts` und `GroundScreen.tsx`/`WallScreen.tsx`: Leerzustand gemäß E5, kein Request ohne
      aktive Szene (bzw. ohne Abenteuer für die Mainmaps).
- [x] `TopBar.tsx`: Abenteuer-Select gemäß E2 (Props: Liste, aktive ID, `onSelect`).
- [x] `AdminScreen.tsx`: Abenteuerliste laden und automatisch auswählen (E2), Lade-Effekte abhängig von `activeAdventureId`,
      Übernahme der aktiven Szene (E3), Speichern beim Auswählen inkl. Fehlerleiste und Retry (E4), Leerzustand (E5).
      Bestehende Muster `loadLatest`/`loadSafely` und `reloadCount` wiederverwenden. Die Auswahl der Default-Abenteuer-ID
      als reine Funktion in `src/utils/` (Unit-Test: gespeicherte ID vorhanden / unbekannt / keine / leere Liste).
- [x] `DetailsSideBar.tsx`: Hinweis „Keine Szene aktiv“ bei fehlender Szene.
- [x] `__tests__/unit/SceneDetailMock.json` und BDD-Steps (`__tests__/bdd/steps/*`, `support/helpers.ts`) prüfen und
      anpassen: Sie müssen mit automatisch gewähltem erstem Abenteuer weiterlaufen.

### Doku
- [x] `docs/architecture.md`: Synchronisation (`activeAdventureId`, persistente aktive Szene, PATCH), Endpoints (globale
      entfallen), Healthcheck, Frontend-State.
- [x] `docs/screens.md`: Ist-Stand Admin (Abenteuer-Auswahl, Speichern, Fehlerleiste), Wall und Ground (Leerzustand).
- [x] `docs/domain.md`, `frontend/CLAUDE.md`, `backend/README.md`, `backend/CLAUDE.md` wo Endpoints oder State erwähnt sind;
      `docs/known-issues.md` prüfen.

### Nacharbeit: Abenteuer-Auswahl (E7)
- [x] `src/components/AdventureSelect.tsx` gemäß E7; `TopBar.tsx` nutzt sie (Props unverändert), natives
      `AdventureSelect`-Styled-`select` entfernen. `data-test-id='adventure-select'` am Button, Einträge
      `adventure-option-<id>`.
- [x] Tastaturlogik (nächster Index für Pfeile/Pos1/Ende, Start-Index beim Öffnen) als reine Funktion in `src/utils/`
      mit Unit-Test.
- [x] `src/style/tokens.ts`: `layer.popover`.
- [x] Doku: `frontend/DESIGN.md` (Ebenen-Tabelle `layer.popover`), `frontend/docs/design/components.md` (Top-Bar-Zeile
      „Abenteuer-Auswahl“ und neuer Baustein „Auswahlliste“), `frontend/docs/design/screen-layouts.md`
      (`ADVENTURE_LIST_MAX_HEIGHT`), `docs/screens.md` falls dort „Dropdown/select“ beschrieben ist.
- [x] BDD-Steps/Helpers prüfen, falls sie das `select` ansprechen.

## Akzeptanzkriterien

### AK1: Abenteuer wird automatisch gewählt
- **Given** ein Browser ohne gespeichertes Abenteuer und eine DB mit „Erstes Abenteuer“
- **When** der Spielleiter `/admin` öffnet
- **Then** steht „Erstes Abenteuer“ im Dropdown der TopBar, und Kampfszenen sowie Nicht-Kampfszenen dieses Abenteuers werden angezeigt.

### AK2: Aktive Szene übersteht einen Reload
- **Given** Admin, Wall und Ground sind geöffnet und ein Abenteuer ist gewählt
- **When** der Spielleiter eine Szene aktiviert und anschließend alle Fenster neu lädt (oder den `localStorage` leert und
  den Admin neu öffnet)
- **Then** ist dieselbe Szene wieder aktiv: Admin hebt sie hervor, Wall und Ground zeigen ihre Bilder, die Playlist läuft.

### AK3: Wall und Ground folgen live
- **Given** Admin, Wall und Ground sind im selben Browser geöffnet
- **When** der Spielleiter eine Szene aktiviert
- **Then** wechseln Wall und Ground ohne Reload, wie bisher.

### AK4: Abenteuer wechseln
- **Given** zwei Abenteuer; A hat eine gespeicherte aktive Szene, B keine
- **When** der Spielleiter im Dropdown von A zu B wechselt
- **Then** zeigen Admin und Wall nur die Szenen von B, keine Szene ist aktiv, und Wall und Ground zeigen nur den Hintergrund.
- **And when** er zurück zu A wechselt, **then** ist dessen gespeicherte Szene wieder aktiv.

### AK5: Speichern schlägt fehl
- **Given** die API ist nicht erreichbar oder antwortet beim `PATCH` mit einem Fehler
- **When** der Spielleiter eine Szene aktiviert
- **Then** wechseln Wall und Ground trotzdem, und der Admin zeigt die Hinweisleiste „Aktive Szene konnte nicht gespeichert
  werden“. „Erneut versuchen“ speichert erneut.

### AK6: Globale Listen-Endpoints entfernt
- **Given** der Stand nach diesem Task
- **When** `GET /scenes` oder `GET /maps/main` aufgerufen wird
- **Then** gibt es diese Endpoints nicht mehr. `GET /scenes/{id}` funktioniert weiter, und `dnd prod` meldet die API als healthy.

### AK7: Abenteuer-Auswahl passt zum Design
- **Given** der Admin Screen mit mindestens zwei Abenteuern, in beiden Themes (Dark, Tavern)
- **When** der Spielleiter die Abenteuer-Auswahl öffnet
- **Then** erscheint die Liste direkt unter dem Button (nicht darüber), in Fläche `secondary` mit Rand, das gewählte
  Abenteuer in `primary`/`onPrimary`, und sie liegt über Notizen und Karten.
- **And** Auswahl per Maus und per Tastatur (Pfeile, Enter, Esc) funktioniert, Klick außerhalb schließt, und der
  Wechsel verhält sich wie in AK4.

## Teststrategie / Verifikation

**Automatisch**
- Backend: `uv run pytest`, `ruff`, `mypy`, `openapi.json` aktuell.
- Frontend: `npm run typecheck` (`schema.d.ts` aktuell), `npm run lint`, `npm run test:unit` (neue Tests für ID-Parsing,
  Default-Abenteuer-Auswahl, Fehleraufbereitung beim Speichern, Tastaturlogik der Abenteuer-Auswahl), `npm run build`.
- E2E: `npm run test:e2e` gegen laufendes Backend mit Seed (bestehende Features laufen weiter).

**Manuell** (`dnd dev`, Admin, Wall und Ground als Fenster)
1. Frischer Seed (`active_scene_id` null), `localStorage` leeren, `/admin` öffnen → „Erstes Abenteuer“ gewählt, keine
   Szene aktiv, Wall und Ground leer.
2. Szene aktivieren → Wall und Ground wechseln live; `GET /adventures/1` zeigt die `active_scene_id`.
3. Alle Fenster neu laden bzw. `localStorage` leeren → Szene wieder aktiv (AK2).
4. Zweites Abenteuer per SQL anlegen (Name und eine Szene mit `adventure_id` 2), Wechsel hin und zurück (AK4).
5. API stoppen, Szene aktivieren → Hinweisleiste. API starten, „Erneut versuchen“ → gespeichert (AK5).
6. `dnd prod` → API healthy (AK6).
7. Zweites Abenteuer per SQL anlegen, Abenteuer-Auswahl in Chrome und Safari öffnen, in beiden Themes, per Maus und
   Tastatur bedienen; Screenshot der geöffneten Liste (AK7).

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-10-17

**Empfehlung:** Abnahme. Keine blockierenden Befunde; H1 und H2 vorher ansehen.

Geprüft: Commit `192bd16` auf `development`, Diff vollständig, alle Checks; AK1–AK5 zusätzlich per Selenium im
Browser gegen den Dev-Stack (Admin, Wall, Ground als Tabs). Temporäres Abenteuer 9002 per SQL angelegt und wieder
gelöscht, `active_scene_id` von Abenteuer 1 danach auf `null` zurückgesetzt.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Abenteuer wird automatisch gewählt | erfüllt | Leerer `localStorage` → „Erstes Abenteuer“ gewählt, `activeAdventureId: "1"`, 25 Kampf- und 4 Nicht-Kampfszenen; `AdminScreen.tsx:178-198`, `utils/adventure.ts:5-13`, `TopBar.tsx:202-212` |
| AK2 Aktive Szene übersteht Reload | erfüllt | main_3 aktiviert → API `active_scene_id: 7`; nach Reload bzw. `localStorage.clear()` wieder `"7"`, Wall/Ground korrekt; `AdminScreen.tsx:211-222, 245-250` (Musik nur im Code geprüft) |
| AK3 Wall und Ground folgen live | erfüllt | Wechsel ohne Reload; `App.tsx:50-58` |
| AK4 Abenteuer wechseln | erfüllt (Normalfall) | A → B: „Keine Szene aktiv“, Wall/Ground ohne Bild; zurück zu A: Szene 9 wieder aktiv; `AdminScreen.tsx:285-292`. Fehlerfall: H1 |
| AK5 Speichern schlägt fehl | erfüllt (PATCH-Fehler) | PATCH blockiert → lokal aktiv, Leiste „Aktive Szene konnte nicht gespeichert werden“; Retry → API auf 9; `AdminScreen.tsx:264-283, 326-330`, `api/saveData.ts`. API komplett weg: H2 |
| AK6 Globale Listen-Endpoints entfernt | erfüllt | `GET /scenes` und `/maps/main` → 404, `/scenes/1` → 200; `test_scenes.py:64-68`; Healthcheck `compose.prod.yaml:44` im Dev-Container 200. `dnd prod` nicht gestartet |

**Blockierende Befunde**
- keine

**Hinweise (nicht blockierend)**
- **H1 – Fehler beim Abenteuerwechsel:** Laden von B schlägt fehl, Rückwechsel zu A → gespeicherte Szene von A wird
  nicht übernommen („Keine Szene aktiv“, API weiter 9). Ursache: `adoptedAdventureId.current` bleibt auf A
  (`AdminScreen.tsx:218`); vermutlich auch bei schnellem A→B→A. Korrektur: `adoptedAdventureId.current = null` in
  `handleAdventureSelection` (`AdminScreen.tsx:285-292`).
- **H2 – API komplett nicht erreichbar:** Wall/Ground behalten das zuletzt geladene Bild, obwohl `activeSceneId`
  wechselt. Folgt aus der Architektur im Plan; manueller Schritt 5 würde es zeigen.
- **H3 – E2E-Tests verändern die Dev-DB:** `active_scene_id` bleibt nach `test:e2e` gesetzt, danach 2 pytest-Fehler
  (`test_read_adventure_returns_detail_with_players`, `test_patch_returns_detail_with_players`). In
  `docs/known-issues.md` dokumentiert, CI nicht betroffen. Folgetask: Reset in den E2E-Steps (`afterAll`).
- **H4 – Lint-Warnung** (`alt` fehlt) in `WallScreen.tsx:194`, bestand schon vorher.
- **H5 – Kein eigener Plan-Commit:** Plan erstmals im Feat-Commit committet (wie bei DND-23).
- **H6 – Doku über Subtasks hinaus:** `frontend/DESIGN.md`, `docs/design/components.md`, `screen-layouts.md`
  angepasst; gehört zum Scope „Tests und Doku“.
- **H7 – Reload:** Admin setzt `activeSceneId` erst aus `localStorage`, dann aus der API; bei Abweichung springen
  Wall/Ground einmal um. Erwartet (E3).

**Checks**
- Backend: ruff, ruff format, mypy (30 Dateien), pytest 83 passed (Seed-Stand), `openapi.json` aktuell
- Frontend: typecheck, lint (0 Fehler, 1 alte Warnung), test:unit 89 grün, build grün, `schema.d.ts` aktuell
- E2E: 4 Tests grün gegen Dev-Stack
- Konventionen: ein Commit, Schema und Typ passen, keine KI-Signatur, Branch `development`; alle Subtasks erledigt

### Runde 2 – 2026-10-17

**Empfehlung:** Abnahme. Keine blockierenden Befunde; H1 behoben.

Geprüft: Commit `a1d3b77` (Nacharbeit H1) auf `development`, Diff vollständig, alle Checks; H1 und Retry-Fall per
Selenium gegen den Dev-Stack (Requests per CDP blockiert). Temporäres Abenteuer 9002 per SQL angelegt und wieder
gelöscht, `active_scene_id` von Abenteuer 1 danach auf `null` zurückgesetzt.

Logik: `select()` in `handleAdventureSelection` (`AdminScreen.tsx:290`) setzt die übernommene ID vor jeder Auswahl
zurück; `claim()` (`AdminScreen.tsx:218`, `utils/sceneAdoption.ts:17-23`) liefert nur beim ersten erfolgreichen Laden
je Auswahl `true`. Retry in derselben Auswahl liefert weiter `false`.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Abenteuer wird automatisch gewählt | erfüllt | Frisches Profil → `activeAdventureId: "1"`; E2E grün; Code unverändert |
| AK2 Aktive Szene übersteht Reload | erfüllt | Ohne `localStorage` übernimmt der Admin 9 aus der API, Ground `main_5.jpg` |
| AK3 Wall und Ground folgen live | erfüllt | Ground wechselt ohne Reload 9 → leer → 9 → 7; Wall nicht separat geprüft, `App.tsx` unverändert |
| AK4 Abenteuer wechseln | erfüllt, auch im Fehlerfall | Laden von B blockiert → zurück zu A: Szene 9 wieder aktiv. Schnelles A→B→A (mit/ohne Blockade): Szene 9 aktiv. Normalfall nur per Unit-Test `sceneAdoption.spec.ts:20-27` |
| AK5 Speichern schlägt fehl | erfüllt | PATCH blockiert → lokal 7, Leiste, API 9; Retry → API 7 |
| AK6 Globale Listen-Endpoints entfernt | erfüllt | Backend unverändert, pytest 83 passed, `openapi.json` aktuell |

Retry innerhalb derselben Auswahl: lokal 7 gewählt (PATCH fehlgeschlagen, API 9), danach „Erneut versuchen“ in der
Ladefehler-Leiste → `activeSceneId` bleibt `"7"` (`sceneAdoption.spec.ts:14-18`).

**Blockierende Befunde**
- keine

**Hinweise (nicht blockierend)**
- **H8 – Nur die Util ist automatisch getestet:** Dass `AdminScreen` `select()` vor `setActiveAdventureId` aufruft,
  deckt kein automatischer Test ab, nur die manuelle Prüfung.
- **H9 – Mehrere Admin-Fenster (Vermutung):** Ändert ein zweites Admin-Fenster `activeAdventureId` per
  `storage`-Event, läuft kein `select()`. Kein vorgesehenes Setup.
- H2–H7 aus Runde 1 gelten unverändert; H3 erneut bestätigt.

**Checks**
- Backend: ruff check/format, mypy (30 Dateien), pytest 83 passed (vor und nach E2E), `openapi.json` aktuell
- Frontend: typecheck, lint (0 Fehler, 1 alte Warnung), test:unit 93 grün (neu `sceneAdoption.spec.ts`, 4 Tests), build grün
- E2E: 4 Tests grün
- Konventionen: ein Commit `feat(DND-24): address review round 1`, keine KI-Signatur, Branch `development`; Scope eingehalten
