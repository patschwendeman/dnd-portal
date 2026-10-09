# DND-11: Ladefehler abfangen statt unhandled rejections, Hinweis im Admin Screen

**Typ:** fix
**Status:** Im Review

## Kontext & Ziel

Schlägt das Laden von Daten fehl (Backend nicht erreichbar, Timeout, 4xx/5xx), werfen Admin, Wall und Ground den
Fehler in einer async-Funktion aus einem `useEffect` erneut – das ergibt unhandled promise rejections. Der Screen
bleibt leer oder auf altem Stand, der Spielleiter bekommt keinen Hinweis und kann nur neu laden. Außerdem verschluckt
`getData` jeden Fehler und liefert `undefined`, sodass die Services irreführend „… not found“ melden, und der
`DocumentReader` zeigt bei einer fehlerhaften Antwort deren Inhalt als Notiz an. Ziel: Fehler werden an einer Stelle
behandelt, der Spielleiter sieht im Admin Screen einen Hinweis mit „Erneut versuchen“, die Spieler-Screens (Wall,
Ground) bleiben ruhig auf dem letzten Stand.

## Fehlerbild

**Reproduktion**
1. Stack starten, Admin, Wall und Ground öffnen.
2. Backend stoppen (`docker compose stop app`).
3. a) Admin neu laden. b) Im Admin eine Szene wählen (falls Daten noch geladen) bzw. auf Wall/Ground den
   Szenenwechsel über `localStorage` auslösen.

**Ist:** Konsole zeigt „Uncaught (in promise) Error: Error fetching … : Error: … not found“; Admin bleibt leer,
kein Hinweis. Die Meldung „not found“ verschleiert, dass es ein Netzwerkfehler war.
**Soll:** Keine unhandled rejection. Admin zeigt unter der TopBar „Backend nicht erreichbar“ (o. ä.) mit Button
„Erneut versuchen“; nach Neustart des Backends lädt ein Klick die Daten. Wall und Ground behalten das zuletzt
angezeigte Bild, der Fehler steht nur in der Konsole.

## Ursache

- [apiMethods.ts](../../frontend/src/api/apiMethods.ts) `getData`: `catch` → `console.error`, Rückgabe `undefined`.
- Services [adminScreen.ts](../../frontend/src/service/adminScreen.ts), [WallScreen.ts](../../frontend/src/service/WallScreen.ts),
  [groundScreen.ts](../../frontend/src/service/groundScreen.ts): werfen bei `undefined` „… not found“.
- Screens [AdminScreen.tsx](../../frontend/src/screens/AdminScreen.tsx) (`fetchAdminData`, `fetchActiveScene`),
  [WallScreen.tsx](../../frontend/src/screens/WallScreen.tsx) (`fetchWallScreenData`),
  [GroundScreen.tsx](../../frontend/src/screens/GroundScreen.tsx) (`fetchGroundScreenData`): `catch` → `throw`, Aufruf
  aus `useEffect` ohne Behandlung → unhandled rejection.
- [DocumentReader.tsx](../../frontend/src/components/DocumentReader.tsx) `loadMarkdownFiles`: gleiches Muster; prüft
  `response.ok` nicht.
- [apiClient.ts](../../frontend/src/api/apiClient.ts): `timeout: 1000` – beim Start des Stacks knapp.

## Scope / Non-Goals

**Im Scope**
- `getData` reicht Fehler weiter; Services werfen aussagekräftige Fehler (Netzwerk/Timeout vs. HTTP-Status vs.
  leere Antwort).
- Admin: Fehlerzustand + Hinweisleiste unter der TopBar mit „Erneut versuchen“ (lädt Admin-Daten und aktive Szene neu).
- Wall, Ground: Fehler abfangen, `console.error`, letzten Stand behalten.
- `DocumentReader`: `response.ok` prüfen; bei Fehler im Notizbereich „Notizen konnten nicht geladen werden“.
- Timeout auf 5 s.
- Neuer Baustein „Hinweisleiste“ und Farbrollen im Style Guide.
- Regressionstests (vitest) auf API-/Service-Ebene.

**Nicht im Scope**
- Automatische Wiederholungen (bewusst nicht, siehe E3).
- API-Base-URL / Env-Variablen, Production-Image (eigener `setup`-Task).
- Synchrone `throw`s in Klick-Handlern (`handleSceneSelection`, `Dialogue.handleConfirm`, `filterSceneByKey`,
  `handleDialogue`) – sie verursachen keine unhandled rejection; unverändert.
