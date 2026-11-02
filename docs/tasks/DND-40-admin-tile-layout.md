# DND-40: Kachel-Layout im Admin Screen mit fester Kopfzeile

**Typ:** feat
**Status:** Fertig

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

### Runde 1 – 2026-11-02
**Empfehlung:** Nacharbeiten

Geprüft: Commit 0b68b9e auf `development` (Plan liegt im Umsetzungs-Commit, wie bei DND-39).

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Headless Chrome 1920 × 937, Tavern: Leiste x 24–88, Panel x 112–352, jeweils y 24 bis vh − 24; Rand `border` 1px, `radius` 12px, Lichtkante `inset 0 1px 0`; Linien in `secondary` entfernt (`NavRail.tsx:14-22`, `AdminScreen.tsx:766-773`); `AdminHeader.tsx` statt Top-Bar. |
| AK2 | erfüllt | Kopfzeile ab x 376 (= Notizen); Auswahl 376–1720, `gap` 16, Gruppen 1736–1830 und 1846–1896; alle Kacheln 50 px hoch. |
| AK3 | erfüllt | Kopfzeile bei scrollTop 0/300/4041 fest bei y 24–74; Notizen ab y 98, unten bei vh − 24; Dashboard endet ebenfalls bei vh − 24 (scrollHeight 1264). |
| AK4 | erfüllt | Dashboard aus: Kopfzeile/Notizen r = vw − 24; Panel eingeklappt: x 112; Button-Gruppen sichtbar. |
| AK5 | erfüllt | `utils/adminError.ts` (connection → load → save), `adminError.spec.ts` (5 Fälle) grün; live offline: nur „Backend nicht erreichbar“ (1 × `role="alert"`) an Stelle der Auswahl, gleiche Größe. „Verbindung getrennt“ nur per Code und Unit-Test belegt. |
| AK6 | erfüllt | Notizseite 376–1892, Textblock 686 px (`LINE_MAX_WIDTH`) zentriert; Nach-oben-Button auf `background` sichtbar. |
| AK7 | erfüllt | E2E 19/20 grün (Fehlschlag umgebungsbedingt, siehe Checks); Abenteuer-Liste mittig unter der Kachel (z-index 35). |
| AK8 | erfüllt | Kacheln nutzen nur `secondary`, `border`, `background`, `error` (`tileSurface`); Rand und Lichtkante in Tavern und Dark sichtbar, in Dark schwach (1,5:1, als Ausnahme dokumentiert). |
| AK9 | **nicht erfüllt** | Checks grün, aber Style Guide widerspricht dem Inhalt (siehe Befund). |

**Blockierende Befunde**
- [x] `frontend/DESIGN.md:304-305` (2.6 „Offen“) behauptet, die Notizen enthielten keine Text-Links. Falsch: `frontend/public/story/{main,fight}/1_tableOfContent.md:3ff` haben Anker-Links in `primary` (`AdminScreen.tsx:106-107`); widerspricht `contrast.md:47,95` und `docs/known-issues.md:50` aus demselben Commit. Abhilfe: Satz an `contrast.md` angleichen (Inhaltsverzeichnis-Links betroffen, Lösung offen).

**Hinweise**
- Inhaltsverzeichnis-Links in Tavern 3,3:1 (`#C05E5E` auf `#3D271C`; Dark 5,58) – laut E9 nur zu dokumentieren, ist erfolgt; seit diesem Task echter WCAG-Verstoß in „Main“/„Fight“. Entscheidung beim User: hinnehmen oder eigener Task.
- Ersatzpaar `border` auf `error` statt `text.color` auf `error` sinnvoll (1,15 / 1,96 nachgerechnet). Aber `contrast.md:80,90-94` verweist für „bewusst ✗ beide“ auf 2.6, `DESIGN.md:301` nimmt dort nur `border` im Dark-Theme aus – Tavern `border` auf `error` (2,0:1) ist nicht abgedeckt; Ausnahme in 2.6 ergänzen.
- Settings ohne eigenen Fokus-Stil: Stand vor dem Task, E3 („Fokus wie heute“) eingehalten; Outline in `primary` wäre kleine Verbesserung.
- Zusatzkorrekturen (`docs/domain.md`, `frontend/README.md`, Testtitel `sounds.spec.ts`) entfernen veraltete Top-Bar-Nennungen; passt zu E9, keine Scope-Verletzung.
- `adminNavigation.ts` unverändert, nicht nötig (Prüfung in `adminDashboard.ts:296-299`).
- Notizseite um Scrollleistenbreite schmaler als die Spalte (993 statt 997 px), unkritisch.
- Konventionen eingehalten: ein Commit, `feat(DND-40): …`, 5 Stichpunkte, keine KI-Signatur.
- Dev-Stack: Während der Fehler-Simulation wechselte das Theme per `PATCH /table` auf `dark` (Herkunft unklar); Reviewer setzte `tavern`, danach setzte ein anderer Client wieder `dark` – belassen.

**Checks:** `npm run lint`, `typecheck`, `test:unit` (205), `build`, `check:deadcode`, `check:dupes` (1,25 %) grün. E2E (`npx jest --runInBand`, Dev-Stack): 19/20 grün. Rot: „The first interaction makes an admin window the audio output“ – Vorbedingung `output_ready: false` (`adminDashboard.ts:438`) scheitert, weil ein anderes Admin-Fenster Audioausgabe ist; umgebungsbedingt.

### Runde 2 – 2026-11-02
**Empfehlung:** Abnahme

Geprüft: Nacharbeit-Commit 4bb956a auf `development`; `git diff --stat 0b68b9e 4bb956a` berührt nur die Plan-Datei (Review-Bericht Runde 1) und `frontend/DESIGN.md` – kein Code, AK1–AK8 aus Runde 1 übernommen.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1–AK8 | erfüllt | aus Runde 1 übernommen (kein Code geändert; AK7: E2E 19/20, Fehlschlag umgebungsbedingt) |
| AK9 | erfüllt | Lint und Typecheck grün; Aussage zu den Links konsistent in `frontend/DESIGN.md:304-306`, `frontend/docs/design/contrast.md:47,95-97` und `docs/known-issues.md:50-51`. |

**Blockierende Befunde**
- [x] Befund aus Runde 1 (2.6 „Offen“: keine Text-Links) behoben; kein Restvorkommen mehr (grep).

**Hinweise**
- Hinweis 2 aus Runde 1 erledigt: Ausnahme in `frontend/DESIGN.md:301-303` deckt `border` auf `error` in beiden Themes ab, passend zu `contrast.md:80,93-94` und `ErrorBar.tsx:10-19` (`tileSurface`).
- Optional: Überschrift der Anmerkung `contrast.md:89` heißt weiter „`border` im Dark-Theme“; inhaltlich durch „Kacheln (Admin)“ (`contrast.md:93-94`) abgedeckt.
- Hinweis 1 aus Runde 1 offen, Entscheidung beim User: Inhaltsverzeichnis-Links in Tavern 3,3:1 – hinnehmen oder eigener Task.
- Link `../docs/known-issues.md` aus `frontend/DESIGN.md` gültig.
- Konventionen eingehalten: `feat(DND-40): address review round 1`, 2 Stichpunkte, keine KI-Signatur, ein Commit.

**Checks:** `npm run lint` und `npm run typecheck` grün. Unit, Build, Deadcode, Dupes und E2E nicht erneut ausgeführt (kein Code seit Runde 1 geändert; dort grün bzw. 19/20 umgebungsbedingt). Dev-Stack nicht verändert.
