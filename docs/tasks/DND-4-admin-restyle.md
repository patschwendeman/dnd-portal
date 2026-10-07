# DND-4: Restyle Admin Screen (Schritt 1 von 3: Admin, danach Wall, danach Ground)

**Typ:** style
**Status:** Fertig

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
- [x] `src/style/tokens.ts`: alle statischen Tokens aus DESIGN.md 1.2 (`space`, `text` nach E4, `fontWeight`,
      `letterSpacing`, `font`, `radius`, `borderWidth`, `size` mit `size.bar.md`/`.lg` nach E2, `layer`) und der
      `css`-Helper für `text.*`
- [x] `src/style/lightTheme.ts` → `src/style/tavernTheme.ts`, Export `tavernTheme`, Import in `App.tsx` angepasst.
      Farbwerte bleiben in diesem Schritt unverändert.
- [x] `src/style/styled.d.ts`: `DefaultTheme` = Typ von `tokens` + `colors` (aus `darkTheme` abgeleitet)
- [x] `App.tsx`: `<ThemeProvider theme={{ ...tokens, colors: (isDarkTheme ? darkTheme : tavernTheme).colors }}>`
- [x] Nachweis: `tsc -b` prüft jetzt Theme-Zugriffe. Admin, Wall, Ground und Player sehen unverändert aus.

### Schritt 2: Farben, Schrift, GlobalStyle

#### Frontend
- [x] Rolle `onPrimary` in beiden Themes (Dark `#0e1117`, Tavern `#140701`). Tavern-`primary` → `#C05E5E`.
- [x] `@fontsource/inter` als Abhängigkeit (400, 500, 600, 700), Import in `main.tsx`
- [x] `src/style/GlobalStyle.ts` (`createGlobalStyle`): `*, *::before, *::after { box-sizing: border-box;
      margin: 0 }`, Body mit `font.family.base` und `text.md`. Eingebunden nur in `AdminScreen` (E3).
- [x] `Screen` in `AdminScreen`: System-Stack entfernen, Schrift kommt aus dem GlobalStyle
- [x] Hinweis: Nach diesem Schritt kann das alte Admin-Layout durch `border-box`/`margin: 0` verrutschen. Das ist
      zulässig, solange alles bedienbar bleibt. Schritt 3 stellt das Layout um.

### Schritt 3: Layout-Gerüst (Grid)

#### Frontend
- [x] `AdminScreen` → `Screen`: `display: grid`, Zeilen `size.bar.md 1fr size.bar.lg`
- [x] Neuer Wrapper `Main`: Spalten `200px 1fr 400px` (benannte Layout-Konstanten), `gap`/`padding` `space.5`,
      `min-height: 0`. `DocumentReader` (Spalte 1 + 2) und `SidebarRight` (Spalte 3) liegen darin.
- [x] `SidebarRight`, `BottomBar`, `TopBar`/`Bar`: `position: fixed` und Ausgleichsmaße entfernen, in die
      Grid-Zeilen/-Spalten einordnen (Werte laut Mapping)
- [x] `DocumentReader`: `SidebarLeft` (Breite, Margin, Padding, wirkungslose Regeln), `StoryReaderContainer`
      (`padding-right` weg, `position: relative`, `min-height: 0`), `Background` (Margins/Paddings weg,
      `gap: space.5`) laut Mapping
- [x] `z-index`-Werte entfernen, die das Grid überflüssig macht (`AudioControlButton`, `AtmoButton`,
      `ThemeToggleButton`, DESIGN.md 1.2 „Entfallen ersatzlos“)

### Schritt 4: Top-Bar und Bottom-Bar

#### Frontend
- [x] `TopBar`: Grid `240px 1fr 240px` (Layout-Konstante), `padding 0 space.5`, `border-bottom` `borderWidth.thin`,
      Titel „DnD Portal“, Sound-Container (`gap space.4`) mit Gruppen-Wrappern (`gap space.1`),
      `Seperator` → `Separator` als senkrechte Linie in `colors.border` (Entscheidung 5), `AtmoButton` und
      `ThemeToggleButton` laut Mapping (40px, `radius.md`, Icons `size.icon`, Button-Reset)
