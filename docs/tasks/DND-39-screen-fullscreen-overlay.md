# DND-39: Vollbild-Overlay beim Hovern auf Wall und Ground

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel
Wall und Ground laufen am Spieltisch als eigene Browserfenster auf eigenen Monitoren. Um sie in den Vollbildmodus
zu bringen, muss der Spielleiter bisher Browser-Tastenkürzel oder -Menüs nutzen. Künftig erscheint auf Wall und
Ground ein Overlay über den ganzen Screen, solange die Maus über dem Fenster ist; ein Klick darauf schaltet genau
dieses Fenster in den Vollbildmodus des Browsers und wieder zurück. Nutzer: Spielleiter. Screens: Wall, Ground.
Am Spieltisch merkt man es daran, dass der Spielleiter jede Anzeige mit der Maus und einem Klick ins Vollbild holt.

## Scope / Non-Goals

**Im Scope**
- Gemeinsame Komponente für das Vollbild-Overlay, eingebunden in `WallScreen` und `GroundScreen`.
- Overlay sichtbar, solange die Maus über dem Fenster ist; ein Klick irgendwo darauf schaltet das Vollbild des
  eigenen Fensters um.
- Anzeige (Icon und Text) folgt dem tatsächlichen Vollbild-Zustand, auch beim Verlassen per Escape.
- Neues Farb-Token für die Abdunklung und neue Ebene für das Overlay; Doku-Anpassungen (Leitplanke „ohne
  Bedienelemente“, Screens, Style Guide).

**Nicht im Scope**
- Touch-Bedienung (Tap auf Tablet/Smartphone): Das Overlay reagiert nur auf die Maus.
- Steuerung des Vollbilds von Wall/Ground aus dem Admin (Browser erlaubt Vollbild nur nach einer Interaktion im
  eigenen Fenster).
- Synchronisation über den Server: Der Vollbild-Zustand ist rein lokal pro Fenster.
- Automatisches Ausblenden bei stillstehender Maus, Ausblenden des Cursors.
- Vollbild per Browser-Taste F11 (ohne Fullscreen API) erkennen.
- Player Screen und Admin (Admin hat seinen Button in der Top-Bar bereits).

## Entscheidungen

### E1: Aussehen
- **Entscheidung:** Der ganze Screen wird abgedunkelt; mittig eine Fläche mit dem Vollbild-Icon (wie im Admin:
  `fullscreen.svg` bzw. `fullscreenExit.svg`) und darunter dem Text „Vollbild“ bzw. „Vollbild beenden“.
- **Verworfene Alternativen:** Nur Icon/Text ohne Abdunklung; unsichtbares Overlay nur mit Zeiger-Cursor.
- **Begründung:** Wahl des Users; klar erkennbar, dass ein Klick etwas auslöst.

### E2: Wann das Overlay sichtbar ist
- **Entscheidung:** Sichtbar, sobald die Maus über dem Fenster ist (auch nach dem Laden bei der ersten
  Mausbewegung), ausgeblendet erst, wenn sie das Fenster verlässt – auch wenn sie dort stillsteht. Nach dem Klick
  bleibt das Overlay sichtbar (mit dem neuen Zustand), bis die Maus das Fenster verlässt.
- **Verworfene Alternativen:** Ausblenden nach ca. 2 s Stillstand der Maus.
- **Begründung:** Wahl des Users.

### E3: Nur Maus
- **Entscheidung:** Ein- und Ausblenden nur über Maus-Ereignisse (Pointer Events mit `pointerType === 'mouse'`);
  Touch zeigt kein Overlay.
- **Verworfene Alternativen:** Erster Tap blendet ein, zweiter schaltet um.
- **Begründung:** Wall und Ground laufen auf Monitoren am Spieltisch-Rechner.

### E4: Leitplanke „reine Anzeige“
- **Entscheidung:** Wall und Ground bleiben reine Anzeigen für den Spieltisch-Zustand; einzige Ausnahme ist das
  Vollbild-Overlay, das nur das eigene Fenster betrifft und nichts am Server ändert.
- **Begründung:** Das Vollbild eines Fensters lässt sich nicht aus einem anderen Fenster auslösen.

## Subtasks

### Frontend
- [x] `src/utils/useDocumentFullscreen.ts`: Kommentar „(Admin)“ verallgemeinern; Hook unverändert wiederverwenden.
- [x] Neue Komponente `src/components/FullscreenHoverOverlay.tsx`: `position: fixed`, `inset: 0`, ganze Fläche ist
      ein Button (`type="button"`, `aria-label` „Vollbild“ bzw. „Vollbild beenden“, `aria-pressed` = Vollbild-Zustand,
      `data-test-id="fullscreen-overlay"`, `cursor: pointer`); Hintergrund neues Token `colors.backdrop`; mittig eine
      Fläche `background` mit `radius.lg` und Innenabstand aus `space`, darin Icon (in `text.color` eingefärbt wie in
      `TopBar`) und Text `text.lg`/`semibold`. Sichtbarkeit per `pointerenter`/`pointermove` (nur Maus) bzw.
      `pointerleave`; unsichtbar heißt nicht gerendert oder `display: none` (keine Klicks auf die unsichtbare Fläche nötig).
      Fehler beim Umschalten nur loggen (wie im Hook).
