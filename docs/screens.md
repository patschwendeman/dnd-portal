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
- **Layout** (nach [frontend/DESIGN.md](../frontend/DESIGN.md)): Top-Bar, Hauptbereich, Bottom-Bar. Im Hauptbereich
  links die Notizen-Navigation, in der Mitte die Notizen, rechts die Karten „Aktive Szene“ und „Kampfszenen“.
- **Abenteuer-Auswahl:** Links in der Top-Bar eine Auswahlliste (Button mit aufklappender Liste, per Maus und Tastatur
  bedienbar) mit allen Abenteuern. Ist auf dem Spieltisch (Server) kein Abenteuer aktiv, wird automatisch das erste
  aktiviert (mit nur einem Abenteuer also ohne Zutun); ohne Abenteuer ist die Auswahl leer und deaktiviert, es werden
  keine Szenen geladen. Gezeigt werden nur die Szenen des aktiven Abenteuers. Ein Wechsel wird gespeichert und gilt für
  alle Spieltisch-Screens; Admin, Wall und Ground zeigen danach direkt die im neuen Abenteuer gespeicherte Szene (bzw.
  keine), nie kurz die eines anderen Abenteuers.
- **Szenenauswahl:** Karte „Kampfszenen“ mit Anzahl und quadratisch angeordnetem Kachelraster aller Kampfszenen des
  Abenteuers, Bottom-Bar mittig mit den Nicht-Kampfszenen („Szenen“). Die aktive Kachel ist hervorgehoben. Klick öffnet einen
  Bestätigungsdialog „Szene wechseln“ mit Wall-Bild, Name und Beschreibung; „Confirm“ speichert die Szene, und alle
  verbundenen Screens (auch andere Admin-Fenster) wechseln, sobald der Server den neuen Stand schickt; „Decline“ bricht
  ab.
- **Zustand auf dem Server:** Abenteuer, aktive Szene und Theme stehen auf dem Server und gelten für alle
  Spieltisch-Screens, auch in anderen Browsern oder auf anderen Geräten; sie überstehen Reloads und Neustarts der API.
  Mehrere Admin-Fenster dürfen gleichzeitig schreiben, der letzte Schreibzugriff gewinnt.
- **Speicherfehler:** Schlägt das Speichern von Szene, Abenteuer oder Theme fehl, ändert sich auf keinem Screen etwas,
  und unter der Top-Bar erscheint die Hinweisleiste „Änderung konnte nicht gespeichert werden“; „Erneut versuchen“
  wiederholt den zuletzt fehlgeschlagenen Schreibzugriff, bei Erfolg verschwindet sie.
- **Verbindung:** Bricht die Verbindung zum Server ab (spätestens nach etwa 35 s ohne Nachricht erkannt), zeigt der
  Admin die Hinweisleiste „Verbindung zum Server getrennt“ und behält den letzten Stand; er verbindet sich selbst neu
  (1 s, 2 s, 4 s … höchstens 10 s), „Erneut versuchen“ verbindet sofort. Danach verschwindet die Leiste.
- **Szenen-Details:** Karte „Aktive Szene“ mit Name und Beschreibung, ohne aktive Szene der Hinweis „Keine Szene
  aktiv“; „Enemies“ und „Loot“ sind nur Platzhalter („–“).
- **Notizen:** Bereich „Notizen“ mit Tabs Main, Fight, Side, Leveling, Mechaniken (Markdown aus
  `public/story/`); Inhaltsverzeichnis-Links, Bilder öffnen in neuem Tab. Tab „Side“ ist leer (Ordner fehlt).
- **Musik:** Bottom-Bar links Play/Pause, daneben „Musik“ und der Titel des laufenden Tracks. Spielt zufällige
  Tracks aus der Playlist der aktiven Szene; nach einem Trackende folgt ein anderer Track (bei nur einem derselbe von
  vorne), die Musik stoppt nur durch Pause. Beim Szenenwechsel wechselt sofort der Track – lief die Musik, spielt er
  direkt weiter, sonst bleibt sie pausiert. Vor dem Laden der ersten Szene und ohne aktive Szene läuft ein Standard-Track. Blockiert der
  Browser das Abspielen (Autoplay-Sperre), bleibt der Button auf Play.
- **Sounds:** Top-Bar mittig mit Buttons für Soundeffekte in Gruppen (Heilung/Trank, Buff, Zauber, Debuff, Lock).
- Theme-Umschalter (Settings-Icon rechts in der Top-Bar): schaltet das Theme global für Admin, Wall und Ground um
  (nicht für den Player Screen).
