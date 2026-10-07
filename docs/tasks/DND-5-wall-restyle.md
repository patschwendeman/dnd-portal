# DND-5: Restyle Wall Screen (Schritt 2 von 3: nach Admin, danach Ground)

**Typ:** style
**Status:** Fertig

## Kontext & Ziel

Der Wall Screen zeigt den Spielern am Wandmonitor das Szenenbild und auf Abruf die Kampfschauplätze oder die
Weltkarte. Heute hat er feste Maße (Panel 1200 × 700px), ein verzerrtes Hintergrundbild, freie `z-index`-Werte,
feste Farben in der Kachelnummer und zeigt Datenbank-IDs statt Raumnummern. Dieser Task stellt ihn auf den Style
Guide um: Bei 1920 × 1080 und 1366 × 768 sieht er aus wie die Mockups v2 und nutzt nur Tokens und Farbrollen aus
`frontend/DESIGN.md`. Feste Werte gibt es nur als benannte Layout-Konstanten. Er baut auf den Grundlagen aus DND-4
auf (Tokens, `textStyle`, `DefaultTheme`, `GlobalStyle`, `onPrimary`, `Label`) und baut sie nicht neu.

**Verbindliche Grundlage.** Die Entscheidungen darin werden hier nicht neu diskutiert:
- [frontend/DESIGN.md](../../frontend/DESIGN.md): Tokens, Regeln, Bausteine, Farbrollen; Abschnitt 4 „Offen“
- [frontend/design/wall-mapping.md](../../frontend/design/wall-mapping.md): Soll-Werte je Styled Component inkl.
  Entscheidungen 1–5 und K1–K4
- Mockups: [wall.png](../../frontend/design/mockups/v2/wall.png),
  [wall-world.png](../../frontend/design/mockups/v2/wall-world.png),
  [wall-1366.png](../../frontend/design/mockups/v2/wall-1366.png) (Quelle: `build.py`)
- Entscheidungen E1–E7 aus [DND-4](DND-4-admin-restyle.md) gelten weiter (u. a. `size.bar.md`/`.lg`, `textStyle`,
  GlobalStyle je Screen).

## Invarianten

- Funktion unverändert: Buttons BATTLE/WORLD/OFF, automatisches Einblenden der Kampfschauplätze bei Kampfszenen,
  Einblenden der Steuerleiste per Hover, Szenen- und Theme-Wechsel über `localStorage`.
- Die Szenenauswahl im Admin wählt weiter über die Datenbank-ID (`keyProp`). Nur die Anzeige zeigt die Raumnummer.
- `data-test-id`-Attribute bleiben (`wallImg`, `container-mainmaps`, Kachel-`src`, `confirm-button`,
  `decline-button`, `groundImg`). Die BDD-Schritte greifen weiter.
- Routen, API und Backend bleiben unverändert.
- Der Dialog im Admin sieht nach dem Herauslösen des TextButton unverändert aus.
- Player Screen unverändert.

## Scope / Non-Goals

**Im Scope**
- `<GlobalStyle />` in `WallScreen` (DESIGN.md 4, „Grundregeln“)
- Gemeinsamer Baustein `src/components/TextButton.tsx`, Dialog darauf umgestellt, Button der Steuerleiste als
  `<button>` damit (DESIGN.md 4, „Bausteine“)
- `WallScreen`: `Screen`, `BackgroundImage`, Overlay-Panel (`MapContainer` → `OverlayPanel`) mit Breitenformel und
  Kopfzeile, `MapEnvironment`
- `MapOverview`/`MapElement` (geteilt mit Admin): Wall-Werte für `gap`/`padding`, Kachelradius über
  `isAdminScreen`, zeilenweise Reihenfolge, Raumnummer über neue Prop, `NumberIcon` nach Mapping, Rollen
  `badge.background`/`badge.text` in beiden Themes
- `ScreenControlBar` (geteilt mit Ground): schwebende Leiste, Button-Gruppe, aktiver Button mit `onPrimary`
- `z-index` aller angefassten Components über `layer.*`
- Doku: DESIGN.md 4, wall-mapping.md, `docs/screens.md` (Ist)