- [x] `BottomBar`: Grid `1fr auto 1fr`, `padding 0 space.5`. Wrapper `Music` mit `AudioControlButton` (40 × 40,
      `radius.md`, Icon `size.icon`, beim Abspielen Icon in `onPrimary`), Label „Musik“ und Titel nach E6
- [x] `utils.ts`: Funktion für den Musiktitel (E6) plus Unit-Test in `__tests__/unit/`
- [x] `SideMaps`: Container laut Mapping (`gap space.2`, `align-items: center`, Höhe/Breite `auto`), Label „Szenen“,
      Kachelbreite 96px (Layout-Konstante, per Wrapper oder Prop)
- [x] `MapElement` (geteilt): 16:9 für beide Kachelarten (`aspect-ratio` oder `56.25%`), `radius.sm`, `border`
      `borderWidth.thin`, aktiv per `outline` `borderWidth.thick` `primary` mit `outline-offset: borderWidth.thick`,
      kein `box-shadow`. `MapOverlay`/`NumberIcon` bleiben unverändert (inkl. `z-index`, gehört zum Wall-Task).

### Schritt 5: Sidebar links und Notizen

#### Frontend
- [x] `SidebarLeft`: Label „Notizen“, `gap space.1`, `align-items: stretch`
- [x] `SideBarLeftElement` → `NavigationElement`: `size.control.md`, `padding 0 space.3`, `radius.md`, `text.sm`,
      `fontWeight.medium`, linksbündig, doppeltes `white` entfernen, aktiv mit Text in `onPrimary`
- [x] `DocumentReader` → `Page`: `max-width` 880px, `padding space.7 space.8`, `radius.lg`, Typografie für h1, h2,
      p, ol, ul, li, a laut Mapping (`text.2xl`/`xl`/`reading`/`md`, `p max-width` 68ch, Links ohne Unterstreichung)
- [x] `TopLink`: `display: grid` statt `'flex'`, 40 × 40, `radius.md`, `bottom`/`right` `space.4` relativ zum
      `StoryReaderContainer`, Button-Reset, Icon `size.icon`

### Schritt 6: Sidebar rechts

#### Frontend
- [x] `DetailsSideBar`: Karte „Aktive Szene“ laut Mapping (`Details` mit gültigem `display: flex`,
      `padding space.5`, `radius.lg`). Header mit Label, Name (`text.lg`, 600) und Beschreibung (`text.sm`). Zeilen
      `DetailContent` als Grid `96px 1fr` (Layout-Konstante), Labels „Enemies“/„Loot“ mit Wert `–` (E7).
      `DetailsContainer` darf entfallen.
- [x] `SidebarMapContainer`: Karte „Kampfszenen“ (`colors.secondary`, `padding space.5`, `radius.lg`). Überschrift
      mit Anzahl `mainmaps.length`, `margin-bottom space.3`.
- [x] `MapOverview` (geteilt): neue Prop `padding`. Admin übergibt `0`, Wall übergibt `'30px 10px'`. Das wirkungslose
      CSS-`gap` entfernen, Admin übergibt `gap` = `space.2`. Die Wall-Werte (`gap='10px'`, Padding) bleiben
      optisch gleich.

### Schritt 7: Dialog

#### Frontend
- [x] `Dialogue` laut Mapping und [admin-dialog.png](../../frontend/design/mockups/v2/admin-dialog.png):
      `DialogueContainer` (`radius.lg`, `overflow: hidden`, `gap space.4`, `padding-bottom space.5`,
      `align-items: stretch`). Textblock mit Label „Szene wechseln“, Name (`text.lg`, 600) und Beschreibung
      (`sceneOption.description`, `text.sm`). `DialogueImage` 16:9 `cover`.
- [x] `ButtonContainer`: rechtsbündig, `gap space.3`, Reihenfolge Decline → Confirm. `z-index` entfernen.
- [x] `ConfirmButton`/`DeclineButton` nach K2 (40px hoch, `min-width` `size.button.minWidth`,
      `padding 0 space.4`, `radius.md`, `text.sm`, `fontWeight.semibold`, ohne Laufweite). Confirm-Text in
      `onPrimary`. Button-Reset.
- [x] `LayoutContainer`: `z-index` → `layer.dialog`

### Schritt 8: Doku

