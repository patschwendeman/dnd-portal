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
- **Speicherfehler:** Schlägt das Speichern von Szene, Abenteuer, Theme oder ein Musik-Befehl fehl, ändert sich auf keinem Screen etwas,
  und unter der Top-Bar erscheint die Hinweisleiste „Änderung konnte nicht gespeichert werden“; „Erneut versuchen“
  wiederholt den zuletzt fehlgeschlagenen Schreibzugriff, bei Erfolg verschwindet sie.
- **Verbindung:** Bricht die Verbindung zum Server ab (spätestens nach etwa 35 s ohne Nachricht erkannt), zeigt der
  Admin die Hinweisleiste „Verbindung zum Server getrennt“ und behält den letzten Stand; er verbindet sich selbst neu
  (1 s, 2 s, 4 s … höchstens 10 s), „Erneut versuchen“ verbindet sofort. Danach verschwindet die Leiste.
- **Szenen-Details:** Karte „Aktive Szene“ mit Name und Beschreibung, ohne aktive Szene der Hinweis „Keine Szene
  aktiv“; „Enemies“ und „Loot“ sind nur Platzhalter („–“).
- **Notizen:** Bereich „Notizen“ mit Tabs Main, Fight, Side, Leveling, Mechaniken (Markdown aus
  `public/story/`); Inhaltsverzeichnis-Links, Bilder öffnen in neuem Tab. Tab „Side“ ist leer (Ordner fehlt).
- **Musik (Fernbedienung):** Der Admin spielt selbst nichts ab; Musik und Soundeffekte kommen aus der Wall, die
  Audioausgabe ist (siehe Wall Screen). Bottom-Bar links Play/Pause, „Musik“ mit dem Titel des aktuellen
  Tracks und ein Lautstärke-Slider (gesendet beim Loslassen). Die Anzeige folgt dem Zustand auf dem
  Server, auch für mehrere Admin-Fenster. Der Server spielt zufällige Tracks aus der Playlist der aktiven Szene; nach
  einem Trackende folgt ein anderer Track (bei nur einem derselbe von vorne), die Musik stoppt nur durch Pause. Beim
  Szenenwechsel wechselt sofort der Track – lief die Musik, spielt er direkt weiter, sonst bleibt sie pausiert. Ohne
  aktive Szene ist die Standardmusik die Playlist. Ist keine Wall Ausgabe, steht unter dem Titel „Keine Audioausgabe
  bereit“; die Befehle ändern trotzdem den Zustand, und eine Wall, die Ausgabe wird, setzt damit ein. Nach einem
  API-Neustart ist die Musik pausiert. Fehler bei Musik-Befehlen zeigt die Hinweisleiste „Änderung konnte nicht
  gespeichert werden“.
- **Sounds:** Top-Bar mittig mit Buttons für Soundeffekte in Gruppen (Heilung/Trank, Buff, Zauber, Debuff, Lock); die
  Wall, die Audioausgabe ist, spielt sie über der Musik. Ohne Ausgabe passiert nichts (kein Fehler), Fehler beim Senden
  werden nur geloggt.
- Theme-Umschalter (Settings-Icon rechts in der Top-Bar): schaltet das Theme global für Admin, Wall, Ground und die
  Player Screens um (außer auf Smartphones, deren Spieler lokal ein anderes Theme gewählt hat).
- **Spieler verbinden:** Ein Button mit Handy-Icon rechts in der Top-Bar öffnet einen Dialog mit dem QR-Code der
  Player-URL (dunkel auf hellem Grund, unabhängig vom Theme) und der URL als Text; die Spieler scannen ihn mit der
  Smartphone-Kamera. Die URL kommt vom Start-Skript (`dnd prod`: `http://<IP>:8080/`) bzw. ist der Origin des Admins,
  wenn dieser über die IP geöffnet ist; sonst zeigt der Dialog „Player-URL unbekannt – Spieltisch mit „dnd prod“
  starten oder den Admin über die IP des Rechners öffnen“. Schließen per Button, Escape oder Klick außerhalb.
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
- **Theme:** Der Player Screen ist per WebSocket mit dem Spieltisch verbunden und folgt dessen Theme ohne Reload
  (Abenteuer, Szene und Musik zeigt er nicht an, einen Verbindungsstatus auch nicht). Der Settings-Button oben links
  öffnet ein Menü „Wie Spieltisch“ (Standard), „Dunkel“, „Taverne“; die Wahl gilt nur auf diesem Gerät (auch nach einem
  Reload) und bleibt bei Theme-Wechseln im Admin bestehen. Nach dem Entsperren des Smartphones verbindet er sich sofort
  neu.
- Layout: oben links der Settings-Button mit dem Theme-Menü, darunter eine Karte mit Aktion · Bonusaktion · Bewegung · Spezial und darunter
  „Zauberplätze“ mit I–IV. Die Ressourcen sind per Tastatur bedienbar (Bewegung nicht).
- Im Hochformat verdeckt ein Hinweis „Bitte das Handy quer halten“ den Screen.
- Ressourcen nur lokal: nicht gespeichert, nicht mit dem Admin synchronisiert, Reload setzt zurück; nicht pro Charakter
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
- **AUDIO:** Button in derselben Steuerleiste; ein Klick macht diese Wall zur Audioausgabe für Musik und Soundeffekte
  (die Nutzerinteraktion gibt die Wiedergabe im Browser frei). Er ist hervorgehoben, solange die Wall Ausgabe ist.
  Es spielt immer nur eine Wall: Klickt man auf einer anderen Wall „AUDIO“, verstummt die bisherige. Die Ausgabe folgt
  der Fernbedienung im Admin (Play/Pause, Lautstärke, Sounds bei voller Lautstärke über der Musik) und meldet
  das Trackende an den Server; sonst zeigt die Wall nichts an. Nach einem Verbindungsabbruch meldet sie sich ohne
  neuen Klick wieder als Ausgabe. Blockiert der Browser das Abspielen, loggt sie den Fehler; ein erneuter Klick auf
  „AUDIO“ versucht es wieder.
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
