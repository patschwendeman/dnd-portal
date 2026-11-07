# Screens

Die App hat einen **Admin-Bereich** und einen **Spieler-Bereich** (Player Screen, Wall Screen, Ground Screen).

| Screen | Route | Gerät | Komponente |
|---|---|---|---|
| Admin | `/admin` | Rechner des Spielleiters | `src/screens/AdminScreen.tsx` |
| Player (Charakterauswahl) | `/` | Smartphone je Spieler | `src/screens/PlayerSelectScreen.tsx` |
| Player | `/player/:id` | Smartphone je Spieler | `src/screens/PlayerScreen.tsx` |
| Wall | `/wall` | Monitor (vertikal/Wand) | `src/screens/WallScreen.tsx` |
| Ground | `/ground` | Monitor liegend auf dem Tisch | `src/screens/GroundScreen.tsx` |

(Pfade relativ zu `frontend/`; beide Player-Routen teilen sich `src/screens/PlayerLayout.tsx`.)

---

## Admin Screen

### Soll
- Szenen auswählen und aktivieren. Alle Szenen sind gleich; einen Kampf startet der Spielleiter in jeder Szene über
  den Menüpunkt „Kampf“ (umgesetzt im Admin, die Initiative zeigt auch die Wall, „Am Zug“ und „Zug beenden“ der
  Player; Ground ist geplant).
- Notizen (Markdown) einsehen: Story, NPCs, Kämpfe. Regeln per Querverweis nachschlagen und mit „Zurück“ an die
  Lesestelle zurückkehren (umgesetzt); geplant: Vorschau eines Verweises ohne Sprung.
- Navigationsleiste links mit Menüpunkten, die das Panel daneben füllen: „Notizen“, „Szenen“ und „Kampf“, abgesetzt
  ganz unten „Einstellungen“ für das, was man einmal einstellt (umgesetzt). Die Mitte zeigt dabei weiter die Notizen.
- Kampf: Initiative-Reihenfolge, Zug und Runde im Blick, NPCs mit der Nummer ihrer Figur (umgesetzt); geplant:
  Trefferpunkte, Effekte mit Rundenzahl, „Zug beenden“ auf dem Smartphone, NPC-Katalog je Abenteuer.
- Ruhiges, einheitliches Kachel-Layout mit fester Kopfzeile, unter der Notizen und Dashboard scrollen, dahinter
  ein Hintergrundbild des Abenteuers je Theme, das durch die Kacheln scheint und nicht mit der Szene wechselt
  (umgesetzt; die Bilder werden über Seed bzw. Datenbank festgelegt, nicht im Admin).
- Musik ein- und ausschalten.
- Verschiedene Sounds abspielen.
- Alles, was Wall und Ground zeigen, vom Admin aus steuern; an Wall und Ground wird nichts bedient.
- Dashboard rechts neben den Notizen: Panels, in denen alles gebündelt ist, was der Spielleiter während des Spiels
  steuert (umgesetzt: Layout „Bühne“ mit „Aktive Szene“, „Audio“, „Spieltisch“, „Party“; geplant: weitere Layouts
  zur Auswahl, z. B. „Bento“ und „Cockpit“ aus dem Mockup `frontend/docs/design/mockup/admin-dashboard.html`).

### Ist
- **Layout** (nach [frontend/DESIGN.md](../frontend/DESIGN.md)): frei stehende Kacheln mit Rand und Lichtkante auf dem
  Hintergrund, ohne Trennlinien und ohne Bottom-Bar. Ganz links die Navigationsleiste, daneben das Panel des aktiven
  Menüpunkts (beide über die volle Höhe, mit Abstand zum oberen und unteren Rand), in der Mitte die Notizen (je Seite
  eine Kachel), rechts das Dashboard (ein Drittel der Breite von Notizen und Dashboard, mindestens 400px und höchstens
  560px; die Notizen bekommen den Rest). Über Notizen und Dashboard steht eine feste Kopfzeile: ganz links eine Kachel
  mit „Zurück“ und „Vor“, daneben der Name des aktiven Abenteuers bis zur Button-Gruppe rechts, einer Kachel mit
  „Vollbild“ und „Dashboard“.
  Notizen und Dashboard scrollen jeweils für sich unter der Kopfzeile, die stehen bleibt; der Abstand darunter bleibt
  frei, ganz nach unten gescrollt endet die letzte Kachel auf Höhe der Navigationsleiste.
- **Abenteuer-Hintergrund:** Hinter den Kacheln liegt das Hintergrundbild des aktiven Abenteuers zum Theme des
  Spieltischs (je Abenteuer ein Bild für Dark und eins für Tavern, festgelegt über Seed bzw. Datenbank, im Admin nicht
  wählbar), zu 50 % abgedunkelt und bildschirmfüllend; es steht fest, während Notizen und Dashboard scrollen. Solange es zu sehen ist, sind Navigationsleiste, Panel,
  Kopfzeile, Notizseiten und Dashboard-Panels durchscheinend und zeichnen das Bild weich; Bühne, Hinweisleiste und die
  Bedienflächen in den Kacheln bleiben deckend (die Kacheln sind in Dark zu 75 %, in Tavern zu 92 % deckend). Das Bild
  wechselt nur mit Abenteuer oder Theme, nicht mit der Szene: das alte bleibt, bis das neue geladen ist, dann blenden
  sie ineinander über (bei „Bewegung reduzieren“ im System ohne Übergang). Ohne Bild für das aktive Theme, solange das
  Abenteuer lädt oder wenn das Bild nicht geladen werden kann, ist der Hintergrund einfarbig und die Kacheln sind
  deckend.
