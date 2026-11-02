# DND-41: Szenenbild als Hintergrund im Admin, durchscheinende Kacheln

**Typ:** feat
**Status:** Fertig

## Kontext & Ziel

Seit DND-40 besteht der Admin aus Kacheln auf einer einfarbigen Fläche. Als zweiter Teil des Redesigns (Mockups
[v4](../../frontend/docs/design/mockup/admin-panel-mockup-v4.html) und
[v5](../../frontend/docs/design/mockup/admin-panel-mockup-v5.html)) liegt hinter den Kacheln das Wall-Bild der aktiven
Szene, abgedunkelt, und die Kacheln lassen es weichgezeichnet durchscheinen. Der Spielleiter hat so auch am Admin die
Stimmung der laufenden Szene vor Augen und erkennt einen Szenenwechsel sofort am Hintergrund.

## Scope / Non-Goals

**Im Scope**
- Hintergrund-Ebene im Admin mit dem Wall-Bild der aktiven Szene, Abdunklung und Überblendung beim Wechsel (E1–E3).
- Durchscheinende Kacheln mit Unschärfe, solange ein Bild gezeigt wird (E4, E5).
- Neue Farbrolle in beiden Themes, Kontrastmessung für den ungünstigsten Fall (E4, E6).
- Style Guide und Screens-Doku.

**Nicht im Scope**
- Festes Default-Bild ohne aktive Szene (E1); Hintergrund auf Wall, Ground oder Player.
- Änderungen am Layout aus DND-40 oder an den Inhalten der Panels.
- Ausblenden beim Scrollen (DND-40, E8).
- Backend, API, WebSocket: das Wall-Bild der aktiven Szene lädt der Admin bereits (`activeScene.wall_image`).
- Neue Icons.

## Entscheidungen

### E1: Welches Bild
- **Entscheidung:** Hinter den Kacheln liegt das Wall-Bild der aktiven Szene (`activeScene.wall_image.source` über
  `mediaUrl`, dasselbe Bild wie auf der Bühne). Ohne aktive Szene, solange sie lädt oder wenn sie bzw. das Bild nicht
  geladen werden kann, bleibt der Hintergrund einfarbig `background` wie heute.
- **Verworfene Alternativen:** festes Default-Bild (`forest.jpg` als Kopie in `frontend/public`) immer oder als
  Rückfall ohne Szene.
- **Begründung:** Rückfrage im Dialog; keine Kopplung an Seed-Daten oder Mediendateien im Frontend.

### E2: Hintergrund-Ebene
- **Entscheidung:** Eine neue Komponente `SceneBackground` liegt im JSX vor dem Raster des Admins: Fläche
  `background`, darüber das Bild (`position: fixed`, `inset: 0`, `object-fit: cover` nach Style Guide), darüber die
  Abdunklung. Bild und Raster brauchen keinen `z-index`: beide sind `position: fixed`, die Reihenfolge im JSX legt die
  Ebenen fest (wie im Player). Das Raster (`Screen` in `AdminScreen`) verliert dafür seine eigene Fläche. Das Bild ist
  Dekoration (`alt=""`, `aria-hidden`).
- **Begründung:** Regel „Was im Grid-Layout ohnehin richtig liegt, bekommt keinen `z-index`“.

### E3: Abdunklung und Wechsel
- **Entscheidung:** Abgedunkelt wird mit `scrim` (75 %, Rolle für Abdunklung auf Bildern), nicht mit `backdrop`.
  Beim Wechsel der Szene blendet das alte Bild in das neue über, sobald das neue geladen ist; die Dauer ist ein Wert in
  der Komponente (keine Tokens für Übergangsdauern). Bei `prefers-reduced-motion: reduce` wechselt das Bild ohne
  Übergang. Fällt die Szene weg, blendet das Bild zur einfarbigen Fläche aus.
- **Verworfene Alternativen:** `backdrop` (50 %) wie im Mockup: im ungünstigsten Fall verfehlt der Status-Punkt
  „verbunden“ in Tavern 3:1 (etwa 2,5:1); sofortiger Wechsel ohne Übergang.
