# Layout-Konstanten und Screen-Layouts

Teil des [Style Guide](../../DESIGN.md), Abschnitte [1.3](../../DESIGN.md#13-layout-konstanten) und
[1.6](../../DESIGN.md#16-screen-layouts). Hier stehen die festen Maße einzelner Layouts und der Aufbau jedes Screens.

## Layout-Konstanten

Regel: [1.3](../../DESIGN.md#13-layout-konstanten).

| Wert | Wofür | Ort |
|---|---|---|
| 200px · 400px | linke und rechte Spalte im Admin (`LEFT_COLUMN_WIDTH`, `RIGHT_COLUMN_WIDTH`) | `AdminScreen` |
| 240px | Außenspalten der Top-Bar (`OUTER_COLUMN_WIDTH`) | `TopBar` |
| 880px · 68ch | maximale Breite einer Notizseite, maximale Zeilenlänge (`PAGE_MAX_WIDTH`, `LINE_MAX_WIDTH`) | `DocumentReader` |
| 96px | Label-Spalte der Szenen-Details (`LABEL_COLUMN_WIDTH`), Kachelbreite der Nicht-Kampfszenen (`TILE_WIDTH`) | `DetailsSideBar`, `SideMaps` |
| 1440px | maximale Breite des Wall-Panels (`OVERLAY_PANEL_MAX_WIDTH`), siehe [Breite des Overlay-Panels](#breite-des-overlay-panels) | `WallScreen` |
| 104px | Platz für die Steuerleiste (24 + 56 + 24, `CONTROL_BAR_CLEARANCE`) | `ScreenControlBar` |
| 600px | Breite des Dialogs (`DIALOG_WIDTH`) | `Dialogue` |
| 200px · 16px · 3ch | Breite des Sliders, Größe des Griffs, Mindestbreite der Wertanzeige (`SLIDER_WIDTH`, `SLIDER_THUMB_SIZE`, `SLIDER_VALUE_MIN_WIDTH`) | `ScreenControlBar` |
| 64px | Höhe der Ressourcen-Buttons (`RESOURCE_HEIGHT`) | `ResourceBarPlayer` |
| 8px · 24px | Breite und Höhe eines Zauber- oder Spezialplatzes (`SLOT_WIDTH`, `SLOT_HEIGHT`) | `ResourceBarPlayer` |
| 96px | Icon im Overlay „Handy drehen“ (`ROTATE_ICON_SIZE`) | `PlayerScreen` |
| `(orientation: portrait)` | Bedingung für das Overlay „Handy drehen“ (`PORTRAIT_QUERY`), keine Breite | `PlayerScreen` |

## Breite des Overlay-Panels

Das Panel auf der Wall nimmt den kleinsten von drei Werten (`OverlayPanel` in `WallScreen`):

- `OVERLAY_PANEL_MAX_WIDTH` als Obergrenze,
- `100vw − 2 × space.8` (Rand links und rechts),
- die verfügbare Höhe als Breite, abgeleitet aus Spalten `c` und Zeilen `r` des Kampfszenen-Rasters
  (`getGridLayout`, `c = ⌈√n⌉`, `r = ⌈n / c⌉`) und dem Abstand `g = space.3`:
  `(H − (r − 1) × g) × 16 / 9 × c / r + (c − 1) × g + 2 × space.6` mit
  `H = 100vh − space.7 − CONTROL_BAR_CLEARANCE − 2 × space.6 − text.xl-Zeilenhöhe − space.5`.
  `H` ist die Höhe, die nach Abstand oben, Steuerleiste, Innenabstand und Kopfzeile für das Raster bleibt; so haben
  alle Zeilen mit Kacheln in 16:9 über der Steuerleiste Platz. Ohne Kampfszenen (`r = 0`) entfällt dieser Wert.

Bei 25 Kacheln (5 × 5) ergibt das `(H − 4 × space.3) × 16 / 9 + 4 × space.3 + 2 × space.6`. Die Weltkarte nutzt
dieselbe Breite; bei quadratischem Raster (`c = r`, z. B. 16, 24, 25) ist sie (16:9 ohne Abstände) nicht höher als
das Raster und passt. Bei `r < c` (z. B. 26–30 Kacheln) ist das Panel breiter als die Höhe erlaubt, die Weltkarte
kann dann über die Steuerleiste reichen.

## Screen-Layouts

| Screen | Aufbau |
|---|---|
| Admin | Grid in Zeilen Top-Bar / `1fr` / Bottom-Bar (Höhen nach [1.2](../../DESIGN.md#12-tokens)). Mittlere Zeile: Grid in Spalten `LEFT_COLUMN_WIDTH 1fr RIGHT_COLUMN_WIDTH`, Innenabstand `space.5`, `gap` nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“. Links Navigation, Mitte Notizen, rechts Karten. |
| Wall | Vollbild-Hintergrund, darüber das Overlay-Panel (BATTLE: Kachelraster, WORLD: Weltkarte) und die schwebende Steuerleiste |
| Ground | Vollbild-Medium (Bild oder Video), Raster-Ebene, schwebende Steuerleiste mit Raster-Optionen und Slider |
| Player | Smartphone im Querformat. Spalte, vertikal mittig, `gap` `space.4`: Theme-Button, darunter Karte mit zwei Zeilen à vier Ressourcen-Buttons (Aktion, Bonusaktion, Bewegung, Spezial / Zauberplätze I–IV), `gap` `space.4`. Im Hochformat deckt ein Overlay mit Hinweis alles ab. Ab 344px Höhe und etwa 568px Breite. |
