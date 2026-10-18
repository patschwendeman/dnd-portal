# DND-25: Spieltisch-Zustand per WebSocket (Server als einzige Quelle)

**Typ:** feat
**Status:** Fertig

## Kontext & Ziel

Admin, Wall und Ground synchronisieren sich heute nur über `localStorage` und das `storage`-Event (`App.tsx`:
`activeAdventureId`, `activeSceneId`, `isDarkTheme`). Das funktioniert nur in **einem Browser auf einem Rechner**. Ziel:
Der **Server ist die einzige Quelle** des Spieltisch-Zustands (aktives Abenteuer, aktive Szene, Theme) und pusht ihn per
WebSocket an alle verbundenen Screens. Wall und Ground können damit auf anderen Geräten oder in anderen Browsern laufen
(`http://<IP>:8080/wall`). Erster von drei Schritten der Zieldefinition: Audio auf der Wall folgt in DND-26, die Smartphones
folgen in DND-27.

## Scope / Non-Goals

**Im Scope**
- Backend: Tabelle `game_table` (Spieltisch-Zustand), Migration `0004`, `GET /table`, `PATCH /table`, WebSocket-Endpoint
  `/ws` mit Snapshot-Push, Heartbeat und Origin-Prüfung; Push nach jeder Änderung des Zustands.
- Proxy für denselben Origin: nginx (Prod) und Vite (Dev) leiten `/api/` und `/ws` an die API weiter, Default von
  `VITE_API_URL` wird `/api/`.
- Frontend: WebSocket-Client mit Reconnect und Heartbeat-Timeout für Admin, Wall und Ground; der `localStorage`-Sync von
  Abenteuer, Szene und Theme entfällt; Admin schreibt per REST und zeigt Verbindungs- und Speicherfehler.
- Tests und Doku.

**Nicht im Scope**
- Audio (Musik, Soundeffekte) auf der Wall bzw. Fernsteuerung aus dem Admin (DND-26). Musik und Sounds laufen weiter im Admin.
- Player Screen: verbindet sich noch nicht, sein Theme bleibt lokal (DND-27).
- Anzeige der verbundenen Screens im Admin (der Server kennt sie, zeigt sie aber noch nicht an).
- Steuerung von Wall-Overlay und Grid aus dem Admin, Synchronisation dieser Einstellungen.
- Mehrere parallele Spieltische/Sessions, Authentifizierung, mehrere uvicorn-Worker.

## Entscheidungen

### E1: Eine globale Session, Zustand in der DB
- **Entscheidung:** Ein Server ist ein Spieltisch. Neue Tabelle `game_table` mit genau einer Zeile: `id` (PK, CHECK `id = 1`),
  `active_adventure_id` (FK → `adventure.id`, nullable, `ON DELETE SET NULL`), `theme` (Text, NOT NULL, Default `dark`,
  CHECK `theme IN ('dark', 'tavern')`). Die aktive Szene bleibt in `adventure.active_scene_id` (DND-23). Migration `0004` legt
  die Tabelle an und fügt die Zeile ein (`active_adventure_id` = kleinste Abenteuer-ID oder NULL, `theme` `dark`).
  `downgrade` entfernt die Tabelle.
- **Verworfene Alternativen:** Session = Abenteuer (Screens treten einem Abenteuer bei); explizite Session-Entität mit
  Beitrittscode; Zustand nur im Speicher des API-Prozesses.
- **Begründung:** Ein Spieltisch, kein Beitreten nötig. Der Zustand übersteht Neustarts der API.

