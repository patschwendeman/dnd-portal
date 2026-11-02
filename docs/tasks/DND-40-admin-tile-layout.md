# DND-40: Kachel-Layout im Admin Screen mit fester Kopfzeile

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Der Admin besteht heute aus einer festen Top-Bar und Flächen, die bündig aneinanderstoßen und durch Linien getrennt
sind; nur die Dashboard-Panels sind Kacheln. Der Spielleiter bekommt das Kachel-Layout aus dem Mockup
[admin-panel-mockup-v8.html](../../frontend/docs/design/mockup/admin-panel-mockup-v8.html): Navigationsleiste, Panel,
Notizseiten und Dashboard sind frei stehende Kacheln mit Rand und Lichtkante, die Top-Bar wird zu einer festen
Kopfzeile aus losen Kacheln über Notizen und Dashboard. Am Spieltisch wirkt der Admin dadurch ruhiger und
einheitlich, und Notizen und Dashboard scrollen unter einer festen Kopfzeile, ohne dass Abenteuer-Auswahl und Buttons
verschwinden. Dies ist Task 1 von 2; Hintergrundbild und durchscheinende Kacheln folgen in einem eigenen Task (E10).

## Scope / Non-Goals

**Im Scope**
- Grundraster des Admins neu: Kacheln statt bündiger Flächen, feste Kopfzeile statt Top-Bar (E1, E3).
- Gemeinsame Kachel-Optik mit Rand und Lichtkante (E2).
- Hinweisleiste in der Kopfzeile, nur der wichtigste Hinweis (E4).
- Navigationsleiste, Panel, Notizseiten und Dashboard als Kacheln (E5–E7).
- Style Guide, Screens-Doku und E2E-Steps an das neue Layout anpassen (E9).

**Nicht im Scope**
- Hintergrundbild hinter den Kacheln und durchscheinende Kacheln: Task 2 (E10).
- Ausblenden der Inhalte beim Scrollen zur Kopfzeile hin (E8).
- Inhalte der Panels: Bühne, Audio, Spieltisch und Party behalten Aufbau und Funktion aus DND-38. Das Mockup ist nur
  Vorlage für Layout und Optik, nicht für den Inhalt (es lässt z. B. die Zeile „Spieler“ mit QR-Code und die
  Zellgröße im Panel „Spieltisch“ weg und zeigt den in DND-38 entfernten Button „Hier abspielen“).
- Neue Icons: verwendet werden nur die vorhandenen aus `public/assets/icons` und der vorhandene Pfeil (`Chevron`) der
  Abenteuer-Auswahl.
- Neue Tokens oder Farbrollen; Backend, API, WebSocket; Wall, Ground und Player.

## Entscheidungen

### E1: Grundraster
- **Entscheidung:** Der Screen ist ein Grid mit den Spalten `NAV_RAIL_WIDTH`, `LEFT_COLUMN_WIDTH` (nur bei offenem
  Panel), `minmax(0, 1fr)` (Notizen) und der Dashboard-Spalte (nur bei offenem Dashboard, Breite wie heute
  `clamp(DASHBOARD_MIN_WIDTH, (100% − space.5) / 3, DASHBOARD_MAX_WIDTH)`), Zeilen `auto` (Kopfzeile) und
  `minmax(0, 1fr)`, `gap` `space.5`, Innenabstand seitlich `space.5`.
  - Navigationsleiste und Panel reichen über beide Zeilen und halten oben und unten `space.5` Abstand zum
    Bildschirmrand.
  - Die Kopfzeile liegt in Zeile 1 über Notizen und Dashboard (über die Notizen allein, wenn das Dashboard
    ausgeblendet ist), mit `space.5` Abstand nach oben. Sie scrollt nie.
  - Notizen und Dashboard liegen in Zeile 2 und scrollen jeweils für sich. Zwischen Kopfzeile und ihrem Inhalt
    bleiben immer `space.5` frei, auch beim Scrollen (der Abstand ist das `gap` des Grids, kein Innenabstand der
    Scrollbereiche). Unten laufen sie bis an den Bildschirmrand; der Abstand `space.5` unter der letzten Kachel liegt
    im Scrollbereich, sodass sie ganz nach unten gescrollt auf Höhe von Navigationsleiste und Panel endet.
