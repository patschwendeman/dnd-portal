# DND-41: Szenenbild als Hintergrund im Admin, durchscheinende Kacheln

**Typ:** feat
**Status:** Im Review

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