**Nicht im Scope**
- Ground-spezifische Teile: Slider (`StyledSlider`, `Box`), Beschriftungen „Raster“/„Zelle“, `GridOverlay`,
  `GlobalStyle` im Ground (Ground-Task)
- Token für Übergangsdauern (E2)
- Einblenden der Steuerleiste per Tastaturfokus (`:focus-within`): nicht im Mapping festgelegt
- Initial aktiver Button bei automatisch eingeblendeter Kampfszene (heute keiner aktiv, bleibt so)
- Der Widerspruch zu C4 in `admin-mapping.md` aus DND-4, Runde 3
- Player Screen, Backend

**Bewusst in Kauf genommen**
- **Admin:** Die Kacheln stehen danach zeilenweise statt spaltenweise (wall-mapping.md, Entscheidung 3). Die Auswahl
  über die Datenbank-ID bleibt.
- **Ground:** Die Steuerleiste bekommt dieselbe neue Form wie auf der Wall (geteilte Component), inkl. `gap`
  `space.5` zwischen Buttons und Slider. Der Slider selbst bleibt bis zum Ground-Task unverändert.

## Entscheidungen

### E1: Typ `style`, Herauslösen des TextButton als `refactor`-Schritt
- **Entscheidung:** Typ `style`. Schritt 2 (TextButton herauslösen, Dialog umstellen) ändert nichts Sichtbares und
  wird als `refactor(DND-5): …` committet, alle übrigen Code-Schritte als `style(DND-5): …`, Doku als
  `docs(DND-5): …`.
- **Begründung:** Wie DND-4 E1. Die Struktur lässt sich getrennt von der Optik prüfen.

### E2: Übergangsdauern bleiben Werte
- **Entscheidung:** Kein Token `duration.*`. `ScreenControlBar` behält `0.5s`, `DocumentReader` (`TopLink`) `0.3s`.
  DESIGN.md hält fest, dass Dauern bewusst keine Tokens sind. Der Punkt wird aus DESIGN.md 4 entfernt.
- **Verworfene Alternativen:** `duration.fast` (0.3s) / `duration.slow` (0.5s) in `tokens.ts`. Würde den Admin noch
  einmal anfassen, für zwei Werte mit unterschiedlichem Zweck.
- **Begründung:** Wahl des Users.

### E3: Form des TextButton
- **Entscheidung:** `src/components/TextButton.tsx` exportiert `TextButton = styled.button<{ $variant: 'default' |
  'active' | 'cancel' }>` mit dem Stil aus K2 (Inhalt des heutigen `textButton`-Blocks in `Dialogue.tsx`) und den
  Farben nach DESIGN.md 2.4: `default` = `secondary` / `text.color`, `active` = `primary` / `onPrimary`,
  `cancel` = `background` / `text.color`. Laufweite ist **nicht** Teil des Bausteins (K2: nur bei Großbuchstaben);
  die Steuerleiste ergänzt `letter-spacing: letterSpacing.label` per `styled(TextButton)`.
  Dialog: Decline → `cancel`, Confirm → `active`.
- **Begründung:** Variantennamen und Farben aus wall-mapping.md („Button“); Laufweite nach K2.

### E4: Breitenformel und Konstanten
- **Entscheidung:** Die Breite des `OverlayPanel` ist ein CSS-`min()` mit `calc()` aus den Tokens (`space.*`,
  `text.xl.lineHeight` für die 32px der Kopfzeile). Feste Werte nur als Konstanten: `OVERLAY_PANEL_MAX_WIDTH =
  '1440px'` in `WallScreen.tsx` und `CONTROL_BAR_CLEARANCE = '104px'`, exportiert aus `ScreenControlBar.tsx`.
  Die Formel gilt für das 5 × 5-Raster (Mapping); die Zahl der Rasterabstände (4) steht als Konstante neben der Formel.
- **Begründung:** Mapping, Hinweis zur Breite und „Werte ohne Token“.

### E5: Kopfzeile des Panels
- **Entscheidung:** Kopfzeile als eigenes Element (`PanelHeader`) mit Überschrift (`PanelTitle`, `h2`, `text.xl`,
  semibold) und bei BATTLE `<Label>{mainmaps.length} Räume</Label>`. Bei WORLD nur „Weltkarte“. Texte deutsch.