- **Verworfene Alternativen:** Abstand oben im Scrollbereich (Inhalt scrollt bis an die Kopfzeile, Mockup v6);
  Abstand unten außerhalb des Scrollbereichs (Inhalt wird mitten in der Fläche abgeschnitten, Mockup v1).
- **Begründung:** Abstimmung über die Mockups v2, v6 und v7.

### E2: Kachel-Optik
- **Entscheidung:** Eine Kachel hat die Fläche `secondary`, `radius.lg`, einen Rand `borderWidth.thin` in `border`
  und innen oben eine Lichtkante: `box-shadow: inset 0 borderWidth.thin 0` in `border`. Kein äußerer Schatten.
  Die Optik ist ein gemeinsamer Baustein (CSS-Helper `tileSurface` in `src/style/`, analog zu `hoverScrollbar`), den
  alle Kacheln verwenden: Navigationsleiste, Panel, Kacheln der Kopfzeile, Notizseiten, Dashboard-Panels und Bühne.
  Die Hinweisleiste nutzt Form, Rand und Lichtkante ebenfalls, aber mit der Fläche `error`.
- **Verworfene Alternativen:** harte Schattenkante unter der Kachel (Mockup v3–v7, mit v8 verworfen).
- **Begründung:** Mockup v8; ein gemeinsamer Baustein verhindert Duplikate (jscpd) und hält die Kacheln gleich.

### E3: Kopfzeile statt Top-Bar
- **Entscheidung:** `TopBar` wird zur Komponente `AdminHeader` (Datei `src/components/AdminHeader.tsx`,
  `data-test-id="admin-header"`). Sie ist eine Flex-Zeile mit `gap` `space.4`:
  - **Abenteuer-Auswahl** (`AdventureSelect`): Die ganze Kachel ist der Trigger und füllt die Breite bis zu den
    Button-Gruppen (`flex: 1`). Name (`text.md` `bold`, einzeilig mit Ellipse) und Pfeil stehen mittig in der Kachel.
    Die Liste klappt wie heute unter dem Trigger auf (`layer.popover`), so breit wie ihr Inhalt und mittig unter der
    Kachel statt so breit wie der Trigger.
  - **Button-Gruppen** rechtsbündig: eine Kachel mit „Vollbild“ und „Dashboard“, eine Kachel mit Settings.
    Innenabstand `space.1`, `gap` `space.1`; so ergibt sich mit den Buttons in `radius.md` der Radius `radius.lg`
    (Regel für verschachtelte Flächen). Icons wie heute (`fullscreen.svg`/`fullscreenExit.svg`, `dashboard.svg`,
    `settings.svg`).
  - **Buttons:** inaktiv transparent, Hover `background`; aktiv (Dashboard offen, Vollbild) `primary` mit Icon in
    `onPrimary`, auch bei Hover; Fokus wie heute. Settings hat keinen Aktiv-Zustand.
  - Alle Kacheln der Kopfzeile sind gleich hoch: `size.control.md` plus Innenabstand und Rand der Button-Gruppen.
  - `OUTER_COLUMN_WIDTH` und der Token `size.bar.md` entfallen.
- **Verworfene Alternativen:** Buttons gefüllt in `background` wie die Icon-Buttons der Panels; Innenabstand
  `space.2` wie im Mockup (bräuchte einen Radius von 16px, den es als Token nicht gibt).
- **Begründung:** Mockup v6/v7 und Rückfrage im Dialog.

### E4: Hinweisleiste in der Kopfzeile
- **Entscheidung:** Bei einem Fehler ersetzt die Hinweisleiste (`ErrorBar`) die Abenteuer-Auswahl an derselben Stelle
  und in derselben Größe; die Button-Gruppen bleiben. Stehen mehrere Fehler an, zeigt sie nur den wichtigsten in der
  Reihenfolge Verbindung getrennt → Laden fehlgeschlagen → Speichern fehlgeschlagen; ist er behoben, erscheint der
  nächste. Text, Retry-Button und `role="alert"` bleiben wie heute. Die eigene Zeile unter der Top-Bar entfällt; die
  Kopfzeile bleibt immer einzeilig. Während eines Fehlers ist kein Abenteuerwechsel möglich.
