# DND-7: Restyle Player Screen

**Typ:** style
**Status:** Fertig

## Kontext & Ziel

Der Player Screen läuft auf den Smartphones der Spieler und ist der letzte Screen im alten Stil. Er hat feste Farben
in `ResourceBarPlayer`, freie `z-index`-Werte, drei Breakpoints ohne Token, einen eigenen System-Font-Stack und leere
Plätze, die man auf der dunklen Fläche kaum sieht (1,0–1,2:1). Dieser Task stellt ihn auf den Style Guide um: Im
Querformat am Smartphone sieht er aus wie die Mockups v2 und nutzt nur Tokens und Farbrollen aus
`frontend/DESIGN.md`. Feste Werte gibt es nur als benannte Layout-Konstanten. Danach gilt der Style Guide für alle
vier Screens auch im Code.

**Verbindliche Grundlage.** Die Entscheidungen darin werden hier nicht neu diskutiert:
- [frontend/DESIGN.md](../../frontend/DESIGN.md): Tokens (inkl. `size.control.lg`), Regeln „Fließend statt
  Breakpoints“ und „Touch-Ziele“, Baustein „Ressourcen-Button“, Rollen `resource.*`, Kontrast 2.6, Entscheidungen P1–P7
- [frontend/design/player-mapping.md](../../frontend/design/player-mapping.md): Soll-Werte je Styled Component,
  Entscheidungen P1–P7
- Mockups: [player.png](../../frontend/design/mockups/v2/player.png) (844 × 390),
  [player-667.png](../../frontend/design/mockups/v2/player-667.png) (667 × 375),
  [player-portrait.png](../../frontend/design/mockups/v2/player-portrait.png) (390 × 844), jeweils auch `-tavern`
  (Quelle: `build.py`)
- Entscheidungen aus [DND-4](DND-4-admin-restyle.md), [DND-5](DND-5-wall-restyle.md) und
  [DND-6](DND-6-ground-restyle.md) gelten weiter, u. a. `GlobalStyle` je Screen, `textStyle`, `Label`,
  Übergangsdauern als Werte (DND-5 E2).

Wiederverwendet, nicht neu gebaut: `tokens.ts` (inkl. `textStyle`), `styled.d.ts`, `GlobalStyle.ts`, Themes,
`Label.tsx`, `layer.*` (wird hier nicht gebraucht, P6).

**Abweichungen vom Auftragstext, die aus dem Mapping folgen:** Breakpoints werden nicht zu Tokens, sondern entfallen
(P1). Die einzige Bedingung ist `PORTRAIT_QUERY` = `(orientation: portrait)`. Das Overlay erscheint also im
Hochformat, nicht mehr unterhalb von 650px Breite. Die `z-index`-Werte 9 und 1 entfallen ersatzlos, statt auf
`layer.*` umgestellt zu werden (P6).

## Invarianten

- Bedienung unverändert: Aktion und Bonusaktion schalten 1 ↔ 0. Zauberplätze I–IV und Spezial zählen pro Tippen um
  1 herunter und springen bei 0 aufs Maximum. Bewegung zeigt fest `9.5` und reagiert nicht.
- Werte und Logik unverändert: `SpellMax`, `spellData` (inkl. der bekannten Abweichung bei Stufe II), `specialMax`,
  Startwerte. Zustand nur lokal, kein Speichern.
- Overlay „Handy drehen“ deckt im Hochformat alles ab (P1: Bedingung ist das Format, nicht mehr 650px).
- Eigener Theme-Button im Player schaltet das Theme weiter um, nur auf dem jeweiligen Gerät. Keine Synchronisation.
- Routen, API und Backend unverändert. Admin, Wall und Ground sehen unverändert aus (auch nach `size.control.lg` in
  `tokens.ts` und `viewport-fit=cover` in `index.html`).
- UI-Texte deutsch (P7).

## Scope / Non-Goals

**Im Scope**
- `<GlobalStyle />` in `PlayerScreen`, als eigener Schritt (P3)
- Rollen `resource.<art>.strong` / `.muted` und `resource.empty` in `darkTheme` und `tavernTheme`, `ResourceBarPlayer`
  ohne feste Farben (P4, P7)