- **Begründung:** Rückfrage im Dialog; mit `scrim` erreichen alle Paare auf den Kacheln ihr Ziel (E6).

### E4: Durchscheinende Kacheln
- **Entscheidung:** Neue Farbrolle `secondaryTranslucent` in beiden Themes: `secondary` mit 75 % Deckkraft
  (Dark `#161b23bf`, Tavern `#3D271Cbf`). Kacheln haben diese Fläche und weichzeichnen, was dahinter liegt
  (`backdrop-filter: blur(TILE_BLUR)`, Layout-Konstante bei `tileSurface`, Wert 12px). Rand und Lichtkante bleiben.
  Betroffen sind alle Kacheln aus `tileSurface`: Navigationsleiste, Panel, Kacheln der Kopfzeile, Notizseiten,
  Dashboard-Panels. Nicht betroffen: die Bühne (zeigt ihr Bild deckend), die Hinweisleiste (`error` bleibt deckend),
  Flächen in den Kacheln (`background`: Buttons, Segment-Control, Sound-Gruppen, Spielerzeilen, Nach-oben-Button),
  die Abenteuer-Liste und der Dialog.
- **Verworfene Alternativen:** `color-mix()` im Component (wäre eine Farbe ohne Rolle, Verstoß gegen 2.1); Notizseiten
  deckend lassen.
- **Begründung:** Rückfrage im Dialog; jede neue Farbe ist eine Rolle in allen Themes.

### E5: Durchscheinend nur mit Bild
- **Entscheidung:** Die Kacheln sind nur durchscheinend, solange ein Szenenbild gezeigt wird. Ohne Bild (E1) haben sie
  wie heute die deckende Fläche `secondary` und keine Unschärfe. `tileSurface` bekommt dafür einen Schalter, den
  `AdminScreen` aus dem Zustand des Hintergrunds setzt.
- **Begründung:** Ohne Bild läge `secondaryTranslucent` über `background` und ergäbe einen dunkleren Ton, für den die
  Kontrastwerte aus `contrast.md` nicht gelten; mit dem Schalter bleibt der Admin ohne Szene genau wie nach DND-40.

### E6: Kontrast
- **Entscheidung:** `contrast.md` misst die Paare auf den durchscheinenden Kacheln für den ungünstigsten Fall: Kachel
  über einem weißen Bild mit `scrim` (Kachel etwa `secondary` 75 % über `#404040`) und über einem schwarzen Bild.
  Überschlag für Weiß: `text.color` Dark 14,3:1, Tavern 6,1:1; `primary` (Status-Punkt, Ziel 3:1) Dark 5,0:1, Tavern
  3,1:1; `text.muted` (Lautsprecher-Icon, Ziel 3:1) Dark 7,5:1, Tavern 3,8:1. Die Unschärfe ändert den Mittelwert
  nicht und bleibt ohne Einfluss auf die Messung. Erreicht ein Paar sein Ziel nicht, wird die Deckkraft der Rolle
  erhöht (nicht die Abdunklung verringert).
- **Begründung:** Der Kontrast hängt jetzt vom Bild ab; der Style Guide verlangt AA auch dann.

## Subtasks

### Frontend
- [x] Rolle `secondaryTranslucent` in `darkTheme.ts`, `tavernTheme.ts` (Typ über `styled.d.ts`).
- [x] `tileSurface` mit Schalter für durchscheinend (E4, E5), Konstante `TILE_BLUR`.
- [x] Komponente `SceneBackground` (E2, E3) mit Überblendung und Rückfall auf die einfarbige Fläche; Zustand „Bild
      sichtbar“ als kleine, getestete Funktion bzw. Hook, falls die Logik über das Rendern hinausgeht.
- [x] `AdminScreen`: `SceneBackground` vor dem Raster, eigene Fläche des Rasters entfernen, Schalter an die Kacheln
      weitergeben.