### E2: REST schreibt, WebSocket pusht vollständige Snapshots
- **Entscheidung:** Neue Endpoints (Router `table`, Prefix `/table`, Tag `table`):

  | Methode und Pfad | Antwort |
  |---|---|
  | `GET /table` | `GameTableState` |
  | `PATCH /table` | Body `GameTableUpdate`, Antwort `GameTableState`; 422 `{"detail": "Adventure not found"}` bei unbekanntem Abenteuer |

  ```
  GameTableState  { active_adventure_id: int | null, active_scene_id: int | null, theme: "dark" | "tavern" }
                    active_scene_id = active_scene_id des aktiven Abenteuers (null ohne Abenteuer)
  GameTableUpdate { active_adventure_id?: int | null, theme?: "dark" | "tavern" }   nur gesetzte Felder werden geändert
  ```
  WebSocket `GET /ws?screen=<admin|wall|ground|player>` (nicht in OpenAPI). Nachrichten nur Server → Client, JSON im
  Format `{type, payload}`:
  - `{"type": "state", "payload": GameTableState}`: direkt nach dem Verbinden und nach **jeder** erfolgreichen
    Änderung per `PATCH /table` oder `PATCH /adventures/{id}` (immer, auch für nicht aktive Abenteuer, weil der Snapshot billig ist).
  - `{"type": "ping"}`: Heartbeat (E4).
  Eingehende Nachrichten der Clients ignoriert der Server, er liest sie nur, um das Trennen zu erkennen. Ein fehlender oder
  unbekannter `screen` wird mit Close-Code 1008 abgewiesen.
  Der Push läuft als async `BackgroundTask` der Schreib-Route (nach dem Commit, eigene DB-Session für den Snapshot), die
  synchronen Routen bleiben synchron. Ein Verbindungsmanager im API-Prozess hält die offenen Verbindungen samt `screen`
  (uvicorn läuft mit einem Worker, das wird in der Doku festgehalten).
- **Verworfene Alternativen:** Befehle per WebSocket; Deltas statt Snapshots.
- **Begründung:** Schreibwege sind typisiert und testbar wie bisher. Snapshots sind idempotent, und nach einem Reconnect
  genügt die erste Nachricht.

### E3: Abenteuer wechseln und Szene wählen ohne lokale Vorwegnahme
- **Entscheidung:** Der Admin wechselt das Abenteuer per `PATCH /table {"active_adventure_id": <id>}`. Der Push enthält
  direkt die gespeicherte aktive Szene des neuen Abenteuers, die Logik „erst `null`, dann `GET /adventures/{id}` und
  übernehmen“ (`sceneAdoption`) entfällt. Szene wählen bleibt `PATCH /adventures/{id} {"active_scene_id": <id>}`. **Keine optimistische
  Änderung:** Admin, Wall und Ground wechseln erst mit dem Push. Ist im Snapshot kein Abenteuer gesetzt, wählt der Admin wie bisher
  das erste der Liste (`selectDefaultAdventureId`), jetzt per `PATCH /table`.
- **Begründung:** Der Server ist die Quelle. Ein Wechsel kann so nie die Szene eines anderen Abenteuers zeigen.

### E4: Heartbeat auf Anwendungsebene
- **Entscheidung:** Der Server sendet jeder Verbindung alle **15 s** `{"type": "ping"}`. Empfängt ein Client **35 s** lang keine
  Nachricht, schließt er die Verbindung und verbindet sich neu. Zusätzlich bleiben die Protokoll-Pings von uvicorn (Default)
  aktiv, damit der Server tote Verbindungen aufräumt. Die Intervalle sind Konstanten (in Tests überschreibbar).
- **Verworfene Alternativen:** Nur uvicorn-Pings (der Client erkennt einen stillen Abbruch erst sehr spät).
- **Begründung:** Der Admin-Hinweis (E6) soll zeitnah erscheinen, z. B. bei einem WLAN-Abbruch eines anderen Geräts.

### E5: Nebenläufigkeit: Der letzte Schreibzugriff gewinnt
- **Entscheidung:** Mehrere Admin-Fenster bzw. -Geräte dürfen gleichzeitig schreiben. Jede Änderung wird übernommen und an alle
  gepusht, auch an die anderen Admins. Keine Sperren, keine Versionsprüfung.
- **Verworfene Alternativen:** nur ein schreibender Admin; Versionsprüfung mit 409.
- **Begründung:** Am Spieltisch gibt es einen Spielleiter. Alle Fenster zeigen nach dem Push denselben Stand.

### E6: Verbindungsverhalten im Frontend
- **Entscheidung:** Admin, Wall und Ground verbinden sich beim Laden mit ihrem `screen`. Nach einem Abbruch verbinden sie sich
  automatisch neu: exponentieller Backoff 1 s, 2 s, 4 s … bis höchstens 10 s, nach erfolgreichem Verbinden zurückgesetzt. Bis
  zum ersten Snapshot gilt „kein Abenteuer, keine Szene, Theme `dark`“ (Wall und Ground zeigen den Leerzustand). Nach einer Trennung
  behalten alle Screens den letzten Stand. **Nur der Admin** zeigt währenddessen eine `ErrorBar` „Verbindung zum Server
  getrennt“, deren „Erneut versuchen“ sofort neu verbindet. Wall und Ground zeigen nichts an.
