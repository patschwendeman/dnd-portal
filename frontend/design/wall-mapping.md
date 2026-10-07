# Wall Screen: Mapping der Styled Components auf das neue Layout

Stand: 2026-10-06 (Branch `development`). Vorschlag, noch keine Änderungen am Code.
Grundlage: Mockups [mockups/v2/wall.png](mockups/v2/wall.png) (BATTLE), [mockups/v2/wall-world.png](mockups/v2/wall-world.png)
(WORLD) und [mockups/v2/wall-1366.png](mockups/v2/wall-1366.png) (BATTLE bei 1366 × 768), Quelle
[mockups/v2/build.py](mockups/v2/build.py), dazu die Entscheidungen unten und der aktuelle Code der Komponenten, die der
Wall Screen rendert.

Allgemeine Regeln, Tokens und Farbrollen: [DESIGN.md](../DESIGN.md).

Erfasst sind nur Werte ohne Farbe. Tokens, Legende und die übergreifenden Punkte (globales `box-sizing`,
Inter über `@fontsource/inter`, Tokens im Theme) stehen in [admin-mapping.md](admin-mapping.md) und gelten hier
genauso. Dieses Mapping setzt voraus, dass der Admin-Umbau umgesetzt ist.

**Was der Admin-Umbau an der Wall schon ändert** (Entscheidungen 3 und 4 dort):

- `MapElement`: Radius 5px → 4px, aktive Kachel mit 2px-Rahmen statt Leuchten.
- `MapOverview`: neue Prop `padding`, die Wall übergibt vorerst `'30px 10px'` (wie heute).

Diese Werte stehen unten als „alter Wert“, wo sie vom Admin-Umbau stammen, mit Vermerk **Admin**.

## Entscheidungen (2026-10-04)

| # | Frage | Entscheidung |
|---|---|---|
| 1 | Breite des Overlay-Panels | An den Monitor angepasst: höchstens 1440px, schrumpft mit Breite und Höhe des Monitors. Bei 1920 × 1080 wie im Mockup. Geprüft auch bei 1366 × 768. |
| 2 | Kachel-Radius | 8px auf der Wall, 4px im Admin, umgeschaltet über `isAdminScreen` |
| 3 | Nummern und Reihenfolge | Raumnummer 1–25 statt Datenbank-ID, zeilenweise sortiert. Gilt auch für die Reihenfolge im Admin. |
| 4 | Laufweite | Einheitlich `.08em` für alle Texte in Großbuchstaben, Token `letterSpacing.label` |
| 5 | Texte im Panel | Kopfzeile mit Überschrift: „Kampfschauplätze“ mit Anzahl („25 Räume“) bei BATTLE, „Weltkarte“ bei WORLD. Zunächst „keine Texte“ entschieden, dann revidiert. |

---

## Konsistenz-Abgleich (2026-10-04)

Entscheidungen aus dem Abgleich aller drei Mappings (Admin, Wall, Ground). Sie gelten für alle Screens.

| # | Thema | Entscheidung |
|---|---|---|
| K1 | Icons in 40px-Buttons | Alle Icons 20px (`size.icon`). Ersetzt Admin-Entscheidung 1 (24px). `size.icon.sm` und `size.icon.lg` entfallen. |
| K2 | Text-Buttons | Ein Stil: 40px hoch, min. 112px breit (`size.button.minWidth`), Innenabstand `0 space.4` (0 16px), `text.sm`, Gewicht 600, `radius.md`. Laufweite `letterSpacing.label` nur bei Text in Großbuchstaben. |
| K3 | Verschachtelte Radien | Neues Token `radius.xl` = 16px für die schwebende Steuerleiste. Regel: äußerer Radius = innerer Radius + Innenabstand (8px + 8px). |
| K4 | Zeilenhöhen | Feste Paare aus Schriftgröße und Zeilenhöhe auf dem 4px-Raster: `text.xs` 12/16 · `text.sm` 14/20 · `text.md` 16/24 · `text.lg` 20/28 · `text.xl` 24/32 · `text.2xl` 32/40. Ausnahme: Fließtext in den Notizen `text.reading` 16/26. |

---

## WallScreen.tsx

