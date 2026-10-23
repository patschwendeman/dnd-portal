# DND-27: Smartphones anbinden (Player Screen am Spieltisch, Theme, QR-Code im Admin)

**Typ:** feat
**Status:** Fertig

## Kontext & Ziel

Seit DND-25/26 ist der Server die einzige Quelle des Spieltisch-Zustands und pusht ihn an Admin, Wall und Ground. Nur
der Player Screen auf den Smartphones ist noch nicht angebunden: Er hat einen eigenen `ThemeProvider` mit dem
`localStorage`-Schlüssel `isDarkTheme` (`frontend/src/app/App.tsx`). Ziel: Der Player Screen verbindet sich mit dem Spieltisch
und übernimmt dessen Theme. Ein Spieler kann auf seinem Gerät bewusst davon abweichen. Damit die Spieler den Screen
leicht öffnen können, zeigt der Admin einen **QR-Code** mit der Player-URL. Dritter und letzter Schritt der Zieldefinition
(nach DND-25 Zustand und DND-26 Audio). Abenteuer, Szene und Audio empfängt der Player, zeigt sie aber noch nicht an.

**Voraussetzung:** DND-25 und DND-26 (fertig).

## Scope / Non-Goals

**Im Scope**
- Player Screen verbindet sich per `/ws?screen=player` und übernimmt das globale Theme.
- Lokale Theme-Abweichung pro Gerät über ein Menü mit drei Optionen.
- Sofortiger Reconnect aller Screens, wenn der Tab wieder sichtbar wird (Smartphone entsperrt).
- Player-URL: vom Start-Skript ermittelt, über die API bereitgestellt; QR-Code-Dialog im Admin.
- Tests und Doku (inkl. Spieltisch-Setup für Smartphones).

**Nicht im Scope**
- Anzeige von Abenteuer, Szene, Charakter oder Spielerdaten im Player Screen; Charakterauswahl.
- Ressourcen des Player Screens synchronisieren oder speichern (bleiben lokal).
- Audio auf dem Smartphone.
- Liste bzw. Anzahl der verbundenen Smartphones im Admin.
- Verbindungshinweis auf dem Player Screen (wie bisher zeigt nur der Admin technische Hinweise).
- HTTPS, Authentifizierung, Beitrittscodes.

## Entscheidungen

### E1: Player Screen am Spieltisch
- **Entscheidung:** Die Route `/` wird wie Admin, Wall und Ground vom `GameTableProvider` umschlossen (`screen='player'`).
  Der Player nutzt nur das Theme. `state`-, `audio`- und `sound`-Nachrichten kommen an, der Player verwendet sie aber nicht und
  sendet selbst nichts. Er zeigt keinen Verbindungsstatus, bei einer Trennung bleibt das letzte Theme. Bis zum ersten Snapshot gilt
  wie überall `dark` (bzw. die lokale Abweichung, E2).
- **Begründung:** Gleicher Weg wie die anderen Screens. Der Server akzeptiert `screen=player` bereits (DND-25).

### E2: Lokale Theme-Abweichung per Menü
- **Entscheidung:** Der Settings-Button oben links im Player Screen öffnet ein kleines Menü mit drei Optionen: **„Wie
  Spieltisch“** (Standard), **„Dunkel“**, **„Taverne“**. Die aktuelle Wahl ist markiert. Die Wahl wird nur auf diesem Gerät gespeichert:
  `localStorage` `playerThemeOverride` = `dark` | `tavern`, fehlender oder ungültiger Wert = „Wie Spieltisch“. Das wirksame
  Theme ist `Abweichung ?? Spieltisch-Theme`. Ein Wechsel des Spieltisch-Themes durch den Admin ändert eine gesetzte
  Abweichung nicht. Bedienbar per Tastatur und Touch, schließt per Auswahl, Escape oder Tippen außerhalb. Wenn es passt, kommen
  die Listbox-Helfer aus DND-24 (`src/utils/listbox.ts`) zum Einsatz. Gestaltet nach `frontend/DESIGN.md`.
  Der `GameTableProvider` bekommt dafür eine optionale Theme-Abweichung (z. B. Prop `themeOverride`).