- Zusammenlegen von `SpellResource` in `Resource` und von `Slot`/`SpecialSlot` als `refactor`-Schritt (E2)
- Alle Styled Components aus player-mapping.md: `Background`, `Overlay`, `ThemeToggleButton` in `PlayerScreen` und
  alle in `ResourceBarPlayer`
- Ressourcen als `<button>` (E3)
- Token `size.control.lg` in `tokens.ts`, Layout-Konstanten `RESOURCE_HEIGHT`, `SLOT_WIDTH`, `SLOT_HEIGHT`,
  `ROTATE_ICON_SIZE`, `PORTRAIT_QUERY`
- `viewport-fit=cover` im Viewport-Meta von `frontend/index.html` (E4)
- Doku: DESIGN.md, player-mapping.md, `docs/screens.md` (Ist), `frontend/CLAUDE.md`, `docs/known-issues.md`

**Nicht im Scope**
- Werte und Logik der Ressourcen (Maxima, Startwerte, Bewegung 9.5, Abweichung `spellData[].max` / `SpellMax`)
- Speichern des Zustands, Anbindung an Backend oder Admin
- Geparkter Spells-Screen (`feature/spells-screen`)
- Admin, Wall, Ground, Backend
- `phone.svg` (feste schwarze Kontur `stroke="#000000"` bleibt, E4)
- Tokens `breakpoint.*` und neue `layer.*` (P1, P6)

## Entscheidungen

### E1: Typ und Commits
- **Entscheidung:** Plan-Typ `style`. Der Strukturschritt ohne sichtbare Änderung (Schritt 3) wird als
  `refactor(DND-7): …` committet, die Doku als `docs(DND-7): …`, alles andere als `style(DND-7): …`.
- **Begründung:** wie DND-4 bis DND-6 (User-Entscheidung).

### E2: Komponenten zusammenlegen
- **Entscheidung:** `SpellResource` geht in `Resource` auf (`$variant` um `'spell'` erweitert). `Slot` und
  `SpecialSlot` werden ein `Slot` mit `$variant: 'spell' | 'special'`. Eigener `refactor`-Schritt vor dem Layout,
  ohne sichtbare Änderung: berechnete Styles vorher und nachher gleich.
- **Verworfene Alternativen:** getrennt lassen und einzeln umstellen.
- **Begründung:** player-mapping.md „optional“, User-Entscheidung. Weniger doppelte Regeln für die folgenden Schritte.

### E3: Ressourcen als `<button>`
- **Entscheidung:** Die antippbaren Ressourcen (Aktion, Bonusaktion, Zauberplätze I–IV, Spezial) werden `<button>`
  mit `type="button"`. Button-Reset: `padding` (außer dem Mapping-Innenabstand der Zauberplätze), `font: inherit`,
  `color: text.color`. Bewegung ist nicht antippbar und bleibt ein `<div>` (`as="div"` am selben Styled Component,
  `cursor: default`). Klick-Handler unverändert. Neu ist nur, dass die Buttons per Tastatur erreichbar und auslösbar
  sind.
- **Verworfene Alternativen:** `<div onClick>` behalten (Mapping-Hinweis „optional“).
- **Begründung:** User-Entscheidung. Erfüllt die Regel „Buttons werden explizit gestylt“ (DESIGN.md 1.1).

### E4: Dateien außerhalb der beiden Komponenten
- **Entscheidung:** `viewport-fit=cover` wird im Viewport-Meta von `frontend/index.html` ergänzt, damit der
  Safe-Area-Abstand aus dem Mapping wirkt. `phone.svg` bleibt unverändert.
- **Begründung:** player-mapping.md (`Background`, `padding`), User-Entscheidung. Am Desktop hat `viewport-fit`
  keine Wirkung, Admin, Wall und Ground bleiben gleich.

## Subtasks

Nach jedem Schritt: `npm run lint`, `npm run test:unit`, `npm run build` in `frontend/`.

### Schritt 1: GlobalStyle im Player (`style(DND-7): …`)