- [x] Unit-Tests (Zustand des Hintergrunds: keine Szene, Szene lädt, Bild geladen, Bild fehlerhaft, Szenenwechsel);
      E2E-Steps nur anpassen, falls die bestehenden Prüfungen betroffen sind.

### Doku
- [x] `frontend/DESIGN.md`: Rolle `secondaryTranslucent` in 2.2 und 2.3; `scrim` auch für die Abdunklung des
      Admin-Hintergrunds; Regel zu durchscheinenden Kacheln (nur mit Bild, Unschärfe); Ausnahme in 2.6 für Text auf
      durchscheinenden Kacheln (Messung im ungünstigsten Fall).
- [x] `frontend/docs/design/components.md` (Kachel, neuer Baustein Szenen-Hintergrund), `screen-layouts.md`
      (Admin-Layout, Konstante `TILE_BLUR`), `contrast.md` (Theme-Werte, Messung nach E6).
- [x] `docs/screens.md` (Admin Soll/Ist), `frontend/CLAUDE.md` (Struktur), `docs/known-issues.md` prüfen.

## Akzeptanzkriterien

### AK1: Szenenbild im Hintergrund
- **Given** im Admin ist eine Szene aktiv
- **When** der Spielleiter auf den Admin schaut
- **Then** liegt das Wall-Bild dieser Szene abgedunkelt hinter allen Kacheln und füllt den Bildschirm
- **And** es scrollt nicht mit Notizen oder Dashboard

### AK2: Durchscheinende Kacheln
- **Given** ein Szenenbild ist im Hintergrund zu sehen
- **When** der Spielleiter auf Navigationsleiste, Panel, Kopfzeile, Notizseiten und Dashboard-Panels schaut
- **Then** scheint das Bild weichgezeichnet durch die Kacheln
- **And** Bühne, Hinweisleiste und die Bedienflächen in den Kacheln bleiben deckend

### AK3: Ohne Szene
- **Given** im Admin ist keine Szene aktiv (oder sie bzw. ihr Bild lässt sich nicht laden)
- **When** der Spielleiter auf den Admin schaut
- **Then** ist der Hintergrund einfarbig und die Kacheln sind deckend wie nach DND-40

### AK4: Szenenwechsel
- **Given** eine Szene ist aktiv
- **When** der Spielleiter eine andere Szene aktiviert
- **Then** blendet der Hintergrund nach dem Laden des neuen Bilds in das neue Szenenbild über
- **And** bei reduzierter Bewegung (Systemeinstellung) wechselt er ohne Übergang

### AK5: Lesbarkeit und Themes
- **Given** das Theme ist Dark bzw. Tavern und das Szenenbild ist sehr hell
- **When** der Spielleiter Notizen und Panels liest
- **Then** erreichen Text und Bedienelemente auf den Kacheln die Kontrastziele aus dem Style Guide (Messung in
  `contrast.md`)

### AK6: Funktionen unverändert
- **Given** der Admin ist geöffnet
- **When** der Spielleiter ihn wie bisher bedient (Abenteuer, Szenen, Notizen, Vollbild, Dashboard, Theme, Panels)
- **Then** verhält sich alles wie nach DND-40

### AK7: Qualität
- `npm run lint`, `typecheck`, `test:unit`, `build`, `check:deadcode` und `check:dupes` sind grün; keine neuen
  Baseline-Einträge, Schwellwert von jscpd nicht angehoben; Style Guide stimmt mit dem Code überein.

## Teststrategie / Verifikation

**Automatisch**
- Frontend (Unit): Zustand des Hintergrunds nach Subtask 3.
- Frontend (BDD): bestehende Admin-Features laufen grün (`npm run test:e2e` mit laufendem Backend).

**Manuell**
1. Szene „Default“ aktivieren: Wald-Bild abgedunkelt hinter den Kacheln, Kacheln weichgezeichnet durchscheinend; mit
   Mockup v5 vergleichen (dort `backdrop` statt `scrim`, daher heller).
2. Szene wechseln (z. B. Shop): Überblendung; in den Systemeinstellungen „Bewegung reduzieren“ an: Wechsel ohne
   Übergang.