- **Begründung:** Am Spieltisch sieht nur der Spielleiter technische Hinweise.

### E7: Speicherfehler im Admin
- **Entscheidung:** Für alle Schreibzugriffe (Szene, Abenteuer, Theme) gibt es eine gemeinsame `ErrorBar` „Änderung
  konnte nicht gespeichert werden“. „Erneut versuchen“ wiederholt den zuletzt fehlgeschlagenen Schreibzugriff. Es gilt nur das
  Ergebnis des jüngsten Schreibzugriffs (bestehendes Muster `latestSave`). Keine automatischen Wiederholungen.
- **Begründung:** Erweitert das DND-24-Verhalten auf die neuen Schreibwege.

### E8: Theme global aus dem Admin, Player bleibt lokal
- **Entscheidung:** Der Theme-Schalter in der TopBar setzt `PATCH /table {"theme": ...}`. Admin, Wall und Ground übernehmen das Theme
  aus dem Snapshot. Der Player Screen verbindet sich in diesem Task nicht. Sein Schalter wirkt nur lokal (`localStorage`
  `isDarkTheme`, nur dieses Gerät) und beeinflusst die anderen Screens nicht mehr.
- **Begründung:** Vorgriff auf DND-27 (dort übernimmt der Player das globale Theme mit lokaler Abweichung).

### E9: Gleicher Origin per Proxy
- **Entscheidung:**
  - Prod (`frontend/nginx.conf`): `location /api/` → `proxy_pass http://api:8000/` (Präfix entfernt, Range-Requests für
    Medien funktionieren weiter); `location /ws` → `http://api:8000/ws` mit `proxy_http_version 1.1`, `Upgrade`- und
    `Connection`-Header, `proxy_read_timeout` deutlich über dem Heartbeat. Beide mit `proxy_set_header Host $http_host`.
  - Dev (`vite.config.ts`): `server.proxy` für `/api` (Präfix entfernt) und `/ws` (`ws: true`). Ziel aus der Umgebungsvariable
    `API_PROXY_TARGET` (Default `http://localhost:8000`, im Dev-Compose `http://api:8000`).
  - Default von `VITE_API_URL` wird `/api/` (`apiClient.ts`, `frontend/Dockerfile`, `compose.prod.yaml`,
    `frontend/.env.example`). `mediaUrl` liefert damit `/api/media/...`. Die WebSocket-URL wird aus der API-Basis abgeleitet:
    Endet ihr Pfad auf `/api/`, ist es `ws(s)://<host>/ws`, sonst `<basis>ws` (z. B. `ws://localhost:8000/ws`). Das macht eine reine
    Funktion mit Unit-Test.
  - Port 8000 bleibt veröffentlicht (curl, Tests). Die CORS-Konfiguration bleibt für direkte Zugriffe bestehen, ist für den
    Betrieb über den Proxy aber nicht mehr nötig.
- **Begründung:** Andere Geräte öffnen nur `http://<IP>:8080`. Ein Build mit LAN-IP und ein CORS-Eintrag entfallen.

### E10: Origin-Prüfung am WebSocket
- **Entscheidung:** Der Server nimmt eine WebSocket-Verbindung nur an, wenn der `Origin`-Header fehlt (kein Browser),
  in `CORS_ORIGINS` steht oder Host und Port des `Origin` dem `Host`-Header entsprechen (gleicher Origin über den Proxy). Sonst
  lehnt er den Handshake ab (403 bzw. Close 1008).
- **Begründung:** CORS greift bei WebSockets nicht. Fremde Webseiten im Browser eines Spielers werden abgewiesen, der LAN-Zugriff
  über den Proxy funktioniert ohne Konfiguration.

## Subtasks

### Vertrag
- [x] Schemas `GameTableState`, `GameTableUpdate` (`theme` als `Literal["dark", "tavern"]`) in `app/schemas/game_table.py`.
- [x] WebSocket-Nachrichtenformat gemäß E2 in `docs/architecture.md` dokumentieren (nicht Teil der OpenAPI).

