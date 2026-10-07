# Admin Screen: Mapping der Styled Components auf das neue Layout

Stand: 2026-10-06 (Branch `development`). Umgesetzt in DND-4 ([Plan](../../docs/tasks/DND-4-admin-restyle.md)).
Die Spalte „Alter Wert“ beschreibt den Code vor dem Umbau.
Grundlage: Mockups [mockups/v2/admin.png](mockups/v2/admin.png) und [mockups/v2/admin-dialog.png](mockups/v2/admin-dialog.png)
(Quelle [mockups/v2/build.py](mockups/v2/build.py)), die Entscheidungen vom 2026-10-04 (siehe unten) und der
aktuelle Code der Komponenten, die der Admin Screen rendert.

Allgemeine Regeln, Tokens und Farbrollen: [DESIGN.md](../DESIGN.md).

Erfasst sind nur Werte ohne Farbe: Abstände, Größen, Schrift, Radien, Rahmenstärken, Positionen und Layout.
Farben bleiben unverändert. Wo das neue Layout eine bestehende Theme-Farbe an einer neuen Stelle verwendet, steht das
unter „Hinweise“, ohne dass sich Farbwerte ändern.

## Tokens aus dem Mockup

Das Mockup verwendet ein 4px-Raster. Diese Skala ersetzt den früheren Vorschlag (2/5/10/20/30/50/100px).

| Kategorie | Token | Wert |
|---|---|---|
| Abstände | `space.1` … `space.8` | 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64px |
| Schrift (Größe/Zeilenhöhe) | `text.xs` · `sm` · `md` · `lg` · `xl` · `2xl` · `reading` | 12/16 · 14/20 · 16/24 · 20/28 · 24/32 · 32/40 · 16/26px |
| Radien | `radius.sm` · `md` · `lg` · `xl` · `pill` | 4 · 8 · 12 · 16 · 999px |
| Bedienelemente | `size.control.md` | 40px |
| Icons | `size.icon` | 20px |
| Scrollleiste | `size.scrollbar` | 4px |
| Leisten | `size.bar.md` · `size.bar.lg` | 56 · 80px |
| Kachelnummer | `size.badge` | 32px |
| Text-Buttons | `size.button.minWidth` | 112px |
| Rahmen | `borderWidth.thin` · `thick` | 1 · 2px |
| Schrift | `font.family.base` | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| Schriftgewicht | `fontWeight.regular` · `medium` · `semibold` · `bold` | 400 · 500 · 600 · 700 |
| Laufweite | `letterSpacing.label` | .08em |
| Ebenen (`z-index`) | `layer.base` · `raised` · `media` · `grid` · `panel` · `controls` · `dialog` | 0 · 1 · 1 · 10 · 20 · 30 · 40 |

`size.bar.lg` ist nach den Entscheidungen neu dazugekommen, `text.*` (K4) und `radius.xl` (K3) mit dem
Konsistenz-Abgleich. `fontSize.*` heißt jetzt `text.*`, weil jede Stufe ihre Zeilenhöhe mitbringt. `size.icon.sm`/`.lg`
entfallen (K1), ebenso `size.control.sm`. Vollständige Liste: [DESIGN.md](../DESIGN.md), 1.2.

Legende für die Spalte **Hinweis**:

- **kein Token** – der neue Wert hat kein passendes Token (Layout-Maß oder fehlende Stufe).
- **wirkungslos** – die alte Regel hat heute keinen Effekt (fehlendes `position`, ungültiger Wert o. ä.).
- **Struktur** – der Wert lässt sich nicht allein im CSS umstellen, es braucht Änderungen am JSX oder anderen Dateien.
- **geteilt** – die Komponente wird auch von Wall genutzt. Eine Änderung wirkt dort mit.
- **neu** – die Regel gibt es bisher nicht.
- **Farbe** – betrifft eine Farbe. Ist nicht Teil dieses Mappings, wird aber durch das Layout nötig.

Leere Hinweis-Zellen bedeuten: das Token passt direkt.

---

## Entscheidungen (2026-10-04)