#### Doku
- [x] `frontend/DESIGN.md`: `size.bar` → `size.bar.md` (E2), Geltung des GlobalStyle (E3), Hinweis „Noch nicht im
      Code umgesetzt“ für Grundlagen und Admin aktualisieren
- [x] `frontend/design/admin-mapping.md`: `size.bar` → `size.bar.md`, Stand-Vermerk „umgesetzt in DND-4“
- [x] `docs/screens.md`: Ist-Stand des Admin Screens (Layout, neue Labels, Musiktitel)
- [x] `frontend/CLAUDE.md`: `src/style/` (tokens, tavernTheme, GlobalStyle, styled.d.ts), Inter-Abhängigkeit
- [x] `docs/known-issues.md`: behobene Punkte aus „Fehler im Bestand“ (admin-mapping.md) streichen, falls dort geführt

### Schritt 9: Nacharbeit nach Abgleich DESIGN.md ↔ Code (vom User freigegeben 2026-10-06)
Befund-Kürzel (A/C/D/E) aus dem Abgleich nach Review Runde 2.

#### Admin-Code (`style(DND-4)`)
- [x] C4: `AdminScreen.tsx:30-36`, `Dialogue.tsx:21-27` – `position: fixed` mit `inset: 0` statt `width/height 100%`
      + `top/left/right/bottom` (Regel 1.1)
- [x] C5: `TopBar.tsx` `ThemeToggleButton` – Hintergrund `transparent` statt `colors.background` (1.5 Icon-Button, Mockup)
- [x] C6: `DocumentReader.tsx` – h3–h6 explizit stylen (z. B. h3/h4 = `text.md` + `fontWeight.semibold`; betrifft
      `#### Dialog` in `tavern.md`/`shop.md`); Regel in DESIGN.md 1.4 Schrift-Hierarchie ergänzen
- [x] `DocumentReader.tsx` – Prop `isVisible` → transient `$isVisible` (keine DOM-Warnung)
- [x] A2: `tavernTheme.ts` `dark: 'black'` → `'#000000'` (gleicher Wert)

#### DESIGN.md (`docs(DND-4)`)
- [x] A1/A3: 2.3 Dark-`dark` = `#020409` (Code ist maßgeblich); Kontrast 2.6 `text.color` auf `dark` (Dark) = 18,8
- [x] C7: 1.4 – Listen in Notizen laufen mit `text.md` (16/24), nicht `text.reading` (wie Mapping/Mockup)
- [x] C8: 1.4/1.5 Label-Abstände so beschreiben wie Mapping/Mockup (Notizen-Navigation 12px, „Kampfszenen“ `space.3`,
      „Musik“ → Titel 0)
- [x] C9: 2.4 „Linie immer `border`“ – Ausnahme Top-Bar-Linie `secondary` (2.2) aufnehmen
- [x] C10: 1.5 Karte – Titel optional; C11: 2.2 `border` – Scrollbar-Thumb ergänzen
- [x] C1: 1.4/1.5 – `padding-top: 56.25%` als zulässige Alternative zu `aspect-ratio` nennen (Kachel mit Rahmen 64 × 38)
- [x] D1: Stand-Datum (DESIGN.md, admin-mapping.md); D2/D3: Tabelle 2.5 (`SideBarLeftElement` raus, Grid-Farben in
      `GroundScreen.tsx`); D4: Kontrasttabelle „heute/neu“ → „vor DND-4 / aktuell“; D5: Theme-Wechsel auch im Player
- [x] D6: Abschnitt 4 „Offen“ – Wall/Ground-Lücken (siehe unten) eintragen

#### admin-mapping.md (`docs(DND-4)`)
- [x] E1 `size.control.sm` entfernen; E2 „kein Token“ für `font-weight` → `fontWeight.*`; E3 `size.thumb`-Alternative
      streichen; E4 GlobalStyle je Screen statt `App.tsx`; E5 `fontSize`/`lightTheme.ts` → `text.*`/`tokens.ts`;
      E6 Token-Tabelle vervollständigen (`size.badge`, `size.button.minWidth`, `size.scrollbar`, `fontWeight`,
      `letterSpacing`, `layer`); E9 veraltete Abschnitte (`DetailsContainer`, `Seperator`) als entfallen markieren