#### Frontend
- [x] `PlayerScreen`: `<GlobalStyle />` rendern (wie `AdminScreen`, `WallScreen`, `GroundScreen`)
- [x] `Background`: System-Stack (`font-family`) entfernen, Schrift kommt aus dem `GlobalStyle`

### Schritt 2: Farbrollen `resource.*` (`style(DND-7): …`)

#### Frontend
- [x] `darkTheme.ts` und `tavernTheme.ts`: `resource: { action: { strong, muted }, bonus: …, movement: …, spell: …,
      special: …, empty }` mit den Werten aus DESIGN.md 2.3, in beiden Themes gleich
- [x] `ResourceBarPlayer`: alle festen Farben durch Rollen ersetzen. Rahmen `resource.<art>.strong`, Fläche
      `resource.<art>.muted`, verfügbare Icons und Plätze `strong`, verbrauchte `resource.empty`, Zahl `text.color`
      (statt `#9e998a`)
- [x] Prüfen: keine `#…`-Werte mehr in `ResourceBarPlayer`

### Schritt 3: Komponenten zusammenlegen (`refactor(DND-7): …`)

#### Frontend
- [x] `Resource` um `$variant: 'spell'` erweitern, `SpellResource` entfernen und im JSX ersetzen. Die bisherigen
      Abweichungen (Margin, Schriftgröße der Ziffer, Breakpoint-Werte) wandern in die Variante.
- [x] `Slot` mit `$variant: 'spell' | 'special'`, `SpecialSlot` entfernen
- [x] Nachweis: berechnete Styles (Größe, Farben, Schrift) aller Ressourcen und Plätze vor und nach dem Umbau gleich,
      bei 844 × 390 und bei 600px Breite (z. B. per `getComputedStyle` / `getBoundingClientRect`)

### Schritt 4: Layout der Leiste (`style(DND-7): …`)

#### Frontend
- [x] `Background`: `inset: 0`, `flex-direction: column`, `align-items` entfällt, `gap` `space.4`,
      `padding` `space.4 max(space.5, env(safe-area-inset-left), env(safe-area-inset-right))`; Einrückung angleichen
- [x] `frontend/index.html`: `viewport-fit=cover` im Viewport-Meta (E4)
- [x] `ResourceBar` → Karte: `flex`, `column`, `gap` `space.4`, `padding` `space.5`, `radius.lg`, Rahmen oben/unten
      und Media Query entfallen
- [x] `FlexRow` → `ResourceRow`: Grid `repeat(4, minmax(0, 1fr))`, `gap` `space.3`
- [x] `ResourceBarSection` → Zelle: `align-items` entfällt, `gap` `space.3`, `min-width: 0`
- [x] `Text` durch `Label` aus `src/components/Label.tsx` ersetzen; Größe, Zentrierung, Margin und Media Queries
      entfallen
- [x] JSX: Zeile 1 Aktion · Bonusaktion · Bewegung · Spezial; Zeile 2 Label „Zauberplätze“ (`grid-column: 1 / -1`)
      und I–IV
- [x] `Resource`: feste Breite und `margin` (Zauber) entfallen, füllt die Spalte; alle Media Queries in
      `ResourceBarPlayer` entfallen (P1)

### Schritt 5: Ressourcen-Elemente (`style(DND-7): …`)

#### Frontend
- [x] Konstanten `RESOURCE_HEIGHT = '64px'`, `SLOT_WIDTH = '8px'`, `SLOT_HEIGHT = '24px'` in `ResourceBarPlayer`
- [x] `Resource` als `<button type="button">` nach E3 (Bewegung `as="div"`, `cursor: default`): Höhe
      `RESOURCE_HEIGHT`, `radius.md`, `justify-content: center`, `gap` `space.3`, `textStyle('xl')`, `semibold`,
      `tabular-nums`, `borderWidth.thick`, `z-index` und `text-align` entfallen. Variante `spell`:
      `space-between`, `padding` `0 space.4`, Ziffer als `Numeral` mit `textStyle('lg')`, `semibold`
