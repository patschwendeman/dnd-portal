# DND-38: Dashboard-Layout „Bühne“ im Admin

**Typ:** feat
**Status:** Fertig

## Kontext & Ziel

Das Dashboard rechts im Admin (DND-33 bis DND-37) wirkt monoton und verschenkt Platz. Ein starres Raster aus 4 Spalten
gibt jeder Zeile mindestens 144 px, egal wie viel Inhalt ein Panel hat. Alle acht Panels sehen gleich aus, und das
Level steht doppelt. Die Hero-Karten der Spieler füllen allein fast einen Bildschirm. Der Spielleiter bekommt jetzt
das Layout „A · Bühne“ aus dem Mockup
[admin-dashboard.html](../../frontend/docs/design/mockup/admin-dashboard.html) (Tab „A · Bühne“). Oben steht, was die
Spieler gerade sehen und hören, darunter die Technik des Spieltischs, unten die Party. Am Spieltisch erkennt der
Spielleiter so mit einem Blick die aktive Szene und die laufende Musik, ohne zu scrollen.

## Scope / Non-Goals

**Im Scope**
- Dashboard als eine Spalte mit vier Panels: Bühne, Audio, Spieltisch, Party.
- Breite des Dashboards mit Obergrenze (E2).
- Neue bzw. umgebaute Bausteine: Bühne, Segment-Control, Spieltisch-Zeile, Spielerzeile.
- Panel „Level“ entfällt, das Level steht im Kopf von „Party“.
- Doku (Style Guide, Screens, Layouts) an das neue Dashboard anpassen.

**Nicht im Scope**
- Varianten B (Bento) und C (Cockpit), Kombinationen und ein Umschalter zwischen Layouts: späterer, eigener Task (E1).
- Neue Funktionen: Alles, was das Dashboard heute kann, bleibt erhalten, es kommt nichts hinzu.
- Backend, API und WebSocket-Nachrichten.
- Änderungen an Wall, Ground und Player.

## Entscheidungen

### E1: Variante A zuerst, weitere Varianten später
- **Entscheidung:** DND-38 setzt nur „A · Bühne“ aus dem Mockup um, mit den Änderungen aus E3 bis E7. Die Panels
  werden als eigenständige Komponenten geschnitten, damit ein späterer Task sie in anderen Layouts (B, C,
  Kombinationen) als wählbare Option wiederverwenden kann.
- **Verworfene Alternativen:** Umschalter zwischen A und dem heutigen Raster schon in diesem Task.
- **Begründung:** Der Spielleiter möchte mit A starten. Die Wahl zwischen Layouts ist ein eigenes Feature.

### E2: Breite des Dashboards
- **Ist (berechnet aus `AdminScreen.tsx:53-108`):** Notizen `2fr`, Dashboard `minmax(400px, 1fr)`, dazu Rand 2 ×
  `space.5` und Abstand `space.5`. Für den Inhalt eines Panels bleibt jeweils 48 px weniger.

  | Browserfenster | Panel neben der Navigationsleiste offen | Panel zu |
  |---|---|---|
  | 1280 px | 400 px (Minimum) | 400 px |
  | 1440 px | 400 px (Minimum) | ≈ 435 px |
  | 1920 px | ≈ 515 px | ≈ 595 px |
  | 2560 px | ≈ 728 px | ≈ 808 px |

- **Entscheidung:** Das Dashboard bleibt ein Drittel der Breite, mindestens 400 px (`DASHBOARD_MIN_WIDTH`), neu
  höchstens 560 px (`DASHBOARD_MAX_WIDTH`). Die Notizen bekommen den Rest. Ausgeblendet nehmen die Notizen wie
  bisher die volle Breite.
- **Verworfene Alternativen:** Breite wie heute ohne Obergrenze; feste 480 px.
- **Begründung:** Ohne Obergrenze würde die Bühne auf großen Monitoren riesig und schöbe Audio aus dem sichtbaren
  Bereich. Mit Deckel bleibt die Höhe planbar, und die Notizen gewinnen Platz.

