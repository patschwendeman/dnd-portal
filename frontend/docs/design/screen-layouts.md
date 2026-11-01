# Layout-Konstanten und Screen-Layouts

Teil des [Style Guide](../../DESIGN.md), Abschnitte [1.3](../../DESIGN.md#13-layout-konstanten) und
[1.6](../../DESIGN.md#16-screen-layouts). Hier stehen die festen Maße einzelner Layouts und der Aufbau jedes Screens.

## Layout-Konstanten

Regel: [1.3](../../DESIGN.md#13-layout-konstanten).

| Wert | Wofür | Ort |
|---|---|---|
| 64px | Navigationsleiste im Admin (`NAV_RAIL_WIDTH`: Icon-Button `size.control.md` plus `space.3` auf beiden Seiten) | `AdminScreen` |
| 240px | Panel neben der Navigationsleiste im Admin (`LEFT_COLUMN_WIDTH`) | `AdminScreen` |
| 400px · 560px | Mindest- und Höchstbreite des Dashboards (`DASHBOARD_MIN_WIDTH`: darunter werden die Zeilen im Panel „Spieltisch“ zu schmal für ihre Steuerung; `DASHBOARD_MAX_WIDTH`: darüber schöbe die Bühne auf großen Monitoren das Panel „Audio“ aus dem sichtbaren Bereich) | `AdminScreen` |
| 240px | Außenspalten der Top-Bar (`OUTER_COLUMN_WIDTH`) | `TopBar` |
| 320px | maximale Höhe der Abenteuer-Liste (`ADVENTURE_LIST_MAX_HEIGHT`) | `AdventureSelect` |
| 880px · 68ch | maximale Breite einer Notizseite, maximale Zeilenlänge (`PAGE_MAX_WIDTH`, `LINE_MAX_WIDTH`) | `DocumentReader` |
| 1440px | maximale Breite des Wall-Panels (`OVERLAY_PANEL_MAX_WIDTH`), siehe [Breite des Overlay-Panels](#breite-des-overlay-panels) | `WallScreen` |
| 600px | Breite des Dialogs (`DIALOG_WIDTH`) | `Dialogue` |
| 360px · 240px · 4 Module | Breite des Dialogs „Spieler verbinden“, Kantenlänge und Ruhezone des QR-Codes (`JOIN_DIALOG_WIDTH`, `QR_CODE_SIZE`, `QR_CODE_MARGIN`) | `JoinDialog` |
| 16px | Griffgröße der Slider in Dashboard-Panels (`PANEL_SLIDER_THUMB_SIZE`) | `PanelSlider` |
| 3ch | Mindestbreite der Wertanzeige neben einem Slider, Platz für drei Ziffern (`SLIDER_VALUE_MIN_WIDTH`) | `PanelSlider` |
| 8px | Status-Punkt im Panel „Spieltisch“ (`STATUS_DOT_SIZE`) | `GameTablePanel` |
| 92px | linke Spalte der Spieltisch-Zeile mit Name und Status (`TABLE_NAME_COLUMN_WIDTH`; ein langer Status bricht um) | `GameTablePanel` |
| 40px | Avatar der Spielerzeile (`PLAYER_AVATAR_SIZE`) | `PlayerListItem` |
| 2ch | Mindestbreite des Levels im Level-Stepper, Platz für zwei Ziffern (`LEVEL_MIN_WIDTH`) | `LevelStepper` |
| 64px | Höhe der Ressourcen-Buttons (`RESOURCE_HEIGHT`) | `ResourceBarPlayer` |
| 8px · 24px | Breite und Höhe eines Zauber- oder Spezialplatzes (`SLOT_WIDTH`, `SLOT_HEIGHT`) | `ResourceBarPlayer` |
| 96px | Icon im Overlay „Handy drehen“ (`ROTATE_ICON_SIZE`) | `PlayerScreen` |
| `(orientation: portrait)` | Bedingung für das Overlay „Handy drehen“ (`PORTRAIT_QUERY`), keine Breite | `PlayerScreen` |

## Breite des Overlay-Panels

Das Panel auf der Wall nimmt den kleinsten von drei Werten (`OverlayPanel` in `WallScreen`):

- `OVERLAY_PANEL_MAX_WIDTH` als Obergrenze,
- `100vw − 2 × space.8` (Rand links und rechts),
- die verfügbare Höhe als Breite für ein einzelnes 16:9-Bild (die Weltkarte): `H × 16 / 9 + 2 × space.6` mit
  `H = 100vh − 2 × space.7 − 2 × space.6 − text.xl-Zeilenhöhe − space.5`.
  `H` ist die Höhe, die nach Abstand oben und unten (je `space.7`), Innenabstand und Kopfzeile für das Bild bleibt; so
  ist die Weltkarte vollständig sichtbar.

## Screen-Layouts

| Screen | Aufbau |
|---|---|
| Admin | Grid in Zeilen Top-Bar / `1fr` (Höhe der Top-Bar nach [1.2](../../DESIGN.md#12-tokens)), keine Bottom-Bar. Bei einem Lade- oder Speicherfehler kommt unter der Top-Bar eine Zeile `auto` für die [Hinweisleiste](components.md#hinweisleiste) hinzu, ohne Fehler gibt es diese Zeile nicht. Mittlere Zeile: Grid in Spalten `NAV_RAIL_WIDTH LEFT_COLUMN_WIDTH 1fr` ohne Innenabstand und `gap`: links die [Navigationsleiste](components.md#navigationsleiste), daneben ihr Panel, beide bündig zwischen Top-Bar und unterem Rand, mit Fläche `background` wie die Top-Bar und rechts je einer Linie `borderWidth.thin` in `secondary`; bei eingeklapptem Panel entfällt die Spalte `LEFT_COLUMN_WIDTH`, die Notizen werden breiter. Die Spalte `1fr` ist ein Grid `minmax(0, 1fr) clamp(DASHBOARD_MIN_WIDTH, (100% − space.5) / 3, DASHBOARD_MAX_WIDTH)` mit Innenabstand `space.5` und `gap` `space.5`: Mitte Notizen (der Rest der Breite), rechts das [Dashboard](components.md#dashboard-panel) (ein Drittel, mindestens 400px, höchstens 560px; bei 1920px Fensterbreite mit offenem Panel etwa 515px); bei ausgeblendetem Dashboard nur `minmax(0, 1fr)`, die Notizen nehmen die volle Breite. Dashboard (Layout „Bühne“): eine Spalte (Grid `minmax(0, 1fr)`), `gap` `space.4`, jedes Panel so hoch wie sein Inhalt, die Panels scrollen nie für sich; das Dashboard scrollt bei Überlänge als Ganzes. Von oben: [Bühne](components.md#bühne), „Audio“, „Spieltisch“, „Party“ ([Dashboard-Panel](components.md#dashboard-panel)). |
| Wall | Vollbild-Hintergrund, darüber das Overlay-Panel (Wall-Overlay `world`: Weltkarte); keine Bedienelemente |
| Ground | Vollbild-Medium (Bild oder Video), darüber die Raster-Ebene (nur wenn das Ground-Raster nicht `off` ist); keine Bedienelemente |
| Player | Smartphone im Querformat. Spalte, vertikal mittig, `gap` `space.4`: Settings-Button mit Theme-Menü (klappt über der Karte auf), darunter Karte mit zwei Zeilen à vier Ressourcen-Buttons (Aktion, Bonusaktion, Bewegung, Spezial / Zauberplätze I–IV), `gap` `space.4`. Im Hochformat deckt ein Overlay mit Hinweis alles ab. Ab 344px Höhe und etwa 568px Breite. |