- [x] Zahl und Ziffer ohne Browser-Margin (kommt aus dem `GlobalStyle`; `<p>` darf bleiben oder zu `<span>` werden)
- [x] `IconSection`: `size.icon`, `flex`, `center`, `gap` `space.1`, `flex: none`, Media Query entfällt
- [x] `ActionIcon`: `<svg viewBox="0 0 20 20">` mit `<circle>`, `fill` `resource.action.strong` bzw.
      `resource.empty`
- [x] `BonusIcon`: `<svg viewBox="0 0 20 20">` mit `<polygon>`, `fill` `resource.bonus.strong` bzw.
      `resource.empty`; CSS-Dreieck und `-webkit-transform` entfallen
- [x] `MovementIcon`: Punkt `space.2` × `space.2`, `radius.pill`, `margin-left` entfällt
- [x] `Slot`: `SLOT_WIDTH` × `SLOT_HEIGHT`, `radius.sm`, Media Queries entfallen; neue `SlotGroup` mit `flex`,
      `gap` `space.1`
- [x] Prüfen: In `ResourceBarPlayer` keine festen Farben, keine freien px außer den drei Konstanten, kein `z-index`,
      keine Media Query

### Schritt 6: Overlay und Theme-Button (`style(DND-7): …`)

#### Frontend
- [x] `tokens.ts`: `size.control.lg = '48px'`
- [x] Konstanten `ROTATE_ICON_SIZE = '96px'`, `PORTRAIT_QUERY = '(orientation: portrait)'` in `PlayerScreen`
- [x] `Overlay`: als letztes Kind von `Background` rendern; `inset: 0`, `display: none`,
      `@media ${PORTRAIT_QUERY}` → `grid`, `place-content: center`, `justify-items: center`, `gap` `space.4`,
      `padding` `space.5`, `text-align: center`; `z-index` entfällt; `svg` `ROTATE_ICON_SIZE`, `color` ohne
      `!important`; Animation unverändert
- [x] Overlay-Text „Bitte das Handy quer halten“ (`textStyle('md')` aus dem GlobalStyle, `fontWeight.medium`)
- [x] `ThemeToggleButton`: im Fluss (kein `fixed`, `left`, `top`), `align-self: flex-start`, `size.control.lg`,
      `padding: 0`, `grid` + `place-items: center`, `radius.md`; `ReactSVG`-Wrapper `grid` ohne `!important` und
      ohne Größe; `svg` `size.icon`, `color` ohne `!important`
- [x] Prüfen: In `PlayerScreen` keine freien px außer `ROTATE_ICON_SIZE`, keine Breakpoints außer
      `PORTRAIT_QUERY`, kein `z-index`

### Schritt 7: Doku (`docs(DND-7): …`)
- [x] `frontend/DESIGN.md`: Kopf (Stand, „Umgesetzt“ um DND-7 ergänzen), Geltung („Umbau steht noch aus“ entfernen),
      Architektur (`GlobalStyle` auch in `PlayerScreen`), 1.2 Ebenen (Player-Werte entfallen, nicht mehr „mit dem
      Umbau“), 2.3 Hinweis „noch nicht im Code“ entfernen, 2.5 Zeile `ResourceBarPlayer` als erledigt, 2.6 Anmerkung
      zu den Ressourcen-Zeilen anpassen, 4 „Offen“: Player-Umsetzung erledigt; Baustein „Ressourcen-Button“ um
      `<button>` ergänzen (E3)
- [x] `frontend/design/player-mapping.md`: Stand „umgesetzt in DND-7“, Abweichungen vermerken (u. a. E2, E3)
- [x] `docs/screens.md`: Ist-Stand Player (Karte mit zwei Zeilen, Overlay im Hochformat statt unter 650px,
      Hinweistext, Ressourcen als Buttons)
- [x] `frontend/CLAUDE.md`: `GlobalStyle` jetzt in allen vier Screens
- [x] `docs/known-issues.md`: prüfen, ob ein behobener Punkt geführt ist

## Akzeptanzkriterien

