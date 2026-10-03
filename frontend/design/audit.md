# Style-Audit: hart kodierte Werte

Stand: 2026-10-03 (Branch `development`). Reine Bestandsaufnahme als Grundlage für die Standardisierung des
Style-Systems – noch keine Änderungen am Code.

## Umfang und Zählweise

- **Styled Components:** alle 16 Dateien im Frontend, die `styled-components` importieren:
  `app/App.tsx`, `screens/{Admin,Ground,Player,Wall}Screen.tsx`, `components/{DetailsSideBar,Dialogue,DocumentReader,
  GridOverlay,MapElement,MapOverview,ResourceBarPlayer,ScreenControlBar,SideBarLeftElement,SideMaps,TopBar}.tsx`.
- **CSS-Dateien:** `frontend/src/index.css` und `frontend/src/app/App.css` (eigener Abschnitt unten).
- Gezählt wird jedes Vorkommen in Zeilen außer Importen, also auch Werte in `${…}`-Ausdrücken (z. B. `'#232321'`).
- Mitgezählt sind auch: auskommentierte Werte in `TopBar.tsx` (1px, 3px, 5px, 22px, je 1×) und Prozentwerte aus
  Keyframes in `PlayerScreen.tsx` (0%, 25%, 75%, 100%).
- Die Werte `black`/`white`/`transparent` in `GroundScreen.tsx` sind ein JavaScript-Objekt für die Gitterfarbe, kein CSS.

## 1. Farben (Styled Components)

Werte in RGB oder HSL kommen nicht vor.

| Anzahl | Wert | Vorkommen in |
|---|---|---|
| 5 | `transparent` | ResourceBarPlayer.tsx (3), GroundScreen.tsx (2) |
| 4 | `#232321` | ResourceBarPlayer.tsx (4) – Grau für „leer/inaktiv“ |
| 3 | `white` | SideBarLeftElement.tsx, MapElement.tsx, GroundScreen.tsx |
| 2 | `#9e998a` | ResourceBarPlayer.tsx |
| 2 | `#2487ff` | ResourceBarPlayer.tsx (Blau) |
| 2 | `#077600` | ResourceBarPlayer.tsx (Grün, Aktion) |
| 2 | `#b23700` | ResourceBarPlayer.tsx (Orange, Bonusaktion) |
| 2 | `#fae100` | ResourceBarPlayer.tsx (Gelb) |
| 2 | `#ff2424` | ResourceBarPlayer.tsx (Rot) |
| 1 | `black` | GroundScreen.tsx |
| 1 | `#001229` | ResourceBarPlayer.tsx (dunkles Blau, Hintergrund) |
| 1 | `#072900` | ResourceBarPlayer.tsx (dunkles Grün) |
| 1 | `#290e00` | ResourceBarPlayer.tsx (dunkles Orange) |
| 1 | `#292500` | ResourceBarPlayer.tsx (dunkles Gelb) |
| 1 | `#290000` | ResourceBarPlayer.tsx (dunkles Rot) |
| 1 | `#5a5a5a` | MapElement.tsx |

Beobachtung: Fast alle festen Farben liegen in `ResourceBarPlayer.tsx`. Dort gehören jeweils eine kräftige
Rahmenfarbe und eine sehr dunkle Hintergrundfarbe zusammen (Blau, Grün, Orange, Gelb, Rot).

## 2. Werte ohne Farbe (Styled Components)

| Anzahl | Wert | Verwendet für | Dateien |
|---|---|---|---|
| 62 | `100%` | width (35), height (27) | 14 |
| 20 | `5px` | border-radius (7), height, width, padding, margin | 9 |
| 20 | `10px` | margin (9), width, height, padding, gap, gap-Prop, radius, font-size, box-shadow | 9 |
| 12 | `20px` | padding, margin, height, left/right, font-size | 7 |
| 12 | `2px` | border (ResourceBarPlayer ×10), gap | 2 |
| 10 | `40px` | height (6), width | 4 |
| 10 | `100px` | border-radius (8, Pillenform), margin, padding | 5 |
| 10 | `50px` | height (5), top/bottom, margin | 5 |
| 10 | `30px` | width, padding, height, font-size | 6 |
| 9 | `15px` | font-size (3), width, height, padding | 3 |
| 8 | `649px` | `@media (max-width)` | 1 |
| 6 | `25px` | height, font-size (2), padding | 2 |
| 6 | `1px` | border | 4 |
| 5 | `6px` | border-width, border-radius, padding | 3 |
| 5 | `11px` | border-width, height | 1 |
| 5 | `739px` | `@media (max-width)` | 1 |
| 4 | `50%` | border-radius (Kreis), width, height | 4 |
| 4 | `400px` | width, height, padding-right | 3 |
| 4 | `3px` | width, gap | 3 |
| 3 | `200px` | width, height | 2 |
| 3 | `7px` | width, padding | 2 |
| 3 | `0deg` | Keyframe-Transform | 1 |
| 2 | `12px`, `22px`, `23px`, `45px`, `70px`, `80px`, `4px`, `75%`, `1em`, `0.5s`, `-90deg` | verschiedene | – |
| 1 | `0.75rem`, `0.8rem`, `16px`, `17px`, `19px`, `8px`, `9px`, `65px`, `120px`, `130px`, `220px`, `420px`, `600px`, `650px`, `700px`, `1200px`, `40%`, `60%`, `70%`, `56.25%`, `2em`, `0.3em`, `0.3s`, `6s`, `360deg` | verschiedene | – |

