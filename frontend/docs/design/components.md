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
| Dashboard-Panels | gemeinsame Styled Component `PanelButton` ([src/components/PanelButton.tsx](../../src/components/PanelButton.tsx)): Fläche `background`, Fokus als Outline `borderWidth.thick` in `primary` (`:focus-visible`); „In neuem Fenster öffnen“, „QR-Code“ und „−“/„+“ im Panel „Level“ (dort Zeichen statt Icon, `text.lg` `semibold`; deaktiviert Zeichen in `text.muted`, `cursor: default`) |
| Beispiele | Sound-Buttons, Settings, Dashboard (Top-Bar, aktiv bei offenem Dashboard wie der Menüpunkt der [Navigationsleiste](#navigationsleiste); `aria-expanded`, `aria-controls`), Vollbild (Top-Bar, aktiv im Vollbild; `aria-pressed`), In neuem Fenster öffnen, QR-Code, Play/Pause, Nach oben, Menüpunkte der [Navigationsleiste](#navigationsleiste) (dort abweichend inaktiv ohne eigene Fläche und Icon `size.iconLg`; der allgemeine Icon-Button bleibt gefüllt) |
| Player | Hintergrund `secondary` (Settings-Button des Theme-Menüs) |

## Text-Button

Gemeinsame Styled Component `TextButton` ([src/components/TextButton.tsx](../../src/components/TextButton.tsx),
`<button>` mit `$variant: 'default' | 'active' | 'cancel'`). Laufweite gehört nicht zum Baustein; bei
Großbuchstaben ergänzt sie die verwendende Komponente (z. B. `ScreenControlBar`), siehe [1.4](../../DESIGN.md#14-regeln).

| Eigenschaft | Wert |
|---|---|
| Höhe, Breite | nach [1.2](../../DESIGN.md#12-tokens) Größen |
| Innenabstand | `0 space.4` |
| Beispiele | WORLD/OFF, BLACK/WHITE/OFF, Confirm/Decline |

## Button-Gruppe

`display: flex`, Abstand nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“. Mehrere Text-Buttons, von denen
einer aktiv ist.

## Navigationseintrag

Komponente `SideBarLeftElement` ([src/components/SideBarLeftElement.tsx](../../src/components/SideBarLeftElement.tsx)),
gemeinsam für die Notizen- und die Szenenliste im Panel (`DocumentNavigation`, `SceneNavigation`). Props `name`,
`isActive`, `onSelect`.

| Eigenschaft | Wert |
|---|---|
| Element | `<button type="button">`: per Tab erreichbar, Enter/Leertaste lösen aus |
| Höhe | nach [1.2](../../DESIGN.md#12-tokens) Größen |
| Innenabstand | `0 space.3`, linksbündig |
| Schrift | `text.sm` `medium`, einzeilig; zu lange Namen enden mit „…“ (`text-overflow: ellipsis`), der volle Name steht als `title` |
| Zustände | aktiv: Fläche `primary`, Text `onPrimary`, `aria-current="true"`; inaktiv: ohne eigene Fläche (`transparent`, also `background` des Panels), Text `text.color`; Hover (inaktiv): Fläche `secondary`. Fokus als Outline `borderWidth.thick` in `primary`, `outline-offset` `borderWidth.thick` (`:focus-visible`), wie beim Menüpunkt der [Navigationsleiste](#navigationsleiste) |

## Navigationsleiste

Nur im Admin, Komponente `NavRail` ([src/components/NavRail.tsx](../../src/components/NavRail.tsx)) mit dem Panel
daneben (`AdminScreen`). Die Menüpunkte kommen als Liste (id, Name, Icon, Panel-Inhalt) aus dem `AdminScreen`; zwei
Menüpunkte: „Notizen“ (`notes.svg`, Panel `DocumentNavigation`) und darunter „Szenen“ (`scenes.svg`, Panel
`SceneNavigation`).

| Eigenschaft | Wert |
|---|---|
| Breite | Leiste `NAV_RAIL_WIDTH`, Panel `LEFT_COLUMN_WIDTH` ([screen-layouts.md](screen-layouts.md#layout-konstanten)) |
| Fläche | Leiste und Panel `background` wie die Top-Bar, bündig zwischen Top-Bar und unterem Rand, ohne Karte; rechts an der Leiste und rechts am Panel je eine senkrechte Linie `borderWidth.thin` in `secondary` über die volle Höhe (wie die Linie unter der Top-Bar): die Linie der Leiste trennt sie vom Panel bzw. bei eingeklapptem Panel von den Notizen, die des Panels trennt es von den Notizen |
| Leiste | Spalte, horizontal zentriert, Innenabstand `space.5` oben/unten, `gap` `space.2` zwischen den Menüpunkten |
| Menüpunkt | [Icon-Button](#icon-button) (`<button type="button">`, `size.control.md`, `radius.md`), Icon abweichend `size.iconLg` (24px); Name als `aria-label` und `title`, `aria-pressed` für den Zustand, `aria-controls` aufs Panel |
| Zustände | wie beim [Navigationseintrag](#navigationseintrag): aktiv (Panel offen): Fläche `primary`, Icon `onPrimary`, auch bei Hover; inaktiv: ohne eigene Fläche (`transparent`, also `background` der Leiste), Icon `text.color`; Hover (inaktiv): Fläche `secondary`; eingeklappt: kein Menüpunkt aktiv. Anders als der allgemeine [Icon-Button](#icon-button), der inaktiv gefüllt bleibt. Fokus als Outline `borderWidth.thick` in `primary`, `outline-offset` `borderWidth.thick` (`:focus-visible`) |
| Panel | Innenabstand `space.5` oben/unten, `space.4` seitlich, scrollt bei Überlänge; Inhalt des aktiven Menüpunkts: bei „Notizen“ Label „Notizen“ und die [Navigationseinträge](#navigationseintrag) der Notizen, bei „Szenen“ Label „Szenen“ und je Szene ein Navigationseintrag (Reihenfolge der API), ohne Szenen der Hinweis „Keine Szenen“ (`text.sm`, Innenabstand `0 space.3`) |
| Bedienung | Klick (Enter/Leertaste) auf den aktiven Menüpunkt klappt das Panel ein, auf einen anderen bzw. im eingeklappten Zustand öffnet er dessen Panel (`nextOpenPanel` in `src/utils/navRail.ts`). Start: „Notizen“ offen |

## Label

Gemeinsame Styled Component `Label` ([src/components/Label.tsx](../../src/components/Label.tsx)). Schrift, Großbuchstaben
und Laufweite nach [1.4](../../DESIGN.md#14-regeln).

| Eigenschaft | Wert |
|---|---|
| Abstand | nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“. Zum zugehörigen Wert in einem zweizeiligen Block `0` („Musik“ → Titel). |
| Ausrichtung neben Werten | `align-items: baseline` |
| Beispiele | Notizen, Szenen, Aktive Szene, Wall, Ground, Musik, Sounds, Screens, Level, Spieler, Spielername der [Hero-Karte](#hero-karte) (in `text.muted`), Szene wechseln, Raster, Zelle, Aktion, Bonusaktion, Bewegung, Spezial, Zauberplätze |

## Karte

| Eigenschaft | Wert |
|---|---|
| Aufbau | optional Label, optional Titel, Inhalt. Zeilen getrennt durch Trennlinien ([1.4](../../DESIGN.md#14-regeln) Rahmen). |
| Beispiele | Ressourcen (Player) |

## Dashboard-Panel

Nur im Admin, Komponente `DashboardPanel` ([src/components/DashboardPanel.tsx](../../src/components/DashboardPanel.tsx));
die Liste der Panels (id, Label, Größe, Inhalt) kommt aus dem `AdminScreen`, das Raster ist `Dashboard`
([src/components/Dashboard.tsx](../../src/components/Dashboard.tsx), [screen-layouts.md](screen-layouts.md#screen-layouts)).

| Eigenschaft | Wert |
|---|---|
| Element | `<section>` mit dem Label als `aria-label` |
| Fläche | wie die [Karte](#karte): `secondary`, `radius.lg`, Innenabstand `space.5` |
| Größe | Props `columns` und `rows` (`grid-column: span n`, `grid-row: span m`), Mindesthöhe aus `DASHBOARD_ROW_HEIGHT`; braucht der Inhalt mehr, wächst die Zeile |
| Aufbau | [Label](#label) oben, darunter mit `space.3` der Inhalt; kein Scrollen im Panel, Text bricht um statt abgeschnitten zu werden |
| Flächen im Inhalt | `background` (Fläche auf Fläche, [2.2](../../DESIGN.md#22-rollen)) |
| Inhalte | „Aktive Szene“ (`ActiveScenePanel`: Vorschaubilder Wall und Ground 16:9 nebeneinander mit Label, `gap` `space.3`, darunter Name `text.lg` `semibold` und Beschreibung `text.sm`, beide umbrechend mit Silbentrennung), „Musik“ (`MusicControl`: Grid, links Play/Pause und darunter Titel und Hinweis `text.sm` umbrechend mit Silbentrennung, rechts über die volle Höhe der senkrechte Lautstärke-Slider, `aria-orientation="vertical"`, Abstand `space.3`), „Sounds“ (`SoundBoard`: Gruppen und Buttons einer Gruppe umbrechend, ohne Trennlinien), „Screens“ (`ScreensPanel`: je Screen Name `text.sm` `semibold`, [Status-Punkt](#status-punkt) mit Text; rechts der Icon-Button „In neuem Fenster öffnen“; darunter Spielerzahl und rechts gleich ausgerichtet der Icon-Button „QR-Code“ (`qrCode.svg`, `aria-haspopup="dialog"`)), „Level“ (`LevelPanel`: Grid `minmax(0, 1fr) auto`, links das Level `text.xl` `semibold` mit `tabular-nums`, ohne Abenteuer „–“; rechts die Icon-Buttons „−“ und „+“ mit `gap` `space.1`, zugängliche Namen „Level verringern“ und „Level erhöhen“, an den Grenzen 1 und 20 `disabled`), „Spieler“ (`PlayersPanel`: [Hero-Karten](#hero-karte) untereinander, `gap` `space.4`, Reihenfolge der API; ohne Spieler „Keine Spieler“ `text.sm`) |

## Hero-Karte

Nur im Admin (Panel „Spieler“), Komponente `PlayerHeroCard`
([src/components/PlayerHeroCard.tsx](../../src/components/PlayerHeroCard.tsx)) nach dem Mockup
[player-card-hero.html](mockup/player-card-hero.html), Variante ohne Effekte. Props `player`, `level`.

| Eigenschaft | Wert |
|---|---|
| Element | `<article>` mit dem Charakternamen als `aria-label`, `lang="de"` |
| Fläche | `background` (Fläche auf Fläche im Panel), `radius.lg`, Innenabstand `space.5` wie die [Karte](#karte) |
| Aufbau | `display: flex`, vertikal zentriert, `gap` `space.5`: links Avatar mit Level-Badge, rechts eine Spalte (`gap` `space.1`) aus Spielername ([Label](#label) in `text.muted`), Charaktername (`text.2xl` `medium`, bricht um mit Silbentrennung) und den Chips (`padding-top` `space.1`) |
| Avatar | `size.avatar.width` × `size.avatar.height`, Fläche `secondary`, Rand `borderWidth.thin` in `border`, `radius.lg`; Bild aus `avatar` über `mediaUrl` mit `object-fit: cover`, ohne Bild die Initialen des Charakternamens (`characterInitials` in `src/utils/player.ts`: erster Buchstabe des ersten und des letzten Worts) in `text.2xl` `medium`, Farbe `initials` |
| Level-Badge | über der oberen linken Ecke des Avatars (`top`/`left` −`space.2`), `size.badge`, `radius.pill`, Fläche `primary`, Zahl `onPrimary` `text.sm` `medium` `tabular-nums`, Ring `borderWidth.thick` in `background` (Farbe der Karte); zeigt das Level des Abenteuers |
| Chips | Volk und Klasse, umbrechend mit `gap` `space.1`; Innenabstand `0 space.2`, `text.sm`, Fläche `secondary`, Rand `borderWidth.thin` in `border`, `radius.md` |
| Nicht umgesetzt | Effektzeile, Varianten „kompakt“ und „Kachel“ aus den Mockups |

## Status-Punkt

Nur im Panel „Screens“ des Admins.

| Eigenschaft | Wert |
|---|---|
| Größe | `STATUS_DOT_SIZE`, `radius.pill`, vor dem Statustext mit `gap` `space.2` |
| Zustände | verbunden: gefüllt in `primary`; nicht verbunden: nur Ring `borderWidth.thick` in `text.color` – erkennbar an der Form, nicht nur an der Farbe; vor der ersten Meldung des Servers kein Punkt, Text „–“ |

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
| Kopfzeile | Überschrift, `space.5` zum Inhalt |

## Schwebende Steuerleiste

Wall und Ground.

| Eigenschaft | Wert |
|---|---|
| Position | `bottom: space.5`, horizontal mittig |
| Sichtbarkeit | nur bei Hover über dem Screen |

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
über den Icon-Button „QR-Code“ im [Dashboard-Panel](#dashboard-panel) „Screens“.

| Eigenschaft | Wert |
|---|---|
| Ebene, Abdunklung | wie [Dialog](#dialog): `layer.dialog`, Hintergrund `overlay` |
| Breite | `JOIN_DIALOG_WIDTH` |
| Aufbau | Spalte, zentriert: Titel „Spieler verbinden“, QR-Code (`QR_CODE_SIZE`, `qrcode.react`), darunter die URL (`text.sm`, bricht überall um), Button „Schließen“ rechts (`TextButton` `cancel`); ohne URL statt Code und URL der Hinweis „Player-URL unbekannt …“ (`text.sm`) |
| QR-Code | Module `qr.foreground` auf `qr.background`, unabhängig vom Theme; Ruhezone `QR_CODE_MARGIN` Module im Grund des Codes |
| Abstände | Innenabstand `space.5`, `gap` `space.4` |
| Bedienung | `role="dialog"`, `aria-modal`; Fokus beim Öffnen auf „Schließen“, danach zurück auf den Button „QR-Code“; schließt per Button, Esc oder Klick außerhalb |

## Top-Bar

| Eigenschaft | Wert |
|---|---|
| Aufbau | Grid `OUTER_COLUMN_WIDTH 1fr OUTER_COLUMN_WIDTH`: Abenteuer-Auswahl links, Mitte leer, rechts die Icon-Buttons „Vollbild“ (`fullscreen.svg` bzw. `fullscreenExit.svg`), „Dashboard“ (`dashboard.svg`) und Settings (`gap` `space.1`) |
| Abenteuer-Auswahl | [Auswahlliste](#auswahlliste) `AdventureSelect` (zugänglicher Name „Abenteuer“), Button mit `text.md` `bold`; langer Name einzeilig mit Ellipse innerhalb der Außenspalte |
| Dashboard | Icon-Button, transparent; bei offenem Dashboard Fläche `primary`, Icon `onPrimary` (auch bei Hover), sonst Hover `secondary`; Fokus als Outline `borderWidth.thick` in `primary` |
| Vollbild | wie „Dashboard“, aktiv solange das Admin-Fenster im Vollbild ist (`aria-pressed`) |

## Auswahlliste

Button mit aufklappender Liste nach dem ARIA-Muster „Listbox“ statt nativem `select`, dessen Menü das Betriebssystem
zeichnet. Bisher nur die Abenteuer-Auswahl ([src/components/AdventureSelect.tsx](../../src/components/AdventureSelect.tsx)).

| Eigenschaft | Wert |
|---|---|
| Button | Höhe `size.control.md`, Innenabstand `0 space.3`, Fläche `secondary`, Text `text.color`, ohne Rahmen, `radius.md`; Fokus als Outline `borderWidth.thick` in `primary` (`:focus-visible`); ohne Einträge deaktiviert. `aria-haspopup="listbox"`, `aria-expanded` |
| Chevron | rechts im Button, SVG-`polygon` (`viewBox 0 0 20 20`), `size.icon`, `fill` `text.color`; geöffnet um 180° gedreht |
| Liste | direkt unter dem Button (`position: absolute`, `top: calc(100% + space.1)`, `left: 0`), mindestens so breit wie der Button; Fläche `secondary`, Rand `borderWidth.thin` in `border`, `radius.lg`, Innenabstand `space.1`, `gap` `space.1`, ohne `box-shadow`; höchstens `ADVENTURE_LIST_MAX_HEIGHT` hoch, darüber scrollt sie; Ebene `layer.popover` |
| Eintrag | Höhe, Innenabstand und Schrift wie beim [Navigationseintrag](#navigationseintrag) (`text.sm` `medium`, `radius.md`), Fläche nicht gewählter Einträge aber wie die Liste. Gewählt: Fläche `primary`, Text `onPrimary`. Hover und Fokus: Fläche `background`. Gewählt mit Tastatur-Fokus (`:focus-visible`): bleibt `primary`, dazu Outline `borderWidth.thick` in `onPrimary`, nach innen versetzt (`outline-offset` −`borderWidth.thick`), damit die scrollende Liste sie nicht abschneidet. Nicht gewählt mit Tastatur-Fokus: Fläche `background`, dazu dieselbe innere Outline in `primary`. Hover und Maus ohne Outline. `role="option"`, `aria-selected` |
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