### Backend
- [x] Model `GameTable` (`app/models/game_table.py`), Re-Export; Migration `0004` gemäß E1 (upgrade/downgrade, `alembic check`).
- [x] CRUD/Service `game_table` (Lesen inkl. aktiver Szene des aktiven Abenteuers, Update mit Prüfung des Abenteuers).
- [x] Router `app/api/routes/table.py` gemäß E2; Registrierung in `app/main.py`.
- [x] Verbindungsmanager und WebSocket-Route (z. B. `app/realtime/` bzw. `app/api/routes/ws.py`): `screen`-Prüfung,
      Origin-Prüfung (E10), Snapshot beim Verbinden, Broadcast, Heartbeat (E4), sauberes Entfernen getrennter Verbindungen
      (auch bei Sendefehlern).
- [x] Push als `BackgroundTask` in `PATCH /table` und `PATCH /adventures/{id}` (E2).
- [x] `uv run python scripts/export_openapi.py`.
- [x] Tests:
  - `tests/test_table.py`: GET (Seed-Stand), PATCH Abenteuer und Theme, `active_scene_id` folgt dem Abenteuer, 422 bei
    unbekanntem Abenteuer bzw. ungültigem Theme, `null` erlaubt. Ausgangszustand nach jedem Test wiederherstellen.
  - `tests/test_ws.py` (`TestClient.websocket_connect`): Snapshot beim Verbinden; zwei Clients erhalten den Push nach
    `PATCH /table` und nach `PATCH /adventures/{id}`; Abenteuerwechsel liefert dessen gespeicherte Szene; ungültiger/fehlender
    `screen` abgewiesen; Origin fremd → abgewiesen, gleich Host → angenommen, aus `CORS_ORIGINS` → angenommen, ohne → angenommen;
    Ping kommt (Intervall per `monkeypatch` verkürzt); getrennter Client wird beim nächsten Broadcast ohne Fehler entfernt.
  - `tests/test_migration_0004.py` nach dem Muster von `test_migration_0003.py`: mit Abenteuern → Zeile mit kleinster ID;
    leere DB → Zeile mit NULL; downgrade.

### Frontend
- [x] `npm run generate:api`; `src/models/models.ts`: `GameTableState`, `Theme` ableiten.
- [x] Proxy und API-Basis gemäß E9: `vite.config.ts`, `compose.dev.yaml` (`API_PROXY_TARGET`), `nginx.conf`,
      `apiClient.ts`, `Dockerfile`, `compose.prod.yaml`, `.env.example`; reine Funktion `wsUrl(apiBaseUrl, location)` mit Unit-Test.
- [x] WebSocket-Client (z. B. `src/realtime/`): Hook/Provider `useGameTable(screen)` liefert `{ state, connected, reconnectNow }`.
      Reine, getestete Bausteine: Nachrichten parsen und validieren (unbekannte Typen ignorieren), Backoff-Berechnung (E6),
      Heartbeat-Timeout (E4).
- [x] `App.tsx`: `localStorage`-Sync für `activeAdventureId`/`activeSceneId` und das globale Theme entfernen. Admin, Wall und Ground
      werden je mit ihrem `screen` vom Provider umschlossen, der `ActiveAdventureContext`, `ActiveSceneContext` (nur noch lesend)
      und das Theme speist. Der Player behält das lokale Theme (E8).
- [x] `AdminScreen.tsx` und `src/service/adminScreen.ts`: Abenteuerwechsel und Theme per `PATCH /table`, Szene ohne lokale
      Vorwegnahme (E3), automatische Auswahl des ersten Abenteuers per `PATCH`, gemeinsame Speicherfehler-Leiste (E7),
      Verbindungs-Leiste (E6). `sceneAdoption` und nicht mehr benötigte Teile von `storedId`/`handleDialogue` samt Tests entfernen.
- [x] `TopBar.tsx`: Theme-Schalter ruft die Admin-Aktion statt des lokalen Toggles.
- [x] Wall/Ground: unverändert über die Contexts. Prüfen, dass sie ohne Snapshot den Leerzustand zeigen und keinen Request stellen.
- [x] Tests anpassen: `__tests__/unit/*` (entfernte Utils), `mediaUrl.spec.ts` (relative Basis `/api/`), BDD
      `support/helpers.ts` (`MEDIA_BASE_URL` auf `http://localhost:5173/api/media`) und Steps, die heute auf den
      `localStorage`-Sync bauen.