| # | Frage | Entscheidung |
|---|---|---|
| 1 | Größe der Sound-Icons in der Top-Bar | ~~24px, neues Token `size.icon.lg`~~ → ersetzt durch K1: 20px (`size.icon`) |
| 2 | Höhe der Bottom-Bar | 80px, neues Token `size.bar.lg` |
| 3 | Markierung der aktiven Kachel | Rahmen wie im Mockup (2px `primary`, 2px Abstand), kein Leuchten mehr |
| 4 | Geteilte Komponenten `MapOverview`/`MapElement` | Padding von `ContainerMainmaps` als Prop. Admin wird jetzt umgestellt, die Wall folgt in einem eigenen Schritt. |
| 5 | Farbe der Trennlinie in der Top-Bar | `colors.border` statt `colors.text.color` |
| 6 | Schrift | Inter über `@fontsource/inter` (lokal ausgeliefert, funktioniert ohne Internet) |
| 7 | Bestätigungsdialog | Im Mockup ergänzt ([admin-dialog.png](mockups/v2/admin-dialog.png)), Werte unten entsprechend |

Folge aus 3 und 4: Radius (5px → 4px) und Rahmen der aktiven Kachel sitzen in `MapElement` und ändern sich auch auf
der Wall. Nur das Padding von `ContainerMainmaps` bleibt dort über die Prop wie heute. Die Wall sieht damit bis zu
ihrem Umbau fast unverändert aus: Kacheln 1px weniger rund, aktive Kachel mit Rahmen statt Leuchten.

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

## Übergreifend (vor allen Komponenten)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `box-sizing` (global) | nicht gesetzt (`content-box`) | `border-box` | **neu**, **Struktur**: `index.css` wird nicht importiert, ein globales Stylesheet fehlt. Ohne `border-box` stimmen alle Maße unten nicht (Breite + Padding laufen über). Umgesetzt als `createGlobalStyle` in `style/GlobalStyle.ts`, gerendert je Screen statt in `App.tsx` (derzeit nur `AdminScreen`, nicht im Player). |
| `margin` (global, `*`) | Browser-Standard | `0` | **neu**, **Struktur**: Die Abstände von `p`, `h1`, `ol` sind unten explizit gesetzt und sollen nicht vom Browser kommen. |
| Schriftart | System-Stack, 4× kopiert | `font.family.base` | **Struktur**: Neue Abhängigkeit `@fontsource/inter` (Gewichte 400, 500, 600, 700), Import in `main.tsx`. Entscheidung 6. |
| Theme-Objekt | nur `colors` | zusätzlich `space`, `text`, `fontWeight`, `letterSpacing`, `font`, `radius`, `borderWidth`, `size`, `layer` | **Struktur**: gemeinsame `style/tokens.ts` neben den Themes (`darkTheme.ts`, `tavernTheme.ts`), der ThemeProvider in `App.tsx` setzt `tokens` und die `colors` des aktiven Themes zusammen. |

---

## AdminScreen.tsx

### `Screen`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `display` | `flex` | `grid` | **Struktur** |
| `grid-template-rows` | – | `size.bar.md` (56px) `1fr` `size.bar.lg` (80px) | **neu** |
| `align-items` | `center` | entfällt | |
| `justify-content` | `center` | entfällt | |
| `font-family` | System-Stack | `font.family.base` | |
| `font-size`, `line-height` | nicht gesetzt (Browser 16px, `normal` ≈ 1.2) | `text.md` (16/24px) | **neu**, K4 |
| `width`, `height`, `position`, `top/left/right/bottom` | `100%`, `100%`, `fixed`, `0` | unverändert | |

Hinweis: `TopBar`, `SidebarRight`, `BottomBar` und `DocumentReader` sind heute Geschwister im Flex-Container und
werden einzeln per `position: fixed/absolute` platziert. Im neuen Layout liegen sie in Grid-Zeilen. Die mittlere
Zeile braucht einen neuen Wrapper (`Main`, siehe unten), der Navigation, Notizen und Sidebar als Spalten hält.

### `Main` (neu)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `display` | – | `grid` | **neu**, **Struktur** |
| `grid-template-columns` | – | `200px 1fr 400px` | **neu**, **kein Token** (Layout-Maße) |
| `gap` | – | `space.5` (24px) | **neu** |
| `padding` | – | `space.5` (24px) | **neu** |
| `min-height` | – | `0` | **neu**, damit die Notizen in der Zeile scrollen |

### `SidebarRight`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `position` | `fixed` | `static` (entfällt) | **Struktur**, liegt jetzt in der Grid-Spalte |
| `top` | `50px` | entfällt | |
| `right` | `0` | entfällt | |
| `bottom` | `50px` | entfällt | |
| `width` | `400px` | entfällt (Spaltenbreite `400px` im `Main`) | **kein Token** |
| `align-items` | `end` | `stretch` | |
| `gap` | – | `space.5` (24px) | **neu**, Abstand zwischen den beiden Karten |
| `min-height` | – | `0` | **neu** |

### `SidebarMapContainer`

