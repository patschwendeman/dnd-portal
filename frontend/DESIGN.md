# Style Guide

Stand: 2026-10-07 (Branch `development`). Verbindliche Gestaltungsregeln für das Frontend. Der Umbau folgt Screen
für Screen nach den Mappings. Umgesetzt sind die Grundlagen ([Architektur](#architektur)), der Admin Screen
(DND-4), der Wall Screen (DND-5) und der Ground Screen (DND-6).

**Geltung:** Admin, Wall und Ground. Der Player Screen folgt später. Seine festen Farben sind unter
[2.5](#25-farben-außerhalb-der-themes) erfasst.

**Quellen**

- Mappings: [admin-mapping.md](design/admin-mapping.md), [wall-mapping.md](design/wall-mapping.md),
  [ground-mapping.md](design/ground-mapping.md). Dort steht, welcher Wert in welcher Komponente wie umgestellt wird.
- Mockups v2: [admin](design/mockups/v2/admin.png), [admin-dialog](design/mockups/v2/admin-dialog.png), [wall](design/mockups/v2/wall.png),
  [wall-world](design/mockups/v2/wall-world.png), [wall-1366](design/mockups/v2/wall-1366.png), [ground](design/mockups/v2/ground.png).
- Themes: `frontend/src/style/darkTheme.ts`, `frontend/src/style/tavernTheme.ts` (früher `lightTheme.ts`, siehe
  [Entscheidungen](#3-entscheidungen)).

Der Guide hat zwei Teile:

| Teil | Inhalt | Wechselt mit dem Theme? |
|---|---|---|
| [1. Statisch](#1-statischer-teil-ohne-farbe) | Abstände, Schrift, Radien, Größen, Bausteine, Layouts | nein |
| [2. Dynamisch](#2-dynamischer-teil-farben) | Farbrollen und ihre Werte je Theme | ja |

## Architektur

Das Theme-Objekt für `styled-components` setzt sich aus zwei Quellen zusammen:

```ts
// style/tokens.ts – statisch, für alle Themes gleich
export const tokens = { space, text, fontWeight, letterSpacing, font, radius, borderWidth, size, layer }

// style/darkTheme.ts, style/tavernTheme.ts – dynamisch, nur Farben
export const darkTheme = { colors: { … } }

// App.tsx
<ThemeProvider theme={{ ...tokens, colors: (isDarkTheme ? darkTheme : tavernTheme).colors }}>
```

Components lesen beides auf dieselbe Weise: `props.theme.space[5]`, `props.theme.text.sm`,
`props.theme.colors.primary`.

Dazu kommen:

- `style/styled.d.ts` – typisiert `DefaultTheme` (Typ von `tokens` plus `colors`). TypeScript prüft damit Zugriffe
  auf das Theme.
- `style/GlobalStyle.ts` – `createGlobalStyle` für die Grundregeln aus [1.1](#11-grundsätze). Gilt für Admin, Wall
  und Ground, nicht für den Player. Er wird nicht in `App.tsx`, sondern als `<GlobalStyle />` im jeweiligen Screen
  gerendert (jeder Screen läuft in einem eigenen Fenster). Eingebunden ist er in `AdminScreen`, `WallScreen` und
  `GroundScreen`. `index.css` wird nicht importiert.
- `style/tokens.ts` enthält außerdem den Helper `textStyle(stufe)`, der Schriftgröße und Zeilenhöhe einer
  `text.*`-Stufe gemeinsam setzt (K4). `text.<stufe>` ist ein Objekt `{ fontSize, lineHeight }`.

Namensraum: `theme.text.*` sind Schrift-Tokens, `theme.colors.text.color` ist eine Farbrolle. Beide bleiben getrennt.

---

## 1. Statischer Teil (ohne Farbe)

### 1.1 Grundsätze

- **4px-Raster:** Jeder Abstand und jede Größe kommt aus einem Token. Feste px-Werte gibt es nur als benannte
  Layout-Konstante ([1.3](#13-layout-konstanten)).
- **Globale Grundregeln:** `box-sizing: border-box` und `margin: 0` für alle Elemente. Schrift, Größe und Zeilenhöhe
  des Body: `font.family.base`, `text.md`. Gilt für Admin, Wall und Ground, nicht für den Player (`GlobalStyle`, siehe
  [Architektur](#architektur)).
- **Nichts vom Browser übernehmen:** Überschriften, Absätze, Listen und Buttons werden explizit gestylt
  (Größe, Abstand, Padding-Reset).
- **Layout per Grid und Flex:** Bereiche werden über `display: grid` und `gap` angeordnet, nicht über
  `position: fixed` mit Ausgleichs-Margins. `position: fixed` nur für Vollbild-Ebenen und schwebende Elemente,
  dann immer mit `inset`.

### 1.2 Tokens

**Abstände**

| Token | Wert |
|---|---|
| `space.1` | 4px |
| `space.2` | 8px |
| `space.3` | 12px |
| `space.4` | 16px |
| `space.5` | 24px |
| `space.6` | 32px |
| `space.7` | 48px |
| `space.8` | 64px |

**Schrift:** Jede Stufe ist ein Paar aus Schriftgröße und Zeilenhöhe. Beide werden immer zusammen gesetzt (K4).

| Token | Größe / Zeilenhöhe |
|---|---|
| `text.xs` | 12 / 16px |
| `text.sm` | 14 / 20px |
| `text.md` | 16 / 24px |
| `text.lg` | 20 / 28px |
| `text.xl` | 24 / 32px |
| `text.2xl` | 32 / 40px |
| `text.reading` | 16 / 26px – nur Fließtext in den Notizen |

| Token | Wert |
|---|---|
| `fontWeight.regular` | 400 |
| `fontWeight.medium` | 500 |
| `fontWeight.semibold` | 600 |
| `fontWeight.bold` | 700 |
| `letterSpacing.label` | .08em |
| `font.family.base` | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` – Inter über `@fontsource/inter` (400, 500, 600, 700), lokal ausgeliefert |

**Radien und Rahmen**

| Token | Wert |
|---|---|
| `radius.sm` | 4px |
| `radius.md` | 8px |
| `radius.lg` | 12px |
| `radius.xl` | 16px |
| `radius.pill` | 999px |
| `borderWidth.thin` | 1px |
| `borderWidth.thick` | 2px |

**Größen**

| Token | Wert | Wofür |
|---|---|---|
| `size.control.md` | 40px | Höhe aller Bedienelemente (Buttons, Navigation, Icon-Buttons) |
| `size.icon` | 20px | alle Icons |
| `size.scrollbar` | 4px | Breite der Scrollleiste (Notizen im Admin) |
| `size.badge` | 32px | Kachelnummer |
| `size.button.minWidth` | 112px | Mindestbreite von Text-Buttons |
| `size.bar.md` | 56px | Top-Bar, Höhe der schwebenden Steuerleiste |
| `size.bar.lg` | 80px | Bottom-Bar im Admin |

Entfallen: `size.icon.sm`, `size.icon.lg` (K1), `size.control.sm`, `fontSize.*` (ersetzt durch `text.*`).

**Ebenen (`z-index`)** (Entscheidung O4)

| Token | Wert | Wofür | Vor dem Umbau |
|---|---|---|---|
| `layer.base` | 0 | normaler Inhalt | – |
| `layer.raised` | 1 | lokal innerhalb einer Komponente, z. B. Nummer über dem Kachelbild | 99 (`MapOverlay`, `NumberIcon`) |
| `layer.media` | 1 | Vollbild-Hintergrund (Bild, Video) | 1 (`BackgroundImage`, `BackgroundMedia`) |
| `layer.grid` | 10 | Raster-Ebene auf dem Ground | 99 (`GridOverlay`) |
| `layer.panel` | 20 | Overlay-Panel auf der Wall | 99999 (`MapContainer` in `WallScreen`) |
| `layer.controls` | 30 | Hover-Fläche mit Steuerleiste | 99999 (`ScreenControlBar`) |
| `layer.dialog` | 40 | Dialog mit Abdunklung | 99999 (`Dialogue`, seit DND-4 `layer.dialog`) |

Entfallen ersatzlos (seit DND-4), weil das Grid-Layout sie überflüssig macht: 99 und 999 an `AudioControlButton`,
`AtmoButton`, `ThemeToggleButton`, 999 an `ButtonContainer` und `ConfirmButton` im Dialog. Player Screen (9 und 1) folgt mit dessen
Umbau.

### 1.3 Layout-Konstanten

Feste Maße einzelner Layouts. Sie sind **keine** Tokens und stehen als benannte Konstante in der jeweiligen Komponente.

| Wert | Wofür | Ort |
|---|---|---|
| 200px · 400px | linke und rechte Spalte im Admin | `AdminScreen` |
| 240px | Außenspalten der Top-Bar | `TopBar` |
| 880px · 68ch | maximale Breite einer Notizseite, maximale Zeilenlänge | `DocumentReader` |
| 96px | Label-Spalte der Szenen-Details, Kachelbreite der Nicht-Kampfszenen | `DetailsSideBar`, `SideMaps` |
| 1440px | maximale Breite des Wall-Panels | `WallScreen` |
| 104px | Platz für die Steuerleiste (24 + 56 + 24) | `ScreenControlBar` |
| 600px | Breite des Dialogs | `Dialogue` |
| 200px · 16px · 3ch | Breite des Sliders, Größe des Griffs, Mindestbreite der Wertanzeige (`SLIDER_WIDTH`, `SLIDER_THUMB_SIZE`, `SLIDER_VALUE_MIN_WIDTH`) | `ScreenControlBar` |

### 1.4 Regeln

**Abstände nach Beziehung:** Je enger zwei Elemente zusammengehören, desto kleiner der Abstand.

| Abstand | Beziehung | Beispiele |
|---|---|---|
| `space.1` (4) | innerhalb einer Gruppe | Icon-Gruppe, Navigationseinträge, Button-Gruppe, Label über Überschrift |
| `space.2` (8) | kleine Kacheln, Label vor Inhalt in derselben Zeile | Kacheln im Admin, „Szenen“ → Kacheln (`margin-right` am Label plus `gap`) |
| `space.3` (12) | zusammengehörige Elemente, Label → Inhalt darunter | Musik-Button → Titel, Zeilen der Details, Kacheln auf der Wall, Dialog-Buttons, „Kampfszenen“ → Kachelraster, „Notizen“ → Navigation |
| `space.4` (16) | Gruppen in einer Leiste, Elemente im Dialog | Sound-Gruppen in der Top-Bar, Bild → Text → Buttons |
| `space.5` (24) | Bereiche | Spalten im Admin, Karten, Notizseiten, Gruppen in der Steuerleiste |
| `space.6`–`space.8` | große Flächen | Innenabstand von Panel und Notizseite, Abstand zum Bildschirmrand |

**Innenabstand von Flächen**

| Fläche | Innenabstand |
|---|---|
| schwebende Steuerleiste | `space.2` |
| Karte, Dialog (Textbereich) | `space.5` |
| Leisten (seitlich) | `space.5` |
| Wall-Panel | `space.6` |
| Notizseite | `space.7` oben/unten, `space.8` seitlich |

**Schrift-Hierarchie**

| Stufe | Gewicht | Verwendung |
|---|---|---|
| `text.2xl` | `bold` | h1 in den Notizen |
| `text.xl` | `semibold` | h2 in den Notizen, Überschrift des Wall-Panels |
| `text.lg` | `semibold` | Titel von Karte und Dialog |
| `text.md` | `regular` / `semibold` / `bold` | Standard, Listen in den Notizen (`ul`, `ol`, `li`, auch Absätze in Listeneinträgen des Inhaltsverzeichnisses), h3 und h4 in den Notizen (`semibold`), App-Titel (`bold`), Kachelnummer (`bold`) |
| `text.sm` | `regular` / `medium` / `semibold` | Werte, Beschreibungen (`regular`), Navigation und Musiktitel (`medium`), Buttons, Slider-Wert, h5 und h6 in den Notizen (`semibold`) |
| `text.xs` | `semibold` | Labels |
| `text.reading` | `regular` | Fließtext (Absätze) in den Notizen |

Überschriften h3–h6 in den Notizen: Abstand `space.5` oben, `space.2` unten (h2: `space.6` / `space.3`).

**Gewichte:** `regular` für Text, `medium` für Listen- und Anzeigetext, `semibold` für Aktionen, Labels und
Überschriften ab h2, `bold` für h1, App-Titel und Kachelnummer. Andere Gewichte gibt es nicht.

**Großbuchstaben:** nur bei Labels und bei Button-Texten, die schon groß geschrieben sind (BATTLE, BLACK). Dann immer
mit `letterSpacing.label`. Normale Texte wie „Confirm“ bekommen keine Laufweite (K2).

**Radien**

| Element | Radius |
|---|---|
| Kachel im Admin | `radius.sm` |
| Kachel auf der Wall, Weltkarte | `radius.md` |
| Bedienelemente (Buttons, Navigation, Icon-Buttons) | `radius.md` |
| Karte, Notizseite, Wall-Panel, Dialog | `radius.lg` |
| schwebende Leiste | `radius.xl` |
| Badge, Slider-Schiene | `radius.pill` |

Regel für verschachtelte Flächen (K3): **äußerer Radius = innerer Radius + Innenabstand.** Beispiel: Button
`radius.md` (8) + Innenabstand `space.2` (8) = Leiste `radius.xl` (16). Bei großem Innenabstand (ab `space.5`) gilt
die Regel nicht, dort reicht `radius.lg`.

**Icons:** immer `size.icon` (20px), in Buttons immer in `size.control.md` (40px) zentriert (K1).

**Rahmen und Linien:** `borderWidth.thin` für Trennlinien, Ränder von Seiten und Kacheln. `borderWidth.thick` nur
für Aktiv-Markierungen. Senkrechte Trennlinien sind so hoch wie die Icons daneben (`size.icon`).

**Aktiv-Zustand:** Kacheln bekommen eine Outline in `borderWidth.thick` mit `outline-offset: borderWidth.thick`.
Kein Leuchten (`box-shadow`). Buttons und Navigation zeigen den Aktiv-Zustand über die Farbe
([2.4](#24-zustände)).

**Bilder:** Szenenbilder immer im Format 16:9 (`aspect-ratio: 16 / 9`) mit `object-fit: cover`. Zulässige Alternative
bei Kacheln: `padding-top: 56.25%` mit absolut positioniertem Bild (`MapElement`). Der Kachelrand ist dort eine
`outline` (seit DND-5), zählt also nicht zur Höhe: Kacheln bleiben exakt 16:9. Karten (Weltkarte)
mit `object-fit: contain`. Vollbild-Hintergründe mit `position: fixed`, `inset: 0`, `object-fit: cover`.

**Zahlen:** `font-variant-numeric: tabular-nums`, wo Zahlen sich ändern oder untereinander stehen (Kachelnummer,
Slider-Wert).

**Ebenen:** `z-index` nur über `layer.*`, nie als freie Zahl. Was im Grid-Layout ohnehin richtig liegt, bekommt keinen
`z-index`. `layer.raised` gilt nur innerhalb einer Komponente mit eigenem Stapelkontext.

**Laufweite:** nur `letterSpacing.label` bei Großbuchstaben. Überschriften und Titel haben keine Laufweite (O1).

**Übergangsdauern:** bewusst **keine** Tokens, sondern Werte in der jeweiligen Komponente (Entscheidung DND-5 E2):
`0.5s` für das Ein- und Ausblenden der Steuerleiste (`ScreenControlBar`), `0.3s` für den Nach-oben-Button
(`TopLink` in `DocumentReader`).

### 1.5 Bausteine

Wiederkehrende Elemente. In den Components werden sie gleich umgesetzt, am besten als gemeinsame Styled Components.

**Icon-Button**

| Eigenschaft | Wert |
|---|---|
| Größe | `size.control.md` × `size.control.md` |
| Icon | `size.icon`, zentriert (`display: grid; place-items: center`) |
| Radius | `radius.md` |
| Padding | `0` (Reset bei `<button>`) |
| Farbe | Icon `text.color`. Hintergrund transparent (Top-Bar) oder `secondary` (Play, Nach oben) |
| Beispiele | Sound-Buttons, Settings, Play/Pause, Nach oben |

**Text-Button** (K2) – gemeinsame Styled Component `TextButton` (`src/components/TextButton.tsx`, `<button>` mit
`$variant: 'default' | 'active' | 'cancel'`). Laufweite gehört nicht zum Baustein; bei Großbuchstaben ergänzt sie
die verwendende Komponente (z. B. `ScreenControlBar`).

| Eigenschaft | Wert |
|---|---|
| Höhe | `size.control.md` |
| Breite | `min-width: size.button.minWidth` |
| Innenabstand | `0 space.4` |
| Schrift | `text.sm`, `semibold`. Bei Großbuchstaben zusätzlich `letterSpacing.label` |
| Radius | `radius.md` |
| Farbe | inaktiv `secondary` mit `text.color`, aktiv `primary` mit `onPrimary`, Abbrechen `background` mit `text.color` |
| Beispiele | BATTLE/WORLD/OFF, BLACK/WHITE/OFF, Confirm/Decline |

**Button-Gruppe:** `display: flex`, `gap: space.1`. Mehrere Text-Buttons, von denen einer aktiv ist.

**Navigationseintrag**

| Eigenschaft | Wert |
|---|---|
| Höhe | `size.control.md` |
| Innenabstand | `0 space.3`, linksbündig |
| Schrift | `text.sm`, `medium` |
| Radius | `radius.md` |
| Abstand | `space.1` zwischen den Einträgen |
| Farbe | inaktiv `secondary` mit `text.color`, aktiv `primary` mit `onPrimary` |

**Label**

| Eigenschaft | Wert |
|---|---|
| Schrift | `text.xs`, `semibold`, `letterSpacing.label`, Großbuchstaben |
| Abstand | zum Inhalt darunter 12px: „Kampfszenen“ → Kachelraster `margin-bottom: space.3`, „Notizen“ → Navigation `padding-bottom: space.2` plus `gap` `space.1` der Spalte. Zu einer Überschrift darunter `space.1` (Aktive Szene, Szene wechseln). Zum zugehörigen Wert in einem zweizeiligen Block `0` („Musik“ → Titel). Vor Inhalt in derselben Zeile `space.2` plus `gap` („Szenen“). |
| Ausrichtung neben Werten | `align-items: baseline` |
| Beispiele | Notizen, Aktive Szene, Kampfszenen, Enemies, Loot, Musik, Szenen, Szene wechseln, Raster, Zelle |

**Karte**

| Eigenschaft | Wert |
|---|---|
| Innenabstand | `space.5` |
| Radius | `radius.lg` |
| Farbe | `secondary` |
| Aufbau | optional Label, optional Titel `text.lg`, Inhalt. Zeilen getrennt durch `borderWidth.thin` in `border`. „Kampfszenen“ hat keinen Titel, nur Label mit Anzahl. |
| Beispiele | Aktive Szene, Kampfszenen |

**Overlay-Panel** (Wall)

| Eigenschaft | Wert |
|---|---|
| Innenabstand | `space.6` |
| Radius | `radius.lg` |
| Breite | `min(1440px, 100vw − 2 × space.8, …)`, siehe [wall-mapping.md](design/wall-mapping.md) |
| Position | `space.7` unter der Oberkante, horizontal mittig |
| Kopfzeile | Überschrift `text.xl`, optional Label rechts, `space.5` zum Inhalt |
| Farbe | `background` |

**Schwebende Steuerleiste** (Wall, Ground)

| Eigenschaft | Wert |
|---|---|
| Position | `bottom: space.5`, horizontal mittig |
| Innenabstand | `space.2` |
| Radius | `radius.xl` |
| Abstand zwischen Gruppen | `space.5` |
| Sichtbarkeit | nur bei Hover über dem Screen |
| Farbe | `dark` |

**Kachel** (Szenenbild)

| Eigenschaft | Wert |
|---|---|
| Format | 16:9 (`aspect-ratio` oder `padding-top: 56.25%`, siehe [1.4](#14-regeln) Bilder) |
| Rand | `outline` `borderWidth.thin` in `border`, Abstand 0 (zählt nicht zur Größe). Aktiv ersetzt ihn die Aktiv-Outline |
| Radius | `radius.sm` (Admin), `radius.md` (Wall) |
| Aktiv | Outline `borderWidth.thick` in `primary`, Abstand `borderWidth.thick` |
| Raster | 5 Spalten, `gap` `space.2` (Admin) oder `space.3` (Wall), zeilenweise sortiert |

**Nummern-Badge**

| Eigenschaft | Wert |
|---|---|
| Größe | Höhe `size.badge`, `min-width: size.badge`, Innenabstand `0 space.2` |
| Position | `top` und `left` `space.2` in der Kachel |
| Schrift | `text.md`, `bold`, `tabular-nums`, zentriert |
| Radius | `radius.pill` |
| Farbe | Fläche `badge.background`, Text `badge.text` |
| Inhalt | Raumnummer (Position 1–25), nicht die Datenbank-ID |

**Dialog**

| Eigenschaft | Wert |
|---|---|
| Breite | 600px |
| Radius | `radius.lg`, `overflow: hidden` |
| Aufbau | Bild 16:9 bündig oben, Textbereich mit Label, Titel `text.lg` und Beschreibung `text.sm`, Buttons rechts |
| Abstände | `space.4` zwischen Bild, Text und Buttons. `space.5` seitlich und unten. `space.3` zwischen den Buttons. |
| Button-Reihenfolge | Abbrechen links, Hauptaktion rechts außen |
| Farbe | Fläche `secondary`, Hintergrund `overlay` |

**Top-Bar**

| Eigenschaft | Wert |
|---|---|
| Höhe | `size.bar.md` |
| Aufbau | Grid `240px 1fr 240px`: Titel links, Sound-Gruppen mittig, Settings rechts |
| Innenabstand | `0 space.5` |
| Gruppen | `space.4` mit Trennlinie (`borderWidth.thin` × `size.icon`, `border`), Buttons in der Gruppe `space.1` |

**Bottom-Bar** (Admin)

| Eigenschaft | Wert |
|---|---|
| Höhe | `size.bar.lg` |
| Aufbau | Grid `1fr auto 1fr`: Musik links, Nicht-Kampfszenen mittig |
| Innenabstand | `0 space.5` |
| Szenen | Kacheln 96px breit (16:9), `gap` `space.2`, Label davor |

**Slider** (Ground)

| Eigenschaft | Wert |
|---|---|
| Breite | 200px (`SLIDER_WIDTH`) |
| Schiene und Füllung | 4px hoch (MUI-Standard, nicht überschrieben), `radius.pill` |
| Griff | 16px (`SLIDER_THUMB_SIZE`) |
| Stufen | rastet in 10er-Schritten ein, ohne sichtbare Punkte |
| Wert | feste Anzeige rechts, `text.sm`, `semibold`, `tabular-nums`, `min-width: 3ch` (`SLIDER_VALUE_MIN_WIDTH`), ohne Einheit |
| Farbe | Schiene `secondary`, Füllung `primary`, Griff `text.color` |

### 1.6 Screen-Layouts

| Screen | Aufbau | Details |
|---|---|---|
| Admin | Grid in Zeilen `size.bar.md` / `1fr` / `size.bar.lg`. Mittlere Zeile: Grid in Spalten `200px 1fr 400px`, `gap` und Innenabstand `space.5`. Links Navigation, Mitte Notizen, rechts Karten. | [admin-mapping.md](design/admin-mapping.md), [Mockup](design/mockups/v2/admin.png) |
| Wall | Vollbild-Hintergrund, darüber das Overlay-Panel (BATTLE: Kachelraster, WORLD: Weltkarte) und die schwebende Steuerleiste | [wall-mapping.md](design/wall-mapping.md), [Mockup](design/mockups/v2/wall.png) |
| Ground | Vollbild-Medium (Bild oder Video), Raster-Ebene, schwebende Steuerleiste mit Raster-Optionen und Slider | [ground-mapping.md](design/ground-mapping.md), [Mockup](design/mockups/v2/ground.png) |

---

## 2. Dynamischer Teil (Farben)

### 2.1 Prinzip

- Components verwenden nur **Farbrollen** aus `theme.colors`, nie Farbwerte direkt (kein `#…`, `white`, `black`).
- Jede Rolle gibt es in **jedem** Theme. Ein Theme ist nur ein anderer Satz Werte für dieselben Rollen.
- Eine neue Farbe ist immer eine neue Rolle und wird in **allen** Themes angelegt.
- Der Theme-Wechsel läuft über den Settings-Button im Admin, wird in `localStorage` (`isDarkTheme`) gespeichert und
  über das `storage`-Event an Wall und Ground übertragen. Der Player Screen hat einen eigenen Theme-Button. Dort gilt
  die Einstellung nur auf dem jeweiligen Gerät (eigenes `localStorage`, keine Synchronisation).

### 2.2 Rollen

| Rolle | Bedeutung | Verwendung |
|---|---|---|
| `background` | Grundfläche | Hintergrund von Admin und Ground, Top-Bar, Wall-Panel, Decline-Button |
| `secondary` | erhöhte Fläche | Karten, Dialog, inaktive Buttons und Navigation, Nach-oben- und Play-Button, Kachel-Platzhalter, Slider-Schiene, Hintergrund der Wall, Linie unter der Top-Bar |
| `dark` | tiefste Fläche | Bottom-Bar, schwebende Steuerleiste |
| `primary` | Akzent, aktiv | aktive Navigation, aktive Buttons, aktive Kachel, Links, Confirm, Slider-Füllung, Musik läuft |
| `border` | Linien | Trennlinien in Karten und Top-Bar, Ränder von Notizseiten und Kacheln, Unterstrich von h1, Griff der Scrollleiste in den Notizen (bei Hover) |
| `overlay` | Abdunklung | Hintergrund hinter dem Dialog |
| `text.color` | Vordergrund | Text, Icon-Füllung, Slider-Griff |
| `onPrimary` | Vordergrund auf Akzent | Text und Icons auf `primary`: aktive Buttons, aktive Navigation, Confirm, Play-Button während die Musik läuft (Entscheidung O5) |
| `badge.background` | Fläche der Kachelnummer | Nummern-Badge auf den Kacheln der Wall |
| `badge.text` | Text der Kachelnummer | Zahl im Nummern-Badge |

### 2.3 Themes

Werte aus `frontend/src/style/darkTheme.ts` und `tavernTheme.ts`. Geändert bzw. neu durch Entscheidung O5:
`onPrimary` in beiden Themes und `primary` in Tavern (früher `#AD3131`), umgesetzt in DND-4. Neu in DND-5:
`badge.background` und `badge.text` (die bisher festen Farben der Kachelnummer, in beiden Themes gleich).

| Rolle | Dark (`darkTheme`) | Tavern (`tavernTheme`, früher `lightTheme`) |
|---|---|---|
| `primary` | `#4493F8` | `#C05E5E` (früher `#AD3131`) |
| `secondary` | `#161b23` | `#3D271C` |
| `dark` | `#020409` | `#000000` |
| `border` | `#3d444db3` | `#956F01` |
| `background` | `#0e1117` | `#140701` |
| `overlay` | `rgba(0, 0, 0, 0.850)` | `rgba(0, 0, 0, 0.850)` |
| `text.color` | `#f0f6fc` | `#CBAB96` |
| `onPrimary` | `#0e1117` (= `background`) | `#140701` (= `background`) |
| `badge.background` | `#5a5a5a` | `#5a5a5a` |
| `badge.text` | `#ffffff` | `#ffffff` |

`lightTheme` heißt seit DND-4 `tavernTheme` (Entscheidung O2): Es ist kein helles Theme, sondern ein dunkles in Braun
und Rot. Die Umbenennung betraf `lightTheme.ts` und den Import in `App.tsx`. Der `localStorage`-Schlüssel `isDarkTheme`
bleibt, damit gespeicherte Einstellungen gültig bleiben.

### 2.4 Zustände

| Zustand | Rolle |
|---|---|
| aktiv / ausgewählt | Fläche `primary`, Text und Icons `onPrimary` |
| inaktiv / normal | `secondary` |
| Abbrechen, Nebenaktion | `background` |
| Fläche auf Fläche | `background` → `secondary` (Karte darauf) → `dark` (Leiste) |
| Linie | `border`, nie `text.color`. Ausnahme: Linie unter der Top-Bar in `secondary` ([2.2](#22-rollen)) |

### 2.5 Farben außerhalb der Themes

Feste Farben im heutigen Code, die gegen [2.1](#21-prinzip) verstoßen. Die festen Farben der Kachelnummer
(`MapElement` → `NumberIcon`, `#5a5a5a` und `white`) sind seit DND-5 die Rollen `badge.background` und `badge.text`.

| Wo | Farbe | Vorschlag |
|---|---|---|
| `GroundScreen` → `gridColorMap` (Prop `gridColor` an `GridOverlay`) | `black`, `white`, `transparent` | bleibt. Die Gitterfarbe wählt der Spielleiter, sie ist eine Funktion, keine Gestaltung. |
| `ResourceBarPlayer` | 12 Werte: je ein kräftiger und ein dunkler Ton für Aktion, Bonusaktion, Bewegung, Zauber und Spezial, dazu Grau für leer und Textgrau | Rollen-Palette `resource.{action,bonus,movement,spell,special}.{strong,muted}`, `resource.empty`, `resource.text`, in beiden Themes zunächst gleich. Player Screen ist nicht Teil des aktuellen Umbaus. |


### 2.6 Kontrast

Geprüft nach WCAG 2.1 (Entscheidung O3). Ziel AA:

- **Text:** 4,5:1, große Schrift (ab 24px oder ab 18,66px fett) 3:1.
- **Bedienelemente und Grafik:** 3:1.

`border` ist halbtransparent bzw. auf der jeweiligen Fläche gemessen. Berechnet am 2026-10-04, `text.color` auf
`dark` (Dark) am 2026-10-06 mit dem Code-Wert `#020409` nachgerechnet. **Vor DND-4** sind die Werte vor dem Umbau,
**Aktuell** der Stand nach Entscheidung O5 (`onPrimary` neu, Tavern-`primary` `#AD3131` → `#C05E5E`), im Code seit
DND-4. Fett = verfehlt das Ziel.

| Paar | Verwendung | Ziel | Dark vor DND-4 | Dark aktuell | Tavern vor DND-4 | Tavern aktuell | Ergebnis aktuell | Maßnahme |
|---|---|---|---|---|---|---|---|---|
| `text.color` auf `background` | Notizen, Wall-Panel | 4,5 | 17,4 | 17,4 | 9,2 | 9,2 | ✓ beide | – |
| `text.color` auf `secondary` | Karten, Dialog, inaktive Buttons | 4,5 | 15,9 | 15,9 | 6,5 | 6,5 | ✓ beide | – |
| `text.color` auf `dark` | Bottom-Bar, Steuerleiste | 4,5 | 18,8 | 18,8 | 9,8 | 9,8 | ✓ beide | – |
| Text auf `primary` (vor DND-4 `text.color`, aktuell `onPrimary`) | aktive Buttons und Navigation, Confirm (14px) | 4,5 | **2,9** | 6,1 | **3,0** | 4,7 | ✓ beide | O5: neue Rolle `onPrimary` |
| `primary` auf `background` | Links in den Notizen (16px) | 4,5 | 6,1 | 6,1 | **3,1** | 4,7 | ✓ beide | O5: Tavern-`primary` heller |
| `primary` auf `secondary` | aktive Kachel im Admin (Outline) | 3,0 | 5,6 | 5,6 | **2,2** | 3,3 | ✓ beide | O5: Tavern-`primary` heller |
| `primary` auf `background` | aktive Kachel auf der Wall (Outline) | 3,0 | 6,1 | 6,1 | 3,1 | 4,7 | ✓ beide | – |
| `border` auf `background` | Rand der Notizseiten | 3,0 | **1,5** | **1,5** | 4,3 | 4,3 | bewusst ✗ Dark | O6: bleibt so |
| `border` auf `secondary` | Trennlinien in Karten | 3,0 | **1,5** | **1,5** | 3,0 | 3,0 | bewusst ✗ Dark | O6: bleibt so |
| `badge.text` auf `badge.background` (vor DND-5 `white` auf `#5a5a5a`) | Kachelnummer | 4,5 | 6,9 | 6,9 | 6,9 | 6,9 | ✓ | – |

**Anmerkungen**

- **Tavern-Rot:** `#C05E5E` statt `#BD5A5A`, weil `#BD5A5A` nur genau 4,50:1 erreicht. `#C05E5E` liegt mit 4,7:1 sicher
  über der Grenze.
- **`border` im Dark-Theme (O6):** Die Trennlinien sind Gestaltung, kein Bedienelement. WCAG verlangt 3:1 nur für die
  Grenzen von Bedienelementen. Kacheln sind trotzdem erkennbar, weil sie Bilder zeigen.
- Mit O5 erfüllen alle Text- und Bedien-Paare WCAG AA. Die neuen Werte sind seit DND-4 im Code. Seit DND-5 nutzt
  auch der aktive Button der Steuerleiste (Wall und Ground) `onPrimary`.

---

## 3. Entscheidungen

| # | Punkt | Entscheidung (2026-10-04) |
|---|---|---|
| O1 | Laufweite .02em (App-Titel, Wall-Überschrift) | Gestrichen. Einziges Laufweiten-Token ist `letterSpacing.label`. Mappings und Mockups v2 sind angepasst. |
| O2 | Name `lightTheme` | Umbenennung in `tavernTheme`, umgesetzt in DND-4. `localStorage`-Schlüssel bleibt. |
| O3 | Kontrast | Geprüft, Ergebnis in [2.6](#26-kontrast) |
| O4 | Ebenen (`z-index`) | Skala `layer.*` festgelegt, siehe [1.2](#12-tokens) |
| O5 | Text auf Akzentfarbe, Tavern-Akzent | Neue Rolle `onPrimary` (Dark `#0e1117`, Tavern `#140701`). Tavern-`primary` `#AD3131` → `#C05E5E` (4,7:1, statt `#BD5A5A` mit nur 4,50:1). Damit erfüllen alle Paare WCAG AA, siehe [2.6](#26-kontrast). Umgesetzt in DND-4. |
| O6 | Trennlinien in Dark (1,5:1) | Bleiben so. Sie sind Gestaltung, kein Bedienelement. |

---

## 4. Offen

Keine offenen Lücken (Stand nach DND-6).
