# DND-6: Restyle Ground Screen (Schritt 3 von 3: nach Admin und Wall)

**Typ:** style
**Status:** Entwurf

## Kontext & Ziel

Der Ground Screen zeigt auf dem liegenden Monitor das Spielbrett: Vollbild-Medium, Raster und eine Steuerleiste.
Seit DND-5 hat die Steuerleiste die schwebende Form der Wall. Die Ground-Teile sind aber noch im alten Stil: ohne
`GlobalStyle`, mit freiem `z-index`, Vollbild-Ebenen ohne `inset`, dicker Slider mit Punkten und Tooltip, ohne
Beschriftungen. Dieser Task stellt sie auf den Style Guide um: Bei 1920 × 1080 sieht der Ground aus wie das Mockup v2
und nutzt nur Tokens und Farbrollen aus `frontend/DESIGN.md`. Feste Werte gibt es nur als benannte
Layout-Konstanten. Danach ist Abschnitt 4 „Offen“ in DESIGN.md geschlossen.

**Verbindliche Grundlage.** Die Entscheidungen darin werden hier nicht neu diskutiert:
- [frontend/DESIGN.md](../../frontend/DESIGN.md): Tokens, Regeln, Bausteine („Slider“, „Label“), Abschnitt 4 „Offen“
- [frontend/design/ground-mapping.md](../../frontend/design/ground-mapping.md): Soll-Werte inkl. Entscheidungen 1–4
  und K1–K4
- Mockup: [ground.png](../../frontend/design/mockups/v2/ground.png) (Quelle: `build.py`)
- Entscheidungen aus [DND-4](DND-4-admin-restyle.md) und [DND-5](DND-5-wall-restyle.md) gelten weiter, u. a.
  `GlobalStyle` je Screen, `textStyle`, `Label`, `TextButton`, `layer.*`, Übergangsdauern als Werte (DND-5 E2).

Wiederverwendet, nicht neu gebaut: `tokens.ts` (inkl. `textStyle`), `styled.d.ts`, `GlobalStyle.ts`, Themes mit
`onPrimary`, `Label.tsx`, `TextButton.tsx`, `ScreenControlBar` mit `ButtonGroup` und `layer.*`.

## Invarianten

- Funktion unverändert: Bild oder Video je nach Dateiendung, Raster BLACK/WHITE/OFF, Zellgröße 100–200 in
  10er-Schritten (inkl. `shiftStep`), Startwert 100, Hover-Einblendung der Steuerleiste, Szenen- und Theme-Wechsel
  über `localStorage`.
- Rasterlogik unverändert: Zellgröße = Slider-Wert × `devicePixelRatio`, Linien ab Position `i`, Linienstärke 2px.
- Gitterfarben `black` / `white` / `transparent` bleiben feste Werte (DESIGN.md 2.5).
- Die Wall-Steuerleiste sieht danach unverändert aus (sie übergibt kein Label und keinen `onSliderChange`).
- Routen, API und Backend unverändert. Admin, Wall-Layout und Player Screen unverändert.

## Scope / Non-Goals

**Im Scope**
- `<GlobalStyle />` in `GroundScreen`, als eigener Schritt (DESIGN.md 4, „Grundregeln“)
- `GroundScreen`: `Screen` (System-Stack und doppeltes Semikolon entfallen), `BackgroundMedia` mit `inset: 0` und
  `layer.media`
- `GridOverlay`: `Overlay` mit `inset: 0`, `layer.grid` (seit DND-5), `pointer-events: none`; Linienstärke aus
  `borderWidth.thick` statt Zahl im JSX (E2)
- `ScreenControlBar`, nur Ground-Teile: Beschriftung „Raster“ (neue Prop `label`), Slider-Gruppe mit „Zelle“,
  Slider und Wertanzeige, `StyledSlider` und `Box` nach Mapping
- Doku: DESIGN.md (1.2 und 4), ground-mapping.md, `docs/screens.md` (Ist), `frontend/CLAUDE.md`