### Doku
- [x] `docs/architecture.md`: Diagramm, Abschnitt „Synchronisation“ neu (Server als Quelle, WebSocket, Heartbeat, Reconnect,
      ein Worker), Endpoints (`/table`, `/ws`), Antwortformat, Proxy, „API-URL“ und „LAN/CORS“ vereinfacht, Migration `0004`.
- [x] `docs/screens.md` (Ist: Admin-Hinweise, Theme global, Player-Theme lokal), `docs/domain.md` (Spieltisch, globales Theme),
      `docs/known-issues.md` (ein Worker; Player noch nicht verbunden; Audio noch im Admin), `frontend/CLAUDE.md`,
      `backend/CLAUDE.md`, `backend/README.md`, `backend/.env.example`, `CLAUDE.md` (Leitplanke „Setup am Spieltisch“:
      Synchronisation per WebSocket statt `localStorage`).

## Akzeptanzkriterien

### AK1: Wall auf einem anderen Gerät folgt live
- **Given** der Prod-Stack läuft, der Admin ist auf dem Spieltisch-Rechner geöffnet, die Wall in einem anderen Browser oder auf
  einem anderen Gerät über `http://<IP>:8080/wall`
- **When** der Spielleiter eine Szene bestätigt
- **Then** zeigt die Wall innerhalb von etwa einer Sekunde das Wall-Bild der neuen Szene, ohne Reload und ohne besonderen Build.

### AK2: Abenteuer wechseln
- **Given** zwei Abenteuer, A mit gespeicherter aktiver Szene, Admin, Wall und Ground verbunden
- **When** der Spielleiter im Admin zu A wechselt
- **Then** zeigen alle Screens direkt die gespeicherte Szene von A, und zu keinem Zeitpunkt ist eine Szene eines anderen Abenteuers zu sehen.

### AK3: Theme gilt für alle Spieltisch-Screens
- **Given** Admin, Wall und Ground verbunden, ein Player Screen offen
- **When** der Spielleiter in der TopBar das Theme umschaltet
- **Then** wechseln Admin, Wall und Ground das Theme, der Player Screen nicht. Nach einem Reload eines Screens bleibt das Theme erhalten.

### AK4: Zustand übersteht Neustart und Reload
- **Given** ein gewähltes Abenteuer, eine aktive Szene und ein gewähltes Theme
- **When** die API neu startet bzw. ein Screen neu geladen wird (auch in einem Browser mit leerem `localStorage`)
- **Then** zeigen alle Screens nach dem Neuverbinden denselben Stand wie vorher.

### AK5: Verbindungsabbruch
- **Given** Admin, Wall und Ground verbunden
- **When** die API gestoppt wird
- **Then** zeigt der Admin spätestens nach etwa 35 s die Leiste „Verbindung zum Server getrennt“, Wall und Ground behalten ihr Bild.
- **And when** die API wieder läuft, **then** verbinden sich alle selbst neu, und die Leiste verschwindet.

### AK6: Speichern schlägt fehl
- **Given** ein `PATCH` beim Szenen-, Abenteuer- oder Theme-Wechsel schlägt fehl
- **When** der Spielleiter die Änderung auslöst
- **Then** ändert sich auf keinem Screen etwas, und der Admin zeigt „Änderung konnte nicht gespeichert werden“. „Erneut versuchen“
  wiederholt den Schreibzugriff.

### AK7: Zwei Admins
- **Given** zwei Admin-Fenster in verschiedenen Browsern
- **When** in einem eine Szene gewählt wird
- **Then** zeigt auch das andere Admin-Fenster sie sofort als aktiv. Der letzte Schreibzugriff bestimmt den Stand.

### AK8: Fremde Herkunft wird abgewiesen
- **Given** eine Seite mit fremdem Origin (nicht in `CORS_ORIGINS`, anderer Host)
- **When** sie eine WebSocket-Verbindung zu `/ws` öffnet
- **Then** lehnt der Server die Verbindung ab.

## Teststrategie / Verifikation

**Automatisch**
- Backend: `uv run pytest` (neue Tests siehe Subtasks), `ruff check`, `ruff format --check`, `mypy app`, `alembic check`,
  CI-Rundlauf inkl. `0004`, `openapi.json` aktuell.
