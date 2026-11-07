# DND-55: Einfarbiger Hintergrund in der Abenteuerauswahl

**Typ:** style
**Status:** Fertig

## Kontext & Ziel
Die Abenteuerauswahl (`/admin`, `AdminSelectScreen`) zeigt heute hinter den Karten das abgedunkelte Abenteuerbild
des am Server aktiven Abenteuers (`AdventureBackground` + `useAdventureBackground`). Künftig liegt hinter den Karten
nur noch eine einfarbige Fläche in `colors.background` des jeweiligen Themes – unabhängig davon, ob und welches
Abenteuer aktiv ist. Die Auswahl wirkt dadurch ruhiger; das Abenteuerbild erscheint erst im Admin.

## Invarianten
- Seitenübergang zwischen Auswahl und Admin (`PageTransitionStyle`, `startPageTransition`, `data-view-hero` am
  Kartenbild, `data-view-head`, `data-view-card`) bleibt unverändert: Kartenbild wächst in den Admin-Hintergrund,
  beim Beenden schrumpft er zurück; Kopf und Karten sinken bzw. steigen wie bisher.
- Auftritt des Admins (DND-54) unverändert.
- Flächen der Auswahl (Abenteuer-Karten, Platzhalter-Karten, Zustands-Kachel, Kampf-Hinweis) sehen aus wie heute
  mit Hintergrundbild: durchscheinend (`secondaryTranslucent` + `backdrop-filter: blur(TILE_BLUR)`), siehe E1.
  Fehler-Hinweis bleibt deckend `error`.
- Inhalt, Layout, Markierung „Aktiv“, Sperre im Kampf, Starten/Fortsetzen, Zustände (Laden, leer, Fehler) unverändert.
- Admin und Player behalten ihren Abenteuer-Hintergrund (`AdventureBackground`, `useAdventureBackground`,
  `adventureBackground.ts` unverändert im Verhalten).

## Scope / Non-Goals

**Im Scope**
- `AdminSelectScreen` ohne `AdventureBackground`/`useAdventureBackground`; Hintergrund einfarbig `colors.background`.
- Flächen der Auswahl immer durchscheinend.
- Doku (Ist-Stand, Design-Doku) und BDD-Tests anpassen.

**Nicht im Scope**
- Admin- und Player-Hintergrund, Übergangsanimation, Gestaltung der Karten/Panels.
- Themewechsel-Logik (die Farbe folgt dem Theme wie alle übrigen Farben).

## Entscheidungen

### E1: Flächen bleiben durchscheinend
- **Entscheidung:** Karten, Platzhalter, Zustands-Kachel und Kampf-Hinweis der Auswahl sind immer durchscheinend
  (`$isTranslucent` fest `true`), auch über der einfarbigen Fläche.
- **Verworfene Alternativen:** immer deckend `secondary` (wie heute ohne aktives Abenteuer).
- **Begründung:** Wunsch des Users – „nichts am Panel ändern“, die Karten behalten den Glas-Look, den sie mit
  Hintergrundbild haben. Bewusste Ausnahme von der Regel „durchscheinend nur über einem Bild“
  (`frontend/DESIGN.md`, „Durchscheinende Kacheln“; Kommentar an `tileSurface` in `GlobalStyle.ts`); beide Stellen
  nennen die Ausnahme. Kontrast ist abgedeckt, weil `secondaryTranslucent` bereits gegen den ungünstigsten Fall
  (weißes/schwarzes Bild) gemessen ist.

### E2: Prop `isTranslucent` der `AdventureCard` entfällt
- **Entscheidung:** `AdventureCard` wird nur in der Auswahl verwendet; die Karte setzt `$isTranslucent` fest, die
  Prop entfällt. Im `AdminSelectScreen` tragen `SkeletonCard`, `State` und `Notice` `$isTranslucent` fest.
- **Verworfene Alternativen:** Prop behalten und konstant `true` übergeben.
- **Begründung:** Kein zweiter Aufrufer, ein Schalter ohne Wahlmöglichkeit wäre toter Code.

## Subtasks

### Frontend
- [x] `src/screens/AdminSelectScreen.tsx`: Import und Rendern von `AdventureBackground` sowie
      `useAdventureBackground` entfernen; `isTranslucent`/`activeAdventure` nur noch, soweit gebraucht.
      `Screen` erhält `background-color: colors.background` (bleibt `position: fixed; inset: 0`, scrollt).
      Doc-Kommentar der Komponente prüfen.
- [x] `SkeletonCard`, `State`, `Notice` (Kampf-Hinweis) mit `$isTranslucent` fest; `ErrorNotice` unverändert deckend.
- [x] `src/components/AdventureCard.tsx`: Prop `isTranslucent` entfernen, `$isTranslucent` fest (E2).
- [x] `src/utils/useAdventureBackground.ts`: Doc-Kommentar ohne „the adventure selection“.
- [x] `src/style/GlobalStyle.ts`: Kommentar an `tileSurface`/`TileSurfaceProps` um die Ausnahme Abenteuerauswahl
      ergänzen (E1).

