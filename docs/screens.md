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
- Szenen auswählen und aktivieren. Alle Szenen sind gleich; einen Kampf startet der Spielleiter in jeder Szene über
  den Menüpunkt „Kampf“ (geplant).
- Notizen (Markdown) einsehen: Story, NPCs, Kämpfe.
- Navigationsleiste links mit Menüpunkten, die das Panel daneben füllen: „Notizen“ und „Szenen“ (umgesetzt), geplant
  „Kampf“ (Kampf starten). Die Mitte zeigt dabei weiter die Notizen.
- Musik ein- und ausschalten.
- Verschiedene Sounds abspielen.
- Dashboard rechts neben den Notizen: festes Raster aus Panels, in dem alles gebündelt ist, was der Spielleiter während
  des Spiels steuert (umgesetzt: „Aktive Szene“, „Musik“, „Wall-Overlay“, „Sounds“, „Screens“, „Level“, „Spieler“).

### Ist
- **Layout** (nach [frontend/DESIGN.md](../frontend/DESIGN.md)): Top-Bar und Hauptbereich, keine Bottom-Bar. Im
  Hauptbereich ganz links die Navigationsleiste, daneben das Panel des aktiven Menüpunkts (beide bündig zwischen Top-Bar
  und unterem Rand), in der Mitte die Notizen (etwa zwei Drittel), rechts das Dashboard (etwa ein Drittel, mindestens
  400px). Die Mitte der Top-Bar ist leer.
- **Dashboard:** Raster mit vier Spalten und einer Mindest-Zeilenhöhe; die Panels haben feste Größe und Position (kein
  Verschieben): oben „Aktive Szene“ über die volle Breite (2 Zeilen), darunter links „Musik“ (2 Spalten, 2 Zeilen),
  rechts daneben „Wall-Overlay“ (2 Spalten, 1 Zeile) und darunter „Sounds“ (2 Spalten, 2 Zeilen; links unter „Musik“
  bleibt eine Lücke von einer Zeile), darunter „Screens“ über die volle Breite (2 Zeilen), darunter „Level“ über die volle Breite
  (1 Zeile) und „Spieler“ über die volle Breite (eine Zeile je Spieler). Braucht der Inhalt eines Panels mehr Platz
  (schmales Fenster), wird seine Zeile höher – die Panels scrollen nicht für sich und schneiden keinen Text ab; ist das
  Raster höher als der Hauptbereich, scrollt das Dashboard als Ganzes. Der Icon-Button „Dashboard“ rechts
  in der Top-Bar (links vom Theme-Umschalter, hervorgehoben solange das Dashboard offen ist) blendet es aus – die Notizen
  nehmen dann die volle Breite, Musik, Wall-Overlay, Sounds, Level und QR-Code sind nicht erreichbar – und wieder ein. Auswahl und
  Scrollposition der Notizen bleiben erhalten; der Zustand wird nicht gespeichert, nach einem Reload ist das Dashboard
  offen.
- **Navigationsleiste:** schmale Leiste mit Icon-Buttons „Notizen“ und darunter „Szenen“ (Tooltip mit dem Namen);
  beim Laden ist „Notizen“ aktiv und hervorgehoben. Klick (oder Enter/Leertaste) auf einen anderen Menüpunkt wechselt
  das Panel, die Mitte zeigt dabei weiter die Notizen. Klick auf den aktiven Menüpunkt klappt das Panel ein,
  die Notizen werden breiter und kein Menüpunkt ist hervorgehoben; ein weiterer Klick klappt es wieder aus. Auswahl und
  Scrollposition der Notizen bleiben dabei erhalten. Menüpunkt und Einklapp-Zustand werden nicht gespeichert, nach
  einem Reload ist „Notizen“ wieder offen.
- **Abenteuer-Auswahl:** Links in der Top-Bar eine Auswahlliste (Button mit aufklappender Liste, per Maus und Tastatur
  bedienbar) mit allen Abenteuern. Ist auf dem Spieltisch (Server) kein Abenteuer aktiv, wird automatisch das erste
  aktiviert (mit nur einem Abenteuer also ohne Zutun); ohne Abenteuer ist die Auswahl leer und deaktiviert, es werden
  keine Szenen geladen. Gezeigt werden nur die Szenen des aktiven Abenteuers. Ein Wechsel wird gespeichert und gilt für
  alle Spieltisch-Screens; Admin, Wall und Ground zeigen danach direkt die im neuen Abenteuer gespeicherte Szene (bzw.
  keine), nie kurz die eines anderen Abenteuers.