- **Begründung:** wall-mapping.md, Entscheidung 5; `Label` wie im Admin.

### E6: Raumnummer als Prop
- **Entscheidung:** `MapElement` bekommt die Prop `number?: number`, `MapOverview` übergibt `itemIndex + 1`. Die
  Kachel zeigt `number`; `keyProp` bleibt nur für Auswahl und Aktiv-Zustand. Badge-Farben `badge.background`
  `#5a5a5a` und `badge.text` `#ffffff` in beiden Themes (Werte wie heute, Kontrast 6,9:1).
- **Begründung:** wall-mapping.md, Entscheidung 3 und `NumberIcon`; DESIGN.md 2.5.

## Subtasks

### Schritt 1: GlobalStyle auf der Wall (`style(DND-5): …`)

#### Frontend
- [x] `WallScreen`: `<GlobalStyle />` rendern (wie `AdminScreen`)
- [x] `Screen`: System-Stack (`font-family`) entfernen, Schrift kommt aus dem GlobalStyle
- [x] Hinweis: `border-box`/`margin: 0` können das alte Layout leicht verschieben. Zulässig, solange alles bedienbar
      bleibt; die folgenden Schritte stellen das Layout um.

### Schritt 2: TextButton herauslösen (`refactor(DND-5): …`)

#### Frontend
- [x] `src/components/TextButton.tsx` nach E3
- [x] `Dialogue.tsx`: `textButton`, `ConfirmButton`, `DeclineButton` entfernen, `TextButton` mit `$variant`
      verwenden. `data-test-id` und Texte bleiben.
- [x] Nachweis: Dialog im Admin in beiden Themes unverändert (Vergleich mit `admin-dialog.png` bzw. Stand vorher)
      – per SSR-Vergleich (`ServerStyleSheet`) der berechneten CSS-Regeln von Decline/Confirm vor und nach dem
      Umbau: in Dark und Tavern identisch (kein Screenshot, Docker lief nicht)

### Schritt 3: Steuerleiste (`style(DND-5): …`)

#### Frontend
- [x] `ScreenControlBar`: `Overlay` `z-index` → `layer.controls`
- [x] `ControlBar` nach Mapping: `width`/`height` `auto`, `left: 50%` + `translateX(-50%)`, ohne `right`,
      `bottom` `space.5`, `padding` `space.2`, `gap` `space.5`, `radius.xl`, ohne `justify-content`;
      `transition` bleibt (E2), Hintergrund `dark` bleibt
- [x] Neue `ButtonGroup` (`display: flex`, `gap` `space.1`) um die Buttons
- [x] `Button` → `styled(TextButton)` mit `letterSpacing.label`, `$variant` `active`/`default`; altes `div` und
      `margin`/`width`/Radius entfallen
- [x] Konstante `CONTROL_BAR_CLEARANCE = '104px'` exportieren (E4)
- [x] Slider (`StyledSlider`, `Box`) unverändert lassen

### Schritt 4: Overlay-Panel (`style(DND-5): …`)

#### Frontend
- [x] `Screen`: `align-items: flex-start`, `padding-top` `space.7`
- [x] `BackgroundImage`: `inset: 0`, `object-fit: cover`, `z-index` `layer.media`
- [x] `MapContainer` → `OverlayPanel`: Breite nach E4, `height: auto`, `padding` `space.6`, `flex-direction: column`,
      `align-items: stretch`, ohne `justify-content`, `radius.lg`, `z-index` `layer.panel`
- [x] Kopfzeile nach E5 (`display: flex`, `align-items: baseline`, `justify-content: space-between`,
      `margin-bottom` `space.5`)
- [x] `MapEnvironment`: `display: block`, `height: auto`, `aspect-ratio: 16 / 9`, `radius.md`
- [x] `MapOverview`-Aufruf: `gap={theme.space[3]}`, `padding='0'`

### Schritt 5: Kacheln und Nummern (`style(DND-5): …`)

