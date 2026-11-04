# DND-44: Menüpunkt „Einstellungen“ im Admin Screen

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Einiges im Admin stellt der Spielleiter einmal ein und fasst es danach kaum noch an: Abenteuer, Theme und die
Zellgröße des Ground-Rasters (sie hängt vom Ground-Monitor und den Figuren ab). Heute liegen diese Dinge zwischen
den Steuerelementen fürs Spiel: Abenteuer-Auswahl links und Theme-Umschalter rechts in der Kopfzeile, die Zellgröße
im Dashboard-Panel „Spieltisch“. Zudem geht die Zellgröße bei jedem Neustart der API verloren. Dieser Task bündelt
alles in einem neuen Menüpunkt „Einstellungen“ ganz unten in der Navigationsleiste; sein Panel neben der Leiste
zeigt die Einstellungen. Die Zellgröße wird gespeichert. Kopfzeile und Dashboard werden ruhiger und enthalten nur
noch, was man im Spiel braucht.

## Scope / Non-Goals

**Im Scope**
- Menüpunkt „Einstellungen“ (Zahnrad) unten in der Navigationsleiste, abgesetzt von Notizen, Szenen und Kampf.
- Panel „Einstellungen“ mit den Abschnitten „Abenteuer“, „Darstellung“ (Theme) und „Ground-Raster“ (Zellgröße).
- Abenteuer-Auswahl aus der Kopfzeile ins Panel; in der Kopfzeile steht stattdessen der Name des aktiven Abenteuers.
- Settings-Button (Zahnrad, Theme-Umschalter) samt Kachel oben rechts in der Kopfzeile entfernen; das Theme wird im
  Panel aus einer Auswahlliste gewählt.
- Zellgröße aus dem Panel „Spieltisch“ ins Panel „Einstellungen“; sie wird in der Datenbank gespeichert.

**Nicht im Scope**
- Rasterfarbe bzw. Raster an/aus: das Segment „Schwarz/Weiß/Aus“ bleibt im Panel „Spieltisch“ und bleibt
  flüchtig (nach einem Neustart der API „Aus“).
- Wall-Overlay, Vollbild- und Dashboard-Button: bleiben, wo sie sind.
- Theme-Menü des Player Screens (Theme je Gerät): unverändert.
- Weitere Einstellungen (z. B. Dashboard-Layout, Hintergrundbild, Musik-Defaults).
- Zellgröße je Abenteuer: sie gilt global für den Spieltisch.
- Bestätigungsdialog beim Abenteuerwechsel (gibt es heute nicht, bleibt so).

## Entscheidungen

### E1: Nur die Zellgröße zieht um
- **Entscheidung:** Ins Panel „Einstellungen“ kommt vom Ground-Raster nur der Slider „Zellgröße“ (100–200, 10er
  Schritte, gespeichert beim Loslassen, Verhalten wie heute). Das Segment „Schwarz/Weiß/Aus“ bleibt in der Zeile
  „Ground“ des Panels „Spieltisch“; die Zeile „Zellgröße“ darunter entfällt dort.
- **Verworfene Alternativen:** Farbe und Zellgröße in die Einstellungen, im Dashboard nur An/Aus (dafür müsste das
  Server-Modell Farbe und An/Aus trennen); alles in die Einstellungen (Raster an/aus wird im Spiel gebraucht).
- **Begründung:** Die Zellgröße stellt man einmal ein, das Raster schaltet man während des Spiels. Ohne Umbau des
  Server-Modells.

### E2: Zellgröße in der Datenbank
- **Entscheidung:** Migration `0008` ergänzt `game_table` um `ground_grid_cell_size` (int, NOT NULL, Default 100,
  CHECK 100–200 und Vielfaches von 10). `GameTableState.ground_grid_cell_size` und `PATCH /table` behalten Namen,
  Form und Validierung; der Wert kommt nur aus der Datenbank statt aus `GroundGridState`. `ground_grid` (die Farbe)
  bleibt im Speicher.
- **Verworfene Alternativen:** weiter nur im Speicher (nach jedem Neustart neu einstellen).
- **Begründung:** Eine Einstellung, die man einmal setzt, muss einen Neustart überstehen; `game_table` hält schon
  das Theme.