#### Wall/Ground-Lücken dokumentieren (nur Doku in `wall-mapping.md`, `ground-mapping.md`, DESIGN.md 4 – kein Code)
- [x] z-index 99999/99/1 → `layer.*` (Mappings sagen fälschlich „unverändert“)
- [x] `onPrimary` am aktiven Button `ScreenControlBar.tsx` (Kontrast AA verfehlt)
- [x] Badge-Farben `#5a5a5a`/`white` (`MapElement.tsx`) → Rollen `badge.*` in beiden Themes
- [x] `<GlobalStyle />` in Wall und Ground als expliziter Schritt; `GridOverlay` mit `inset`
- [x] Gemeinsamen Text-Button (heute lokal in `Dialogue.tsx`) und `Label.tsx` wiederverwenden; `ScreenControlBar`-Button
      als `<button>`
- [x] Veraltete Verweise (`size.control.sm`, „kein Token“ für 600/700/32px) in beiden Mappings korrigieren
- [x] Übergangsdauern (0.5s) ohne Token – als offenen Punkt führen

Nicht im Scope: Player Screen, Umsetzung der Wall/Ground-Punkte, Markdown des Inhaltsverzeichnisses.

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

### Runde 1 – 2026-10-04
**Empfehlung:** Nacharbeiten (AK1 und AK2 knapp verfehlt; ob die Abweichungen akzeptabel sind, entscheidet der User)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | nicht erfüllt (knapp) | Screenshots 1920 × 1080 (Chrome headless, Vite :5199, Backend :8000), beide Themes. Top-Bar, linke Spalte, Notizseite, Bottom-Bar, Kachelraster (5 × 64 × 38 + 4 × 8 = 352px) und Dialog (600 × 506, Buttons 112 × 40) stimmen mit `admin.png`/`admin-dialog.png` überein; Tavern-Farben folgen den Rollen. Abweichung 1: Inhaltsverzeichnis-Einträge 42–50px statt 32px auseinander, erste Notizseite ~85px höher (lockere Liste in `1_tableOfContent.md` → `p` in `li` mit `margin-bottom space.4`, `DocumentReader.tsx:104-109`; Unterebene „2.1.“ als Text). Abweichung 2: Karte „Aktive Szene“ 4–6px versetzt (Label 16px-Flex-Item mit `gap space.1` statt inline in 24px-Zeile, `DetailsSideBar.tsx` `DetailHeader`). |
| AK2 | nicht erfüllt (knapp) | px nur noch als benannte Konstanten (200/400, 240, 880/68ch, 96, 600), Farben nur aus `theme.colors`, `z-index` nur `layer.dialog` (`Dialogue.tsx:31`). Übrig: `DocumentReader.tsx:40` `::-webkit-scrollbar { width: 4px; }` – nicht in der AK2-Ausnahmeliste, admin-mapping.md führt ihn aber als „unverändert“. Ausgenommen: `MapElement.tsx:44-63`, `WallScreen.tsx:110`. |
| AK3 | erfüllt | `tokens.ts` (Werte = DESIGN.md 1.2, `textStyle`), `styled.d.ts`, `GlobalStyle.ts`, `App.tsx:66`. `lightTheme.ts` → `tavernTheme.ts`, kein `lightTheme`-Verweis mehr. `onPrimary` in beiden Themes, Tavern-`primary` `#C05E5E`. Inter 400/500/600/700 lokal gebündelt (woff2 in `dist/assets`), keine externe Font-URL; `document.fonts.check('16px Inter')` true. |
| AK4 | erfüllt | Alle Tabs laden, „Nach oben“ blendet beim Scrollen ein (1416/920), Play → `primary`/`onPrimary`, Szenenwechsel setzt `activeSceneId`/`activeMapId`, Musiktitel aktualisiert. Atmo-`onClick`, `toggleTheme`, `isDarkTheme` unverändert; alle `data-test-id` vorhanden. Pixelvergleich `eb9c9bd` ↔ HEAD: Ground 1px, Player 0px, Wall nur im Kachel-Panel (Outline statt Leuchten, gem. E5). Backend/Routen/API unberührt. |
| AK5 | erfüllt | Lint 0 Fehler / 3 vorbestehende Warnungen; Unit 10/10; `tsc -b` und `vite build` grün. |
| AK6 | erfüllt | Neu nur `__tests__/unit/musicTitle.spec.ts` (5 Fälle); bestehende Tests und BDD unverändert. |
| AK7 | erfüllt | `80cc93e refactor(DND-4)` enthält nur `tokens.ts`, `styled.d.ts`, Umbenennung (Farbwerte gleich) und `App.tsx`; keine Komponente liest dort Tokens → keine sichtbare Änderung. |