#### Frontend
- [x] `MapOverview`: zeilenweise Indexrechnung (`mapIndex * count + colIndex`), Prop `number={itemIndex + 1}` (E6)
- [x] `MapElement`: `$isAdminScreen` an `MapContainer`, Radius `radius.sm` (Admin) / `radius.md` (Wall);
      `MapImage` `border-radius: inherit`
- [x] `MapOverlay` `z-index` → `layer.raised`
- [x] `NumberIcon` nach Mapping: `top`/`left` `space.2`, ohne `bottom`, `min-width`/`height` `size.badge`,
      `padding: 0 space.2`, `display: grid`, `place-items: center`, `radius.pill`, `text.md`, `fontWeight.bold`,
      `tabular-nums`, `z-index` `layer.raised`; zeigt `number`
- [x] Farben bleiben in diesem Schritt `#5a5a5a`/`white`

### Schritt 6: Badge-Farben und Ebenen (`style(DND-5): …`)

#### Frontend
- [x] Rollen `badge: { background, text }` in `darkTheme` und `tavernTheme` (E6); Typ kommt über `styled.d.ts`
      automatisch aus `darkTheme`
- [x] `NumberIcon`: `colors.badge.background` / `colors.badge.text`
- [x] Prüfen: In `WallScreen`, `ScreenControlBar`, `MapOverview`, `MapElement`, `Dialogue`, `TextButton` keine freien
      `z-index`-Werte, keine festen Farben, keine px außer den benannten Konstanten (Ausnahme: Slider)

### Schritt 7: Doku (`docs(DND-5): …`)
- [x] `frontend/DESIGN.md`: aus Abschnitt 4 die geschlossenen Punkte entfernen (Text auf aktivem Button, Farben der
      Kachelnummer, Bausteine; Ebenen und Grundregeln auf die Ground-Reste kürzen). Übergangsdauern nach E2 als
      Regel festhalten und aus 4 entfernen. `badge.*` in die Farbrollen (2.2) aufnehmen, 2.5 anpassen. Baustein
      `TextButton` in den Bausteinen nennen.
- [x] `frontend/design/wall-mapping.md`: Stand „umgesetzt in DND-5“, Abweichungen vom Vorschlag vermerken
      (`OverlayPanel`, Konstantennamen, Dauern als Wert)
- [x] `docs/screens.md`: Ist-Stand Wall (Panel mit Kopfzeile, Raumnummern, schwebende Steuerleiste), Admin
      (zeilenweise Reihenfolge), Ground (neue Steuerleiste)
- [x] `docs/known-issues.md`: behobene Punkte (verzerrtes Wandbild, Kachelnummer = Datenbank-ID) entfernen, falls dort
      geführt – dort nicht geführt, keine Änderung. Zusätzlich `frontend/CLAUDE.md` (GlobalStyle jetzt auch in
      `WallScreen`) nachgezogen.

## Akzeptanzkriterien

- [ ] AK1: Die Wall sieht bei 1920 × 1080 aus wie `wall.png` (BATTLE) und `wall-world.png` (WORLD), bei 1366 × 768
      wie `wall-1366.png` – in beiden Themes. Das Panel überdeckt die Steuerleiste nicht.
- [ ] AK2: In den angefassten Components nur Tokens und Farbrollen; feste Werte nur als
      `OVERLAY_PANEL_MAX_WIDTH`, `CONTROL_BAR_CLEARANCE` und die Übergangsdauer (E2). Alle `z-index` über `layer.*`.
- [ ] AK3: `TextButton` ist der gemeinsame Baustein für Dialog und Steuerleiste; der Dialog sieht unverändert aus.
      Die Steuerleiste nutzt `<button>`; der aktive Button hat Text in `onPrimary`.
- [ ] AK4: Kacheln stehen auf Wall und Admin zeilenweise und zeigen 1–25; die Auswahl im Admin wechselt weiter die
      richtige Szene (Datenbank-ID).
- [ ] AK5: Alle Invarianten eingehalten – keine Funktionsänderung.
- [ ] AK6: Lint, Unit-Tests und Build sind so grün wie vorher (bekannte Altfehler ausgenommen).
- [ ] AK7: Bestehende Tests inhaltlich unverändert.
- [ ] AK8: Doku nach Schritt 7 nachgezogen.

