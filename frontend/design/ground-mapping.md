# Ground Screen: Mapping der Styled Components auf das neue Layout

Stand: 2026-10-06 (Branch `development`). Vorschlag, noch keine Änderungen am Code.
Grundlage: Mockup [mockups/v2/ground.png](mockups/v2/ground.png) (Quelle [mockups/v2/build.py](mockups/v2/build.py)) und der
aktuelle Code der Komponenten, die der Ground Screen rendert.

Allgemeine Regeln, Tokens und Farbrollen: [DESIGN.md](../DESIGN.md).

Erfasst sind nur Werte ohne Farbe. Tokens, Legende und die übergreifenden Punkte stehen in
[admin-mapping.md](admin-mapping.md) und gelten hier genauso. Dieses Mapping setzt voraus, dass Admin- und Wall-Umbau
umgesetzt sind.

**Was der Wall-Umbau am Ground schon ändert:** `ScreenControlBar` ist geteilt. Schwebende Leiste, Button-Gruppe und
Buttons (BLACK / WHITE / OFF) sind in [wall-mapping.md](wall-mapping.md) erfasst und gelten hier unverändert. Unten
stehen nur die Teile, die es nur auf dem Ground gibt: Bildanzeige, Raster, Slider und die zusätzlichen Beschriftungen.
Dazu gehört auch die Textfarbe `onPrimary` am aktiven Button (BLACK / WHITE / OFF), siehe `Button` in wall-mapping.md.

## Entscheidungen (2026-10-04)

| # | Frage | Entscheidung |
|---|---|---|
| 1 | Punkte auf dem Slider | Entfernen. Der Slider rastet weiter in 10er-Schritten ein. |
| 2 | Wertanzeige | Feste Zahl neben dem Slider, der Tooltip beim Ziehen entfällt |
| 3 | Beschriftungen „Raster“ und „Zelle“ | Übernehmen |
| 4 | Angezeigter Wert | Slider-Wert (100–200) ohne Einheit. Die Rasterlogik mit `devicePixelRatio` bleibt unverändert. |

## Konsistenz-Abgleich (2026-10-04)

Entscheidungen aus dem Abgleich aller drei Mappings (Admin, Wall, Ground). Sie gelten für alle Screens.

| # | Thema | Entscheidung |
|---|---|---|
| K1 | Icons in 40px-Buttons | Alle Icons 20px (`size.icon`). Ersetzt Admin-Entscheidung 1 (24px). `size.icon.sm` und `size.icon.lg` entfallen. |
| K2 | Text-Buttons | Ein Stil: 40px hoch, min. 112px breit (`size.button.minWidth`), Innenabstand `0 space.4` (0 16px), `text.sm`, Gewicht 600, `radius.md`. Laufweite `letterSpacing.label` nur bei Text in Großbuchstaben. |
| K3 | Verschachtelte Radien | Neues Token `radius.xl` = 16px für die schwebende Steuerleiste. Regel: äußerer Radius = innerer Radius + Innenabstand (8px + 8px). |
| K4 | Zeilenhöhen | Feste Paare aus Schriftgröße und Zeilenhöhe auf dem 4px-Raster: `text.xs` 12/16 · `text.sm` 14/20 · `text.md` 16/24 · `text.lg` 20/28 · `text.xl` 24/32 · `text.2xl` 32/40. Ausnahme: Fließtext in den Notizen `text.reading` 16/26. |

---

## GroundScreen.tsx

### `Screen`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `<GlobalStyle />` | – (bisher nur in `AdminScreen`) | im Screen rendern | **neu**, **Struktur**, eigener Schritt: Erst damit gelten `box-sizing: border-box`, `margin: 0` und die Body-Schrift (`font.family.base`, `text.md`) auch hier ([DESIGN.md](../DESIGN.md) 1.1 und Architektur). Wie im Admin wird er nicht in `App.tsx` eingebunden. |
| `font-family` | System-Stack | entfällt | kommt aus dem `GlobalStyle` (`font.family.base`) |
| `font-size`, `line-height` | nicht gesetzt (Browser 16px, `normal`) | `text.md` (16/24px) | **neu**, K4, kommt aus dem `GlobalStyle` |
| übrige Regeln | | unverändert | |

