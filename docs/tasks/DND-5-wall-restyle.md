# DND-5: Restyle Wall Screen (Schritt 2 von 3: nach Admin, danach Ground)

**Typ:** style
**Status:** Freigegeben

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
- [ ] `WallScreen`: `<GlobalStyle />` rendern (wie `AdminScreen`)
- [ ] `Screen`: System-Stack (`font-family`) entfernen, Schrift kommt aus dem GlobalStyle
- [ ] Hinweis: `border-box`/`margin: 0` können das alte Layout leicht verschieben. Zulässig, solange alles bedienbar
      bleibt; die folgenden Schritte stellen das Layout um.

### Schritt 2: TextButton herauslösen (`refactor(DND-5): …`)

#### Frontend
- [ ] `src/components/TextButton.tsx` nach E3
- [ ] `Dialogue.tsx`: `textButton`, `ConfirmButton`, `DeclineButton` entfernen, `TextButton` mit `$variant`
      verwenden. `data-test-id` und Texte bleiben.
- [ ] Nachweis: Dialog im Admin in beiden Themes unverändert (Vergleich mit `admin-dialog.png` bzw. Stand vorher)

### Schritt 3: Steuerleiste (`style(DND-5): …`)

#### Frontend
- [ ] `ScreenControlBar`: `Overlay` `z-index` → `layer.controls`
- [ ] `ControlBar` nach Mapping: `width`/`height` `auto`, `left: 50%` + `translateX(-50%)`, ohne `right`,
      `bottom` `space.5`, `padding` `space.2`, `gap` `space.5`, `radius.xl`, ohne `justify-content`;
      `transition` bleibt (E2), Hintergrund `dark` bleibt
- [ ] Neue `ButtonGroup` (`display: flex`, `gap` `space.1`) um die Buttons
- [ ] `Button` → `styled(TextButton)` mit `letterSpacing.label`, `$variant` `active`/`default`; altes `div` und
      `margin`/`width`/Radius entfallen
- [ ] Konstante `CONTROL_BAR_CLEARANCE = '104px'` exportieren (E4)
- [ ] Slider (`StyledSlider`, `Box`) unverändert lassen

### Schritt 4: Overlay-Panel (`style(DND-5): …`)

#### Frontend
- [ ] `Screen`: `align-items: flex-start`, `padding-top` `space.7`
- [ ] `BackgroundImage`: `inset: 0`, `object-fit: cover`, `z-index` `layer.media`
- [ ] `MapContainer` → `OverlayPanel`: Breite nach E4, `height: auto`, `padding` `space.6`, `flex-direction: column`,
      `align-items: stretch`, ohne `justify-content`, `radius.lg`, `z-index` `layer.panel`
- [ ] Kopfzeile nach E5 (`display: flex`, `align-items: baseline`, `justify-content: space-between`,
      `margin-bottom` `space.5`)
- [ ] `MapEnvironment`: `display: block`, `height: auto`, `aspect-ratio: 16 / 9`, `radius.md`
- [ ] `MapOverview`-Aufruf: `gap={theme.space[3]}`, `padding='0'`

### Schritt 5: Kacheln und Nummern (`style(DND-5): …`)

#### Frontend
- [ ] `MapOverview`: zeilenweise Indexrechnung (`mapIndex * count + colIndex`), Prop `number={itemIndex + 1}` (E6)
- [ ] `MapElement`: `$isAdminScreen` an `MapContainer`, Radius `radius.sm` (Admin) / `radius.md` (Wall);
      `MapImage` `border-radius: inherit`
- [ ] `MapOverlay` `z-index` → `layer.raised`
- [ ] `NumberIcon` nach Mapping: `top`/`left` `space.2`, ohne `bottom`, `min-width`/`height` `size.badge`,
      `padding: 0 space.2`, `display: grid`, `place-items: center`, `radius.pill`, `text.md`, `fontWeight.bold`,
      `tabular-nums`, `z-index` `layer.raised`; zeigt `number`
- [ ] Farben bleiben in diesem Schritt `#5a5a5a`/`white`

### Schritt 6: Badge-Farben und Ebenen (`style(DND-5): …`)

#### Frontend
- [ ] Rollen `badge: { background, text }` in `darkTheme` und `tavernTheme` (E6); Typ kommt über `styled.d.ts`
      automatisch aus `darkTheme`
- [ ] `NumberIcon`: `colors.badge.background` / `colors.badge.text`
- [ ] Prüfen: In `WallScreen`, `ScreenControlBar`, `MapOverview`, `MapElement`, `Dialogue`, `TextButton` keine freien
      `z-index`-Werte, keine festen Farben, keine px außer den benannten Konstanten (Ausnahme: Slider)

### Schritt 7: Doku (`docs(DND-5): …`)
- [ ] `frontend/DESIGN.md`: aus Abschnitt 4 die geschlossenen Punkte entfernen (Text auf aktivem Button, Farben der
      Kachelnummer, Bausteine; Ebenen und Grundregeln auf die Ground-Reste kürzen). Übergangsdauern nach E2 als
      Regel festhalten und aus 4 entfernen. `badge.*` in die Farbrollen (2.2) aufnehmen, 2.5 anpassen. Baustein
      `TextButton` in den Bausteinen nennen.
- [ ] `frontend/design/wall-mapping.md`: Stand „umgesetzt in DND-5“, Abweichungen vom Vorschlag vermerken
      (`OverlayPanel`, Konstantennamen, Dauern als Wert)
- [ ] `docs/screens.md`: Ist-Stand Wall (Panel mit Kopfzeile, Raumnummern, schwebende Steuerleiste), Admin
      (zeilenweise Reihenfolge), Ground (neue Steuerleiste)
- [ ] `docs/known-issues.md`: behobene Punkte (verzerrtes Wandbild, Kachelnummer = Datenbank-ID) entfernen, falls dort
      geführt

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
- keine

## Review