## Teststrategie / Verifikation

**Automatisch**
- Frontend: `npm run lint`, `npm run test:unit`, `npm run build` (inkl. `tsc -b`) nach jedem Schritt
- BDD (`npm run test:e2e`), wenn das Backend läuft. Selektoren bleiben gleich.

**Manuell** (Backend und Frontend per `docker compose up --build` im Root; Admin, Wall, Ground in eigenen Fenstern)
1. `/wall` bei 1920 × 1080, Dark-Theme, Kampfszene aktiv: Screenshot neben `wall.png`. Prüfen: Wandbild unverzerrt
   und randlos, Panel 1440px breit, 48px unter der Oberkante, Kopfzeile „Kampfschauplätze“ + „25 Räume“, 5 × 5
   Kacheln mit 12px Abstand, Radius 8px, Nummern 1–25 oben links zeilenweise, aktive Kachel mit Outline.
2. Hover: Steuerleiste schwebt mittig 24px über der Unterkante, Radius 16px, Buttons BATTLE/WORLD/OFF mit 4px
   Abstand. WORLD: Panel mit „Weltkarte“ und Karte 16:9 neben `wall-world.png`. OFF blendet aus. Aktiver Button in
   `primary` mit Text `onPrimary`.
3. Viewport 1366 × 768: neben `wall-1366.png`; Panel schrumpft, Raster bleibt über der Steuerleiste.
4. Theme im Admin umschalten: Schritte 1–3 im Tavern-Theme.
5. Nicht-Kampfszene im Admin wählen: Panel blendet aus; Kampfszene wählen: Panel blendet automatisch ein.
6. Kontrolllauf Admin: Kampfszenen zeilenweise 1–25 (ohne Nummern-Overlay), Kachel 5 wählt die Szene der fünften
   Kachel; Dialog-Buttons Decline/Confirm sehen aus wie vorher und funktionieren.
7. Kontrolllauf Ground (`/ground`): Steuerleiste in der neuen Form, Buttons schalten das Raster, Slider ändert die
   Zellgröße.

## Offene Fragen
- **Regression Ground (aus Schritt 3):** `GridOverlay` (Vollbild, `z-index: 99`, Ground-Task) liegt seit
  `layer.controls` (30) über der Hover-Fläche der Steuerleiste. Auf `/ground` lässt sich die Steuerleiste dadurch
  nicht mehr einblenden und nicht bedienen (vorher 99999 > 99). Nachweis per Selenium: Element am Punkt der Leiste
  vorher Ebene 99999, Leiste `opacity 1`; jetzt Ebene 99 (`GridOverlay`), Leiste `opacity 0`. Behebung braucht eine
  Änderung außerhalb des Scopes, z. B. `GridOverlay` `z-index` → `layer.grid` (10, laut DESIGN.md 1.2) vorziehen.
  **Entschieden (User, Option 1):** `GridOverlay` `z-index` → `layer.grid` (10) vorgezogen, eigener Commit
  `fix(DND-5): …`. Danach per Selenium geprüft: Leiste auf `/ground` einblendbar und bedienbar (Ebene 30 am Punkt
  der Leiste), BLACK/WHITE/OFF färben das Raster, Slider 100 → 200 halbiert die Zahl der Linien (31 → 16), Raster
  liegt über dem Bild (10 > 1).

## Review