### E3: Panel „Bühne“ (aktive Szene)
- **Entscheidung:**
  - Das Wall-Bild läuft über die volle Breite des Panels (16:9, `object-fit: cover`, ohne Innenabstand).
  - Das Ground-Bild steht als kleines Inset oben rechts, etwa ein Drittel der Breite. Beide Bilder tragen ein
    kleines Label („Wall“, „Ground“).
  - Über dem unteren Teil des Wall-Bilds liegt eine Verlaufsfläche mit dem Label „Aktive Szene“, dem Szenennamen und
    der Beschreibung.
  - Langer Text wird nie abgeschnitten. Bild und Text liegen in derselben Grid-Zelle, die Zelle ist mindestens 16:9
    hoch und wächst mit dem Text.
  - Für Verlauf und Text auf dem Bild gibt es zwei neue Farbrollen, z. B. `scrim` und `onScrim`. Sie haben in beiden
    Themes denselben Wert, weil sie auf beliebigen Bildern lesbar sein müssen (wie `error`).
  - Ohne Bild bleibt die jeweilige Fläche in `background` leer. Ohne aktive Szene zeigt das Panel wie bisher
    „Keine Szene aktiv“.
- **Begründung:** Die Szene ist das Wichtigste am Tisch und bekommt deshalb das meiste Gewicht. Das Inset spart die
  zweite Vorschau nebeneinander.

### E4: Panel „Audio“ ohne „Hier abspielen“
- **Entscheidung:**
  - Musik und Sounds stehen in einem Panel „Audio“.
  - Zeile 1: Play/Pause-Button, daneben der Titel. Darunter steht der Zustand („Läuft“ bzw. „Pausiert“). Ist
    keine Ausgabe bereit, steht dort stattdessen „Keine Audioausgabe bereit“ (`music-no-output`).
  - Zeile 2: Lautstärke als waagerechter Slider mit Lautsprecher-Icon und Zahlenwert. Gespeichert wird beim
    Loslassen, wie bisher.
  - Nach einer Trennlinie folgen die Sound-Gruppen. Jede Gruppe ist eine Fläche in `background`, die Buttons darin
    haben keine eigene Fläche.
  - Einen Button „Hier abspielen“ gibt es nicht. Seit DND-37 wird das Admin-Fenster bei der ersten Interaktion
    automatisch Audioausgabe (`useAutoAudioOutput`).
- **Verworfene Alternativen:** Button aus dem Mockup übernehmen.
- **Begründung:** Der Button ist seit DND-37 entfernt. Das Mockup zeigte ihn noch.

### E5: Panel „Spieltisch“ (statt Wall-Overlay, Ground-Raster, Screens)
- **Entscheidung:** Eine Zeile je Screen mit drei Spalten: Name mit Status, Steuerung, Icon-Button.
  - **Wall:** Status-Punkt mit Statustext, Segment-Control „Weltkarte“/„Aus“, Button „In neuem Fenster öffnen“.
  - **Ground:** Status-Punkt mit Statustext, Segment-Control „Schwarz“/„Weiß“/„Aus“, Button „In neuem Fenster
    öffnen“. Darunter eine Zeile „Zellgröße“ mit Slider (100–200, Schritt 10, gespeichert beim Loslassen) und
    Zahlenwert.
  - **Spieler:** Statustext aus `playerStatusText`, als Text in der Mitte „Spieler QR-Code“ (statt „Handys per
    QR-Code verbinden“ aus dem Mockup), Button „QR-Code“ öffnet den Dialog „Spieler verbinden“.
  - Die Zeilen sind durch Linien in `border` getrennt.
  - Das Segment-Control ersetzt das Aussehen von `OptionButtons`: eine Fläche in `background` mit Innenabstand
    `space.1`, darin die Buttons ohne eigene Fläche, aktiv in `primary`. Verhalten und Test-IDs bleiben.
- **Begründung:** Was zu einem Screen gehört, steht bei diesem Screen. Drei Panels mit wenig Inhalt werden zu einem.