- [ ] AK1: Bei 844 × 390 und 667 × 375 sieht der Player aus wie `player.png` bzw. `player-667.png`, in beiden
      Themes (`-tavern`): Theme-Button 48px oben links bündig mit der Karte, Karte mit zwei Zeilen à vier
      Ressourcen-Buttons (64px hoch), Labels in Großbuchstaben, Icons 20px, Plätze 8 × 24px.
- [ ] AK2: Im Hochformat (390 × 844) deckt das Overlay alles ab und sieht aus wie `player-portrait.png` bzw.
      `-tavern`: Icon 96px mit Dreh-Animation, darunter „Bitte das Handy quer halten“. Im Querformat ist es
      unsichtbar.
- [ ] AK3: In `ResourceBarPlayer` und `PlayerScreen` nur Tokens und Farbrollen. Keine festen Farben, kein `z-index`,
      keine Breakpoints außer `PORTRAIT_QUERY`; feste Werte nur als `RESOURCE_HEIGHT`, `SLOT_WIDTH`, `SLOT_HEIGHT`,
      `ROTATE_ICON_SIZE` und die Animationsdauer `6s`.
- [ ] AK4: `resource.*` in beiden Themes mit den Werten aus DESIGN.md 2.3. Die Kontrastwerte aus DESIGN.md 2.6
      (Zahl, `strong` auf `muted`, `strong` auf `secondary`, `empty` auf `muted`) sind nachgerechnet und erreichen
      das Ziel.
- [ ] AK5: Bedienung wie in den Invarianten. Zusätzlich sind die antippbaren Ressourcen per Tab erreichbar und per
      Enter/Leertaste auslösbar (E3). Bewegung ist kein Button und reagiert nicht.
- [ ] AK6: Schritt 3 ohne sichtbare Änderung (Nachweis berechneter Styles).
- [ ] AK7: Admin, Wall und Ground sehen unverändert aus. Alle Invarianten eingehalten.
- [ ] AK8: Lint, Unit-Tests und Build sind so grün wie vorher (bekannte Altfehler ausgenommen). Bestehende Tests
      inhaltlich unverändert.
- [ ] AK9: Doku nach Schritt 7 nachgezogen.

## Teststrategie / Verifikation

**Automatisch**
- Frontend: `npm run lint`, `npm run test:unit`, `npm run build` (inkl. `tsc -b`) nach jedem Schritt. `tsc` prüft,
  dass beide Themes die Rollen `resource.*` haben.
- Es gibt keine Unit- oder BDD-Tests für den Player. Neue Tests sind nicht Teil des Tasks.

**Manuell** (Frontend per `npm run dev` oder `docker compose up --build`; der Player braucht kein Backend)
1. `/` im Browser mit Mobile-Emulation 844 × 390, Dark: Screenshot neben `player.png`. Prüfen: Rand seitlich 24px,
   Theme-Button 48px, Karte `radius.lg` mit 24px Innenabstand, 16px zwischen den Zeilen, 12px zwischen Label und
   Button und zwischen den Spalten, Zahl 24/32 semibold, Ziffer 20/28.
2. Dasselbe bei 667 × 375 neben `player-667.png`.
3. Theme-Button antippen → Tavern; Schritte 1–2 neben den `-tavern`-Mockups. Erneut antippen → Dark. Ein zweites
   Fenster mit `/admin` wechselt nicht mit (nicht synchronisiert).
4. Hochformat 390 × 844 in beiden Themes neben `player-portrait*.png`: Overlay deckt alles ab, Icon dreht sich.
5. Bedienung durchtippen: Aktion 1 → 0 → 1 (Kreis farbig → grau → farbig), Bonusaktion ebenso (Dreieck); jede
   Zauberstufe bis 0 und zurück aufs Maximum (I: 4, II: 3, III: 3, IV: 2), Spezial 1 → 0 → 3; Bewegung reagiert
   nicht. Danach per Tastatur (Tab, Enter, Leertaste) dasselbe für eine Ressource.
6. Kontrast: die Paare aus DESIGN.md 2.6 mit den Werten aus den Themes nachrechnen (Skript oder Kontrast-Tool) und
   das Ergebnis im Review-Bericht nennen.
