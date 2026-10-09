# Bausteine

Teil des [Style Guide](../../DESIGN.md), Abschnitt [1.5](../../DESIGN.md#15-bausteine). Hier steht, wie die wiederkehrenden
Elemente aufgebaut sind. Allgemeine Regeln stehen nur im Style Guide und werden hier nicht wiederholt:

- Größen der Tokens `size.*`: [1.2](../../DESIGN.md#12-tokens)
- Schrift (Stufe und Gewicht) nach der Schrift-Hierarchie, Abstände zwischen Elementen nach „Abstände nach Beziehung“,
  Innenabstände von Flächen, Radien, Rahmen, Icons, Bilder, Laufweite und `tabular-nums`: [1.4](../../DESIGN.md#14-regeln)
- Farben (Flächen, Text, Icons, Linien): [2.2](../../DESIGN.md#22-rollen), Aktiv- und Inaktiv-Farben:
  [2.4](../../DESIGN.md#24-zustände)

Die Werte der Layout-Konstanten stehen in [screen-layouts.md](screen-layouts.md).

## Icon-Button

Größe nach [1.2](../../DESIGN.md#12-tokens) Größen, Icon nach [1.4](../../DESIGN.md#14-regeln) Icons.

| Eigenschaft | Wert |
|---|---|
| Zentrierung des Icons | `display: grid; place-items: center` |
| Padding | `0` (Reset bei `<button>`) |
| Farbe | Hintergrund in der Top-Bar und der Hinweisleiste transparent, sonst nach [2.2](../../DESIGN.md#22-rollen) und [2.4](../../DESIGN.md#24-zustände) |
| Beispiele | Sound-Buttons, Settings, Play/Pause, Nach oben |
| Player | Hintergrund `secondary` (Theme-Button) |

## Text-Button

Gemeinsame Styled Component `TextButton` ([src/components/TextButton.tsx](../../src/components/TextButton.tsx),
`<button>` mit `$variant: 'default' | 'active' | 'cancel'`). Laufweite gehört nicht zum Baustein; bei
Großbuchstaben ergänzt sie die verwendende Komponente (z. B. `ScreenControlBar`), siehe [1.4](../../DESIGN.md#14-regeln).

| Eigenschaft | Wert |
|---|---|
| Höhe, Breite | nach [1.2](../../DESIGN.md#12-tokens) Größen |
| Innenabstand | `0 space.4` |
| Beispiele | BATTLE/WORLD/OFF, BLACK/WHITE/OFF, Confirm/Decline |

## Button-Gruppe

`display: flex`, Abstand nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“. Mehrere Text-Buttons, von denen
einer aktiv ist.

## Navigationseintrag

| Eigenschaft | Wert |
|---|---|
| Höhe | nach [1.2](../../DESIGN.md#12-tokens) Größen |
| Innenabstand | `0 space.3`, linksbündig |

## Label

Gemeinsame Styled Component `Label` ([src/components/Label.tsx](../../src/components/Label.tsx)). Schrift, Großbuchstaben
und Laufweite nach [1.4](../../DESIGN.md#14-regeln).

| Eigenschaft | Wert |
|---|---|
| Abstand | nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“. Zum zugehörigen Wert in einem zweizeiligen Block `0` („Musik“ → Titel). |
| Ausrichtung neben Werten | `align-items: baseline` |
| Beispiele | Notizen, Aktive Szene, Kampfszenen, Enemies, Loot, Musik, Szenen, Szene wechseln, Raster, Zelle, Aktion, Bonusaktion, Bewegung, Spezial, Zauberplätze |

## Karte

| Eigenschaft | Wert |
|---|---|
| Aufbau | optional Label, optional Titel, Inhalt. Zeilen getrennt durch Trennlinien ([1.4](../../DESIGN.md#14-regeln) Rahmen). „Kampfszenen“ hat keinen Titel, nur Label mit Anzahl. |
| Beispiele | Aktive Szene, Kampfszenen, Ressourcen (Player) |

## Ressourcen-Button

Nur im Player.

| Eigenschaft | Wert |
|---|---|
| Größe | Höhe `RESOURCE_HEIGHT`, Breite der Spalte |
| Raster | 4 gleich breite Spalten (`repeat(4, minmax(0, 1fr))`), `gap` `space.3`, Label darüber nach [1.4](../../DESIGN.md#14-regeln) |
| Inhalt | Icon und Zahl, zentriert, `gap` `space.3`. Zauberplätze: Ziffer links, Plätze rechts (`space-between`) |
| Rahmen | `borderWidth.thick` |
| Farbe | Zahl in `text.color`, keine eigene Rolle. Sonst nach [2.2](../../DESIGN.md#22-rollen) |
| Plätze | `SLOT_WIDTH` × `SLOT_HEIGHT`, `gap` `space.1` |
| Element | `<button type="button">` mit Reset (`padding`, `font: inherit`, `color` wie unter Farbe), per Tastatur bedienbar. Bewegung ist nicht antippbar: `<div>` (`as="div"`), `cursor: default` |
| Beispiele | Aktion, Bonusaktion, Bewegung (nicht antippbar), Spezial, Zauberplätze I–IV |

## Overlay-Panel

Nur auf der Wall.

| Eigenschaft | Wert |
|---|---|
| Breite | `min(OVERLAY_PANEL_MAX_WIDTH, 100vw − 2 × space.8, …)`, siehe [screen-layouts.md](screen-layouts.md#breite-des-overlay-panels) |
| Position | `space.7` unter der Oberkante, horizontal mittig |
| Kopfzeile | Überschrift, optional Label rechts, `space.5` zum Inhalt |

## Schwebende Steuerleiste

Wall und Ground.

| Eigenschaft | Wert |
|---|---|
| Position | `bottom: space.5`, horizontal mittig |
| Sichtbarkeit | nur bei Hover über dem Screen |

## Kachel

Szenenbild.

| Eigenschaft | Wert |
|---|---|
| Format | nach [1.4](../../DESIGN.md#14-regeln) Bilder |
| Rand | nach [1.4](../../DESIGN.md#14-regeln) Rahmen und Bilder, `outline-offset` 0. Aktiv ersetzt ihn die Aktiv-Outline ([1.4](../../DESIGN.md#14-regeln) Aktiv-Zustand) |
| Raster | quadratnah, Spaltenzahl aus `getGridLayout` (`⌈√n⌉`, bei 25 Kacheln 5), zeilenweise sortiert. Abstand nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“ |

## Nummern-Badge

| Eigenschaft | Wert |
|---|---|
| Größe | `size.badge` als Höhe und `min-width` ([1.2](../../DESIGN.md#12-tokens)), Innenabstand `0 space.2` |
| Position | `top` und `left` `space.2` in der Kachel |
| Schrift | zentriert |
| Inhalt | Raumnummer (Position 1–25), nicht die Datenbank-ID |

## Dialog

| Eigenschaft | Wert |
|---|---|
| Breite | `DIALOG_WIDTH` |
| Zuschnitt | `overflow: hidden` |
| Aufbau | Bild bündig oben (Format nach [1.4](../../DESIGN.md#14-regeln) Bilder), Textbereich mit Label, Titel und Beschreibung, Buttons rechts |
| Abstände | nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“ und „Innenabstand von Flächen“ |
| Button-Reihenfolge | Abbrechen links, Hauptaktion rechts außen |

## Top-Bar

| Eigenschaft | Wert |
|---|---|
| Aufbau | Grid `OUTER_COLUMN_WIDTH 1fr OUTER_COLUMN_WIDTH`: Titel links, Sound-Gruppen mittig, Settings rechts |
| Gruppen | mit senkrechter Trennlinie ([1.4](../../DESIGN.md#14-regeln) Rahmen). Abstände nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“ |

## Bottom-Bar

Nur im Admin.

| Eigenschaft | Wert |
|---|---|
| Aufbau | Grid `1fr auto 1fr`: Musik links, Nicht-Kampfszenen mittig |
| Szenen | Kacheln `TILE_WIDTH` breit, Label davor. Abstände nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“ |

## Hinweisleiste

Nur im Admin, Komponente `ErrorBar` ([src/components/ErrorBar.tsx](../../src/components/ErrorBar.tsx)). Erscheint nur bei
einem Ladefehler, sonst ist sie nicht vorhanden (kein reservierter Platz).

| Eigenschaft | Wert |
|---|---|
| Position | eigene Zeile direkt unter der Top-Bar, volle Breite ([screen-layouts.md](screen-layouts.md#screen-layouts)) |
| Aufbau | `display: flex`, `justify-content: space-between`: Text links, Icon-Button „Erneut versuchen“ rechts, `gap` `space.4` |
| Button | Icon-Button als Ausnahme ohne `size.control.md`: nur so groß wie das Icon (`reload.svg`, `size.icon`, etwa Texthöhe), damit die Leiste schmal bleibt; Icon in `onError`, ohne eigene Fläche und Rahmen; zugänglicher Name „Erneut versuchen“ (`aria-label`, `title`); Fokus als Outline `borderWidth.thick` in `onError` (`:focus-visible`) |
| Innenabstand | `space.1` oben/unten, `space.5` seitlich ([1.4](../../DESIGN.md#14-regeln) „Innenabstand von Flächen“) |
| Farbe | Fläche `error`, Text und Icon `onError` ([2.2](../../DESIGN.md#22-rollen)) |
| Rolle | `role="alert"` |

## Slider

Nur auf dem Ground.

| Eigenschaft | Wert |
|---|---|
| Breite | `SLIDER_WIDTH` |
| Schiene und Füllung | 4px hoch (MUI-Standard, nicht überschrieben) |
| Griff | `SLIDER_THUMB_SIZE` |
| Stufen | rastet in 10er-Schritten ein, ohne sichtbare Punkte |
| Wert | feste Anzeige rechts, `min-width: SLIDER_VALUE_MIN_WIDTH`, ohne Einheit |
