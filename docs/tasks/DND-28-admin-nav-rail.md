# DND-28: Navigationsleiste im Admin Screen mit Menüpunkt „Notizen“

**Typ:** feat
**Status:** Freigegeben

## Kontext & Ziel

Der Admin Screen bekommt links eine schmale Navigationsleiste (Icon-Buttons), die bestimmt, was das Panel rechts
daneben zeigt. Heute steht dort fest die Notizen-Navigation (`SideBarLeftElement` in `DocumentReader`). Dieser Task
legt das Gerüst an und füllt es mit dem ersten Menüpunkt „Notizen“; Folgetasks ergänzen „Szenen“ (Szenenliste, mit
Umbau des Datenmodells ohne Kampf-/Nicht-Kampfszene) und „Kampf“ (Kampf starten). Nutzer ist der Spielleiter; am
Spieltisch merkt er es daran, dass er die Notizen-Navigation per Klick ein- und ausklappen kann und die Notizen dann
mehr Breite bekommen.

## Scope / Non-Goals

**Im Scope**
- Navigationsleiste links im Hauptbereich mit genau einem Menüpunkt „Notizen“ (Icon-Button).
- Panel rechts neben der Leiste, das den Inhalt des aktiven Menüpunkts zeigt; für „Notizen“ die bisherige
  Notizen-Navigation (Label „Notizen“, Einträge Main, Fight, Side, Leveling, Mechaniken).
- Einklappen/Ausklappen des Panels per Klick auf den aktiven Menüpunkt.
- Aufteilung von `DocumentReader` in Navigation (Panel) und Ansicht (Mitte), Auswahl im `AdminScreen`.
- Neues Icon für „Notizen“, Style Guide und Doku.

**Nicht im Scope**
- Menüpunkte „Szenen“ und „Kampf“, auch nicht als deaktivierte Platzhalter (eigene Tasks).
- Umbau des Szenen-Datenmodells (`main`/`side`).
- „Detail“-Button und rechter Bereich des Mockups (Spieler, Screens, „Aktuelle Map“); die rechte Spalte bleibt wie sie ist.
- Button „S“ unten in der Leiste des Mockups; Theme-Umschalter bleibt in der Top-Bar.
- Inhalt der Notizen, leerer Tab „Side“ (bekannt, bleibt).
- Merken von Menüpunkt bzw. Einklapp-Zustand über einen Reload hinaus (weder Server noch `localStorage`).

## Entscheidungen