7. Kontrolllauf `/admin`, `/wall`, `/ground` bei 1920 × 1080: unverändert (Screenshot oder Vergleich der berechneten
   Styles des Icon-Buttons im Admin).

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-10-08
**Empfehlung:** Nacharbeiten

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Headless Chrome mit Mobile-Emulation, 844 × 390 und 667 × 375, verglichen mit `player.png` und `player-tavern-667.png`. Bei 844 × 390: Theme-Button 48 × 48 bei x 24, Karte bei x 24 mit `padding` 24, `radius` 12 und `gap` 16. 7 Buttons und 1 div, je 64px hoch, Spaltenabstand 12. Labels 12px, uppercase, 600. Icons 20 × 20, Plätze 8 × 24. Zahl 24/32 semibold, Ziffer 20/28. Bei 667 × 375: Spalten 133,8px, Karte 619 × 248. |
| AK2 | nicht erfüllt (knapp) | Hochformat 390 × 844: Overlay `display: grid`, im Querformat `display: none`, SVG 96 × 96, `6s ease-in-out infinite`, Text 16/24 mit Gewicht 500. Abweichung: Die `ReactSVG`-Hülle ist 102px hoch statt 96px. Dadurch beträgt der Abstand Icon → Text 22px statt 16px, und der Text sitzt bei y 469 statt 466. |
| AK3 | erfüllt | `grep` in beiden Dateien: Feste Werte gibt es nur in `RESOURCE_HEIGHT`, `SLOT_WIDTH` und `SLOT_HEIGHT` (`ResourceBarPlayer.tsx:34-36`), in `ROTATE_ICON_SIZE` (`PlayerScreen.tsx:12`) und in `@media ${PORTRAIT_QUERY}` (`PlayerScreen.tsx:52`), dazu die Dauer `6s`. Kein `#hex`, kein `z-index`, kein `!important`. |
| AK4 | erfüllt | `resource.*` ist in Dark und Tavern identisch und deckt sich mit DESIGN.md 2.3. Kontrast nach WCAG: Zahl/muted 14,20–17,63 (Dark) bzw. 7,22–8,96 (Tavern), empty/muted 3,12–3,88, strong/muted 3,77–11,65, strong/secondary 3,98–13,03 (Dark) bzw. 3,21–10,52 (Tavern). |
| AK5 | erfüllt | Mit Selenium durchgeklickt. Aktion und Bonus 1→0→1, die Farbe wechselt zwischen Füllung und `#707070`. Spezial 1→0→3→2→1. Stufe I 4→…→0→4, II und III 3→…→0→3, IV 2→1→0→2. Bewegung ist ein `div` ohne Wirkung. Tab-Reihenfolge: Theme, Aktion, Bonus, Spezial, I–IV. Enter und Leertaste lösen aus. Handler sind unverändert. |
| AK6 | erfüllt | 2959a9a gegen 40e016b verglichen, `getComputedStyle` und `getBoundingClientRect` für 61 Elemente bei 844 und 600px Breite. Einzige Abweichung ist das Overlay-SVG bei 600px, weil die Animation zu einem anderen Zeitpunkt gemessen wurde. |
| AK7 | erfüllt | Außerhalb des Players ändern sich nur `size.control.lg` in `tokens.ts`, `viewport-fit=cover` in `index.html` und ein Kommentar in `GlobalStyle.ts`. Routen und Backend sind nicht betroffen. Der Implementer hat die Styles von `/admin`, `/wall` und `/ground` gegen 04f3335 verglichen: 0 Abweichungen. |
| AK8 | erfüllt | Lint 0 Fehler und 3 vorbestehende Warnungen, Unit-Tests 10/10, Build grün. Keine Testdateien geändert. |
| AK9 | erfüllt | Nachgezogen sind DESIGN.md (Kopf, Geltung, Architektur, 1.2, 2.3, 2.5, 2.6, 4 und Baustein „Ressourcen-Button“), `player-mapping.md`, `docs/screens.md` und `frontend/CLAUDE.md`. `known-issues.md` betrifft der Task nicht. |