- **Ladefehler:** Lassen sich Abenteuer oder Szenen nicht laden (Backend nicht erreichbar, Timeout, HTTP-Fehler), erscheint unter der
  Top-Bar die Hinweisleiste „Backend nicht erreichbar“ mit Button „Erneut versuchen“; bei Erfolg verschwindet sie.
  Keine automatischen Wiederholungen. Kann eine Notizdatei nicht geladen werden, zeigt der Notizbereich „Notizen
  konnten nicht geladen werden“; ein Tab-Wechsel lädt erneut.

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

### Ist
- **Aktion / Bonusaktion:** Antippen schaltet zwischen 1 und 0.
- **Zauberplätze I–IV:** feste Maxima (I: 4, II: 3, III: 3, IV: 2); Antippen verringert um 1, bei 0 zurück auf das
  Maximum.
- **Spezial:** 3 Plätze, Startwert 1; Verhalten wie Zauberplätze.
- **Bewegung (WIP):** fester Wert 9.5, nicht interaktiv.
- Layout: oben links der Theme-Button (wirkt nur lokal auf diesem Gerät, gespeichert im `localStorage`; unabhängig vom
  Theme des Spieltischs), darunter eine Karte mit Aktion · Bonusaktion · Bewegung · Spezial und darunter
  „Zauberplätze“ mit I–IV. Die Ressourcen sind per Tastatur bedienbar (Bewegung nicht).
- Im Hochformat verdeckt ein Hinweis „Bitte das Handy quer halten“ den Screen.
- Werte nur lokal: nicht gespeichert, nicht mit Admin verbunden, Reload setzt zurück; nicht pro Charakter
  konfigurierbar.

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
- **Layout** (nach [frontend/DESIGN.md](../frontend/DESIGN.md)): Vollbild-Hintergrund = Wall-Bild der aktiven Szene,
  unverzerrt und randlos. Ohne aktive Szene (auch bis der Server den ersten Stand geschickt hat) nur die
  Hintergrundfarbe des Themes, ohne Bild und ohne Panel; die Steuerleiste funktioniert weiter.
- Folgt dem Spieltisch per WebSocket (aktive Szene, Abenteuer, Theme) und kann damit auch in einem anderen Browser oder
  auf einem anderen Gerät laufen (`http://<IP>:8080/wall`). Nach einem Verbindungsabbruch behält sie das Bild ohne
  Hinweis und verbindet sich selbst neu.
- Overlay-Panel oben mittig, umschaltbar über eine Steuerleiste, die beim Hover am unteren Rand erscheint (BATTLE /
  WORLD / OFF):
  - **BATTLE:** „Kampfschauplätze“ mit Anzahl („25 Räume“) und den Kacheln aller Kampfszenen des im Admin gewählten
    Abenteuers im quadratischen Raster,
    nummeriert mit Raumnummer 1–n; bei Kampfszenen automatisch sichtbar.
  - **WORLD:** „Weltkarte“ mit einer fest eingebundenen Weltkarte (nicht aus dem Backend).
  - **OFF:** Overlay ausgeblendet.
- Eine szenen-/gebietsspezifische Übersichtskarte gibt es noch nicht; die „Übersicht“ ist das Raster der Kampfszenen.
- **Ladefehler:** kein Hinweis für die Spieler; die Wall behält den zuletzt geladenen Stand, der nächste
  Szenenwechsel lädt erneut.

---

## Ground Screen

### Soll
Die Oberfläche der Welt als **digitales Spielbrett**. Bei einer Kampfszene wird der Kampfschauplatz angezeigt,
optional mit **Grid** als Layout für taktische Kämpfe.

### Ist
- Vollbild = Ground-Bild der aktiven Szene; Bild oder Video (läuft automatisch, in Schleife, stumm). Ohne aktive
  Szene nur die Hintergrundfarbe des Themes.
- Grid über eine Steuerleiste beim Hover (wie auf der Wall): „Raster“ BLACK / WHITE / OFF und „Zelle“ mit Slider für
  die Zellgröße samt angezeigtem Wert. Standard: kein Grid. Einstellungen gelten für alle Szenen und werden nicht
  gespeichert.
- Verbindung wie auf der Wall: folgt dem Spieltisch per WebSocket, auch auf einem anderen Gerät; nach einem Abbruch
  kein Hinweis, letzter Stand bleibt, Reconnect automatisch.
- **Ladefehler:** wie auf der Wall – kein Hinweis, letzter Stand bleibt, der nächste Szenenwechsel lädt erneut.