Hinweis: Die Regel `background-color` endet heute mit zwei Semikolons (`;;`). Harmlos, beim Umbau mit entfernen.

### `BackgroundMedia` (Bild oder Video)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `inset` (`top/left/right/bottom`) | nicht gesetzt | `0` | **neu**. Gleicher Fehler wie bei der Wall: `position: fixed` ohne Offsets landet nur zufällig richtig. |
| `width`, `height` | `100%` | unverändert | |
| `object-fit` | `cover` | unverändert | Anders als auf der Wall hier schon gesetzt |
| `z-index` | `1` | `layer.media` (1) | Wert gleich, aber über das Token ([DESIGN.md](../DESIGN.md) 1.2, O4) |

---

## GridOverlay.tsx

### `Overlay`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `top`, `left`, `width`, `height` | `0`, `0`, `100%`, `100%` | `inset: 0` | [DESIGN.md](../DESIGN.md) 1.1: `position: fixed` immer mit `inset` |
| `z-index` | `99` | `layer.grid` (10) | O4. Über dem Bild (`layer.media`), unter der Steuerleiste (`layer.controls`). |
| übrige Regeln | | unverändert | Vollbild-Ebene über dem Bild |
| `pointer-events` | nicht gesetzt | `none` | **neu**, optional. Die Ebene fängt heute Mausereignisse ab. Das stört nicht, weil die Steuerleiste darüber liegt. |

### `GridLine`

Die Werte kommen als Props aus der Komponente, nicht als feste CSS-Werte.

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| Linienstärke (`$width` bzw. `$height` = `2`) | `2` (px, im JSX) | `borderWidth.thick` (2px) | Wert bleibt, kommt aber aus dem Theme statt als Zahl im JSX |
| Position der Linie | Linie beginnt bei `i` (z. B. 0–2px, 140–142px) | Linie mittig auf `i` (`i − 1`) | Im Mockup liegt die Linie mittig auf der Zellgrenze. **Optional**, Unterschied 1px. |
| Zellgröße | `gridOption × devicePixelRatio` | unverändert | Die Zellgröße hängt vom Monitor ab: Bei `devicePixelRatio` 2 ist eine Zelle mit Slider-Wert 140 tatsächlich 280 CSS-Pixel groß. Deshalb zeigt die Wertanzeige den Slider-Wert ohne „px“ (Entscheidung 4). |

Hinweis: Die Gitterfarben (`black`, `white`, `transparent`) sind nicht Teil dieses Mappings.

---

## ScreenControlBar.tsx (nur Ground-Teile)

### `ControlBar`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `gap` | `space.5` (24px, **Wall**) | unverändert | Auf dem Ground wirkt er erst richtig: 24px zwischen Beschriftung, Button-Gruppe und Slider |
| `border-radius` | `radius.xl` (16px, **Wall**, K3) | unverändert | |

### Beschriftung „Raster“ (neu)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| Element | – | Text vor der Button-Gruppe | **neu**, **Struktur** (Entscheidung 3): neue Prop für `ScreenControlBar`, z. B. `label`. Die Wall übergibt keine. Baustein `Label` aus `src/components/Label.tsx` wiederverwenden, er bringt die Schriftwerte unten mit. |
| `font-size`, `line-height` | – | `text.xs` (12/16px) | gleicher Label-Stil wie im Admin, K4 |
| `font-weight` | – | `fontWeight.semibold` (600) | |
| `letter-spacing` | – | `letterSpacing.label` (.08em) | |
| `text-transform` | – | `uppercase` | |
| `padding-left` | – | `space.3` (12px) | Zusammen mit dem Innenabstand der Leiste (8px) steht der Text 20px vom Rand |

### `Box` (MUI-Wrapper um den Slider)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` (`sx`) | `200` (px) | `200px` | unverändert, **kein Token** (Layout-Maß) |
| `margin` (`sx`) | `1` (MUI-Spacing = 8px) | `0` | Abstand kommt aus dem `gap` der Gruppe. Heute steht der Slider mit 8px Margin plus 10px Button-Margin neben den Buttons. |