Wird zur Karte „Kampfszenen“.

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `height` | `200px` | `auto` | Höhe ergibt sich aus 5 Reihen 16:9 |
| `display` | `flex` | `block` | |
| `align-items`, `justify-content` | `center` | entfällt | |
| `padding` | `20px 0` | `space.5` (24px) rundum | |
| `border-radius` | – | `radius.lg` (12px) | **neu** |
| `background-color` | – | `colors.secondary` | **neu**, **Farbe** (bestehende Theme-Farbe) |
| Überschrift „Kampfszenen“ + Anzahl | – | `text.xs` (12/16px), `font-weight: 600`, `letterSpacing.label` (.08em), Großbuchstaben, `margin-bottom: space.3` (12px) | **neu**, **Struktur** (neues Element). `font-weight` über `fontWeight.semibold`. |

### `BottomBar`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `position`, `left`, `bottom` | `fixed`, `0`, `0` | entfällt | **Struktur**, liegt in der Grid-Zeile |
| `width` | `100%` | entfällt | |
| `height` | `50px` | `size.bar.lg` (80px, über `grid-template-rows`) | Entscheidung 2 |
| `display` | `flex` | `grid` | |
| `grid-template-columns` | – | `1fr auto 1fr` | **neu**: Musik links, Szenen exakt mittig |
| `justify-content` | `center` | entfällt | |
| `padding` | – | `0 space.5` (0 24px) | **neu** |

### `AudioControlButton`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `position` | `absolute` | `static` | Sitzt in Grid-Spalte 1 |
| `left` | `20px` | entfällt (Padding der Bar: 24px) | +4px |
| `width` | – (aus Padding: 15 + 2 × 25 = 65px) | `size.control.md` (40px) | Form wird quadratisch |
| `height` | – (aus Padding: 15 + 2 × 7 ≈ 29px) | `size.control.md` (40px) | |
| `padding` | `7px 25px` | `0` | |
| `border-radius` | `5px` | `radius.md` (8px) | |
| `svg width/height` | `15px` | `size.icon` (20px) | K1 |
| Titel-Anzeige daneben | – | `gap: space.3` (12px); Label `text.xs` (12/16px), Titel `text.sm` (14/20px) `font-weight: 500` | **neu**, **Struktur**: neuer Wrapper `Music` und Titeltext. Der Titel muss aus `activeMusicSRC` abgeleitet werden. Zeilenhöhe 1.3 entfällt (K4). |

Hinweis: Das Mockup zeigt den Button im Zustand „gestoppt“. Die farbliche Unterscheidung `primary` / `secondary` beim
Abspielen bleibt.

---

## TopBar.tsx

### `Bar`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `position`, `left`, `top` | `fixed`, `0`, `0` | entfällt | **Struktur**, Grid-Zeile 1 |
| `width` | `100%` | entfällt | |
| `height` | `50px` | `size.bar.md` (56px) | +6px |
| `display` | `flex` | `grid` | |
| `grid-template-columns` | – | `240px 1fr 240px` | **neu**, **kein Token** (Layout-Maß). Gleich breite Außenspalten halten die Sounds exakt mittig. |
| `justify-content` | `center` | entfällt | |
| `padding` | – | `0 space.5` (0 24px) | **neu** |
| `border-bottom` | `1px` | `borderWidth.thin` (1px) | |
| Titel „DnD Portal“ | – | `text.md` (16/24px), `fontWeight.bold` (700) | **neu**, **Struktur** (neues Element). Ohne Laufweite ([DESIGN.md](../DESIGN.md), Entscheidung O1). |
| Sound-Container | – | `display: flex`, `gap: space.4` (16px), zentriert | **neu**, **Struktur**: Die Buttons hängen heute direkt in `Bar`. Sie brauchen einen Container und je Gruppe einen Wrapper. |
| Gruppen-Wrapper | – | `display: flex`, `gap: space.1` (4px) | **neu**, **Struktur** |

### `Seperator` (entfallen, jetzt `Separator`)

In DND-4 in `Separator` umbenannt. Wird von einem Punkt zu einer senkrechten Linie.

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `5px` | `borderWidth.thin` (1px) | Breite einer Linie, daher Rahmen-Token |
| `height` | `5px` | `size.icon` (20px) | Gleich hoch wie die Icons (Folge aus K1) |
| `margin` | `0 20px` | `0` | Abstand kommt aus `gap` (16px) des Containers → links und rechts je 16px statt 20px |
| `border-radius` | `100px` | `0` | |
| `background-color` | `colors.text.color` | `colors.border` | **Farbe**: bestehende Theme-Farbe, Entscheidung 5 |