**Nicht im Scope**
- Rasterlogik mit `devicePixelRatio`
- Linie mittig auf der Zellgrenze (`i − 1`, im Mapping „optional“): bleibt wie heute ab `i`
- Gitterfarben BLACK/WHITE/OFF
- Token `duration.*` (entschieden in DND-5 E2: `0.5s` bleibt als Wert)
- Token `size.handle` (Griff als benannte Konstante, E1)
- Wall- und Admin-Layout, Player Screen, Backend
- Veraltete E2E-Selektoren (`groundImg`, known-issues.md)

## Entscheidungen

### E1: Feste Werte als benannte Konstanten in `ScreenControlBar.tsx`
- **Entscheidung:** `SLIDER_WIDTH = '200px'`, `SLIDER_THUMB_SIZE = '16px'`, `SLIDER_VALUE_MIN_WIDTH = '3ch'`.
  Schiene und Füllung: die Überschreibung `height: 10px` entfällt, es gilt MUI-Standard 4px (Mapping-Vorschlag) –
  daher keine Konstante für 4px. MUI-Root-`padding` (13px) wird nicht angefasst.
- **Verworfene Alternativen:** Token `size.handle` (nur eine Stelle); 4px explizit setzen.
- **Begründung:** Auftrag („feste Werte nur als benannte Layout-Konstanten“), ground-mapping.md „Werte ohne Token“.

### E2: Linienstärke als eigener refactor-Schritt
- **Entscheidung:** `GridLine` bekommt statt `$width`/`$height` (Zahl im JSX) eine Ausrichtung
  `$orientation: 'vertical' | 'horizontal'` und `$offset: number`. Die Dicke kommt im CSS aus
  `theme.borderWidth.thick`, die Länge ist `100%` der Vollbild-Ebene (gleich `innerWidth`/`innerHeight`). Das
  ungenutzte `$i` entfällt. Kein sichtbarer Unterschied, daher Commit `refactor(DND-6): …`.
- **Verworfene Alternativen:** `useTheme()` und String-Props im JSX; Umbau im style-Commit mit.
- **Begründung:** User-Entscheidung (Typfrage); trennt reine Struktur von sichtbaren Änderungen.

### E3: Beschriftungen
- **Entscheidung:** `ScreenControlBar` bekommt `label?: string`. Ist es gesetzt, steht vor der `ButtonGroup` ein
  `Label` mit `padding-left` `space.3`. `GroundScreen` übergibt `label="Raster"`, die Wall nichts. „Zelle“ ist fester
  Text in der Slider-Gruppe, die es nur mit `onSliderChange` gibt.
- **Begründung:** ground-mapping.md Entscheidung 3, Abschnitte „Beschriftung Raster“ und „Slider-Gruppe“.

### E4: Video-Szene für die Verifikation
- **Entscheidung:** Für den Test lokal temporär bei einer Szene `graphics_ground.source` auf eine kurze Testdatei
  unter `public/assets` setzen. Datei und DB-Änderung werden nicht committet und danach zurückgesetzt.
- **Begründung:** Weder Repo noch Seed enthalten ein Video (User-Entscheidung).

## Subtasks

### Schritt 1: GlobalStyle auf dem Ground (`style(DND-6): …`)

#### Frontend
- [ ] `GroundScreen`: `<GlobalStyle />` rendern (wie `AdminScreen`, `WallScreen`)
- [ ] `Screen`: System-Stack (`font-family`) entfernen, Schrift kommt aus dem GlobalStyle

### Schritt 2: Bildanzeige und Raster-Ebene (`style(DND-6): …`)

#### Frontend
- [ ] `Screen`: doppeltes Semikolon nach `background-color` entfernen; übrige Regeln unverändert
- [ ] `BackgroundMedia`: `inset: 0`, `z-index` → `layer.media`; `width`/`height` `100%`, `object-fit: cover`,
      `position: fixed` bleiben