- Frontend: `npm run typecheck` (`schema.d.ts` aktuell), `npm run lint`, `npm run test:unit` (Nachrichten, Backoff, Heartbeat,
  `wsUrl`, `mediaUrl`), `npm run build`, `docker build --target prod`.
- E2E: `npm run test:e2e` gegen den Dev-Stack.

**Manuell**
1. `dnd dev`: Admin, Wall und Ground im selben Browser → Szenenwechsel live; DevTools: keine `localStorage`-Schlüssel
   `activeAdventureId`/`activeSceneId` mehr, eine WS-Verbindung je Fenster, alle 15 s ein `ping`.
2. `dnd prod`: Wall in einem zweiten Browser bzw. auf einem Tablet über `http://<IP>:8080/wall` (AK1), Bilder und Musik-Medien
   laden über `/api/media/...`.
3. Abenteuerwechsel mit zweitem Abenteuer (per SQL) (AK2); Theme umschalten, Player Screen bleibt (AK3).
4. `docker restart dnd-prod-api` → Admin-Leiste erscheint, nach dem Neustart verbinden sich alle neu, Stand unverändert (AK4, AK5).
5. Zweiter Admin in anderem Browser (AK7).
6. Origin-Test: `websocat -H 'Origin: http://evil.example' ws://localhost:8000/ws?screen=wall` → abgewiesen (AK8).

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-10-18

**Empfehlung:** Nacharbeiten. Ein blockierender Befund (`npm run test:e2e` rot); alle acht AK erfüllt. H1 in derselben
Runde mit erledigen.

Geprüft: Commit `997246d` auf `development`, Diff vollständig, alle Checks; AK live per Selenium. Prod-Image
(`docker build --target prod`, nginx) als temporärer Container `dnd-review-ui` auf `:8080` im Netz des Dev-Stacks;
Admin über `http://localhost:8080`, Wall, Ground, Player und zweiter Admin über `http://192.168.178.104:8080` (anderer
Origin, eigener `localStorage`). Abenteuer 9002 per SQL angelegt und wieder gelöscht, `dnd-dev-api` einmal gestoppt
und gestartet. Container und Image entfernt, Dev-DB wieder auf
`{"active_adventure_id":1,"active_scene_id":null,"theme":"dark"}`, pytest danach 125 grün.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Wall auf anderem Gerät folgt live | erfüllt | Admin auf `localhost:8080`, Wall auf `192.168.178.104:8080/wall`; Szenenwechsel nach 25–52 ms ohne Reload; Medien über `/api/media/...`, Range → 206; `nginx.conf:33-49`, `wsUrl.ts:3-11`. Einschränkung: Prod-Image im Dev-Netz statt `dnd prod` |
| AK2 Abenteuer wechseln | erfüllt (Code und Tests; live teilweise, siehe H1) | Snapshot mit Abenteuer und Szene in einer Nachricht (`services/game_table.py:12-21`), keine lokale Vorwegnahme; `test_ws.py::test_switching_the_adventure_pushes_its_stored_scene` grün. Live 9002 → 1 korrekt; Gegentest durch H1 verfälscht |
| AK3 Theme für Spieltisch-Screens | erfüllt | Wall, Ground, Admin-Bar wechseln auf Tavern, Player bleibt; nach Reload bleibt Tavern; zweiter Admin wirkt ebenso |
| AK4 Neustart und Reload | erfüllt | Nach `docker stop`/`start dnd-dev-api` gleicher Stand; neues Browserprofil auf `/wall` zeigt dieselbe Szene und dasselbe Theme |
| AK5 Verbindungsabbruch | erfüllt | Admin zeigt sofort „Verbindung zum Server getrennt“, Wall/Ground behalten Bild ohne `role=alert`; Leiste verschwindet ~2,7 s nach Start. 35-s-Fall nur per Unit-Test (`heartbeat.spec.ts`, `gameTableConnection.spec.ts`) |
| AK6 Speichern schlägt fehl | erfüllt | PATCH per CDP blockiert → Leiste „Änderung konnte nicht gespeichert werden“, Wall unverändert, Kachel nicht aktiv; „Erneut versuchen“ wiederholt den letzten Zugriff; `AdminScreen.tsx` `runSave`/`retrySaving` |
| AK7 Zwei Admins | erfüllt | Kachel im Admin 2 nach 8–21 ms `data-active="true"`; Einschränkung H1 |
| AK8 Fremde Herkunft abgewiesen | erfüllt | `Origin: http://evil.example` → HTTP 403 auf `:8000` und über Vite-Proxy `:5173`; ohne Origin / `localhost:5173` / gleicher Host angenommen; `realtime/origin.py:17-31`, `test_ws.py::test_origin_check` |