Hinweis: Tippfehler im Namen (`Seperator` → `Separator`), in DND-4 korrigiert.

### `AtmoButton`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `30px` | `size.control.md` (40px) | Klickfläche +10px |
| `height` | `30px` | `size.control.md` (40px) | |
| `margin` | `0 10px` | `0` | Abstand aus Gruppen-`gap` (4px). Zwischen zwei Icons heute 20px, neu 4px + 2 × 10px Innenabstand = 24px. |
| `border-radius` | `100px` | `radius.md` (8px) | Ohne Hintergrund heute unsichtbar. Wird erst bei einem Hover-Zustand sichtbar. |
| `svg width/height` | `100%` (= 30px) | `size.icon` (20px) | Icon wird 10px kleiner, K1 (ersetzt Entscheidung 1) |
| `border`, `background`, `padding` (Button-Reset) | – (ist ein `div`) | – | Kein Reset nötig, solange es ein `div` bleibt |

### `ThemeToggleButton`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `position` | `absolute` | `static`, `justify-self: end` | Grid-Spalte 3 |
| `right` | `20px` | entfällt (Padding der Bar: 24px) | +4px |
| `width` | – (Inhalt 30px + Button-Padding 6px × 2 = 42px) | `size.control.md` (40px) | |
| `height` | `100%` (50px) | `size.control.md` (40px) | |
| `padding` | Browser-Standard (`1px 6px`) | `0` | **neu**, Reset fehlt heute |
| `border-radius` | – | `radius.md` (8px) | **neu** |
| `svg width` | `30px` | `size.icon` (20px) | wie `AtmoButton`, K1 |
| `svg height` | `100%` | `size.icon` (20px) | |

---

## DetailsSideBar.tsx

Wird zur Karte „Aktive Szene“.

### `DetailsContainer` (entfallen)

Entfallen in DND-4, `Details` ist jetzt die äußere Komponente. Die Tabelle zeigt den Stand der Planung.

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `height` | `100%` | `auto` | Heute füllt der Container die Sidebar und drückt das Kartenraster nach unten |
| `top` | `0` | entfällt | **wirkungslos** (kein `position`) |
| `right` | `0` | entfällt | **wirkungslos** |
| `width`, `display` | `100%`, `flex` | unverändert | Komponente könnte ganz entfallen, `Details` reicht. |

### `Details`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `display` | `'flex'` (in Anführungszeichen) | `flex` | **wirkungslos**: ungültiger Wert, das Element ist heute `block`. Damit sind auch `flex-direction`, `justify-content` und `align-items` heute ohne Wirkung. |
| `flex-direction` | `column` | `column` | wird erst durch den Fix wirksam |
| `justify-content` | `space-between` | `flex-start` | |
| `align-items` | `center` | `stretch` | |
| `height` | `220px` | `auto` | **kein Token** nötig, Höhe ergibt sich aus dem Inhalt |
| `margin` | `17px 10px 10px` | `0` | Abstand zur Top-Bar kommt aus `Main`-Padding (24px), zur nächsten Karte aus `gap` (24px). Heute mit 17px oben **nicht auf der Skala**. |
| `padding` | `20px` | `space.5` (24px) | |
| `border-radius` | `9px` | `radius.lg` (12px) | |

### `DetailHeader`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `height` | `5px` | `auto` | Heute läuft der Text aus der 5px-Box heraus |
| `display` | `flex` | `block`, `text.md` (16/24px) | Nacharbeit DND-4: Das Label steht wie im Mockup inline in einer 24px-Zeile (als 16px-Flex-Element lag die Karte 4px zu niedrig). |
| `align-items` | `center` | entfällt | Name linksbündig statt zentriert (`text-align: left`) |
| `justify-content` | `center` | entfällt | |
| `text-align` | `center` | `left` | |
| Label „Aktive Szene“ | – | `text.xs` (12/16px), `600`, `letterSpacing.label`, Großbuchstaben | **neu**, **Struktur** |
| Name (`<strong>`) | erbt 16px, `bold` | `display: block`, `text.lg` (20/28px), `font-weight: 600` | K4 |
| Beschreibung | steht heute in der Zeile „Enemies“ | unter dem Namen: `text.sm` (14/20px), `margin-top: space.1` (4px) | **Struktur**: `activeScene.description` zieht aus `DetailContent` in den Header um. |

