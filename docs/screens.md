# Screens

Die App hat einen **Admin-Bereich** und einen **Spieler-Bereich** (Player Screen, Wall Screen, Ground Screen).

| Screen | Route | Gerät | Komponente |
|---|---|---|---|
| Admin | `/admin` | Rechner des Spielleiters | `src/sceens/AdminScreen.tsx` |
| Player | `/` | Smartphone je Spieler | `src/sceens/players/DnDScreen.tsx` |
| Wall | `/wall` | Monitor (vertikal/Wand) | `src/sceens/WallScreen.tsx` |
| Ground | `/ground` | Monitor liegend auf dem Tisch | `src/sceens/GroundScreen.tsx` |

(Pfade relativ zu `frontend/`. Der Ordner heißt tatsächlich `sceens`.)

---

## Admin Screen

### Soll
- Szenen auswählen und aktivieren.
- Notizen (Markdown) einsehen: Story, NPCs, Kämpfe.
- Musik ein- und ausschalten.
- Verschiedene Sounds abspielen.

### Ist
- **Szenenauswahl:** Rechte Sidebar mit Kachelraster aller Kampfszenen (`MapOverview`), untere Leiste mit den
  Nicht-Kampfszenen (`SideMaps`). Klick öffnet einen Bestätigungsdialog (`Dialogue`) mit Wall-Bild und Name;
  „Confirm“ setzt `activeSceneId` → alle Screens wechseln.
- **Szenen-Details:** `DetailsSideBar` zeigt Name und Beschreibung; „Enemies:“ und „Loot:“ sind nur statische Labels.
- **Notizen:** `DocumentReader` in der Mitte mit Tabs Main, Fight, Side, Leveling, Mechaniken
  (Quelle `public/story/{main,fight,noneFight,leveling,mechanics}/*.md`). Inhaltsverzeichnis-Links, Bilder öffnen in neuem Tab.
  Der Ordner `noneFight` existiert nicht → Tab „Side“ ist leer.
- **Musik:** Play/Pause-Button; spielt zufällige Tracks aus der Playlist der aktiven Szene (Lautstärke 0.1).
- **Sounds:** `TopBar` mit Buttons für Soundeffekte (Heilung/Trank, Buff, Zauber, Debuff, Lock).
- Theme-Umschalter (Settings-Icon).

---

## Player Screen

### Soll
Mobile-optimierter Screen, jeder Spieler hat ihn auf dem Smartphone vor sich. Zeigt die **Ressourcen** des Charakters:
- Aktion
- Bonusaktion
- Zauberplätze Stufe 1–4
- eine Spezial-Ressource

Nach Verbrauch einer Ressource tippt der Spieler auf das Icon → Zähler sinkt, Icon wird optisch deaktiviert.
Nach dem Refresh (neue Runde) wird die Ressource durch erneutes Antippen wieder aktiviert.

*Beispiel:* 1 Aktion + 1 Bonusaktion aktiv → Spieler greift an (kostet 1 Aktion) → tippt auf „Aktion“ →
Zähler 0, Icon deaktiviert → nächste Runde: erneut tippen → wieder aktiv.

### Ist (`src/components/ResourceBarPlayer.tsx`)
- **Aktion / Bonusaktion:** Toggle 1 ↔ 0.
- **Zauberplätze I–IV:** Maxima fest im Code (`SpellMax = {1:4, 2:3, 3:3, 4:2}`); Tippen verringert um 1, bei 0 Reset auf Max.
- **Spezial:** 3 Plätze, Startwert 1; gleiches Verhalten wie Zauberplätze.
- **Bewegung (WIP):** fest `9.5`, nicht interaktiv.
- Unter 650 px Breite erscheint ein „Handy drehen“-Overlay (Querformat erwartet).
- State nur lokal (`useState`): nicht gespeichert, nicht mit Backend/Admin verbunden; Reload setzt zurück.
  Werte sind nicht pro Charakter konfigurierbar.

### Geparkt: `/spells`
Unfertige Variante mit Zauberleiste (`SpellBarPlayer`: 20 Platzhalter-Icons, fester Text „Rage“) und Karussell
(`SliderPlayer`: 3 Platzhalter-Karten) plus `ResourceBarPlayer`. Aktuell keine Priorität: aus `development`
entfernt und auf dem Branch `feature/spells-screen` geparkt (siehe CONTRIBUTING.md, „Branches“).

---

## Wall Screen

### Soll
Atmosphäre: Hintergrundbild abhängig von der aktiven Szene (z. B. Dungeon bei Kampf, Shop-Inneres bei Shop-Szene).
Zusätzlich als Overlay: Weltkarte oder Übersichtskarte des aktuellen Gebiets.

### Ist
- Vollbild-Hintergrund = `graphics_wall.source` der aktiven Szene.
- Overlays (1200×700, zentriert), per Hover-Button-Leiste (`ScreenControlBar`) umschaltbar:
  - **BATTLE:** Kachel-Übersicht aller Kampfszenen mit Nummern; bei Kampfszenen automatisch sichtbar.
  - **WORLD:** Weltkarte (statisches Bild `public/assets/images/ground_screen/mapOverview.jpg`, nicht aus dem Backend).
  - **OFF:** beide ausblenden.
- Eine szenen-/gebietsspezifische Übersichtskarte gibt es noch nicht; die „Übersicht“ ist das Raster der Kampfszenen.

---

## Ground Screen

### Soll
Die Oberfläche der Welt als **digitales Spielbrett**. Bei einer Kampfszene wird der Kampfschauplatz angezeigt,
optional mit **Grid** als Layout für taktische Kämpfe.

### Ist
- Vollbild-Medium = `graphics_ground.source` der aktiven Szene; Bild (`.jpg/.jpeg/.png`) oder Video
  (`.mp4/.webm/.mkv`, autoplay, loop, stumm) je nach Dateiendung.
- `GridOverlay` mit Hover-Steuerung: Farbe BLACK / WHITE / OFF, Slider für Zellgröße (100–200).
  Standard: kein Grid. Einstellungen lokal, nicht gespeichert, gelten für alle Szenen gleich.