### E6: Panel „Party“
- **Entscheidung:**
  - Im Kopf stehen links das Label „Party“ mit der Anzahl der Spieler, rechts der Level-Stepper (Label „Level“,
    „−“, Zahl, „+“). Er verhält sich wie das bisherige Panel „Level“: Grenzen 1–20, deaktiviert an der Grenze,
    keine lokale Vorwegnahme.
  - Die Spieler stehen **immer in einer Spalte**, ein Eintrag je Zeile, auch bei 560 px.
  - Ein Eintrag ist die neue Komponente Spielerzeile (z. B. `PlayerListItem`) nach dem vorhandenen Mockup
    [player-card-compact.html](../../frontend/docs/design/mockup/player-card-compact.html):
    - Avatar 40 × 40 px (Bild oder Initialen über `characterInitials`).
    - Daneben der Charaktername, darunter „Rasse · Klasse · Spieler“.
    - Fläche in `background`.
    - Abweichungen vom Mockup: kein Level-Chip je Zeile (das Level steht einmal im Kopf) und keine hervorgehobene
      Zeile (es gibt keine Auswahl).
  - Ohne Spieler zeigt das Panel „Keine Spieler“. Ohne Abenteuer zeigt der Stepper „–“ und beide Buttons sind
    deaktiviert.
  - Das Panel „Level“ entfällt.
- **Verworfene Alternativen:** zwei Spalten wie im Mockup; Kachel aus player-card-tile.html (zu hoch für eine Liste).
- **Begründung:** Eine Spalte liest sich am Tisch schneller. Das kompakte Mockup passt fast unverändert.

### E7: Hero-Karte bleibt im Code
- **Entscheidung:** `PlayerHeroCard` wird im Dashboard nicht mehr verwendet, bleibt aber im Code für spätere
  wählbare Layouts (E1). `knip.jsonc` bekommt dafür einen eigenen, kommentierten Eintrag außerhalb der Baseline, mit
  der Begründung „reserviert für wählbare Dashboard-Layouts“. Das ist bewusst keine Baseline-Ausnahme.
- **Verworfene Alternativen:** entfernen und bei Bedarf aus Git holen; nur als Mockup sichern.
- **Begründung:** Wunsch des Spielleiters. Die Ausnahme ist dokumentiert und fällt mit dem Varianten-Task weg.

### E8: Aufbau des Dashboards
- **Entscheidung:**
  - Das Dashboard ist eine Spalte mit `gap` `space.4`, von oben: Bühne, Audio, Spieltisch, Party.
  - Raster, `DASHBOARD_COLUMNS`, `DASHBOARD_ROW_HEIGHT` und `columns`/`rows` in `DashboardItem` entfallen.
  - Die Panels sind so hoch wie ihr Inhalt. Das Dashboard scrollt bei Überlänge weiter als Ganzes.
  - `DashboardPanel` bleibt der Rahmen für Audio, Spieltisch und Party. Die Bühne hat keinen Innenabstand und kein
    eigenes Label über dem Bild.
  - Panel-IDs: `dashboard-panel-stage`, `-audio`, `-table`, `-party`.
  - Alle bisherigen Test-IDs der Bedienelemente bleiben erhalten: `music-toggle`, `music-track`,
    `music-no-output`, `sound-*`, `wall-overlay-*`, `ground-grid-*`, `screen-*`, `join-button`, `level-*`,
    `player-*` sowie `active-scene-*` und `no-active-scene`.
- **Begründung:** Inhalt bestimmt die Höhe. Gleiche Test-IDs halten die Änderungen an den E2E-Tests klein.

## Subtasks

### Frontend
- [x] `AdminScreen.tsx`: Dashboard-Spalte nach E2 begrenzen (`DASHBOARD_MAX_WIDTH`), Panels nach E8 zusammenstellen,
      Panel „Level“ entfernen
- [x] `Dashboard.tsx` / `DashboardPanel.tsx`: eine Spalte statt Raster, `columns`/`rows` entfernen
- [x] Bühne: `ActiveScenePanel` nach E3 umbauen; Farbrollen `scrim`/`onScrim` in `darkTheme.ts`, `tavernTheme.ts`
      und `styled.d.ts` ergänzen