3. Abenteuer ohne aktive Szene bzw. Backend für Medien nicht erreichbar: einfarbiger Hintergrund, deckende Kacheln.
4. Theme Tavern: Lesbarkeit von Notizen, Status-Punkten und Lautsprecher-Icon über einem hellen Szenenbild.
5. In Notizen und Dashboard scrollen: flüssig, Hintergrund steht.

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-11-03
**Empfehlung:** Nacharbeiten

Zwei Befunde blockieren, beide sind klein: Die Fokus-Outline der Abenteuer-Auswahl verfehlt in Tavern 3:1 (AK5), und DESIGN.md 2.6 widerspricht `contrast.md` beim Rand der Kacheln (AK7). Der übrige Code entspricht dem Plan, alle Checks außer einem E2E-Szenario sind grün. Dieses Szenario scheitert an der Umgebung, nicht an der Änderung.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `frontend/src/components/SceneBackground.tsx:7-37` (`position: fixed`, `inset: 0`, `object-fit: cover`, `scrim` als `::after`); `frontend/src/screens/AdminScreen.tsx:460-476` (Bild ist das Wall-Bild der aktiven Szene, liegt im JSX vor dem Raster); Fläche des Rasters entfernt (`AdminScreen.tsx` ca. Z. 104). Eigener Selenium-Screenshot im Admin (Dark, Szene „Fight 1“): `fight.jpg` liegt abgedunkelt hinter den Kacheln, `position: fixed`. |
| AK2 | erfüllt | `frontend/src/style/GlobalStyle.ts:31-46` (`secondaryTranslucent` und `blur(12px)` nur mit `$isTranslucent`). Im Browser gemessen: Navigationsleiste, Abenteuer-Auswahl, Notizseite und Panel „Audio“ haben `rgba(22,27,35,0.75)` und `blur(12px)`. Die Bühne bleibt `rgb(14,17,23)` ohne Filter. Hinweisleiste: `ErrorBar.tsx` setzt kein `$isTranslucent`, die Fläche bleibt `error`. Bedienflächen haben weiter `background`, Abenteuer-Liste (`AdventureSelect.tsx:74`) und Dialog bleiben `secondary`. |
| AK3 | erfüllt | `AdminScreen.tsx:460-463` (bei `activeSceneFailed` oder ohne Szene ist `src` null); `frontend/src/utils/sceneBackground.ts` (`hide` bei `failed`, anzeigen erst nach `loaded`); `isTranslucent = isImageShown`. Unit-Tests „shows no image without an active scene“, „renders the image of a loading scene but does not show it yet“, „stays plain when the image cannot be loaded“ sind grün. Ohne Szene im Browser nicht geprüft. |
| AK4 | erfüllt (nur Code und Unit-Tests) | Überblendung erst nach dem Laden: Reducer `target`/`loaded`, Tests „keeps the old image while…“ und „fades from the old to the new image once the new one is loaded“. `SceneBackground.tsx:17-22` (`transition` 600 ms, bei `prefers-reduced-motion: reduce` `transition: none`). Im Browser nicht geprüft. |
| AK5 | **nicht erfüllt** | Nachgerechnet mit WCAG-Formel, alle Werte aus `frontend/docs/design/contrast.md:79-85` bestätigt: Text 14,3 / 6,1; `primary` auf Kachel 5,0 / 3,1; `text.muted` 7,5 / 3,8. **Fokus-Outline der Abenteuer-Auswahl** in Tavern über weißem Bild: **2,48:1, Ziel 3:1** (`AdventureSelect.tsx:39-43`, `outline-offset` nach außen). Vor DND-41 lag sie auf `background` und erreichte 4,7:1, die Änderung verschlechtert sie also. Außerdem verfehlen die Links in den Notizen in Tavern 4,5:1 mit 3,11:1 (vorher 3,32:1); das war schon vorher als offen dokumentiert. |
| AK6 | erfüllt | E2E selbst ausgeführt: 19/20 grün. Das eine Scenario scheitert in seiner Vorbedingung (`output_ready` erwartet false, ist true). `GET /table/audio` lieferte vor dem Lauf schon `output_ready: true`, es lag also an der Umgebung. Audio-Code wurde nicht geändert. |
| AK7 | **nicht erfüllt** | Lint, Typecheck, Unit-Tests (216/216), Build, knip und jscpd sind grün (Exit-Code 0). Baseline und `.jscpd.json` sind unverändert (zuletzt geändert in a80c6ad), Schwellwert 1,35, Ist 1,20 %. **Aber:** Der Style Guide widerspricht sich selbst, siehe Befund 2. |