- **Verworfene Alternativen:** Toggle, der automatisch zum Spieltisch zurückkehrt, wenn er dessen Theme trifft.
- **Begründung:** Eindeutig, und „zurück zum Spieltisch“ ist ein Tipp.

### E3: Alter Theme-Wert wird verworfen
- **Entscheidung:** Beim Start entfernt das Frontend den alten Schlüssel `isDarkTheme` aus dem `localStorage`, ohne ihn zu übernehmen.
  Nach dem Update folgen alle Smartphones zunächst dem Spieltisch.
- **Verworfene Alternativen:** den Altwert als Abweichung übernehmen.

### E4: Sofortiger Reconnect beim Sichtbarwerden
- **Entscheidung:** Wird der Tab wieder sichtbar (`visibilitychange` → `visible`) und ist die Verbindung nicht offen, verbindet
  der Client sofort neu (`reconnectNow`), statt auf den Heartbeat (35 s) bzw. den Backoff (bis 10 s) zu warten. Das gilt für alle
  Screens. Die Logik steckt testbar in `src/realtime/` (injizierbare Sichtbarkeitsquelle wie `Timers`/`SocketLike`).
- **Begründung:** Smartphones sperren sich ständig. Nach dem Entsperren soll das Theme sofort stimmen.

### E5: Player-URL vom Start-Skript, bereitgestellt über die API
- **Entscheidung:**
  - `script.sh` ermittelt wie heute die IP von `en0` und exportiert vor `docker compose … up` die Variable `PLAYER_URL`:
    `prod` → `http://<IP>:8080/`, `dev` → `http://<IP>:5173/`. Ohne IP bleibt sie leer. Eine bereits gesetzte `PLAYER_URL`
    aus der Umgebung hat Vorrang.
  - `compose.prod.yaml` und `compose.dev.yaml` geben `PLAYER_URL` an den Service `api` weiter (`environment`, leer als Default).
  - `Settings.player_url: str | None` (leer = `None`), dokumentiert in `backend/.env.example`.
  - Neuer Endpoint `GET /table/join` → `JoinInfo { player_url: str | null }`.
  - Der Admin nimmt `player_url` aus der API. Ist sie `null`, nimmt er `window.location.origin + '/'`, sofern der Admin
    nicht über `localhost`, `127.0.0.1` oder `[::1]` geöffnet ist. Sonst gibt es keine URL (E6). Die Auswahl macht eine reine Funktion
    mit Unit-Test.
- **Verworfene Alternativen:** Admin per LAN-IP öffnen und nur `window.location` nutzen; URL manuell im Admin eintragen.
- **Begründung:** Funktioniert mit dem üblichen Start `dnd prod`, ohne manuellen Schritt. Der Container selbst kennt die LAN-IP nicht.

### E6: QR-Code-Dialog im Admin
- **Entscheidung:** In der TopBar des Admins öffnet ein Button (Icon z. B. `assets/icons/phone.svg`, Titel
  „Spieler verbinden“) einen Dialog mit dem QR-Code der Player-URL (`QRCodeSVG` aus der neuen Abhängigkeit `qrcode.react`) und der URL als
  Text darunter. Der QR-Code ist unabhängig vom Theme immer dunkel auf hellem Grund mit Ruhezone, damit Kameras ihn sicher erkennen. Ohne URL
  zeigt der Dialog statt des Codes den Hinweis „Player-URL unbekannt – Spieltisch mit `dnd prod` starten oder den Admin
  über die IP des Rechners öffnen“. Schließen per Button, Escape oder Klick außerhalb. Die URL wird beim Öffnen des Dialogs geladen.
  Ein Ladefehler zeigt denselben Hinweis und wird per `console.error` geloggt.
- **Begründung:** Die Spieler scannen am Tisch den Code statt eine IP abzutippen.

## Subtasks

### Vertrag
- [x] Schema `JoinInfo` (`app/schemas/game_table.py` oder eigenes Modul), Route `GET /table/join` (Router `table`).