### `Screen`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `<GlobalStyle />` | – (bisher nur in `AdminScreen`) | im Screen rendern | **neu**, **Struktur**, eigener Schritt: Erst damit gelten `box-sizing: border-box`, `margin: 0` und die Body-Schrift (`font.family.base`, `text.md`) auch hier ([DESIGN.md](../DESIGN.md) 1.1 und Architektur). Wie im Admin wird er nicht in `App.tsx` eingebunden. |
| `font-family` | System-Stack | entfällt | kommt aus dem `GlobalStyle` (`font.family.base`) |
| `font-size`, `line-height` | nicht gesetzt (Browser 16px, `normal`) | `text.md` (16/24px) | **neu**, K4, kommt aus dem `GlobalStyle` |
| `align-items` | `center` | `flex-start` | Das Panel hängt oben statt mittig, siehe nächste Zeile |
| `padding-top` | – | `space.7` (48px) | **neu**. Das Panel steht 48px unter der Oberkante. Die Breitenformel des Panels rechnet mit diesem Wert. Mittig würde das Panel bei 1080px Höhe die Steuerleiste berühren. |
| `justify-content` | `center` | unverändert | Horizontal bleibt es mittig |
| `display`, `width`, `height`, `position`, `top/left/right/bottom` | `flex`, `100%`, `100%`, `fixed`, `0` | unverändert | |

### `BackgroundImage`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `inset` (`top/left/right/bottom`) | nicht gesetzt | `0` | **neu**. Heute landet das Bild nur zufällig richtig: `position: fixed` ohne Offsets nutzt die statische Position im Flex-Container, und `100%` füllt den Rest. |
| `object-fit` | nicht gesetzt (`fill`) | `cover` | **neu**. Heute wird das Bild auf das Seitenverhältnis des Monitors **verzerrt**. Mit `cover` bleibt es unverzerrt und wird beschnitten. |
| `width`, `height` | `100%` | unverändert | |
| `z-index` | `1` | `layer.media` (1) | Wert gleich, aber über das Token ([DESIGN.md](../DESIGN.md) 1.2, O4) |

### `MapContainer` (Overlay-Panel, BATTLE und WORLD)

Der Name ist doppelt vergeben: `MapElement.tsx` hat ebenfalls einen `MapContainer`. Vorschlag: hier in `OverlayPanel`
umbenennen.

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `1200px` | `min(1440px, 100vw − 2 × space.8, (100vh − space.7 − 104px − 2 × space.6 − 32px − space.5 − 4 × space.3) × 16 / 9 + 4 × space.3 + 2 × space.6)` | Entscheidung 1. 1440px, 104px und 32px sind **kein Token**, siehe Hinweis unter der Tabelle. |
| `height` | `700px` | `auto` | Höhe ergibt sich aus dem Inhalt (bei 1440px Breite: BATTLE ≈ 915px, WORLD ≈ 894px) |
| `padding` | – | `space.6` (32px) | **neu** |
| `display` (sichtbar) | `flex` | `flex`, `flex-direction: column` | Kopfzeile über dem Inhalt |
| `align-items` | `center` | `stretch` | Inhalt füllt die Breite |
| `justify-content` | `center` | entfällt | |
| `border-radius` | `10px` | `radius.lg` (12px) | |
| `z-index` | `99999` | `layer.panel` (20) | O4. Liegt weiter über dem Hintergrund (`layer.media`) und unter der Steuerleiste (`layer.controls`). |
| Kopfzeile | – | `display: flex`, `align-items: baseline`, `justify-content: space-between`, `margin-bottom: space.5` (24px) | **neu**, **Struktur** (neues Element), Entscheidung 5 |
| Überschrift („Kampfschauplätze“ / „Weltkarte“) | – | `text.xl` (24/32px), `fontWeight.semibold` (600) | **neu**, **Struktur**, K4. Gleiche Stufe wie `h2` im Admin. Ohne Laufweite ([DESIGN.md](../DESIGN.md), Entscheidung O1). |
| Anzahl („25 Räume“, nur BATTLE) | – | `text.xs` (12/16px), `fontWeight.semibold` (600), `letterSpacing.label` (.08em), Großbuchstaben | **neu**, **Struktur**. Baustein `Label` aus `src/components/Label.tsx` wiederverwenden (wie im Admin). Zahl aus `mainmaps.length`. |

