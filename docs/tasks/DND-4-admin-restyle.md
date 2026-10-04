# DND-4: Restyle Admin Screen (Schritt 1 von 3: Admin, danach Wall, danach Ground)

**Typ:** style
**Status:** Freigegeben

## Kontext & Ziel

Der Admin Screen ist das Arbeitswerkzeug des Spielleiters. Heute ist er mit festen px-Werten gebaut, die nicht
zusammenpassen. Die Bereiche sind per `position: fixed` mit Ausgleichs-Margins platziert, und Farben wie Schrift
sind uneinheitlich. Dieser Task stellt ihn auf den Style Guide um: Bei 1920 × 1080 sieht er aus wie die Mockups v2
und nutzt ausschließlich Tokens und Farbrollen aus `frontend/DESIGN.md`. Feste px-Werte gibt es nur noch als benannte
Layout-Konstanten. Er ist der erste von drei Restyling-Tasks und legt die gemeinsamen Grundlagen (Tokens, Theme-Typen,
GlobalStyle, Schrift) für Wall und Ground.

**Verbindliche Grundlage.** Die Entscheidungen darin werden hier nicht neu diskutiert:
- [frontend/DESIGN.md](../../frontend/DESIGN.md): Tokens, Regeln, Bausteine, Farbrollen, Architektur
- [frontend/design/admin-mapping.md](../../frontend/design/admin-mapping.md): Soll-Werte je Styled Component inkl.
  Entscheidungen 1–7 und K1–K4
- Mockups: [admin.png](../../frontend/design/mockups/v2/admin.png),
  [admin-dialog.png](../../frontend/design/mockups/v2/admin-dialog.png) (Quelle: `admin.html`, `admin-dialog.html`)

## Invarianten

- Die Funktion bleibt unverändert: Szenenauswahl mit Bestätigungsdialog (Kampf- und Nicht-Kampfszenen), Musik
  (Play/Pause, Playlist je Szene), Atmo-Sounds, Notizen-Tabs inkl. Scrollen und „nach oben“, Theme-Wechsel.
- Die Synchronisation über `localStorage` zwischen Admin, Wall und Ground bleibt unverändert (`activeSceneId`,
  `activeMapId`, `isDarkTheme`). Der Schlüssel `isDarkTheme` bleibt.
- Routen, API und Backend bleiben unverändert.
- `data-test-id`-Attribute (`container-mainmaps`, Kachel-`src`, `confirm-button`, `decline-button`) bleiben erhalten,
  damit die BDD-Schritte weiter greifen.
- Wall und Ground funktionieren weiter. Optisch ändern sich dort nur die in Kauf genommenen Punkte (siehe E5).
- Der Player Screen bekommt keine neuen Grundregeln (E3). Er ändert sich nur durch den neuen Tavern-`primary`.

## Scope / Non-Goals

**Im Scope**
- Grundlagen nach DESIGN.md, Abschnitt „Architektur“: `src/style/tokens.ts`, `src/style/styled.d.ts`
  (`DefaultTheme`), `src/style/GlobalStyle.ts`, `@fontsource/inter` (400/500/600/700), ThemeProvider in `App.tsx`
  aus `tokens` und den `colors` des aktiven Themes
- Farben nach DESIGN.md O2/O5: neue Rolle `onPrimary`, Tavern-`primary` `#C05E5E`, `lightTheme` → `tavernTheme`
- Alle Styled Components aus `admin-mapping.md`: `AdminScreen`, `TopBar`, `DetailsSideBar`, `DocumentReader`,
  `SideBarLeftElement`, `SideMaps`, `Dialogue` sowie die geteilten `MapOverview` und `MapElement`
- `z-index` der angefassten Components über `layer.*`
- Doku: DESIGN.md, admin-mapping.md, `docs/screens.md`, `frontend/CLAUDE.md`