- **Dashboard:** eine Spalte mit vier Panels in fester Reihenfolge (kein Verschieben): oben die Bühne („Aktive
  Szene“), darunter „Audio“, „Spieltisch“ und „Party“; während eines Kampfes „Am Zug“, „Initiative“, „Audio“ und
  „Spieltisch“ (siehe **Kampf**). Jedes Panel ist so hoch wie sein Inhalt – die Panels scrollen
  nicht für sich und schneiden keinen Text ab; sind sie zusammen höher als der Hauptbereich, scrollt das Dashboard als
  Ganzes. Der Icon-Button „Dashboard“ rechts
  in der Kopfzeile (ganz rechts, hervorgehoben solange das Dashboard offen ist) blendet es aus – Notizen
  und Kopfzeile nehmen dann die volle Breite, Musik, Sounds, Wall-Overlay (auch der QR-Code), Ground-Raster und Level sind nicht erreichbar
  (die Musik spielt im Ausgabe-Fenster weiter) – und wieder ein. Auswahl und
  Scrollposition der Notizen bleiben erhalten; der Zustand wird nicht gespeichert, nach einem Reload ist das Dashboard
  offen.
- **Navigationsleiste:** schmale Leiste mit Icon-Buttons „Notizen“, darunter „Szenen“ und „Kampf“ (gekreuzte
  Schwerter) und am unteren Ende, abgesetzt von den anderen, „Einstellungen“ (Zahnrad); Tooltip mit dem Namen. Läuft ein Kampf und ist ein anderes Panel offen oder das Panel eingeklappt, trägt
  „Kampf“ einen roten Punkt und den Tooltip „Kampf (läuft)“. Das Panel „Kampf“ ist 280px breit, die anderen
  (auch „Einstellungen“) 240px;
  beim Laden ist „Notizen“ aktiv und hervorgehoben. Klick (oder Enter/Leertaste) auf einen anderen Menüpunkt wechselt
  das Panel, die Mitte zeigt dabei weiter die Notizen. Klick auf den aktiven Menüpunkt klappt das Panel ein,
  die Notizen werden breiter und kein Menüpunkt ist hervorgehoben; ein weiterer Klick klappt es wieder aus. Auswahl und
  Scrollposition der Notizen bleiben dabei erhalten. Menüpunkt und Einklapp-Zustand werden nicht gespeichert, nach
  einem Reload ist „Notizen“ wieder offen.
- **Kopfzeile:** Ganz links die Kachel mit den Icon-Buttons „Zurück“ und „Vor“ für den Verlauf der Notizen (siehe
  **Notizen**); ohne Ziel sind sie deaktiviert, nach dem Laden beide. Die Kachel steht auch bei der Hinweisleiste und bei
  ausgeblendetem Dashboard. Daneben steht in einer Kachel der Name des aktiven Abenteuers, nur zur Anzeige (kein
  Button); ohne Abenteuer „Kein Abenteuer“. Rechts die Kachel mit „Vollbild“ und „Dashboard“.
- **Einstellungen:** Das Panel „Einstellungen“ zeigt unter Labels die Abschnitte „Abenteuer“, „Darstellung“ und
  „Ground-Raster“ (siehe die folgenden Punkte). Es öffnet, wechselt und klappt ein wie die anderen Panels.
- **Abenteuer-Auswahl:** Im Abschnitt „Abenteuer“ des Panels „Einstellungen“ eine Auswahlliste über die Breite des
  Panels (die Liste klappt darunter auf; per Maus und Tastatur bedienbar) mit allen Abenteuern. Ist auf dem Spieltisch (Server) kein Abenteuer aktiv, wird automatisch das erste
  aktiviert (mit nur einem Abenteuer also ohne Zutun); ohne Abenteuer ist die Auswahl leer und deaktiviert, es werden
  keine Szenen geladen. Gezeigt werden nur die Szenen des aktiven Abenteuers. Ein Wechsel wird gespeichert und gilt für
  alle Spieltisch-Screens; Admin, Wall und Ground zeigen danach direkt die im neuen Abenteuer gespeicherte Szene (bzw.
  keine), nie kurz die eines anderen Abenteuers. Während eines Kampfes ist die Auswahl gesperrt: Schloss statt Pfeil,
  Tooltip „Während des Kampfes nicht wechselbar“, die Liste öffnet sich nicht. Solange die Hinweisleiste steht, ist die
  Auswahl deaktiviert.
- **Szenenauswahl:** Das Panel „Szenen“ listet unter dem Label „Szenen“ alle Szenen des aktiven Abenteuers in der
  Reihenfolge, in der sie angelegt sind (Seed: Default, Shop, Tavern, Level Up, Fight 1 … Fight 25), nur mit Namen;
  zu lange Namen enden mit „…“, der volle Name steht im Tooltip. Die aktive Szene ist hervorgehoben. Die Einträge sind
  per Tab erreichbar, Enter/Leertaste wirken wie ein Klick. Klick auf eine andere Szene öffnet einen
  Bestätigungsdialog „Szene wechseln“ mit Wall-Bild, Name und Beschreibung; „Confirm“ speichert die Szene, und alle
  verbundenen Screens (auch andere Admin-Fenster) wechseln, sobald der Server den neuen Stand schickt; „Decline“ bricht
  ab. Klick auf die bereits aktive Szene tut nichts. Ohne Abenteuer oder ohne Szenen steht dort „Keine Szenen“.
  Während eines Kampfes steht über der Liste der Hinweis „Kampf läuft. Die Szene lässt sich erst nach „Kampf beenden“
  wechseln.“ mit Schloss; die Einträge sind ausgegraut (die aktive bleibt hervorgehoben), ein Klick öffnet keinen Dialog.