- **Verworfene Alternativen:** eigene Kachelzeile unter der Kopfzeile; Ganz oben über alles; Hinweisleiste zwischen
  Auswahl und Buttons; mehrere Hinweise untereinander.
- **Begründung:** Rückfrage im Dialog; die Kopfzeile behält eine feste Höhe.

### E5: Navigationsleiste und Panel als Kacheln
- **Entscheidung:** Navigationsleiste und Panel werden Kacheln (E2); die senkrechten Linien in `secondary` rechts an
  beiden entfallen. Innenabstände bleiben (`space.5` oben/unten; Panel seitlich `space.4`), das Panel scrollt bei
  Überlänge innerhalb seiner Kachel. Hover inaktiver Menüpunkte (`NavRail`) und inaktiver Panel-Einträge
  (`SideBarLeftElement`) wird `background` statt `secondary` (auf der Kachel wäre `secondary` unsichtbar). Aktiv
  bleibt `primary`/`onPrimary`. Einklappen des Panels wie heute: die Spalte entfällt.
- **Begründung:** Mockup v8; Hover-Regel wie in den Dashboard-Panels.

### E6: Notizseiten als Kacheln
- **Entscheidung:** Jede Notizseite ist eine Kachel (E2) über die volle Breite der mittleren Spalte;
  `PAGE_MAX_WIDTH` entfällt, die Zeilenlänge bleibt auf `LINE_MAX_WIDTH` begrenzt und zentriert. Innenabstand
  (`space.7`/`space.8`), Schrift, Unterstrich von h1 und Abstand zwischen den Seiten (`space.5`) bleiben. Der
  Nach-oben-Button (`TopLink`) bekommt die Fläche `background` statt `secondary`, weil er über Kacheln schwebt.
- **Verworfene Alternativen:** Kachel höchstens 880px breit und zentriert.
- **Begründung:** Rückfrage im Dialog, wie im Mockup.

### E7: Dashboard
- **Entscheidung:** Dashboard-Panels und Bühne bekommen Rand und Lichtkante (E2); Aufbau, Reihenfolge und Abstand
  `space.4` bleiben wie in DND-38. Das Dashboard hat oben keinen Innenabstand mehr (den Abstand gibt E1), unten
  `space.5` im Scrollbereich.
- **Begründung:** E1.

### E8: Kein Ausblenden beim Scrollen
- **Entscheidung:** Inhalte werden an der Oberkante von Notizen und Dashboard hart abgeschnitten, nicht ausgeblendet.
- **Verworfene Alternativen:** Ausblenden über `space.7` zur Kopfzeile hin (frühere Mockup-Version, vom Spielleiter
  verworfen).
- **Begründung:** Entscheidung des Spielleiters.

### E9: Style Guide
- **Entscheidung:** Die Doku beschreibt das neue Layout als Soll und Ist:
  - `frontend/DESIGN.md`: Regel zu Rahmen und Linien um die Lichtkante ergänzen (`box-shadow` nur als innere
    Lichtkante der Kachel, sonst kein `box-shadow`; Aktiv-Zustand weiter ohne Leuchten). Rollen 2.2 und Zustände 2.4:
    Navigationsleiste, Panel und Kopfzeile sind Kacheln in `secondary`, die Linien in `secondary` entfallen; Hover in
    Navigationsleiste und Panel `background`; `border` auch für Rand und Lichtkante der Kacheln. Ausnahme in 2.6 zu
    den Linien in `secondary` streichen. Tabellen „Innenabstand von Flächen“, „Radien“ und „Abstände nach Beziehung“
    um Kachel, Kopfzeile und Button-Gruppe ergänzen; `size.bar.md` streichen.
  - `frontend/docs/design/components.md`: neuer Baustein „Kachel“; „Top-Bar“ wird „Kopfzeile“; Navigationsleiste,
    Navigationseintrag, Dashboard-Panel, Bühne und Hinweisleiste anpassen.
  - `frontend/docs/design/screen-layouts.md`: Admin-Layout nach E1; `OUTER_COLUMN_WIDTH` und `PAGE_MAX_WIDTH`
    streichen.
  - `frontend/docs/design/contrast.md`: neue Paare messen bzw. zuordnen (`border` auf `secondary` als Rand der
    Kachel, `text.color` und `onError` auf `error` in der Kopfzeile, Hover `background` auf `secondary`). Festhalten,
    dass `primary` auf `secondary` für Text in Tavern 4,5:1 verfehlt (3,3:1): Die Notizen enthalten derzeit keine
    Text-Links, nur Bilder; ein künftiger Link braucht eine Lösung.