**Nicht im Scope**
- Layout von Wall und Ground (eigene Tasks), darunter `WallScreen`, `GroundScreen`, `ScreenControlBar` und
  `GridOverlay` samt ihrer `z-index`-Werte
- `MapOverlay`/`NumberIcon` in `MapElement` (gehören zum Wall-Mapping) und die zeilenweise Reihenfolge der Kacheln
  (Wall-Mapping, Entscheidung 3)
- Player Screen, Backend
- Aufräumen von `src/index.css` (wird nicht importiert) und der `!important` in `MapImage`
- Hover-Zustände, die weder Mockup noch Mapping festlegen

## Entscheidungen

### E1: Typ `style`, Grundlagen als eigener `refactor`-Schritt
- **Entscheidung:** Der Task hat den Typ `style`, weil sich das Aussehen bewusst ändert, die Funktion aber nicht.
  Schritt 1 enthält nur Strukturarbeit ohne sichtbare Änderung (Tokens, `DefaultTheme`, ThemeProvider, Umbenennung
  in `tavernTheme`). Er wird als `refactor(DND-4): …` committet, alle übrigen Schritte als `style(DND-4): …`.
- **Verworfene Alternativen:** Der ganze Task als `refactor`. Das passt nicht, weil sich das Aussehen sichtbar ändert.
- **Begründung:** Die Struktur lässt sich so getrennt von der Optik prüfen (Nachweis: kein sichtbarer Unterschied
  nach Schritt 1).

### E2: Token-Namen für Leistenhöhen: `size.bar.md` / `size.bar.lg`
- **Entscheidung:** `size.bar.md` = 56px, `size.bar.lg` = 80px. DESIGN.md und admin-mapping.md werden von `size.bar`
  auf `size.bar.md` angepasst.
- **Verworfene Alternativen:** `size.bar` / `size.barLg`
- **Begründung:** In TypeScript kann `size.bar` nicht zugleich Wert und Objekt sein. Das Muster entspricht
  `size.control.md`.

### E3: GlobalStyle nur auf Admin, Wall und Ground, eingebunden je Screen
- **Entscheidung:** `GlobalStyle` wird nicht in `App.tsx` eingebunden, sondern als `<GlobalStyle />` in den Screens
  gerendert. Jeder Screen läuft in einem eigenen Fenster, damit gelten die Regeln nur dort. In diesem Task bindet nur
  `AdminScreen` ihn ein. Wall und Ground folgen in ihren Tasks. DESIGN.md (1.1 und Architektur) vermerkt die
  Einschränkung: „gilt für Admin, Wall und Ground, nicht für den Player“.
- **Verworfene Alternativen:** Global in `App.tsx`. Dann verschiebt sich der Player, der nicht im Scope ist.
  Sofort auch in Wall und Ground. Dann ändern sich dort Schrift und Box-Modell außerhalb der in Kauf genommenen Punkte.
- **Begründung:** Wahl des Users (nicht für den Player). Der Zeitpunkt für Wall und Ground folgt aus der Invariante
  „Wall und Ground nur mit den in Kauf genommenen Änderungen“.

### E4: Form der Schrift-Tokens
- **Entscheidung:** `text.<stufe>` ist ein Objekt `{ fontSize, lineHeight }`, z. B. `text.md = { fontSize: '16px',
  lineHeight: '24px' }`. Ein kleiner `css`-Helper in `src/style/` setzt beide Werte zusammen (K4). Components sollen
  nicht nur einen der beiden setzen. `space` ist ein Objekt mit den Schlüsseln 1–8 (`theme.space[5]`). Alle Werte sind
  Strings mit Einheit.
- **Begründung:** K4 verlangt, dass Größe und Zeilenhöhe immer zusammen gesetzt werden. Der Zugriff
  `props.theme.space[5]` entspricht DESIGN.md.