- **Kampf:** Das Panel „Kampf“ zeigt ohne Kampf „Kampf vorbereiten“: den Hinweis „Reihenfolge = Initiative“ und die
  Liste der Teilnehmer in Initiative-Reihenfolge (vorbelegt mit allen Spielern des Abenteuers in der Reihenfolge der
  Party). Jede Zeile hat einen kleinen Avatar (Spieler mit Initialen bzw. Bild, Gegner rot und Verbündete grün mit ihrer
  Nummer), Name und zweite Zeile (Spieler: „Volk, Klasse · Spielername“, NPCs: Bezeichnung) sowie die Buttons „Nach
  vorn“, „Nach hinten“ und „Entfernen“. Darunter „Hinzufügen“: Segment „Gegner“/„Verbündeter“, Nummer (vorgeschlagen
  ist die kleinste freie Nummer der gemeinsamen Reihe 1–99, änderbar) und optionale Bezeichnung, die nur der
  Spielleiter sieht, Button „Hinzufügen“ (Enter in einem der Felder wirkt ebenso). Eine vergebene Nummer meldet „Nummer
  N ist schon vergeben.“, eine ungültige „Nummer 1–99 eingeben.“; die Liste bleibt dann unverändert. Entfernte Spieler
  stehen als Buttons „+ Vorname“ darunter. Unten „Kampf starten“, deaktiviert ohne Teilnehmer oder ohne aktive Szene.
  Die Vorbereitung gilt nur in diesem Admin-Fenster; ein Reload, ein Abenteuerwechsel, Start oder Ende eines Kampfes
  setzen sie zurück. „Kampf starten“ legt den Kampf auf dem Server an (Runde 1, der erste Teilnehmer ist am Zug), alle
  Admin-Fenster zeigen ihn. Im Kampf heißt das Panel „Kampf“ mit „Runde N“, der Teilnehmer am Zug ist umrahmt,
  Ausgeschiedene sind ausgegraut; ↑/↓, Entfernen, „Verstärkung“ (wie „Hinzufügen“, neue Teilnehmer kommen ans Ende)
  und „+ Vorname“ wirken sofort auf den Kampf. Unten „Kampf beenden“: der Dialog „Kampf beenden?“ („Reihenfolge, Runde
  und Nummern werden verworfen. Szene und Abenteuer lassen sich danach wieder wechseln.“) mit Decline/Confirm;
  „Confirm“ löscht den Kampf, alle Admin-Fenster zeigen wieder Bühne und Party.