- **Begründung:** Die Doku ist Teil des Style Guide und darf nicht vom Code abweichen.

### E10: Task 2 folgt
- **Entscheidung:** Hintergrundbild hinter den Kacheln und durchscheinende Kacheln (Mockup v4/v5) sind ein eigener,
  späterer Task. Offene Punkte dort: welches Bild (festes Default-Bild oder Wall-Bild der aktiven Szene), neue
  Farbrolle für die durchscheinende Fläche, Kontrast über hellen Bildern, Radius der Unschärfe.
- **Begründung:** Diese Punkte brauchen eigene Entscheidungen; das Kachel-Layout ist ohne sie vollständig.

## Subtasks

### Frontend
- [x] Baustein `tileSurface` in `src/style/` (E2).
- [x] `AdminScreen`: Grundraster nach E1; Hinweisleiste aus dem Raster in die Kopfzeile (E4), Auswahl des
      wichtigsten Fehlers als kleine, getestete Funktion in `src/utils/`.
- [x] `TopBar` → `AdminHeader` mit Abenteuer-Auswahl als Kachel und Button-Gruppen (E3); `AdventureSelect` an die
      Kachel anpassen; `ErrorBar` als Kachel (E4); Token `size.bar.md` entfernen.
- [x] `NavRail`, Panel in `AdminScreen`, `SideBarLeftElement`: Kacheln und Hover nach E5.
- [x] `DocumentReader`: Notizseiten als Kacheln, `TopLink` nach E6; `Dashboard`, `DashboardPanel`,
      `ActiveScenePanel`: nach E7.
- [x] Unit-Test für die Auswahl des wichtigsten Fehlers; E2E-Steps (`adminDashboard.ts`, `adminNavigation.ts`) und
      ggf. Features an Kopfzeile und Raster anpassen (`top-bar` → `admin-header`; die Prüfung „Navigationsleiste
      endet am unteren Rand“ wird „endet `space.5` über dem unteren Rand“).

### Doku
- [x] Style Guide nach E9.
- [x] `docs/screens.md` (Admin: Layout Soll und Ist), `docs/architecture.md` und `frontend/CLAUDE.md`, wo Top-Bar
      oder `TopBar` genannt sind; `docs/known-issues.md` prüfen.

## Akzeptanzkriterien

### AK1: Kacheln über die volle Höhe
- **Given** der Admin ist bei 1920 × 1080 geöffnet, Panel und Dashboard sind offen
- **When** der Spielleiter auf den Screen schaut
- **Then** sind Navigationsleiste und Panel Kacheln mit `space.5` Abstand zum oberen und unteren Rand
- **And** es gibt keine Top-Bar und keine Trennlinien zwischen den Bereichen

### AK2: Feste Kopfzeile
- **Given** der Admin ist geöffnet
- **When** der Spielleiter auf die Kopfzeile schaut
- **Then** reicht die Abenteuer-Auswahl von der linken Kante der Notizen bis zu den Button-Gruppen
- **And** rechts stehen eine Kachel mit „Vollbild“ und „Dashboard“ und eine Kachel mit Settings, mit den bisherigen
  Icons
- **And** alle Kacheln der Kopfzeile sind gleich hoch

### AK3: Scrollen unter der Kopfzeile
- **Given** die Notizen und das Dashboard sind höher als der Bildschirm
- **When** der Spielleiter in den Notizen oder im Dashboard scrollt
- **Then** bleibt die Kopfzeile stehen
- **And** zwischen Kopfzeile und Inhalt bleiben immer `space.5` frei
- **And** ganz nach unten gescrollt endet die letzte Kachel `space.5` über dem unteren Rand