**Blockierende Befunde**
- [x] **AK5 – Fokus-Outline der Abenteuer-Auswahl.** Sie liegt außerhalb ihrer Kachel auf dem Szenenbild unter `scrim` (`frontend/src/components/AdventureSelect.tsx:39-43`). Über einem hellen Bild erreicht `primary` in Tavern nur 2,5:1 statt 3:1, Dark 3,4:1 ist in Ordnung. Das ist neu durch DND-41 (vorher 4,7:1). Die Lösung aus E6 (Deckkraft der Rolle erhöhen) greift hier nicht. Möglicher Weg: die Outline nach innen legen, wie die Optionen der Liste (`AdventureSelect.tsx:119`, `outline-offset: -borderWidth.thick`). Auf der Kachel erreicht `primary` 3,1:1. Danach `contrast.md:85` und `docs/known-issues.md` anpassen.
- [x] **AK7 – Style Guide widerspricht sich.** `frontend/docs/design/contrast.md:83` führt `border` auf `secondaryTranslucent` als „bewusst ✗ beide“ (Tavern 2,8:1) und verweist auf die Ausnahmen in 2.6. Die Ausnahme in `frontend/DESIGN.md:312-314` deckt aber nur `border` im Dark-Theme und `border` auf `error` ab, nicht Tavern auf den durchscheinenden Kacheln. Die Ausnahme in 2.6 muss erweitert werden.

**Hinweise**
- `border` Tavern 2,8:1 unter „Rand ist Gestaltung“: inhaltlich vertretbar (Kacheln und Abenteuer-Auswahl erkennt man am Text, nicht am Rand); nur die Doku muss nachziehen (Befund 2).
- Links in den Notizen, Tavern 3,1:1 (vorher 3,3:1): bestehender offener Punkt, mehr Deckkraft behebt ihn nicht. Der Abschnitt „Offen“ in `frontend/DESIGN.md:315-317` nennt nur 3,3:1 und nicht die Fokus-Outline; beim Nacharbeiten mit erledigen.
- E2E erneut gelaufen: 19/20, gleicher Fehler in der Vorbedingung, Ursache Umgebung.
- Manuelle Prüfschritte: nur ein automatisierter Screenshot (Dark, dunkles Bild). Offen: Überblendung, „Bewegung reduzieren“, Admin ohne Szene, Tavern über hellem Bild (Plan-Schritte 2–4).
- Veralteter Kommentar `frontend/src/components/DocumentReader.tsx:47` („pages, which have the surface secondary“), nicht aus diesem Commit.
- Vermutung: Drittes Bild innerhalb von 600 ms → erstes verschwindet sofort, während das zweite einblendet (`loaded` überschreibt `leaving`), evtl. kurzes Flackern.
- Vermutung: Mitten in der Überblendung decken beide Ebenen nur ~75 % ab, Hintergrund wird kurz dunkler (rein optisch).
- Kacheln werden durchscheinend, sobald das Bild geladen ist, das Bild blendet aber erst über 600 ms ein; so lange liegt `secondaryTranslucent` über `background` (E5). Vorübergehend und eher besserer Kontrast.
- Rundung `contrast.md:85` Dark 3,36 als 3,3 eingetragen (sicher, gerundet 3,4).
- Kein `docs(DND-41): approve plan`-Commit; Plan kam mit dem Runden-Commit, Gesamtdiff ab 9651f31.
- Konventionen eingehalten (ein Commit, Typ `feat`, Schema, 5 Stichpunkte, keine KI-Signatur).

