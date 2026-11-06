# Style Guide

Verbindliche Gestaltungsregeln für das Frontend.

**Geltung:** alle vier Screens, auch im Code. Was nur für den Player gilt, ist mit „(Player)“ markiert.

**Weitere Dateien**

- Details: [Bausteine](docs/design/components.md) (Maße und Werte je Baustein), [Layout-Konstanten und
  Screen-Layouts](docs/design/screen-layouts.md), [Kontrast und Theme-Werte](docs/design/contrast.md)
- Code: [tokens.ts](src/style/tokens.ts), [darkTheme.ts](src/style/darkTheme.ts),
  [tavernTheme.ts](src/style/tavernTheme.ts)

## Architektur

- Das Theme für `styled-components` besteht aus `tokens` (`style/tokens.ts`, statisch, für alle Themes gleich) und
  `colors` des aktiven Themes (`darkTheme.ts`, `tavernTheme.ts`); typisiert in `style/styled.d.ts`. Components lesen
  beides über `props.theme.*` und setzen Schrift mit `textStyle(stufe)`.
- `GlobalStyle.ts` enthält die Grundregeln aus [1.1](#11-grundsätze) und wird als `<GlobalStyle />` in jedem Screen
  gerendert, nicht in `App.tsx` (jeder Screen läuft in einem eigenen Fenster).
- Namensraum: `theme.text.*` sind Schrift-Tokens, `theme.colors.text.color` ist eine Farbrolle. Beide bleiben getrennt.

---

## 1. Statischer Teil (ohne Farbe)

Gilt für alle Themes gleich.

### 1.1 Grundsätze

- **4px-Raster:** Jeder Abstand und jede Größe kommt aus einem Token. Ausnahme: [1.3](#13-layout-konstanten).
- **Globale Grundregeln:** `box-sizing: border-box`, `margin: 0`; Body in `font.family.base`, `text.md`. Elemente
  (Überschriften, Absätze, Listen, Buttons) werden explizit gestylt, nichts vom Browser übernommen.
- **Layout per Grid und Flex** mit `gap`, nicht über `position: fixed` mit Ausgleichs-Margins. `position: fixed` nur
  für Vollbild-Ebenen und schwebende Elemente, dann mit `inset`.
- **Fließend statt Breakpoints:** Grid (`minmax(0, 1fr)`), keine `breakpoint.*`-Tokens; eine nötige Bedingung ist eine
  Layout-Konstante ([1.3](#13-layout-konstanten)).

### 1.2 Tokens

Die Werte stehen nur in [tokens.ts](src/style/tokens.ts).

- **Abstände:** `space.1` … `space.8`, aufsteigend auf dem 4px-Raster. **Schrift:** `text.xs`, `.sm`, `.md`, `.lg`, `.xl`,
  `.2xl`, `.reading`; jede Stufe ist Schriftgröße plus Zeilenhöhe, `textStyle()` setzt beide zusammen. **Gewichte:**
  `fontWeight.regular`/`.medium`/`.semibold`/`.bold`. **Laufweite:** `letterSpacing.label`. **Schriftart:**
  `font.family.base` (Inter, lokal über `@fontsource/inter`). **Radien:** `radius.sm`/`.md`/`.lg`/`.pill`.
  **Rahmen:** `borderWidth.thin`/`.thick`.

**Größen:** `size.control.md` (Höhe aller Bedienelemente, Icon-Buttons quadratisch), `size.control.lg` (Player und
Mindestmaß jedes Touch-Ziels, 48px nach Material, über Apples 44pt), `size.icon`, `size.iconLg` (24px, nur Menüpunkte
der Navigationsleiste), `size.scrollbar`, `size.button.minWidth`, `size.avatar.width`/`.height` (Hero-Karte im Admin,
96 × 128px), `size.badge` (Level-Badge, 36px).

**Ebenen (`z-index`):** nur über `layer.*`, nie als freie Zahl; was im Grid-Layout ohnehin richtig liegt, bekommt keinen.
Von unten nach oben: `base`, `raised` (nur lokal innerhalb einer Komponente), `media` (Vollbild-Hintergrund), `grid`
(Raster auf dem Ground), `tiles` (Party und Initiative auf der Wall), `panel` (Overlay-Panel auf der Wall), `control`
(Vollbild-Overlay), `popover` (aufklappende Listen), `dialog` (Dialog, im Player auch „Handy drehen“).

### 1.3 Layout-Konstanten

Feste px-Werte gibt es nur als Maße einzelner Layouts. Sie sind **keine** Tokens, sondern stehen als benannte Konstante
in der jeweiligen Komponente. Liste: [screen-layouts.md](docs/design/screen-layouts.md#layout-konstanten).

### 1.4 Regeln

**Abstände nach Beziehung:** Je enger zwei Elemente zusammengehören, desto kleiner der Abstand: `space.1` innerhalb einer
Gruppe (Button-Gruppe), `space.2` Label vor Inhalt und eng gestapelte Einträge, `space.3` zusammengehörige Elemente
(Avatar → Text), `space.4` Gruppen in einer Leiste (Panels im Dashboard), `space.5` Bereiche (Kacheln und Rand im Admin,
Karten), `space.6`–`space.8` große Flächen (Bildschirmrand außer im Admin, Notizseiten).

**Innenabstand von Flächen:** Karten, Dashboard-Panels und Flächen im Vollbild-Overlay `space.5`, Panels auf der Wall
`space.6`, Zeilen und Gruppen `space.1`–`space.3`; Flächen mit Bild sind bündig, Text darauf bekommt den Innenabstand.
Werte je Baustein nur in [components.md](docs/design/components.md), Bildschirmränder in
[screen-layouts.md](docs/design/screen-layouts.md).

**Schrift-Hierarchie:** `text.2xl`/`text.xl` für Überschriften und Namen (h1/h2 in den Notizen, Szenenname),
`text.lg` `semibold` für Titel von Karte und Dialog, `text.md` Standard, `text.sm` für Werte, Navigation und Buttons
(`semibold`), `text.xs` für Labels (`semibold`) und Details, `text.reading` nur für Fließtext in den Notizen. Die Stufe je
Baustein steht in [components.md](docs/design/components.md). Überschriften h3–h6 in den Notizen: `space.5` oben,
`space.2` unten (h2: `space.6` / `space.3`).

**Gewichte:** nur die aus der Schrift-Hierarchie, andere gibt es nicht.

**Großbuchstaben und Laufweite:** Großbuchstaben nur bei Labels und bei Button-Texten, die schon groß geschrieben
sind. Dann immer mit `letterSpacing.label`. Alles andere hat keine Laufweite, auch Überschriften und Titel.

**Radien:**

- `radius.md`: Bedienelemente, Felder, Avatare, Chips. `radius.lg`: Flächen und Container (Kacheln, Karten, Panels,
  Dialog, Zeilen mit Fläche). `radius.sm`: kleine Elemente (Labels auf Bildern). `radius.pill`: Badges und Punkte.
- Verschachtelt: **äußerer Radius = innerer Radius + Innenabstand**; ab `space.5` Innenabstand reicht `radius.lg`.
- Der Radius je Baustein steht in [components.md](docs/design/components.md).

**Icons:** Größen nach [1.2](#12-tokens), in Buttons zentriert. Einfache Formen (Kreis, Dreieck) sind SVG mit `fill` aus
einer Farbrolle, keine CSS-Dreiecke.

**Rahmen und Linien:** `borderWidth.thin` für Trennlinien und Ränder, `borderWidth.thick` nur für Aktiv-Markierungen.
Die Bereiche im Admin trennt der Abstand zwischen den [Kacheln](docs/design/components.md#kachel), keine Linie.

**Schatten und Aktiv-Zustand:** `box-shadow` nur als innere Lichtkante der Kachel (`inset 0 borderWidth.thin 0` in
`border`, Baustein `tileSurface`), kein Leuchten; aktiv zeigt die Farbe ([2.4](#24-zustände)).

**Durchscheinende Kacheln:** Mit Hintergrundbild des Abenteuers dahinter
([Abenteuer-Hintergrund](docs/design/components.md#abenteuer-hintergrund)) haben die Kacheln im Admin die Fläche
`secondaryTranslucent` und `backdrop-filter: blur(TILE_BLUR)`, sonst deckend `secondary`. Deckend bleiben immer Bühne,
Hinweisleiste, Flächen in den Kacheln, Auswahllisten und Dialog. Schalter `$isTranslucent` an `tileSurface`. Auf Wall
und Ground sind Panels und Overlays immer durchscheinend.

**Bilder:** Szenenbilder 16:9 mit `object-fit: cover`, Karten (Weltkarte) `contain`, Vollbild-Hintergründe `fixed` mit
`inset: 0`. **Zahlen:** `tabular-nums`, wo sie sich ändern oder untereinander stehen. **Übergangsdauern:** keine
Tokens, Werte in der Komponente. **UI-Texte:** im Player deutsch, sonst die vorhandenen Bezeichnungen.

### 1.5 Bausteine

Wiederkehrende Elemente werden in den Components gleich umgesetzt, am besten als gemeinsame Styled Components. Aufbau,
Maße, Radien und Innenabstände je Baustein: [components.md](docs/design/components.md).

Gemeinsame Komponenten: `TextButton`, `Label`, `PanelButton`, `OptionButtons` (Segment-Control), `MiniButton`,
`CombatantAvatar`, `ConfirmDialog`, `ListRow`, `PanelSlider`, `WallCharacterTile` (`src/components/`). Gemeinsame
CSS-Helper in [GlobalStyle.ts](src/style/GlobalStyle.ts): `tileSurface` (Kachel, mit Schalter für durchscheinende
Kacheln) und `hoverScrollbar`.

### 1.6 Screen-Layouts

Aufbau von Admin, Wall, Ground und Player: [screen-layouts.md](docs/design/screen-layouts.md#screen-layouts).

---

## 2. Dynamischer Teil (Farben)

Wechselt mit dem Theme.

### 2.1 Prinzip

- Components verwenden nur **Farbrollen** aus `theme.colors`, nie Farbwerte direkt (kein `#…`, `white`, `black`).
- Jede Rolle gibt es in **jedem** Theme. Ein Theme ist nur ein anderer Satz Werte für dieselben Rollen.
- Eine neue Farbe ist immer eine neue Rolle und wird in **allen** Themes angelegt.
- Das Theme (`dark` | `tavern`) wählt der Admin im Panel „Einstellungen“, der Server pusht es
  ([Synchronisation](../docs/architecture.md#synchronisation)); ein Spieler kann im Player für sein Gerät abweichen.

### 2.2 Rollen

Rolle je Baustein: [components.md](docs/design/components.md).

| Rolle | Bedeutung | Beispiel |
|---|---|---|
| `background` | Grundfläche | Hintergrund von Admin, Player, Ground; Flächen in Dashboard-Panels; Nebenaktion |
| `secondary` | erhöhte Fläche | Kacheln, Karten, Dialog, Wall-Hintergrund; inaktiver Zustand |
| `secondaryTranslucent` | `secondary` über einem Bild (Dark 75 %, Tavern 92 %) | Kacheln mit Hintergrundbild; Panels auf Wall und Ground |
| `primary` · `onPrimary` | Akzent, aktiv · Vordergrund darauf | Links, Slider-Füllung, Level-Badge, aktiver Zustand |
| `border` | Linien | Trennlinien, Rand und Lichtkante der Kacheln |
| `overlay` · `backdrop` | Abdunklung der Overlays · des Hintergrundbilds | Dialog, Vollbild-Overlay · Bild hinter den Kacheln |
| `scrim` · `onScrim` | Abdunklung auf Bildern · Vordergrund darauf | Verlauf und Text der Bühne |
| `text.color` · `text.muted` | Vordergrund · gedämpft | `muted` nur auf `background`, nicht direkt auf `secondary` (Tavern verfehlt 4,5:1) und nicht auf Wall-Kacheln |
| `initials` | Initialen | Avatar ohne Bild |
| `error` · `onError` | Fehlerfläche · Vordergrund darauf | Hinweisleiste; `error` als Text nur für defekte Querverweise |
| `qr.*` | QR-Code | dunkel auf hell, damit Kameras ihn erkennen |
| `resource.*` | Ton einer Ressource (`action`, `bonus`, `movement`, `spell`, `special`; `.strong`/`.muted`), `empty` = verbraucht | Ressourcen-Button (Player) |
| `negative.*` · `positive.*` | Bedeutung (`text`, `surface`, `border`; `surface`/`border` = `resource.special`/`.action` `muted`/`strong`) | Avatare von Gegnern bzw. Verbündeten |

### 2.3 Themes

Zwei Themes: Dark ([darkTheme.ts](src/style/darkTheme.ts)) und Tavern ([tavernTheme.ts](src/style/tavernTheme.ts)).
Gleich in beiden sind `resource.*`, `negative.*`, `positive.*`, `qr.*`, `error`, `onError` (Bedeutung, nicht Stimmung)
sowie `scrim`, `onScrim` und `backdrop` (müssen auf beliebigen Bildern funktionieren). Dass in Tavern `primary` rot ist
wie die Gegner, ist gewollt. Werte: [contrast.md](docs/design/contrast.md#theme-werte).

### 2.4 Zustände

- **aktiv / ausgewählt:** Fläche `primary`, Text und Icons `onPrimary` (aktiver Menüpunkt, gewählter Button im
  Segment-Control, aktive Szene).
- **inaktiv / normal:** `secondary`; in Dashboard-Panels (Fläche `secondary`) stattdessen `background`. Ausnahmen ohne
  eigene Fläche (Segment-Control, Sound-Gruppen, Navigation und Kopfzeile im Admin): Fläche erst bei Hover, siehe
  [Navigationseintrag](docs/design/components.md#navigationseintrag).
- **Abbrechen, Nebenaktion:** `background` (Decline-Button).
- **deaktiviert:** Fläche unverändert, Zeichen `text.muted`, `cursor: default` („−“ bei Level 1).
- **Fläche auf Fläche:** `background` → `secondary` (Rollen: [2.2](#22-rollen)). **Linie:** `border`, nie `text.color`.

### 2.5 Farben außerhalb der Themes

Einzige Ausnahme von [2.1](#21-prinzip) ist `gridColorMap` in `GroundScreen` (`black`, `white`, `transparent` für die
Prop `gridColor` an `GridOverlay`): Die Gitterfarbe wählt der Spielleiter, sie ist eine Funktion, keine Gestaltung.

### 2.6 Kontrast

Geprüft nach WCAG 2.1, Ziel AA: Text 4,5:1 (große Schrift ab 24px bzw. 18,66px fett 3:1), Bedienelemente und Grafik 3:1.

- **Bewusste Ausnahmen:** `border` im Dark-Theme, auf `secondaryTranslucent` und auf `error` (Gestaltung, kein
  Bedienelement); Flächen in `background` auf `secondary` in Dashboard-Panels (nur Zusatzsignal); tote Spieler auf den
  Wall-Kacheln (`DEAD_OPACITY` 0,45, vom User entschieden, DND-45: das Ausgrauen ist das Signal).
- **Offen:** `primary` verfehlt für Text 4,5:1 (Tavern auf `secondary` 3,3:1, auf `secondaryTranslucent` über hellem Bild
  3,0:1; Dark dort 4,0:1), betroffen sind die Text-Links in den Notizen ([known-issues.md](../docs/known-issues.md)).
- **Auf Bildern:** Gemessen wird der ungünstigste Fall (weißes bzw. schwarzes Bild). Verfehlt `secondaryTranslucent` sein
  Ziel, wird die Deckkraft erhöht, nicht die Abdunklung verringert. Wall-Kacheln: Text nur in `text.color`, Akzente als
  Fläche mit eigenem Vordergrund. Text auf der Bühne liegt auf voller Abdunklung `scrim`.

Messwerte je Farbpaar: [contrast.md](docs/design/contrast.md#kontrastmessung).