- **Szenenauswahl:** Das Panel „Szenen“ listet unter dem Label „Szenen“ alle Szenen des aktiven Abenteuers in der
  Reihenfolge, in der sie angelegt sind (Seed: Default, Shop, Tavern, Level Up, Fight 1 … Fight 25), nur mit Namen;
  zu lange Namen enden mit „…“, der volle Name steht im Tooltip. Die aktive Szene ist hervorgehoben. Die Einträge sind
  per Tab erreichbar, Enter/Leertaste wirken wie ein Klick. Klick auf eine andere Szene öffnet einen
  Bestätigungsdialog „Szene wechseln“ mit Wall-Bild, Name und Beschreibung; „Confirm“ speichert die Szene, und alle
  verbundenen Screens (auch andere Admin-Fenster) wechseln, sobald der Server den neuen Stand schickt; „Decline“ bricht
  ab. Klick auf die bereits aktive Szene tut nichts. Ohne Abenteuer oder ohne Szenen steht dort „Keine Szenen“.
- **Wall-Overlay:** Das Panel „Wall-Overlay“ hat zwei Umschalt-Buttons „Weltkarte“ und „Aus“ (umbrechend, wenn das
  Panel zu schmal ist); hervorgehoben (`aria-pressed`) ist der Zustand, den der Server zuletzt geschickt hat. Ein Klick
  auf den anderen Button speichert ihn, alle Walls blenden die Weltkarte ein bzw. aus, sobald der Server den neuen
  Stand schickt; ein Klick auf den hervorgehobenen tut nichts. Ein Szenen- oder Abenteuerwechsel schaltet auf „Aus“.
- **Zustand auf dem Server:** Abenteuer, aktive Szene und Theme stehen auf dem Server und gelten für alle
  Spieltisch-Screens, auch in anderen Browsern oder auf anderen Geräten; sie überstehen Reloads und Neustarts der API.
  Das Wall-Overlay steht ebenfalls auf dem Server, aber nur im Speicher: Reloads übersteht es, nach einem Neustart der
  API ist es „Aus“.
  Mehrere Admin-Fenster dürfen gleichzeitig schreiben, der letzte Schreibzugriff gewinnt.
- **Speicherfehler:** Schlägt das Speichern von Szene, Abenteuer, Theme, Level, Wall-Overlay oder ein Musik-Befehl fehl, ändert sich auf keinem Screen etwas,
  und unter der Top-Bar erscheint die Hinweisleiste „Änderung konnte nicht gespeichert werden“; „Erneut versuchen“
  wiederholt den zuletzt fehlgeschlagenen Schreibzugriff, bei Erfolg verschwindet sie.
- **Verbindung:** Bricht die Verbindung zum Server ab (spätestens nach etwa 35 s ohne Nachricht erkannt), zeigt der
  Admin die Hinweisleiste „Verbindung zum Server getrennt“ und behält den letzten Stand; er verbindet sich selbst neu
  (1 s, 2 s, 4 s … höchstens 10 s), „Erneut versuchen“ verbindet sofort. Danach verschwindet die Leiste.
- **Aktive Szene:** Panel mit den Vorschaubildern „Wall“ und „Ground“ der aktiven Szene nebeneinander, darunter Name
  und Beschreibung (umbrechend, nie gekürzt; bei langem Text wird das Panel höher); fehlt ein Bild, bleibt seine
  Fläche leer. Ohne aktive Szene der Hinweis „Keine Szene aktiv“.
- **Notizen:** Das Panel „Notizen“ listet die Einträge Main, Fight, Side, Leveling, Mechaniken (Start: Main; per
  Tastatur bedienbar wie die Szenenliste); die Mitte zeigt die Notizen des gewählten Eintrags (Markdown aus `public/story/`), auch bei eingeklapptem Panel.
  Inhaltsverzeichnis-Links, Bilder öffnen in neuem Tab. Eintrag „Side“ ist leer (Ordner fehlt).