- Backend-Fehlercodes (500 statt 404, Known Issues Backend).
- `DocumentReader`: leerer Tab „Side“ (`noneFight/`, eigener Known Issue).
- Wettlauf veralteter Antworten bei schnellen Szenenwechseln.
- Komponententests mit jsdom/Testing Library.

## Entscheidungen

### E1: Admin – Hinweisleiste unter der TopBar mit „Erneut versuchen“
- **Entscheidung:** Schlägt `getAdminData` oder `getSceneById` fehl, erscheint direkt unter der TopBar eine schmale
  Leiste über die volle Breite: Text links (z. B. „Backend nicht erreichbar – Szenen konnten nicht geladen werden“),
  Button „Erneut versuchen“ rechts (Baustein Text-Button). Ein Klick lädt Admin-Daten und aktive Szene neu; bei Erfolg
  verschwindet die Leiste. Ohne Fehler ist die Leiste nicht vorhanden (kein reservierter Platz).
- **Verworfene Alternativen:** Toast unten rechts; nur Hinweis ohne Button; nur Konsole; Leiste in vorhandenen Rollen.
- **Änderung nach Review Runde 1 (User):** Leiste etwas schmaler (weniger vertikaler Innenabstand). Statt des
  Text-Buttons „Erneut versuchen“ ein Icon-Button (Neu-laden-Symbol) in der Textfarbe `onError`, ohne eigene
  Fläche; zugänglicher Name „Erneut versuchen“ (`aria-label`/`title`), per Tastatur bedienbar.
- **Änderung nach Review Runde 2 (User, ohne Review):** Text nur „Backend nicht erreichbar“; Text und Icon-Button
  zentriert in der Leiste.
- **Farben:** neue Rollen `error` (Fläche) und `onError` (Text) in `darkTheme` und `tavernTheme`, Kontrast
  `onError` auf `error` ≥ 4,5 (Text 14–16px) und Button lesbar; Werte vom Implementer gewählt und in
  `contrast.md` (Theme-Werte + Messung) dokumentiert. Wie `badge.*`/`resource.*` dürfen beide Themes denselben Wert
  haben, wenn er in beiden passt.

### E2: Wall und Ground – letzten Stand behalten
- **Entscheidung:** Fehler werden abgefangen und mit `console.error` geloggt; die Anzeige bleibt auf dem letzten
  erfolgreich geladenen Stand (initial: leer wie heute). Kein sichtbarer Hinweis für Spieler. Der nächste
  Szenenwechsel (Änderung von `activeSceneId`) lädt erneut.

### E3: Keine automatischen Wiederholungen
- **Entscheidung:** Ein Versuch pro Ladevorgang; danach Fehlerzustand bzw. Konsole. Im Admin manuell per Button.

### E4: Timeout 5 s
- **Entscheidung:** `apiClient` `timeout: 5000`.

### E5: Notizen – Fehler im Notizbereich
- **Entscheidung:** `DocumentReader` prüft `response.ok`; schlägt eine Datei fehl, zeigt der Reader an Stelle der
  Seiten den Text „Notizen konnten nicht geladen werden“ (Stil wie Fließtext der Notizen, keine neue Farbe). Kein
  Retry-Button; Tab-Wechsel lädt erneut. Die Hinweisleiste bleibt für Backend-Fehler.

### E6: Fehler bis in den Screen durchreichen
- **Entscheidung:** `getData` wirft (kein `console.error`, kein `undefined` mehr). Services übersetzen in einen
  eigenen Fehlertyp oder klare Meldung (Netzwerk/Timeout, HTTP-Status, leere Antwort). Screens fangen genau einmal
  (im Effect bzw. in der Lade-Funktion) und setzen State oder loggen – kein erneutes `throw`.

## Subtasks

### Frontend
- [x] Regressionstests zuerst (`frontend/__tests__/unit/apiErrors.spec.ts` o. ä., `vi.mock` für `apiClient`/axios):
  - `getData` mit Netzwerkfehler/Timeout → Promise wird abgelehnt (nicht `undefined`).
  - `getData` mit HTTP 500 → abgelehnt, Status erkennbar.
  - Service (z. B. `getGroundScreenData`, `getAdminData`) bei Netzwerkfehler → abgelehnt mit Meldung, die nicht
    „not found“ lautet; bei leerer Antwort → abgelehnt mit „not found“-Meldung.
  - Lade-Funktion der Screens, soweit ohne React testbar herausgelöst (z. B. Hilfsfunktion
    `loadSafely(load, onError)`): Fehler landet in `onError`, Promise wird erfüllt (keine Ablehnung nach außen).
  Vor dem Fix rot, danach grün.
