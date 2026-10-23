# DND-28: Navigationsleiste im Admin Screen mit Menüpunkt „Notizen“

**Typ:** feat
**Status:** Im Review

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

### E2: Leiste und Panel bündig, Fläche und Linien wie die Top-Bar
- **Entscheidung:** Leiste und Panel liegen randlos zwischen Top-Bar und Bottom-Bar (keine Karten, kein äußerer
  Innenabstand von `Main`), beide mit Fläche `background` wie die Top-Bar und rechts je einer senkrechten Linie
  `borderWidth.thin` in `secondary` (wie die Linie unter der Top-Bar): die Linie der Leiste trennt sie vom Panel bzw.
  im eingeklappten Zustand von den Notizen, die Linie des Panels trennt es von den Notizen. Notizen-Ansicht und rechte
  Spalte behalten ihren Innenabstand `space.5` und ihr heutiges Aussehen. Die Bottom-Bar bleibt über die volle Breite.
- **Verworfene Alternativen:** Leiste und Panel innerhalb des bisherigen Innenabstands von `Main`; Fläche
  `secondary` wie im Mockup; Fläche `dark` wie die Bottom-Bar mit Linie in `border` (Runde 1 umgesetzt, nach
  Sichtprüfung vom User am 2026-10-23 zugunsten der Top-Bar-Optik geändert).
- **Begründung:** Leiste und Panel wirken mit der Top-Bar als ein zusammenhängender Rahmen um die Notizen. Inaktive
  Einträge und Buttons (`secondary`) bleiben auf `background` sichtbar.

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
- [x] `DocumentReader` teilen: Navigation (Label „Notizen“ + Einträge) als eigene Komponente (z. B.
      `DocumentNavigation`), `DocumentReader` erhält `selectedStoryIndex` als Prop und zeigt nur die Notizen.
      Laden, Fehlertext „Notizen konnten nicht geladen werden“ und Nach-oben-Button unverändert.
- [x] Komponente Navigationsleiste (z. B. `NavRail`): Icon-Buttons aus einer Liste von Menüpunkten, `<button>` mit
      `aria-label`, `title`, `aria-pressed` (aktiv) und `aria-controls` aufs Panel; Fokus sichtbar wie bei den
      übrigen Icon-Buttons.
- [x] Logik „welches Panel ist offen“ als reine Funktion (z. B. `nextOpenPanel(open, clicked)` → `clicked` oder
      `null`) in `src/utils/`, damit sie per vitest testbar ist.
- [x] `AdminScreen`: State für offenes Panel (Start `docs`) und `selectedStoryIndex`; Layout des Hauptbereichs
      umbauen: Leiste | Panel (nur wenn offen) | Notizen | rechte Spalte, nach E2. Panel-Breite bleibt
      `LEFT_COLUMN_WIDTH` (200px); Breite der Leiste als benannte Layout-Konstante (z. B. `NAV_RAIL_WIDTH`, aus
      `size.control.md` plus Innenabstand abgeleitet bzw. als px-Konstante).
- [x] Icon `public/assets/icons/notes.svg` ergänzen (E7).
- [x] Unit-Test für die Panel-Logik.
- [x] E2E: neues Feature `__tests__/bdd/features/adminNavigation.feature` mit Steps für AK1–AK3 (Hilfen aus
      `__tests__/bdd/support/helpers.ts`, stabile `data-test-id`s an Leiste, Menüpunkt und Panel).

- [x] Runde 2 (Änderung E2): `NavRail` und `NavPanel` auf Fläche `background` mit Linie rechts
      `borderWidth.thin` in `secondary` umstellen.

### Doku
- [x] `docs/screens.md` (Admin, Ist): Layout um Navigationsleiste und Panel ergänzen, Punkt „Notizen“ anpassen
      (Einträge im Panel, Ein-/Ausklappen).
- [x] `frontend/docs/design/screen-layouts.md`: Admin-Layout (Spalten, bündige Flächen) und neue Layout-Konstante;
      `LEFT_COLUMN_WIDTH` als Panel-Breite beschreiben.
- [x] `frontend/docs/design/components.md`: Baustein „Navigationsleiste“ (Fläche `dark`, Trennlinie, Abstände,
      Icon-Buttons, Zustände aktiv/inaktiv/eingeklappt).
- [x] `frontend/DESIGN.md`: Baustein in 1.5 verlinken, ggf. Abstands-/Zustandstabellen ergänzen.
- [x] `frontend/CLAUDE.md`: neue Komponenten in „Struktur & Datenfluss“ (`src/components/`) nennen.
- [x] `docs/vision.md`/`docs/screens.md` (Soll Admin) um die Navigation mit den geplanten Punkten Szenen und Kampf
      ergänzen.
- [x] Runde 2 (Änderung E2): `components.md` (Navigationsleiste), `screen-layouts.md`, `DESIGN.md` (Ausnahme
      Trennlinie, ggf. Flächen) und `contrast.md` (Leiste, Linie, inaktive Buttons/Einträge auf `background`) an die
      neue Fläche und Linienfarbe anpassen.

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

### Runde 1 – 2026-10-23
**Empfehlung:** Abnahme – keine blockierenden Befunde. Vor „Fertig“ H1 zur Kenntnis nehmen und die manuellen Prüfungen 4 (Musik, Sound, Abenteuer) und 5 (Hinweisleiste bei gestopptem Backend) erledigen.