### Nach Kategorie

- **Schriftgrößen:** 15px ×3, 25px ×2, je 1× 10px, 16px, 20px, 22px, 30px, 0.75rem, 0.8rem – px und rem gemischt,
  ohne Abstufung.
- **Radien:** 100px ×8, 5px ×7, 6px ×2, je 1× 9px, 10px, 50%.
- **Breakpoints:** 649px ×8 und 739px ×5 (`max-width`, nur ResourceBarPlayer); 650px ×1 (`min-width`, PlayerScreen) –
  abweichender Ansatz.
- **z-index** (ohne Einheit): 99 ×5, 1 ×4, 999 ×3, 99999 ×3, 9 ×1.
- **Zeiten:** 0.5s ×2, 0.3s ×1, 6s ×1.
- **line-height:** 1.5 ×3.
- **Abstände:** frei gewählt (2, 3, 4, 5, 7, 8, 10, 15, 17, 20, 30 px), kein Raster erkennbar.
- **Schriftart:** derselbe System-Font-Stack 4× kopiert (Admin-, Wall-, Ground-, PlayerScreen).

## 3. CSS-Dateien (`index.css`, `App.css`)

**Beide Dateien werden nirgends importiert** (weder in `main.tsx` noch in `index.html` oder sonstwo). Ihre Werte
wirken zur Laufzeit also nicht. Inhaltlich sind es die Standardvorlagen von Vite.

### 3.1 Farben

| Anzahl | Wert | Datei | Verwendet für |
|---|---|---|---|
| 2 | `#646cff` | index.css | `a` color, `button:hover` border-color |
| 1 | `rgba(255, 255, 255, 0.87)` | index.css | `:root` color |
| 1 | `white` | index.css | `:root` background-color |
| 1 | `#ffffff` | index.css | `:root` background-color (Light-Mode) |
| 1 | `#535bf2` | index.css | `a:hover` color |
| 1 | `#747bff` | index.css | `a:hover` color (Light-Mode) |
| 1 | `#1a1a1a` | index.css | `button` background-color |
| 1 | `#f9f9f9` | index.css | `button` background-color (Light-Mode) |
| 1 | `#213547` | index.css | `:root` color (Light-Mode) |
| 1 | `transparent` | index.css | `button` border |

`App.css` enthält keine Farben.

### 3.2 Werte ohne Farbe

| Anzahl | Wert | Datei | Verwendet für |
|---|---|---|---|
| 1 | `1280px` | App.css | `#root` max-width |
| 1 | `2rem` | App.css | `#root` padding |
| 1 | `320px` | index.css | `body` min-width |
| 1 | `100vh` | index.css | `body` min-height |
| 1 | `3.2em` | index.css | `h1` font-size |
| 1 | `1em` | index.css | `button` font-size |
| 1 | `0.6em 1.2em` | index.css | `button` padding |
| 1 | `8px` | index.css | `button` border-radius |
| 1 | `1px` | index.css | `button` border |
| 1 | `4px` | index.css | `button:focus` outline |
| 1 | `0.25s` | index.css | `button` transition |
| 2 | `1.5` / `1.1` | index.css | line-height (`:root` / `h1`) |
| 2 | `500` | index.css | font-weight (`a`, `button`) |
| 1 | `400` | index.css | `:root` font-weight |
| 1 | `0` | index.css | `body` margin |

Schriftart in `index.css`: `Inter, system-ui, Avenir, Helvetica, Arial, sans-serif`, weicht vom Font-Stack der Screens ab.

## 4. Weitere Beobachtungen

- In `frontend/src/style/darkTheme.ts` und `lightTheme.ts` sind Farben bereits als Tokens definiert (primary,
  secondary, dark, border, background, overlay, text.color). `border` wird in DetailsSideBar, DocumentReader, MapElement und
  ResourceBarPlayer verwendet, `overlay` in Dialogue. Für Abstände, Schriftgrößen, Radien, Breakpoints oder z-index gibt es keine Tokens.
- Feste Werte außerhalb von CSS: `gap='3px'` als Prop in AdminScreen, `style={{ gap }}` in MapOverview.
- Theme-Farben werden zusätzlich per `svg.setAttribute('style', \`fill: …\`)` in AdminScreen, PlayerScreen und
  TopBar gesetzt.
