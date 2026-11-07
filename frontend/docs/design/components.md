# Bausteine

Teil des [Style Guide](../../DESIGN.md), Abschnitt [1.5](../../DESIGN.md#15-bausteine). Hier steht, wie die wiederkehrenden
Elemente aufgebaut sind. Maße, Innenabstände, Radien und Schriftstufen je Baustein stehen nur hier. Die Regeln dahinter
stehen im Style Guide und werden hier nicht wiederholt:

- Größen der Tokens `size.*`: [1.2](../../DESIGN.md#12-tokens)
- Abstände nach Beziehung, Radien (verschachtelt), Rahmen, Icons, Bilder, Laufweite und `tabular-nums`:
  [1.4](../../DESIGN.md#14-regeln)
- Farben (Flächen, Text, Icons, Linien): [2.2](../../DESIGN.md#22-rollen), Aktiv- und Inaktiv-Farben:
  [2.4](../../DESIGN.md#24-zustände)

Die Werte der Layout-Konstanten stehen in [screen-layouts.md](screen-layouts.md).

## Icon-Button

Größe nach [1.2](../../DESIGN.md#12-tokens) Größen, Icon nach [1.4](../../DESIGN.md#14-regeln) Icons.

| Eigenschaft | Wert |
|---|---|
| Zentrierung des Icons | `display: grid; place-items: center` |
| Padding | `0` (Reset bei `<button>`) |
| Radius | `radius.md` |
| Farbe | Hintergrund in der [Kopfzeile](#kopfzeile) und der Hinweisleiste transparent, sonst nach [2.2](../../DESIGN.md#22-rollen) und [2.4](../../DESIGN.md#24-zustände) |
| Dashboard-Panels | gemeinsame Styled Component `PanelButton` ([src/components/PanelButton.tsx](../../src/components/PanelButton.tsx)): Fläche `background`, Fokus als Outline `borderWidth.thick` in `primary` (`:focus-visible`); „In neuem Fenster öffnen“, „QR-Code“ (aktiv bei QR-Code auf der Wall: Fläche `primary`, Icon `onPrimary`; `aria-pressed`) und „−“/„+“ im [Level-Stepper](#level-stepper) (dort Zeichen statt Icon, `text.lg` `semibold`; deaktiviert Zeichen in `text.muted`, `cursor: default`); die Sound-Buttons haben keine eigene Fläche, die Fläche ist ihre Gruppe |
| Beispiele | Sound-Buttons, Dashboard (Kopfzeile, aktiv bei offenem Dashboard wie der Menüpunkt der [Navigationsleiste](#navigationsleiste); `aria-expanded`, `aria-controls`), Vollbild (Kopfzeile, aktiv im Vollbild; `aria-pressed`), Zurück und Vor (Kopfzeile, ohne Ziel `disabled`), In neuem Fenster öffnen, QR-Code, Play/Pause, Nach oben, Menüpunkte der [Navigationsleiste](#navigationsleiste) (dort abweichend inaktiv ohne eigene Fläche und Icon `size.iconLg`; der allgemeine Icon-Button bleibt gefüllt) |
| Player | Settings-Button des [Settings-Menüs](#settings-menü): Fläche, Rand und Lichtkante wie die [Kachel](#kachel) (mit Hintergrundbild durchscheinend), `radius.md` |

## Text-Button

Gemeinsame Styled Component `TextButton` ([src/components/TextButton.tsx](../../src/components/TextButton.tsx),
`<button>` mit `$variant: 'default' | 'active' | 'cancel'`). Laufweite gehört nicht zum Baustein; bei
Großbuchstaben ergänzt sie die verwendende Komponente, siehe [1.4](../../DESIGN.md#14-regeln).

| Eigenschaft | Wert |
|---|---|
| Höhe, Breite | nach [1.2](../../DESIGN.md#12-tokens) Größen |
| Innenabstand | `0 space.4` |
| Radius | `radius.md` |
| Beispiele | Confirm/Decline; Umschalt-Buttons in Dashboard-Panels sind kein Text-Button, sondern ein [Segment-Control](#segment-control) |

## Button-Gruppe

`display: flex`, Abstand nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“. Mehrere Text-Buttons, von denen
einer aktiv ist. In Dashboard-Panels stattdessen das [Segment-Control](#segment-control). In der [Kopfzeile](#kopfzeile)
sind die Icon-Buttons zu Kacheln gruppiert.

## Navigationseintrag

Komponente `SideBarLeftElement` ([src/components/SideBarLeftElement.tsx](../../src/components/SideBarLeftElement.tsx)),
gemeinsam für die Notizen- und die Szenenliste im Panel (`DocumentNavigation`, `SceneNavigation`). Props `name`,
`isActive`, `onSelect`, `isDisabled`.

| Eigenschaft | Wert |
|---|---|
| Element | `<button type="button">`: per Tab erreichbar, Enter/Leertaste lösen aus |
| Höhe | nach [1.2](../../DESIGN.md#12-tokens) Größen |
| Innenabstand | `0 space.3`, linksbündig |
| Schrift | `text.sm` `medium`, einzeilig; zu lange Namen enden mit „…“ (`text-overflow: ellipsis`), der volle Name steht als `title` |
| Zustände | aktiv: Fläche `primary`, Text `onPrimary`, `aria-current="true"`; inaktiv: ohne eigene Fläche (`transparent`, also `secondary` der Panel-Kachel), Text `text.color`; Hover (inaktiv): Fläche `background`. Fokus als Outline `borderWidth.thick` in `primary`, `outline-offset` `borderWidth.thick` (`:focus-visible`), wie beim Menüpunkt der [Navigationsleiste](#navigationsleiste). Gesperrt (`isDisabled`, Szenen während eines Kampfes): `aria-disabled="true"` (bleibt fokussierbar), Klick ohne Wirkung, `cursor: not-allowed`, nicht aktive Einträge mit Deckkraft 0,45 und ohne Hover-Fläche; der aktive bleibt voll sichtbar |

## Navigationsleiste

Nur im Admin, Komponente `NavRail` ([src/components/NavRail.tsx](../../src/components/NavRail.tsx)) mit dem Panel
daneben (`AdminScreen`). Die Menüpunkte kommen als Liste (id, Name, Icon, Punkt, Platz, Panel-Inhalt) aus dem
`AdminScreen`; über ihnen das Logo, darunter vier Menüpunkte: „Notizen“ (`notes.svg`, Panel `DocumentNavigation`), darunter „Szenen“ (`scenes.svg`,
Panel `SceneNavigation`) und „Kampf“ (`swords.svg`, Panel `FightPanel`, siehe [Panel „Kampf“](#panel-kampf)), am
unteren Ende „Einstellungen“ (`settings.svg`, Panel `SettingsPanel`, siehe [Panel „Einstellungen“](#panel-einstellungen)).

| Eigenschaft | Wert |
|---|---|
| Breite | Leiste `NAV_RAIL_WIDTH`, Panel `LEFT_COLUMN_WIDTH`, Panel „Kampf“ `FIGHT_PANEL_WIDTH` ([screen-layouts.md](screen-layouts.md#layout-konstanten)) |
| Fläche | Leiste und Panel sind je eine [Kachel](#kachel) über beide Zeilen des Admins, mit `space.5` Abstand zum oberen und unteren Rand; keine Trennlinien |
| Leiste | Spalte, horizontal zentriert, Innenabstand `space.5` oben/unten; oben das Logo, `space.6` darunter die oberen Menüpunkte mit `gap` `space.2`; Menüpunkte mit `placement: 'bottom'` stehen als eigene Gruppe am unteren Ende (`margin-top: auto`, `splitByPlacement` in `src/utils/navRail.ts`) |
| Logo | `dice.svg` (Platzhalter) in `LOGO_SIZE` und `primary` des aktiven Themes, auch bei eingeklapptem Panel und mit Hintergrundbild; ohne Funktion: kein Button, kein Hover, nicht fokussierbar, Klick ohne Wirkung; `role="img"`, `aria-label="DnD Portal"` |
| Menüpunkt | [Icon-Button](#icon-button) (`<button type="button">`, `size.control.md`, `radius.md`), Icon abweichend `size.iconLg` (24px); Name als `aria-label` und `title`, `aria-pressed` für den Zustand, `aria-controls` aufs Panel |
| Zustände | wie beim [Navigationseintrag](#navigationseintrag): aktiv (Panel offen): Fläche `primary`, Icon `onPrimary`, auch bei Hover; inaktiv: ohne eigene Fläche (`transparent`, also `secondary` der Kachel), Icon `text.color`; Hover (inaktiv): Fläche `background`; eingeklappt: kein Menüpunkt aktiv. Anders als der allgemeine [Icon-Button](#icon-button), der inaktiv gefüllt bleibt. Fokus als Outline `borderWidth.thick` in `primary`, `outline-offset` `borderWidth.thick` (`:focus-visible`) |
| Panel | Innenabstand `space.5` oben/unten, `space.4` seitlich, scrollt bei Überlänge innerhalb seiner Kachel; Inhalt des aktiven Menüpunkts: bei „Notizen“ Label „Notizen“ und die [Navigationseinträge](#navigationseintrag) der Notizen, bei „Szenen“ Label „Szenen“ und je Szene ein Navigationseintrag (Reihenfolge der API), ohne Szenen der Hinweis „Keine Szenen“ (`text.sm`, Innenabstand `0 space.3`); während eines Kampfes darüber der Hinweis „Kampf läuft. …“ (Fläche `background`, `radius.md`, Innenabstand `space.3`, `text.sm`, links das Schloss `padlock.svg` in `size.icon` und `negative.text`, `gap` `space.2`) und gesperrte Einträge; bei „Kampf“ das [Panel „Kampf“](#panel-kampf), bei „Einstellungen“ das [Panel „Einstellungen“](#panel-einstellungen) |
| Punkt | bei laufendem Kampf am Menüpunkt „Kampf“, solange sein Panel nicht offen ist (anderes Panel oder eingeklappt): Kreis `BADGE_SIZE` oben rechts im Button (`BADGE_INSET`), `radius.pill`, Fläche `negative.border`, Ring `borderWidth.thick` in `secondary`, `aria-hidden`; Name und Tooltip dann „Kampf (läuft)“ |
| Bedienung | Klick (Enter/Leertaste) auf den aktiven Menüpunkt klappt das Panel ein, auf einen anderen bzw. im eingeklappten Zustand öffnet er dessen Panel (`nextOpenPanel` in `src/utils/navRail.ts`). Start: „Notizen“ offen |

## Label

Gemeinsame Styled Component `Label` ([src/components/Label.tsx](../../src/components/Label.tsx)). Schrift, Großbuchstaben
und Laufweite nach [1.4](../../DESIGN.md#14-regeln).

| Eigenschaft | Wert |
|---|---|
| Abstand | nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“. Zum zugehörigen Wert in einem zweizeiligen Block `0`. |
| Ausrichtung neben Werten | `align-items: baseline` |
| Beispiele | Notizen, Szenen, Aktive Szene, Wall, Ground (auf den Bildern der [Bühne](#bühne)), Audio, Spieltisch, Party · N, Level ([Level-Stepper](#level-stepper)), Spielername der [Hero-Karte](#hero-karte) (in `text.muted`), Szene wechseln |

## Karte

| Eigenschaft | Wert |
|---|---|
| Aufbau | optional Label, optional Titel, Inhalt. Zeilen getrennt durch Trennlinien ([1.4](../../DESIGN.md#14-regeln) Rahmen). |
| Maße | Innenabstand `space.5`, `radius.lg` |
| Beispiele | Hero-Karte und Ressourcen des Player Screens, „Party“ der Charakterauswahl, Hinweis nach Abenteuerwechsel (Player), [Abenteuer-Karte](#abenteuer-karte); Fläche wie die [Kachel](#kachel) |

## Kachel

Im Admin sind alle Bereiche frei stehende Kacheln über dem [Abenteuer-Hintergrund](#abenteuer-hintergrund), getrennt
durch Abstand statt Linien. Gemeinsamer CSS-Helper `tileSurface` ([src/style/GlobalStyle.ts](../../src/style/GlobalStyle.ts))
mit dem Schalter `$isTranslucent`, den der `AdminScreen` setzt, solange das Hintergrundbild zu sehen ist (Prop
`isTranslucent` an `NavRail`, `AdminHeader`, `DocumentReader` und `DashboardPanel`). Auf Wall und Ground haben alle
Panels und Overlays dieselbe Fläche, immer durchscheinend: [Overlay-Panel](#overlay-panel), Fläche im
[Vollbild-Overlay](#vollbild-overlay), [Wall-Kachel](#wall-kachel) (Party, Initiative) und die Kacheln „Runde N“ und
„+N weitere“ der [Initiative-Leiste](#initiative-leiste). Im Player haben die Karten (Party, Hinweis, Hero, Ressourcen) und
der Settings-Button dieselbe Fläche; durchscheinend, solange das Hintergrundbild zu sehen ist (`PlayerLayout` gibt
`isTranslucent` per Outlet-Context weiter). In der Abenteuerauswahl sind Karten, Platzhalter-Karten, Zustands-Kachel
und Kampf-Hinweis immer durchscheinend, obwohl dahinter nur die Fläche `background` liegt (bewusste Ausnahme, siehe
[DESIGN.md](../../DESIGN.md#14-regeln) „Durchscheinende Kacheln“).

| Eigenschaft | Wert |
|---|---|
| Fläche | `secondary`, `radius.lg`; mit Hintergrundbild dahinter `secondaryTranslucent` (Cyber 75 %, Tavern 92 % deckend) und `backdrop-filter: blur(TILE_BLUR)` |
| Rand | `borderWidth.thin` in `border` |
| Lichtkante | innen oben: `box-shadow: inset 0 borderWidth.thin 0` in `border`; kein äußerer Schatten |
| Abweichende Fläche | Hinweisleiste `error`, [Bühne](#bühne) `background`, beide immer deckend; Form, Rand und Lichtkante wie oben |
| Durchscheinend | im Admin nur mit Hintergrundbild: Navigationsleiste und ihr Panel, Abenteuername und Button-Gruppe der Kopfzeile, Notizseiten, Dashboard-Panels; auf Wall und Ground und in der Abenteuerauswahl immer. Flächen in den Kacheln (`background`) bleiben deckend |
| Verwendung | [Navigationsleiste](#navigationsleiste) und ihr Panel, Kacheln der [Kopfzeile](#kopfzeile) (Abenteuername, Button-Gruppe, [Hinweisleiste](#hinweisleiste)), Notizseiten, [Dashboard-Panels](#dashboard-panel), [Bühne](#bühne); Wall und Ground siehe oben |
| Auftritt im Admin | nur nach dem Betreten aus der Abenteuerauswahl, gesteuert über `data-entrance` am Screen (`pending` → `building` → `done`, beim Beenden `exiting`) und den CSS-Baustein `tileEntrance` ([src/style/GlobalStyle.ts](../../src/style/GlobalStyle.ts)); jede Kachel trägt Index und Herkunft (`tileEntranceAttributes`, Werte in [src/utils/adminEntrance.ts](../../src/utils/adminEntrance.ts)). Aufbau erst nach dem Übergang: `opacity` 0 → 1 und `transform` vom Versatz an den Platz, 380 ms, Start um 65 ms × Index versetzt (Index 0–8, `TILE_BUILD_MS` 900 ms bis alles steht), Kurve `MOTION_EASING` (`cubic-bezier(.2, .7, .2, 1)`). Index und Herkunft: 0 „Zurück \| Vor“, 1 Abenteuername bzw. Hinweisleiste (beide 12px von oben), 2 „Vollbild \| Dashboard“ (von oben) und Navigationsleiste (16px von links), 3 Panel (von links), 4 erste Notizseite, 5 weitere Notizseiten (12px von unten) und erstes Dashboard-Panel, 5–8 Dashboard-Panels der Reihe nach (16px von rechts). Beim Beenden blenden alle gleichzeitig aus (`scale(.98)`, `TILE_EXIT_MS` 200 ms, `ease-in`). Animiert werden nur `opacity` und `transform` der Kachel selbst (nie ein Elternelement, nie `backdrop-filter`), Klicks wirken die ganze Zeit. Inhalte, die während des Aufbaus nachgeladen werden (Notizseiten, Bühne, „Party“, „Am Zug“, „Initiative“), blenden in 200 ms ein. Bei „Bewegung reduzieren“ kein Auftritt |
| Notizseite | volle Breite der mittleren Spalte, Innenabstand `space.7` oben/unten, `space.8` seitlich; der Text darin höchstens `LINE_MAX_WIDTH` breit und zentriert; Abstand zwischen den Seiten `space.5`. Der Nach-oben-Button schwebt über den Kacheln und hat deshalb die Fläche `background`. Links in `primary` ohne Unterstreichung; ein Querverweis ohne Ziel als Text in `error`, gepunktet unterstrichen, `cursor: default`, Tooltip „Verweis-Ziel nicht gefunden“ |

## Abenteuer-Hintergrund

Im Admin und im Player (Charakterauswahl und Player Screen, gerendert von `PlayerLayout`), in beiden Themes gleich,
Komponente `AdventureBackground` ([src/components/AdventureBackground.tsx](../../src/components/AdventureBackground.tsx)),
Zustand aus `useAdventureBackground` ([src/utils/useAdventureBackground.ts](../../src/utils/useAdventureBackground.ts), Logik in
[src/utils/adventureBackground.ts](../../src/utils/adventureBackground.ts)). Im JSX vor dem Grid des Admins bzw. vor dem
Inhalt der Player-Routen; beide sind `position: fixed`, die Reihenfolge legt die Ebenen fest (kein `z-index`).

| Eigenschaft | Wert |
|---|---|
| Fläche | `position: fixed`, `inset: 0`, `background` |
| Bild | Abenteuerbild des aktiven Abenteuers (`image` aus `adventures/{id}`, `mediaUrl`), in beiden Themes dasselbe, `object-fit: cover` über den ganzen Bildschirm, darüber `backdrop` (50 %); Dekoration (`aria-hidden`, `alt=""`). Die aktive Szene spielt keine Rolle |
| Ohne Bild | kein Abenteuerbild festgelegt, Abenteuer lädt noch, Bild nicht ladbar: nur die Fläche `background`, die Kacheln sind deckend |
| Wechsel | nur bei Abenteuerwechsel, nicht bei Szenen- oder Themewechsel (der ändert nur die Farben); das neue Bild erscheint erst, wenn es geladen ist; Bild und Abdunklung blenden gemeinsam über (`BACKGROUND_FADE_MS`, 600 ms), ohne Bild zur Fläche aus. Bei `prefers-reduced-motion: reduce` ohne Übergang |
| Übergang | im Admin trägt das gezeigte Bild samt Abdunklung den `view-transition-name` `adventure-hero` (Prop `isHero`), wie das Bild der angeklickten [Abenteuer-Karte](#abenteuer-karte); beim Betreten aus der Auswahl wächst das Kartenbild so in 500 ms zum Hintergrund, beim Beenden schrumpft er zurück. Bis der Admin das Abenteuer geladen hat, zeigt er das Kartenbild aus dem Einstieg (`location.state`) ohne Einblenden (`instant`). Regeln der Übergänge: `PageTransitionStyle` ([src/style/PageTransitionStyle.ts](../../src/style/PageTransitionStyle.ts)), Ablauf: `startPageTransition` ([src/utils/viewTransition.ts](../../src/utils/viewTransition.ts)) |
| Scrollen | steht fest, Notizen und Dashboard scrollen darüber; deren Scrollbereich hat `space.5` Innenabstand unten, oben keinen (der Abstand zur Kopfzeile ist das `gap` des Grids) |

## Dashboard-Panel

Nur im Admin, Komponente `DashboardPanel` ([src/components/DashboardPanel.tsx](../../src/components/DashboardPanel.tsx)).
Das Dashboard ([src/components/Dashboard.tsx](../../src/components/Dashboard.tsx)) ist eine Spalte; der `AdminScreen`
stellt die Panels von oben zusammen: [Bühne](#bühne), „Audio“, „Spieltisch“, „Party“ (Layout:
[screen-layouts.md](screen-layouts.md#screen-layouts)). Die Panels sind eigene Komponenten, damit spätere Layouts sie
wiederverwenden können.

| Eigenschaft | Wert |
|---|---|
| Element | `<section>` mit dem Label als `aria-label` (Prop `label`) |
| Fläche | [Kachel](#kachel) (`secondary`, `radius.lg`, Rand und Lichtkante), Innenabstand `space.5` |
| Größe | volle Breite des Dashboards, so hoch wie der Inhalt |
| Aufbau | Kopf oben: [Label](#label) (Text aus `title`, sonst `label`), rechts davon optional Bedienelemente (`headEnd`, z. B. der [Level-Stepper](#level-stepper)), vertikal zentriert, `gap` `space.3`, umbrechend; darunter mit `space.3` der Inhalt; kein Scrollen im Panel, Text bricht um statt abgeschnitten zu werden |
| Flächen im Inhalt | `background` (Fläche auf Fläche, [2.2](../../DESIGN.md#22-rollen)) |
| Trennlinien | `borderWidth.thin` in `border` |
| Inhalte | „Audio“ (`AudioPanel`: Spalte mit `gap` `space.4` aus `MusicControl`, Trennlinie und `SoundBoard`. `MusicControl`: Zeile Play/Pause und daneben (`gap` `space.3`) Titel `text.sm` `medium` und darunter Zustand „Läuft“/„Pausiert“ bzw. ohne Ausgabe „Keine Audioausgabe bereit“ `text.sm`, beide umbrechend mit Silbentrennung; darunter Grid `auto minmax(0, 1fr) auto` mit `gap` `space.3` aus Lautsprecher-Icon (`volume.svg`, `text.muted`), waagerechtem [Slider](#slider) und Wert. `SoundBoard`: Gruppen umbrechend mit `gap` `space.2`, jede Gruppe eine Fläche `background` mit `radius.md`, die Icon-Buttons darin ohne eigene Fläche und ohne Abstand), „Spieltisch“ (`GameTablePanel`: je eine [Spieltisch-Zeile](#spieltisch-zeile) für Wall, Ground und Spieler), „Party“ (`PlayersPanel`: Kopf „Party · N“ mit [Level-Stepper](#level-stepper), darunter die [Spielerzeilen](#spielerzeile) immer in einer Spalte, `gap` `space.2`, Reihenfolge der API; ohne Spieler „Keine Spieler“ `text.sm`) |

## Bühne

Nur im Admin, oberstes Element des Dashboards, Komponente `ActiveScenePanel`
([src/components/ActiveScenePanel.tsx](../../src/components/ActiveScenePanel.tsx)). Kein Dashboard-Panel: ohne Innenabstand und ohne
Label über dem Bild.

| Eigenschaft | Wert |
|---|---|
| Element | `<section>` mit `aria-label` „Aktive Szene“, `lang="de"` |
| Fläche | [Kachel](#kachel) mit Fläche `background` (sichtbar ohne Wall-Bild), `overflow: hidden`; die Lichtkante liegt zusätzlich als Pseudo-Element über dem Wall-Bild, das sie sonst verdecken würde |
| Aufbau | Grid mit einer Spalte und zwei Zeilen (`auto 1fr`); ein Pseudo-Element über beide Zeilen hält die Bühne mindestens 16:9 hoch. Das Wall-Bild liegt absolut über die ganze Fläche (`object-fit: cover`) und bestimmt die Höhe nicht. Zeile 1: Label „Wall“ links, Ground-Bild rechts; Zeile 2: der Text unten. Langer Text macht die Bühne höher und läuft nie unter das Ground-Bild |
| Ground-Bild | ein Drittel der Breite, 16:9, Abstand `space.3` zum Rand, `radius.md`, Rand `borderWidth.thin` in `scrim`, Fläche `background` ohne Bild; Label „Ground“ oben links mit `space.1` Abstand |
| Bild-Labels | [Label](#label) auf Fläche `scrim`, Text `onScrim`, Innenabstand `0 space.1`, `radius.sm` |
| Text | Spalte mit `gap` `space.1`: Label „Aktive Szene“, Name `text.xl` `semibold`, Beschreibung `text.sm`; alles `onScrim`, umbrechend mit Silbentrennung. Innenabstand `space.7` oben, `space.5` seitlich und unten; Hintergrund ein Verlauf von transparent zu `scrim`, der nach `space.7` voll deckend ist – der Text liegt immer auf voller Abdunklung |
| Ohne aktive Szene | ein [Dashboard-Panel](#dashboard-panel) „Aktive Szene“ mit dem Hinweis „Keine Szene aktiv“ (`text.sm`) |

## Segment-Control

Nur in Dashboard-Panels, gemeinsame Komponente `OptionButtons`
([src/components/OptionButtons.tsx](../../src/components/OptionButtons.tsx)). Mehrere Buttons, von denen einer gewählt
ist: Wall-Overlay „Weltkarte“/„Aus“ (bei QR-Code auf der Wall keiner), Ground-Raster „Schwarz“/„Weiß“/„Aus“.

| Eigenschaft | Wert |
|---|---|
| Fläche | `background`, Innenabstand `space.1`, `gap` `space.1`, `radius.lg`, `role="group"`; zusammen so hoch wie `size.control.md` |
| Button | `<button type="button">` ohne eigene Fläche, Höhe `size.control.md` − 2 × `space.1`, Innenabstand `0 space.2`, `radius.md`, `text.sm` `semibold`, einzeilig; wächst und schrumpft mit seinem Text (`flex: 1 1 auto`), zu langer Text endet mit „…“ |
| Zustände | gewählt (`aria-pressed="true"`): Fläche `primary`, Text `onPrimary`; sonst Text `text.color`, Hover Fläche `secondary`; Fokus als Outline `borderWidth.thick` in `primary` (`:focus-visible`) |
| Bedienung | gewählt ist der Zustand des Servers; ein Klick auf den gewählten Button tut nichts |

## Spieltisch-Zeile

Nur im Panel „Spieltisch“ (`GameTablePanel`, [src/components/GameTablePanel.tsx](../../src/components/GameTablePanel.tsx)).
Eine Zeile je Screen: Wall, Ground, Spieler.

| Eigenschaft | Wert |
|---|---|
| Aufbau | Grid `TABLE_NAME_COLUMN_WIDTH minmax(0, 1fr) auto`, vertikal zentriert, `gap` `space.2` `space.3`: links Name (`text.sm` `semibold`) und darunter Status (`text.sm`, bei Wall und Ground mit [Status-Punkt](#status-punkt)), in der Mitte die Steuerung, rechts ein [Icon-Button](#icon-button) |
| Trennung | Innenabstand `space.3` oben/unten, dazwischen eine Linie `borderWidth.thin` in `border`; erste Zeile oben, letzte unten ohne Abstand |
| Wall | [Segment-Control](#segment-control) „Weltkarte“/„Aus“ (bei QR-Code auf der Wall keine Option gewählt), Icon-Button „In neuem Fenster öffnen“ (`openWindow.svg`) |
| Ground | [Segment-Control](#segment-control) „Schwarz“/„Weiß“/„Aus“, Icon-Button „In neuem Fenster öffnen“; die Zellgröße steht im [Panel „Einstellungen“](#panel-einstellungen) |
| Spieler | Status „N Spieler verbunden“ (`playerStatusText`), in der Mitte „Spieler QR-Code“ (`text.sm`), rechts Icon-Button „QR-Code“ (`qrCode.svg`, `aria-pressed`): schaltet das Wall-Overlay auf `join` bzw. von `join` auf `off`, aktiv solange der Server `join` meldet ([Panel „Spieler verbinden“](#panel-spieler-verbinden)) |
| Farbe | Text in `text.color`, nicht `text.muted` (auf `secondary` verfehlt `text.muted` im Theme Tavern 4,5:1) |

## Spielerzeile

Nur im Panel „Party“, Komponente `PlayerListItem` ([src/components/PlayerListItem.tsx](../../src/components/PlayerListItem.tsx),
Avatar und Text als `PlayerRowContent`, auch in der [Charakterzeile](#charakterzeile);
Zeile, Name und Details als gemeinsame Styled Components `ListRow`, `RowInfo`, `RowName`, `RowDetails`, `RowList` in
[ListRow.tsx](../../src/components/ListRow.tsx), auch für die [Initiative-Zeile](#initiative-zeile)),
ohne Level-Chip (das Level steht einmal im
Kopf) und ohne hervorgehobene Zeile (es gibt keine Auswahl). Prop `player`.

| Eigenschaft | Wert |
|---|---|
| Element | `<li>` mit dem Charakternamen als `aria-label`, `lang="de"` |
| Fläche | `background`, Innenabstand `space.2`, `radius.lg` |
| Aufbau | `display: flex`, vertikal zentriert, `gap` `space.3`: links der Avatar, rechts Charaktername (`text.sm` `medium`) und darunter „Volk · Klasse · Spielername“ (`text.sm`, `text.muted`), beide umbrechend mit Silbentrennung |
| Avatar | [Kampf-Avatar](#kampf-avatar) eines Spielers in Größe `md` (40px): Fläche `secondary`, Rand `borderWidth.thin` in `border`, `radius.md`; Bild aus `avatar` über `mediaUrl` mit `object-fit: cover`, ohne Bild die Initialen (`characterInitials`) in `text.sm` `medium`, Farbe `initials` |

## Level-Stepper

Nur im Kopf des Panels „Party“, Komponente `LevelStepper` ([src/components/LevelStepper.tsx](../../src/components/LevelStepper.tsx)).

| Eigenschaft | Wert |
|---|---|
| Aufbau | `display: flex`, vertikal zentriert, `gap` `space.1`: [Label](#label) „Level“ (danach zusätzlich `space.2`), Icon-Button „−“, Level, Icon-Button „+“ |
| Level | `text.lg` `semibold`, `tabular-nums`, zentriert, `min-width` `LEVEL_MIN_WIDTH`; ohne Abenteuer „–“ |
| Buttons | [Icon-Button](#icon-button) `PanelButton` mit Zeichen statt Icon, zugängliche Namen „Level verringern“ und „Level erhöhen“; an den Grenzen 1 und 20 und ohne Abenteuer `disabled` |
| Bedienung | ein Klick speichert das neue Level; die Anzeige ändert sich erst mit dem Push des Servers |

## Hero-Karte

Im Panel „Am Zug“ des Admins während eines Kampfes, Komponente `HeroCard`
([src/components/HeroCard.tsx](../../src/components/HeroCard.tsx)). Props `avatar`, `caption`, `name`, `chips`, `level` (nur bei
Spielern), optional `badge` (neben der Überschrift) und `fill`. Im Player Screen oben als eigene Karte mit dem
eigenen Charakter (siehe [Hero-Karte im Player](#hero-karte-im-player)).

| Eigenschaft | Wert |
|---|---|
| Element | `<article>` mit dem Namen als `aria-label`, `lang="de"`; ohne eigene Fläche (steht direkt im Dashboard-Panel) |
| Aufbau | `display: flex`, vertikal zentriert, `gap` `space.5`: links Avatar mit Level-Badge, rechts eine Spalte (`gap` `space.1`) aus Überschrift ([Label](#label): Spielername bzw. „Gegner“/„Verbündeter“; nicht gedämpft, weil `text.muted` auf `secondary` in Tavern 4,5:1 verfehlt), Name (`text.xl` `semibold`, bricht um mit Silbentrennung) und den Chips (`padding-top` `space.1`) |
| Avatar | [Kampf-Avatar](#kampf-avatar) in Größe `hero`: `size.avatar.width` × `size.avatar.height`, `radius.lg`; Initialen bzw. Nummer in `text.2xl` `medium` |
| Level-Badge | nur bei Spielern, über der oberen linken Ecke des Avatars (`top`/`left` −`space.2`), `size.badge`, `radius.pill`, Fläche `primary`, Zahl `onPrimary` `text.sm` `medium` `tabular-nums`, Ring `borderWidth.thick` in `secondary` (Farbe der Kachel); zeigt das Level des Abenteuers |
| Chips | Volk und Klasse bzw. die Bezeichnung eines NPCs (ohne Bezeichnung keine), umbrechend mit `gap` `space.1`; Innenabstand `0 space.2`, `text.sm`, Fläche `background`, Rand `borderWidth.thin` in `border`, `radius.md` |
| Fuß im Panel „Am Zug“ | `TurnPanel`: unter der Karte eine Trennlinie (`borderWidth.thin` `border`, `padding-top` `space.3`), links „Als Nächstes:“ bzw. „Runde N+1:“ (`text.sm`) mit kleinem Kampf-Avatar und Name (`text.sm` `medium`, einzeilig mit Ellipse), rechts der [Text-Button](#text-button) „Zug beenden“ (`active`); ohne Zug nur „Niemand am Zug – alle Teilnehmer sind ausgeschieden.“ (`text.sm`) |
| Nicht umgesetzt | Effektzeile, Variante „Kachel“ |

### Hero-Karte im Player

Obere Hälfte des Player Screens, Komponente `PlayerHeroCard`
([src/components/PlayerHeroCard.tsx](../../src/components/PlayerHeroCard.tsx)) um die `HeroCard` mit `fill`
(Querformat; Effekte und Detail-Sheet sind Soll).

| Eigenschaft | Wert |
|---|---|
| Element | `<section>` mit `aria-label` „Charakter“, Fläche wie die [Kachel](#kachel) (`tileSurface`, durchscheinend mit Hintergrundbild); Ebene `layer.raised`, damit die Liste des Settings-Menüs über der Ressourcen-Karte liegt |
| Aufbau | Grid `minmax(0, 1fr) auto`, `gap` `space.5`, Innenabstand `space.3 space.3 space.3 space.4`: links die `HeroCard` (mit `fill` als Grid `auto minmax(0, 1fr)`, eine Zeile `minmax(0, 1fr)`), rechts eine Spalte mit dem [Settings-Menü](#settings-menü) oben und „Zug beenden“ unten (`space-between`), sodass der Text nie darunter läuft |
| Avatar | [Kampf-Avatar](#kampf-avatar) in Größe `fill`: so hoch wie die Karte innen, Breite aus dem Seitenverhältnis 3:4; `radius.lg`, Initialen `text.2xl` `medium`; Level-Badge wie in der Hero-Karte |
| Text | Spielername als Überschrift, Charaktername, Chips Volk und Klasse (wie in der Hero-Karte); solange die Spieler laden, nur das Settings-Menü |
| Am Zug | Rand `primary` und innerer Ring `borderWidth.thin` in `primary` statt der Lichtkante (die Fläche bleibt); Badge „Am Zug“ neben dem Spielernamen ([Label](#label) mit Fläche `primary`, Text `onPrimary`, Innenabstand `0 space.2`, `radius.pill`, `gap` `space.2`) |
| „Zug beenden“ | nur am Zug; [Text-Button](#text-button) `active` mit Icon `next.svg` (`size.icon`, `onPrimary`) und `gap` `space.2`, Höhe `size.control.lg`; Fokus-Outline `borderWidth.thick` in `text.color`. Während der Anfrage `disabled` und `aria-busy`; schlägt sie fehl, darunter (`gap` `space.1`) „Zug konnte nicht beendet werden“ (`text.xs` `medium` in `negative.text`, `role="alert"`) bis zum nächsten Tipp oder Push |

## Kampf-Avatar

Komponente `CombatantAvatar` ([src/components/CombatantAvatar.tsx](../../src/components/CombatantAvatar.tsx)), für
Spielerzeile, Panel „Kampf“, Initiative, „Als Nächstes“, Hero-Karte (Admin und Player) und die [Wall-Kachel](#wall-kachel). Props `kind`,
`text`, `image`, `size`, `onTile`.

| Eigenschaft | Wert |
|---|---|
| Größe | `sm` 32px und `md` 40px (`AVATAR_SIZE`, `radius.md`, Schrift `text.sm`), `hero` `size.avatar.*` (`radius.lg`, `text.2xl`), `fill` 100 % der Box darum (Hero-Karte im Player, `radius.lg`, `text.2xl`); auf der Wall (`WALL_AVATAR_SIZE`, Hochformat 3:4) `party` 84 × 112px und `initiative` 72 × 96px (`radius.md`, `text.xl`), `turn` 120 × 160px (`radius.lg`, `text.2xl`); Schrift `medium`, `tabular-nums` |
| Spieler | Fläche nach Untergrund: direkt auf der Kachel (`onTile`: Hero-Karte in „Am Zug“, „Als Nächstes“, Wall-Kachel) `background`, auf Zeilen mit Fläche `background` (Spielerzeile, Initiative, Panel „Kampf“) `secondary`; Rand `borderWidth.thin` in `border`, Initialen in `initials`; mit Bild das Bild (`object-fit: cover`) |
| Gegner / Verbündeter | Nummer statt Initialen; Gegner in `negative`, Verbündete in `positive` (Fläche `.surface`, Rand `.border`, Zahl `.text`; in beiden Themes gleich), unabhängig vom Untergrund |

## Panel „Kampf“

Inhalt des Menüpunkts „Kampf“, Komponente `FightPanel` ([src/components/FightPanel.tsx](../../src/components/FightPanel.tsx)).
Ohne Kampf die lokale Vorbereitung, im Kampf die Liste des Servers; derselbe Aufbau.

| Eigenschaft | Wert |
|---|---|
| Aufbau | Spalte, `gap` `space.3`, mindestens so hoch wie das Panel: Kopf ([Label](#label) „Kampf vorbereiten“ bzw. „Kampf“ und rechts das Label „Runde N“), Hinweis „Reihenfolge = Initiative“ (`text.sm`, Innenabstand `0 space.1`), Liste, Trennlinie, Label „Hinzufügen“ bzw. „Verstärkung“, [Segment-Control](#segment-control) „Gegner“/„Verbündeter“, Nummer und Bezeichnung, Hinweis, ggf. Fehlermeldung, Text-Button „Hinzufügen“ (`cancel`), Buttons „+ Vorname“, unten (`margin-top: auto`) „Kampf starten“ (`active`, deaktiviert mit Deckkraft 0,5) bzw. „Kampf beenden“ (`cancel`) |
| Zeile | `<li>` im `<ol>` (`gap` `space.1`), Grid `AVATAR_COLUMN minmax(0, 1fr) auto`, `gap` `space.2`, Innenabstand `space.1`, Fläche `background`, `radius.md`: [Kampf-Avatar](#kampf-avatar) `sm`, Name (`text.sm` `medium`) und Details (`text.xs` `text.muted`), beide einzeilig mit Ellipse; rechts die Mini-Buttons. Am Zug: innerer Rahmen `borderWidth.thick` in `primary`; ausgeschieden: Deckkraft 0,5 |
| Mini-Buttons | `MiniButton` ([src/components/MiniButton.tsx](../../src/components/MiniButton.tsx)): „Nach vorn“/„Nach hinten“ (`chevronUp.svg`/`chevronDown.svg`) übereinander je `MINI_BUTTON_SIZE` × `MOVE_BUTTON_HEIGHT`, daneben „Entfernen“ (`close.svg`) `MINI_BUTTON_SIZE`; Icon `MINI_ICON_SIZE` in `text.muted`, ohne Fläche, Hover Fläche `secondary` und Icon `text.color`; an den Enden deaktiviert (Deckkraft 0,25); Name als `aria-label` und `title` |
| Felder | Grid `NUMBER_FIELD_WIDTH minmax(0, 1fr)`, `gap` `space.2`; je `size.control.md` hoch, Fläche `background`, Rand `borderWidth.thin` in `border`, `radius.md`, `text.sm`, Platzhalter `text.muted`; Nummer vorbelegt mit der kleinsten freien Nummer, Enter in einem Feld wirkt wie „Hinzufügen“ |
| Fehlermeldung | „Nummer N ist schon vergeben.“ bzw. „Nummer 1–99 eingeben.“, `text.sm` in `negative.text`, `role="alert"`; verschwindet bei der nächsten Eingabe |
| Buttons „+ Vorname“ | Spieler, die nicht in der Liste stehen; Höhe `size.control.md` − `space.2`, Innenabstand `0 space.3`, Fläche `background`, `text.sm` `medium`, `radius.md`; Hover Fläche `primary`, Text `onPrimary` |

## Initiative-Zeile

Im Panel „Initiative“ des Dashboards während eines Kampfes, Komponente `InitiativePanel`
([src/components/InitiativePanel.tsx](../../src/components/InitiativePanel.tsx)) auf Basis der
[Spielerzeile](#spielerzeile). Kopf des Panels: „Initiative · N“ und rechts „Spieler n · Gegner n · Verbündete n“
(`text.sm`); im Kopf von „Am Zug“ rechts das Label „Runde N“.

| Eigenschaft | Wert |
|---|---|
| Zeile | wie die Spielerzeile (`ListRow`, Fläche `background`, `radius.lg`, `gap` `space.3`), `aria-current="step"` beim Teilnehmer am Zug: innerer Rahmen `borderWidth.thick` in `primary` und das Label „Am Zug“ in `primary`; ausgeschieden: Deckkraft 0,5 |
| Inhalt | [Kampf-Avatar](#kampf-avatar) `md`, Name (`text.sm` `medium`) und Details (`text.sm` `text.muted`: Spieler „Volk, Klasse · Spielername“, NPCs die Bezeichnung; ausgeschieden davor „Tot“ bzw. „Besiegt“) |
| Totenkopf | Icon-Button `size.control.md` (`skull.svg`, `size.icon`) ohne Fläche, Hover `secondary`; `aria-pressed`, zugänglicher Name „Tot“ bzw. „Besiegt“, Tooltip „Als tot markieren“/„Als besiegt markieren“ bzw. markiert „Wieder im Kampf“; markiert Fläche `negative.surface`, Icon `negative.text` |

## Status-Punkt

Nur im Panel „Spieltisch“ des Admins ([Spieltisch-Zeile](#spieltisch-zeile)).

| Eigenschaft | Wert |
|---|---|
| Größe | `STATUS_DOT_SIZE`, `radius.pill`, vor dem Statustext mit `gap` `space.2` |
| Zustände | verbunden: gefüllt in `primary`; nicht verbunden: nur Ring `borderWidth.thick` in `text.color` – erkennbar an der Form, nicht nur an der Farbe; vor der ersten Meldung des Servers kein Punkt, Text „–“ |

## Ressourcen-Button

Nur im Player.

| Eigenschaft | Wert |
|---|---|
| Größe | füllt seine Zelle, mindestens `size.control.lg` hoch (Touch-Ziel) |
| Raster | Karte als Grid 4 × 2 (`repeat(4, minmax(0, 1fr))` × `repeat(2, minmax(0, 1fr))`), `gap` `space.3`, Innenabstand `space.4`; füllt die untere Hälfte des Player Screens. Kein sichtbares Label: Der Name der Ressource ist `aria-label` (Aktion, Bonusaktion, Bewegung, Spezial, „Zauberplätze I“–„IV“), damit die Karte in die halbe Höhe passt |
| Inhalt | Icon und Zahl, zentriert, `gap` `space.3`. Zauberplätze: Ziffer links, Plätze rechts (`space-between`) |
| Rahmen | `borderWidth.thick`, `radius.md` |
| Innenabstand Zauberplätze | `0 space.4`; die Plätze selbst `radius.sm` |
| Farbe | Zahl in `text.color`, keine eigene Rolle. Sonst nach [2.2](../../DESIGN.md#22-rollen) |
| Plätze | `SLOT_WIDTH` × `SLOT_HEIGHT`, `gap` `space.1` |
| Element | `<button type="button">` mit Reset (`padding`, `font: inherit`, `color` wie unter Farbe), per Tastatur bedienbar. Bewegung ist nicht antippbar: `<div>` (`as="div"`), `cursor: default` |
| Beispiele | Aktion, Bonusaktion, Bewegung (nicht antippbar), Spezial, Zauberplätze I–IV |

## Overlay-Panel

Nur auf der Wall (Weltkarte und QR-Code für die Spieler), durchscheinend. Gemeinsame Styled Components
`OverlayLayer`, `OverlayPanel`, `PanelHeader`, `PanelTitle` ([src/components/WallOverlay.ts](../../src/components/WallOverlay.ts)).

| Eigenschaft | Wert |
|---|---|
| Breite | Weltkarte: `min(OVERLAY_PANEL_MAX_WIDTH, 100vw − 2 × space.8, …)`, siehe [screen-layouts.md](screen-layouts.md#breite-des-overlay-panels); QR-Code: so breit wie der QR-Code plus Innenabstand, siehe [Panel „Spieler verbinden“](#panel-spieler-verbinden) |
| Weltkarte | das Bild mit `radius.md` |
| Titel | „Weltkarte“ bzw. „Spieler verbinden“, `text.xl` `semibold`, Abstand `space.5` nach unten |
| Position | `space.7` unter der Oberkante, horizontal mittig |
| Fläche | [Kachel](#kachel), durchscheinend (`tileSurface` mit `$isTranslucent`), Innenabstand `space.6` |
| Abdunklung | solange das Panel zu sehen ist, liegt darunter über dem ganzen Screen `overlay` (wie beim [Dialog](#dialog)); Panel und Abdunklung in `layer.panel`, über Party und Initiative (`layer.tiles`) |

## Panel „Spieler verbinden“

[Overlay-Panel](#overlay-panel) bei Wall-Overlay `join`, Komponente `WallJoinPanel`
([src/components/WallJoinPanel.tsx](../../src/components/WallJoinPanel.tsx)); nur eingehängt, solange das Overlay `join`
ist, und lädt dabei `GET /table/join`.

| Eigenschaft | Wert |
|---|---|
| Breite | QR-Code plus Innenabstand: `Q + 2 × space.6`, `Q` siehe [screen-layouts.md](screen-layouts.md#größe-des-qr-codes) |
| Aufbau | Spalte, zentriert: Titel „Spieler verbinden“, QR-Code (Kantenlänge `Q`, `qrcode.react`), darunter mit Abstand `space.5` die URL (`text.lg`, bricht überall um); während des Ladens nur der Titel; ohne URL oder bei Ladefehler statt Code und URL der Hinweis „Player-URL unbekannt …“ (`text.lg`) |
| QR-Code | Module `qr.foreground` auf `qr.background`, unabhängig vom Theme; Ruhezone `QR_CODE_MARGIN` Module im Grund des Codes |
| Bedienung | keine (Anzeige); umgeschaltet wird im Admin über den Icon-Button „QR-Code“ der [Spieltisch-Zeile](#spieltisch-zeile) „Spieler“ |
| Kopfzeile | Überschrift, `space.5` zum Inhalt |

## Wall-Kachel

Ein Charakter auf der Wall, Komponente `WallCharacterTile`
([src/components/WallCharacterTile.tsx](../../src/components/WallCharacterTile.tsx)).
Props `variant` (`party`, `initiative`, `turn`), `kind`, `avatarText`, `image`, `name`, `details`, `isDead`, `header`.

| Eigenschaft | Wert |
|---|---|
| Element | `<article>` mit dem Namen als `aria-label`, `lang="de"`; Fläche [Kachel](#kachel), durchscheinend |
| Aufbau | Spalte, zentriert, Text zentriert: optional der Kopf, [Kampf-Avatar](#kampf-avatar) (`onTile`, Größe wie die Variante), darunter Name (`semibold`) und Details, beide einzeilig mit Ellipse und in `text.color` (nicht `text.muted`, die Kachel liegt ohne Abdunklung auf dem Szenenbild); Details ohne Inhalt behalten ihre Zeilenhöhe |
| `party` | Breite `WALL_TILE_SIZE.party`, Innenabstand `space.4 space.3`, `gap` `space.2`; Name `text.lg`, Details `text.sm` |
| `initiative` | `WALL_TILE_SIZE.initiative` (Breite und feste Höhe), Innenabstand `space.3`, `gap` `space.2`; Name `text.md`, Details `text.sm` |
| `turn` | Breite `WALL_TILE_SIZE.turn`, Innenabstand `space.4`, `gap` `space.3`; Name `text.xl`, Details `text.md`; Rahmen innen `borderWidth.thick` in `primary` (statt der Lichtkante), `aria-current="step"`; Kopf: [Label](#label) „Am Zug“ als Badge links (Fläche `primary`, Text `onPrimary`, Innenabstand seitlich `space.1`, `radius.sm`), Label „Runde N“ rechts |
| Tot | nur Spieler: Avatar und Text mit Deckkraft `DEAD_OPACITY`, „Tot“ statt „Volk · Klasse“; Totenkopf-Badge unten rechts am Avatar (`right`/`bottom` −`space.2`), `SKULL_BADGE_SIZE`, `radius.pill`, Fläche `negative.surface`, Icon (`skull.svg`, `SKULL_ICON_SIZE`) `negative.text`, Ring `borderWidth.thick` in `secondary` |

## Initiative-Leiste

Auf der Wall während eines Kampfes, Komponente `WallInitiative`
([src/components/WallInitiative.tsx](../../src/components/WallInitiative.tsx)); Logik in `src/utils/wallInitiative.ts`
(Warteschlange, Filter, Rundentrenner, Überlauf, Übergänge) und `src/utils/useInitiativeTransitions.ts` (Animation).

| Eigenschaft | Wert |
|---|---|
| Position | `position: fixed`, `space.6` unter der Oberkante, `space.7` links und rechts, `layer.tiles`; Flex-Zeile, Kacheln oben bündig, `gap` `WIDTHS.gap` |
| Reihenfolge | [Wall-Kachel](#wall-kachel) `turn` für den Teilnehmer am Zug, danach `initiative` in Initiative-Reihenfolge; besiegte NPCs fehlen (außer am Zug), tote Spieler bleiben. Ohne Teilnehmer am Zug nur `initiative`-Kacheln, ohne Rundentrenner |
| Rundentrenner | Kachel `WIDTHS.round` breit, `STRIP_TILE_HEIGHT` hoch: [Label](#label) „Runde“ über der Zahl (`text.2xl` `semibold` `tabular-nums`); steht, wo die Reihenfolge von vorn beginnt |
| „+N weitere“ | Kachel `WIDTHS.more` breit, `STRIP_TILE_HEIGHT` hoch: „+N“ (`text.2xl` `semibold`) über dem Label „weitere“; ersetzt die Teilnehmer, die nicht mehr in die Breite passen (gemessen per `ResizeObserver`) |
| Nachrücken | nur wenn der Teilnehmer am Zug wechselt: Kacheln gleiten 500 ms an neue Stelle und Größe (FLIP über die Web Animations API, `cubic-bezier(.2, .7, .2, 1)`); ans Ende Gerückte verblassen an der alten Stelle (Kopie in einer leeren Ebene, 300 ms, nach links) und kommen von rechts herein (500 ms, 100 ms verzögert); Weggefallene verblassen nach oben. Bei `prefers-reduced-motion: reduce` keine Animation |

## Vollbild-Overlay

Nur auf Wall und Ground, Komponente `FullscreenHoverOverlay`
([src/components/FullscreenHoverOverlay.tsx](../../src/components/FullscreenHoverOverlay.tsx)), im Screen als letztes
Element eingebunden.

| Eigenschaft | Wert |
|---|---|
| Ebene, Abdunklung | `layer.control`, `position: fixed`, `inset: 0`; Hintergrund `overlay` (wie beim [Dialog](#dialog)) |
| Aufbau | ganze Fläche ist ein Button (`cursor: pointer`), mittig eine durchscheinende [Kachel](#kachel) (`tileSurface` mit `$isTranslucent`) mit Innenabstand `space.5`; darin als Spalte (`gap` `space.3`) das Icon (`fullscreen.svg` bzw. im Vollbild `fullscreenExit.svg`, `size.icon`, `text.color`) und darunter der Text „Vollbild“ bzw. „Vollbild beenden“ (`text.lg` `semibold`, `text.color`) |
| Sichtbarkeit | nur gerendert, solange die Maus über dem Fenster ist (`pointerenter`/`pointermove` mit `pointerType` `mouse`, ausgeblendet bei `pointerleave`); Touch zeigt es nicht |
| Bedienung | Klick irgendwo schaltet das Vollbild des eigenen Fensters um (`useDocumentFullscreen`); `aria-label` wie der Text, `aria-pressed` = Vollbild-Zustand |

## Dialog

| Eigenschaft | Wert |
|---|---|
| Breite | `DIALOG_WIDTH` |
| Zuschnitt | `overflow: hidden` |
| Aufbau | Bild bündig oben (Format nach [1.4](../../DESIGN.md#14-regeln) Bilder), Textbereich mit Label, Titel und Beschreibung, Buttons rechts |
| Abstände | Innenabstand `space.5` seitlich und unten (oben bündig mit dem Bild), `radius.lg`; Abstände im Dialog nach [1.4](../../DESIGN.md#14-regeln) „Abstände nach Beziehung“ (Bild → Text → Buttons `space.4`, Dialog-Buttons `space.3`) |
| Button-Reihenfolge | Abbrechen links, Hauptaktion rechts außen |

Ohne Bild: Bestätigungsdialog `ConfirmDialog` ([src/components/ConfirmDialog.tsx](../../src/components/ConfirmDialog.tsx),
„Kampf beenden?“): `layer.dialog` über `overlay`, Kasten höchstens `CONFIRM_DIALOG_MAX_WIDTH` breit, Fläche `secondary`,
Rand `borderWidth.thin` in `border`, `radius.lg`, Innenabstand `space.5`, `gap` `space.3`; Titel `text.lg` `semibold`,
Text `text.sm`, Decline (`cancel`) und Confirm (`active`) rechts mit `gap` `space.2`; Esc entspricht
Decline. `role="dialog"`, `aria-modal`.

## Kopfzeile

Nur im Admin, Komponente `AdminHeader` ([src/components/AdminHeader.tsx](../../src/components/AdminHeader.tsx),
`data-test-id="admin-header"`). Feste Zeile über Notizen und Dashboard (über den Notizen allein bei ausgeblendetem
Dashboard), scrollt nie ([screen-layouts.md](screen-layouts.md#screen-layouts)).

| Eigenschaft | Wert |
|---|---|
| Aufbau | Flex-Zeile aus [Kacheln](#kachel), `gap` `space.4`: ganz links eine Button-Gruppe mit „Zurück“ (`arrowLeft.svg`) und „Vor“ (`arrowRight.svg`, `data-test-id="history-buttons"`), daneben Abenteuername (bzw. Hinweisleiste) über die ganze restliche Breite (`flex: 1`), rechtsbündig eine Button-Gruppe mit „Vollbild“ (`fullscreen.svg` bzw. `fullscreenExit.svg`) und „Dashboard“ (`dashboard.svg`). Die linke Gruppe steht auch bei Hinweisleiste und ausgeblendetem Dashboard |
| Höhe | alle Kacheln gleich hoch: `size.control.md` plus Innenabstand und Rand der Button-Gruppen; Abenteuername und Hinweisleiste strecken sich auf diese Höhe; immer einzeilig |
| Abenteuername | Kachel mit dem Namen des aktiven Abenteuers, nur Anzeige (kein Button, `data-test-id="adventure-name"`): `text.md` `bold`, einzeilig mit Ellipse (voller Name als `title`), mittig, Innenabstand `0 space.5`; ohne Abenteuer „Kein Abenteuer“, solange die Abenteuer laden leer. Gewechselt wird in der Abenteuerauswahl ([Abenteuer-Karte](#abenteuer-karte)), beendet im [Panel „Einstellungen“](#panel-einstellungen) |
| Button-Gruppe | Kachel mit Innenabstand `space.1` und `gap` `space.1`; Buttons darin `radius.md`, so ergibt sich außen `radius.lg` |
| Buttons | [Icon-Buttons](#icon-button), inaktiv transparent, Hover `background`; Fokus als Outline `borderWidth.thick` in `primary`, `outline-offset` `borderWidth.thick` (`:focus-visible`). „Zurück“ und „Vor“ (`title` und `aria-label`, keine Toggle-Buttons): ohne Ziel im Verlauf `disabled`, Icon `text.muted`, ohne Hover-Fläche, `cursor: default`; nach dem Laden beide deaktiviert. „Dashboard“: aktiv bei offenem Dashboard Fläche `primary`, Icon `onPrimary` (auch bei Hover); Fokus als Outline `borderWidth.thick` in `primary`. „Vollbild“ wie „Dashboard“, aktiv solange das Admin-Fenster im Vollbild ist (`aria-pressed`) |
| Fehler | bei einem Fehler ersetzt die [Hinweisleiste](#hinweisleiste) den Abenteuernamen an derselben Stelle und in derselben Größe; die Button-Gruppe bleibt, das Abenteuer lässt sich währenddessen nicht beenden („Abenteuer beenden“ deaktiviert) |

## Auswahlliste

Button mit aufklappender Liste nach dem ARIA-Muster „Listbox“ statt nativem `select`, dessen Menü das Betriebssystem
zeichnet. Komponente `SelectList` ([src/components/SelectList.tsx](../../src/components/SelectList.tsx), Props
`options`, `value`, `onChange`, `label`, `isLocked`/`lockedTitle`, `isDisabled`); Theme-Auswahl im
[Panel „Einstellungen“](#panel-einstellungen). Die Logik der Liste (Öffnen, Tastatur, Fokus,
Schließen bei Klick außerhalb) steckt im Hook `useListbox` (`src/utils/useListbox.ts`), den auch das
[Settings-Menü](#settings-menü) nutzt.

| Eigenschaft | Wert |
|---|---|
| Button | Feld über die Breite des Panels: Höhe `size.control.md`, Fläche `background`, `radius.md`, Innenabstand `0 space.3`, Text `text.sm` `medium` `text.color` linksbündig (einzeilig mit Ellipse), Pfeil rechts; Fokus als Outline `borderWidth.thick` in `primary`, `outline-offset` `borderWidth.thick` (`:focus-visible`); ohne Einträge oder deaktiviert (`isDisabled`) `disabled`, Text und Pfeil `text.muted`, `cursor: default`. `aria-haspopup="listbox"`, `aria-expanded` |
| Chevron | rechts im Button, SVG-`polygon` (`viewBox 0 0 20 20`), `size.icon`, `fill` in der Textfarbe des Buttons; geöffnet um 180° gedreht. Gesperrt (`isLocked`) statt des Chevrons das Schloss (`padlock.svg`, `text.muted`), `aria-disabled="true"`, `cursor: not-allowed`, Tooltip „Während des Kampfes nicht wechselbar“; die Liste öffnet sich nicht |
| Liste | direkt unter dem Button und so breit wie er (`position: absolute`, `top: calc(100% + space.1)`, `left`/`right` 0); Fläche `secondary`, Rand `borderWidth.thin` in `border`, `radius.lg`, Innenabstand `space.1`, `gap` `space.1`, ohne `box-shadow`; höchstens `SELECT_LIST_MAX_HEIGHT` hoch, darüber scrollt sie; Ebene `layer.popover` |
| Eintrag | Höhe, Innenabstand und Schrift wie beim [Navigationseintrag](#navigationseintrag) (`text.sm` `medium`, `radius.md`, einzeilig mit Ellipse, voller Name als `title`), Fläche nicht gewählter Einträge aber wie die Liste. Gewählt: Fläche `primary`, Text `onPrimary`. Hover und Fokus: Fläche `background`. Gewählt mit Tastatur-Fokus (`:focus-visible`): bleibt `primary`, dazu Outline `borderWidth.thick` in `onPrimary`, nach innen versetzt (`outline-offset` −`borderWidth.thick`), damit die scrollende Liste sie nicht abschneidet. Nicht gewählt mit Tastatur-Fokus: Fläche `background`, dazu dieselbe innere Outline in `primary`. Hover und Maus ohne Outline. `role="option"`, `aria-selected` |
| Bedienung | Klick auf den Button öffnet und schließt. Am Button öffnen Enter, Leertaste und Pfeil runter/hoch, der Fokus steht dann auf dem gewählten Eintrag. In der Liste bewegen Pfeile (ohne Umlauf) und Pos1/Ende; Enter/Leertaste wählen und schließen; Esc schließt und setzt den Fokus zurück auf den Button; Tab und Klick außerhalb schließen. Den gewählten Eintrag erneut zu wählen schließt nur |

## Settings-Menü

Nur im Player (Charakterauswahl und Player Screen), Komponente `SettingsMenu`
([src/components/SettingsMenu.tsx](../../src/components/SettingsMenu.tsx), Props `themeOverride`,
`onChangeThemeOverride`, optional `onSwitchCharacter`, `placement`, `isTranslucent`). Aufbau und Bedienung wie die
[Auswahlliste](#auswahlliste), mit diesen Abweichungen:

| Eigenschaft | Wert |
|---|---|
| Button | Icon-Button mit Settings-Icon, `size.control.lg`, Fläche nach [Icon-Button](#icon-button) (Player); zugänglicher Name „Einstellungen“, `aria-haspopup="menu"` |
| Liste | `role="menu"`, deckend `secondary`, ohne Höhenbegrenzung, Ebene `layer.popover` (siehe [1.2](../../DESIGN.md#12-tokens) Ebenen); Player Screen und Charakterauswahl rechts am Button (`placement` `end`) |
| Einträge | „Wie Spieltisch“, „Cyber“, „Taverne“ (`menuitemradio`, `aria-checked`); Höhe `size.control.lg` (Touch-Ziel), Innenabstand `0 space.4`. Nur im Player Screen danach eine Trennlinie (`borderWidth.thin` in `border`, seitlich `space.2` eingerückt) und „Charakter wechseln“ (`menuitem`, Wechsel-Icon `swap.svg` in `size.icon`, `gap` `space.3`), per Tastatur erreichbar wie die anderen |
| Bedienung | zusätzlich schließt Tippen außerhalb (`pointerdown`) |

## Charakterzeile

Nur in der Charakterauswahl (`PlayerSelectScreen`): ein `<button>` je Charakter in einem `<li>`, aufgebaut aus
`ListRow` und dem Inhalt der [Spielerzeile](#spielerzeile) (`PlayerRowContent`), rechts ein Pfeil
(`chevronRight.svg`, `size.icon`, `text.muted`). Mindesthöhe `size.control.lg`; Fokus als Outline
`borderWidth.thick` in `primary` mit `outline-offset` `borderWidth.thick`. Liste als Grid
`repeat(auto-fill, minmax(min(100%, CHARACTER_COLUMN_MIN_WIDTH), 1fr))` mit `gap` `space.2`: im Hochformat eine
Spalte, im Querformat mehrere.

## Zustand der Karte „Party“

Nur in der Charakterauswahl: Statt der Liste steht in der Karte (Label nur „Party“) beim Laden drei Platzhalter-Zeilen
(Fläche wie die Zeile, Blöcke in `secondary`, pulsierend, ohne Animation bei „Bewegung reduzieren“), sonst mittig
untereinander mit `gap` `space.3`: Icon (`STATE_ICON_SIZE`, `text.color`), Titel (`text.lg` `semibold`), Text
(`text.sm`, höchstens `STATE_TEXT_MAX_WIDTH` breit) und bei „Keine Verbindung zum Spieltisch“ der
[Text-Button](#text-button) „Erneut versuchen“ (Variante `cancel`, Höhe `size.control.lg`, mit `reload.svg`).
Icons: `hourglass.svg` (kein Abenteuer), `people.svg` (keine Charaktere), `wifiOff.svg` (keine Verbindung). Der
Hinweis nach Abenteuerwechsel steht als eigene [Karte](#karte) über der Party: Rand `primary`, `info.svg` in
`primary`, Text `text.sm` `medium`, Innenabstand `space.3 space.4`, `role="status"`.

## Abenteuer-Karte

Nur in der Abenteuerauswahl (`/admin`), Komponente `AdventureCard`
([src/components/AdventureCard.tsx](../../src/components/AdventureCard.tsx), `data-test-id="adventure-card-<id>"`).
Die ganze Karte ist ein `<button>` (Tab, Enter, Leertaste), daher besteht ihr Inhalt nur aus `span`s.

| Eigenschaft | Wert |
|---|---|
| Fläche | wie die [Kachel](#kachel) (`tileSurface`, immer durchscheinend über `background`), ohne Innenabstand; Inhalt bündig oben, `overflow: hidden` |
| Bild | Abenteuerbild 16:9 über die volle Breite, `object-fit: cover`; ohne Bild Fläche `background` mit `image.svg` (`PLACEHOLDER_ICON_SIZE`, `text.muted`) |
| Labels auf dem Bild | oben links (`space.3`) als Pille ([Label](#label), Innenabstand `space.1 space.2`, `radius.pill`): „Aktiv“ in `onPrimary` auf `primary` beim aktiven Abenteuer; „Gesperrt“ mit `padlock.svg` auf `secondary` bei gesperrter Karte |
| Inhalt | Spalte, Innenabstand `space.4`, `gap` `space.3`: Name (`text.lg` `semibold`, bricht um) mit rechts dem Level-Badge (`size.badge`, `radius.pill`, Fläche `primary`, Zahl `onPrimary` `text.sm` `medium`, ohne Ring); Beschreibung (`text.sm`, höchstens zwei Zeilen mit „…“, entfällt ohne Beschreibung; nicht gedämpft, weil `text.muted` auf `secondary` in Tavern 4,5:1 verfehlt); [Label](#label) „Party · N“ und die Mitglieder |
| Mitglieder | Grid mit zwei Spalten, `gap` `space.2`; je Mitglied eine Fläche `background` (`radius.md`, Innenabstand `space.1`, `gap` `space.2`) mit [Kampf-Avatar](#kampf-avatar) `sm`, Charaktername (`text.sm` `medium`) und Spielername (`text.xs`, `text.muted`), beide einzeilig mit Ellipse. Ab 7 Mitgliedern die ersten 5 und „+N weitere“ (`partyPreview`, `src/utils/adventureSelect.ts`), ohne Mitglieder „Noch keine Charaktere“ (`text.sm`) |
| Aktiv | Rahmen `borderWidth.thick` in `primary` |
| Gesperrt | während eines Kampfes im aktiven Abenteuer alle anderen Karten: Deckkraft `LOCKED_OPACITY`, `aria-disabled="true"`, `cursor: not-allowed`, Tooltip „Während des Kampfes nicht wechselbar“; ein Klick tut nichts |
| Fokus | Outline `borderWidth.thick` in `primary`, `outline-offset` `borderWidth.thick` (`:focus-visible`) |
| Übergang zum Admin | View Transition ohne Library: Beim Starten (nach erfolgreichem Speichern) und Fortsetzen wächst das Bild der angeklickten Karte (`adventure-hero`) in 500 ms (`MOTION_EASING`) zum [Abenteuer-Hintergrund](#abenteuer-hintergrund) und blendet dabei von hell zu abgedunkelt über; Kopf (`adventure-select-head`) und Karten (`adventure-card-<Platz>`, die ersten `NAMED_CARD_COUNT`) sinken 16px und blenden aus (260 ms, `ease-in`), der Rest der Seite blendet aus (250 ms). Rückweg beim Beenden: Das Bild schrumpft in die Karte, Kopf und Karten steigen von 16px unten auf (300 ms, Kopf ab 300 ms, Karten ab 350 ms, je Karte 60 ms später). Gewartet wird höchstens `HERO_WAIT_MS` (300 ms) auf das Bild im Admin bzw. die Karte in der Auswahl, sonst ohne wachsendes bzw. schrumpfendes Bild. Bei „Bewegung reduzieren“ und ohne View Transitions API kein Übergang |

## Zustände der Abenteuerauswahl

Alle Flächen der Auswahl außer dem Fehler beim Starten sind wie die [Abenteuer-Karte](#abenteuer-karte) immer
durchscheinend. Statt der Karten steht beim Laden ein Raster aus drei Platzhalter-Karten (Fläche wie die Karte, Bildfläche 16:9 und
zwei Textbalken `SKELETON_TEXT_HEIGHT` in `background`, pulsierend, ohne Animation bei „Bewegung reduzieren“), sonst
eine [Kachel](#kachel) mit mittig untereinander (`gap` `space.3`) „Noch keine Abenteuer“ bzw. Icon `wifiOff.svg`
(`STATE_ICON_SIZE`), „Keine Verbindung zum Server“ (beide `text.lg` `semibold`) und dem
[Text-Button](#text-button) „Erneut versuchen“ (Variante `cancel`, mit `reload.svg`). Über den Karten stehen bei
Bedarf der Kampf-Hinweis (wie der Hinweis nach Abenteuerwechsel im Player: Rand `primary`, `info.svg`, `text.sm`
`medium`, `role="status"`) und der Fehler beim Starten (Fläche und Rand `error`, Text `onError`, `role="alert"`).

## Panel „Einstellungen“

Nur im Admin, Komponente `SettingsPanel` ([src/components/SettingsPanel.tsx](../../src/components/SettingsPanel.tsx),
`data-test-id="settings-panel"`), Inhalt des Menüpunkts „Einstellungen“ der [Navigationsleiste](#navigationsleiste).
Bündelt, was der Spielleiter einmal einstellt.

| Eigenschaft | Wert |
|---|---|
| Aufbau | Spalte aus zwei Abschnitten, `gap` `space.5`, mindestens so hoch wie das Panel; je Abschnitt ein Label (wie „Szenen“ im Panel „Szenen“, Innenabstand `0 space.3`) und darunter mit `gap` `space.2` die Steuerung; ganz unten (`margin-top: auto`) der Button „Abenteuer beenden“ |
| Darstellung | [Auswahlliste](#auswahlliste) (zugänglicher Name „Darstellung“) mit „Cyber“ und „Taverne“, gewählt ist das Theme des Spieltischs |
| Ground-Raster | Zeile „Zellgröße“ (`text.sm`) mit dem Wert rechts (`SliderValue`), Innenabstand `0 space.3`; darunter der Slider (`PanelSlider`, 100–200, Schritt 10, gespeichert beim Loslassen) |
| Abenteuer beenden | Feld über die Breite des Panels wie der Button der [Auswahlliste](#auswahlliste) (Fläche `background`, `radius.md`, Fokus-Outline), aber Mindesthöhe `size.control.lg`, Innenabstand `space.2 space.3` (`data-test-id="end-adventure"`). Zwei Zeilen (Grid, Spaltenabstand `space.3`, Zeilenabstand `0`), weil Text und Name im 240px breiten Panel nicht nebeneinander passen: oben „Abenteuer beenden“ (`text.sm` `medium`), darunter der Name des Abenteuers (`text.sm` `regular`, `text.muted`, einzeilig mit Ellipse), rechts über beide Zeilen vertikal zentriert `logout.svg` (`size.icon`). Klick öffnet den [Dialog](#dialog) `ConfirmDialog` „Abenteuer beenden“. Gesperrt während eines Kampfes: `padlock.svg` statt des Icons, `aria-disabled="true"`, `cursor: not-allowed`, Tooltip „Während des Kampfes nicht wechselbar“, kein Dialog; deaktiviert (`disabled`, Text `text.muted`), solange die [Hinweisleiste](#hinweisleiste) steht |

## Hinweisleiste

Nur im Admin, Komponente `ErrorBar` ([src/components/ErrorBar.tsx](../../src/components/ErrorBar.tsx)). Erscheint nur bei
einem Fehler, sonst ist sie nicht vorhanden. Stehen mehrere Fehler an, zeigt sie nur den wichtigsten in der
Reihenfolge Verbindung getrennt → Laden fehlgeschlagen → Speichern fehlgeschlagen (`mostImportantError` in
`src/utils/adminError.ts`); ist er behoben, erscheint der nächste.

| Eigenschaft | Wert |
|---|---|
| Position | in der [Kopfzeile](#kopfzeile) an der Stelle und in der Größe des Abenteuernamens ([screen-layouts.md](screen-layouts.md#screen-layouts)) |
| Form | [Kachel](#kachel) mit Fläche `error` (Rand und Lichtkante in `border`) |
| Aufbau | `display: flex`, `justify-content: center`: Text und Icon-Button „Erneut versuchen“ zentriert nebeneinander, `gap` `space.4`; Text einzeilig mit Ellipse, damit die Kopfzeile ihre Höhe behält |
| Button | Icon-Button als Ausnahme ohne `size.control.md`: nur so groß wie das Icon (`reload.svg`, `size.icon`, etwa Texthöhe); Icon in `onError`, ohne eigene Fläche und Rahmen; zugänglicher Name „Erneut versuchen“ (`aria-label`, `title`); Fokus als Outline `borderWidth.thick` in `onError` (`:focus-visible`) |
| Innenabstand | `space.1` oben/unten, `space.5` seitlich |
| Farbe | Fläche `error`, Text und Icon `onError` ([2.2](../../DESIGN.md#22-rollen)) |
| Rolle | `role="alert"` |

## Slider

Nur in Panels des Admins: gemeinsame Komponente `PanelSlider`
([src/components/PanelSlider.tsx](../../src/components/PanelSlider.tsx)) mit `PanelSliderArea` (Fläche um den Slider)
und `SliderValue` (Wert), waagerecht für die Lautstärke („Audio“) und die Zellgröße (Panel „Einstellungen“,
Abschnitt „Ground-Raster“).

| Eigenschaft | Wert |
|---|---|
| Größe | „Audio“: volle Breite zwischen Icon und Wert; Zellgröße: volle Breite des Panels, der Wert steht darüber rechts in der Zeile „Zellgröße“ |
| Schiene und Füllung | 4px (MUI-Standard), Schiene `background`, Füllung `primary`, `radius.pill` |
| Griff | `PANEL_SLIDER_THUMB_SIZE`, `text.color`; ein halber Griff Abstand links und rechts (`PanelSliderArea`), die Touch-Fläche wird abgeschnitten |
| Stufen | Zellgröße rastet in 10er-Schritten ein, ohne sichtbare Punkte |
| Wert | rechts neben dem Slider bzw. (Zellgröße) rechts darüber (`SliderValue`), `text.sm` `semibold` `tabular-nums`, rechtsbündig, `min-width: SLIDER_VALUE_MIN_WIDTH`, ohne Einheit |
| Speichern | beim Loslassen; während des Ziehens der lokale Wert, danach der Wert des Servers |