### Runde 1 – 2026-10-07
**Empfehlung:** Nacharbeiten (AK1 knapp verfehlt; ob die Abweichung akzeptabel ist, entscheidet der User)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | nicht erfüllt (knapp) | Selenium headless am Docker-Stack, Dark und Tavern. 1920 × 1080: Panel x=240, y=48, 1440 breit, aber 925 statt ≈915px hoch (Unterkante 973 statt ≈962). 1366 × 768: Panel 908 × 626, Unterkante 674 statt 664, Leiste ab y=688 → 14 statt 24px Luft (keine Überdeckung). WORLD 1440 × 894 wie Mapping. Übrige Optik wie `wall.png`/`wall-1366.png` (Kopfzeile, Nummern 1–25 zeilenweise, Radius 8px, `object-fit: cover`, Inter, Tavern-Farben). Ursache: `border: 1px` an `MapContainer` (`MapElement.tsx`, aus DND-4), Mockup nutzt `outline` (`build.py:70-71`); Formel in `WallScreen.tsx` (`OverlayPanel`) zieht den Rand nicht ab → +2px je Reihe. |
| AK2 | erfüllt | px nur in `OVERLAY_PANEL_MAX_WIDTH`, `CONTROL_BAR_CLEARANCE`, Slider (Ausnahme) und bestehendem `DIALOG_WIDTH`; keine freien Farben, kein freier `z-index`; Übergang `0.5s` nach E2. |
| AK3 | erfüllt | `TextButton.tsx` übernimmt den alten `textButton`-Block 1:1; Dialog gemessen identisch (Confirm/Decline-Farben, 40px, min. 112px, Radius 8px, 14px/600). Leiste: `<button>`, aktiv `onPrimary` auf `primary` in beiden Themes, Laufweite .08em. |
| AK4 | erfüllt | `MapOverview.tsx:53` `mapIndex * count + colIndex`. Admin: battle_1–5 in Reihe 1; Klick battle_5 + Confirm → `activeSceneId=9` (Szene 9 = battle_5.jpg). Wall: 1, 2 in Reihe 1; 6, 11, 16, 21 in Spalte 1. |
| AK5 | erfüllt | BATTLE/WORLD/OFF korrekt, Kampfszene blendet BATTLE automatisch ein, Leiste per Hover (opacity 1). Kein Diff an Routen, Backend, Player; `data-test-id`s bleiben. Ground-Leiste nach `808265a` bedienbar (`elementFromPoint` = BUTTON). |
| AK6 | erfüllt | Lint 0 Fehler / 3 Warnungen (identisch auf `b032343`), Unit 10/10, `tsc -b` + `vite build` grün. |
| AK7 | erfüllt | `git diff b032343..HEAD -- frontend/__tests__` leer. |
| AK8 | erfüllt | DESIGN.md (1.4, 1.5, 2.2/2.3/2.5, 4), wall-mapping.md, screens.md, frontend/CLAUDE.md; Stichproben passen zum Code. |

**Blockierende Befunde**
- [x] AK1: Panel 10px höher als Mockup/Formel (1920: 925 statt ≈915px; 1366: 14 statt 24px Luft zur Leiste). Ursache 1px-`border` der Kachel. Ansätze: Rand als `outline`/`box-shadow: inset` wie im Mockup (wirkt auch im Admin), Rand in der Formel berücksichtigen (korrigiert nur die Lage bei kleinen Monitoren), oder User nimmt die Abweichung hin. **Behoben:** Kachelrand als `outline` (1px `border`, Abstand 0) statt `border`, aktive Kachel ersetzt ihn durch die 2px-Outline mit Abstand 2px (wie `build.py:70-71`). Gemessen in Dark und Tavern: 1920 × 1080 Panel 1440 × 915, 1366 × 768 Panel 908 × 616, 24px Luft zur Leiste. Admin: Kacheln 4px Radius, Rand sichtbar, aktive Outline ohne Kollision.

**Hinweise**
- BDD 1/4 grün, 3 rot (`NoSuchElementError` auf `/assets/images/maps/battle_N.jpg`) – vorbestehend: Seed liefert `ground_screen/battle_N.jpg`, Tests erwarten `maps/`; Tests, Seed und `data-test-id={src}` unverändert.
- Invariante `groundImg` im Plan nennt ein Attribut, das es schon auf `b032343` nicht gab (auch `known-issues.md:34`) – keine Regression, Plan ungenau.
- Freigegebene Abweichung `GridOverlay` → `layer.grid` als eigener `fix(DND-5)` (`808265a`), in Offenen Fragen und DESIGN.md 4 vermerkt.
- Ground-Slider mit altem `Box`-margin (Leiste 65 statt 56px hoch) – laut Plan Ground-Task.
- `ScreenControlBar.tsx:6-7`: doppelte Leerzeile nach den Imports.
- Hover-Fläche (`layer.controls`, Vollbild) liegt über dem Panel (`layer.panel`); auf der Wall ohne Folgen, vorher identisch.
- Konventionen: Commit-Typen passen zu E1 (+ freigegebener `fix`), keine KI-Signaturen, Branch `development`; Scope nur um freigegebenes `GridOverlay.tsx` erweitert.
- Nicht geprüft: Hover mit echter Maus, mehrere Fenster gleichzeitig, Theme-Wechsel live per `storage`-Event.