- **Musik (Fernbedienung):** Der Admin spielt selbst nichts ab; Musik und Soundeffekte kommen aus der Wall, die
  Audioausgabe ist (siehe Wall Screen). Panel „Musik“ mit Play/Pause, darunter dem Titel des aktuellen
  Tracks und rechts über die volle Höhe einem senkrechten Lautstärke-Slider (gesendet beim Loslassen; per Tastatur mit
  den Pfeiltasten bedienbar). Titel und Hinweis brechen im schmalen Panel um. Die Anzeige folgt dem Zustand auf dem
  Server, auch für mehrere Admin-Fenster. Der Server spielt zufällige Tracks aus der Playlist der aktiven Szene; nach
  einem Trackende folgt ein anderer Track (bei nur einem derselbe von vorne), die Musik stoppt nur durch Pause. Beim
  Szenenwechsel wechselt sofort der Track – lief die Musik, spielt er direkt weiter, sonst bleibt sie pausiert. Ohne
  aktive Szene ist die Standardmusik die Playlist. Ist keine Wall Ausgabe, steht unter dem Titel „Keine Audioausgabe
  bereit“; die Befehle ändern trotzdem den Zustand, und eine Wall, die Ausgabe wird, setzt damit ein. Nach einem
  API-Neustart ist die Musik pausiert. Fehler bei Musik-Befehlen zeigt die Hinweisleiste „Änderung konnte nicht
  gespeichert werden“.
- **Sounds:** Panel „Sounds“ mit Buttons für Soundeffekte in Gruppen (Heilung/Trank, Buff, Zauber, Debuff, Lock; die
  Gruppen brechen im Panel um und sind durch Abstand getrennt); die
  Wall, die Audioausgabe ist, spielt sie über der Musik. Ohne Ausgabe passiert nichts (kein Fehler), Fehler beim Senden
  werden nur geloggt.
- **Vollbild (Admin):** Icon-Button „Vollbild“ rechts in der Top-Bar (links vom Icon-Button „Dashboard“) schaltet das
  Admin-Fenster in den Vollbildmodus des Browsers und wieder zurück; hervorgehoben, solange das Fenster im Vollbild ist
  (auch wenn es per Escape verlassen wird, folgt die Anzeige).
- Theme-Umschalter (Settings-Icon rechts in der Top-Bar): schaltet das Theme global für Admin, Wall, Ground und die
  Player Screens um (außer auf Smartphones, deren Spieler lokal ein anderes Theme gewählt hat).
- **Screens:** Panel mit je einer Zeile für Wall und Ground: Name, Status-Punkt und „verbunden“ bzw. „nicht
  verbunden“ (bei mehreren Verbindungen „2 verbunden“ usw.), bei der Wall zusätzlich „Audioausgabe“, wenn eine Wall
  Ausgabe ist, und rechts der Icon-Button „In neuem Fenster öffnen“ (`/wall` bzw. `/ground` in einem eigenen Fenster
  je Screen; ein weiterer Klick holt das offene Fenster nach vorn, ohne es neu zu laden). Darunter „N Spieler
  verbunden“ und rechts daneben der Icon-Button „QR-Code“. Die Zahlen schickt der Server bei jeder Änderung (Öffnen
  oder Schließen eines Screens); bis zur ersten Meldung steht „–“.
- **Level:** Panel „Level“ mit dem Level aller Spieler des aktiven Abenteuers und den Buttons „−“ und „+“ (Grenzen
  1–20, an der Grenze deaktiviert; ohne Abenteuer „–“ und beide deaktiviert). Ein Klick speichert das neue Level; die
  Anzeige (Panel und Level-Badges) ändert sich erst, wenn der Server den neuen Stand schickt, und folgt so auch in
  anderen Admin-Fenstern. Fehler zeigen die Hinweisleiste „Änderung konnte nicht gespeichert werden“, das Level bleibt
  unverändert.
- **Spieler:** Panel „Spieler“ mit je einer Hero-Karte je Spieler des aktiven Abenteuers in der Reihenfolge der API
  (Seed: Aragorn, Legolas, Gimli, Gandalf): Avatar (ohne Bild die Initialen des Charakternamens) mit dem Level als
  Badge oben links, daneben Spielername (Label), Charaktername groß und Volk und Klasse als Chips. Ohne Abenteuer oder
  ohne Spieler „Keine Spieler“. Spieler und Level lädt der Admin beim Laden, bei einem Abenteuerwechsel und nach
  jedem Spieltisch-Zustand, den der Server schickt, neu. Effekte (Segen, Vergiftet …) gibt es noch nicht; Spieler
  anlegen oder bearbeiten ist nicht möglich.