### Slider-Gruppe (neu)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| Wrapper | – (`Box` direkt in `ControlBar`) | `display: flex`, `align-items: center`, `gap: space.3` (12px) | **neu**, **Struktur**: hält Beschriftung, Slider und Wert zusammen |
| `padding-right` | – | `space.3` (12px) | **neu**, Gegenstück zum `padding-left` der Beschriftung „Raster“ |
| Beschriftung „Zelle“ | – | Label-Stil wie „Raster“ (`text.xs`, `600`, `letterSpacing.label`, Großbuchstaben) | **neu**, **Struktur** (Entscheidung 3), Baustein `Label` |
| Wertanzeige („140“) | – | `text.sm` (14/20px), `fontWeight.semibold` (600), `font-variant-numeric: tabular-nums`, `text-align: right`, `min-width: 3ch` | **neu**, **Struktur** (Entscheidungen 2 und 4): zeigt `sliderValue` ohne Einheit. `3ch` reserviert Platz für drei Ziffern, damit nichts springt. **kein Token**, die Einheit `ch` richtet sich nach der Schrift. |

### `StyledSlider`

MUI-Standardwerte (`@mui/material` 6) stehen in der Spalte „Alter Wert“, wo das Projekt sie nicht überschreibt.

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| Root `height` | MUI `4px` | unverändert | |
| Root `padding` | MUI `13px 0` | unverändert | Klickfläche über und unter der Schiene. 13px ist **kein Token**, ist aber MUI-intern. |
| `.MuiSlider-rail` `height` | `10px` | `4px` | Schlanke Schiene wie im Mockup. 4px nutzt den Wert von `space.1`, ist aber eine Größe: **kein passendes Token**. Vorschlag: einfach die Überschreibung entfernen, dann gilt MUI-Standard 4px. |
| `.MuiSlider-rail` `border-radius` | MUI `12px` (bei 10px Höhe fast Pille) | `radius.pill` (999px) | Bei 4px Höhe optisch gleich, aber eindeutig |
| `.MuiSlider-track` `height` | `10px` | `4px` | wie die Schiene |
| `.MuiSlider-track` `border` | `none` | unverändert | |
| `.MuiSlider-thumb` `width`, `height` | MUI `20px` | `16px` | **kein Token** (`size.icon.sm` entfällt mit K1) |
| `.MuiSlider-thumb` `box-shadow` bei Fokus/Hover | `none` | unverändert | |
| `.MuiSlider-mark` (alle Regeln) | `5px`, `5px`, `50%` | entfällt | Entscheidung 1. **Struktur**: Prop `marks` an `StyledSlider` entfernen. `step={10}` bleibt, der Slider rastet weiter ein. |
| `.MuiSlider-markLabel` `font-size` | `0.75rem` (12px) | entfällt | **wirkungslos** heute: `marks` ist `true` ohne Beschriftungen, es gibt keine Mark-Labels. |
| `.MuiSlider-valueLabel` (alle Regeln) | `0.8rem`, `4px 8px`, `6px` | entfällt | Entscheidung 2. **Struktur**: `valueLabelDisplay="auto"` → `"off"` (oder Prop entfernen, MUI-Standard ist `off`). |

---

## Zusammenfassung

**Werte ohne Token**

| Wert | Wo | Vorschlag |
|---|---|---|
| 200px | Breite des Sliders | Layout-Maß, bleibt |
| 3ch | Mindestbreite der Wertanzeige | relativ zur Schrift, bleibt als Wert |
| 16px als Größe | Griff des Sliders | Wert direkt setzen oder Token `size.handle` |
| 4px als Größe | Höhe von Schiene und Füllung | MUI-Standard, Überschreibung entfernen |
| 13px | Padding des Slider-Root | MUI-intern, nicht anfassen |

**Fehler im Bestand, die beim Umbau mit behoben werden**

- `BackgroundMedia` hat `position: fixed` ohne Offsets.
- `.MuiSlider-markLabel` ist gestylt, wird aber nie angezeigt (entfällt mit Entscheidung 1).
- Doppeltes Semikolon in `Screen`.

**Entscheidungen:** alle getroffen, siehe [Entscheidungen](#entscheidungen-2026-10-04).