**Blockierende Befunde**
- [x] AK1, Inhaltsverzeichnis: Eintragsabstände 42–50px statt 32px, erste Notizseite ~85px höher (`DocumentReader.tsx:104-130`). Ansatz: Regel für `li > p` (Margin 0, Zeilenhöhe `text.md`) – oder User nimmt die Abweichung hin.
- [x] AK1, Karte „Aktive Szene“: 4–6px Versatz zum Mockup. Nacharbeiten oder als Mockup-Artefakt abnehmen (User-Entscheidung).
- [x] AK2: `DocumentReader.tsx:40` `width: 4px` außerhalb der Ausnahmeliste. Token/benannte Konstante verwenden oder AK2 und Mapping per User-Entscheidung abgleichen.

**Hinweise**
- Doku-Schritt als `docs(DND-4)` statt `style(DND-4)` committet (`55e459b`); Schema eingehalten, weicht nur vom Wortlaut von E1 ab. Keine KI-Signaturen, Branch `development`.
- Neuer Baustein `src/components/Label.tsx` nicht in der Scope-Liste, aber Hilfsbaustein für E7 – keine Scope-Verletzung.
- Kachelrand immer `colors.border`, aktiv nur über Outline (DESIGN.md-konform, wirkt auch auf Wall, gedeckt durch E5).
- `MapElement` nutzt weiter `padding-top: 56.25%` (vom Plan erlaubt).
- `getMusicTitle` (`utils.ts:15`) kürzt jedes Suffix `-` + 8 Zeichen aus `[A-Za-z0-9_-]`; ein Name wie `Into_the-Darkness.mp3` würde gekürzt. Derzeit kein solcher Name in `public/assets/music`.
- Kampfszenen-Kacheln im Admin spaltenweise statt zeilenweise sortiert – laut Plan Wall-Task.
- Implementer-Verdacht „Wall-Tavern weicht ab“ nicht bestätigt (nur Kachel-Panel, gem. E5).
- Nicht geprüft: hörbare Musik/Atmo, Klick auf Theme-Button (Theme per `localStorage` umgeschaltet). E2E nicht ausgeführt: Docker-Container :5173 hat veraltetes `node_modules` ohne `@fontsource/inter` (`docker compose up --build -V`); Suite scheitert laut Implementer schon auf dem Vorstand (3/4, Seed-Pfade).
- Vorbestehend: admin-mapping.md führt noch `size.control.sm`; Dark-`dark`-Farbwerte weichen von DESIGN.md ab; Tab „Side“ leer.

**Checks:** Lint 0 Fehler / 3 Warnungen (vorbestehend) · Unit 10/10 · `tsc -b` grün · `vite build` grün · E2E nicht ausgeführt · Sichtprüfung 1920 × 1080 Dark/Tavern/Dialog