- **Spieler verbinden:** Der Icon-Button „QR-Code“ im Panel „Screens“ öffnet einen Dialog mit dem QR-Code der
  Player-URL (dunkel auf hellem Grund, unabhängig vom Theme) und der URL als Text; die Spieler scannen ihn mit der
  Smartphone-Kamera. Die URL kommt vom Start-Skript (`dnd prod`: `http://<IP>:8080/`) bzw. ist der Origin des Admins,
  wenn dieser über die IP geöffnet ist; sonst zeigt der Dialog „Player-URL unbekannt – Spieltisch mit „dnd prod“
  starten oder den Admin über die IP des Rechners öffnen“. Schließen per Button, Escape oder Klick außerhalb; der Fokus
  kehrt danach zum Button zurück.
- **Ladefehler:** Lassen sich Abenteuer, Spieler oder Szenen nicht laden (Backend nicht erreichbar, Timeout, HTTP-Fehler), erscheint unter der
  Top-Bar die Hinweisleiste „Backend nicht erreichbar“ mit Button „Erneut versuchen“; bei Erfolg verschwindet sie.
  Keine automatischen Wiederholungen. Kann eine Notizdatei nicht geladen werden, zeigt der Notizbereich „Notizen
  konnten nicht geladen werden“; ein Wechsel des Eintrags lädt erneut.

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
Zusätzlich als Overlay: Weltkarte oder Übersichtskarte des aktuellen Gebiets. Was die Wall bei einem Kampf zeigt,
legt der geplante Menüpunkt „Kampf“ im Admin fest.

### Ist
- **Layout** (nach [frontend/DESIGN.md](../frontend/DESIGN.md)): Vollbild-Hintergrund = Wall-Bild der aktiven Szene,
  unverzerrt und randlos. Ohne aktive Szene (auch bis der Server den ersten Stand geschickt hat) nur die
  Hintergrundfarbe des Themes, ohne Bild und ohne Panel; die Steuerleiste funktioniert weiter.
- Folgt dem Spieltisch per WebSocket (aktive Szene, Abenteuer, Theme, Overlay) und kann damit auch in einem anderen Browser oder
  auf einem anderen Gerät laufen (`http://<IP>:8080/wall`). Nach einem Verbindungsabbruch behält sie das Bild ohne
  Hinweis und verbindet sich selbst neu.
- Overlay-Panel oben mittig; welches Overlay sie zeigt, steht auf dem Server (Spieltisch) und gilt für alle Walls.
  Umschalten im Admin (Panel „Wall-Overlay“) oder an jeder Wall über eine Steuerleiste, die beim Hover am unteren Rand
  erscheint (WORLD / OFF, hervorgehoben ist der Zustand des Servers):
  - **WORLD:** „Weltkarte“ mit einer fest eingebundenen Weltkarte (nicht aus dem Backend), vollständig über der
    Steuerleiste.
  - **OFF:** Overlay ausgeblendet (Start, auch nach einem Neustart der API).
  Ein Klick auf WORLD oder OFF speichert den Zustand auf dem Server, alle Walls (und das Admin-Panel) wechseln erst mit
  dessen Push. Schlägt das Speichern fehl, ändert sich nichts; die Wall zeigt keinen Fehler (nur in der Konsole). Eine
  neu geöffnete Wall zeigt sofort das aktuelle Overlay. Ein Szenen- oder Abenteuerwechsel schließt die Weltkarte auf
  allen Walls.
- **AUDIO:** Button in derselben Steuerleiste; ein Klick macht diese Wall zur Audioausgabe für Musik und Soundeffekte
  (die Nutzerinteraktion gibt die Wiedergabe im Browser frei). Er ist hervorgehoben, solange die Wall Ausgabe ist.
  Es spielt immer nur eine Wall: Klickt man auf einer anderen Wall „AUDIO“, verstummt die bisherige. Die Ausgabe folgt
  der Fernbedienung im Admin (Play/Pause, Lautstärke, Sounds bei voller Lautstärke über der Musik) und meldet
  das Trackende an den Server; sonst zeigt die Wall nichts an. Nach einem Verbindungsabbruch meldet sie sich ohne
  neuen Klick wieder als Ausgabe. Blockiert der Browser das Abspielen, loggt sie den Fehler; ein erneuter Klick auf
  „AUDIO“ versucht es wieder.
- Eine szenen-/gebietsspezifische Übersichtskarte gibt es noch nicht.
- **Ladefehler:** kein Hinweis für die Spieler; die Wall behält den zuletzt geladenen Stand, der nächste
  Szenenwechsel lädt erneut.

---

## Ground Screen

### Soll
Die Oberfläche der Welt als **digitales Spielbrett**. Bei einem Kampf wird der Kampfschauplatz angezeigt,
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