- [x] Audio: `MusicControl` (waagerechter Slider, Zustandszeile) und `SoundBoard` (Gruppenflächen) nach E4 in einem
      Panel
- [x] Spieltisch: neue Komponente aus `ScreensPanel`, `WallOverlayPanel` und `GroundGridPanel` nach E5;
      `OptionButtons` als Segment-Control
- [x] Party: `PlayersPanel` mit neuer Komponente `PlayerListItem` und Level-Stepper aus `LevelPanel` im Kopf nach E6
- [x] `knip.jsonc`: kommentierter Eintrag für `PlayerHeroCard` nach E7; nicht mehr benötigte Komponenten entfernen
      (z. B. `LevelPanel`, falls aufgegangen)
- [x] BDD: `adminDashboard.feature`, `adminPlayers.feature`, `wallOverlay.feature`, `groundGrid.feature` und Steps an
      die neuen Panels anpassen; Szenarien für Party in einer Spalte und Level im Kopf

### Doku
- [x] `frontend/DESIGN.md`: Rollen `scrim`/`onScrim`, Abstände, Schrift-Hierarchie, Radien und Zustände für Bühne,
      Segment-Control, Spielerzeile, Level-Stepper; Panel „Level“ und Raster streichen
- [x] `frontend/docs/design/components.md`: Dashboard-Panel, Bühne, Segment-Control, Spieltisch-Zeile, Spielerzeile;
      Hero-Karte als „derzeit nicht verwendet“ markieren
- [x] `frontend/docs/design/screen-layouts.md`: Admin-Layout und Layout-Konstanten (neu `DASHBOARD_MAX_WIDTH`,
      entfallen `DASHBOARD_COLUMNS`/`DASHBOARD_ROW_HEIGHT`)
- [x] `frontend/docs/design/contrast.md`: Messwerte für `onScrim` auf `scrim`
- [x] `docs/screens.md` (Ist-Stand Admin), `frontend/CLAUDE.md` (Komponentenliste), ggf. `docs/known-issues.md`

## Akzeptanzkriterien

### AK1: Aufbau des Dashboards
- **Given** der Admin mit aktivem Abenteuer und aktiver Szene, Dashboard eingeblendet
- **When** der Spielleiter auf das Dashboard schaut
- **Then** sieht er von oben die Panels Bühne, Audio, Spieltisch und Party in einer Spalte, jedes so hoch wie sein
  Inhalt, und es gibt kein Panel „Level“

### AK2: Breite
- **Given** ein Browserfenster von 1920 px mit offenem Panel neben der Navigationsleiste
- **When** der Admin das Dashboard zeigt
- **Then** ist das Dashboard etwa 515 px breit; bei 2560 px höchstens 560 px, bei 1280 px mindestens 400 px

### AK3: Bühne
- **Given** eine aktive Szene mit Wall- und Ground-Bild
- **When** der Spielleiter die Bühne ansieht
- **Then** sieht er das Wall-Bild über die volle Breite, das Ground-Bild als Inset und Namen und Beschreibung der
  Szene lesbar auf dem Bild; eine lange Beschreibung wird nicht abgeschnitten, das Panel wird höher

### AK4: Bühne ohne Szene
- **Given** keine aktive Szene
- **Then** zeigt die Bühne „Keine Szene aktiv“

### AK5: Audio ohne Ausgabe-Button
- **Given** das Panel „Audio“
- **When** der Spielleiter Play drückt, die Lautstärke verschiebt und einen Sound auslöst
- **Then** reagiert die Musik bzw. der Sound wie bisher, und es gibt keinen Button „Hier abspielen“; solange kein
  Admin Ausgabe ist, steht „Keine Audioausgabe bereit“ unter dem Titel

### AK6: Spieltisch
- **Given** das Panel „Spieltisch“
- **When** der Spielleiter das Wall-Overlay umschaltet, das Ground-Raster und die Zellgröße ändert, einen Screen in
  neuem Fenster öffnet und auf den QR-Button klickt
- **Then** wirkt jede Aktion wie bisher; die Zeile „Spieler“ zeigt den Verbindungsstatus und den Text
  „Spieler QR-Code“, der Klick öffnet den Dialog „Spieler verbinden“

