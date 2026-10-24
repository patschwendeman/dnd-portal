# DND-34: Panels „Spieler“ (Hero-Karte) und „Level“ im Admin-Dashboard

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Das Datenmodell kennt Spieler mit Charakter (`Player`: Spieler- und Charaktername, Volk, Klasse, optional Avatar)
und ein Level für alle Spieler eines Abenteuers (`Adventure.global_level`), der Admin zeigt beides bisher nirgends.
Dieser Task baut die Hero-Karte aus dem Mockup als Komponente und ergänzt das Dashboard aus DND-33 um ein Panel
„Spieler“ mit einer Hero-Karte je Spieler und ein kleines Panel „Level“, in dem der Spielleiter das Level ändert. Am
Spieltisch sieht er die Gruppe auf einen Blick und hebt nach einem Level-Up das Level für alle an.

## Scope / Non-Goals

**Im Scope**
- Komponente Hero-Karte nach `frontend/docs/design/mockup/player-card-hero.html`, ohne Effektzeile.
- Panel „Spieler“ mit den Spielern des aktiven Abenteuers.
- Panel „Level“: `global_level` anzeigen und ändern.

**Nicht im Scope**
- Effekte (Segen, Vergiftet … mit Runden) – eigener Task zusammen mit „Kampf“.
- Spieler anlegen, bearbeiten, löschen; Avatare hochladen.
- Level pro Spieler; Anzeige der Spieler auf Wall, Ground oder Player Screen.
- Varianten „kompakt“ und „Kachel“ aus den Mockups.
- Zuordnung eines Player Screens (Smartphone) zu einem Spieler.

## Entscheidungen

### E1: Hero-Karte ohne Effekte
- **Entscheidung:** Neue Komponente (z. B. `PlayerHeroCard`) wie die Mockup-Variante „ohne Effekte“: Avatar (Bild
  aus `avatar` über `mediaUrl`, sonst Initialen des Charakternamens), Level-Badge oben links am Avatar, darüber der
  Spielername als Label, Charaktername groß, Chips für Volk und Klasse. Farben aus den Theme-Rollen (Dark und
  Tavern wie im Mockup), keine Hex-Werte im Code; Größen aus den Tokens, fehlende Tokens werden ergänzt und in
  DESIGN.md dokumentiert.
- **Verworfene Alternativen:** kompakte Liste; Liste plus Hero-Karte für den Gewählten; Effekte mit neuem
  Datenmodell in diesem Task.
- **Begründung:** Wunsch des Spielleiters; Effekte brauchen ein eigenes Datenmodell und gehören zum Kampf.

### E2: Panel „Spieler“
- **Entscheidung:** Panel 4 Spalten breit unter „Sounds“/„Screens“ (DND-33 E2), Label „Spieler“, die Hero-Karten
  untereinander in der Reihenfolge der API (`AdventureDetail.players`). Die Höhe ergibt sich aus der Zahl der Spieler
  (Zeilen-Span je Karte); das Dashboard scrollt wie in DND-33 E1. Ohne Abenteuer oder ohne Spieler der Hinweis
  „Keine Spieler“. Ladefehler zeigt die Hinweisleiste „Backend nicht erreichbar“ wie die übrigen Ladevorgänge.
- **Begründung:** Platz für 4–6 Spieler mit großer Karte.

### E3: Panel „Level“
- **Entscheidung:** Eigenes kleines Panel mit Label „Level“, der Zahl und den Buttons „−“ und „+“ (Grenzen 1–20, an
  der Grenze deaktiviert). Ein Klick speichert per `PATCH /adventures/{id} {"global_level": n}` ohne lokale
  Vorwegnahme; Fehler zeigen die Speicherfehler-Leiste mit „Erneut versuchen“ (bestehendes `runSave`). Das Level-Badge
  jeder Hero-Karte zeigt dasselbe Level.
