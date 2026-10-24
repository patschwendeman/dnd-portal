# Style Guide

Verbindliche Gestaltungsregeln für das Frontend.

**Geltung:** alle vier Screens, auch im Code. Was nur für den Player gilt, ist mit „(Player)“ markiert.

**Weitere Dateien**

- Details: [Bausteine](docs/design/components.md), [Layout-Konstanten und Screen-Layouts](docs/design/screen-layouts.md),
  [Kontrast und Theme-Werte](docs/design/contrast.md)
- Code: [tokens.ts](src/style/tokens.ts), [darkTheme.ts](src/style/darkTheme.ts),
  [tavernTheme.ts](src/style/tavernTheme.ts)

## Architektur

- Das Theme-Objekt für `styled-components` besteht aus `tokens` (`style/tokens.ts`, statisch, für alle Themes gleich)
  und `colors` des aktiven Themes (`style/darkTheme.ts`, `style/tavernTheme.ts`). `App.tsx` setzt beides im
  `ThemeProvider` zusammen.
- Components lesen beides über `props.theme.*` (z. B. `props.theme.space[5]`, `props.theme.colors.primary`). Schrift
  setzen sie mit `textStyle(stufe)` aus `style/tokens.ts` ([1.2](#12-tokens) Schrift).
- `style/styled.d.ts` typisiert `DefaultTheme` (Typ von `tokens` plus `colors`). TypeScript prüft damit Zugriffe auf
  das Theme.
- `style/GlobalStyle.ts` enthält die Grundregeln aus [1.1](#11-grundsätze). Er wird nicht in `App.tsx`, sondern als
  `<GlobalStyle />` in jedem Screen gerendert (jeder Screen läuft in einem eigenen Fenster): `AdminScreen`,
  `WallScreen`, `GroundScreen`, `PlayerScreen`.
- Namensraum: `theme.text.*` sind Schrift-Tokens, `theme.colors.text.color` ist eine Farbrolle. Beide bleiben getrennt.

---

## 1. Statischer Teil (ohne Farbe)

Gilt für alle Themes gleich.

### 1.1 Grundsätze

- **4px-Raster:** Jeder Abstand und jede Größe kommt aus einem Token. Ausnahme: [1.3](#13-layout-konstanten).
- **Globale Grundregeln:** `box-sizing: border-box` und `margin: 0` für alle Elemente. Schrift, Größe und Zeilenhöhe
  des Body: `font.family.base`, `text.md`. Umgesetzt in `GlobalStyle` ([Architektur](#architektur)).
- **Nichts vom Browser übernehmen:** Überschriften, Absätze, Listen und Buttons werden explizit gestylt
  (Größe, Abstand, Padding-Reset).
- **Layout per Grid und Flex:** Bereiche werden über `display: grid` und `gap` angeordnet, nicht über
  `position: fixed` mit Ausgleichs-Margins. `position: fixed` nur für Vollbild-Ebenen und schwebende Elemente,
  dann immer mit `inset`.
- **Fließend statt Breakpoints:** Layouts passen sich über Grid (`minmax(0, 1fr)`) an die Breite an. Es gibt
  keine `breakpoint.*`-Tokens. Wo eine Bedingung nötig ist, ist sie eine Layout-Konstante ([1.3](#13-layout-konstanten)).

### 1.2 Tokens

Die Werte stehen nur in [tokens.ts](src/style/tokens.ts).

- **Abstände:** `space.1` … `space.8`, aufsteigend auf dem 4px-Raster.
- **Schrift:** `text.xs`, `text.sm`, `text.md`, `text.lg`, `text.xl`, `text.2xl`, `text.reading`. Jede Stufe ist ein
  Objekt aus Schriftgröße und Zeilenhöhe; `textStyle()` setzt beide immer zusammen.
- **Gewichte:** `fontWeight.regular`, `fontWeight.medium`, `fontWeight.semibold`, `fontWeight.bold`.
- **Laufweite:** `letterSpacing.label`.
- **Schriftart:** `font.family.base` – Inter, lokal ausgeliefert über `@fontsource/inter` in den vier Gewichten von
  `fontWeight.*`.
- **Radien:** `radius.sm`, `radius.md`, `radius.lg`, `radius.xl`, `radius.pill`.
- **Rahmen:** `borderWidth.thin`, `borderWidth.thick`.

**Größen**

| Token | Wofür |
|---|---|
| `size.control.md` | Höhe aller Bedienelemente (Buttons, Navigation), Höhe und Breite von Icon-Buttons |
| `size.control.lg` | Bedienelemente am Smartphone (Player): Höhe und Breite des Icon-Buttons, Mindestmaß für Höhe und Breite jedes Touch-Ziels. 48px nach Material (48dp), über Apples Mindestmaß (44pt) |
| `size.icon` | alle Icons außer in den Menüpunkten der Navigationsleiste |
| `size.iconLg` | Icons in den Menüpunkten der Navigationsleiste (Admin), 24px |
| `size.scrollbar` | Breite der Scrollleiste (Notizen im Admin) |
| `size.button.minWidth` | Mindestbreite von Text-Buttons |
| `size.bar.md` | Top-Bar, Höhe der schwebenden Steuerleiste |
| `size.avatar.width` · `size.avatar.height` | Avatar der Hero-Karte (Admin), 96 × 128px (Hochformat 3:4) |
| `size.badge` | Level-Badge der Hero-Karte (Admin), 36px |

**Ebenen (`z-index`):** `z-index` nur über `layer.*`, nie als freie Zahl. Was im Grid-Layout ohnehin richtig
liegt, bekommt keinen `z-index`. `layer.raised` gilt nur innerhalb einer Komponente mit eigenem Stapelkontext.
Im Player gibt es keinen `z-index`: Das Theme-Menü liegt als positioniertes Element über den nicht positionierten
Ressourcen, das Overlay „Handy drehen“ steht im JSX zuletzt und verdeckt beides.

| Token | Wofür |
|---|---|
| `layer.base` | normaler Inhalt |
| `layer.raised` | lokal innerhalb einer Komponente, z. B. ein Element über einem Bild (derzeit nicht verwendet) |
| `layer.media` | Vollbild-Hintergrund (Bild, Video) |
| `layer.grid` | Raster-Ebene auf dem Ground |
| `layer.panel` | Overlay-Panel auf der Wall |
| `layer.controls` | Hover-Fläche mit Steuerleiste |
| `layer.popover` | aufklappende Liste über dem Inhalt, z. B. Abenteuer-Auswahl im Admin |
| `layer.dialog` | Dialog mit Abdunklung |

### 1.3 Layout-Konstanten

Feste px-Werte gibt es nur als Maße einzelner Layouts. Sie sind **keine** Tokens, sondern stehen als benannte Konstante
in der jeweiligen Komponente.
Liste mit Werten und Orten: [screen-layouts.md](docs/design/screen-layouts.md#layout-konstanten).

### 1.4 Regeln

**Abstände nach Beziehung:** Je enger zwei Elemente zusammengehören, desto kleiner der Abstand.

| Abstand | Beziehung | Beispiele |
|---|---|---|
| `space.1` | innerhalb einer Gruppe | Icon-Gruppe, Navigationseinträge, Button-Gruppe, Label über Überschrift |
| `space.2` | Label vor Inhalt in derselben Zeile, Menüpunkte untereinander | Menüpunkte der Navigationsleiste; sonst als Teil zusammengesetzter Abstände, z. B. am Label der Panel-Listen |
| `space.3` | zusammengehörige Elemente, Label → Inhalt darunter | Musik-Button → Titel, Titel → senkrechter Lautstärke-Slider, Label → Inhalt im Dashboard-Panel, Zeilen im Panel „Screens“, Dialog-Buttons, „Notizen“ bzw. „Szenen“ → Navigation (`padding-bottom: space.2` am Label plus `gap` `space.1` der Spalte) |
| `space.4` | Gruppen in einer Leiste, Elemente im Dialog | Sound-Gruppen im Panel „Sounds“ (nebeneinander; umbrochene Zeilen `space.2`), Panels im Dashboard, Bild → Text → Buttons |
| `space.5` | Bereiche | Spalten im Admin, Karten, Notizseiten, Gruppen in der Steuerleiste |
| `space.6`–`space.8` | große Flächen | Abstand zum Bildschirmrand, Innenabstände nach der nächsten Tabelle |

**Innenabstand von Flächen**

| Fläche | Innenabstand |
|---|---|
| schwebende Steuerleiste | `space.2` |
| Karte, Dashboard-Panel | `space.5` |
| Dialog | `space.5` seitlich und unten |
| Leisten (seitlich) | `space.5` |
| Navigationsleiste im Admin | `space.5` oben/unten (seitlich aus `NAV_RAIL_WIDTH`) |
| Panel der Navigationsleiste im Admin | `space.5` oben/unten, `space.4` seitlich |
| Hinweisleiste | `space.1` oben/unten, `space.5` seitlich |
| Wall-Panel | `space.6` |
| Notizseite | `space.7` oben/unten, `space.8` seitlich |
| Bildschirmrand am Smartphone (Player) | `space.4` oben/unten, seitlich `max(space.5, env(safe-area-inset-left), env(safe-area-inset-right))` (braucht `viewport-fit=cover` in `index.html`) |
| Ressourcen-Button der Zauberplätze (Player) | `0 space.4` |

**Schrift-Hierarchie**

| Stufe | Gewicht | Verwendung |
|---|---|---|
| `text.2xl` | `medium` / `bold` | Charaktername und Initialen der Hero-Karte (`medium`, Admin), h1 in den Notizen (`bold`) |
| `text.xl` | `semibold` | h2 in den Notizen, Überschrift des Wall-Panels, Zahl im Ressourcen-Button (Player), Level im Panel „Level“ (Admin) |
| `text.lg` | `semibold` | Titel von Karte und Dialog, Ziffer der Zauberstufe I–IV (Player), Zeichen „−“ und „+“ im Panel „Level“ (Admin) |
| `text.md` | `regular` / `medium` / `semibold` / `bold` | Standard und Listen in den Notizen (`ul`, `ol`, `li`, auch Absätze in Listeneinträgen des Inhaltsverzeichnisses) (`regular`), Hinweis im Overlay „Handy drehen“ (`medium`, Player), h3 und h4 in den Notizen (`semibold`), Abenteuer-Auswahl in der Top-Bar (`bold`) |
| `text.sm` | `regular` / `medium` / `semibold` | Werte, Beschreibungen, Chips der Hero-Karte (`regular`), Navigation, Musiktitel, Text der Hinweisleiste und Zahl im Level-Badge (`medium`), Buttons, Slider-Wert, h5 und h6 in den Notizen (`semibold`) |
| `text.xs` | `semibold` | Labels |
| `text.reading` | `regular` | nur Fließtext (Absätze) in den Notizen |

Überschriften h3–h6 in den Notizen: Abstand `space.5` oben, `space.2` unten (h2: `space.6` / `space.3`).

**Gewichte:** nur die aus der Schrift-Hierarchie. Andere Gewichte gibt es nicht.

**Großbuchstaben und Laufweite:** Großbuchstaben nur bei Labels und bei Button-Texten, die schon groß geschrieben
sind (WORLD, BLACK). Dann immer mit `letterSpacing.label`. Alles andere hat keine Laufweite, auch Überschriften,
Titel und normale Texte wie „Confirm“.

**Radien**

| Element | Radius |
|---|---|
| Weltkarte | `radius.md` |
| Bedienelemente (Buttons, Navigation, Icon-Buttons, Ressourcen-Buttons im Player) | `radius.md` |
| Zauber- und Spezialplatz (Player) | `radius.sm` |
| Karte, Dashboard-Panel, Notizseite, Wall-Panel, Dialog | `radius.lg` |
| Vorschaubild im Panel „Aktive Szene“ | `radius.md` |
| Status-Punkt im Panel „Screens“ | `radius.pill` |
| Hero-Karte und ihr Avatar (Admin) | `radius.lg` |
| Chips der Hero-Karte (Admin) | `radius.md` |
| Level-Badge der Hero-Karte (Admin) | `radius.pill` |
| schwebende Leiste | `radius.xl` |
| Slider-Schiene | `radius.pill` |

Verschachtelte Flächen: **äußerer Radius = innerer Radius + Innenabstand.** Bei großem Innenabstand (ab
`space.5`) gilt die Regel nicht, dort reicht `radius.lg`.

**Icons:** Größen nach [1.2](#12-tokens). In Buttons ist das Icon immer zentriert. Einfache Formen (Kreis,
Dreieck der Ressourcen) sind SVG (`<circle>`, `<polygon>`, `viewBox 0 0 20 20`) mit `fill` aus einer Farbrolle, keine
CSS-Dreiecke über `border-width`.

**Rahmen und Linien:** `borderWidth.thin` für Trennlinien und Ränder von Seiten. `borderWidth.thick` nur
für Aktiv-Markierungen. Senkrechte Trennlinien sind so hoch wie die Icons daneben (`size.icon`); Ausnahme sind die
Linien rechts an Navigationsleiste und Panel im Admin, die Flächen abgrenzen und über die volle Höhe laufen.

**Aktiv-Zustand:** Kein Leuchten (`box-shadow`). Buttons und Navigation zeigen den Aktiv-Zustand über die Farbe
([2.4](#24-zustände)).

**Bilder:** Szenenbilder immer im Format 16:9 (`aspect-ratio: 16 / 9`) mit `object-fit: cover`. Karten (Weltkarte)
mit `object-fit: contain`.
Vollbild-Hintergründe mit `position: fixed`, `inset: 0`, `object-fit: cover`.

**Zahlen:** `font-variant-numeric: tabular-nums`, wo Zahlen sich ändern oder untereinander stehen (Slider-Wert,
Zahl im Ressourcen-Button, Level im Panel „Level“ und im Level-Badge).

**Übergangsdauern:** bewusst **keine** Tokens, sondern Werte in der jeweiligen Komponente.

**UI-Texte:** Admin, Wall und Ground verwenden die vorhandenen Bezeichnungen (teils englisch, z. B. WORLD, Confirm).
Im Player sind alle Texte deutsch, auch der Hinweis „Bitte das Handy quer halten“.

### 1.5 Bausteine

Wiederkehrende Elemente werden in den Components gleich umgesetzt, am besten als gemeinsame Styled Components. Als
gemeinsame Komponenten gibt es `TextButton` ([TextButton.tsx](src/components/TextButton.tsx)), `Label`
([Label.tsx](src/components/Label.tsx)) und `PanelButton` ([PanelButton.tsx](src/components/PanelButton.tsx), Icon-Button
in Dashboard-Panels).

Aufbau je Baustein in [components.md](docs/design/components.md): [Icon-Button](docs/design/components.md#icon-button),
[Text-Button](docs/design/components.md#text-button), [Button-Gruppe](docs/design/components.md#button-gruppe),
[Navigationseintrag](docs/design/components.md#navigationseintrag), [Navigationsleiste](docs/design/components.md#navigationsleiste) (Admin), [Label](docs/design/components.md#label),
[Karte](docs/design/components.md#karte), [Dashboard-Panel](docs/design/components.md#dashboard-panel) (Admin), [Hero-Karte](docs/design/components.md#hero-karte) (Admin), [Status-Punkt](docs/design/components.md#status-punkt) (Admin), [Ressourcen-Button](docs/design/components.md#ressourcen-button) (Player),
[Overlay-Panel](docs/design/components.md#overlay-panel) (Wall), [Schwebende Steuerleiste](docs/design/components.md#schwebende-steuerleiste)
(Wall, Ground),
[Dialog](docs/design/components.md#dialog), [Dialog „Spieler verbinden“](docs/design/components.md#dialog-spieler-verbinden) (Admin), [Top-Bar](docs/design/components.md#top-bar),
[Theme-Menü](docs/design/components.md#theme-menü) (Player), [Hinweisleiste](docs/design/components.md#hinweisleiste) (Admin),
[Slider](docs/design/components.md#slider) (Ground).

### 1.6 Screen-Layouts

Aufbau von Admin (Grid aus Top-Bar, Navigationsleiste mit Panel, Notizen und Dashboard), Wall (Vollbild mit Overlay-Panel und Steuerleiste),
Ground (Vollbild-Medium mit Raster und Steuerleiste) und Player (Smartphone im Querformat, Karte mit
Ressourcen-Buttons): [screen-layouts.md](docs/design/screen-layouts.md#screen-layouts).

---

## 2. Dynamischer Teil (Farben)

Wechselt mit dem Theme.

### 2.1 Prinzip

- Components verwenden nur **Farbrollen** aus `theme.colors`, nie Farbwerte direkt (kein `#…`, `white`, `black`).
- Jede Rolle gibt es in **jedem** Theme. Ein Theme ist nur ein anderer Satz Werte für dieselben Rollen.
- Eine neue Farbe ist immer eine neue Rolle und wird in **allen** Themes angelegt.
- Der Theme-Wechsel läuft über den Settings-Button im Admin: Er speichert das Theme (`dark` | `tavern`) auf dem
  Server, der es per WebSocket an Admin, Wall, Ground und Player pusht ([Synchronisation](../docs/architecture.md#synchronisation)).
  Im Player kann ein Spieler über das Theme-Menü des Settings-Buttons nur für sein Gerät abweichen („Wie Spieltisch“,
  „Dunkel“, „Taverne“; `localStorage` `playerThemeOverride`).

### 2.2 Rollen

| Rolle | Bedeutung | Verwendung |
|---|---|---|
| `background` | Grundfläche | Hintergrund von Admin und Ground, Top-Bar, Navigationsleiste und Panel im Admin, Wall-Panel, Nebenaktion ([2.4](#24-zustände)); Flächen in Dashboard-Panels (Vorschaubilder, Play-Button ohne Musik, Slider-Schiene der Lautstärke, Buttons „In neuem Fenster öffnen“, „QR-Code“, „−“ und „+“, inaktiver Button im Panel „Wall-Overlay“, Hero-Karte), Ring um das Level-Badge |
| `secondary` | erhöhte Fläche | Karten, Dashboard-Panels, Dialog, Avatar und Chips der Hero-Karte, Nach-oben-Button, Slider-Schiene, Hintergrund der Wall, Linie unter der Top-Bar, Linien rechts an Navigationsleiste und Panel im Admin, inaktiver Zustand ([2.4](#24-zustände)) |
| `dark` | tiefste Fläche | schwebende Steuerleiste |
| `primary` | Akzent, aktiv | Links, Slider-Füllung, Status-Punkt „verbunden“, Level-Badge der Hero-Karte, aktiver Zustand ([2.4](#24-zustände)) |
| `border` | Linien | Trennlinien in Karten und Top-Bar, Rand von Avatar und Chips der Hero-Karte, Ränder von Notizseiten, Unterstrich von h1, Griff der Scrollleiste in den Notizen (bei Hover) |
| `overlay` | Abdunklung | Hintergrund hinter dem Dialog |
| `text.color` | Vordergrund | Text, Icon-Füllung, Slider-Griff, Ring des Status-Punkts „nicht verbunden“ |
| `text.muted` | gedämpfter Vordergrund (`text.color` mit Transparenz) | Spielername (Label) der Hero-Karte, Zeichen deaktivierter Buttons ([2.4](#24-zustände)) |
| `initials` | Initialen | Initialen im Avatar der Hero-Karte ohne Bild (Dark: wie `primary`, Tavern: wie `text.color`) |
| `onPrimary` | Vordergrund auf Akzent | aktiver Zustand ([2.4](#24-zustände)), Zahl im Level-Badge |
| `error` | Fläche für Fehler | Hinweisleiste im Admin |
| `onError` | Vordergrund auf `error` | Text, Icon und Fokus-Outline der Hinweisleiste |
| `qr.foreground` · `qr.background` | Module und Grund des QR-Codes | QR-Code im Dialog „Spieler verbinden“ (Admin); dunkel auf hell, damit Kameras ihn sicher erkennen |
| `resource.<art>.strong` | kräftiger Ton einer Ressource (`action`, `bonus`, `movement`, `spell`, `special`) | Rahmen des Ressourcen-Buttons, verfügbare Icons und Plätze (Player) |
| `resource.<art>.muted` | dunkler Ton einer Ressource | Fläche des Ressourcen-Buttons (Player) |
| `resource.empty` | verbraucht | verbrauchte Icons und Plätze (Player) |

### 2.3 Themes

Zwei Themes: Dark (`darkTheme`, [darkTheme.ts](src/style/darkTheme.ts)) und Tavern (`tavernTheme`,
[tavernTheme.ts](src/style/tavernTheme.ts)). `resource.*`, `qr.*`, `error` und `onError` sind in beiden Themes
gleich, weil sie Bedeutung tragen, nicht Stimmung. Die `resource.*`-Töne sind so gewählt, dass alle Grafik-Paare 3:1 erreichen. Werte: [contrast.md](docs/design/contrast.md#theme-werte).

### 2.4 Zustände

| Zustand | Rolle | Beispiele |
|---|---|---|
| aktiv / ausgewählt | Fläche `primary`, Text und Icons `onPrimary` | aktive Buttons und Navigation, aktiver Menüpunkt der Navigationsleiste, aktive Szene im Panel „Szenen“, Icon-Button „Dashboard“ bei offenem Dashboard, Icon-Button „Vollbild“ bei Admin im Vollbild, Confirm, Play-Button während die Musik läuft |
| inaktiv / normal | `secondary` | inaktive Buttons und Navigation; in Dashboard-Panels (Fläche `secondary`) stattdessen `background`, z. B. Play-Button ohne Musik; Ausnahme: inaktive Menüpunkte der Navigationsleiste und Panel-Einträge im Admin ohne eigene Fläche, `secondary` nur bei Hover ([Navigationsleiste](docs/design/components.md#navigationsleiste), [Navigationseintrag](docs/design/components.md#navigationseintrag)) |
| Abbrechen, Nebenaktion | `background` | Decline-Button |
| deaktiviert | Fläche unverändert, Zeichen `text.muted`, `cursor: default` | „−“ bei Level 1, „+“ bei Level 20 im Panel „Level“ |
| Fläche auf Fläche | `background` → `secondary` → `dark` | welche Fläche welche Rolle hat: [2.2](#22-rollen) |
| Linie | `border`, nie `text.color` | Ausnahme: `secondary` für die Linie unter der Top-Bar und die Linien rechts an Navigationsleiste und Panel im Admin ([2.2](#22-rollen)) |

### 2.5 Farben außerhalb der Themes

Einzige Ausnahme von [2.1](#21-prinzip) ist `gridColorMap` in `GroundScreen` (`black`, `white`, `transparent` für die
Prop `gridColor` an `GridOverlay`): Die Gitterfarbe wählt der Spielleiter, sie ist eine Funktion, keine Gestaltung.
Die Farben der Ressourcen sind Rollen ([2.2](#22-rollen)).

### 2.6 Kontrast

Geprüft nach WCAG 2.1. Ziel AA:

- **Text:** 4,5:1, große Schrift (ab 24px oder ab 18,66px fett) 3:1.
- **Bedienelemente und Grafik:** 3:1.
- **Ausnahme:** `border` im Dark-Theme und die Linien in `secondary` auf `background` (unter der Top-Bar, rechts an
  Navigationsleiste und Panel im Admin) in beiden Themes verfehlen 3:1 bewusst: Trennlinien sind Gestaltung, kein
  Bedienelement, und WCAG verlangt 3:1 nur für die Grenzen von Bedienelementen.
- **Ausnahme:** Die Flächen in `background` auf `secondary` in den Dashboard-Panels (Buttons, Slider-Schiene, leere
  Bildfläche) verfehlen 3:1 in beiden Themes bewusst: Die Fläche ist nur ein Zusatzsignal, erkennbar sind die
  Bedienelemente an Icon, Text bzw. Griff, die das Ziel erreichen.

Messwerte je Farbpaar und Anmerkungen: [contrast.md](docs/design/contrast.md#kontrastmessung).