### AK7: Party in einer Spalte
- **Given** ein Abenteuer mit vier Spielern
- **When** der Spielleiter die Party ansieht
- **Then** steht jeder Spieler in einer eigenen Zeile mit Avatar, Charaktername und „Rasse · Klasse · Spieler“,
  auch bei 560 px Breite nie zwei nebeneinander

### AK8: Level im Kopf der Party
- **Given** Level 20
- **When** der Spielleiter „+“ im Kopf der Party drückt
- **Then** bleibt das Level 20 und „+“ ist deaktiviert; „−“ senkt es auf 19 (nach dem Push des Servers)

### AK9: Themes
- **Given** Theme Dark bzw. Tavern
- **Then** nutzen alle Panels nur Farbrollen, und Text auf der Bühne erreicht auf dem Verlauf mindestens 4,5:1

### AK10: Qualität
- Lint, Typecheck, Unit-Tests, `check:deadcode` und `check:dupes` sind grün; der jscpd-Schwellwert wird nicht
  angehoben.

## Teststrategie / Verifikation

**Automatisch**
- Frontend (Unit): Tests für reine Hilfsfunktionen, falls neue entstehen (z. B. Meta-Zeile der Spielerzeile).
- Frontend (BDD): Szenarien aus AK1 und AK5 bis AK8 in den betroffenen Features; bestehende Szenarien bleiben
  inhaltlich, nur Panel-IDs ändern sich.

**Manuell**
1. Admin bei 1280, 1920 und 2560 px Fensterbreite öffnen, jeweils mit offenem und geschlossenem Panel; die Breite
   des Dashboards prüfen (AK2).
2. Szene mit langer Beschreibung aktivieren; der Text ist vollständig lesbar (AK3).
3. Admin neu laden: Hinweis „Keine Audioausgabe bereit“, nach dem ersten Klick verschwindet er (AK5).
4. Alle Steuerungen im Spieltisch bedienen und Wall bzw. Ground beobachten (AK6).
5. Theme auf Tavern umstellen und alle Panels ansehen (AK9).

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-11-01
**Empfehlung:** Nacharbeiten (ein kleiner blockierender Befund: Kommentar-Konvention; fachlich sind alle AKs erfüllt)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `Dashboard.tsx:9-13` einspaltig; `AdminScreen.tsx:473-498` Reihenfolge Bühne, Audio, Spieltisch, Party; `LevelPanel.tsx` gelöscht; E2E prüft Reihenfolge der `aria-label`s, kein `dashboard-panel-level`, volle Breite, Höhe = Inhalt. |
| AK2 | erfüllt | `AdminScreen.tsx:56,101-106` `clamp(400px, (100% − space.5)/3, 560px)`; gemessen 1280 → 400, 1440 → 400, 1920 → 514,66, 2560 → 560; E2E grün. |
| AK3 | erfüllt | `ActiveScenePanel.tsx`: Wall-Bild `cover`, Ground-Inset `calc(100% / 3)`, Caption auf `scrim`, Mindesthöhe 16:9; lange Beschreibung: Bühne wächst 246 → 586 px, Text nicht abgeschnitten, beginnt unter dem Inset. |
| AK4 | erfüllt | `ActiveScenePanel.tsx:116-121` „Keine Szene aktiv“ (`no-active-scene`). |
| AK5 | erfüllt | `MusicControl.tsx`: Zustandszeile, waagerechter Slider mit Icon und Wert, Speichern bei `onChangeCommitted`, kein „Hier abspielen“; E2E grün. |
| AK6 | erfüllt | `GameTablePanel.tsx`: Segment-Controls (Test-IDs unverändert), Status und „Spieler QR-Code“; E2E grün; „In neuem Fenster öffnen“ manuell in Chrome geprüft. |
| AK7 | erfüllt | `PlayersPanel.tsx`/`PlayerListItem.tsx`: Liste, Avatar 40 px, Meta-Zeile; bei 2560 px einspaltig (4 Zeilen, Breite 508). |
| AK8 | erfüllt | `LevelStepper.tsx` im Kopf der Party; E2E „Level nicht über 20“ und zwei Fenster grün. |
| AK9 | erfüllt | Keine hart codierten Farben; `scrim`/`onScrim` in beiden Themes gleich, Kontrast 10,37:1. |
| AK10 | erfüllt | Lint, Typecheck, Unit (199), `check:deadcode`, `check:dupes` (1,29 % < 1,35 %), Build grün. |