**Blockierende Befunde**
- [x] AK2: Die `ReactSVG`-Hülle des Overlay-Icons ist 102px statt 96px hoch, weil das SVG inline im Block-`div` sitzt und darunter Platz für die Unterlänge bleibt. Folge: Der Abstand Icon → Text ist 22px statt `space.4`, und der Text sitzt 3px tiefer als in `player-portrait.png`. Fundstelle: `PlayerScreen.tsx`, `Overlay`. Behebbar mit `display: block` am `svg` oder `display: grid` an der Hülle, wie beim `ThemeToggleButton`.

**Hinweise**
- `player-mapping.md`: Vor „Grundlage: …“ fehlt eine Leerzeile, deshalb hängt der Satz im Rendering am letzten Listenpunkt. In Zeile 27 steht noch die Zukunftsform „Sie werden mit dem Umbau …“.
- Im Hochformat erreicht man die Ressourcen-Buttons unter dem Overlay weiter per Tab. Am Smartphone spielt das praktisch keine Rolle.
- `ThemeToggleButton` hat kein `type="button"`. Ohne `<form>` hat das keine Wirkung.
- `ResourceIcon` hat zusätzlich `display: block`. Das steht nicht im Plan, ist aber sinnvoll.

**Checks:** Lint 0 Fehler und 3 vorbestehende Warnungen, Unit-Tests 10/10, Build grün. Dazu die manuellen Prüfungen per Selenium (headless Chrome).

### Runde 2 – 2026-10-08
**Empfehlung:** Abnahme

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | 75a4e5b ändert nur die `svg`-Regel in `Overlay` (`PlayerScreen.tsx:47`). Das Overlay ist im Querformat `display: none`. Kontrolle bei 844 × 390 und 667 × 375: Das Layout ist unverändert, der Theme-Button ist 48 × 48 bei x 24. |
| AK2 | erfüllt | Hochformat 390 × 844, Dark und Tavern: Das Overlay (`display: grid`, 0/0/390/844) deckt alles ab. Die `ReactSVG`-Hülle ist 96 × 96 bei y 354, das `svg` hat `display: block` und die Animation `6s infinite ease-in-out`. Der Text sitzt bei y 466 mit 16/24 und Gewicht 500. Der Abstand Icon → Text beträgt 16px (`space.4`), wie in `player-portrait.png`. Im Querformat bleibt das Overlay `display: none`. |
| AK3 | erfüllt | Feste Werte gibt es weiterhin nur in `ROTATE_ICON_SIZE`, `RESOURCE_HEIGHT`, `SLOT_WIDTH` und `SLOT_HEIGHT`. Kein `#hex`, kein `z-index`, kein `!important`. |
| AK4 | erfüllt | Die Themes sind seit Runde 1 unverändert. |
| AK5 | erfüllt | Logik und JSX sind seit Runde 1 unverändert. |
| AK6 | erfüllt | 40e016b ist unverändert. |
| AK7 | erfüllt | Seit Runde 1 haben sich nur `PlayerScreen.tsx` (+1 Zeile), `player-mapping.md` und der Plan geändert. |
| AK8 | erfüllt | Lint 0 Fehler und 3 vorbestehende Warnungen, Unit-Tests 10/10, Build grün. Keine Testdateien geändert. |
| AK9 | erfüllt | 245358f behebt beide Doku-Hinweise aus Runde 1 in `player-mapping.md`. |

**Blockierende Befunde**
- keine

**Hinweise**
- 75a4e5b (`style`) enthält nebenbei die Status-Änderung in Plan und README. Sauberer wäre ein eigener `docs`-Commit, wie in 764a0db.
- Aus Runde 1 gilt weiter: Im Hochformat erreicht man die Buttons per Tab, und `ThemeToggleButton` hat kein `type="button"`.

**Checks:** Lint 0 Fehler und 3 vorbestehende Warnungen, Unit-Tests 10/10, Build grün. Dazu manuelle Prüfung per Selenium bei 390 × 844 (Dark und Tavern), 844 × 390 und 667 × 375.
