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
  den Menüpunkt „Kampf“ (umgesetzt im Admin; die Anzeige auf Wall, Ground und Player ist geplant).
- Notizen (Markdown) einsehen: Story, NPCs, Kämpfe.
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
  560px; die Notizen bekommen den Rest). Über Notizen und Dashboard steht eine feste Kopfzeile: links der Name des
  aktiven Abenteuers bis zur Button-Gruppe, rechts eine Kachel mit „Vollbild“ und „Dashboard“.
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
  und Kopfzeile nehmen dann die volle Breite, Musik, Sounds, Wall-Overlay, Ground-Raster, Level und QR-Code sind nicht erreichbar
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
- **Kopfzeile:** Links steht in einer Kachel der Name des aktiven Abenteuers, nur zur Anzeige (kein Button); ohne
  Abenteuer „Kein Abenteuer“. Rechts die Kachel mit „Vollbild“ und „Dashboard“.
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
  Neustarts der API und wird nur an Admins geschickt; Wall, Ground und Player zeigen ihn (noch) nicht. Musik, Sounds,
  Raster und Wall-Overlay ändern sich bei Start und Ende nicht.
- **Wall-Overlay:** Die Zeile „Wall“ im Panel „Spieltisch“ hat ein Segment-Control „Weltkarte“/„Aus“;
  hervorgehoben (`aria-pressed`) ist der Zustand, den der Server zuletzt geschickt hat. Ein Klick
  auf den anderen Button speichert ihn, alle Walls blenden die Weltkarte ein bzw. aus, sobald der Server den neuen
  Stand schickt; ein Klick auf den hervorgehobenen tut nichts. Ein Szenen- oder Abenteuerwechsel schaltet auf „Aus“.
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
- **Notizen:** Das Panel „Notizen“ listet die Einträge Main, Fight, Side, Leveling, Mechaniken (Start: Main; per
  Tastatur bedienbar wie die Szenenliste); die Mitte zeigt die Notizen des gewählten Eintrags (Markdown aus `public/story/`), auch bei eingeklapptem Panel.
  Inhaltsverzeichnis-Links, Bilder öffnen in neuem Tab. Eintrag „Side“ ist leer (Ordner fehlt).
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
  offene Fenster nach vorn, ohne es neu zu laden). Spieler: links „Spieler“ und „N Spieler verbunden“, in der Mitte
  „Spieler QR-Code“, rechts der Icon-Button „QR-Code“. Die Zahlen schickt der Server bei jeder Änderung (Öffnen oder
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
- **Spieler verbinden:** Der Icon-Button „QR-Code“ in der Zeile „Spieler“ des Panels „Spieltisch“ öffnet einen Dialog mit dem QR-Code der
  Player-URL (dunkel auf hellem Grund, unabhängig vom Theme) und der URL als Text; die Spieler scannen ihn mit der
  Smartphone-Kamera. Die URL kommt vom Start-Skript (`dnd prod`: `http://<IP>:8080/`) bzw. ist der Origin des Admins,
  wenn dieser über die IP geöffnet ist; sonst zeigt der Dialog „Player-URL unbekannt – Spieltisch mit „dnd prod“
  starten oder den Admin über die IP des Rechners öffnen“. Schließen per Button, Escape oder Klick außerhalb; der Fokus
  kehrt danach zum Button zurück.
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
Zusätzlich als Overlay: Weltkarte oder Übersichtskarte des aktuellen Gebiets. Während eines Kampfes (gestartet im
Admin über den Menüpunkt „Kampf“) soll die Wall die Initiative als Kacheln zeigen, ohne die Bezeichnungen der NPCs
(geplant, eigener Task).

### Ist
- **Layout** (nach [frontend/DESIGN.md](../frontend/DESIGN.md)): Vollbild-Hintergrund = Wall-Bild der aktiven Szene,
  unverzerrt und randlos. Ohne aktive Szene (auch bis der Server den ersten Stand geschickt hat) nur die
  Hintergrundfarbe des Themes, ohne Bild und ohne Panel.
- Reine Anzeige ohne Bedienelemente: keine Steuerleiste, kein Ton. Einzige Ausnahme ist das **Vollbild-Overlay**:
  Solange die Maus über dem Fenster ist (auch stillstehend), ist der ganze Screen abgedunkelt, mittig stehen das
  Vollbild-Icon und „Vollbild“ (im Vollbild: Icon zum Beenden und „Vollbild beenden“). Ein Klick irgendwo darauf
  schaltet das Vollbild nur dieses Fensters um; der Zustand ist lokal pro Fenster (nicht auf dem Server) und folgt dem
  Browser, auch beim Verlassen mit Escape. Verlässt die Maus das Fenster, verschwindet das Overlay. Nur Maus, kein
  Touch; ohne Maus über dem Fenster bleibt alles unverdeckt.
- Folgt dem Spieltisch per WebSocket (aktive Szene, Abenteuer, Theme, Overlay) und kann damit auch in einem anderen Browser oder
  auf einem anderen Gerät laufen (`http://<IP>:8080/wall`). Nach einem Verbindungsabbruch behält sie das Bild ohne
  Hinweis und verbindet sich selbst neu.
- Overlay-Panel oben mittig; welches Overlay sie zeigt, steht auf dem Server (Spieltisch) und gilt für alle Walls.
  Umgeschaltet wird nur im Admin (Panel „Spieltisch“, Zeile „Wall“):
  - **Weltkarte:** Panel „Weltkarte“ mit einer fest eingebundenen Weltkarte (nicht aus dem Backend), vollständig
    sichtbar (unten derselbe Abstand wie oben).
  - **Aus:** Overlay ausgeblendet (Start, auch nach einem Neustart der API).
  Alle Walls wechseln mit dem Push des Servers. Eine neu geöffnete Wall zeigt sofort das aktuelle Overlay. Ein
  Szenen- oder Abenteuerwechsel schließt die Weltkarte auf allen Walls.
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
- Reine Anzeige ohne Bedienelemente (keine Steuerleiste); Ausnahme wie auf der Wall das Vollbild-Overlay beim Hovern
  mit der Maus (liegt auch über dem Raster).
- Grid nach dem Spieltisch-Zustand: Linienfarbe Schwarz oder Weiß bzw. kein Grid, Zellgröße 100–200 (mit dem
  Pixelverhältnis des Geräts skaliert); eingestellt im Admin (Farbe im Panel „Spieltisch“, Zeile „Ground“, Zellgröße
  im Panel „Einstellungen“), gilt für alle Grounds und alle Szenen. Standard: kein Grid, Zellgröße 100; nach einem
  Neustart der API ist das Grid aus, die Zellgröße bleibt. Ein neu geöffneter Ground zeigt sofort
  das aktuelle Raster.
- Verbindung wie auf der Wall: folgt dem Spieltisch per WebSocket, auch auf einem anderen Gerät; nach einem Abbruch
  kein Hinweis, letzter Stand bleibt, Reconnect automatisch.
- **Ladefehler:** wie auf der Wall – kein Hinweis, letzter Stand bleibt, der nächste Szenenwechsel lädt erneut.
