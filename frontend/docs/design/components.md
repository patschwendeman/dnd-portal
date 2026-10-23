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
| Beispiele | Sound-Buttons, Settings, Play/Pause, Nach oben, Menüpunkte der [Navigationsleiste](#navigationsleiste) |
| Player | Hintergrund `secondary` (Settings-Button des Theme-Menüs) |

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

## Navigationsleiste

Nur im Admin, Komponente `NavRail` ([src/components/NavRail.tsx](../../src/components/NavRail.tsx)) mit dem Panel
daneben (`AdminScreen`). Die Menüpunkte kommen als Liste (id, Name, Icon, Panel-Inhalt) aus dem `AdminScreen`; bisher
nur „Notizen“ (`notes.svg`, Panel `DocumentNavigation`).

| Eigenschaft | Wert |
|---|---|
| Breite | Leiste `NAV_RAIL_WIDTH`, Panel `LEFT_COLUMN_WIDTH` ([screen-layouts.md](screen-layouts.md#layout-konstanten)) |
| Fläche | Leiste und Panel `background` wie die Top-Bar, bündig zwischen Top-Bar und Bottom-Bar, ohne Karte; rechts an der Leiste und rechts am Panel je eine senkrechte Linie `borderWidth.thin` in `secondary` über die volle Höhe (wie die Linie unter der Top-Bar): die Linie der Leiste trennt sie vom Panel bzw. bei eingeklapptem Panel von den Notizen, die des Panels trennt es von den Notizen |
| Leiste | Spalte, horizontal zentriert, Innenabstand `space.3` oben/unten, `gap` `space.1` zwischen den Menüpunkten |
| Menüpunkt | [Icon-Button](#icon-button) (`<button type="button">`, `size.control.md`, `radius.md`, Icon `size.icon`); Name als `aria-label` und `title`, `aria-pressed` für den Zustand, `aria-controls` aufs Panel |
| Zustände | aktiv (Panel offen): Fläche `primary`, Icon `onPrimary`; inaktiv: Fläche `secondary`, Icon `text.color`; eingeklappt: kein Menüpunkt aktiv. Fokus als Outline `borderWidth.thick` in `primary`, `outline-offset` `borderWidth.thick` (`:focus-visible`) |
| Panel | Innenabstand `space.3`, scrollt bei Überlänge; Inhalt des aktiven Menüpunkts, bei „Notizen“ Label „Notizen“ und die [Navigationseinträge](#navigationseintrag) |
| Bedienung | Klick (Enter/Leertaste) auf den aktiven Menüpunkt klappt das Panel ein, auf einen anderen bzw. im eingeklappten Zustand öffnet er dessen Panel (`nextOpenPanel` in `src/utils/navRail.ts`). Start: „Notizen“ offen |

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

## Dialog „Spieler verbinden“

Nur im Admin, Komponente `JoinDialog` ([src/components/JoinDialog.tsx](../../src/components/JoinDialog.tsx)), geöffnet
über den Icon-Button „Spieler verbinden“ in der Top-Bar.

| Eigenschaft | Wert |
|---|---|
| Ebene, Abdunklung | wie [Dialog](#dialog): `layer.dialog`, Hintergrund `overlay` |
| Breite | `JOIN_DIALOG_WIDTH` |
| Aufbau | Spalte, zentriert: Titel „Spieler verbinden“, QR-Code (`QR_CODE_SIZE`, `qrcode.react`), darunter die URL (`text.sm`, bricht überall um), Button „Schließen“ rechts (`TextButton` `cancel`); ohne URL statt Code und URL der Hinweis „Player-URL unbekannt …“ (`text.sm`) |
| QR-Code | Module `qr.foreground` auf `qr.background`, unabhängig vom Theme; Ruhezone `QR_CODE_MARGIN` Module im Grund des Codes |
| Abstände | Innenabstand `space.5`, `gap` `space.4` |
| Bedienung | `role="dialog"`, `aria-modal`; Fokus beim Öffnen auf „Schließen“, danach zurück auf den Button der Top-Bar; schließt per Button, Esc oder Klick außerhalb |

## Top-Bar

| Eigenschaft | Wert |
|---|---|
| Aufbau | Grid `OUTER_COLUMN_WIDTH 1fr OUTER_COLUMN_WIDTH`: Abenteuer-Auswahl links, Sound-Gruppen mittig, rechts die Icon-Buttons „Spieler verbinden“ (`phone.svg`) und Settings (`gap` `space.1`) |
| Abenteuer-Auswahl | [Auswahlliste](#auswahlliste) `AdventureSelect` (zugänglicher Name „Abenteuer“), Button mit `text.md` `bold`; langer Name einzeilig mit Ellipse innerhalb der Außenspalte |
| Gruppen | mit senkrechter Trennlinie ([1.4](../../DESIGN.md#14-regeln) Rahmen). Abstände nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“ |

## Auswahlliste

Button mit aufklappender Liste nach dem ARIA-Muster „Listbox“ statt nativem `select`, dessen Menü das Betriebssystem
zeichnet. Bisher nur die Abenteuer-Auswahl ([src/components/AdventureSelect.tsx](../../src/components/AdventureSelect.tsx)).

| Eigenschaft | Wert |
|---|---|
| Button | Höhe `size.control.md`, Innenabstand `0 space.3`, Fläche `secondary`, Text `text.color`, ohne Rahmen, `radius.md`; Fokus als Outline `borderWidth.thick` in `primary` (`:focus-visible`); ohne Einträge deaktiviert. `aria-haspopup="listbox"`, `aria-expanded` |
| Chevron | rechts im Button, SVG-`polygon` (`viewBox 0 0 20 20`), `size.icon`, `fill` `text.color`; geöffnet um 180° gedreht |
| Liste | direkt unter dem Button (`position: absolute`, `top: calc(100% + space.1)`, `left: 0`), mindestens so breit wie der Button; Fläche `secondary`, Rand `borderWidth.thin` in `border`, `radius.lg`, Innenabstand `space.1`, `gap` `space.1`, ohne `box-shadow`; höchstens `ADVENTURE_LIST_MAX_HEIGHT` hoch, darüber scrollt sie; Ebene `layer.popover` |
| Eintrag | wie [Navigationseintrag](#navigationseintrag), `text.sm` `medium`, `radius.md`. Gewählt: Fläche `primary`, Text `onPrimary`. Hover und Fokus: Fläche `background`. Gewählt mit Tastatur-Fokus (`:focus-visible`): bleibt `primary`, dazu Outline `borderWidth.thick` in `onPrimary`, nach innen versetzt (`outline-offset` −`borderWidth.thick`), damit die scrollende Liste sie nicht abschneidet. Nicht gewählt mit Tastatur-Fokus: Fläche `background`, dazu dieselbe innere Outline in `primary`. Hover und Maus ohne Outline. `role="option"`, `aria-selected` |
| Bedienung | Klick auf den Button öffnet und schließt. Am Button öffnen Enter, Leertaste und Pfeil runter/hoch, der Fokus steht dann auf dem gewählten Eintrag. In der Liste bewegen Pfeile (ohne Umlauf) und Pos1/Ende; Enter/Leertaste wählen und schließen; Esc schließt und setzt den Fokus zurück auf den Button; Tab und Klick außerhalb schließen. Den gewählten Eintrag erneut zu wählen schließt nur |

## Theme-Menü

Nur im Player, Komponente `ThemeMenu` ([src/components/ThemeMenu.tsx](../../src/components/ThemeMenu.tsx)). Aufbau und
Bedienung wie die [Auswahlliste](#auswahlliste), mit diesen Abweichungen:

| Eigenschaft | Wert |
|---|---|
| Button | Icon-Button mit Settings-Icon (Player: `size.control.lg`, Fläche `secondary`); zugänglicher Name „Darstellung“ |
| Liste | ohne Höhenbegrenzung und ohne `z-index` (siehe [1.2](../../DESIGN.md#12-tokens) Ebenen) |
| Einträge | „Wie Spieltisch“, „Dunkel“, „Taverne“; Höhe `size.control.lg` (Touch-Ziel), Innenabstand `0 space.4` |
| Bedienung | zusätzlich schließt Tippen außerhalb (`pointerdown`) |

## Bottom-Bar

Nur im Admin.

| Eigenschaft | Wert |
|---|---|
| Aufbau | Grid `1fr auto 1fr`: Musik links, Nicht-Kampfszenen mittig |
| Szenen | Kacheln `TILE_WIDTH` breit, Label davor. Abstände nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“ |

## Hinweisleiste

Nur im Admin, Komponente `ErrorBar` ([src/components/ErrorBar.tsx](../../src/components/ErrorBar.tsx)). Erscheint nur bei
einem Ladefehler oder einem fehlgeschlagenen Speichern der aktiven Szene, sonst ist sie nicht vorhanden (kein
reservierter Platz). Bei beiden Fehlern stehen zwei Leisten untereinander in derselben Zeile.

| Eigenschaft | Wert |
|---|---|
| Position | eigene Zeile direkt unter der Top-Bar, volle Breite ([screen-layouts.md](screen-layouts.md#screen-layouts)) |
| Aufbau | `display: flex`, `justify-content: center`: Text und Icon-Button „Erneut versuchen“ zentriert nebeneinander, `gap` `space.4` |
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