Hinweis zur Breite: Die Formel nimmt den kleinsten von drei Werten.

- **1440px** – Obergrenze aus dem Mockup.
- **100vw − 128px** – mindestens 64px Rand links und rechts.
- **Höhe → Breite** – die verfügbare Höhe in eine Breite umgerechnet, damit das Raster (5 × 5 Kacheln in 16:9, 4 Abstände
  à 12px) über der Steuerleiste Platz hat. Abgezogen werden 48px oben (`space.7`), 104px für die Steuerleiste
  (24px Abstand + 56px Leiste + 24px Luft), 2 × 32px Innenabstand, 56px Kopfzeile (32px Zeilenhöhe aus `text.xl` + 24px Abstand)
  und 4 × 12px Abstände im Raster.

104px ist **kein Token**. Es ergibt sich aus der Steuerleiste und sollte als Konstante neben ihr stehen, z. B.
`CONTROL_BAR_CLEARANCE`. Die Formel gilt für 25 Kacheln (5 × 5). Bei einer anderen Anzahl ändert sich die Zahl der
Abstände. Die Weltkarte (16:9 ohne Abstände) ist bei gleicher Breite niedriger und passt immer.

### `MapEnvironment` (Weltkarte)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `height` | `100%` (= 700px des Panels) | `auto`, `aspect-ratio: 16 / 9` | Das Panel hat keine feste Höhe mehr. 16:9 entspricht dem Bild `mapOverview.jpg` (1600 × 900). |
| `width` | `100%` | unverändert | |
| `object-fit` | `contain` | unverändert | Andere Bildformate werden eingepasst, nicht beschnitten |
| `border-radius` | – | `radius.md` (8px) | **neu** |
| `display` | `inline` (Standard für `img`) | `block` | **neu**, verhindert den Spalt unter dem Bild |

---

## MapOverview.tsx (geteilt mit Admin)

### `ContainerMainmaps`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `padding` (Prop aus `WallScreen`) | `'30px 10px'` (**Admin**: Prop eingeführt) | `0` | Das Panel bringt jetzt 32px Innenabstand mit |
| `gap` (Prop aus `WallScreen`) | `'10px'` | `space.3` (12px) | Prop-Wert in `WallScreen.tsx` ändern |

### `MainmapsColumn`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `gap` (Prop) | `'10px'` | `space.3` (12px) | gleiche Prop wie oben |

Hinweis **Struktur** (Entscheidung 3): Die Kacheln sind heute **spaltenweise** einsortiert (Spalte 1 = die ersten fünf
Kacheln von oben nach unten). Neu ist **zeilenweise** (1–5 in der ersten Reihe). Dafür reicht eine andere
Indexrechnung in der Schleife: `mapIndex * count + colIndex` statt `colIndex * count + mapIndex`. Die
Spaltenstruktur bleibt. Das ändert auch die Reihenfolge im Admin.

---

## MapElement.tsx (geteilt mit Admin)

### `MapContainer` (Kachel)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `border-radius` | `radius.sm` (4px, **Admin**) | `radius.md` (8px) | Entscheidung 2: über die vorhandene Prop `isAdminScreen` (`$isAdminScreen ? radius.sm : radius.md`). **Struktur**: Die Prop muss an `MapContainer` weitergereicht werden. |
| `outline` (aktiv) | 2px, Abstand 2px (**Admin**) | unverändert | |
| `padding-top` | `56.25%` | unverändert | |

### `MapImage`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `border-radius` | `radius.sm` (4px, **Admin**) | `inherit` | Übernimmt den Radius der Kachel, eine Prop weniger |

### `MapOverlay`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `z-index` | `99` | `layer.raised` (1) | O4, lokal innerhalb der Kachel (`position: relative`) |
| übrige Regeln | | unverändert | Füllt die Kachel und trägt die Nummer |