- **Verworfene Alternativen:** −/+ im Kopf des Panels „Spieler“.
- **Position:** Panel 4x1 (4 Spalten breit, eine Zeile hoch) direkt über „Spieler“; „Sounds“/„Screens“ bleiben
  unverändert.
- **Begründung:** Wunsch des Spielleiters.

### E4: Neuer Stand nach dem Speichern
- **Entscheidung:** `GameTableState` enthält `global_level` nicht. Der Admin lädt `GET /adventures/{id}` (Spieler
  und Level) beim Laden, bei einem Abenteuerwechsel und nach jedem `state`-Push neu, den der Server nach
  `PATCH /adventures/{id}` ohnehin schickt; so folgen auch andere Admin-Fenster. Veraltete Antworten verwirft
  `loadLatest`.
- **Verworfene Alternativen:** `global_level` in `GameTableState` aufnehmen (Vertragsänderung für alle Screens);
  Antwort des PATCH direkt übernehmen (andere Admins blieben veraltet).
- **Begründung:** Kein neuer Vertrag, gleiches Muster wie die übrigen Ladevorgänge.

## Subtasks

### Frontend
- [x] Service-Funktionen für `GET /adventures/{id}` (falls nicht vorhanden) und `PATCH` mit `global_level`.
- [x] `PlayerHeroCard` (E1), ggf. neue Tokens.
- [x] Panel „Spieler“ (E2) und Panel „Level“ (E3) im Dashboard; Laden nach E4.
- [x] Unit: Initialen aus dem Charakternamen; Grenzen 1–20 (falls als Funktion ausgelagert).
- [x] E2E: Spieler aus dem Seed werden angezeigt; Level erhöhen und verringern, Badge folgt.

### Doku
- [x] `docs/screens.md` (Admin Ist), `frontend/docs/design/components.md` (Hero-Karte, Panel „Level“),
      `screen-layouts.md` (Raster), `contrast.md` (Badge, Chips in beiden Themes), `frontend/CLAUDE.md`.

## Akzeptanzkriterien

### AK1: Spieler anzeigen
- **Given** ein Abenteuer mit Spielern ist aktiv (Seed: Aragorn, Legolas, Gimli, Gandalf)
- **Then** zeigt das Panel „Spieler“ je Spieler eine Hero-Karte mit Spielername, Charaktername, Volk, Klasse,
  Avatar bzw. Initialen und Level-Badge
- **Given** das aktive Abenteuer hat keine Spieler
- **Then** steht dort „Keine Spieler“

### AK2: Level ändern
- **Given** das Level ist 1
- **Then** zeigt das Panel „Level“ 1, „−“ ist deaktiviert
- **When** der Spielleiter auf „+“ klickt
- **Then** zeigen Panel und alle Level-Badges 2, auch in einem zweiten Admin-Fenster
- **And** bei Level 20 ist „+“ deaktiviert

### AK3: Speicherfehler
- **Given** das Backend lehnt das Speichern ab oder ist nicht erreichbar
- **When** der Spielleiter das Level ändert
- **Then** bleibt das angezeigte Level unverändert, und die Leiste „Änderung konnte nicht gespeichert werden“
  erscheint

### AK4: Abenteuerwechsel und Themes
- **When** der Spielleiter das Abenteuer wechselt
- **Then** zeigen „Spieler“ und „Level“ die Daten des neuen Abenteuers
- **And** die Hero-Karte ist in Dark und Tavern lesbar (Kontraste nach `contrast.md`)

## Teststrategie / Verifikation

**Automatisch**
- Frontend Unit und BDD wie in den Subtasks; Lint, Typecheck, Build grün. Backend unverändert.

**Manuell**
1. Admin mit Seed öffnen: vier Hero-Karten, beide Themes (AK1, AK4).
2. Level −/+, Grenzen, zweites Admin-Fenster (AK2); Backend stoppen und Level ändern (AK3).

## Offene Fragen
- Keine (Position „Level“ in E3 und E4 vom User bestätigt).

## Review