### `DetailContent`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `height` | `40%` | `auto` | |
| `display` | `flex` | `grid`, `align-items: baseline` | Label (12/16) und Wert (14/20) stehen auf einer Grundlinie (K4) |
| `grid-template-columns` | – | `96px 1fr` | **neu**, **kein Token** (Breite der Label-Spalte) |
| `gap` | – | `space.3` (12px) | **neu** |
| `padding` | – | `space.3 0` (12px 0) | **neu** |
| `border-top` | `1px` | `borderWidth.thin` (1px) | |
| `font-size`, `line-height` | erbt 16px | `text.sm` (14/20px) | |
| `margin-top` (erste Zeile) | – | `space.5` (24px) | **neu**, Abstand zwischen Header und erster Zeile. Braucht einen Wrapper oder `:first-of-type`. |

### `ContentContainer`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `50%` | entfällt | Breite kommt aus den Grid-Spalten |
| `height` | `100%` | entfällt | |
| `display` | `flex` | entfällt | |
| Label (`<p>Enemies:</p>`, `<p>Loot:</p>`) | `<p>` mit Browser-Margin 16px, 16px Schrift | `text.xs` (12/16px), `600`, `letterSpacing.label`, Großbuchstaben, `margin: 0` | **Struktur**: Doppelpunkt entfällt. Die frühere Hilfs-Zeilenhöhe 21px entfällt (K4), die Ausrichtung übernimmt `align-items: baseline` in `DetailContent`. |
| Wert | leer bzw. Beschreibung | `–` als Platzhalter | **Struktur** (Inhalt) |

---

## DocumentReader.tsx

### `SidebarLeft`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `130px` | entfällt (Spaltenbreite `200px` im `Main`) | **kein Token**, +70px |
| `height` | `100%` | `auto` | |
| `margin-top` | `100px` | `0` | Abstand zur Top-Bar kommt aus `Main`-Padding (24px) |
| `padding` | `20px 15px 0 15px` | `0` | 15px ist **nicht auf der Skala** |
| `align-items` | `center` | `stretch` | |
| `gap` | – | `space.1` (4px) | **neu**, ersetzt `margin` der `NavigationElement`s |
| `left` | `0` | entfällt | **wirkungslos** (kein `position`) |
| `bottom` | `50px` | entfällt | **wirkungslos** |
| Label „Notizen“ | – | `text.xs` (12/16px), `600`, `letterSpacing.label`, Großbuchstaben, `padding: 0 space.3 space.2` (0 12px 8px) | **neu**, **Struktur** |

### `StoryReaderContainer`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `padding-right` | `400px` | `0` | Platz für die Sidebar kommt aus der eigenen Grid-Spalte. |
| `position` | – | `relative` | **neu**, Bezugspunkt für `TopLink` |
| `min-height` | – | `0` | **neu**, damit das Scrollen in der Grid-Zeile funktioniert |
| `::-webkit-scrollbar width` | `4px` | `size.scrollbar` (4px) | Wert unverändert. Eine Größe, kein Abstand, daher eigener Token statt `space.1` (Nacharbeit DND-4). |

Hinweis **Struktur**: `DocumentReader` gibt heute `SidebarLeft` und `StoryReaderContainer` als Fragment zurück. Beide
müssen als Spalte 1 und 2 im neuen `Main` landen. Das klappt, wenn `DocumentReader` direkt in `Main` steht und
`SidebarRight` danach kommt.

### `Background` (Scroll-Container)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `padding-top` | `5px` | `0` | |
| `padding-bottom` | `5px` | `0` | |
| `margin-top` | `50px` | `0` | Ausgleich der Top-Bar entfällt, Grid übernimmt |
| `margin-bottom` | `50px` | `0` | Ausgleich der Bottom-Bar entfällt |
| `gap` | – | `space.5` (24px) | **neu**, Abstand zwischen den Seiten (heute 2 × 10px Margin = 20px) |
| übrige Regeln | | unverändert | |

### `TopLink`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `display` | `'flex'` (in Anführungszeichen) | `grid`, `place-items: center` | **wirkungslos**: ungültiger Wert, `justify-content` und `align-items` sind heute ohne Wirkung |
| `width` | `45px` | `size.control.md` (40px) | |
| `height` | `45px` | `size.control.md` (40px) | |
| `border-radius` | `5px` | `radius.md` (8px) | |
| `bottom` | `65px` | `space.4` (16px) | Heute relativ zum Viewport, neu relativ zu `StoryReaderContainer` |
| `right` | `420px` | `space.4` (16px) | Heute 400px Sidebar + 20px, neu relativ zum Container |
| `padding` | Browser-Standard (`1px 6px`) | `0` | **neu** |
| `svg width/height` | `100%` | `size.icon` (20px) | |

