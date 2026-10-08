# DND-7: Restyle Player Screen

**Typ:** style
**Status:** Entwurf

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
- [ ] `PlayerScreen`: `<GlobalStyle />` rendern (wie `AdminScreen`, `WallScreen`, `GroundScreen`)
- [ ] `Background`: System-Stack (`font-family`) entfernen, Schrift kommt aus dem `GlobalStyle`

### Schritt 2: Farbrollen `resource.*` (`style(DND-7): …`)

#### Frontend
- [ ] `darkTheme.ts` und `tavernTheme.ts`: `resource: { action: { strong, muted }, bonus: …, movement: …, spell: …,
      special: …, empty }` mit den Werten aus DESIGN.md 2.3, in beiden Themes gleich
- [ ] `ResourceBarPlayer`: alle festen Farben durch Rollen ersetzen. Rahmen `resource.<art>.strong`, Fläche
      `resource.<art>.muted`, verfügbare Icons und Plätze `strong`, verbrauchte `resource.empty`, Zahl `text.color`
      (statt `#9e998a`)
- [ ] Prüfen: keine `#…`-Werte mehr in `ResourceBarPlayer`

### Schritt 3: Komponenten zusammenlegen (`refactor(DND-7): …`)

#### Frontend
- [ ] `Resource` um `$variant: 'spell'` erweitern, `SpellResource` entfernen und im JSX ersetzen. Die bisherigen
      Abweichungen (Margin, Schriftgröße der Ziffer, Breakpoint-Werte) wandern in die Variante.
- [ ] `Slot` mit `$variant: 'spell' | 'special'`, `SpecialSlot` entfernen
- [ ] Nachweis: berechnete Styles (Größe, Farben, Schrift) aller Ressourcen und Plätze vor und nach dem Umbau gleich,
      bei 844 × 390 und bei 600px Breite (z. B. per `getComputedStyle` / `getBoundingClientRect`)

### Schritt 4: Layout der Leiste (`style(DND-7): …`)

#### Frontend
- [ ] `Background`: `inset: 0`, `flex-direction: column`, `align-items` entfällt, `gap` `space.4`,
      `padding` `space.4 max(space.5, env(safe-area-inset-left), env(safe-area-inset-right))`; Einrückung angleichen
- [ ] `frontend/index.html`: `viewport-fit=cover` im Viewport-Meta (E4)
- [ ] `ResourceBar` → Karte: `flex`, `column`, `gap` `space.4`, `padding` `space.5`, `radius.lg`, Rahmen oben/unten
      und Media Query entfallen
- [ ] `FlexRow` → `ResourceRow`: Grid `repeat(4, minmax(0, 1fr))`, `gap` `space.3`
- [ ] `ResourceBarSection` → Zelle: `align-items` entfällt, `gap` `space.3`, `min-width: 0`
- [ ] `Text` durch `Label` aus `src/components/Label.tsx` ersetzen; Größe, Zentrierung, Margin und Media Queries
      entfallen
- [ ] JSX: Zeile 1 Aktion · Bonusaktion · Bewegung · Spezial; Zeile 2 Label „Zauberplätze“ (`grid-column: 1 / -1`)
      und I–IV
- [ ] `Resource`: feste Breite und `margin` (Zauber) entfallen, füllt die Spalte; alle Media Queries in
      `ResourceBarPlayer` entfallen (P1)

### Schritt 5: Ressourcen-Elemente (`style(DND-7): …`)

#### Frontend
- [ ] Konstanten `RESOURCE_HEIGHT = '64px'`, `SLOT_WIDTH = '8px'`, `SLOT_HEIGHT = '24px'` in `ResourceBarPlayer`
- [ ] `Resource` als `<button type="button">` nach E3 (Bewegung `as="div"`, `cursor: default`): Höhe
      `RESOURCE_HEIGHT`, `radius.md`, `justify-content: center`, `gap` `space.3`, `textStyle('xl')`, `semibold`,
      `tabular-nums`, `borderWidth.thick`, `z-index` und `text-align` entfallen. Variante `spell`:
      `space-between`, `padding` `0 space.4`, Ziffer als `Numeral` mit `textStyle('lg')`, `semibold`