- [ ] `GridOverlay` `Overlay`: `top`/`left`/`width`/`height` → `inset: 0`, `pointer-events: none`;
      `layer.grid` bleibt

### Schritt 3: Linienstärke aus dem Token (`refactor(DND-6): …`)

#### Frontend
- [ ] `GridLine` nach E2 umbauen; Schleifen und Zellgröße (`gridOption × devicePixelRatio`) unverändert
- [ ] Nachweis: Anzahl, Position und Größe der Linien vor und nach dem Umbau gleich (z. B. per
      `getBoundingClientRect` bei Slider 100 und 200)

### Schritt 4: Beschriftung „Raster“ (`style(DND-6): …`)

#### Frontend
- [ ] `ScreenControlBar`: Prop `label` nach E3, `Label` aus `src/components/Label.tsx` mit `padding-left` `space.3`
- [ ] `GroundScreen`: `label="Raster"` übergeben
- [ ] `WallScreen`: unverändert (kein Label)

### Schritt 5: Slider-Gruppe und Slider (`style(DND-6): …`)

#### Frontend
- [ ] Konstanten nach E1
- [ ] Neue `SliderGroup` (nur bei `onSliderChange`): `display: flex`, `align-items: center`, `gap` `space.3`,
      `padding-right` `space.3`; darin `Label` „Zelle“, `Box`, Wertanzeige
- [ ] `Box`: `sx={{ width: SLIDER_WIDTH, margin: 0 }}`
- [ ] Wertanzeige (neu): zeigt `sliderValue` ohne Einheit; `textStyle('sm')`, `fontWeight.semibold`,
      `font-variant-numeric: tabular-nums`, `text-align: right`, `min-width: SLIDER_VALUE_MIN_WIDTH`;
      Farbe erbt `text.color`
- [ ] `StyledSlider`: `.MuiSlider-rail` ohne `height`, `border-radius` `radius.pill`; `.MuiSlider-track` ohne
      `height`, `border: none` bleibt; `.MuiSlider-thumb` `width`/`height` `SLIDER_THUMB_SIZE`, Fokus/Hover ohne
      Schatten bleibt; Regeln für `.MuiSlider-mark`, `.MuiSlider-markLabel`, `.MuiSlider-valueLabel` entfallen
- [ ] Slider-Props: `marks` und `valueLabelDisplay` entfernen; `step={10}`, `shiftStep`, `min`/`max`, `value`,
      `onChange`, `aria-label` bleiben
- [ ] Prüfen: In `GroundScreen`, `GridOverlay`, `ScreenControlBar` keine freien `z-index`-Werte, keine festen Farben
      außer den Gitterfarben, keine px außer den benannten Konstanten (`CONTROL_BAR_CLEARANCE`, E1) und der
      Übergangsdauer `0.5s` (DND-5 E2)

### Schritt 6: Doku (`docs(DND-6): …`)
- [ ] `frontend/DESIGN.md`: aus Abschnitt 4 die geschlossenen Ground-Lücken entfernen (Ebenen, Grundregeln,
      Vollbild-Ebene); bleibt nichts übrig, Abschnitt mit „Keine offenen Lücken (Stand nach DND-6)“ stehen lassen.
      1.2 Ebenen: Spalte „Vor dem Umbau“ und Hinweise auf den Ground-Stand prüfen. Baustein „Slider“ ggf. um
      Konstantennamen ergänzen.
- [ ] `frontend/design/ground-mapping.md`: Stand „umgesetzt in DND-6“, Abweichungen vermerken (Konstantennamen,
      `GridLine` mit Ausrichtung statt Größen-Props, Linie nicht mittig, 4px über MUI-Standard)
- [ ] `docs/screens.md`: Ist-Stand Ground (Beschriftungen „Raster“/„Zelle“, schlanker Slider ohne Punkte und Tooltip,
      feste Wertanzeige); Satz „Slider noch im alten Stil“ entfernen
- [ ] `frontend/CLAUDE.md`: `GlobalStyle` jetzt in allen drei Screens (Admin, Wall, Ground)
- [ ] `docs/known-issues.md`: prüfen, ob ein behobener Punkt geführt ist