Geprüft: Commit `f04e884` gegen `2f011ca` (Diff vollständig, 20 Dateien), zusätzlich Browserprüfung (Chrome/Selenium) gegen den Dev-Stack (`localhost:5173`, Backend `:8000`) mit Screenshots in beiden Themes und Tastaturtest; Spieltisch-Theme danach wieder `dark`.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Leiste mit „Notizen“ | erfüllt | `NavRail.tsx:59-84` (`<button>`, `title`/`aria-label` „Notizen“, `aria-pressed`), `AdminScreen.tsx:214` (Start `docs`), `AdminScreen.tsx:402-409` (genau ein Menüpunkt), `DocumentNavigation.tsx:8,30-40`; E2E-Szenario 1 grün; Laufzeit: Leiste x=0, y=56, 64×599, Panel x=64, 200 breit, bündig zwischen Top- und Bottom-Bar |
| AK2 Notizen wählen | erfüllt | `DocumentReader.tsx:181-227` (Laden hängt an Prop `selectedStoryIndex`, Logik unverändert), State in `AdminScreen.tsx:215`; E2E-Szenario 2 grün (Leveling aktiv, `h1#level_1`) |
| AK3 Ein-/Ausklappen | erfüllt (siehe H1) | `utils/navRail.ts:3-4`, `AdminScreen.tsx:66-71,439-470`; `DocumentReader` bleibt gemountet; E2E-Szenario 3 grün (Panel weg, `notes-view` breiter, Auswahl und `scrollTop` 400 erhalten); Unit-Test `navRail.spec.ts` deckt die 3 Fälle ab |
| AK4 Tastatur | erfüllt | Selbst geprüft: Tab → Fokus auf `nav-item-docs`, Outline `borderWidth.thick` `primary` (wie `ThemeMenu.tsx:48`, `AdventureSelect.tsx:37`); Enter/Leertaste schalten `aria-pressed` und Panel; `aria-controls=admin-nav-panel` |
| AK5 Rest unverändert | erfüllt (Musik, Sound, Hinweisleiste nicht live geprüft) | Diff `AdminScreen.tsx`: nur Layout, rechte Spalte unverändert (Raster `1fr RIGHT_COLUMN_WIDTH`, `space.5`); Top-/Bottom-Bar, Hinweisleisten, Handler unberührt; E2E `selectMainScene`/`selectSideScene` grün; Theme-Wechsel mit offenem Panel live geprüft |
| AK6 Beide Themes | erfüllt (nach `contrast.md`, siehe H2) | Nachgerechnet: Icon inaktiv 15,9/6,5, Icon aktiv 6,1/4,7, Fokus 6,6/5,0, Trennlinie 1,6 (Dark, bestehende Ausnahme DESIGN.md 2.6)/4,6 (Taverne); Screenshots beider Themes offen und eingeklappt |

**Blockierende Befunde**
- keine

**Hinweise**
- H1 Breitengewinn begrenzt: `PAGE_MAX_WIDTH` (880px) bleibt (außerhalb Scope). Bei 1600px Fensterbreite wächst die Notizseite beim Einklappen nur von ca. 864 auf 880px, ab ca. 1630px gar nicht mehr – die Spalte wird breiter, die Seite rückt nur nach links. AK3 erfüllt, das Ziel „mehr Breite für die Notizen“ wirkt auf breiten Monitoren aber kaum.
- H2 Fläche `secondary` (inaktiver Menüpunkt, Panel-Einträge) auf `dark` nur 1,2:1 (Dark) bzw. 1,5:1 (Taverne); in `contrast.md` dokumentiert, über Icon/Text erkennbar. Steht etwas quer zur Begründung in E2; Umsetzung folgt E1/E2 genau.
- H3 Bei eingeklapptem Panel zeigt `aria-controls` auf eine nicht vorhandene ID (Panel ausgehängt); vom Plan so vorgegeben, `aria-expanded` wäre semantisch näher.
- H4 `notes.svg` selbst gezeichnet statt aus frei lizenzierter Quelle; keine Lizenzfrage, E7 inhaltlich erfüllt.
- H5 (Vermutung) Inline-`beforeInjection` an `ReactSVG` (`NavRail.tsx:76-79`) setzt das Icon vermutlich bei jedem Render neu ein; gleiches Muster wie bestehende Icons in Top-/Bottom-Bar.
- H6 Kein separater Commit `docs(DND-28): approve plan`; Freigabe steckt in `2f011ca`, Diff ab dort geprüft.
- H7 Lint-Warnung `WallScreen.tsx:216` (`img` ohne `alt`) bestand schon vorher.
- Scope: `data-test-id`/`data-active` in `SideBarLeftElement.tsx`, `waitForElementGone` in `helpers.ts` und neue Zeilen in `contrast.md` sind durch Subtasks gedeckt; alle 13 Subtasks erledigt; Doku-Stichproben stimmen mit dem Code (`NAV_RAIL_WIDTH` = 40 + 2×12 = 64px).

**Checks:** Frontend `typecheck` ok, `lint` 0 Fehler/1 Warnung (H7), `test:unit` 170 passed (neu `navRail.spec.ts`, 3 Tests), `vite build` ok, E2E 3 Suites/7 Tests grün (`adminNavigation`, `selectMainScene`, `selectSideScene`). Commit `feat(DND-28): …` nach Schema, ohne KI-Signatur. Backend nicht betroffen.