### E5: In Kauf genommene Änderungen außerhalb des Admin Screens
- **Entscheidung:** Diese Punkte sind gewollt und kein Verstoß gegen die Invarianten:
  - **Wall:** Kachelradius 5px → 4px, aktive Kachel mit Outline (2px `primary`, Abstand 2px) statt Leuchten
    (admin-mapping.md, „Folge aus 3 und 4“). Das Padding von `ContainerMainmaps` bleibt über die Prop `'30px 10px'`.
  - **Alle Screens im Tavern-Theme:** `primary` wird `#C05E5E` statt `#AD3131` (O5, Theme-Farbe).
- **Begründung:** So vorgegeben in den Mappings und in DESIGN.md.

### E6: Musiktitel in der Bottom-Bar
- **Entscheidung:** Der Titel wird aus `activeMusicSRC` abgeleitet: letzter Pfadteil, ohne Endung und ohne einen
  von Vite angehängten Hash, `_` wird zu Leerzeichen (`From_Past_To_Present.mp3` → „From Past To Present“). Das macht
  eine reine Funktion in `src/utils/utils.ts` mit Unit-Test.
- **Begründung:** Das Mapping fordert die Ableitung, legt das Format aber nicht fest. Das Mockup zeigt genau diese
  Form. Im Build hängt Vite an importierte Dateien (`defaultMusic`) einen Hash an.

### E7: Texte der neuen Labels
- **Entscheidung:** Die Labels werden wie im Mockup geschrieben und per `text-transform: uppercase` groß gesetzt:
  „Notizen“, „Aktive Szene“, „Enemies“, „Loot“ (Wert jeweils `–`), „Kampfszenen“ mit Anzahl (`mainmaps.length`),
  „Musik“, „Szenen“, „Szene wechseln“. Der App-Titel lautet „DnD Portal“.
- **Begründung:** Das Mockup gibt die Texte vor. Die Mischung aus Deutsch und Englisch (Enemies/Loot) bleibt wie
  heute.

## Subtasks

Jeder Schritt ist für sich lauffähig. Nach jedem Schritt: `npm run lint`, `npm run test:unit`, `npm run build`
grün. Pro Schritt ein Commit.

### Schritt 1: Grundlagen ohne sichtbare Änderung (`refactor(DND-4): …`)

#### Frontend
- [ ] `src/style/tokens.ts`: alle statischen Tokens aus DESIGN.md 1.2 (`space`, `text` nach E4, `fontWeight`,
      `letterSpacing`, `font`, `radius`, `borderWidth`, `size` mit `size.bar.md`/`.lg` nach E2, `layer`) und der
      `css`-Helper für `text.*`
- [ ] `src/style/lightTheme.ts` → `src/style/tavernTheme.ts`, Export `tavernTheme`, Import in `App.tsx` angepasst.
      Farbwerte bleiben in diesem Schritt unverändert.
- [ ] `src/style/styled.d.ts`: `DefaultTheme` = Typ von `tokens` + `colors` (aus `darkTheme` abgeleitet)
- [ ] `App.tsx`: `<ThemeProvider theme={{ ...tokens, colors: (isDarkTheme ? darkTheme : tavernTheme).colors }}>`
- [ ] Nachweis: `tsc -b` prüft jetzt Theme-Zugriffe. Admin, Wall, Ground und Player sehen unverändert aus.

### Schritt 2: Farben, Schrift, GlobalStyle

#### Frontend
- [ ] Rolle `onPrimary` in beiden Themes (Dark `#0e1117`, Tavern `#140701`). Tavern-`primary` → `#C05E5E`.
- [ ] `@fontsource/inter` als Abhängigkeit (400, 500, 600, 700), Import in `main.tsx`
- [ ] `src/style/GlobalStyle.ts` (`createGlobalStyle`): `*, *::before, *::after { box-sizing: border-box;
      margin: 0 }`, Body mit `font.family.base` und `text.md`. Eingebunden nur in `AdminScreen` (E3).