**Blockierende Befunde**
- [x] Neue Kommentare, die nur JSX/CSS nacherzählen (Konvention „keine code-erklärenden Kommentare“):
  - `frontend/src/components/PlayerListItem.tsx:66-67`
  - `frontend/src/components/AudioPanel.tsx:28`
  - `frontend/src/components/GameTablePanel.tsx:224-225`
  - `frontend/src/components/OptionButtons.tsx:6` und zweiter Satz in `:17`
  - `frontend/src/components/ActiveScenePanel.tsx:54`, Teil „About a third of the stage“

**Hinweise**
- Statustexte in `text.color` statt `text.muted`: nachgerechnet (Tavern 3,92:1 < 4,5), sinnvoll und dokumentiert.
- Zugänglicher Name „Aktive Szene“ statt „Bühne“: entspricht sichtbarem Label, unbedenklich.
- Segment-Buttons `flex: 1 1 auto`: keine Abschneidung bei 400/515/560 px.
- Neue Test-IDs `music-volume-value`/`music-state` kommen nur hinzu; `player-level` entfällt laut E6.
- Layout-Konstanten und Doku-/Kommentar-Anpassungen (`domain.md`, `architecture.md`, `sounds.ts`, `screenStatus.ts`) folgen aus E4–E6 bzw. dem Doku-Subtask.
- `OptionButtons` hat `role="group"` ohne zugänglichen Namen; ein `aria-label` wäre eine kleine Verbesserung.

**Checks:** Lint, Typecheck, Unit (199), Build, `check:deadcode`, `check:dupes` grün; E2E `adminDashboard`, `adminPlayers`, `groundGrid`, `wallOverlay`, `selectScene` (15 Tests) grün; Messungen in headless Chrome.

### Runde 2 – 2026-11-01
**Empfehlung:** Abnahme

| AK | Ergebnis | Beleg (Delta zu Runde 1) |
|---|---|---|
| AK1–AK5, AK7–AK9 | erfüllt (wie Runde 1) | `60c7602` entfernt hier nur Kommentare; E2E `adminDashboard`, `adminPlayers`, `selectScene` grün. |
| AK6 | erfüllt | `GameTablePanel.tsx:254,268` übergibt `label="Wall-Anzeige"`/`"Ground-Anzeige"`; Test-IDs und `onChange` unverändert; E2E `wallOverlay`, `groundGrid` grün. |
| AK10 | erfüllt | Lint, Typecheck, Unit (199), `check:deadcode`, `check:dupes` (1,29 % < 1,35 %) grün; `.jscpd.json` unverändert. |

**Blockierende Befunde**
- keine (Kommentar-Befund aus Runde 1 an allen sechs Stellen behoben)

**Hinweise**
- Neue Pflicht-Prop `label` an `OptionButtons` landet als `aria-label` auf `role="group"`; sauber. `frontend/docs/design/components.md:136` nennt den zugänglichen Namen noch nicht – Ergänzung wäre stimmig. Kein E2E prüft das `aria-label` (optional).
- Keine neuen code-nacherzählenden Kommentare mehr. Zwei ältere Kopfkommentare im alten Muster (`PlayersPanel.tsx`, `SoundBoard.tsx`) bestanden schon vor dem Task, nicht blockierend.
- Kommentare in E2E-Steps (`adminPlayers.ts`) begründen Selektoren/Assertions; unbedenklich.
- Commit `60c7602`: Schema und Typ passen, 2 Stichpunkte, keine KI-Signatur.

**Checks:** Lint, Typecheck, Unit (23 Dateien, 199 Tests), knip, jscpd, Build grün; E2E gegen laufenden Dev-Stack: 6 Suites, 18 Tests grün.