### `NumberIcon`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `bottom` | `0` | entfällt | Nummer wandert von unten links nach oben links |
| `top` | – | `space.2` (8px) | **neu** |
| `left` | `0` | `space.2` (8px) | Heute klebt die Nummer an der Kachelkante |
| `width` | `30px` | `min-width: size.badge` (32px) | Mit `min-width` passen auch zweistellige Zahlen. |
| `height` | `30px` | `size.badge` (32px) | wie oben |
| `padding` | – | `0 space.2` (0 8px) | **neu**, Innenabstand bei breiten Zahlen |
| `display` | nicht gesetzt (`block`) | `grid`, `place-items: center` | **wirkungslos** heute: `align-items` und `justify-content` stehen ohne `display: flex`. Die Zahl ist horizontal über `text-align` zentriert, vertikal aber nicht. |
| `align-items`, `justify-content`, `text-align` | `center` | entfallen | ersetzt durch `place-items` |
| `border-radius` | `100px` | `radius.pill` (999px) | |
| `font-size`, `line-height` | `20px`, `normal` | `text.md` (16/24px) | Die Höhe kommt aus `height: size.badge`, die Zeilenhöhe beeinflusst sie nicht |
| `font-weight` | erbt 400 | `fontWeight.bold` (700) | **neu** |
| `font-variant-numeric` | – | `tabular-nums` | **neu**, gleich breite Ziffern |
| `z-index` | `99` | `layer.raised` (1) | O4, lokal innerhalb der Kachel |
| `background-color`, `color` | `#5a5a5a`, `white` | `colors.badge.background`, `colors.badge.text` | **Farbe**, **Struktur**: feste Werte außerhalb des Themes verstoßen gegen [DESIGN.md](../DESIGN.md) 2.1. Neue Rollen `badge.background` und `badge.text` in **beiden** Themes anlegen (Vorschlag aus 2.5, Werte zunächst wie heute, Kontrast 6,9:1). |

Hinweis **Struktur** (Entscheidung 3): Angezeigt wird heute `keyProp`, also die Datenbank-ID. Die Kampfszenen haben
die IDs 5–29, die Notizen heißen aber `room_01.md` bis `room_25.md` und die Bilder `battle_1.jpg` bis `battle_25.jpg`.
Neu zeigt die Kachel ihre Position (`itemIndex + 1`). Dafür braucht `MapElement` eine neue Prop, z. B. `number`.
`keyProp` bleibt für die Auswahl der Szene. Voraussetzung: Die Kampfszenen kommen vom Backend in Raumreihenfolge.
Das ist heute über die aufsteigenden IDs der Fall.

---

## ScreenControlBar.tsx (geteilt mit Ground)

Die Steuerleiste sieht im Ground-Mockup gleich aus. Die Änderungen hier gelten also für beide Screens, das ist gewollt.
Der Slider (`StyledSlider`, `Box`) erscheint nur auf dem Ground und gehört in das Ground-Mapping.

### `Overlay` (Hover-Fläche)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `z-index` | `99999` | `layer.controls` (30) | O4 |
| übrige Regeln | | unverändert | Vollbild-Fläche, die beim Hover die Leiste einblendet |

### `ControlBar`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `100%` | `auto` | Wird zur schwebenden Leiste, so breit wie der Inhalt |
| `height` | `50px` | `auto` (40px Button + 2 × 8px = 56px) | Ergibt den Wert von `size.bar.md`, kein eigenes Token nötig |
| `left` | `0` | `50%` + `transform: translateX(-50%)` | horizontal mittig |
| `right` | `0` | entfällt | |
| `bottom` | `0` | `space.5` (24px) | Abstand zur Unterkante |
| `padding` | – | `space.2` (8px) | **neu** |
| `gap` | – | `space.5` (24px) | **neu**. Wirkt nur auf dem Ground (Buttons, Slider). Auf der Wall gibt es nur die Button-Gruppe. |
| `border-radius` | – | `radius.xl` (16px) | **neu**, K3: 8px Button-Radius + 8px Innenabstand |
| `justify-content` | `center` | entfällt | |
| `transition` | `opacity 0.5s ease, visibility 0.5s ease` | unverändert | **kein Token**: Für Übergangsdauern gibt es noch keine Tokens (offener Punkt, [DESIGN.md](../DESIGN.md) 4). Im Admin nutzt `TopLink` 0.3s. |
| `position`, `display`, `align-items`, `opacity`, `visibility` | | unverändert | |