### E3: Kopfzeile zeigt den Abenteuernamen
- **Entscheidung:** Links in der Kopfzeile steht in derselben Kachel und Größe wie bisher die Auswahl der Name des
  aktiven Abenteuers, nur zur Anzeige (kein Button, kein Pfeil, kein Schloss). Ohne Abenteuer steht dort
  „Kein Abenteuer“. Die Hinweisleiste ersetzt den Namen wie bisher die Auswahl. Das Zahnrad rechts in der
  Kopfzeile (Theme-Umschalter) entfällt samt seiner Kachel; „Vollbild“ und „Dashboard“ bleiben.
- **Verworfene Alternativen:** Auswahl zusätzlich oben lassen (doppelt); Kopfzeile links leer.
- **Begründung:** Man sieht weiter auf einen Blick, welches Abenteuer läuft.

### E4: Theme per Auswahlliste
- **Entscheidung:** Im Abschnitt „Darstellung“ eine Auswahlliste (wie die Abenteuer-Auswahl: Klick öffnet die
  Liste, per Maus und Tastatur bedienbar) mit „Dunkel“ und „Taverne“; gewählt ist das Theme des Spieltischs.
  Eine Wahl speichert es auf dem Server und gilt wie bisher für Admin, Wall, Ground und die Player Screens
  (außer bei Spielern mit eigenem Theme). Die Wahl des aktiven Themes tut nichts.
- **Verworfene Alternativen:** Segment-Control „Dunkel/Taverne“.
- **Begründung:** Wunsch des Users; eine Liste lässt Platz für weitere Themes.

### E5: Abenteuer-Auswahl im Panel
- **Entscheidung:** Im Abschnitt „Abenteuer“ die bestehende Abenteuer-Auswahl als Auswahlliste über die Breite des
  Panels, mit unverändertem Verhalten (automatische Aktivierung des ersten Abenteuers, leer und deaktiviert ohne
  Abenteuer, gesperrt im Kampf mit Schloss und Tooltip „Während des Kampfes nicht wechselbar“). Solange die
  Hinweisleiste steht, ist die Auswahl deaktiviert (heute ist sie dann ausgeblendet; „kein Abenteuerwechsel,
  solange sie steht“ bleibt so erhalten).
- **Begründung:** Gleiches Verhalten, nur an anderer Stelle.

### E6: Menüpunkt unten in der Leiste
- **Entscheidung:** Der Menüpunkt „Einstellungen“ verhält sich wie die anderen (Panel öffnen, wechseln, per Klick
  auf den aktiven einklappen; nicht gespeichert), sitzt aber am unteren Ende der Navigationsleiste. Das Panel ist
  240px breit wie „Notizen“ und „Szenen“. Abschnitte mit Label wie die Liste im Panel „Szenen“.
- **Begründung:** Selten gebraucht, darum abgesetzt von den Menüpunkten fürs Spiel.

## Subtasks

### Vertrag
- [x] `GameTableState` und `PATCH /table` bleiben in Form und Validierung gleich; `openapi.json` und
      `frontend/src/api/schema.d.ts` nur neu erzeugen, falls sich Docstrings ändern.

### Backend
- [x] Migration `0008`: Spalte `game_table.ground_grid_cell_size` mit Default 100 und CHECK (100–200, Vielfaches
      von 10); Model `GameTable` ergänzen.
- [x] `app/services/game_table.py`: Zellgröße aus `game_table` lesen und dort schreiben; `GroundGridState` hält
      nur noch die Farbe (`reset()` in `tests/conftest.py` entsprechend).
- [x] Docstrings in `app/schemas/game_table.py` und `app/realtime/ground_grid.py` anpassen.
- [x] Tests: Zellgröße übersteht einen „Neustart“ (neuer Speicherzustand, gleiche Datenbank); Farbe weiterhin
      „Aus“ nach Neustart; Validierung unverändert.

### Frontend
- [x] `NavRail`: Einträge am unteren Ende (z. B. `placement: 'bottom'` am Item); Menüpunkt „Einstellungen“ mit
      `settings.svg` in `AdminScreen`.
- [x] Neues Panel `SettingsPanel` mit den Abschnitten „Abenteuer“, „Darstellung“, „Ground-Raster“.
- [x] `AdventureSelect` im Panel nutzbar machen (Breite des Panels, deaktiviert bei Hinweisleiste).
- [x] Theme-Auswahlliste (gemeinsame Listbox-Logik mit `AdventureSelect`/`ThemeMenu` nutzen, wo sinnvoll).
- [x] `CellSizeControl` aus `GameTablePanel` ins `SettingsPanel` verschieben.
- [x] `AdminHeader`: Abenteuername statt Auswahl, Theme-Kachel entfernen.
- [x] Unit- und BDD-Tests anpassen bzw. ergänzen (Header, Spieltisch, neues Panel).