- [x] `apiClient.ts`: Timeout 5000.
- [x] `apiMethods.ts`: `getData` ohne `try/catch`-Verschlucken.
- [x] Services: Fehlermeldungen nach E6.
- [x] `AdminScreen`: Fehler-State, Hinweisleiste (neue Komponente, z. B. `ErrorBar`) unter `TopBar`, „Erneut
      versuchen“ ruft beide Ladevorgänge erneut auf; kein `throw` in `fetchAdminData`/`fetchActiveScene`.
- [x] `WallScreen`, `GroundScreen`: `catch` → `console.error`, State unverändert lassen.
- [x] `DocumentReader`: `response.ok` prüfen; Fehlerzustand mit Text nach E5; kein `throw`.
- [x] Themes: Rollen `error`, `onError` in `darkTheme.ts`, `tavernTheme.ts`, Typ in `styled.d.ts`.
      (Umgesetzt: `styled.d.ts` leitet `Colors` aus `darkTheme.colors` ab, braucht daher keine Änderung.)
- [x] ESLint: Die Regel `no-console` warnt; `console.error` an den bewussten Stellen zulassen (z. B.
      `no-console: ['warn', { allow: ['error'] }]` oder gezielte Ausnahme) – Entscheidung im Review sichtbar machen.
      (Umgesetzt: global `no-console: ['warn', { allow: ['error'] }]`; `console.log`/`warn` warnen weiter.)

### Doku
- [x] `frontend/DESIGN.md`: Rollen `error`/`onError` in 2.2; Baustein „Hinweisleiste“ in 1.5 bzw.
      `docs/design/components.md`; Admin-Layout in `docs/design/screen-layouts.md` (Leiste unter der TopBar).
- [x] `frontend/docs/design/contrast.md`: Theme-Werte und Kontrastmessung für `onError` auf `error`.
- [x] `docs/screens.md` (Admin, Wall, Ground – Ist): Verhalten bei Ladefehlern.
- [x] `docs/architecture.md`: Fehlerbehandlung beim Datenladen, Timeout.
- [x] `docs/known-issues.md`: Eintrag „API-Base-URL fest verdrahtet …; Fehler werden in Effects geworfen …“ auf
      den API-URL-Teil kürzen.

### Nacharbeit Runde 1 (User, E1)
- [x] `ErrorBar`: vertikaler Innenabstand `space.1` statt `space.2`, Schrift unverändert.
- [x] `ErrorBar`: Icon-Button statt Text-Button – neues Icon `public/assets/icons/reload.svg`, per `ReactSVG` mit
      Füllfarbe `onError`, ohne Fläche/Rahmen, Größe `size.icon`; `aria-label`/`title` „Erneut versuchen“, echtes
      `<button>`, sichtbarer Fokus (`:focus-visible`-Outline in `onError`).
- [x] Doku: `components.md`, `contrast.md`, `DESIGN.md` (Innenabstand), `docs/screens.md`, `docs/architecture.md`.

## Akzeptanzkriterien

### AK1: Admin bei Backend-Ausfall
- **Given** das Backend ist gestoppt
- **When** der Spielleiter den Admin Screen lädt
- **Then** erscheint unter der TopBar die Hinweisleiste mit „Erneut versuchen“; in der Konsole steht keine
  „Uncaught (in promise)“-Meldung.

### AK2: Erneut versuchen
- **Given** die Hinweisleiste ist sichtbar und das Backend läuft wieder
- **When** der Spielleiter „Erneut versuchen“ klickt
- **Then** Szenen, Kacheln und aktive Szene werden geladen und die Leiste verschwindet. Ist das Backend weiter
  aus, bleibt die Leiste.

### AK3: Wall und Ground ruhig
- **Given** Wall und Ground zeigen eine Szene, dann wird das Backend gestoppt
- **When** der Spielleiter eine andere Szene aktiviert (Szenenwechsel über `localStorage`)
- **Then** Wall und Ground zeigen weiter das bisherige Bild, ohne Hinweis; der Fehler steht als `console.error`
  in der Konsole, keine unhandled rejection.