- [x] Tokens: neues `colors.backdrop` = `rgba(0, 0, 0, 0.5)` in `darkTheme` und `tavernTheme` (Typ im Theme
      ergänzen; bestehendes `scrim`/`onScrim` aus DND-38 bleibt unverändert);
      `layer.control` = 30 (über `panel` und `grid`, unter `popover`).
- [x] `WallScreen` und `GroundScreen`: Overlay als letztes Element einbinden (liegt über Wall-Overlay-Panel und
      Ground-Raster).

### Tests
- [x] BDD-Feature `__tests__/bdd/features/screenFullscreen.feature` mit Steps (Selenium wie in
      `adminDashboard.ts`), für Wall und Ground (Scenario Outline): Maus über das Fenster → Overlay mit „Vollbild“
      sichtbar; Klick → `document.fullscreenElement` gesetzt, Text „Vollbild beenden“; erneuter Klick → kein Vollbild.
- [x] Ausblenden beim Verlassen automatisiert prüfen, falls per Selenium zuverlässig auslösbar; sonst nur manuell
      (Begründung im Commit-Body bzw. Review).

### Doku
- [x] `CLAUDE.md` (Leitplanke „Setup am Spieltisch“) und `docs/vision.md`: Ausnahme Vollbild-Overlay ergänzen.
- [x] `docs/screens.md`: Wall und Ground „Ist“ – Overlay statt „kein Hover-Effekt“.
- [x] `frontend/DESIGN.md` (Ebenen-Tabelle `layer.control`, Farbrolle `backdrop` neben `scrim`, Abschnitt zu Wall/Ground ohne
      Bedienelemente), `frontend/docs/design/components.md` (neuer Baustein), `screen-layouts.md` (Wall/Ground),
      `contrast.md` (Token `backdrop`; Text/Icon stehen auf `background`, kein neues Kontrastpaar).

## Akzeptanzkriterien

### AK1: Overlay beim Hovern
- **Given** die Wall (bzw. der Ground) ist in einem Browserfenster geöffnet
- **When** der Spielleiter die Maus über das Fenster bewegt
- **Then** ist der ganze Screen abgedunkelt und mittig stehen das Vollbild-Icon und „Vollbild“

### AK2: Vollbild einschalten
- **Given** das Overlay ist sichtbar und das Fenster ist nicht im Vollbild
- **When** der Spielleiter irgendwo auf das Overlay klickt
- **Then** ist dieses Fenster im Vollbildmodus des Browsers, andere Fenster (Admin, die jeweils andere Anzeige)
  bleiben unverändert, und das Overlay zeigt das Icon zum Beenden und „Vollbild beenden“

### AK3: Vollbild ausschalten
- **Given** das Fenster ist im Vollbild und das Overlay ist sichtbar
- **When** der Spielleiter auf das Overlay klickt
- **Then** verlässt das Fenster den Vollbildmodus und das Overlay zeigt wieder „Vollbild“

### AK4: Ausblenden beim Verlassen
- **Given** das Overlay ist sichtbar
- **When** die Maus das Fenster verlässt (z. B. auf einen anderen Monitor)
- **Then** zeigt der Screen wieder unverdeckt Bild, Wall-Overlay-Panel bzw. Raster

### AK5: Anzeige folgt dem Browser
- **Given** das Fenster ist per Overlay ins Vollbild geschaltet
- **When** der Spielleiter das Vollbild mit Escape verlässt und die Maus wieder über das Fenster bewegt
- **Then** zeigt das Overlay „Vollbild“

### AK6: Ohne Maus keine Änderung
- **Given** die Maus war nicht über dem Fenster (oder es wird nur per Touch bedient)
- **When** der Spieltisch-Zustand sich ändert (Szene, Wall-Overlay, Raster, Theme)
- **Then** zeigen Wall und Ground alles wie bisher, ohne Abdunklung

## Teststrategie / Verifikation

**Automatisch**
- Frontend (BDD): `screenFullscreen.feature` für Wall und Ground (AK1–AK3, AK4 falls auslösbar).
- Bestehende BDD-Features `wallOverlay.feature` und `groundGrid.feature` bleiben grün (Overlay verdeckt ohne Maus
  nichts); Lint, Typecheck, Build grün.

**Manuell**
1. Admin, Wall und Ground als Fenster öffnen (Wall/Ground per „In neuem Fenster öffnen“), auf zwei Monitore ziehen.
2. Maus über die Wall: Abdunklung mit Icon und „Vollbild“; Klick → Wall im Vollbild, Text „Vollbild beenden“.
3. Maus auf den Admin-Monitor: Overlay auf der Wall verschwindet, Admin unverändert nicht im Vollbild.
4. Zurück auf die Wall, Klick → Vollbild aus. Erneut ins Vollbild, mit Escape verlassen → Overlay zeigt „Vollbild“.
5. Dasselbe auf dem Ground mit eingeschaltetem Raster (Overlay liegt über dem Raster) und auf der Wall mit Weltkarte.
6. Beide Themes prüfen.

## Offene Fragen
- ~~Token `colors.scrim` existiert bereits~~ (seit DND-38, 0,75, für die Bühne im Admin). **Entschieden (User):**
  Variante B – neues Token `colors.backdrop` = `rgba(0, 0, 0, 0.5)` in beiden Themes; `scrim` bleibt unverändert.

## Review