### Tests
- [x] BDD `adminAdventureSelect.feature` / `steps/adminAdventureSelect.ts`: Schritt „the adventure image lies behind
      the cards“ ersetzen durch „the background is plain“: kein `[data-test-id="adventure-background"]` in der
      Auswahl und die berechnete `background-color` von `[data-test-id="adventure-select"]` entspricht
      `colors.background` des aktiven Themes (Wert aus den Theme-Dateien in `src/style/`, nicht hart kodiert).
- [x] Szenario „I start an adventure while none is active“: Schritt „the background is plain“ auf dieselbe Prüfung
      umstellen (Hilfsfunktion teilen).
- [x] Prüfen, ob `steps/adminSettings.ts` (`ADVENTURE_IMAGES`, Rückweg nach „Abenteuer beenden“) Annahmen über das
      Bild in der Auswahl trifft; ggf. anpassen. Unit-Tests (`adventureBackground.spec.ts`) bleiben unverändert.

### Doku
- [x] `docs/screens.md`, Abenteuerauswahl (Ist): **Hintergrund** = einfarbig `background` des Themes, Karten
      durchscheinend; **Übergang in den Admin** ohne „auch der Hintergrund des bisher aktiven Abenteuers“; Satz „Die
      Auswahl hat danach keinen Hintergrund“ beim Rückweg anpassen.
- [x] `frontend/docs/design/screen-layouts.md` (Zeile „Admin: Abenteuerauswahl“): über der Fläche `background`
      statt über dem Abenteuer-Hintergrund.
- [x] `frontend/docs/design/components.md`: [Abenteuer-Karte] Fläche „durchscheinend über `background`“; [Zustände
      der Abenteuerauswahl] Flächen durchscheinend; [Abenteuer-Hintergrund] nennt die Auswahl nicht als Ort; ggf.
      Absatz zu `tileSurface`/`$isTranslucent` (Abschnitt Kachel) um die Auswahl ergänzen.
- [x] `frontend/DESIGN.md`, „Durchscheinende Kacheln“: Ausnahme Abenteuerauswahl (immer durchscheinend) ergänzen.
- [x] `docs/architecture.md`, `docs/domain.md`, `docs/known-issues.md` auf Aussagen zum Hintergrund der Auswahl
      prüfen.

## Akzeptanzkriterien
- [ ] AK1: In der Abenteuerauswahl liegt hinter den Karten in jedem Theme nur die einfarbige Fläche
      `colors.background` – mit aktivem Abenteuer mit Bild, ohne aktives Abenteuer und bei Abenteuer ohne Bild;
      `AdventureBackground` wird in der Auswahl nicht gerendert.
- [ ] AK2: Karten, Platzhalter-Karten, Zustands-Kachel und Kampf-Hinweis sind in allen Zuständen durchscheinend
      (`secondaryTranslucent` mit Blur), der Fehler-Hinweis deckend `error`.
- [ ] AK3: Alle Invarianten eingehalten – Übergang in den Admin und Rückweg laufen wie zuvor (wachsendes bzw.
      schrumpfendes Kartenbild, sinkende/steigende Karten), Admin- und Player-Hintergrund unverändert.
- [ ] AK4: Lint, Tests und Build sind so grün wie vorher (bekannte Altfehler ausgenommen); BDD-Szenarien der
      Abenteuerauswahl prüfen den einfarbigen Hintergrund statt des Bildes.
- [ ] AK5: Doku (screens.md, components.md, screen-layouts.md, DESIGN.md) beschreibt den neuen Ist-Stand.

## Teststrategie / Verifikation

**Automatisch**
- Frontend (BDD): `adminAdventureSelect` angepasst (siehe Subtasks), übrige Szenarien unverändert grün.
- Frontend (Unit): unverändert grün.
- Lint, `tsc`, Build.

**Manuell**
1. Abenteuer mit Bild aktiv, `/admin` öffnen: einfarbiger Hintergrund, Karten im Glas-Look.
2. Theme im Admin wechseln (Cyber ↔ Taverne), zurück zur Auswahl: Hintergrundfarbe folgt dem Theme.
3. Karte anklicken: Bild wächst wie bisher in den Admin-Hintergrund, Admin baut sich auf.
4. „Abenteuer beenden“: Hintergrund schrumpft in die Karte, Karten steigen auf; danach einfarbiger Hintergrund.
5. „Bewegung reduzieren“ aktiv: Seitenwechsel ohne Übergang, Hintergrund einfarbig.

