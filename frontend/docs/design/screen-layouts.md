# Layout-Konstanten und Screen-Layouts

Teil des [Style Guide](../../DESIGN.md), Abschnitte [1.3](../../DESIGN.md#13-layout-konstanten) und
[1.6](../../DESIGN.md#16-screen-layouts). Hier stehen die festen Maße einzelner Layouts und der Aufbau jedes Screens.

## Layout-Konstanten

Regel: [1.3](../../DESIGN.md#13-layout-konstanten).

| Wert | Wofür | Ort |
|---|---|---|
| 64px | Navigationsleiste im Admin (`NAV_RAIL_WIDTH`: Icon-Button `size.control.md` plus `space.3` auf beiden Seiten) | `AdminScreen` |
| 240px | Panel neben der Navigationsleiste im Admin (`LEFT_COLUMN_WIDTH`) | `AdminScreen` |
| 4 · 144px | Spalten und Zeilenhöhe des Dashboards (`DASHBOARD_COLUMNS`, `DASHBOARD_ROW_HEIGHT`; zwei Zeilen fassen Vorschaubilder, Name und Beschreibung der aktiven Szene) | `Dashboard` |
| 240px | Außenspalten der Top-Bar (`OUTER_COLUMN_WIDTH`) | `TopBar` |
| 320px | maximale Höhe der Abenteuer-Liste (`ADVENTURE_LIST_MAX_HEIGHT`) | `AdventureSelect` |
| 880px · 68ch | maximale Breite einer Notizseite, maximale Zeilenlänge (`PAGE_MAX_WIDTH`, `LINE_MAX_WIDTH`) | `DocumentReader` |
| 1440px | maximale Breite des Wall-Panels (`OVERLAY_PANEL_MAX_WIDTH`), siehe [Breite des Overlay-Panels](#breite-des-overlay-panels) | `WallScreen` |
| 104px | Platz für die Steuerleiste (24 + 56 + 24, `CONTROL_BAR_CLEARANCE`) | `ScreenControlBar` |
| 600px | Breite des Dialogs (`DIALOG_WIDTH`) | `Dialogue` |
| 360px · 240px · 4 Module | Breite des Dialogs „Spieler verbinden“, Kantenlänge und Ruhezone des QR-Codes (`JOIN_DIALOG_WIDTH`, `QR_CODE_SIZE`, `QR_CODE_MARGIN`) | `JoinDialog` |
| 200px · 16px · 3ch | Breite des Sliders, Größe des Griffs, Mindestbreite der Wertanzeige (`SLIDER_WIDTH`, `SLIDER_THUMB_SIZE`, `SLIDER_VALUE_MIN_WIDTH`) | `ScreenControlBar` |
| 120px · 16px | Breite und Griffgröße des Lautstärke-Sliders im Panel „Musik“ (`VOLUME_SLIDER_WIDTH`, `VOLUME_SLIDER_THUMB_SIZE`) | `MusicControl` |
| 2 Zeilen | Beschreibung im Panel „Aktive Szene“, Rest gekürzt (`DESCRIPTION_MAX_LINES`) | `ActiveScenePanel` |
| 8px | Status-Punkt im Panel „Screens“ (`STATUS_DOT_SIZE`) | `ScreensPanel` |
| 64px | Höhe der Ressourcen-Buttons (`RESOURCE_HEIGHT`) | `ResourceBarPlayer` |
| 8px · 24px | Breite und Höhe eines Zauber- oder Spezialplatzes (`SLOT_WIDTH`, `SLOT_HEIGHT`) | `ResourceBarPlayer` |
| 96px | Icon im Overlay „Handy drehen“ (`ROTATE_ICON_SIZE`) | `PlayerScreen` |
| `(orientation: portrait)` | Bedingung für das Overlay „Handy drehen“ (`PORTRAIT_QUERY`), keine Breite | `PlayerScreen` |

## Breite des Overlay-Panels

Das Panel auf der Wall nimmt den kleinsten von drei Werten (`OverlayPanel` in `WallScreen`):

- `OVERLAY_PANEL_MAX_WIDTH` als Obergrenze,
- `100vw − 2 × space.8` (Rand links und rechts),
- die verfügbare Höhe als Breite für ein einzelnes 16:9-Bild (die Weltkarte): `H × 16 / 9 + 2 × space.6` mit
  `H = 100vh − space.7 − CONTROL_BAR_CLEARANCE − 2 × space.6 − text.xl-Zeilenhöhe − space.5`.
  `H` ist die Höhe, die nach Abstand oben, Steuerleiste, Innenabstand und Kopfzeile für das Bild bleibt; so passt die
  Weltkarte vollständig über die Steuerleiste.

## Screen-Layouts

| Screen | Aufbau |
|---|---|
| Admin | Grid in Zeilen Top-Bar / `1fr` (Höhe der Top-Bar nach [1.2](../../DESIGN.md#12-tokens)), keine Bottom-Bar. Bei einem Lade- oder Speicherfehler kommt unter der Top-Bar eine Zeile `auto` für die [Hinweisleiste](components.md#hinweisleiste) hinzu, ohne Fehler gibt es diese Zeile nicht. Mittlere Zeile: Grid in Spalten `NAV_RAIL_WIDTH LEFT_COLUMN_WIDTH 1fr` ohne Innenabstand und `gap`: links die [Navigationsleiste](components.md#navigationsleiste), daneben ihr Panel, beide bündig zwischen Top-Bar und unterem Rand, mit Fläche `background` wie die Top-Bar und rechts je einer Linie `borderWidth.thin` in `secondary`; bei eingeklapptem Panel entfällt die Spalte `LEFT_COLUMN_WIDTH`, die Notizen werden breiter. Die Spalte `1fr` ist ein Grid `minmax(0, 2fr) minmax(0, 1fr)` mit Innenabstand `space.5` und `gap` `space.5`: Mitte Notizen, rechts das [Dashboard](components.md#dashboard-panel); bei ausgeblendetem Dashboard nur `minmax(0, 1fr)`, die Notizen nehmen die volle Breite. Dashboard: Grid `repeat(DASHBOARD_COLUMNS, minmax(0, 1fr))`, Zeilen `DASHBOARD_ROW_HEIGHT`, `gap` `space.4`, scrollt bei Überlänge für sich; Panels von oben: „Aktive Szene“ 4×2, „Musik“ 4×1, „Sounds“ 2×2 und „Screens“ 2×2 nebeneinander. |
| Wall | Vollbild-Hintergrund, darüber das Overlay-Panel (WORLD: Weltkarte) und die schwebende Steuerleiste (WORLD / OFF, AUDIO) |
| Ground | Vollbild-Medium (Bild oder Video), Raster-Ebene, schwebende Steuerleiste mit Raster-Optionen und Slider |
| Player | Smartphone im Querformat. Spalte, vertikal mittig, `gap` `space.4`: Settings-Button mit Theme-Menü (klappt über der Karte auf), darunter Karte mit zwei Zeilen à vier Ressourcen-Buttons (Aktion, Bonusaktion, Bewegung, Spezial / Zauberplätze I–IV), `gap` `space.4`. Im Hochformat deckt ein Overlay mit Hinweis alles ab. Ab 344px Höhe und etwa 568px Breite. |