### AK4: Notizen
- **Given** eine Notizdatei liefert einen Fehlerstatus (z. B. per DevTools-Request-Blocking)
- **When** der Tab geöffnet wird
- **Then** zeigt der Reader „Notizen konnten nicht geladen werden“ statt Seiteninhalt; keine unhandled rejection.

### AK5: Normalbetrieb unverändert
- Bei laufendem Backend verhalten sich alle Screens wie vorher; die Hinweisleiste erscheint nicht, Layout unverändert.

### AK6: Styleguide und Kontrast
- Rollen `error`/`onError` sind in beiden Themes definiert, in DESIGN.md 2.2 und `contrast.md` dokumentiert,
  Kontrast `onError` auf `error` ≥ 4,5 in beiden Themes.

### AK7: Regressionstest
- Die Tests aus „Frontend“ bilden die Fehlerbilder auf API-/Service-Ebene ab, schlagen vor dem Fix fehl und danach nicht.

## Teststrategie / Verifikation

**Automatisch**
- Frontend: `npm run lint`, `npm run typecheck`, `npm run test:unit` (inkl. neuer Tests), `npm run build`.

**Manuell**
1. Stack starten, Admin, Wall, Ground öffnen.
2. AK3: Backend stoppen (`docker compose stop app`), im Admin (Daten bereits geladen) eine Szene aktivieren – Wall
   und Ground prüfen, Konsole prüfen.
3. AK1: Admin neu laden – Hinweisleiste, Konsole ohne „Uncaught (in promise)“. In beiden Themes ansehen.
4. AK2: Backend starten (`docker compose start app`), „Erneut versuchen“.
5. AK4: In den DevTools eine Notizdatei blockieren, Tab wechseln.
6. AK5: Normalbetrieb kurz durchklicken.

## Offene Fragen
- keine

## Review

### Runde 1 – Review c9f210e

**Empfehlung:** Abnahme. Keine blockierenden Befunde. Offen ist nur die manuelle Browserprüfung AK1–AK5 durch den
User (laut Teststrategie).

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Admin bei Backend-Ausfall | erfüllt (laut Code, manuell offen) | `getData` wirft (`apiMethods.ts:4-10`), Services werfen `LoadError` (`loadData.ts:30-45`), Admin fängt über `loadSafely` und setzt `adminDataFailed`/`activeSceneFailed` (`AdminScreen.tsx:154-176`), `ErrorBar` unter `TopBar` (`AdminScreen.tsx:215`) |
| AK2 Erneut versuchen | erfüllt (laut Code, manuell offen) | `retryLoading` lädt beides neu (`AdminScreen.tsx:178-181`), Flags werden bei Erfolg zurückgesetzt, keine automatischen Wiederholungen (E3) |
| AK3 Wall und Ground ruhig | erfüllt (laut Code, manuell offen) | Im Fehlerfall nur `console.error`, State bleibt (`WallScreen.tsx:134-140`, `GroundScreen.tsx:84-90`) |
| AK4 Notizen | erfüllt (laut Code, manuell offen) | `response.ok` geprüft, Hinweistext statt Seiten, Tab-Wechsel lädt neu (`DocumentReader.tsx:198-220, 260-261`) |
| AK5 Normalbetrieb | erfüllt (laut Code, manuell offen) | Ohne Fehler `grid-template-rows` wie vorher (`AdminScreen.tsx:35`), Leiste nicht gerendert |
| AK6 Styleguide und Kontrast | erfüllt | `error`/`onError` in beiden Themes, in DESIGN.md 2.2/2.3 und `contrast.md` dokumentiert; `#ffffff` auf `#8e1b1b` = 9,04:1 |
| AK7 Regressionstest | erfüllt | `apiErrors.spec.ts`, `loadSafely.spec.ts`; Gegenprobe auf `c9f210e^`: 15/20 rot, `loadSafely` rot (Modul fehlt); danach 52/52 grün |

**Fix-spezifisch:** Ursache behoben (Verschlucken in `getData` entfernt, „not found“ bei Netzwerkfehlern durch
`describeFailure` ersetzt, erneutes `throw` in Screens entfernt, Timeout 5000 ms). Fehler werden genau einmal
gefangen (E6). Scope eingehalten, Konventionen eingehalten.

#### Blockierende Befunde
- keine

#### Hinweise (nicht blockierend)
- `styled.d.ts` unverändert ist korrekt: `Colors = typeof darkTheme.colors` übernimmt die Rollen automatisch.
- Button-Fläche (`secondary`) gegen die Leiste nur 1,91:1 (Dark) / 1,54:1 (Tavern); Beschriftung gut lesbar. Plan
  setzt kein Ziel für die Fläche; optischen Eindruck bei der manuellen Prüfung bewerten.
