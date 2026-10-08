# Player Screen: Mapping der Styled Components auf das neue Layout

Stand: 2026-10-08 (Branch `development`). Entscheidungen getroffen, noch nicht umgesetzt. Die Spalte „Alter Wert“ beschreibt den heutigen Code.
Grundlage: Mockups [mockups/v2/player.png](mockups/v2/player.png) (844 × 390),
[player-667.png](mockups/v2/player-667.png) (667 × 375), [player-portrait.png](mockups/v2/player-portrait.png)
(390 × 844, Overlay „Handy drehen“) und dieselben drei in Tavern
([player-tavern.png](mockups/v2/player-tavern.png), [player-tavern-667.png](mockups/v2/player-tavern-667.png),
[player-portrait-tavern.png](mockups/v2/player-portrait-tavern.png)). Quelle [mockups/v2/build.py](mockups/v2/build.py).

Allgemeine Regeln, Tokens und Farbrollen: [DESIGN.md](../DESIGN.md). Die Konsistenz-Entscheidungen K1–K4 aus
[admin-mapping.md](admin-mapping.md#konsistenz-abgleich-2026-10-04) gelten hier genauso.

Anders als bei Admin, Wall und Ground gehören hier **auch Farben** zum Mapping: Der Player ist der letzte Screen mit
festen Farbwerten (DESIGN.md 2.5). Sie werden mit dem Umbau zur Rollen-Palette `resource.*`.

Betroffen sind nur `PlayerScreen.tsx` und `ResourceBarPlayer.tsx`. Kein anderer Screen nutzt sie.

## Tokens

Es gelten die Tokens aus [DESIGN.md](../DESIGN.md) 1.2. Neu für den Player (siehe [Entscheidungen](#entscheidungen)):

| Kategorie | Token / Konstante | Wert | Art |
|---|---|---|---|
| Bedienelemente | `size.control.lg` | 48px | Token (neu) |
| Ressourcen-Button | `RESOURCE_HEIGHT` | 64px | Layout-Konstante in `ResourceBarPlayer` |
| Zauber- und Spezialplatz | `SLOT_WIDTH` · `SLOT_HEIGHT` | 8 · 24px | Layout-Konstanten in `ResourceBarPlayer` |
| Icon im Overlay | `ROTATE_ICON_SIZE` | 96px | Layout-Konstante in `PlayerScreen` |
| Hochformat | `PORTRAIT_QUERY` | `(orientation: portrait)` | Konstante in `PlayerScreen`, ersetzt 649/650/739px |
| Farben | `resource.{action,bonus,movement,spell,special}.{strong,muted}`, `resource.empty` | siehe [Farben](#farben) | Farbrollen (neu), in beiden Themes gleich |

Legende für die Spalte **Hinweis**:

- **kein Token** – der neue Wert hat kein passendes Token (Layout-Maß oder fehlende Stufe).
- **wirkungslos** – die alte Regel hat heute keinen Effekt (fehlendes `position`, ungültiger Wert o. ä.).
- **Struktur** – der Wert lässt sich nicht allein im CSS umstellen, es braucht Änderungen am JSX oder anderen Dateien.
- **geteilt** – die Datei wird auch von anderen Screens genutzt. Eine Änderung wirkt dort mit.
- **neu** – die Regel gibt es bisher nicht.
- **Farbe** – betrifft eine Farbe. Beim Player Teil dieses Mappings (siehe oben).

Leere Hinweis-Zellen bedeuten: das Token passt direkt.

---

## Entscheidungen (2026-10-08)

| # | Frage | Entscheidung |
|---|---|---|
| P1 | Breakpoints 649/650/739px | Keine `breakpoint.*`-Tokens. Das Layout ist fließend (Grid mit 4 Spalten), nur das Overlay braucht eine Bedingung: `(orientation: portrait)` als Konstante `PORTRAIT_QUERY` in `PlayerScreen`. 649 und 739 entfallen ersatzlos. |
| P2 | Touch-Ziele | Neue Stufe `size.control.lg` = 48px für den Icon-Button am Smartphone (Material 48dp, über Apples 44pt). Ressourcen-Buttons 64px hoch (`RESOURCE_HEIGHT`, Layout-Konstante). |
| P3 | `GlobalStyle` | Auch im Player einbinden. Damit gilt DESIGN.md 1.1 für alle Screens. Hebt die Ausnahme aus DND-4 auf. |
| P4 | Ressourcenfarben | Rollen `resource.<art>.strong` / `.muted` und `resource.empty`, in beiden Themes gleich. Aktion `#077600` → `#099000`, Bonusaktion `#b23700` → `#db4400`, leer `#232321` → `#707070`. Damit erreichen Rahmen, Icons und Plätze 3:1. Verbraucht bleibt eine gefüllte Fläche (keine Kontur). |
| P5 | Feste Geometrie | Kreis und Dreieck als SVG (`<circle>`, `<polygon>`, `viewBox 0 0 20 20`) in `size.icon`, Farbe über `fill`. Plätze 8 × 24px (`SLOT_WIDTH`, `SLOT_HEIGHT`), Icon im Overlay 96px (`ROTATE_ICON_SIZE`), alle als Layout-Konstanten. |
| P6 | `z-index` 9 und 1 | Beide entfallen ohne neues `layer.*`: Das Overlay steht im JSX zuletzt und liegt als einziges positioniertes Element oben. |
| P7 | UI-Texte | Bleiben deutsch. Zahl in den Ressourcen in `text.color` statt `#9e998a` (keine Rolle `resource.text`). Neu: „Bitte das Handy quer halten“ im Overlay. |

---

## Layout

Heute: ein volles Band (Rahmen oben und unten) mit fünf Abschnitten nebeneinander, die Zauberplätze als vier kleine
Pillen in einem Abschnitt. Unter 740px schrumpft die Schrift, unter 650px verschwinden die Beschriftungen und das
Overlay deckt alles ab.

Neu (Mockup): Spalte, vertikal mittig. Oben der Settings-Button, darunter eine Karte mit zwei Zeilen zu je vier
gleich breiten Spalten:

1. Aktion · Bonusaktion · Bewegung · Spezial
2. Label „Zauberplätze“ über allen Spalten, darunter I · II · III · IV

Höhe bei 375px: 16 + 48 + 16 + Karte (24 + 16 + 12 + 64 + 16 + 16 + 12 + 64 + 24 = 248) + 16 = 344px. Passt ab
344px Höhe, also auf alle gängigen Smartphones im Querformat (667 × 375 und größer). Breite ab etwa 568px.

---

## PlayerScreen.tsx

### `GlobalStyle` (neu im Screen)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `<GlobalStyle />` | – (nur Admin, Wall, Ground) | im Screen rendern | **neu**, **Struktur** (P3). Damit gelten `box-sizing: border-box`, `margin: 0` und die Body-Schrift (`font.family.base`, `text.md`). Entfernt u. a. die Browser-Margins der `<p>` in den Ressourcen. |

### `Background`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `top/left/right/bottom`, `width`, `height` | `0` · `100%` | `inset: 0` | DESIGN.md 1.1: `position: fixed` immer mit `inset` |
| `position` | `fixed` | unverändert | Vollbild-Ebene |
| `flex-direction` | – (Zeile) | `column` | **neu** |
| `align-items` | `center` | entfällt (`stretch`) | Settings-Button und Karte füllen die Breite bzw. stehen links |
| `justify-content` | `center` | unverändert | vertikal mittig |
| `gap` | – | `space.4` (16px) | **neu**, Settings-Button → Karte |
| `padding` | – | `space.4 max(space.5, env(safe-area-inset-left), env(safe-area-inset-right))` | **neu**. Seitlich Notch berücksichtigen. **Struktur**, **geteilt**: wirkt nur mit `viewport-fit=cover` im Viewport-Meta von `index.html` (alle Screens, am Desktop ohne Effekt). |
| `font-family` | System-Stack mit Emoji-Schriften | entfällt | kommt aus dem `GlobalStyle` (`font.family.base`) |
| `font-size`, `line-height` | Browser (16px, `normal`) | `text.md` (16/24px) | K4, kommt aus dem `GlobalStyle` |
| `background-color`, `color` | `background`, `text.color` | unverändert | |
| `user-select` | `none` | unverändert | |

Hinweis: Die Einrückung der Regeln ist uneinheitlich (4 statt 2 Leerzeichen). Beim Umbau mit angleichen.

### `Overlay` („Handy drehen“)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width`, `height` | `100%` | `inset: 0` | DESIGN.md 1.1 |
| `display` | `flex`, Zentrierung | `grid`, `place-content: center`, `justify-items: center` | Icon über Text |
| `gap` | – | `space.4` (16px) | **neu** |
| `padding` | – | `space.5` (24px) | **neu** |
| `text-align` | – | `center` | **neu** |
| `z-index` | `9` | entfällt | P6. **Struktur**: `Overlay` als letztes Kind von `Background` rendern. Es ist dann das einzige positionierte Element (der Settings-Button ist nicht mehr `fixed`) und liegt ohne `z-index` oben. |
| Sichtbarkeit | sichtbar, `@media (min-width: 650px) { display: none }` | `display: none`, `@media ${PORTRAIT_QUERY} { display: grid }` | P1. Bedingung ist das Format, nicht die Breite. |
| `svg` `width`, `height` | `400px` | `ROTATE_ICON_SIZE` (96px) | **kein Token** (P5) |
| `svg` `color` | `text.color !important` | `text.color` ohne `!important` | `phone.svg` füllt mit `currentColor` |
| `svg` `animation` | `rotateAnimation 6s infinite ease-in-out` | unverändert | Dauer bleibt Wert in der Komponente (wie DND-5 E2) |
| Text | – | „Bitte das Handy quer halten“, `text.md`, `fontWeight.medium` | **neu**, **Struktur** (P7) |

Hinweis: `phone.svg` hat ein festes `stroke="#000000"` (schwarze Kontur, im Mockup sichtbar). Gehört zum Asset, nicht
zum Mapping. Optional beim Umbau entfernen.

### `ThemeToggleButton`

Wird zum Icon-Button-Baustein (DESIGN.md 1.5) in der Stufe `size.control.lg`.

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `position`, `left`, `top` | `fixed`, `12px`, `12px` | entfällt | **Struktur**: steht im Fluss über der Karte, `align-self: flex-start`. Linke Kante = Kante der Karte. |
| `align-self` | – | `flex-start` | **neu** |
| `width`, `height` | `40px` | `size.control.lg` (48px) | **neu** (P2) |
| `padding` | `6px` | `0` | Icon-Button-Baustein |
| `display` | `flex`, Zentrierung | `grid`, `place-items: center` | |
| `border-radius` | `100px` | `radius.md` (8px) | Bedienelement, DESIGN.md 1.4 |
| `background-color` | `secondary` | unverändert | |
| `border`, `cursor` | `none`, `pointer` | unverändert | |
| `div` (Wrapper von `ReactSVG`) | `display: flex !important`, Zentrierung, `100%` | `display: grid`, `place-items: center`, ohne `!important` und ohne Größe | `ReactSVG` setzt keine Inline-Styles, `!important` ist unnötig |
| `svg` `width`, `height` | `100%` (= 28px) | `size.icon` (20px) | K1 |
| `svg` `color` | `text.color !important` | `text.color` ohne `!important` | `settings.svg` füllt mit `currentColor` |

---

## ResourceBarPlayer.tsx

Zwölf Styled Components. Neue Struktur im JSX: zwei Zeilen (`ResourceRow`) in der Karte (`ResourceBar`), Spezial
wandert in Zeile 1, die Zauberplätze werden eine eigene Zeile.

### `ResourceBar` → Karte

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `100%` | entfällt | füllt als Flex-Kind der Spalte die Breite |
| `display`, `align-items`, `justify-content` | `flex`, `center`, `space-evenly` | `flex`, `flex-direction: column` | **Struktur**: zwei Zeilen |
| `gap` | – | `space.4` (16px) | **neu**, zwischen den Zeilen |
| `padding` | `5px 0` | `space.5` (24px) | Karte, DESIGN.md 1.4 |
| `border-radius` | – | `radius.lg` (12px) | **neu**, Karte |
| `border-top`, `border-bottom` | `2px` `border` | entfällt | Karte ohne Rahmen |
| `@media (max-width: 649px)` `margin-bottom` | `20px` | entfällt | P1. Im Hochformat deckt das Overlay ab. |
| `background-color` | `secondary` | unverändert | |

### `FlexRow` → `ResourceRow`

Heute nur um die vier Zauber-Pillen. Neu für beide Zeilen.

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `display` | `flex`, `row`, `space-around` | `grid`, `grid-template-columns: repeat(4, minmax(0, 1fr))` | **Struktur**: vier gleich breite Spalten |
| `gap` | – | `space.3` (12px) | **neu**, zusammengehörige Elemente |
| Label „Zauberplätze“ | über `FlexRow` im Abschnitt | im Grid, `grid-column: 1 / -1` | **Struktur** |

### `ResourceBarSection` → Zelle

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `display`, `flex-direction` | `flex`, `column` | unverändert | |
| `align-items` | `center` | entfällt (`stretch`) | Label linksbündig, Button füllt die Spalte |
| `gap` | – | `space.3` (12px) | **neu**, Label → Inhalt darunter |
| `min-width` | – | `0` | **neu**, damit lange Labels die Spalte nicht sprengen |

### `Text` → Label

Wird zum Label-Baustein (DESIGN.md 1.5).

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width`, `height` | `100%`, `25px` | entfällt | |
| `display`, Zentrierung | `flex`, `center` | entfällt | linksbündig |
| `font-size`, `line-height` | `15px`, `normal` | `text.xs` (12/16px) | K4 |
| `font-weight` | – | `fontWeight.semibold` | **neu** |
| `letter-spacing`, `text-transform` | – | `letterSpacing.label`, `uppercase` | **neu** |
| `margin-bottom` | `5px` | entfällt | ersetzt durch `gap` der Zelle |
| `@media (max-width: 739px)` | `font-size: 10px !important` | entfällt | P1 |
| `@media (max-width: 649px)` | `display: none` | entfällt | P1 |

### `Resource`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `80px` | entfällt | füllt die Spalte |
| `height` | `40px` | `RESOURCE_HEIGHT` (64px) | **kein Token** (P2) |
| `border-radius` | `100px` | `radius.md` (8px) | Bedienelement |
| `justify-content` | `space-evenly` | `center` | |
| `gap` | – | `space.3` (12px) | **neu**, Icon → Zahl |
| `text-align` | `center` | entfällt | |
| `font-size`, `line-height` | `22px`, `normal` | `text.xl` (24/32px) | K4 |
| `font-weight` | – | `fontWeight.semibold` | **neu** |
| `font-variant-numeric` | – | `tabular-nums` | **neu**, Zahlen ändern sich (DESIGN.md 1.4) |
| `color` | `#9e998a` | `text.color` | **Farbe** (P4) |
| `border` | `2px <Farbe> solid` je `$variant` | `borderWidth.thick solid resource.<variant>.strong` | **Farbe** (P4) |
| `background-color` | je `$variant` | `resource.<variant>.muted` | **Farbe** (P4) |
| `cursor` | `pointer` | unverändert. Bewegung: `default` | Bewegung ist nicht antippbar |
| `z-index` | `1` | entfällt | P6 |
| `@media (max-width: 739px)`, `(max-width: 649px)` | kleinere Breite, Höhe, Schrift | entfällt | P1 |
| `$variant` | `action`, `bonus`, `movement`, `special` | dazu `spell` | **Struktur**, optional: `SpellResource` in `Resource` aufgehen lassen |
| `<p>` (Zahl) | Browser-Margin `1em 0` (wirkt in der Flex-Box) | `margin: 0` | kommt aus dem `GlobalStyle` |

Hinweis: Die Ressourcen sind `<div>` mit `onClick`. Ein `<button>` wäre per Tastatur bedienbar. Optional,
**Struktur**.

### `SpellResource`

Wie `Resource`, nur die Abweichungen:

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width`, `height` | `80px`, `40px` | entfällt, `RESOURCE_HEIGHT` (64px) | wie `Resource` |
| `justify-content` | `space-evenly` | `space-between` | Ziffer links, Plätze rechts |
| `padding` | – | `0 space.4` (0 16px) | **neu** |
| `margin` | `0 10px` | entfällt | Abstand kommt aus dem `gap` von `ResourceRow` |
| `font-size` (Ziffer) | `30px` | `text.lg` (20/28px), `fontWeight.semibold` | K4. **Struktur**: Ziffer als eigenes Element (`Numeral`) |
| `color` | `#9e998a` | `text.color` | **Farbe** |
| `border`, `background-color` | `2px #2487ff solid`, `#001229` | `resource.spell.strong`, `resource.spell.muted` | **Farbe** |
| `z-index` | `1` | entfällt | P6 |
| `@media` | kleinere Breite, Höhe, Schrift, Margin | entfällt | P1 |

### `IconSection`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width`, `height` | `20px` | `size.icon` (20px) | |
| `display`, `justify-content` | `flex`, `space-between` | `flex`, `justify-content: center`, `gap: space.1` | zwei Punkte bei Bewegung |
| `flex` | – | `none` | **neu**, schrumpft nicht |
| `@media (max-width: 649px)` | `15px` | entfällt | P1 |

### `ActionIcon`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| Form | `<div>`, `100%`, `border-radius: 100px` | `<svg>` mit `<circle>` in `size.icon` | **Struktur** (P5), gleiche Technik wie `BonusIcon` |
| verfügbar | Fläche `#077600` | `fill: resource.action.strong` | **Farbe** (P4) |
| verbraucht | Fläche `#232321` | `fill: resource.empty` | **Farbe** (P4) |

### `BonusIcon`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| Form | CSS-Dreieck: `width: 0`, `border-width: 0 11px 19px 11px` (22 × 19px) | `<svg>` mit `<polygon>` in `size.icon` | **Struktur** (P5). Skaliert mit `size.icon`, Farbe über `fill` statt `border-color`. |
| `@media (max-width: 649px)` | `border-width: 0 6px 11px 6px` | entfällt | P1 |
| `-webkit-transform` | `rotate(360deg)` | entfällt | **wirkungslos** (alter Rendering-Trick) |
| verfügbar | `#b23700` | `fill: resource.bonus.strong` | **Farbe** (P4) |
| verbraucht | `#232321` | `fill: resource.empty` | **Farbe** (P4) |

### `MovementIcon`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width`, `height` | `100%`, `50%` (zwei Pillen 9 × 10px) | `space.2` × `space.2` (8px, Punkt) | |
| `border-radius` | `100px` | `radius.pill` | |
| `margin-left` | `2px` | entfällt | Abstand über `gap` von `IconSection` |
| `background-color` | `#fae100` | `resource.movement.strong` | **Farbe** |

### `Slot`, `SpecialSlot`

Gleiche Form, nur die Farbe unterscheidet sich.

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `10px` | `SLOT_WIDTH` (8px) | **kein Token** (P5) |
| `height` | `23px` | `SLOT_HEIGHT` (24px) | **kein Token** (P5) |
| `border-radius` | – | `radius.sm` (4px) | **neu** |
| Abstand | keiner (`space-evenly` der Pille) | Gruppe mit `display: flex`, `gap: space.1` | **neu**, **Struktur**: Plätze in `SlotGroup` |
| `@media` | `7px`, `3 × 11px` | entfällt | P1 |
| verfügbar | `#2487ff` bzw. `#ff2424` | `resource.spell.strong` bzw. `resource.special.strong` | **Farbe** |
| verbraucht | `#232321` | `resource.empty` | **Farbe** (P4) |
| Komponenten | zwei | eine (`Slot` mit `$variant: 'spell' \| 'special'`) | **Struktur**, optional |

---

## Farben

Rollen-Palette nach DESIGN.md 2.5, in beiden Themes gleich (P4). `strong` für Rahmen, volle Icons und Plätze,
`muted` für die Fläche, `empty` für verbrauchte Icons und Plätze.

| Rolle | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `resource.action.strong` | `#077600` | `#099000` | heller: 2,7 → 3,8:1 auf `muted`, 2,4 → 3,3:1 auf Tavern-`secondary` |
| `resource.action.muted` | `#072900` | unverändert | |
| `resource.bonus.strong` | `#b23700` | `#db4400` | heller: 3,0 → 4,2:1 auf `muted`, 2,3 → 3,2:1 auf Tavern-`secondary` |
| `resource.bonus.muted` | `#290e00` | unverändert | |
| `resource.movement.strong` · `.muted` | `#fae100` · `#292500` | unverändert | |
| `resource.spell.strong` · `.muted` | `#2487ff` · `#001229` | unverändert | |
| `resource.special.strong` · `.muted` | `#ff2424` · `#290000` | unverändert | |
| `resource.empty` | `#232321` | `#707070` | heller: 1,0–1,2 → 3,1–3,9:1 auf `muted` (vorher praktisch unsichtbar) |
| Zahl | `#9e998a` | `text.color` | keine eigene Rolle (P7), folgt dem Theme |

**Kontrast** (WCAG 2.1, berechnet 2026-10-08, Ziel Text 4,5:1, Grafik 3:1)

| Paar | Ziel | Alt | Neu Dark | Neu Tavern |
|---|---|---|---|---|
| Zahl auf `muted` (24px, groß) | 3,0 | 5,4–6,7 (`#9e998a`) | 14,2–17,6 | 7,2–9,0 |
| `resource.empty` auf `muted` (leerer Platz, leeres Icon) | 3,0 | **1,0–1,2** | 3,1–3,9 | 3,1–3,9 |
| `strong` auf `muted` (Rahmen, Icon, Platz) | 3,0 | **2,7** (Aktion), 3,0–11,7 | 3,8–11,7 | 3,8–11,7 |
| `strong` auf `secondary` (Rahmen gegen Karte) | 3,0 | Dark **2,8** (Bonus), Tavern **2,3** (Bonus) / **2,4** (Aktion) | 4,0–13,0 | 3,2–10,5 |

---

## Zusammenfassung

**Werte ohne Token:** `RESOURCE_HEIGHT` 64px, `SLOT_WIDTH` 8px, `SLOT_HEIGHT` 24px, `ROTATE_ICON_SIZE` 96px,
`PORTRAIT_QUERY`.

**Fehler im Bestand, die beim Umbau mit behoben werden**

- `position: fixed` ohne `inset` bei `Overlay` (nur `width`/`height`).
- `-webkit-transform: rotate(360deg)` an `BonusIcon` ohne Wirkung.
- `!important` an Farben und am `ReactSVG`-Wrapper ohne Notwendigkeit.
- Leere Plätze (`#232321`) auf dunkler Fläche praktisch unsichtbar (1,0–1,2:1).
- Verfügbar und verbraucht unterscheiden sich nur in der Farbe (grau statt farbig). Bei Aktion und Bonusaktion
  steht die Zahl daneben, bei den Plätzen zählt die Anzahl. Bewusst so entschieden (P4).
- Bekannt, aber kein Teil des Restyles: `spellData[].max` weicht von `SpellMax` ab, Spezial startet bei 1
  ([known-issues.md](../../docs/known-issues.md)).