## Offene Fragen
- keine

## Review

### Runde 1 – Review vom 2026-11-07 (Commit d66dd74, Gesamtstand gegen 3fb442a)

**Empfehlung: Abnahme.** Es gibt keinen blockierenden Befund. Alle fünf AK sind erfüllt. Lint, Typecheck, Unit-Tests, Build, knip, jscpd und E2E sind grün.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Nur einfarbige Fläche `colors.background` | erfüllt | `AdminSelectScreen.tsx:44`: `Screen` mit `background-color: props.theme.colors.background`, weiter `position: fixed`. `AdventureBackground` und `useAdventureBackground` sind aus der Auswahl entfernt; die Farbe hängt nur vom Theme ab. BDD `adminAdventureSelect.ts:182` prüft: berechnete Farbe gleich `background` des Server-Themes, kein `adventure-background`. Grün mit aktivem Abenteuer mit Bild (Szenario 1) und ohne aktives Abenteuer (Szenario 2). |
| AK2 Flächen durchscheinend, Fehler deckend | erfüllt | `AdventureCard.tsx:278` `$isTranslucent` fest, Prop entfernt; SkeletonCard (`:277`), State (`:287`/`:293`), Notice (`:320`) fest durchscheinend. `ErrorNotice` unverändert deckend `error` ohne Blur (`:79-80`, `:327`). `tileSurface` setzt `secondaryTranslucent` + `blur(TILE_BLUR)`. |
| AK3 Invarianten | erfüllt | Kein Diff in `PageTransitionStyle.ts`, `viewTransition.ts`, `AdminScreen.tsx`, `PlayerLayout.tsx`, `AdventureBackground.tsx`, `adventureBackground.ts`; in `useAdventureBackground.ts` nur Doc-Kommentar. Die Auswahl renderte `AdventureBackground` ohne `isHero`, war also nie Teil des Hero-Übergangs. `data-view-head`/`-card`/`-hero` unverändert. BDD `adminSettings` (Rückweg) und Admin-Auftritt grün. Manuelle Schritte 1–5 nicht ausgeführt. |
| AK4 Checks, BDD prüft einfarbigen Hintergrund | erfüllt | Schritt „the background is plain“ in `adminAdventureSelect.feature:9` und `:14`, gemeinsame Hilfsfunktion `expectPlainBackground` (`steps/adminAdventureSelect.ts:281`, `:308`). Farbe aus `cyberTheme`/`tavernTheme`, nicht hart kodiert. Gegenprobe des Implementers: mit altem Code rot (`rgba(0, 0, 0, 0)` statt `rgba(14, 17, 23, 1)`). |
| AK5 Doku | erfüllt | `docs/screens.md:47`/`:49`, `screen-layouts.md` (Abenteuerauswahl), `components.md` (Kachel, Abenteuer-Karte, Zustände; Abschnitt Abenteuer-Hintergrund nennt nur Admin und Player), `DESIGN.md` § 1.4 mit Ausnahme, `architecture.md` „(Markierung)“. |

**Blockierende Befunde**
- keine

**Hinweise (nicht blockierend)**
1. Manuelle Prüfschritte (Glas-Look, Themewechsel Cyber ↔ Taverne, wachsendes/schrumpfendes Kartenbild, „Bewegung reduzieren“) offen; der zugehörige Code ist unverändert.
2. BDD prüft nur das am Server aktive Theme; für das andere belegt den Wert nur der Code.
3. `hexToRgba` (`steps/adminAdventureSelect.ts:86`) setzt `#rrggbb` voraus; passt für beide `background`-Werte, nicht für Hex mit Alpha.
4. Außerhalb des Scopes, schon vorher veraltet: `docs/domain.md:5` nennt noch „Abenteuer-Auswahl im Panel ‚Einstellungen‘“ (seit DND-52 eigener Screen) – Kandidat für `/quick-task`.
5. Kosmetisch: `docs/screens.md:47` und `components.md:499-500` deutlich länger als die umliegenden Zeilen.
6. Konventionen: `style(DND-55): …` passt zum Plan-Typ, ein Commit, 5 Stichpunkte, keine KI-Signatur, nichts außerhalb des Scopes.

**Checks** (in `frontend/`)
- `npm run lint`: grün, ohne Fehler und Warnungen.
- `npm run typecheck`: grün.
- `npm run test:unit`: 37 Dateien, 382/382 grün.
- `npm run build`: grün (bekannte Warnung zur Chunk-Größe).
- `npm run check:deadcode` (knip), `npm run check:dupes` (jscpd, 1 Klon wie Baseline): grün.
- E2E (`npx jest --runInBand` gegen Docker-Backend :8000 und Vite :5173): 14 Suites, 63/63 grün. Die Läufe ändern den Spieltisch-Zustand des Dev-Backends.