**Checks:** Lint, Typecheck, Unit-Tests 216/216, Build, knip, jscpd (1,20 % bei 1,35) grün. E2E 19/20; das eine Scenario scheitert an der Umgebung.

### Runde 2 – 2026-11-03
**Empfehlung:** Abnahme

Beide blockierenden Befunde aus Runde 1 sind behoben. Die Fokus-Outline der Abenteuer-Auswahl liegt jetzt nach innen versetzt auf der Kachel. In DESIGN.md 2.6 deckt die Ausnahme jetzt auch `border` auf `secondaryTranslucent` ab. Der Nacharbeit-Commit 2f49c0a ändert nur eine CSS-Zeile und zwei Kommentare, der Rest ist Doku. Alle statischen Checks sind grün. E2E steht bei 19/20; das eine Scenario scheitert wie in Runde 1 an der Umgebung.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | In Runde 2 nicht geändert; Beleg aus Runde 1 gilt (`SceneBackground.tsx`, `AdminScreen.tsx`). |
| AK2 | erfüllt | In Runde 2 nicht geändert; `$isTranslucent` am `Trigger` unverändert, nur `outline-offset` geändert. |
| AK3 | erfüllt | In Runde 2 nicht geändert; Unit-Tests (keine Szene, ladende Szene, fehlerhaftes Bild) grün (216/216). |
| AK4 | erfüllt (nur Code und Unit-Tests) | In Runde 2 nicht geändert; im Browser weiter nicht geprüft. |
| AK5 | erfüllt | `frontend/src/components/AdventureSelect.tsx:39-45`: `outline-offset: -${borderWidth.thick}`; Outline auf `secondaryTranslucent` (Dark 5,0, Tavern 3,1, Ziel 3,0), ohne Bild auf `secondary` 5,6 / 3,3 (`contrast.md:56`). Zeile „`primary` auf Szenenbild unter `scrim`“ und Eintrag in `docs/known-issues.md` entfernt. Links in den Notizen bleiben bestehender offener Punkt aus DND-40. |
| AK6 | erfüllt | E2E 19/20; „The first interaction makes an admin window the audio output“ scheitert in der Vorbedingung (`output_ready` schon vor dem Lauf true), Ursache Umgebung. |
| AK7 | erfüllt | Lint, Typecheck, Unit-Tests 216/216, Build, knip, jscpd (1,20 % bei 1,35) grün; Konfiguration und Baselines unverändert. Style Guide konsistent: `DESIGN.md:312-315` ↔ `contrast.md:82`, „Offen“ (`DESIGN.md:316-318`) ↔ `contrast.md:49,80`; `components.md` passt zum Code. |

**Blockierende Befunde**
- keine

**Hinweise**
- Anmerkung „Links in den Notizen“ in `contrast.md` (ca. Z. 104-106) nennt nur 3,3:1; die 3,1:1 stehen nur in Tabelle, DESIGN.md „Offen“ und known-issues – unvollständig, nicht widersprüchlich.
- Anmerkung „Fokus-Outline der Abenteuer-Auswahl“ (`contrast.md:121-123`) beschreibt den alten Zustand (2,5:1) als Begründung – vertretbar.
- Kommentare in `AdventureSelect.tsx:39-40` und `DocumentReader.tsx:47` konform.
- Weiter offen, nicht blockierend: manuelle Prüfschritte 2–4 (Überblendung, „Bewegung reduzieren“, Admin ohne Szene, Tavern über hellem Bild) und die beiden Vermutungen aus Runde 1.
- Kein `docs(DND-41): approve plan`-Commit; Gesamtdiff ab 9651f31.
- Konventionen eingehalten; nichts außerhalb des Scopes geändert.

**Checks:** Lint, Typecheck, Unit-Tests (216/216), Build, knip, jscpd grün. E2E 19/20; das eine Scenario scheitert an der Umgebung.