### Backend
- [x] `Settings.player_url` (leerer String → `None`), `backend/.env.example`.
- [x] Route und Service für `GET /table/join`.
- [x] `uv run python scripts/export_openapi.py`.
- [x] Tests: `tests/test_table.py` (`/table/join` mit gesetzter und ohne `player_url`, per `monkeypatch` auf `settings`),
      `tests/test_config.py` (`PLAYER_URL` leer → `None`, gesetzt → Wert), `tests/test_ws.py` (Player-Verbindung erhält
      `state` und `audio`, falls noch nicht abgedeckt).

### Setup
- [x] `script.sh`: `PLAYER_URL` für `prod` und `dev` gemäß E5 exportieren (bestehende IP-Ermittlung wiederverwenden, Ausgabe der
      Smartphone-URL bleibt).
- [x] `compose.prod.yaml`, `compose.dev.yaml`: `PLAYER_URL` an `api` durchreichen.

### Frontend
- [x] `npm install qrcode.react` (`package.json`, `package-lock.json`); `npm run generate:api`; `src/models/models.ts`: `JoinInfo`.
- [x] `App.tsx`: Route `/` mit `GameTableProvider screen='player'`; eigener `ThemeProvider` und `isDarkTheme`-Logik
      entfallen. Altschlüssel entfernen (E3).
- [x] Theme-Abweichung: reine Funktionen für Lesen/Schreiben von `playerThemeOverride` und das wirksame Theme (Unit-Tests);
      `GameTableProvider` um `themeOverride` erweitern.
- [x] `PlayerScreen.tsx`: Settings-Button öffnet das Menü gemäß E2 (neue Komponente, z. B. `ThemeMenu.tsx`).
- [x] `src/realtime/`: Reconnect bei Sichtbarkeit gemäß E4 (in `connection.ts` bzw. `useGameTable.ts`), Unit-Test mit Fake-Quelle.
- [x] Player-URL-Auswahl (E5) als reine Funktion mit Unit-Test (API-Wert, Fallback `window.location`, `localhost`/`127.0.0.1`/`[::1]` → keine URL).
- [x] `TopBar.tsx`: Button „Spieler verbinden“; Dialog `JoinDialog.tsx` gemäß E6; Laden über `src/service/adminScreen.ts`
      (`getJoinInfo`).

### Doku
- [x] `docs/architecture.md`: Synchronisation (Player verbunden, Theme mit Abweichung, Reconnect bei Sichtbarkeit),
      Endpoint `/table/join`, „Am Spieltisch“ (Smartphones: QR-Code im Admin bzw. ausgegebene URL, kein Sonder-Build),
      `PLAYER_URL` im Start-Skript und in Compose.
- [x] `docs/screens.md` (Ist Player: Theme-Menü, verbunden; Ist Admin: QR-Dialog), `docs/known-issues.md` (Eintrag „Player
      Screens verbinden sich noch nicht“ entfernen), `docs/domain.md` falls nötig, `CLAUDE.md` (Leitplanke „Setup am
      Spieltisch“: Player-Screens angebunden), `frontend/CLAUDE.md`, `backend/CLAUDE.md`, `backend/README.md`.

## Akzeptanzkriterien

### AK1: Smartphone folgt dem Spieltisch-Theme
- **Given** der Spieltisch läuft mit `dnd prod`, ein Smartphone hat `http://<IP>:8080/` geöffnet und keine Abweichung gewählt
- **When** der Spielleiter im Admin das Theme umschaltet
- **Then** wechselt der Player Screen auf dem Smartphone ohne Reload ins neue Theme.

### AK2: Lokale Abweichung
- **Given** ein Smartphone mit geöffnetem Player Screen
- **When** der Spieler im Settings-Menü „Taverne“ wählt und der Spielleiter danach das Spieltisch-Theme ändert
- **Then** bleibt dieses Smartphone bei „Taverne“, auch nach einem Reload, andere Smartphones folgen dem Spieltisch.
- **And when** er „Wie Spieltisch“ wählt, **then** zeigt es sofort das aktuelle Spieltisch-Theme.