### `Page`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `60%` | `100%` | |
| `max-width` | – | `880px` | **neu**, **kein Token** (Layout-Maß) |
| `padding` | `30px 100px` | `space.7 space.8` (48px 64px) | |
| `margin` | `10px 0` | `0` | Abstand kommt aus `gap` im `Background` |
| `border` | `1px` | `borderWidth.thin` (1px) | |
| `border-radius` | – | `radius.lg` (12px) | **neu** |
| `h1 font-size`, `line-height` | Browser `2em` (32px), `normal` | `text.2xl` (32/40px) | K4 |
| `h1 font-weight` | Browser `bold` (700) | `fontWeight.bold` (700) | unverändert |
| `h1 margin` | Browser `0.67em` (≈ 21px) oben und unten | `0 0 space.5` (0 0 24px) | |
| `h1 padding-bottom` | `0.3em` (≈ 10px) | `space.3` (12px) | |
| `h1 border-bottom` | `1px` | `borderWidth.thin` (1px) | |
| `h2 font-size`, `line-height` | Browser `1.5em` (24px), `normal`, nicht gestylt | `text.xl` (24/32px) | **neu**, K4 |
| `h2 font-weight` | Browser `bold` (700) | `fontWeight.semibold` (600) | **neu** |
| `h2 margin` | Browser `0.83em` (≈ 20px) | `space.6 0 space.3` (32px 0 12px) | **neu** |
| `p font-size`, `line-height` | `16px`, `1.5` | `text.reading` (16/26px) | K4, Ausnahme für Fließtext |
| `p margin` | Browser `1em` oben und unten | `0 0 space.4` (0 0 16px) | **neu** |
| `p max-width` | – | `68ch` | **neu**, **kein Token** (Einheit `ch`, begrenzt die Zeilenlänge) |
| `ol` (Inhaltsverzeichnis) | nicht gestylt: Browser `padding-left: 40px`, `margin: 1em 0` | `padding-left: space.5` (24px), `margin: 0`, `display: flex`, `flex-direction: column`, `gap: space.2` (8px) | **neu**. Das Inhaltsverzeichnis ist eine nummerierte Liste (`ol`), gestylt ist heute nur `ul`. |
| `ol ol margin-top` | Browser `0` | `space.2` (8px) | **neu** |
| `ol > li > p` | erbt `p` (`text.reading`, `margin-bottom: space.4`) | `text.md` (16/24px), `margin: 0`; folgender Absatz `margin-top: space.2` (8px) | **neu**, Nacharbeit DND-4: Das Inhaltsverzeichnis in `main` ist eine lockere Liste (Leerzeilen), die Einträge stehen in `<p>`. So entspricht der Zeilenabstand dem Mockup (32px). |
| `ul padding-left` | `2em` | `space.5` (24px) | **wirkungslos**: wird von `padding-inline-start: 40px` darunter überschrieben |
| `ul padding-inline-start` | `40px` | entfällt | Doppelte Regel, eine reicht |
| `ul margin-block-start/-end` | `1em` | `0` / `space.4` (16px) | Wie bei `p` |
| `ul line-height` | `1.5` | `text.md` (24px) | optisch unverändert, K4 |
| `li line-height` | `1.5` | `text.md` (24px) | optisch unverändert, K4 |
| `a text-decoration` | Browser `underline` | `none` | **neu** |
| `.markdown-image` | `width: 100%`, `height: auto` | unverändert | |

---

## SideBarLeftElement.tsx

### `NavigationElement`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `height` | `20px` (+ 2 × 5px Padding = 30px) | `size.control.md` (40px) | Mit `border-box` inklusive Padding |
| `width` | `100%` | `100%` | Heute läuft das Element mit 2 × 5px Margin + 10px Padding über die Spalte hinaus. Mit `border-box` und ohne Margin nicht mehr. |
| `margin` | `5px` | `0` | Abstand aus `gap` der `SidebarLeft` (4px) |
| `padding` | `5px` | `0 space.3` (0 12px) | |
| `border-radius` | `5px` | `radius.md` (8px) | |
| `justify-content` | `center` | `flex-start` | Text linksbündig |
| `text-align` | `center` | `left` | |
| `font-size`, `line-height` | erbt 16px | `text.sm` (14/20px) | |
| `font-weight` | erbt 400 | `fontWeight.medium` (500) | **neu** |
| `color` | `white` und danach `text.color` | `text.color` | **Farbe**: `white` ist doppelt und wird überschrieben, kann weg (Aufräumen, keine optische Änderung). |