- [ ] `Screen` in `AdminScreen`: System-Stack entfernen, Schrift kommt aus dem GlobalStyle
- [ ] Hinweis: Nach diesem Schritt kann das alte Admin-Layout durch `border-box`/`margin: 0` verrutschen. Das ist
      zulässig, solange alles bedienbar bleibt. Schritt 3 stellt das Layout um.

### Schritt 3: Layout-Gerüst (Grid)

#### Frontend
- [ ] `AdminScreen` → `Screen`: `display: grid`, Zeilen `size.bar.md 1fr size.bar.lg`
- [ ] Neuer Wrapper `Main`: Spalten `200px 1fr 400px` (benannte Layout-Konstanten), `gap`/`padding` `space.5`,
      `min-height: 0`. `DocumentReader` (Spalte 1 + 2) und `SidebarRight` (Spalte 3) liegen darin.
- [ ] `SidebarRight`, `BottomBar`, `TopBar`/`Bar`: `position: fixed` und Ausgleichsmaße entfernen, in die
      Grid-Zeilen/-Spalten einordnen (Werte laut Mapping)
- [ ] `DocumentReader`: `SidebarLeft` (Breite, Margin, Padding, wirkungslose Regeln), `StoryReaderContainer`
      (`padding-right` weg, `position: relative`, `min-height: 0`), `Background` (Margins/Paddings weg,
      `gap: space.5`) laut Mapping
- [ ] `z-index`-Werte entfernen, die das Grid überflüssig macht (`AudioControlButton`, `AtmoButton`,
      `ThemeToggleButton`, DESIGN.md 1.2 „Entfallen ersatzlos“)

### Schritt 4: Top-Bar und Bottom-Bar

#### Frontend
- [ ] `TopBar`: Grid `240px 1fr 240px` (Layout-Konstante), `padding 0 space.5`, `border-bottom` `borderWidth.thin`,
      Titel „DnD Portal“, Sound-Container (`gap space.4`) mit Gruppen-Wrappern (`gap space.1`),
      `Seperator` → `Separator` als senkrechte Linie in `colors.border` (Entscheidung 5), `AtmoButton` und
      `ThemeToggleButton` laut Mapping (40px, `radius.md`, Icons `size.icon`, Button-Reset)
- [ ] `BottomBar`: Grid `1fr auto 1fr`, `padding 0 space.5`. Wrapper `Music` mit `AudioControlButton` (40 × 40,
      `radius.md`, Icon `size.icon`, beim Abspielen Icon in `onPrimary`), Label „Musik“ und Titel nach E6
- [ ] `utils.ts`: Funktion für den Musiktitel (E6) plus Unit-Test in `__tests__/unit/`
- [ ] `SideMaps`: Container laut Mapping (`gap space.2`, `align-items: center`, Höhe/Breite `auto`), Label „Szenen“,
      Kachelbreite 96px (Layout-Konstante, per Wrapper oder Prop)
- [ ] `MapElement` (geteilt): 16:9 für beide Kachelarten (`aspect-ratio` oder `56.25%`), `radius.sm`, `border`
      `borderWidth.thin`, aktiv per `outline` `borderWidth.thick` `primary` mit `outline-offset: borderWidth.thick`,
      kein `box-shadow`. `MapOverlay`/`NumberIcon` bleiben unverändert (inkl. `z-index`, gehört zum Wall-Task).

### Schritt 5: Sidebar links und Notizen

#### Frontend
- [ ] `SidebarLeft`: Label „Notizen“, `gap space.1`, `align-items: stretch`
- [ ] `SideBarLeftElement` → `NavigationElement`: `size.control.md`, `padding 0 space.3`, `radius.md`, `text.sm`,
      `fontWeight.medium`, linksbündig, doppeltes `white` entfernen, aktiv mit Text in `onPrimary`