### AK3: Entsperren
- **Given** ein Smartphone war gesperrt, und in dieser Zeit wurde das Spieltisch-Theme geändert
- **When** der Spieler das Smartphone entsperrt
- **Then** zeigt der Player Screen nach kurzer Zeit (ohne 35 s Wartezeit) das aktuelle Theme.

### AK4: QR-Code im Admin
- **Given** der Spieltisch wurde mit `dnd prod` gestartet und die IP von `en0` ist ermittelbar
- **When** der Spielleiter in der TopBar „Spieler verbinden“ öffnet und ein Spieler den Code mit der Smartphone-Kamera scannt
- **Then** öffnet sich auf dem Smartphone der Player Screen unter `http://<IP>:8080/`. Die URL steht auch als Text im Dialog.

### AK5: URL unbekannt
- **Given** der Stack wurde ohne `PLAYER_URL` gestartet (z. B. direkt per `docker compose`), und der Admin ist über `localhost` geöffnet
- **When** der Spielleiter den Dialog öffnet
- **Then** zeigt er statt eines QR-Codes den Hinweis „Player-URL unbekannt …“.
- **And given** der Admin ist über `http://<IP>:8080/admin` geöffnet, **then** zeigt der Dialog den QR-Code für `http://<IP>:8080/`.

### AK6: Altwert verworfen
- **Given** ein Smartphone mit gespeichertem `isDarkTheme` aus einer früheren Version
- **When** der Player Screen nach dem Update geladen wird
- **Then** folgt es dem Spieltisch-Theme, und `isDarkTheme` ist aus dem `localStorage` entfernt.

## Teststrategie / Verifikation

**Automatisch**
- Backend: `uv run pytest`, `ruff check`, `ruff format --check`, `mypy app`, `openapi.json` aktuell.
- Frontend: `npm run typecheck`, `npm run lint`, `npm run test:unit` (Theme-Abweichung, wirksames Theme, Player-URL-Auswahl,
  Reconnect bei Sichtbarkeit), `npm run build`, `docker build --target prod`.
- E2E: `npm run test:e2e` gegen den Dev-Stack (bestehende Features laufen weiter).
- Skript: `bash -n script.sh`.

**Manuell** (`dnd prod`, Smartphone im selben WLAN)
1. Admin → „Spieler verbinden“ → QR-Code scannen → Player Screen öffnet sich (AK4).
2. Theme im Admin umschalten → Smartphone folgt (AK1). Im Menü „Taverne“ wählen, Admin-Theme ändern, Reload → bleibt (AK2);
   „Wie Spieltisch“ → folgt wieder.
3. Smartphone sperren, Theme im Admin ändern, entsperren → stimmt nach kurzer Zeit (AK3).
4. Stack per `docker compose -f compose.prod.yaml up -d` ohne Skript starten → Dialog zeigt den Hinweis. Admin über
   `http://<IP>:8080/admin` öffnen → QR-Code erscheint (AK5).
5. Im Browser vorher `localStorage.setItem('isDarkTheme', 'false')`, Player laden → folgt dem Spieltisch, Schlüssel weg (AK6).

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-10-18
**Empfehlung:** Abnahme – keine blockierenden Befunde. Vor „Fertig“ noch die Smartphone-Prüfungen 1 (QR-Scan, AK4) und 3 (Entsperren, AK3).