### Runde 2 – 2026-10-07
**Empfehlung:** Abnahme

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Selenium headless am Docker-Stack, Szene 9 aktiv, Dark und Tavern gleich. 1920 × 1080: Panel (240, 48), 1440 × 914,95, Unterkante 962,95; Leiste ab y=1000 (360 × 56) → 37px Luft. 1366 × 768: Panel 908,4 × 615,97, Unterkante 663,97, Leiste ab 688 → 24,03px Luft. Kacheln exakt 16:9 (265,6 × 149,4 bzw. 159,3 × 89,6), Radius 8px, 1px-Outline statt `border`; aktiv 2px-Outline `primary` mit 2px Abstand. WORLD 1440 × 894. Screenshots deckungsgleich mit `wall.png` (1920 Dark) und `wall-1366.png` (1366 Tavern). |
| AK2 | erfüllt | Nacharbeit nur mit `borderWidth.thin/thick`, `colors.border/primary`; keine neuen px, Farben oder `z-index`. |
| AK3 | erfüllt | Seit Runde 1 keine Änderung an `TextButton.tsx`, `Dialogue.tsx` oder Leisten-Buttons; `851c3bf` entfernt nur eine Leerzeile. |
| AK4 | erfüllt | Erste Spalte 1, 6, 11, 16, 21; aktive Kachel battle_5 bei Szene 9 (DB-ID) auf Wall und Admin. |
| AK5 | erfüllt | Leiste per Hover, BATTLE automatisch bei Kampfszene, WORLD funktioniert; kein Diff an Routen, Backend, Player, `data-test-id`. Admin-Aktivzustand korrekt (siehe Hinweise). |
| AK6 | erfüllt | Lint 0 Fehler / 3 Warnungen (Altstand), Unit 10/10, `tsc -b` + `vite build` grün. |
| AK7 | erfüllt | `git diff b032343..HEAD -- frontend/__tests__ backend` leer. |
| AK8 | erfüllt | DESIGN.md 1.4 und Baustein „Rand“ beschreiben `outline`; `wall-mapping.md` nennt die Abweichung „gilt auch im Admin“; passt zu `MapElement.tsx:23-27`. |

**Blockierende Befunde**
- keine

**Hinweise**
- Admin nach Outline-Umstellung (1920 × 1080, beide Themes): Kampfszenen-Kacheln jetzt 64 × 36 statt 64 × 38 – entspricht `admin.png` und DESIGN.md; aktive Outline überschneidet keine Nachbarn (Abstand 8px). Nicht-Kampfszenen 96 × 54, aktive Outline (1009–1071) bleibt in der unteren Leiste (1000–1080), kein `overflow: hidden`. Layout deckungsgleich mit `admin.png`.
- `7dd5d77` (`style`) ändert zusätzlich die Plan-Datei (Blocker aus Runde 1 abgehakt). Inhaltlich korrekt; sauberer wäre ein eigener `docs`-Commit bzw. Pflege des Review-Abschnitts durch die Hauptsession.
- `frontend/design/admin-mapping.md:446` nennt für `MapContainer` noch `border` – Stand DND-4, Abweichung steht in `wall-mapping.md`; Querverweis wäre hilfreich.
- Hinweise aus Runde 1 gelten unverändert (BDD 3/4 rot vorbestehend, Invariante `groundImg` ungenau, `GridOverlay` → `layer.grid` freigegeben, Ground-Slider-Margin im Ground-Task).
- Konventionen eingehalten (Schema, keine KI-Signaturen, `development`, Arbeitsverzeichnis sauber).
- Nicht geprüft: Hover mit echter Maus, mehrere Fenster gleichzeitig, Theme-Wechsel live per `storage`-Event, BDD-Lauf.