**Blockierende Befunde**
- [x] **E2E-Suite rot:** `npm run test:e2e` gegen den Dev-Stack 3/3 Läufe rot (1 failed, 3 passed), `selectSideScene`
  an „I click the Confirm button“ bzw. „I see the correct wall image“. Ursache: jest führt `selectMainScene.ts` und
  `selectSideScene.ts` parallel aus; beide schreiben jetzt in denselben Server-Zustand. Gegenprobe: `--runInBand`
  3/3 grün. Vorschlag: `--runInBand` im Skript `test:e2e` oder `maxWorkers: 1` in der jest-Config, mit Kommentar.

**Hinweise (nicht blockierend)**
- **H1 – Auto-Auswahl weicht von E3 ab:** Der Effekt mit `selectDefaultAdventureId(adventures, activeAdventureId)` in
  `AdminScreen.tsx` schreibt auch, wenn das gesetzte Abenteuer nicht in der zuvor geladenen Liste steht. Ein vor dem
  Anlegen eines neuen Abenteuers geöffneter Admin setzt dessen Auswahl per `PATCH /table` auf 1 zurück (live
  beobachtet). Widerspricht E5/AK7; betrifft manuellen Prüfschritt 3. Vorschlag: nur bei `activeAdventureId === null`
  schreiben.
- **H2 – Dev-Container neu erstellt, DB auf 0004:** erwartet.
- **H3 – `data-active` an `MapElement`:** kleines Test-Attribut, in Ordnung (E2E wartet auf den Push).
- **H4 – `active_adventure_id` NULL auf leerer DB:** passt zu E1; Wall/Ground bleiben leer, bis ein Admin geöffnet
  wurde. Kurze Notiz in `architecture.md` wäre gut.
- **H5 – Fixtures in `conftest.py`, TRUNCATE um `game_table`:** sinnvoll.
- **H6 – `getAdventure`:** in `src/` ungenutzt, nur noch in `__tests__/unit/apiErrors.spec.ts:72`; toter Code.
- **H7 – `frontend/README.md`, `DESIGN.md`:** Korrektur gehört zum Scope Doku.
- **H8 – `connected=true` beim ersten Versuch:** passt zu E6 (`connection.ts:79-91`).
- **H9 – `isDarkTheme` auf allen Routen:** `App.tsx:21-23` schreibt ihn auch auf `/admin`, `/wall`; harmlos, sauberer
  wäre eine eigene Player-Komponente unter `/`.
- **H10 – E2E verändert den geteilten Zustand:** alle offenen Dev-Fenster sehen die E2E-Szenen; steht in
  `known-issues.md`.
- **H11 – Kein eigener Plan-Commit:** wie bei DND-23/24.
- **H12 – Lint-Warnung `alt` in `WallScreen.tsx:194`:** bestand vorher.
- **Konventionen:** Commit-Schema, Body, keine KI-Signatur, ein Commit, Branch `development` – passt. Subtasks
  abgehakt und belegt, nichts außerhalb des Scopes.

**Checks**
- Backend: `ruff check`, `ruff format --check`, `mypy app` grün; `alembic check` ohne Abweichung; `pytest` 125
  passed; `openapi.json` aktuell.
- Frontend: `typecheck` grün, `schema.d.ts` aktuell; `lint` 0 Fehler, 1 bekannte Warnung; `test:unit` 129 passed;
  `build`, `docker build --target prod`, `nginx -t` grün.
- E2E: `npm run test:e2e` **rot** (1 von 4); mit `--runInBand` 4/4 grün.

### Runde 2 – 2026-10-18

**Empfehlung:** Abnahme. Blocker aus Runde 1 behoben (`npm run test:e2e` 3/3 Läufe grün), H1 und H4 umgesetzt, H1 live
nachgeprüft. Alle acht AK weiter erfüllt, keine Regression, keine neuen Blocker.