- [ ] `DocumentReader` → `Page`: `max-width` 880px, `padding space.7 space.8`, `radius.lg`, Typografie für h1, h2,
      p, ol, ul, li, a laut Mapping (`text.2xl`/`xl`/`reading`/`md`, `p max-width` 68ch, Links ohne Unterstreichung)
- [ ] `TopLink`: `display: grid` statt `'flex'`, 40 × 40, `radius.md`, `bottom`/`right` `space.4` relativ zum
      `StoryReaderContainer`, Button-Reset, Icon `size.icon`

### Schritt 6: Sidebar rechts

#### Frontend
- [ ] `DetailsSideBar`: Karte „Aktive Szene“ laut Mapping (`Details` mit gültigem `display: flex`,
      `padding space.5`, `radius.lg`). Header mit Label, Name (`text.lg`, 600) und Beschreibung (`text.sm`). Zeilen
      `DetailContent` als Grid `96px 1fr` (Layout-Konstante), Labels „Enemies“/„Loot“ mit Wert `–` (E7).
      `DetailsContainer` darf entfallen.
- [ ] `SidebarMapContainer`: Karte „Kampfszenen“ (`colors.secondary`, `padding space.5`, `radius.lg`). Überschrift
      mit Anzahl `mainmaps.length`, `margin-bottom space.3`.
- [ ] `MapOverview` (geteilt): neue Prop `padding`. Admin übergibt `0`, Wall übergibt `'30px 10px'`. Das wirkungslose
      CSS-`gap` entfernen, Admin übergibt `gap` = `space.2`. Die Wall-Werte (`gap='10px'`, Padding) bleiben
      optisch gleich.

### Schritt 7: Dialog

#### Frontend
- [ ] `Dialogue` laut Mapping und [admin-dialog.png](../../frontend/design/mockups/v2/admin-dialog.png):
      `DialogueContainer` (`radius.lg`, `overflow: hidden`, `gap space.4`, `padding-bottom space.5`,
      `align-items: stretch`). Textblock mit Label „Szene wechseln“, Name (`text.lg`, 600) und Beschreibung
      (`sceneOption.description`, `text.sm`). `DialogueImage` 16:9 `cover`.
- [ ] `ButtonContainer`: rechtsbündig, `gap space.3`, Reihenfolge Decline → Confirm. `z-index` entfernen.
- [ ] `ConfirmButton`/`DeclineButton` nach K2 (40px hoch, `min-width` `size.button.minWidth`,
      `padding 0 space.4`, `radius.md`, `text.sm`, `fontWeight.semibold`, ohne Laufweite). Confirm-Text in
      `onPrimary`. Button-Reset.
- [ ] `LayoutContainer`: `z-index` → `layer.dialog`

### Schritt 8: Doku

#### Doku
- [ ] `frontend/DESIGN.md`: `size.bar` → `size.bar.md` (E2), Geltung des GlobalStyle (E3), Hinweis „Noch nicht im
      Code umgesetzt“ für Grundlagen und Admin aktualisieren
- [ ] `frontend/design/admin-mapping.md`: `size.bar` → `size.bar.md`, Stand-Vermerk „umgesetzt in DND-4“
- [ ] `docs/screens.md`: Ist-Stand des Admin Screens (Layout, neue Labels, Musiktitel)
- [ ] `frontend/CLAUDE.md`: `src/style/` (tokens, tavernTheme, GlobalStyle, styled.d.ts), Inter-Abhängigkeit
- [ ] `docs/known-issues.md`: behobene Punkte aus „Fehler im Bestand“ (admin-mapping.md) streichen, falls dort geführt

## Akzeptanzkriterien

- [ ] AK1: Bei 1920 × 1080 entspricht der Admin Screen in beiden Themes den Mockups v2 `admin.png` und
      `admin-dialog.png` (Layout, Abstände, Größen, Schrift, Radien, Aktiv-Markierungen). Farben im Tavern-Theme
      nach dessen Rollen.