---

## MapOverview.tsx (geteilt mit Wall)

### `ContainerMainmaps`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `gap` (CSS) | `2px` | entfällt | **wirkungslos**: wird immer vom Inline-Style über die Prop `gap` überschrieben |
| `gap` (Prop aus `AdminScreen`) | `'3px'` | `space.2` (8px) | Prop-Wert in `AdminScreen.tsx` ändern |
| `padding` | `30px 10px` | über neue Prop `padding`: Admin `0`, Wall `'30px 10px'` (wie heute) | **geteilt**, **Struktur**: Entscheidung 4. Die Wall behält ihren Wert, bis sie umgebaut wird. |
| `flex-wrap` | `wrap` | unverändert | |

### `MainmapsColumn`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `gap` (CSS) | `2px` | entfällt | **wirkungslos**, Inline-Style überschreibt |
| `gap` (Prop) | `'3px'` | `space.2` (8px) | gleiche Prop wie oben |
| `justify-content` | `space-between` | unverändert | |

Hinweis: Das Mockup zeichnet ein CSS-Grid (`repeat(5, 1fr)`). Spalten-Flexbox mit gleichem Abstand sieht identisch
aus, deshalb ist **kein Umbau auf Grid nötig**. Die Reihenfolge wird mit dem Wall-Umbau zeilenweise
(siehe [wall-mapping.md](wall-mapping.md), Entscheidung 3). Im Admin sind keine Nummern sichtbar, die Kacheln stehen
danach aber an anderen Plätzen als heute.

---

## MapElement.tsx (geteilt mit Wall)

### `MapContainer`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `padding-top` | `56.25%` (Kampfszene) / `0` (Nicht-Kampfszene) | `56.25%` für beide, oder `aspect-ratio: 16 / 9` | Nicht-Kampfszenen bekommen im Mockup ebenfalls 16:9 (96 × 54px). Die Bedingung auf `$isMainMap` entfällt. **geteilt** (Wall nutzt nur Kampfszenen, keine Auswirkung). |
| `border-radius` | `5px` | `radius.sm` (4px) | **geteilt**, wirkt auch auf der Wall (siehe Entscheidungen) |
| `border` | `1px solid` | `borderWidth.thin` (1px) | |
| `border-style` | `solid` | entfällt | Doppelt, `border` setzt den Stil bereits |
| `box-shadow` (aktiv) | `0 0 10px` + `primary` | `none` | Entscheidung 3, **geteilt** (Wall ebenso) |
| `outline` (aktiv) | – | `borderWidth.thick` (2px) solid `primary`, `outline-offset: borderWidth.thick` (2px) | **neu**, Entscheidung 3. Der Abstand nutzt das Rahmen-Token, weil die Abstandsskala erst bei 4px beginnt. |
| `flex-grow` | `1` | unverändert | |

### `MapImage`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `border-radius` | `5px` | `radius.sm` (4px) | **geteilt** |
| `position`, `width` | mit `!important` | unverändert | Die `!important` sind ohne erkennbaren Grund. Aufräumen ist ein eigener Schritt. |

### `MapOverlay`, `NumberIcon`

Im Admin ausgeblendet (`display: none`). Sie gehören zum Wall-Mapping.

---

## SideMaps.tsx

### `ContainerSideMaps`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `height` | `75%` (= 37,5px der 50px-Bar) | `auto` | Höhe ergibt sich aus 16:9-Kacheln |
| `width` | `count × 100px` (4 × 100 = 400px) | `auto` | Breite ergibt sich aus Kachelbreite + Abständen |
| `justify-content` | `space-between` | `flex-start` | |
| `align-items` | – | `center` | **neu** |
| `gap` | `10px` | `space.2` (8px) | |
| Kachelbreite | aus `width / count` minus Abstand (≈ 92px) | `96px` | **kein Token**. Gesetzt auf `MapElement` per Wrapper oder Prop. |
| Label „Szenen“ | – | `text.xs` (12/16px), `600`, `letterSpacing.label`, Großbuchstaben, `margin-right: space.2` (8px) | **neu**, **Struktur** |

---

## Dialogue.tsx

Mockup: [mockups/v2/admin-dialog.png](mockups/v2/admin-dialog.png) (Entscheidung 7).

### `LayoutContainer`

Keine Werte zu ändern (Vollbild-Overlay).

