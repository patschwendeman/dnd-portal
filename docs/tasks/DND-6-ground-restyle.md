# DND-6: Restyle Ground Screen (Schritt 3 von 3: nach Admin und Wall)

**Typ:** style
**Status:** Fertig

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
- [x] `GroundScreen`: `<GlobalStyle />` rendern (wie `AdminScreen`, `WallScreen`)
- [x] `Screen`: System-Stack (`font-family`) entfernen, Schrift kommt aus dem GlobalStyle

### Schritt 2: Bildanzeige und Raster-Ebene (`style(DND-6): …`)

#### Frontend
- [x] `Screen`: doppeltes Semikolon nach `background-color` entfernen; übrige Regeln unverändert
- [x] `BackgroundMedia`: `inset: 0`, `z-index` → `layer.media`; `width`/`height` `100%`, `object-fit: cover`,
      `position: fixed` bleiben
- [x] `GridOverlay` `Overlay`: `top`/`left`/`width`/`height` → `inset: 0`, `pointer-events: none`;
      `layer.grid` bleibt

### Schritt 3: Linienstärke aus dem Token (`refactor(DND-6): …`)

#### Frontend
- [x] `GridLine` nach E2 umbauen; Schleifen und Zellgröße (`gridOption × devicePixelRatio`) unverändert
- [x] Nachweis: Anzahl, Position und Größe der Linien vor und nach dem Umbau gleich (z. B. per
      `getBoundingClientRect` bei Slider 100 und 200)

### Schritt 4: Beschriftung „Raster“ (`style(DND-6): …`)

#### Frontend
- [x] `ScreenControlBar`: Prop `label` nach E3, `Label` aus `src/components/Label.tsx` mit `padding-left` `space.3`
- [x] `GroundScreen`: `label="Raster"` übergeben
- [x] `WallScreen`: unverändert (kein Label)

### Schritt 5: Slider-Gruppe und Slider (`style(DND-6): …`)

#### Frontend
- [x] Konstanten nach E1
- [x] Neue `SliderGroup` (nur bei `onSliderChange`): `display: flex`, `align-items: center`, `gap` `space.3`,
      `padding-right` `space.3`; darin `Label` „Zelle“, `Box`, Wertanzeige
- [x] `Box`: `sx={{ width: SLIDER_WIDTH, margin: 0 }}`
- [x] Wertanzeige (neu): zeigt `sliderValue` ohne Einheit; `textStyle('sm')`, `fontWeight.semibold`,
      `font-variant-numeric: tabular-nums`, `text-align: right`, `min-width: SLIDER_VALUE_MIN_WIDTH`;
      Farbe erbt `text.color`
- [x] `StyledSlider`: `.MuiSlider-rail` ohne `height`, `border-radius` `radius.pill`; `.MuiSlider-track` ohne
      `height`, `border: none` bleibt; `.MuiSlider-thumb` `width`/`height` `SLIDER_THUMB_SIZE`, Fokus/Hover ohne
      Schatten bleibt; Regeln für `.MuiSlider-mark`, `.MuiSlider-markLabel`, `.MuiSlider-valueLabel` entfallen
- [x] Slider-Props: `marks` und `valueLabelDisplay` entfernen; `step={10}`, `shiftStep`, `min`/`max`, `value`,
      `onChange`, `aria-label` bleiben
- [x] Prüfen: In `GroundScreen`, `GridOverlay`, `ScreenControlBar` keine freien `z-index`-Werte, keine festen Farben
      außer den Gitterfarben, keine px außer den benannten Konstanten (`CONTROL_BAR_CLEARANCE`, E1) und der
      Übergangsdauer `0.5s` (DND-5 E2)

### Schritt 6: Doku (`docs(DND-6): …`)
- [x] `frontend/DESIGN.md`: aus Abschnitt 4 die geschlossenen Ground-Lücken entfernen (Ebenen, Grundregeln,
      Vollbild-Ebene); bleibt nichts übrig, Abschnitt mit „Keine offenen Lücken (Stand nach DND-6)“ stehen lassen.
      1.2 Ebenen: Spalte „Vor dem Umbau“ und Hinweise auf den Ground-Stand prüfen. Baustein „Slider“ ggf. um
      Konstantennamen ergänzen.
- [x] `frontend/design/ground-mapping.md`: Stand „umgesetzt in DND-6“, Abweichungen vermerken (Konstantennamen,
      `GridLine` mit Ausrichtung statt Größen-Props, Linie nicht mittig, 4px über MUI-Standard)
- [x] `docs/screens.md`: Ist-Stand Ground (Beschriftungen „Raster“/„Zelle“, schlanker Slider ohne Punkte und Tooltip,
      feste Wertanzeige); Satz „Slider noch im alten Stil“ entfernen
- [x] `frontend/CLAUDE.md`: `GlobalStyle` jetzt in allen drei Screens (Admin, Wall, Ground)
- [x] `docs/known-issues.md`: prüfen, ob ein behobener Punkt geführt ist

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