- Fester Text „Backend nicht erreichbar“ auch bei HTTP 500 / leerer Antwort: plangemäß („o. ä.“), aber sachlich
  ungenau. Mögliche Folgeverbesserung: neutraler Text oder Ableitung aus `LoadError`.
- `frontend/CLAUDE.md` veraltet (`no-console`-Ausnahme für `console.error`, `loadData.ts`, `loadSafely.ts` fehlen);
  Nachzug per `/quick-task` empfohlen.
- `console.error`-Ausnahme gilt global (`eslint.config.js:55`), im Plan als Entscheidung vermerkt.
- Lint-Warnung `alt-text` in `WallScreen.tsx:161` bestand schon vorher.
- Außerhalb des Scopes: `utils.ts:60` `newAudio.play()` fängt Ablehnung nicht ab (Autoplay-Sperre) – kann ebenfalls
  „Uncaught (in promise)“ erzeugen.

#### Checks
- `npm run lint`: 0 Fehler, 1 Warnung (vorbestehend)
- `npm run typecheck`: ok
- `npm run test:unit`: 52/52 grün (22 neu)
- `npm run build`: ok
- Manuelle Prüfung AK1–AK5: offen, durch den User

### Runde 2 – Review dc26664

**Empfehlung:** Abnahme. Keine blockierenden Befunde. Nacharbeit aus E1 („Änderung nach Review Runde 1 (User)“)
vollständig umgesetzt. Offen: manuelle Browserprüfung durch den User (AK1–AK5, Icon, Fokus und Leistenhöhe in
beiden Themes).

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Admin bei Backend-Ausfall | erfüllt (laut Code, manuell offen) | Logik unverändert; `ErrorBar` mit Icon-Button „Erneut versuchen“ (`ErrorBar.tsx:58`) |
| AK2 Erneut versuchen | erfüllt (laut Code, manuell offen) | echtes `<button type='button'>`, `onClick={onRetry}`, per Tastatur bedienbar |
| AK3 Wall und Ground ruhig | erfüllt (laut Code, manuell offen) | in Runde 2 nicht berührt |
| AK4 Notizen | erfüllt (laut Code, manuell offen) | in Runde 2 nicht berührt |
| AK5 Normalbetrieb | erfüllt (laut Code, manuell offen) | Leiste ohne Fehler nicht gerendert |
| AK6 Styleguide und Kontrast | erfüllt | `DESIGN.md:232` `onError` für Text, Icon, Fokus-Outline; `contrast.md:51` 9,0 (Ziel 3,0) |
| AK7 Regressionstest | erfüllt | Tests unverändert, 52/52 grün; Gegenprobe aus Runde 1 gilt weiter |

**Nacharbeit E1:** Innenabstand `space.1 space.5` (Leiste ca. 28px statt 56px), `reload.svg` per `ReactSVG` in
`onError`, `aria-hidden`, transparent ohne Rahmen, Größe `size.icon`, `aria-label`/`title`, Fokus per
`:focus-visible`. Doku konsistent, keine Reste des alten Text-Buttons oder der alten Kontrast-Anmerkung.

#### Blockierende Befunde
- keine

#### Hinweise (nicht blockierend)
- Klickfläche 20 × 20px statt `size.control.md` (40px): Ausnahme nur in `components.md:156` dokumentiert;
  `DESIGN.md:65` und `components.md:17` verweisen nicht darauf. Alternative bei zu kleiner Fläche:
  `size.control.md` mit negativem vertikalem `margin`.
- `:focus-visible` ist die einzige Fokusregel im Frontend; DESIGN.md 2.4 kennt keinen Fokus-Zustand (Kandidat für
  allgemeine Regel).
- `outline-offset` nutzt `borderWidth.thick` als Abstand (Token-Semantik).
- E1-Entscheidungszeile nennt noch „Baustein Text-Button“; durch die Ergänzungszeile inhaltlich ersetzt.
- Weiter offen aus Runde 1: fester Text bei HTTP 500, `frontend/CLAUDE.md` veraltet, `utils.ts:60` `play()`.

#### Checks
- `npm run lint`: 0 Fehler, 1 Warnung (vorbestehend)
- `npm run typecheck`: ok
- `npm run test:unit`: 52/52 grün
- `npm run build`: ok
- Manuelle Prüfung: offen, durch den User
