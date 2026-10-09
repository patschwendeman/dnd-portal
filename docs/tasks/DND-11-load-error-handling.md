# DND-11: Ladefehler abfangen statt unhandled rejections, Hinweis im Admin Screen

**Typ:** fix
**Status:** Entwurf

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
- [ ] Regressionstests zuerst (`frontend/__tests__/unit/apiErrors.spec.ts` o. ä., `vi.mock` für `apiClient`/axios):
  - `getData` mit Netzwerkfehler/Timeout → Promise wird abgelehnt (nicht `undefined`).
  - `getData` mit HTTP 500 → abgelehnt, Status erkennbar.
  - Service (z. B. `getGroundScreenData`, `getAdminData`) bei Netzwerkfehler → abgelehnt mit Meldung, die nicht
    „not found“ lautet; bei leerer Antwort → abgelehnt mit „not found“-Meldung.
  - Lade-Funktion der Screens, soweit ohne React testbar herausgelöst (z. B. Hilfsfunktion
    `loadSafely(load, onError)`): Fehler landet in `onError`, Promise wird erfüllt (keine Ablehnung nach außen).
  Vor dem Fix rot, danach grün.
- [ ] `apiClient.ts`: Timeout 5000.
- [ ] `apiMethods.ts`: `getData` ohne `try/catch`-Verschlucken.
- [ ] Services: Fehlermeldungen nach E6.
- [ ] `AdminScreen`: Fehler-State, Hinweisleiste (neue Komponente, z. B. `ErrorBar`) unter `TopBar`, „Erneut
      versuchen“ ruft beide Ladevorgänge erneut auf; kein `throw` in `fetchAdminData`/`fetchActiveScene`.
- [ ] `WallScreen`, `GroundScreen`: `catch` → `console.error`, State unverändert lassen.
- [ ] `DocumentReader`: `response.ok` prüfen; Fehlerzustand mit Text nach E5; kein `throw`.
- [ ] Themes: Rollen `error`, `onError` in `darkTheme.ts`, `tavernTheme.ts`, Typ in `styled.d.ts`.
- [ ] ESLint: Die Regel `no-console` warnt; `console.error` an den bewussten Stellen zulassen (z. B.
      `no-console: ['warn', { allow: ['error'] }]` oder gezielte Ausnahme) – Entscheidung im Review sichtbar machen.

### Doku
- [ ] `frontend/DESIGN.md`: Rollen `error`/`onError` in 2.2; Baustein „Hinweisleiste“ in 1.5 bzw.
      `docs/design/components.md`; Admin-Layout in `docs/design/screen-layouts.md` (Leiste unter der TopBar).
- [ ] `frontend/docs/design/contrast.md`: Theme-Werte und Kontrastmessung für `onError` auf `error`.
- [ ] `docs/screens.md` (Admin, Wall, Ground – Ist): Verhalten bei Ladefehlern.
- [ ] `docs/architecture.md`: Fehlerbehandlung beim Datenladen, Timeout.
- [ ] `docs/known-issues.md`: Eintrag „API-Base-URL fest verdrahtet …; Fehler werden in Effects geworfen …“ auf
      den API-URL-Teil kürzen.

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