### Button-Gruppe (neu)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| Wrapper | – (Buttons direkt in `ControlBar`) | `display: flex`, `gap: space.1` (4px) | **neu**, **Struktur**. Ohne Wrapper würden die Buttons den `gap` von 24px der Leiste bekommen. |

### `Button`

Hinweis **Struktur**: Den Text-Button-Stil (K2) gibt es seit DND-4 nur lokal als `css`-Block `textButton` in
`Dialogue.tsx`. **Umsetzung im Wall-Task, Schritt 1: TextButton herauslösen**, als gemeinsamer Baustein
`src/components/TextButton.tsx` (`styled.button` mit `$variant: 'default' | 'active' | 'cancel'`, Farben nach
DESIGN.md 1.5). Danach den Dialog darauf umstellen (ohne sichtbare Änderung, `data-test-id` bleiben) und hier
verwenden. `Button` ist heute ein `div` und wird damit ein `<button>` (Tastatur, Fokus) mit Button-Reset
(`border: none`, `font-family: inherit`).

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `margin` | `0 10px` | `0` | Abstand aus dem Wrapper (4px). Heute 20px zwischen den Buttons. |
| `width` | `120px` | `min-width: size.button.minWidth` (112px) | K2: gleicher Text-Button-Stil wie die Dialog-Buttons im Admin |
| `padding` | – | `0 space.4` (0 16px) | **neu** |
| `height` | `40px` | `size.control.md` (40px) | |
| `border-radius` | `6px` | `radius.md` (8px) | |
| `font-size`, `line-height` | erbt 16px | `text.sm` (14/20px) | K2 |
| `font-weight` | erbt 400 | `fontWeight.semibold` (600) | **neu** |
| `letter-spacing` | – | `letterSpacing.label` (.08em) | **neu**, Entscheidung 4 und K2: Die Labels (BATTLE, WORLD, OFF) sind in Großbuchstaben. |
| `color` (aktiv) | `text.color` | `onPrimary` | **Farbe**, Entscheidung O5 ([DESIGN.md](../DESIGN.md) 2.4). Heute verfehlt der aktive Button den Kontrast AA: `text.color` auf `primary` 2,9:1 (Dark) bzw. 3,0:1 (Tavern), mit `onPrimary` 6,1:1 bzw. 4,7:1. |
| `display`, `align-items`, `justify-content`, `text-align` | | unverändert | |

---

## Zusammenfassung

**Werte ohne Token**

| Wert | Wo | Vorschlag |
|---|---|---|
| 1440px | Obergrenze der Panelbreite | Layout-Maß, Konstante in `WallScreen.tsx` |
| 104px | Platz für die Steuerleiste in der Breitenformel | Konstante neben `ScreenControlBar`, z. B. `CONTROL_BAR_CLEARANCE` |
| 0.5s | Ein- und Ausblenden der Steuerleiste (`ControlBar`, auch Ground) | offen: Token für Dauern (z. B. `duration.*`) oder Wert lassen, siehe [DESIGN.md](../DESIGN.md) 4 |

Neu gegenüber dem Admin: `letterSpacing.label` (.08em) ist jetzt ein festes Token (Entscheidung 4). Seit DND-4 sind
auch die Nummerngröße (`size.badge`, 32px) und die Schriftgewichte (`fontWeight.*`) Tokens, `size.control.sm`
entfällt.
Mit dem Konsistenz-Abgleich erledigt: Zeilenhöhen (K4, `text.*`), Mindestbreite der Buttons (`size.button.minWidth`, K2),
Radius der Steuerleiste (`radius.xl`, K3).

**Fehler im Bestand, die beim Umbau mit behoben werden**

- `BackgroundImage` verzerrt das Wandbild (kein `object-fit`).
- `BackgroundImage` hat `position: fixed` ohne Offsets.
- `NumberIcon` nutzt `align-items`/`justify-content` ohne `display: flex`. Die Zahl ist vertikal nicht zentriert.
- `NumberIcon` zeigt die Datenbank-ID statt der Raumnummer.
- `MapContainer` ist doppelt vergeben (`WallScreen.tsx` und `MapElement.tsx`).

**Entscheidungen:** alle getroffen, siehe [Entscheidungen](#entscheidungen-2026-10-04).