- [ ] AK2: Die angefassten Components nutzen nur Tokens und Farbrollen aus `theme`. Feste px-Werte gibt es nur als
      benannte Layout-Konstanten aus DESIGN.md 1.3 (200/400, 240, 880/68ch, 96, 600). Keine hart codierten Farben.
      `z-index` nur über `layer.*`. (Prüfbar per `grep` auf `px`, `#`, `z-index` in den betroffenen Dateien.)
      Ausgenommen sind `MapOverlay`/`NumberIcon` und der Wall-Wert `'30px 10px'`.
- [ ] AK3: Die Grundlagen stehen nach DESIGN.md „Architektur“ (`tokens.ts`, `styled.d.ts`, `GlobalStyle.ts`,
      ThemeProvider aus `tokens` und `colors`). `tavernTheme` ersetzt `lightTheme`. `onPrimary` und `#C05E5E` sind
      gesetzt. Inter wird lokal ausgeliefert (keine Anfrage an externe Server).
- [ ] AK4: Alle Invarianten sind eingehalten. Die Funktion ist unverändert, Wall und Ground ändern sich nur nach E5.
      Der Player hat keine neuen Grundregeln.
- [ ] AK5: Lint, Unit-Tests und Build sind grün (bekannte Altfehler ausgenommen).
- [ ] AK6: Bestehende Tests bleiben inhaltlich unverändert. Neu ist nur der Unit-Test für den Musiktitel (E6).
- [ ] AK7: Schritt 1 ist als `refactor(DND-4)` committet und ändert nichts Sichtbares.

## Teststrategie / Verifikation

**Automatisch**
- Frontend: `npm run lint`, `npm run test:unit`, `npm run build` (inkl. `tsc -b`) nach jedem Schritt
- Neuer Unit-Test für die Musiktitel-Funktion (Pfad mit und ohne Vite-Hash, mit Unterstrichen)
- BDD (`npm run test:e2e`), wenn das Backend läuft. Selektoren bleiben gleich.

**Manuell** (Backend und Frontend per `docker compose up --build` im Root, Browser-Viewport 1920 × 1080)
1. `/admin` im Dark-Theme: Screenshot neben `admin.png` legen. Prüfen: Top-Bar (Titel, Sound-Gruppen mittig,
   Trennlinien, Zahnrad), linke Spalte (Label, Tabs, aktiver Tab), Notizseite (Breite, Typografie, Inhaltsverzeichnis),
   rechte Karten (Aktive Szene, Kampfszenen 5 × 5 mit Anzahl), Bottom-Bar (Musik links, Szenen mittig, aktive Kachel
   mit Outline).
2. Kachel anklicken: Dialog neben `admin-dialog.png` legen (Bild 16:9, Label, Name, Beschreibung, Decline/Confirm
   rechts). Decline schließt den Dialog. Confirm wechselt die Szene.
3. Theme umschalten (Zahnrad): Schritte 1–2 im Tavern-Theme wiederholen. Aktive Elemente in `#C05E5E` mit Text
   `onPrimary`.
4. Funktion: Musik Play/Pause, Titel aktualisiert sich beim Szenenwechsel. Atmo-Sounds spielen. Alle fünf
   Notizen-Tabs laden. „Nach oben“ erscheint beim Scrollen und funktioniert.
5. Kontrolllauf Wall (`/wall`) und Ground (`/ground`) in eigenen Fenstern: Szenenwechsel und Theme-Wechsel im Admin
   kommen dort an. Die Wall zeigt Kacheln mit `radius.sm` und der Outline am aktiven Kampfszenen-Kachel, sonst
   unverändert (Padding wie heute). Der Ground ist unverändert.
6. Kontrolllauf Player (`/`): keine Layoutänderung außer der Tavern-Akzentfarbe.

## Offene Fragen
- keine

## Review