- [ ] Zahl und Ziffer ohne Browser-Margin (kommt aus dem `GlobalStyle`; `<p>` darf bleiben oder zu `<span>` werden)
- [ ] `IconSection`: `size.icon`, `flex`, `center`, `gap` `space.1`, `flex: none`, Media Query entfällt
- [ ] `ActionIcon`: `<svg viewBox="0 0 20 20">` mit `<circle>`, `fill` `resource.action.strong` bzw.
      `resource.empty`
- [ ] `BonusIcon`: `<svg viewBox="0 0 20 20">` mit `<polygon>`, `fill` `resource.bonus.strong` bzw.
      `resource.empty`; CSS-Dreieck und `-webkit-transform` entfallen
- [ ] `MovementIcon`: Punkt `space.2` × `space.2`, `radius.pill`, `margin-left` entfällt
- [ ] `Slot`: `SLOT_WIDTH` × `SLOT_HEIGHT`, `radius.sm`, Media Queries entfallen; neue `SlotGroup` mit `flex`,
      `gap` `space.1`
- [ ] Prüfen: In `ResourceBarPlayer` keine festen Farben, keine freien px außer den drei Konstanten, kein `z-index`,
      keine Media Query

### Schritt 6: Overlay und Theme-Button (`style(DND-7): …`)

#### Frontend
- [ ] `tokens.ts`: `size.control.lg = '48px'`
- [ ] Konstanten `ROTATE_ICON_SIZE = '96px'`, `PORTRAIT_QUERY = '(orientation: portrait)'` in `PlayerScreen`
- [ ] `Overlay`: als letztes Kind von `Background` rendern; `inset: 0`, `display: none`,
      `@media ${PORTRAIT_QUERY}` → `grid`, `place-content: center`, `justify-items: center`, `gap` `space.4`,
      `padding` `space.5`, `text-align: center`; `z-index` entfällt; `svg` `ROTATE_ICON_SIZE`, `color` ohne
      `!important`; Animation unverändert
- [ ] Overlay-Text „Bitte das Handy quer halten“ (`textStyle('md')` aus dem GlobalStyle, `fontWeight.medium`)
- [ ] `ThemeToggleButton`: im Fluss (kein `fixed`, `left`, `top`), `align-self: flex-start`, `size.control.lg`,
      `padding: 0`, `grid` + `place-items: center`, `radius.md`; `ReactSVG`-Wrapper `grid` ohne `!important` und
      ohne Größe; `svg` `size.icon`, `color` ohne `!important`
- [ ] Prüfen: In `PlayerScreen` keine freien px außer `ROTATE_ICON_SIZE`, keine Breakpoints außer
      `PORTRAIT_QUERY`, kein `z-index`

### Schritt 7: Doku (`docs(DND-7): …`)
- [ ] `frontend/DESIGN.md`: Kopf (Stand, „Umgesetzt“ um DND-7 ergänzen), Geltung („Umbau steht noch aus“ entfernen),
      Architektur (`GlobalStyle` auch in `PlayerScreen`), 1.2 Ebenen (Player-Werte entfallen, nicht mehr „mit dem
      Umbau“), 2.3 Hinweis „noch nicht im Code“ entfernen, 2.5 Zeile `ResourceBarPlayer` als erledigt, 2.6 Anmerkung
      zu den Ressourcen-Zeilen anpassen, 4 „Offen“: Player-Umsetzung erledigt; Baustein „Ressourcen-Button“ um
      `<button>` ergänzen (E3)
- [ ] `frontend/design/player-mapping.md`: Stand „umgesetzt in DND-7“, Abweichungen vermerken (u. a. E2, E3)
- [ ] `docs/screens.md`: Ist-Stand Player (Karte mit zwei Zeilen, Overlay im Hochformat statt unter 650px,
      Hinweistext, Ressourcen als Buttons)
- [ ] `frontend/CLAUDE.md`: `GlobalStyle` jetzt in allen vier Screens
- [ ] `docs/known-issues.md`: prüfen, ob ein behobener Punkt geführt ist

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