Geprüft: Commit `3ce061b` gegen `a9a6f37` (Diff vollständig), zusätzlich Browserprüfung (headless Chrome) gegen den Dev-Stack über `localhost:5173` und LAN-IP; Spieltisch-Theme danach wieder `dark`.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Smartphone folgt Spieltisch-Theme | erfüllt (echtes Smartphone mit `dnd prod` offen) | `App.tsx:13-23,37`, `GameTableProvider.tsx:50`; Laufzeit: `PATCH /table {"theme":"tavern"}` wechselt Hintergrund ohne Reload; `test_player_receives_the_push_after_patch_table` |
| AK2 Lokale Abweichung | erfüllt | `ThemeMenu.tsx`, `utils/playerTheme.ts`; zwei Player: B bleibt bei Taverne (auch nach Reload), „Wie Spieltisch“ entfernt den Schlüssel; Escape/`pointerdown`/Tastatur ok; `playerTheme.spec.ts` |
| AK3 Entsperren | Code + Unit-Tests erfüllt; Smartphone offen | `connection.ts:149-153`, `visibility.ts`; neue Tests in `gameTableConnection.spec.ts`; Restrisiko H1 |
| AK4 QR-Code im Admin | Kette erfüllt; Kamera-Scan offen | `script.sh:74-86,104,112-113`, `compose.prod.yaml`, `config.py:26-34`, `routes/table.py:22-24`, `test_join_returns_the_configured_player_url`, `test_player_url_*`, `playerUrl.spec.ts`; Dialog rendert SVG `#000`/`#fff`, Ruhezone 4 Module, URL als Text |
| AK5 URL unbekannt | erfüllt (Dev 5173; Prod 8080 identischer Code) | `/table/join` → `null`; über `localhost` Hinweis ohne QR, über LAN-IP QR + URL; `selectPlayerUrl` inkl. `[::1]` |
| AK6 Altwert verworfen | erfüllt | `App.tsx:30`, `discardLegacyPlayerTheme`; Laufzeit: `isDarkTheme` entfernt, Player folgt Spieltisch |

**Blockierende Befunde**
- keine

**Vor Abschluss (kein Code-Befund)**
- [x] Manuelle Prüfungen 1 (QR-Code scannen, AK4) und 3 (sperren/entsperren, AK3) mit `dnd prod` am Smartphone; 2, 4, 5 per Browser am Dev-Stack abgedeckt. Am 2026-10-23 vom User am Smartphone bestätigt; H1 (Zombie-Socket) trat dabei nicht auf

**Hinweise**
- H1 „Zombie-Socket“ (Vermutung): `reconnectNow` nur bei `open === false` (E4); hält das Smartphone einen toten Socket für offen, greift erst der Watchdog (35 s). Falls Prüfung 3 das zeigt: beim Sichtbarwerden auch neu verbinden, wenn letzte Nachricht älter als Ping-Intervall
- H2 Eigenentscheidungen des Implementers ohne Einwand: Farbrollen `qr.foreground`/`qr.background` (DESIGN.md 2.1, `contrast.md` 21:1); Zusatz-Doku im Doku-Scope; Dialogzustand in `TopBar` mit Fokus-Rückgabe; `PlayerRoute` + `themeOverride` gemäß E2; `pointerdown` (Abweichung: `AdventureSelect.tsx:146` nutzt `mousedown`)
- H3 `PLAYER_URL` aus `backend/.env` wirkt im Container nicht (Compose-`environment` überschreibt); korrekt dokumentiert
- H4 `docs/screens.md` verkürzt: sofortiger Reconnect nur bei nicht offener Verbindung (`architecture.md` korrekt)
- H5 Hinweistext mit „dnd prod“ in typografischen Anführungszeichen statt Backticks – vertretbar
- H6 Dialog ohne Fokusfalle trotz `aria-modal` – vom Plan nicht verlangt
- H7 Lint-Warnung `WallScreen.tsx:216` (`img` ohne `alt`) bestand vorher
- H8 AK5 auf Prod-Port 8080 nicht live geprüft; Logik port-unabhängig

**Checks:** Backend `ruff check`/`ruff format --check`/`mypy app` ok, `pytest` 173 passed, `openapi.json` aktuell; Frontend `typecheck` ok, `lint` 0 Fehler/1 Warnung (H7), `test:unit` 167 passed, `build` ok, `test:e2e` 4/4, `docker build --target prod` ok; `bash -n script.sh` ok, `docker compose config` rendert `PLAYER_URL` korrekt; ein Commit nach Schema, ohne KI-Signatur, Arbeitsbaum sauber