### Doku
- [x] `docs/screens.md` (Admin: Navigationsleiste, Kopfzeile, Abenteuer-Auswahl, Theme, Ground-Raster, neuer
      Punkt „Einstellungen“, Zustand auf dem Server), `docs/architecture.md` (Ground-Raster teils persistent),
      `docs/known-issues.md` (Zellgröße nicht mehr flüchtig).

## Akzeptanzkriterien

### AK1: Menüpunkt öffnet die Einstellungen
- **Given** der Admin ist geöffnet
- **When** der Spielleiter auf das Zahnrad ganz unten in der Navigationsleiste klickt
- **Then** ist „Einstellungen“ hervorgehoben und das Panel daneben zeigt die Abschnitte „Abenteuer“,
  „Darstellung“ und „Ground-Raster“; die Mitte zeigt weiter die Notizen
- **And** ein weiterer Klick klappt das Panel ein, ein Klick auf einen anderen Menüpunkt wechselt das Panel

### AK2: Abenteuer wechseln
- **Given** zwei Abenteuer, kein Kampf, das Panel „Einstellungen“ ist offen
- **When** der Spielleiter in „Abenteuer“ das andere Abenteuer wählt
- **Then** wechseln alle Spieltisch-Screens wie bisher, und die Kopfzeile zeigt den Namen des neuen Abenteuers

### AK3: Abenteuer im Kampf gesperrt
- **Given** ein Kampf läuft
- **When** der Spielleiter die Abenteuer-Auswahl im Panel anklickt
- **Then** öffnet sich keine Liste; sie zeigt Schloss und Tooltip „Während des Kampfes nicht wechselbar“

### AK4: Kopfzeile ohne Auswahl und ohne Zahnrad
- **Given** der Admin ist geöffnet
- **Then** steht links in der Kopfzeile der Name des aktiven Abenteuers (nicht klickbar, „Kein Abenteuer“ ohne
  Abenteuer), rechts nur die Kachel mit „Vollbild“ und „Dashboard“
- **And** bei einem Fehler ersetzt die Hinweisleiste den Namen, die Abenteuer-Auswahl im Panel ist deaktiviert

### AK5: Theme wählen
- **Given** das Theme ist „Dunkel“
- **When** der Spielleiter in „Darstellung“ die Liste öffnet und „Taverne“ wählt
- **Then** wechseln Admin, Wall, Ground und Player Screens ohne eigenes Theme auf Taverne, die Liste zeigt
  „Taverne“ als gewählt; auch per Tastatur (Pfeiltasten, Enter, Escape) bedienbar

### AK6: Zellgröße in den Einstellungen
- **Given** das Panel „Einstellungen“ ist offen
- **When** der Spielleiter den Slider „Zellgröße“ auf 150 zieht und loslässt
- **Then** zeigen alle Grounds das Raster mit Zellgröße 150 (sofern das Raster an ist)
- **And** das Panel „Spieltisch“ zeigt beim Ground nur noch das Segment „Schwarz/Weiß/Aus“, keine Zellgröße

### AK7: Zellgröße übersteht einen Neustart
- **Given** Zellgröße 150 und Raster „Weiß“
- **When** die API neu startet
- **Then** ist die Zellgröße weiter 150, das Raster „Aus“

## Teststrategie / Verifikation

**Automatisch**
- Backend: Migration, Lesen/Schreiben der Zellgröße über `PATCH /table` und WebSocket, Persistenz über einen
  zurückgesetzten Speicherzustand hinweg, Validierung (422) wie bisher.
- Frontend (Unit / BDD): NavRail mit unterem Eintrag, SettingsPanel (Abenteuer, Theme, Zellgröße),
  AdminHeader mit Name und ohne Theme-Kachel, GameTablePanel ohne Zellgröße; bestehende BDD-Szenarien zu
  Abenteuer-Auswahl, Theme und Raster auf den neuen Ort umstellen.

**Manuell**
1. Admin öffnen, „Einstellungen“ öffnen, Abenteuer wechseln: Kopfzeile und Wall/Ground folgen.
2. Theme in der Liste wechseln: Admin, Wall, Ground, Player folgen.
3. Zellgröße ändern, Ground prüfen; API neu starten: Zellgröße bleibt, Raster ist aus.
4. Kampf starten: Abenteuer-Auswahl gesperrt.
5. Mit Hintergrundbild (durchscheinende Kacheln) und in beiden Themes ansehen, Kontrast prüfen.

## Offene Fragen
- keine

## Review