### Runde 2 – 2026-10-06
**Empfehlung:** Abnahme (die drei blockierenden Befunde aus Runde 1 sind behoben, die Nacharbeit verschlechtert nichts)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Chrome headless 1920 × 1080, Mockup `admin.html` gegen `/admin` (Dark und Tavern). Inhaltsverzeichnis: Links bei y = 208/240/272/304/336/368 (32px wie Mockup), Seitenhöhe 359px; Regel `ol > li > p` in `DocumentReader.tsx:120-127`. Karte „Aktive Szene“: Label 110, Name 128, Beschreibung 160, Zeilen 220/265, Kartenhöhe 238 wie Mockup; `DetailHeader` als `display: block` mit `text.md` (`DetailsSideBar.tsx:23-41`). Rest siehe Hinweise. |
| AK2 | erfüllt | `DocumentReader.tsx:40` nutzt `theme.size.scrollbar` (`tokens.ts:59`, `DESIGN.md:128`, `admin-mapping.md:26/320`). px nur noch als benannte Konstanten (96/880/96/600/240/200/400), `z-index` nur `layer.dialog` (`Dialogue.tsx:31`); Ausnahmen `MapElement.tsx:46-63`. |
| AK3 | erfüllt | In Runde 2 unverändert; `document.fonts.check('16px Inter')` true. |
| AK4 | erfüllt | Nacharbeit nur in `DetailsSideBar.tsx`, `DocumentReader.tsx` (nur von `AdminScreen` genutzt) und Token. DOM je Tab: `ol > li > p` nur im Tab Main (6×, Inhaltsverzeichnis); lockere `ul`-Listen (Main 4, Fight 24 `ul > li > p`) unverändert 16/26px mit `margin-bottom` 16px. mdast-Analyse aller Notizen: einzige lockere `ol` ist `main/1_tableOfContent.md`. Wall/Ground/Player, Backend, Routen unberührt. |
| AK5 | erfüllt | Lint 0 Fehler / 3 vorbestehende Warnungen; Unit 10/10; `tsc -b` + `vite build` grün. |
| AK6 | erfüllt | `eb9c9bd..HEAD` ändert unter `__tests__` nur `unit/musicTitle.spec.ts` (neu). |
| AK7 | erfüllt | Unverändert seit Runde 1 (`80cc93e`). |

**Blockierende Befunde**
- keine

**Hinweise**
- Unterpunkte im Inhaltsverzeichnis stehen als Text „2.1.“/„3.1.“ statt verschachtelter `ol`; Zeilen exakt, Links aber bei x = 537,6–542,2 statt 533. Ursache ist der Markdown-Inhalt (nicht im Scope); Angleichung nur über `main/1_tableOfContent.md` – User-Entscheidung.
- Karte „Kampfszenen“ 298 statt 288px hoch (Kacheln mit Rahmen 64 × 38 statt 64 × 36); in Runde 1 abgenommen, keine Verschlechterung.
- Neuer Token `size.scrollbar` erweitert den Style Guide (DESIGN.md 1.2, admin-mapping.md); Doku stimmig nachgezogen – zur Kenntnis für den User.
- Regel `ol > li > p + p` (`margin-top: space.2`) derzeit ohne sichtbare Wirkung, laut `admin-mapping.md:373` gewollt.
- Nacharbeits-Commits nach Schema, ohne KI-Signatur, auf `development`. Implementer hat die Runde-1-Befunde im Plan selbst abgehakt (inhaltlich korrekt).
- Messaufbau: Docker-Daemon nicht erreichbar; gemessen mit eigenem Vite (:5299) und Python-Stub auf :8000 mit `seed_data.json` (gegen `routes/`/`services/` abgeglichen).
- Nicht geprüft: E2E (kein Backend), hörbare Musik/Atmo, Dialog (in Runde 2 unverändert).

**Checks:** Lint 0 Fehler / 3 Warnungen (vorbestehend) · Unit 10/10 · `tsc -b` grün · `vite build` grün · E2E nicht ausgeführt (Docker-Daemon aus) · Sichtprüfung 1920 × 1080 Dark/Tavern gegen `admin.html` (Vite + Seed-Stub) · DOM-Prüfung aller fünf Notizen-Tabs