- **Am Zug / Initiative:** Im Kampf zeigt das Dashboard statt der Bühne das Panel „Am Zug“ (Kopf „Runde N“): eine
  Hero-Karte mit großem Avatar (bei Spielern mit Level-Badge), darüber Spielername bzw. „Gegner“/„Verbündeter“, Name
  und Chips (Volk und Klasse bzw. Bezeichnung); im Fuß „Als Nächstes:“ (bzw. „Runde N+1:“, wenn danach eine neue Runde
  beginnt) mit kleinem Avatar und Name und rechts „Zug beenden“. „Zug beenden“ gibt den Zug an den nächsten nicht
  ausgeschiedenen Teilnehmer, über das Listenende hinaus steigt die Runde; ein Doppelklick schaltet nur einen Zug
  weiter. Ist niemand übrig: „Niemand am Zug – alle Teilnehmer sind ausgeschieden.“ Statt der Party steht das Panel
  „Initiative · N“ (Kopf mit „Spieler n · Gegner n · Verbündete n“): alle Teilnehmer in Reihenfolge, der am Zug mit
  Rahmen und „Am Zug“, je Zeile ein Totenkopf, der einen Teilnehmer als ausgeschieden markiert (Spieler „Tot“, NPCs
  „Besiegt“ vor der Bezeichnung; Tooltip „Als tot markieren“ bzw. „Als besiegt markieren“, markiert „Wieder im
  Kampf“). Wer am Zug ist, bleibt es bis „Zug beenden“; danach werden Ausgeschiedene übersprungen. Wird der
  Teilnehmer am Zug entfernt, ist der nächste am Zug (ohne Rundenwechsel); ist niemand am Zug und kommt ein
  Teilnehmer hinzu oder zurück, ist der erste davon am Zug. Der Kampf steht auf dem Server, übersteht Reloads und
  Neustarts der API und wird an Admins und, ohne die Bezeichnungen der NPCs, an Walls und Player geschickt
  (Initiative-Leiste, siehe [Wall Screen](#wall-screen); „Am Zug“ und „Zug beenden“ auf dem Handy, siehe
  [Player Screen](#player-screen)); Ground zeigt ihn (noch) nicht. Musik, Sounds,
  Raster und Wall-Overlay ändern sich bei Start und Ende nicht.
- **Wall-Overlay:** Die Zeile „Wall“ im Panel „Spieltisch“ hat ein Segment-Control „Weltkarte“/„Aus“;
  hervorgehoben (`aria-pressed`) ist der Zustand, den der Server zuletzt geschickt hat. Ein Klick
  auf einen anderen Button speichert ihn, alle Walls zeigen die Weltkarte (siehe [Wall Screen](#wall-screen)) oder
  kein Overlay, sobald der Server den neuen Stand schickt; ein Klick auf den hervorgehobenen tut nichts. Den QR-Code
  für die Spieler schaltet der Icon-Button „QR-Code“ in der Zeile „Spieler“ (siehe **Spieler verbinden**); solange er
  gezeigt wird, ist im Segment-Control keine Option hervorgehoben, „Weltkarte“ bzw. „Aus“ ersetzen ihn. Ein Szenen-
  oder Abenteuerwechsel schaltet auf „Aus“.
- **Ground-Raster:** Die Zeile „Ground“ im Panel „Spieltisch“ hat ein Segment-Control „Schwarz“/„Weiß“/„Aus“
  (hervorgehoben ist der Zustand des Servers, ein Klick auf den hervorgehobenen tut nichts). Die Zellgröße steht im
  Abschnitt „Ground-Raster“ des Panels „Einstellungen“: „Zellgröße“ mit dem Wert rechts daneben und darunter ein Slider
  (100–200 in Schritten von 10; per Tastatur mit den Pfeiltasten bedienbar). Während
  des Ziehens zeigt der Slider den gezogenen Wert, beim Loslassen wird er gespeichert, danach zeigt er den Wert des
  Servers. Alle Grounds zeigen das Raster, sobald der Server den neuen Stand schickt; Szenen- und Abenteuerwechsel
  ändern es nicht.
- **Zustand auf dem Server:** Abenteuer, aktive Szene und Theme stehen auf dem Server und gelten für alle
  Spieltisch-Screens, auch in anderen Browsern oder auf anderen Geräten; sie überstehen Reloads und Neustarts der API.
  Gleiches gilt für die Zellgröße des Ground-Rasters. Wall-Overlay und Rasterfarbe stehen ebenfalls auf dem Server,
  aber nur im Speicher: Reloads überstehen sie, nach einem Neustart der API sind beide „Aus“.
  Mehrere Admin-Fenster dürfen gleichzeitig schreiben, der letzte Schreibzugriff gewinnt.
- **Speicherfehler:** Schlägt das Speichern von Szene, Abenteuer, Theme, Level, Wall-Overlay, Ground-Raster, eine
  Änderung am Kampf oder ein Musik-Befehl fehl, ändert sich auf keinem Screen etwas,
  und in der Kopfzeile erscheint die Hinweisleiste „Änderung konnte nicht gespeichert werden“; „Erneut versuchen“
  wiederholt den zuletzt fehlgeschlagenen Schreibzugriff, bei Erfolg verschwindet sie.
- **Verbindung:** Bricht die Verbindung zum Server ab (spätestens nach etwa 35 s ohne Nachricht erkannt), zeigt der
  Admin die Hinweisleiste „Verbindung zum Server getrennt“ und behält den letzten Stand; er verbindet sich selbst neu
  (1 s, 2 s, 4 s … höchstens 10 s), „Erneut versuchen“ verbindet sofort. Danach verschwindet die Leiste.
- **Hinweisleiste:** ersetzt in der Kopfzeile den Abenteuernamen an derselben Stelle und in derselben Größe (kein
  Abenteuerwechsel, solange sie steht: die Abenteuer-Auswahl im Panel „Einstellungen“ ist deaktiviert); die Buttons
  rechts bleiben. Stehen mehrere Fehler an, zeigt sie nur den
  wichtigsten (Verbindung getrennt → Laden fehlgeschlagen → Speichern fehlgeschlagen); ist er behoben, erscheint der
  nächste.
- **Aktive Szene (Bühne):** Das Wall-Bild der aktiven Szene über die volle Breite des Dashboards (16:9), das
  Ground-Bild als kleines Bild oben rechts darin (etwa ein Drittel der Breite), beide mit Label „Wall“ bzw. „Ground“.
  Unten auf dem Bild liegen auf einem dunklen Verlauf das Label „Aktive Szene“, Name und Beschreibung (umbrechend, nie
  gekürzt; bei langem Text wird die Bühne höher als 16:9). Fehlt ein Bild, bleibt seine Fläche leer. Ohne aktive Szene
  ein Panel mit dem Hinweis „Keine Szene aktiv“.
- **Notizen:** Das Panel „Notizen“ listet die Einträge Main, Fight, Leveling, Mechaniken (je ein Ordner aus
  `public/story/`; Start: Main; per Tastatur bedienbar wie die Szenenliste); die Mitte zeigt alle Dateien des gewählten
  Eintrags als Kacheln untereinander (Markdown), auch bei eingeklapptem Panel. Bilder und Links ins Web öffnen in neuem
  Tab.
- **Querverweise:** Links in den Notizen können auf eine Überschrift im selben Ordner (Inhaltsverzeichnisse), auf eine
  andere Datei oder auf eine Überschrift in einer anderen Datei zeigen, auch in einem anderen Ordner (z. B. „Rast“ in
  Leveling auf „Rasten“ in Mechaniken). Ein Klick wechselt bei Bedarf den Eintrag (das Panel markiert ihn) und scrollt
  die Überschrift bzw. den Anfang der Datei nach oben; URL und Browser-Verlauf bleiben unverändert. Ein Link ohne Ziel
  steht in `error`, gepunktet unterstrichen, mit Tooltip „Verweis-Ziel nicht gefunden“, und ein Klick tut nichts.
- **Verlauf der Notizen:** Querverweise, Links im Inhaltsverzeichnis und der Wechsel des Eintrags im Panel (nicht der
  Klick auf den aktiven) legen einen Eintrag an; vorher merkt sich der Verlauf die Scrollposition. „Zurück“ und „Vor“
  in der Kopfzeile stellen Eintrag und Scrollposition wieder her; ein neuer Sprung nach „Zurück“ verwirft „Vor“, wie im
  Browser. Höchstens 50 Einträge, nur im Speicher: nach einem Reload ist der Verlauf leer und Main offen. Nach einem
  Ordnerwechsel springt die Ansicht ohne Animation an die Zielstelle, im selben Ordner scrollt sie weich (ohne
  Animation bei „Bewegung reduzieren“). Scrollen und „Nach oben“ legen keinen Eintrag an.
- **Tastatur und Maus:** Im ganzen Admin-Fenster wirken Alt+← und Alt+→ sowie die Daumentasten der Maus wie „Zurück“
  und „Vor“; der Browser verlässt dabei den Admin nicht, auch ohne Ziel im Verlauf. Hat ein Textfeld den Fokus, bleiben
  Alt+←/→ beim Feld.
- **Musik:** Musik und Soundeffekte spielt das Admin-Fenster, das Audioausgabe ist; den Lautsprecher wählt der
  Spielleiter außerhalb der App (Betriebssystem bzw. Browser). Panel „Audio“ mit Play/Pause, rechts daneben dem Titel
  des aktuellen Tracks und darunter dem Zustand („Läuft“ bzw. „Pausiert“), darunter der waagerechte Lautstärke-Slider
  mit Lautsprecher-Icon und Zahlenwert (gesendet beim Loslassen; per Tastatur mit den Pfeiltasten bedienbar). Titel und
  Zustand brechen im schmalen Panel um. Die Anzeige folgt dem Zustand auf dem
  Server, auch für mehrere Admin-Fenster. Der Server spielt zufällige Tracks aus der Playlist der aktiven Szene; nach
  einem Trackende folgt ein anderer Track (bei nur einem derselbe von vorne), die Musik stoppt nur durch Pause. Beim
  Szenenwechsel wechselt sofort der Track – lief die Musik, spielt er direkt weiter, sonst bleibt sie pausiert. Ohne
  aktive Szene ist die Standardmusik die Playlist. Ist kein Admin Ausgabe, steht unter dem Titel statt des Zustands
  „Keine Audioausgabe bereit“; die Befehle ändern trotzdem den Zustand, und ein Admin, der Ausgabe wird, setzt damit ein.
- **Audioausgabe:** Ist kein Admin Ausgabe, wird das Admin-Fenster zur Audioausgabe, in dem als Nächstes irgendwo
  geklickt oder eine Taste gedrückt wird (die Nutzerinteraktion gibt die Wiedergabe im Browser frei); der Klick wirkt
  zusätzlich wie gewohnt, ein Klick auf Play startet also sofort die Musik in diesem Fenster. Einen eigenen Button
  dafür gibt es nicht. Es spielt immer nur ein Admin-Fenster: Ist bereits eines Ausgabe, übernimmt ein anderes nicht
  durch Klicks. Die Ausgabe folgt dem Zustand des Servers
  (Play/Pause, Lautstärke, Sounds bei voller Lautstärke über der Musik) und meldet das Trackende. Nach einem
  Verbindungsabbruch meldet sich das Fenster ohne neuen Klick wieder als Ausgabe, nach einem Reload erst bei der
  nächsten Interaktion. Wird das Ausgabe-Fenster geschlossen, zeigen die übrigen „Keine Audioausgabe bereit“, bis in
  einem von ihnen interagiert wird. Blockiert der
  Browser das Abspielen, wird der Fehler nur geloggt; der nächste Play-Befehl versucht es wieder. Nach einem
  API-Neustart ist die Musik pausiert. Fehler bei Musik-Befehlen zeigt die Hinweisleiste „Änderung konnte nicht
  gespeichert werden“.
- **Sounds:** Im Panel „Audio“ unter einer Trennlinie die Buttons für Soundeffekte in Gruppen (Heilung/Trank, Buff,
  Zauber, Debuff, Lock; jede Gruppe ist eine eigene Fläche, die Gruppen brechen im Panel um); das
  Admin-Fenster, das Audioausgabe ist, spielt sie über der Musik. Ohne Ausgabe passiert nichts (kein Fehler), Fehler beim Senden
  werden nur geloggt.
- **Vollbild (Admin):** Icon-Button „Vollbild“ rechts in der Kopfzeile (links vom Icon-Button „Dashboard“) schaltet das
  Admin-Fenster in den Vollbildmodus des Browsers und wieder zurück; hervorgehoben, solange das Fenster im Vollbild ist
  (auch wenn es per Escape verlassen wird, folgt die Anzeige).
- **Theme:** Im Abschnitt „Darstellung“ des Panels „Einstellungen“ eine Auswahlliste mit „Dunkel“ und „Taverne“
  (wie die Abenteuer-Auswahl per Maus und Tastatur bedienbar); gewählt ist das Theme des Spieltischs. Eine Wahl
  speichert es und gilt für Admin, Wall, Ground und die Player Screens (außer auf Smartphones, deren Spieler lokal ein
  anderes Theme gewählt hat); die Wahl des aktiven Themes tut nichts.
- **Spieltisch:** Panel mit je einer Zeile für Wall, Ground und Spieler, getrennt durch Linien. Wall und Ground: links
  Name, Status-Punkt und „verbunden“ bzw. „nicht verbunden“ (bei mehreren Verbindungen „2 verbunden“ usw.), in der
  Mitte das Segment-Control (Wall-Overlay bzw. Ground-Raster), rechts der Icon-Button
  „In neuem Fenster öffnen“ (`/wall` bzw. `/ground` in einem eigenen Fenster je Screen; ein weiterer Klick holt das
  offene Fenster nach vorn, ohne es neu zu laden). Spieler: nur „Spieler“ und „N Spieler verbunden“. Die Zahlen schickt der Server bei jeder Änderung (Öffnen oder
  Schließen eines Screens); bis zur ersten Meldung steht „–“.
- **Level:** Im Kopf des Panels „Party“ rechts das Label „Level“, die Buttons „−“ und „+“ und dazwischen das Level
  aller Spieler des aktiven Abenteuers (Grenzen 1–20, an der Grenze deaktiviert; ohne Abenteuer „–“ und beide
  deaktiviert). Ein eigenes Panel „Level“ gibt es nicht mehr. Ein Klick speichert das neue Level; die
  Anzeige ändert sich erst, wenn der Server den neuen Stand schickt, und folgt so auch in
  anderen Admin-Fenstern. Fehler zeigen die Hinweisleiste „Änderung konnte nicht gespeichert werden“, das Level bleibt
  unverändert.
- **Spieler:** Panel „Party“ (im Kopf „Party · N“ mit der Zahl der Spieler) mit je einer Zeile je Spieler des
  aktiven Abenteuers in der Reihenfolge der API (Seed: Aragorn, Legolas, Gimli, Gandalf), immer untereinander: kleiner
  Avatar (ohne Bild die Initialen des Charakternamens), daneben der Charaktername und darunter „Volk · Klasse ·
  Spielername“. Ohne Abenteuer oder ohne Spieler „Keine Spieler“. Spieler und Level lädt der Admin beim Laden, bei einem Abenteuerwechsel und nach
  jedem Spieltisch-Zustand, den der Server schickt, neu. Effekte (Segen, Vergiftet …) gibt es noch nicht; Spieler
  anlegen oder bearbeiten ist nicht möglich.
- **Spieler verbinden:** Die Zeile „Spieler“ im Panel „Spieltisch“ zeigt „N Spieler verbunden“, den Text „Spieler
  QR-Code“ und den Icon-Button „QR-Code“. Ein Klick blendet den QR-Code der Player-URL auf allen Walls ein (ersetzt
  eine gezeigte Weltkarte), ein weiterer blendet ihn aus (Wall-Overlay „Aus“); der Button ist hervorgehoben
  (`aria-pressed`), solange der Server den QR-Code als Wall-Overlay meldet. Einen Dialog im Admin gibt es nicht
  mehr, der Code steht nur auf der Wall (siehe [Wall Screen](#wall-screen)).
- **Ladefehler:** Lassen sich Abenteuer, Spieler oder Szenen nicht laden (Backend nicht erreichbar, Timeout, HTTP-Fehler), erscheint in der
  Kopfzeile die Hinweisleiste „Backend nicht erreichbar“ mit Button „Erneut versuchen“; bei Erfolg verschwindet sie.
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

Über den Ressourcen zeigt eine Hero-Karte den eigenen Charakter. Im Kampf sieht der Spieler, dass er am Zug ist, und
gibt den Zug selbst weiter (umgesetzt). Geplant: Effekte (Segen, Vergiftet …) auf der Hero-Karte, Detail-Ansicht beim
Tipp auf den Avatar, Hinweis „Als Nächstes dran“.

### Ist
**Charakterauswahl (`/`):** Ziel des QR-Codes auf der Wall. Kein Zugang zu Admin, Wall oder Ground; diese Screens sind nur
über ihre direkten URLs erreichbar.
- Kopf: Name des aktiven Abenteuers, darunter „Charakter wählen“, rechts der Settings-Button.
- Karte „Party · N“ mit je einer Zeile pro Charakter des aktiven Abenteuers in der Reihenfolge der API (Avatar bzw.
  Initialen, Charaktername, „Volk · Klasse · Spielername“, Pfeil). Ein Tipp öffnet `/player/<id>`. Mehrere Geräte
  dürfen denselben Charakter wählen; die Wahl wird nicht gemerkt, `/` zeigt immer die Auswahl.
- Zustände in der Karte (Label nur „Party“): drei Platzhalter-Zeilen beim Laden; „Noch kein Abenteuer aktiv“;
  „Noch keine Charaktere“; „Keine Verbindung zum Spieltisch“ mit „Erneut versuchen“ (verbindet sofort neu bzw. lädt
  die Spieler neu), wenn die Verbindung vor dem ersten Spieltisch-Zustand getrennt ist oder das Laden der Spieler
  fehlschlägt. Eine geladene Liste bleibt bei einem Verbindungsabbruch stehen.
- Die Spieler lädt sie per `adventures/{id}` beim Laden, bei jedem Wechsel des aktiven Abenteuers und nach jedem
  Spieltisch-Zustand, den der Server schickt; ein Wechsel zeigt ohne Reload die Charaktere des neuen Abenteuers.
- Hochformat und Querformat (dort mehrspaltig); kein Hinweis „Bitte das Handy quer halten“; scrollt bei langer Liste.

**Player Screen (`/player/:id`):**
- **Aktion / Bonusaktion:** Antippen schaltet zwischen 1 und 0.
- **Zauberplätze I–IV:** feste Maxima (I: 4, II: 3, III: 3, IV: 2); Antippen verringert um 1, bei 0 zurück auf das
  Maximum.
- **Spezial:** 3 Plätze, Startwert 1; Verhalten wie Zauberplätze.
- **Bewegung (WIP):** fester Wert 9.5, nicht interaktiv.
- **Hero-Karte:** Avatar im Hochformat 3:4 (Bild, sonst Initialen), dessen Höhe der Karte folgt, oben links das
  Level-Badge mit dem Level des Abenteuers; daneben Spielername, Charaktername, Volk und Klasse. Solange die Spieler
  laden, ist die Karte leer (nur das Settings-Menü). Ändert der Spielleiter das Level im Admin, zeigt das Badge es
  ohne Reload: Spieler und Level lädt das Gerät nach jedem Spieltisch-Zustand, den der Server schickt, neu.
- **Am Zug:** Der Player bekommt den Kampf per WebSocket (ohne die Bezeichnungen der NPCs). Ist der eigene Charakter
  am Zug, zeigt die Hero-Karte einen Rahmen in der Hauptfarbe, neben dem Spielernamen das Badge „Am Zug“ und unten
  rechts den Button „Zug beenden“. Ohne Kampf, ohne Teilnahme oder wenn ein anderer am Zug ist, fehlen alle drei.
- **Zug beenden:** Ein Tipp gibt den Zug ohne Rückfrage weiter wie „Zug beenden“ im Admin (`POST table/fight/turn`);
  Rahmen, Badge und Button verschwinden erst mit dem Push des Servers, Admin und Wall springen ohne Reload weiter.
  Während der Anfrage ist der Button deaktiviert; ein Doppeltipp oder ein zweites Handy mit demselben Charakter
  geben den Zug nur einmal weiter. Schlägt die Anfrage fehl, steht darunter „Zug konnte nicht beendet werden“ (bis
  zum nächsten Tipp oder Push), der Button ist wieder aktiv. Jedes Handy kann jeden Charakter öffnen und damit
  dessen Zug beenden (keine Anmeldung).
- **Charakter:** Die Ressourcen sind für alle Charaktere gleich. Gehört der Charakter nicht mehr zum aktiven Abenteuer (Abenteuerwechsel, kein Abenteuer mehr aktiv), kehrt
  das Gerät ohne Reload zur Auswahl zurück, die über der Karte den Hinweis „Der Spielleiter hat das Abenteuer
  gewechselt. Wähle deinen Charakter neu.“ zeigt (weg nach der Wahl eines Charakters oder einem Reload). Eine
  unbekannte ID, eine ID eines anderen Abenteuers oder eine ungültige ID führt ohne Hinweis zur Auswahl. Solange die
  Spieler laden oder ihr Laden fehlschlägt, bleibt der Screen.
- **Settings-Menü:** Der Settings-Button („Einstellungen“) oben rechts in der Hero-Karte öffnet „Wie Spieltisch“ (Standard), „Dunkel“,
  „Taverne“ und nach einer Trennlinie „Charakter wechseln“ (zurück zur Auswahl). Auf der Auswahl fehlt dieser Eintrag.
  Die offene Liste liegt über allen anderen Elementen, nur der Hinweis „Bitte das Handy quer halten“ verdeckt sie.
- **Theme:** Auswahl und Player Screen sind per WebSocket mit dem Spieltisch verbunden (beide als `player`) und folgen
  dessen Theme ohne Reload (Szene und Musik zeigen sie nicht an). Die Theme-Wahl im Settings-Menü gilt nur auf diesem
  Gerät (auch nach einem Reload) und bleibt bei Theme-Wechseln im Admin bestehen. Nach dem Entsperren des Smartphones
  verbinden sie sich sofort neu.
- **Hintergrund:** Hinter Auswahl und Player Screen liegt wie im Admin das Hintergrundbild des aktiven Abenteuers zum
  wirksamen Theme des Geräts, abgedunkelt; Überblendung bei Wechsel von Abenteuer oder Theme. Solange das Bild zu
  sehen ist, sind die Karten (Hero und Ressourcen) und der Settings-Button durchscheinend mit Unschärfe; ohne Bild (kein Abenteuer, keine
  Verbindung, kein Bild zum Theme, Ladefehler) ist der Hintergrund einfarbig und die Flächen sind deckend.
- Layout: oben die Hero-Karte, unten die Ressourcen-Karte, je die halbe Höhe. Die Ressourcen-Buttons füllen ihre
  Hälfte in zwei Zeilen: Aktion · Bonusaktion · Bewegung · Spezial und Zauberplätze I–IV; ihre Namen stehen nicht
  sichtbar, sondern nur als Beschriftung für Screenreader (`aria-label`). Die Ressourcen sind per Tastatur bedienbar
  (Bewegung nicht).
- Im Hochformat verdeckt ein Hinweis „Bitte das Handy quer halten“ den Screen.
- Ressourcen nur lokal: nicht gespeichert, nicht mit dem Admin synchronisiert, Reload setzt zurück; nicht pro Charakter
  konfigurierbar.

---

## Wall Screen

### Soll
Atmosphäre: Hintergrundbild abhängig von der aktiven Szene (z. B. Dungeon bei Kampf, Shop-Inneres bei Shop-Szene).
Zusätzlich als Overlay: Weltkarte oder Übersichtskarte des aktuellen Gebiets. Die Spieler sehen die Party am Rand
und während eines Kampfes (gestartet im Admin über den Menüpunkt „Kampf“) die Initiative als Kacheln, ohne die
Bezeichnungen der NPCs (umgesetzt).

### Ist
- **Layout** (nach [frontend/DESIGN.md](../frontend/DESIGN.md)): Vollbild-Hintergrund = Wall-Bild der aktiven Szene,
  unverzerrt und randlos. Ohne aktive Szene (auch bis der Server den ersten Stand geschickt hat) nur die
  Hintergrundfarbe des Themes, ohne Bild und ohne Panel.
- **Party** (ohne Kampf, nur mit aktiver Szene): die Spieler des aktiven Abenteuers als durchscheinende Kacheln am
  linken und rechten Rand, in der Reihenfolge der API: die erste Hälfte links, der Rest rechts, bei ungerader Zahl
  einer mehr links (2 → 1/1, 4 → 2/2, 5 → 3/2); jede Seite für sich vertikal zentriert. Kachel: Avatar (Bild, sonst
  Initialen), Vorname des Charakters, „Volk · Klasse“ (zu lang: gekürzt mit „…“). Ohne Spieler keine Kacheln. Die
  Wall lädt die Spieler (`GET /adventures/{id}`) beim Laden und bei jedem Wechsel des aktiven Abenteuers.
- **Initiative** (während eines Kampfes, statt der Party): eine Leiste am oberen Rand, Kacheln oben bündig.
  - Links groß der Teilnehmer am Zug („Am Zug“ als Badge in der Hauptfarbe, „Runde N“, Rahmen in der Hauptfarbe,
    voller Name, „Volk · Klasse“), rechts die Folgenden in Initiative-Reihenfolge (Vorname bzw. „Gegner 3“/„Verbündeter 4“).
  - NPCs zeigen ihre Nummer im Avatar (Gegner rot, Verbündete grün), nie ihre Bezeichnung aus dem Admin.
  - Der Rundentrenner „Runde N+1“ steht dort, wo die Initiative-Reihenfolge von vorn beginnt (ist der Erste der
    Reihenfolge am Zug, am Ende der Leiste).
  - Besiegte NPCs erscheinen nicht (außer sie sind am Zug); tote Spieler bleiben ausgegraut mit Totenkopf am Avatar
    und „Tot“ statt „Volk · Klasse“.
  - Passen nicht alle Kacheln in die Breite, fasst am Ende „+N weitere“ die übrigen Teilnehmer zusammen.
  - Ist niemand am Zug (alle ausgeschieden), zeigt die Leiste die Teilnehmer in Initiative-Reihenfolge ohne große
    Kachel und ohne Rundentrenner.
  - Nach „Zug beenden“ rückt die Leiste nach: Die Kacheln gleiten in etwa 0,5 s an ihre neue Stelle und Größe, wer
    ans Ende rückt, verblasst an der alten Stelle und kommt rechts herein, wer wegfällt, verblasst. Bei „Bewegung
    reduzieren“ im System ohne Animation; andere Änderungen (Verstärkung, Umsortieren, Ausscheiden) erscheinen ohne
    Animation.
  - Den Kampf schickt der Server an jede Wall direkt nach dem Verbinden und nach jeder Änderung; eine später
    geöffnete Wall zeigt sofort denselben Stand. Nach dem Kampfende stehen wieder die Party-Kacheln da.
- Reine Anzeige ohne Bedienelemente: keine Steuerleiste, kein Ton. Einzige Ausnahme ist das **Vollbild-Overlay**:
  Solange die Maus über dem Fenster ist (auch stillstehend), ist der ganze Screen so stark abgedunkelt wie unter
  einem Dialog im Admin, mittig stehen in einer durchscheinenden Kachel das Vollbild-Icon und „Vollbild“ (im
  Vollbild: Icon zum Beenden und „Vollbild beenden“). Es liegt über allem, auch über Weltkarte und QR-Code. Ein Klick irgendwo darauf
  schaltet das Vollbild nur dieses Fensters um; der Zustand ist lokal pro Fenster (nicht auf dem Server) und folgt dem
  Browser, auch beim Verlassen mit Escape. Verlässt die Maus das Fenster, verschwindet das Overlay. Nur Maus, kein
  Touch; ohne Maus über dem Fenster bleibt alles unverdeckt.
- Folgt dem Spieltisch per WebSocket (aktive Szene, Abenteuer, Theme, Overlay, Kampf) und kann damit auch in einem anderen Browser oder
  auf einem anderen Gerät laufen (`http://<IP>:8080/wall`). Nach einem Verbindungsabbruch behält sie das Bild ohne
  Hinweis und verbindet sich selbst neu.
- Overlay-Panel oben mittig; welches Overlay sie zeigt, steht auf dem Server (Spieltisch) und gilt für alle Walls.
  Umgeschaltet wird nur im Admin (Panel „Spieltisch“: Weltkarte und Aus in der Zeile „Wall“, QR-Code per Icon-Button
  in der Zeile „Spieler“):
  - **Weltkarte:** Panel „Weltkarte“ mit einer fest eingebundenen Weltkarte (nicht aus dem Backend), vollständig
    sichtbar (unten derselbe Abstand wie oben). Das Panel ist eine durchscheinende Kachel und liegt über Party bzw.
    Initiative; darunter ist der ganze Screen so stark abgedunkelt wie unter einem Dialog im Admin.
  - **QR-Code:** Panel „Spieler verbinden“ an derselben Stelle, mit derselben Kachel und Abdunklung, aber nur so breit
    wie der QR-Code: zentriert der Titel, der QR-Code der Player-URL (dunkel auf hellem Grund, unabhängig vom Theme;
    höchstens 480px, kleiner, wenn er mit Titel und URL sonst nicht vollständig in die Höhe des Fensters passt) und
    darunter die URL als Text. Die Spieler scannen ihn mit der Smartphone-Kamera und landen in der
    [Charakterauswahl](#player-screen). Die URL lädt die Wall (`GET /table/join`) bei jedem Einblenden des QR-Codes
    und beim Öffnen mit aktivem QR-Code; sie kommt vom Start-Skript (`dnd prod`: `http://<IP>:8080/`) bzw. ist der
    Origin der Wall, wenn diese über die IP geöffnet ist. Während des Ladens steht nur der Titel da. Ist die URL
    unbekannt oder schlägt das Laden fehl, zeigt das Panel statt Code und URL „Player-URL unbekannt – Spieltisch mit
    „dnd prod“ starten oder die Wall über die IP des Rechners öffnen“.
  - **Aus:** Overlay ausgeblendet (Start, auch nach einem Neustart der API).
  Weltkarte und QR-Code erscheinen nie gleichzeitig. Alle Walls wechseln mit dem Push des Servers. Eine neu geöffnete
  Wall zeigt sofort das aktuelle Overlay. Ein Szenen- oder Abenteuerwechsel schließt Weltkarte bzw. QR-Code auf allen
  Walls.
- Eine szenen-/gebietsspezifische Übersichtskarte gibt es noch nicht.
- **Ladefehler:** kein Hinweis für die Spieler; die Wall behält den zuletzt geladenen Stand (Szene bzw. Spieler),
  der nächste Szenen- bzw. Abenteuerwechsel lädt erneut.

---

## Ground Screen

### Soll
Die Oberfläche der Welt als **digitales Spielbrett**. Bei einem Kampf wird der Kampfschauplatz angezeigt,
optional mit **Grid** als Layout für taktische Kämpfe.

### Ist
- Vollbild = Ground-Bild der aktiven Szene; Bild oder Video (läuft automatisch, in Schleife, stumm). Ohne aktive
  Szene nur die Hintergrundfarbe des Themes.
- Reine Anzeige ohne Bedienelemente (keine Steuerleiste); Ausnahme wie auf der Wall das Vollbild-Overlay beim Hovern
  mit der Maus (gleiche Abdunklung, Icon und Text in einer durchscheinenden Kachel; liegt auch über dem Raster).
  Party und Kampf zeigt der Ground nicht.
- Grid nach dem Spieltisch-Zustand: Linienfarbe Schwarz oder Weiß bzw. kein Grid, Zellgröße 100–200 (mit dem
  Pixelverhältnis des Geräts skaliert); eingestellt im Admin (Farbe im Panel „Spieltisch“, Zeile „Ground“, Zellgröße
  im Panel „Einstellungen“), gilt für alle Grounds und alle Szenen. Standard: kein Grid, Zellgröße 100; nach einem
  Neustart der API ist das Grid aus, die Zellgröße bleibt. Ein neu geöffneter Ground zeigt sofort
  das aktuelle Raster.
- Verbindung wie auf der Wall: folgt dem Spieltisch per WebSocket, auch auf einem anderen Gerät; nach einem Abbruch
  kein Hinweis, letzter Stand bleibt, Reconnect automatisch.
- **Ladefehler:** wie auf der Wall – kein Hinweis, letzter Stand bleibt, der nächste Szenenwechsel lädt erneut.