### Runde 1 – 2026-10-07
**Empfehlung:** Abnahme

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Selenium headless, 1920 × 1080, DPR 1. Raster WHITE, Slider 140: Leiste x 571–1348, 56px hoch, 24px über der Unterkante, Buttons x 668/784/900 (je 112 × 40), Wert x 1301 – deckt sich mit `ground.png`. „RASTER“ 20px vom Rand der Leiste (8px Innenabstand + 12px `padding-left`), `text.xs` 12/16, 600, uppercase, .08em. Gruppenabstand 24px, Buttons 4px. Slider 200px, Schiene/Füllung 4px mit `radius.pill`, Griff 16 × 16, Wert 14px/600. Medium randlos (`fixed`, `inset: 0`, `object-fit: cover`), z 1; Raster z 10. Tavern: Schiene `secondary` (#3D271C), Füllung `primary` (#C05E5E), Griff `text.color` (#CBAB96). Video-Szene nur per Screenshot des Implementers (plausibel, gleiche `BackgroundMedia`); Testdatei entfernt, Szene 1 wieder `mapOverview.jpg`. |
| AK2 | erfüllt | `GroundScreen.tsx:30-37` `inset: 0`, `layer.media`; `GridOverlay.tsx:10-24` `inset: 0`, `layer.grid`, `pointer-events: none`, Linienstärke `borderWidth.thick`; `ScreenControlBar.tsx:12-18` Konstanten `SLIDER_WIDTH`, `SLIDER_THUMB_SIZE`, `SLIDER_VALUE_MIN_WIDTH`, `CONTROL_BAR_CLEARANCE`. Sonst nur Tokens, Farbrollen, `0.5s`, Gitterfarben. Kein freier `z-index`. |
| AK3 | erfüllt | 0 `.MuiSlider-mark`, 0 `.MuiSlider-valueLabel`. Pfeiltaste 100 → 200 in 10er-Schritten (`aria-valuenow` = Anzeige), PageDown 200 → 100 (`shiftStep`). Wertanzeige konstant 27.7px (`3ch`, `tabular-nums`), Leiste konstant x 571.3 / 777.4px. |
| AK4 | erfüllt | `ControlBar`, `Overlay`, `ButtonGroup`, `Button`, `WallScreen.tsx` unverändert; Label und `SliderGroup` nur bei gesetzten Props. `/wall` gemessen: ein Kind (BATTLE/WORLD/OFF), Leiste 360 × 56, Radius 16, Innenabstand 8, Abstand 24, unten 24. |
| AK5 | erfüllt | Medientyp per Endung, `gridColorMap`, Slider-Props und Linienberechnung unverändert; Linien gemessen gleich (100: 31 Linien, 200: 16). Hover blendet Leiste ein. Backend, Routen, Admin, Player nicht im Diff. |
| AK6 | erfüllt | Lint 0 Fehler / 3 vorbestehende Warnungen, Unit 10/10, Build grün. E2E 1/4 grün, 3 rot am Admin-Schritt „I click on a fight scene“ – identisch zum Stand vor dem Task. |
| AK7 | erfüllt | `git diff --stat 226ca8a^..580c079`: keine Testdateien geändert. |
| AK8 | erfüllt | `DESIGN.md` Abschnitt 4 „Keine offenen Lücken (Stand nach DND-6)“, außerdem Kopfzeile, GlobalStyle, 1.3, Baustein Slider; `ground-mapping.md`, `docs/screens.md`, `frontend/CLAUDE.md` nachgezogen; `known-issues.md` ohne betroffenen Punkt. |

**Blockierende Befunde**
- keine

**Hinweise**
- Fokus-Schein am Slider-Griff bei Tastaturfokus (`.Mui-focusVisible`), von `&:focus, &:hover, &:active` (`ScreenControlBar.tsx:88-92`) nicht erfasst – vorbestehend, im Mockup kein Halo.
- `frontend/design/admin-mapping.md:88`: „derzeit nur `AdminScreen`“ zum GlobalStyle veraltet (seit DND-5), außerhalb des Scopes.
- Optionale Prop `label` der Steuerleiste nicht als Variante im DESIGN.md-Baustein „Steuerleiste“ beschrieben (nur in `ground-mapping.md`).
- `defaultValue={100}` neben `value` (`ScreenControlBar.tsx:152`) wirkungslos, Entfernen wäre eigene Aufräumarbeit.
- `ground-mapping.md:16-17`: fehlende Leerzeile vor „Grundlage: …“, Satz hängt im Rendering am letzten Listenpunkt.
- `Overlay` (`ScreenControlBar.tsx:37-46`) und `Screen` (`GroundScreen.tsx:12-20`) noch mit `top/left/right/bottom: 0` statt `inset: 0` – berechnet identisch, laut Plan unverändert.
- Konventionen: Commit-Typen passen (style ×4, refactor, docs ×2), keine KI-Signaturen, Branch `development`, Scope eingehalten.