### AK4: Dashboard und Panel ein- und ausklappen
- **Given** der Admin ist geöffnet
- **When** der Spielleiter das Dashboard ausblendet bzw. das Panel einklappt
- **Then** reichen Kopfzeile und Notizen bis an den rechten Rand bzw. rücken an die Navigationsleiste
- **And** die Button-Gruppen bleiben in der Kopfzeile erreichbar

### AK5: Hinweisleiste
- **Given** die Verbindung zum Server ist getrennt und ein Speichern ist fehlgeschlagen
- **When** der Spielleiter auf die Kopfzeile schaut
- **Then** steht an der Stelle der Abenteuer-Auswahl nur der Hinweis „Verbindung zum Server getrennt“ mit Retry
- **And** nach dem Wiederverbinden erscheint der Hinweis zum Speichern
- **And** ohne Fehler steht dort wieder die Abenteuer-Auswahl

### AK6: Notizseiten
- **Given** eine Notiz ist ausgewählt
- **When** der Spielleiter sie liest
- **Then** ist jede Seite eine Kachel über die volle Breite der mittleren Spalte mit Text in begrenzter Zeilenlänge
- **And** der Nach-oben-Button ist auf den Kacheln sichtbar

### AK7: Funktionen unverändert
- **Given** der Admin ist geöffnet
- **When** der Spielleiter Abenteuer wechselt, Szenen wählt, Notizen öffnet, Vollbild und Dashboard umschaltet, das
  Theme wechselt und die Dashboard-Panels bedient
- **Then** verhält sich alles wie vor dem Umbau

### AK8: Themes
- **Given** das Theme ist Dark bzw. Tavern
- **When** der Spielleiter auf den Admin schaut
- **Then** nutzen alle Kacheln nur die vorhandenen Farbrollen, und Rand und Lichtkante sind in beiden Themes sichtbar

### AK9: Qualität
- `npm run lint`, `typecheck`, `test:unit`, `build`, `check:deadcode` und `check:dupes` sind grün; keine neuen
  Baseline-Einträge, Schwellwert von jscpd nicht angehoben; Style Guide stimmt mit dem Code überein.

## Teststrategie / Verifikation

**Automatisch**
- Frontend (Unit): Auswahl des wichtigsten Fehlers (Reihenfolge, kein Fehler, ein Fehler, mehrere Fehler).
- Frontend (BDD): bestehende Admin-Features laufen mit angepassten Steps grün (`npm run test:e2e` mit laufendem
  Backend); Prüfung der Kopfzeile und des Abstands zum unteren Rand angepasst.

**Manuell**
1. Admin bei 1920 × 1080 öffnen: Layout mit Mockup v8 vergleichen (ohne Hintergrundbild und Transparenz).
2. In Notizen und Dashboard scrollen: Kopfzeile steht, Abstand `space.5` bleibt, unten endet die letzte Kachel auf
   Höhe der Navigationsleiste.
3. Dashboard ausblenden, Panel einklappen, Vollbild an und aus; Theme auf Tavern und zurück.
4. Backend stoppen: Hinweis „Verbindung zum Server getrennt“ ersetzt die Abenteuer-Auswahl; Backend starten: Hinweis
   verschwindet.
5. Abenteuer-Liste öffnen: sie klappt mittig unter der Kachel auf und liegt über Notizen und Dashboard.

## Offene Fragen
- Die Annahme in E9, die Notizen enthielten keine Text-Links, trifft nicht zu: Die Inhaltsverzeichnisse (z. B.
  `public/story/fight/1_tableOfContent.md`, auch „Main“) enthalten Anker-Links in `primary`, die auf den Notizseiten in
  `secondary` in Tavern 4,5:1 verfehlen (3,3:1). Umgesetzt wie geplant; `contrast.md`, DESIGN.md 2.6 und
  `docs/known-issues.md` halten den Stand als offen fest. Zu entscheiden: hinnehmen oder eigener Task.

## Review