### `DialogueContainer`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `600px` | unverändert | **kein Token** (Layout-Maß) |
| `border-radius` | – | `radius.lg` (12px) | **neu** |
| `overflow` | – | `hidden` | **neu**, damit das Bild die Rundung übernimmt |
| `align-items` | `center` | `stretch` | Text und Buttons linksbündig bzw. rechts statt zentriert |
| `gap` | – | `space.4` (16px) | **neu**, zwischen Bild, Text und Buttons |
| `padding-bottom` | – | `space.5` (24px) | **neu**, ersetzt `margin-bottom` des `ButtonContainer` |

### Textblock (neu)

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| Wrapper | – (`<p>` direkt im Container) | `display: flex`, `flex-direction: column`, `gap: space.1` (4px), `padding: 0 space.5` (0 24px) | **neu**, **Struktur** |
| Label „Szene wechseln“ | – | `text.xs` (12/16px), `600`, `letterSpacing.label`, Großbuchstaben | **neu**, **Struktur** |
| Szenenname | `<p>`: 16px, Browser-Margin `1em 0` | `text.lg` (20/28px), `font-weight: 600`, `margin: 0` | K4 |
| Beschreibung | – | `text.sm` (14/20px), `sceneOption.description` | **neu**, **Struktur** (Inhalt) |

### `ButtonContainer`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `70%` | `100%` | |
| `height` | `100%` | entfällt | **wirkungslos** (Elternelement hat keine feste Höhe) |
| `justify-content` | `space-between` | `flex-end` | Buttons rechts nebeneinander |
| `gap` | – | `space.3` (12px) | **neu** |
| `padding` | – | `0 space.5` (0 24px) | **neu** |
| `margin-bottom` | `30px` | `0` | Ersetzt durch `padding-bottom` des Containers. 30px ist auf der neuen Skala **nicht vorhanden**. |
| Reihenfolge | Confirm links, Decline rechts | Decline links, Confirm rechts | **Struktur**: Hauptaktion steht rechts außen. JSX-Reihenfolge tauschen. |

### `ConfirmButton`, `DeclineButton`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `width` | `200px` | `min-width: size.button.minWidth` (112px), `padding: 0 space.4` (0 16px) | K2: gleicher Text-Button-Stil wie auf Wall und Ground |
| `height` | `50px` | `size.control.md` (40px) | |
| `border-radius` | `5px` | `radius.md` (8px) | |
| `font-size`, `line-height` | Browser (≈ 13px) | `text.sm` (14/20px) | **neu**, K2 |
| `font-weight` | Browser 400 | `fontWeight.semibold` (600) | **neu** |
| `letter-spacing` | – | keine | K2: „Confirm“/„Decline“ sind keine Großbuchstaben |

### `DialogueImage`

| Regel | Alter Wert | Neuer Wert | Hinweis |
|---|---|---|---|
| `height` | `100%` | `auto` | **wirkungslos** (Elternelement ohne feste Höhe) |
| `aspect-ratio` | – | `16 / 9`, `object-fit: cover` | **neu**, einheitliche Höhe (337px) unabhängig vom Bildformat |
| `width` | `100%` | unverändert | |

---

## Zusammenfassung: fehlende Tokens und offene Entscheidungen

**Werte ohne Token**

| Wert | Wo | Vorschlag |
|---|---|---|
| 200px · 400px · 240px | Spalten `Main`, Spalten `Bar` | Layout-Maße, als Konstanten in der Komponente lassen |
| 880px · 68ch | `Page` | Layout-Maße |
| 96px | Label-Spalte in `DetailContent`, Kachelbreite `SideMaps` | Layout-Maß |

Mit dem Konsistenz-Abgleich erledigt: Zeilenhöhen (K4, `text.*`), Mindestbreite der Buttons (`size.button.minWidth`),
Höhe der Trennlinie (`size.icon`). Schriftgewichte sind Tokens (`fontWeight.*`).

**Fehler im Bestand, die beim Umbau mit behoben werden**

- `display: 'flex'` als String in `Details` und `TopLink` ist ungültig. Flex-Regeln dort wirken heute nicht.
- `top`/`right`/`left`/`bottom` ohne `position` in `DetailsContainer` und `SidebarLeft`.
- `DetailHeader` mit `height: 5px` – der Name läuft aus der Box.
- `padding-left: 2em` in `Page ul` wird von `padding-inline-start: 40px` überschrieben.
- CSS-`gap: 2px` in `MapOverview` wird immer vom Inline-Style überschrieben.
- Kein globales `box-sizing: border-box` – Elemente mit `width: 100%` und Padding/Margin laufen über.

**Entscheidungen:** alle getroffen, siehe [Entscheidungen](#entscheidungen-2026-10-04).