### Runde 3 – 2026-10-06
**Empfehlung:** Abnahme (Schritt 9 vollständig, AK1–AK7 erfüllt, keine Verschlechterung; ein Doku-Widerspruch in admin-mapping.md zu C4 bleibt, nicht blockierend – User-Entscheidung)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Chrome headless 1920 × 1080, Vite :5398 (`83e8117`, temporärer Worktree) und :5399 (HEAD), Backend :8000 (Docker, nur gelesen). Admin-Start Dark/Tavern: Unterschiede nur in Kachelbildern (treten auch zwischen zwei HEAD-Läufen auf) und 2px Kantenglättung bei x = 221–223. Dialog (600 × 506 ab y = 287): 0px Unterschied. Geändert nur h4 in Notizen: vorher 700, oben 16/unten 0; jetzt 600, oben 24/unten 8 (`DocumentReader.tsx:104-113`). |
| AK2 | erfüllt | px nur als benannte Konstanten (`AdminScreen.tsx:24-25`, `TopBar.tsx:30`, `DocumentReader.tsx:18`, `DetailsSideBar.tsx:8`, `SideMaps.tsx:10`, `Dialogue.tsx:17`); `z-index` nur `layer.dialog` (`Dialogue.tsx:26`); `transparent` gem. DESIGN.md 1.5 Icon-Button; Ausnahmen `MapElement.tsx:46-63`. |
| AK3 | erfüllt | Nur `tavernTheme.ts` `dark: 'black'` → `'#000000'` (gleicher Wert); Inter lokal geladen. |
| AK4 | erfüllt | `83e8117..HEAD` ändert im Code nur `AdminScreen.tsx`, `Dialogue.tsx`, `DocumentReader.tsx`, `TopBar.tsx`, `tavernTheme.ts`; kein Wall/Ground-Code. Pixelvergleich `/wall`, `/ground`, `/`: 0px in beiden Themes. Dialog öffnet/schließt, „Nach oben“ blendet ein. `isVisible`-Warnung in HEAD weg. |
| AK5 | erfüllt | Lint 0 Fehler / 3 vorbestehende Warnungen; Unit 10/10; `tsc -b` + `vite build` grün. |
| AK6 | erfüllt | `83e8117..HEAD` ändert nichts unter `__tests__`. |
| AK7 | erfüllt | Unverändert seit Runde 1 (`80cc93e`). |

**Abgleich Schritt 9:** Code (C4, C5, C6, `$isVisible`, A2), DESIGN.md (A1/A3 – Kontrast 18,84 nachgerechnet, C7, C8 – Werte gegen Code geprüft, C9, C10/C11, C1, D1–D6), admin-mapping.md (E1–E6, E9) und Wall/Ground-Lücken (in beiden Mappings und DESIGN.md 4; `badge.*`-Kontrast 6,9 nachgerechnet) vollständig umgesetzt. Kein Wall/Ground-Code geändert.

**Blockierende Befunde**
- keine

**Hinweise**
1. Widerspruch admin-mapping.md ↔ Code (C4 nicht nachgezogen): `admin-mapping.md:107` (`Screen`) nennt `width`, `height`, `position`, `top/left/right/bottom` „unverändert“, `LayoutContainer` „Keine Werte zu ändern“; Code nutzt seit `660288c` `position: fixed; inset: 0`. Empfehlung: kurzer `docs(DND-4)`-Commit – User-Entscheidung.
2. h3–h6 fehlen in der Tabelle `Page` in admin-mapping.md (Regel steht in DESIGN.md 1.4); `ThemeToggleButton` ohne Zeile für Hintergrund `transparent`. Unvollständig, kein Widerspruch.
3. `ContentContainer` (`admin-mapping.md:292`) nicht als entfallen markiert (nicht Teil von E9).
4. Wall/Ground `Screen` und `ScreenControlBar` `Overlay`/`ControlBar` nutzen `position: fixed` ohne `inset` – nicht in DESIGN.md 4 geführt; beim Wall/Ground-Umbau mitnehmen. „Immer mit `inset`“ (1.1) passt bei schwebenden Elementen nur bedingt.
5. `badge.*` nur als Vorschlag (`#5a5a5a`/`#ffffff`) – ausreichend, da Schritt 9 für Wall/Ground nur Doku verlangt.
6. Amend `8523905` → `3bf8c4b` lokal/ungepusht, nur Zeilenumbruch in `wall-mapping.md`.
7. DESIGN.md 1.4 „Gewichte“: „`medium` für Listen- und Anzeigetext“ missverständlich (Notizlisten sind `regular`); vorbestehend.
8. Kachelraster spaltenweise statt zeilenweise – bekannt, Wall-Task.
9. Alle Commits nach Schema, ohne KI-Signatur, auf `development`.
10. Nicht geprüft: E2E, hörbare Musik/Atmo, Klick auf Theme-Button (Theme per `localStorage`).

**Checks:** Lint 0 Fehler / 3 Warnungen (vorbestehend) · Unit 10/10 · `tsc -b` grün · `vite build` grün · E2E nicht ausgeführt · Pixelvergleich `83e8117` ↔ HEAD 1920 × 1080 Dark/Tavern für `/admin` (Start, h4, Dialog), `/wall`, `/ground`, `/`