## Akzeptanzkriterien

- [ ] AK1: Der Ground sieht bei 1920 × 1080 aus wie `ground.png` – in beiden Themes, mit Bild- und mit Video-Szene:
      Medium randlos, Raster darüber, Steuerleiste mit „RASTER“, BLACK/WHITE/OFF, „ZELLE“, Slider 200px mit 4px
      Schiene und 16px Griff, Wertanzeige rechts.
- [ ] AK2: In den angefassten Components nur Tokens und Farbrollen; feste Werte nur als `SLIDER_WIDTH`,
      `SLIDER_THUMB_SIZE`, `SLIDER_VALUE_MIN_WIDTH`, `CONTROL_BAR_CLEARANCE`, Übergangsdauer und Gitterfarben. Alle
      `z-index` über `layer.*`; Vollbild-Ebenen mit `inset: 0`.
- [ ] AK3: Slider ohne Punkte und ohne Tooltip; rastet in 10er-Schritten ein; die Wertanzeige zeigt 100–200 ohne
      Einheit; die Leiste verschiebt sich beim Ziehen nicht (feste Breite `3ch`, `tabular-nums`).
- [ ] AK4: Die Wall-Steuerleiste ist unverändert (kein Label, kein Slider, gleiche berechnete Styles wie vorher).
- [ ] AK5: Alle Invarianten eingehalten – keine Funktionsänderung.
- [ ] AK6: Lint, Unit-Tests und Build sind so grün wie vorher (bekannte Altfehler ausgenommen).
- [ ] AK7: Bestehende Tests inhaltlich unverändert.
- [ ] AK8: Doku nach Schritt 6 nachgezogen; DESIGN.md 4 enthält keine Ground-Lücken mehr.

## Teststrategie / Verifikation

**Automatisch**
- Frontend: `npm run lint`, `npm run test:unit`, `npm run build` (inkl. `tsc -b`) nach jedem Schritt
- BDD (`npm run test:e2e`), wenn das Backend läuft. Selektoren bleiben gleich.

**Manuell** (Backend und Frontend per `docker compose up --build` im Root; Admin, Wall, Ground in eigenen Fenstern)
1. `/ground` bei 1920 × 1080, Dark-Theme, Szene mit Bild: Screenshot mit eingeblendeter Steuerleiste (Raster WHITE,
   Slider 140) neben `ground.png`. Prüfen: Bild randlos, Raster über dem Bild, Leiste mittig 24px über der
   Unterkante, „RASTER“ 20px vom linken Rand der Leiste, Buttons mit 4px Abstand, 24px zwischen den Gruppen,
   Slider 200px, Schiene 4px, Griff 16px, Wert „140“ in `text.sm` semibold.
2. Bedienung: BLACK/WHITE/OFF färben das Raster bzw. blenden es aus; Slider 100 → 200 rastet in 10er-Schritten,
   Zahl der Linien halbiert sich; Wertanzeige folgt, keine Verschiebung der Leiste. Mausereignisse gehen durch die
   Raster-Ebene (`pointer-events: none`), Hover blendet die Leiste weiter ein.
3. Theme im Admin umschalten: Schritte 1–2 im Tavern-Theme (Schiene `secondary`, Füllung `primary`,
   Griff `text.color`, aktiver Button mit `onPrimary`).
4. Video-Szene nach E4: Video läuft (autoplay, loop, stumm), randlos, Raster und Leiste wie in 1. Danach Testdatei
   und DB-Wert zurücksetzen.
5. Szenenwechsel im Admin: Ground lädt das neue Medium, Raster-Einstellungen bleiben.
6. Kontrolllauf Wall (`/wall`): Steuerleiste ohne Label und Slider, sieht aus wie vor dem Task (Screenshot oder
   Vergleich der berechneten Styles von `ControlBar` und Buttons vorher/nachher).

## Offene Fragen
- keine

## Review
