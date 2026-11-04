# Layout-Konstanten und Screen-Layouts

Teil des [Style Guide](../../DESIGN.md), Abschnitte [1.3](../../DESIGN.md#13-layout-konstanten) und
[1.6](../../DESIGN.md#16-screen-layouts). Hier stehen die festen Maße einzelner Layouts und der Aufbau jedes Screens.

## Layout-Konstanten

Regel: [1.3](../../DESIGN.md#13-layout-konstanten).

| Wert | Wofür | Ort |
|---|---|---|
| 64px | Navigationsleiste im Admin (`NAV_RAIL_WIDTH`: Icon-Button `size.control.md` plus `space.3` auf beiden Seiten) | `AdminScreen` |
| 240px | Panel neben der Navigationsleiste im Admin (`LEFT_COLUMN_WIDTH`; auch „Einstellungen“) | `AdminScreen` |
| 280px | Panel „Kampf“ (`FIGHT_PANEL_WIDTH`: Namen und Steuerung je Teilnehmer passen nebeneinander) | `AdminScreen` |
| 8px · 5px | Punkt am Menüpunkt „Kampf“ bei laufendem Kampf, Größe und Abstand zur Ecke (`BADGE_SIZE`, `BADGE_INSET`) | `NavRail` |
| 400px · 560px | Mindest- und Höchstbreite des Dashboards (`DASHBOARD_MIN_WIDTH`: darunter werden die Zeilen im Panel „Spieltisch“ zu schmal für ihre Steuerung; `DASHBOARD_MAX_WIDTH`: darüber schöbe die Bühne auf großen Monitoren das Panel „Audio“ aus dem sichtbaren Bereich) | `AdminScreen` |
| 12px | Unschärfe hinter durchscheinenden Kacheln im Admin (`TILE_BLUR`, `backdrop-filter: blur`) | `GlobalStyle` (`tileSurface`) |
| 320px | maximale Höhe der Liste einer Auswahlliste (`SELECT_LIST_MAX_HEIGHT`) | `SelectList` |
| 68ch | maximale Zeilenlänge in den Notizen, zentriert auf der Notizseite (`LINE_MAX_WIDTH`) | `DocumentReader` |
| 1440px | maximale Breite des Wall-Panels (`OVERLAY_PANEL_MAX_WIDTH`), siehe [Breite des Overlay-Panels](#breite-des-overlay-panels) | `WallScreen` |
| 600px | Breite des Dialogs (`DIALOG_WIDTH`) | `Dialogue` |
| 360px · 240px · 4 Module | Breite des Dialogs „Spieler verbinden“, Kantenlänge und Ruhezone des QR-Codes (`JOIN_DIALOG_WIDTH`, `QR_CODE_SIZE`, `QR_CODE_MARGIN`) | `JoinDialog` |
| 16px | Griffgröße der Slider in Dashboard-Panels (`PANEL_SLIDER_THUMB_SIZE`) | `PanelSlider` |
| 3ch | Mindestbreite der Wertanzeige neben einem Slider, Platz für drei Ziffern (`SLIDER_VALUE_MIN_WIDTH`) | `PanelSlider` |
| 8px | Status-Punkt im Panel „Spieltisch“ (`STATUS_DOT_SIZE`) | `GameTablePanel` |
| 92px | linke Spalte der Spieltisch-Zeile mit Name und Status (`TABLE_NAME_COLUMN_WIDTH`; ein langer Status bricht um) | `GameTablePanel` |
| 32px · 40px | kleiner Avatar (Panel „Kampf“, „Als Nächstes“) und Avatar der Spielerzeile und der Initiative (`AVATAR_SIZE`) | `CombatantAvatar` |
| 32px · 64px | Avatar-Spalte der Zeilen und Breite des Nummernfelds im Panel „Kampf“ (`AVATAR_COLUMN`, `NUMBER_FIELD_WIDTH`) | `FightPanel` |
| 24px · 18px · 16px | Mini-Buttons im Panel „Kampf“: Breite und Höhe, Höhe der zwei übereinander stehenden ↑/↓, Icon (`MINI_BUTTON_SIZE`, `MOVE_BUTTON_HEIGHT`, `MINI_ICON_SIZE`) | `MiniButton` |
| 440px | maximale Breite des Bestätigungsdialogs „Kampf beenden?“ (`CONFIRM_DIALOG_MAX_WIDTH`) | `ConfirmDialog` |
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
| Admin | Grid aus [Kacheln](components.md#kachel) über dem [Abenteuer-Hintergrund](components.md#abenteuer-hintergrund) (Hintergrundbild des aktiven Abenteuers zum Theme unter `backdrop`, ohne Bild `background`; das Grid selbst hat keine Fläche), keine Bottom-Bar und keine Trennlinien. Spalten `NAV_RAIL_WIDTH`, `LEFT_COLUMN_WIDTH` bzw. beim Panel „Kampf“ `FIGHT_PANEL_WIDTH` (nur bei offenem Panel), `minmax(0, 1fr)` (Notizen) und `clamp(DASHBOARD_MIN_WIDTH, (B − space.5) / 3, DASHBOARD_MAX_WIDTH)` mit B = Breite von Notizen, Dashboard und dem `gap` dazwischen (nur bei offenem Dashboard; ein Drittel von Notizen und Dashboard, mindestens 400px, höchstens 560px; bei 1920px Fensterbreite mit offenem Panel etwa 499px); Zeilen `auto` (Kopfzeile) und `minmax(0, 1fr)`; `gap` `space.5`, Innenabstand seitlich `space.5` (`grid-template-areas`). Die [Navigationsleiste](components.md#navigationsleiste) und ihr Panel reichen über beide Zeilen und halten oben und unten `space.5` Abstand zum Bildschirmrand; bei eingeklapptem Panel entfällt seine Spalte, die Notizen rücken an die Leiste. Die [Kopfzeile](components.md#kopfzeile) liegt in Zeile 1 über Notizen und Dashboard (bei ausgeblendetem Dashboard über den Notizen allein, bis an den rechten Rand), `space.5` unter dem oberen Rand, und scrollt nie. Notizen und Dashboard liegen in Zeile 2 und scrollen jeweils für sich; der Abstand `space.5` zur Kopfzeile ist das `gap` des Grids und bleibt auch beim Scrollen frei, der Inhalt wird an der Oberkante hart abgeschnitten (nicht ausgeblendet). Unten laufen beide bis an den Bildschirmrand; der Abstand `space.5` unter der letzten Kachel liegt im Scrollbereich, sodass sie ganz nach unten gescrollt auf Höhe von Navigationsleiste und Panel endet. Notizen: je Notizseite eine Kachel über die volle Breite der Spalte, `gap` `space.5`. Dashboard (Layout „Bühne“): eine Spalte (Grid `minmax(0, 1fr)`), `gap` `space.4`, jedes Panel so hoch wie sein Inhalt, die Panels scrollen nie für sich; das Dashboard scrollt bei Überlänge als Ganzes. Von oben: [Bühne](components.md#bühne), „Audio“, „Spieltisch“, „Party“ ([Dashboard-Panel](components.md#dashboard-panel)); während eines Kampfes „Am Zug“ ([Hero-Karte](components.md#hero-karte)), „Initiative“ ([Initiative-Zeile](components.md#initiative-zeile)), „Audio“, „Spieltisch“ – Bühne und Party sind dann nicht zu sehen. |
| Wall | Vollbild-Hintergrund, darüber das Overlay-Panel (Wall-Overlay `world`: Weltkarte); keine Bedienelemente außer dem [Vollbild-Overlay](components.md#vollbild-overlay), das bei Maus über dem Fenster über allem liegt |
| Ground | Vollbild-Medium (Bild oder Video), darüber die Raster-Ebene (nur wenn das Ground-Raster nicht `off` ist); keine Bedienelemente außer dem [Vollbild-Overlay](components.md#vollbild-overlay), das bei Maus über dem Fenster über allem liegt |
| Player | Smartphone im Querformat. Spalte, vertikal mittig, `gap` `space.4`: Settings-Button mit Theme-Menü (klappt über der Karte auf), darunter Karte mit zwei Zeilen à vier Ressourcen-Buttons (Aktion, Bonusaktion, Bewegung, Spezial / Zauberplätze I–IV), `gap` `space.4`. Im Hochformat deckt ein Overlay mit Hinweis alles ab. Ab 344px Höhe und etwa 568px Breite. |