Geprüft: Nacharbeits-Commit `1654d4c` (Diff vollständig) auf Basis von `997246d`, alle Checks erneut. H1 live per
Selenium (headless Chrome) gegen den Dev-Stack; Abenteuer 9002 per SQL angelegt und wieder gelöscht. Dev-DB danach
wieder `{"active_adventure_id":1,"active_scene_id":null,"theme":"dark"}`, Arbeitsbaum sauber.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Wall auf anderem Gerät folgt live | erfüllt | Proxy, WS-Client und Backend unverändert (`git diff 997246d 1654d4c` nur `adventure.ts`, `adventure.spec.ts`, `package.json`, Doku); Beleg aus Runde 1 |
| AK2 Abenteuer wechseln | erfüllt | Einschränkung H1 weg: Admin mit vor 9002 geladener Liste offen, `PATCH /table {"active_adventure_id":9002}` bleibt nach 4 s und nach Reload bestehen; `test_ws.py::test_switching_the_adventure_pushes_its_stored_scene` grün |
| AK3 Theme für Spieltisch-Screens | erfüllt | Code unverändert, Beleg aus Runde 1 |
| AK4 Neustart und Reload | erfüllt | Code unverändert, Beleg aus Runde 1 |
| AK5 Verbindungsabbruch | erfüllt | Code unverändert; `heartbeat.spec.ts`, `gameTableConnection.spec.ts` grün |
| AK6 Speichern schlägt fehl | erfüllt | Code unverändert, Beleg aus Runde 1 |
| AK7 Zwei Admins | erfüllt | Admin mit veralteter Liste überschreibt fremde Wahl nicht mehr; `AdminScreen.tsx:284-287`, `adventure.ts:10-13` |
| AK8 Fremde Herkunft abgewiesen | erfüllt | Backend unverändert; `test_ws.py::test_origin_check` grün |

**Blockierende Befunde**
- keine

**Prüfung der Nacharbeiten**
- **Blocker E2E:** `frontend/package.json:14` → `jest --runInBand`, Begründung in `package.json:6` (`"//"`) und
  `frontend/CLAUDE.md:26-27`; 3/3 Läufe grün (je 2 Suites, 4 Tests), Specs nacheinander. Der `"//"`-Schlüssel ist die
  von npm dokumentierte Kommentar-Konvention, gültiges JSON; `npm pkg get '//'`, `npm ci --dry-run`, `typecheck`,
  `lint`, `build` ohne Beanstandung.
- **H1:** `selectDefaultAdventureId` gibt jede gesetzte `activeId` zurück, Fallback nur bei `null`
  (`frontend/src/utils/adventure.ts:10-13`); Unit-Test inkl. leerer Liste (`adventure.spec.ts:16-19`). Gegenprobe
  live: bei `null` setzt der Admin weiterhin das erste Abenteuer (E3 erfüllt).
- **H4:** Notiz in `docs/architecture.md:206-208`, passt zum Code.

**Hinweise (nicht blockierend)**
- **H13 – Zeilenumbruch `architecture.md:208-209`:** Absatz nach der Ergänzung unsauber umbrochen; kosmetisch.
- **H14 – Admin mit veralteter Liste:** neu angelegtes, aktives Abenteuer erscheint dort erst nach Reload in der
  Auswahl; Folge des H1-Fixes, entspricht E5. Anzeige im Detail nicht geprüft.
- **H15 – Plan-Datei im Commit:** Bericht Runde 1 mit `1654d4c` committet, Blocker dort abgehakt; in Ordnung.
- **Weiterhin offen aus Runde 1:** H6 (`getAdventure` toter Code), H9 (`isDarkTheme` auf allen Routen), H10 (E2E
  ändert geteilten Dev-Zustand, `active_scene_id` danach 3), H12 (Lint-Warnung `alt`).
- **Konventionen:** ein Commit auf `development`, `feat(DND-25): address review round 1`, Body Stichpunkte, keine
  KI-Signatur, nichts außerhalb des Scopes.

**Checks**
- Backend: `ruff check` grün, `ruff format --check` 62 Dateien, `mypy app` ohne Befund, `pytest` 125 passed.
- Frontend: `typecheck` grün, `lint` 0 Fehler / 1 bekannte Warnung, `test:unit` 129 passed, `build` grün,
  `npm ci --dry-run` ok.
- E2E: `npm run test:e2e` 3/3 Läufe grün; Dev-DB danach auf aktive Szene `null` zurückgesetzt.