### E1: Menüpunkte als Icon-Buttons
- **Entscheidung:** Jeder Menüpunkt ist ein [Icon-Button](../../frontend/docs/design/components.md#icon-button)
  (`size.control.md`, `radius.md`, Icon `size.icon`). Der Name steht als `aria-label` und `title` (Tooltip) am Button.
  Aktiv: Fläche `primary`, Icon `onPrimary`; inaktiv: Fläche `secondary`, Icon `text.color`.
- **Verworfene Alternativen:** runde Buttons mit Anfangsbuchstaben wie im Mockup (neue Bausteinvariante, Buchstaben
  wenig sprechend); Icon mit Text darunter (breitere Leiste).
- **Begründung:** Nutzt einen vorhandenen Baustein und die Zustandsfarben des Style Guides.

### E2: Leiste und Panel bündig mit eigener Fläche
- **Entscheidung:** Leiste und Panel liegen randlos zwischen Top-Bar und Bottom-Bar (keine Karten, kein äußerer
  Innenabstand von `Main`), beide mit Fläche `dark`; zwischen Leiste und Panel eine senkrechte Linie
  `borderWidth.thin` in `border`. Notizen-Ansicht und rechte Spalte behalten ihren Innenabstand `space.5` und ihr
  heutiges Aussehen. Die Bottom-Bar bleibt über die volle Breite.
- **Verworfene Alternativen:** Leiste und Panel innerhalb des bisherigen Innenabstands von `Main`; Fläche
  `secondary` wie im Mockup.
- **Begründung:** Entspricht dem Mockup. `dark` statt `secondary`, weil inaktive Einträge und Buttons `secondary`
  sind und auf einer `secondary`-Fläche nicht zu sehen wären; `dark` ist zugleich die Fläche der Bottom-Bar.

### E3: Klick auf den aktiven Menüpunkt klappt das Panel ein
- **Entscheidung:** Klick auf den aktiven Menüpunkt blendet das Panel aus; die Notizen-Ansicht wird entsprechend
  breiter, die Leiste bleibt. Im eingeklappten Zustand ist kein Menüpunkt aktiv hervorgehoben. Klick auf einen
  Menüpunkt im eingeklappten Zustand blendet das Panel mit dessen Inhalt ein. Startzustand: „Notizen“ ausgeklappt.
- **Verworfene Alternativen:** Panel immer sichtbar.
- **Begründung:** Mehr Platz für die Notizen am Spieltisch, wenn die Navigation nicht gebraucht wird.

### E4: Nur „Notizen“, Leiste offen für weitere Punkte
- **Entscheidung:** Die Leiste enthält nur „Notizen“. Menüpunkte sind als Liste (id, Name, Icon, Panel-Inhalt)
  definiert, sodass „Szenen“ und „Kampf“ später je einen Eintrag ergänzen. Für unten angeordnete Buttons (Mockup „S“)
  wird nichts vorgebaut.
- **Verworfene Alternativen:** deaktivierte Platzhalter für Szenen und Kampf.
- **Begründung:** Keine toten Bedienelemente; die Folgetasks erweitern nur die Liste.

### E5: Mitte zeigt weiter das Dokument, unabhängig vom Menüpunkt
- **Entscheidung:** Die Mitte zeigt immer die Notizen des gewählten Eintrags; das Panel wechselt nur die Liste.
  Dafür wird `DocumentReader` geteilt: die Einträge (Label „Notizen“ + `SideBarLeftElement`s) kommen in eine eigene
  Komponente fürs Panel, `DocumentReader` zeigt nur noch die Notizen. Der gewählte Eintrag (`selectedStoryIndex`)
  liegt im `AdminScreen`. Ein- und Ausklappen ändert weder Auswahl noch Scrollposition der Notizen.
- **Verworfene Alternativen:** Jeder Menüpunkt bestimmt auch die Mitte.
- **Begründung:** Wunsch des Spielleiters; die Notizen bleiben beim Wechsel zu Szenen/Kampf sichtbar.

### E6: Name „Notizen“
- **Entscheidung:** Menüpunkt (`aria-label`/`title`) und Panel-Überschrift heißen „Notizen“; Code-Bezeichner englisch
  (z. B. Menüpunkt-ID `docs`).
- **Verworfene Alternativen:** „Docs“ wie im Mockup.
- **Begründung:** Einheitlich mit der bestehenden Überschrift.

### E7: Neues Icon
- **Entscheidung:** Neues SVG `public/assets/icons/notes.svg` (Dokument/Buch), `fill="currentColor"`, frei
  lizenziert (z. B. SVG Repo, wie `phone.svg`), eingefärbt wie die übrigen Icons über `ReactSVG` aus dem Theme.
- **Begründung:** Keines der vorhandenen Icons steht für Notizen.

## Subtasks

### Frontend
- [ ] `DocumentReader` teilen: Navigation (Label „Notizen“ + Einträge) als eigene Komponente (z. B.
      `DocumentNavigation`), `DocumentReader` erhält `selectedStoryIndex` als Prop und zeigt nur die Notizen.
      Laden, Fehlertext „Notizen konnten nicht geladen werden“ und Nach-oben-Button unverändert.
- [ ] Komponente Navigationsleiste (z. B. `NavRail`): Icon-Buttons aus einer Liste von Menüpunkten, `<button>` mit
      `aria-label`, `title`, `aria-pressed` (aktiv) und `aria-controls` aufs Panel; Fokus sichtbar wie bei den
      übrigen Icon-Buttons.
- [ ] Logik „welches Panel ist offen“ als reine Funktion (z. B. `nextOpenPanel(open, clicked)` → `clicked` oder
      `null`) in `src/utils/`, damit sie per vitest testbar ist.
- [ ] `AdminScreen`: State für offenes Panel (Start `docs`) und `selectedStoryIndex`; Layout des Hauptbereichs
      umbauen: Leiste | Panel (nur wenn offen) | Notizen | rechte Spalte, nach E2. Panel-Breite bleibt
      `LEFT_COLUMN_WIDTH` (200px); Breite der Leiste als benannte Layout-Konstante (z. B. `NAV_RAIL_WIDTH`, aus
      `size.control.md` plus Innenabstand abgeleitet bzw. als px-Konstante).
- [ ] Icon `public/assets/icons/notes.svg` ergänzen (E7).
- [ ] Unit-Test für die Panel-Logik.
- [ ] E2E: neues Feature `__tests__/bdd/features/adminNavigation.feature` mit Steps für AK1–AK3 (Hilfen aus
      `__tests__/bdd/support/helpers.ts`, stabile `data-test-id`s an Leiste, Menüpunkt und Panel).

### Doku
- [ ] `docs/screens.md` (Admin, Ist): Layout um Navigationsleiste und Panel ergänzen, Punkt „Notizen“ anpassen
      (Einträge im Panel, Ein-/Ausklappen).
- [ ] `frontend/docs/design/screen-layouts.md`: Admin-Layout (Spalten, bündige Flächen) und neue Layout-Konstante;
      `LEFT_COLUMN_WIDTH` als Panel-Breite beschreiben.
- [ ] `frontend/docs/design/components.md`: Baustein „Navigationsleiste“ (Fläche `dark`, Trennlinie, Abstände,
      Icon-Buttons, Zustände aktiv/inaktiv/eingeklappt).
- [ ] `frontend/DESIGN.md`: Baustein in 1.5 verlinken, ggf. Abstands-/Zustandstabellen ergänzen.
- [ ] `frontend/CLAUDE.md`: neue Komponenten in „Struktur & Datenfluss“ (`src/components/`) nennen.
- [ ] `docs/vision.md`/`docs/screens.md` (Soll Admin) um die Navigation mit den geplanten Punkten Szenen und Kampf
      ergänzen.

## Akzeptanzkriterien

### AK1: Navigationsleiste mit Menüpunkt „Notizen“
- **Given** der Admin Screen ist geöffnet
- **When** er geladen ist
- **Then** steht ganz links zwischen Top-Bar und Bottom-Bar eine Leiste mit genau einem Icon-Button „Notizen“
  (Tooltip „Notizen“), der aktiv hervorgehoben ist
- **And** rechts daneben zeigt das Panel „Notizen“ die Einträge Main, Fight, Side, Leveling, Mechaniken, „Main“ ist
  gewählt, und in der Mitte stehen die Main-Notizen

### AK2: Notizen wählen wie bisher
- **Given** das Panel „Notizen“ ist offen
- **When** der Spielleiter im Panel auf „Leveling“ klickt
- **Then** ist „Leveling“ hervorgehoben und die Mitte zeigt die Leveling-Notizen

### AK3: Panel ein- und ausklappen
- **Given** das Panel „Notizen“ ist offen und „Leveling“ gewählt
- **When** der Spielleiter auf den aktiven Menüpunkt „Notizen“ klickt
- **Then** verschwindet das Panel, die Notizen in der Mitte werden breiter, der Menüpunkt ist nicht mehr hervorgehoben
- **When** er erneut auf „Notizen“ klickt
- **Then** ist das Panel wieder da, der Menüpunkt hervorgehoben, „Leveling“ weiterhin gewählt und die Mitte zeigt
  unverändert die Leveling-Notizen (gleiche Scrollposition)

### AK4: Bedienung per Tastatur
- **Given** der Admin Screen ist geöffnet
- **When** der Spielleiter per Tab auf den Menüpunkt „Notizen“ geht und Enter oder Leertaste drückt
- **Then** klappt das Panel wie per Klick ein bzw. aus; der Fokus ist sichtbar, der Button meldet seinen Zustand
  (`aria-pressed`)

### AK5: Rest des Admin Screens unverändert
- **Given** der Admin Screen ist geöffnet, Panel offen oder eingeklappt
- **When** der Spielleiter Szenen wählt, Musik bedient, Sounds abspielt, das Theme oder das Abenteuer wechselt
- **Then** verhält sich alles wie vor dem Task; rechte Spalte („Aktive Szene“, „Kampfszenen“), Top-Bar, Bottom-Bar
  und Hinweisleisten sehen aus wie bisher

### AK6: Beide Themes
- **Given** Theme „Dunkel“ bzw. „Taverne“
- **When** der Admin Screen angezeigt wird
- **Then** sind Leiste, Trennlinie, Icon (aktiv und inaktiv) und Panel-Einträge klar erkennbar (Kontrast nach
  `frontend/docs/design/contrast.md`)

## Teststrategie / Verifikation

**Automatisch**
- Frontend Unit: Panel-Logik (offen + Klick auf denselben → `null`; geschlossen + Klick → Menüpunkt; offen + Klick
  auf anderen → anderer).
- Frontend BDD: `adminNavigation.feature` für AK1–AK3 (braucht laufendes Backend, wie die übrigen E2E-Tests).
- Lint, Typecheck, Unit-Tests, Build grün; bestehende E2E-Features `selectMainScene` und `selectSideScene` weiter grün.

**Manuell**
1. Admin öffnen: Leiste mit „Notizen“-Icon, Panel mit den Einträgen, Main-Notizen in der Mitte (AK1).
2. Einträge wechseln (AK2); in den Notizen nach unten scrollen, Panel ein- und ausklappen, Auswahl und
   Scrollposition prüfen (AK3).
3. Per Tab auf den Menüpunkt, Enter/Leertaste (AK4).
4. Szene wechseln, Musik, Sound, Abenteuer, Theme – mit offenem und eingeklapptem Panel (AK5).
5. Beide Themes ansehen, auch mit Hinweisleiste (Backend stoppen) (AK6).

## Offene Fragen
- keine

## Review
