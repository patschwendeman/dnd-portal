# Screens

Die App hat einen **Admin-Bereich** und einen **Spieler-Bereich** (Player Screen, Wall Screen, Ground Screen).

| Screen | Route | Gerät | Komponente |
|---|---|---|---|
| Admin | `/admin` | Rechner des Spielleiters | `src/screens/AdminScreen.tsx` |
| Player | `/` | Smartphone je Spieler | `src/screens/PlayerScreen.tsx` |
| Wall | `/wall` | Monitor (vertikal/Wand) | `src/screens/WallScreen.tsx` |
| Ground | `/ground` | Monitor liegend auf dem Tisch | `src/screens/GroundScreen.tsx` |

(Pfade relativ zu `frontend/`.)

---

## Admin Screen

### Soll
- Szenen auswählen und aktivieren.
- Notizen (Markdown) einsehen: Story, NPCs, Kämpfe.
- Musik ein- und ausschalten.
- Verschiedene Sounds abspielen.

### Ist
- **Layout** (seit DND-4 nach [frontend/DESIGN.md](../frontend/DESIGN.md)): Grid aus drei Zeilen –
  Top-Bar, Hauptbereich, Bottom-Bar. Der Hauptbereich hat drei Spalten: links die Notizen-Navigation, in der Mitte die
  Notizen, rechts die Karten „Aktive Szene“ und „Kampfszenen“. Schrift Inter (lokal über `@fontsource/inter`).
- **Szenenauswahl:** Karte „Kampfszenen“ rechts mit Anzahl und Kachelraster aller Kampfszenen (`MapOverview`,
  seit DND-5 zeilenweise sortiert, seit DND-9 mit `⌈√n⌉` Spalten für jede Anzahl n; die Auswahl läuft weiter über die
  Datenbank-ID), Bottom-Bar mittig mit dem Label „Szenen“ und den Nicht-Kampfszenen (`SideMaps`). Alle Kacheln 16:9, die aktive mit
  Outline in `primary`. Klick öffnet einen Bestätigungsdialog (`Dialogue`) mit Wall-Bild, Label „Szene wechseln“,
  Name, Beschreibung und den Buttons Decline (links) und Confirm (rechts); „Confirm“ setzt `activeSceneId` → alle
  Screens wechseln.
- **Szenen-Details:** `DetailsSideBar` ist die Karte „Aktive Szene“ mit Name und Beschreibung; die Zeilen „Enemies“
  und „Loot“ sind nur statische Labels mit dem Platzhalter „–“.
- **Notizen:** `DocumentReader` in der Mitte mit Label „Notizen“ und Tabs Main, Fight, Side, Leveling, Mechaniken
  (Quelle `public/story/{main,fight,noneFight,leveling,mechanics}/*.md`). Inhaltsverzeichnis-Links, Bilder öffnen in neuem Tab.
  Der Ordner `noneFight` existiert nicht → Tab „Side“ ist leer.
- **Musik:** Bottom-Bar links: Play/Pause-Button, daneben Label „Musik“ und der Titel des aktuellen Tracks (aus dem
  Dateinamen abgeleitet, `getMusicTitle`); spielt zufällige Tracks aus der Playlist der aktiven Szene (Lautstärke 0.1).
  Seit DND-10 hält `MusicPlayer` (`useMusicPlayer`) ein einziges Audio-Element; der angezeigte Titel ist immer der
  geladene Track. Szenenwechsel übernimmt die neue Playlist und wählt sofort einen anderen Track daraus – lief die
  Musik, spielt er direkt, sonst bleibt sie pausiert. Nach einem Trackende startet ein anderer Track derselben
  Playlist, bei nur einem Track derselbe von vorne; die Musik stoppt nur durch Pause. Bis die erste Szene geladen ist,
  ist ein Standard-Track die Playlist. Schlägt das Abspielen fehl (z. B. Autoplay-Sperre), bleibt der Button auf Play.
- **Sounds:** `TopBar` mit Titel „DnD Portal“ links und mittig den Buttons für Soundeffekte in Gruppen
  (Heilung/Trank, Buff, Zauber, Debuff, Lock), getrennt durch senkrechte Linien.
- Theme-Umschalter (Settings-Icon rechts in der Top-Bar).

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
- Layout (seit DND-7): oben links der Theme-Button, darunter eine Karte mit zwei Zeilen à vier Ressourcen-Buttons:
  Aktion · Bonusaktion · Bewegung · Spezial, darunter „Zauberplätze“ mit I–IV. Die Ressourcen sind Buttons und per
  Tastatur bedienbar (Bewegung nicht).
- Im Hochformat deckt ein „Handy drehen“-Overlay alles ab (Querformat erwartet), mit dem Hinweis „Bitte das Handy quer
  halten“. Bis DND-7 hing es an der Breite (unter 650px).
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
- **Layout** (seit DND-5 nach [frontend/DESIGN.md](../frontend/DESIGN.md)): Vollbild-Hintergrund =
  `graphics_wall.source` der aktiven Szene, unverzerrt und randlos (`object-fit: cover`). Schrift Inter.
- Overlay-Panel (`OverlayPanel`) oben mittig, 48px unter der Oberkante, höchstens 1440px breit und mit dem Monitor
  schrumpfend, mit Kopfzeile. Umschaltbar über die schwebende Steuerleiste (`ScreenControlBar`), die beim Hover
  mittig über der Unterkante erscheint (Buttons BATTLE/WORLD/OFF, der aktive in `primary`):
  - **BATTLE:** Kopfzeile „Kampfschauplätze“ mit Anzahl („25 Räume“), darunter die Kacheln aller Kampfszenen
    im Raster mit `⌈√n⌉` Spalten (bei 25 Szenen 5 × 5, eine unvollständige letzte Zeile linksbündig), zeilenweise
    sortiert und mit Raumnummer 1–n oben links (nicht die Datenbank-ID); bei Kampfszenen automatisch
    sichtbar.
  - **WORLD:** Kopfzeile „Weltkarte“, darunter die Weltkarte in 16:9 (statisches Bild
    `public/assets/images/ground_screen/mapOverview.jpg`, nicht aus dem Backend).
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
  Die Steuerleiste hat dieselbe schwebende Form wie auf der Wall (geteilte `ScreenControlBar`), auf dem Ground mit den
  Beschriftungen „Raster“ (vor den Buttons) und „Zelle“ (vor dem Slider). Der Slider ist schlank, ohne Punkte und
  ohne Tooltip und rastet in 10er-Schritten ein; rechts daneben steht der Wert fest als Zahl ohne Einheit (seit
  DND-6). Die Raster-Ebene lässt Mausereignisse durch. Standard: kein Grid. Einstellungen lokal, nicht gespeichert,
  gelten für alle Szenen gleich.
