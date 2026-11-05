# DND-46: Charakterauswahl auf dem Player Screen, Hintergrundbild und Glas-Look

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Der QR-Code im Admin führt die Spieler auf `/`, dort liegt bisher direkt der Player Screen, ohne Bezug zu einem
Charakter. Dieser Task macht `/` zur Charakterauswahl: Jeder Spieler scannt den QR-Code, tippt auf seinen Charakter
und landet auf dem eigenen Player Screen unter `/player/:id`. Das ist die Grundlage für alles, was später pro
Charakter auf dem Smartphone passiert (Ressourcen pro Charakter, „Zug beenden“ im Kampf). Auswahl und Player Screen
liegen dabei wie der Admin über dem Hintergrundbild des Abenteuers zum Theme und bekommen den Glas-Look der
Kacheln aus Admin, Wall und Ground (Mockup
[player-select-mockup.html](../../frontend/docs/design/mockup/player-select-mockup.html)).

## Scope / Non-Goals

**Im Scope**
- Neue Charakterauswahl auf `/` mit den Charakteren des aktiven Abenteuers, inklusive Lade-, Leer- und
  Fehlerzuständen.
- Player Screen auf `/player/:id`; Rückkehr zur Auswahl bei Abenteuerwechsel.
- Settings-Menü (bisher Theme-Menü) mit Eintrag „Charakter wechseln“, immer über allen anderen Elementen.
- Hintergrundbild des Abenteuers je wirksamem Theme und Glas-Look auf Auswahl und Player Screen.
- Doku: Screens, Routen, Style Guide.

**Nicht im Scope**
- Zugang zu Admin, Wall oder Ground über `/` (kein Link, keine Gerätemarkierung, kein URL-Parameter); diese
  Screens bleiben nur über ihre direkten URLs erreichbar.
- Authentifizierung oder Schutz der Routen.
- Belegung von Charakteren: mehrere Handys dürfen denselben Charakter wählen; keine Anzeige „belegt“, keine
  Anzeige im Admin, wer welchen Charakter gewählt hat.
- Gemerkter Charakter oder automatische Weiterleitung beim erneuten Öffnen von `/`.
- Inhalte pro Charakter im Player Screen: Ressourcen bleiben lokal und für alle gleich, der Player Screen zeigt
  keinen Namen oder Avatar des Charakters.
- Kachel-Darstellung der Auswahl (nur Liste).
- Änderungen an Backend, API oder WebSocket-Protokoll.
- Änderungen an Admin, Wall und Ground (deren Glas-Look ist mit DND-41/DND-45 fertig).

## Entscheidungen

### E1: Routen
- **Entscheidung:**
  - `/` ist die Charakterauswahl, `/player/:id` der Player Screen des Spielers mit dieser ID (`player.id` aus der
    Datenbank). Der QR-Code (`PLAYER_URL`, `table/join`) bleibt unverändert und zeigt weiter auf `/`.
  - Beide Routen verbinden sich wie bisher als `screen=player` mit dem Spieltisch; Telefone auf der Auswahl zählen
    im Panel „Spieltisch“ des Admins also als verbundene Player.
  - Die Theme-Abweichung des Geräts (`localStorage` `playerThemeOverride`) gilt für beide Routen.
- **Verworfene Alternativen:** Zugang zum Admin auf `/` je nach Bildschirmgröße, URL-Parameter oder markiertem
  Gerät (im Dialog verworfen: ohne Auth kein echter Schutz, und die Spieler sollen nur ihre Charaktere sehen).
- **Begründung:** Der QR-Code führt nur Spieler auf `/`; der Spielleiter öffnet `/admin`, `/wall` und `/ground`
  direkt (Startskript `prod`).

### E2: Daten der Auswahl
- **Entscheidung:** Die Auswahl nimmt das aktive Abenteuer aus dem Spieltisch-Zustand (WebSocket) und lädt die
  Spieler per `GET /adventures/{id}` beim Laden und bei jedem Wechsel des aktiven Abenteuers (über `loadLatest`, wie
  die Wall). Dieselbe Antwort liefert die Hintergrundbilder (E6). Reihenfolge der Spieler wie von der API (nach ID).
- **Begründung:** Spieler stehen nicht im Snapshot; der Endpoint existiert bereits.

### E3: Darstellung der Auswahl
- **Entscheidung:**
  - Kopf: Label mit dem Namen des aktiven Abenteuers, darunter die Überschrift „Charakter wählen“; rechts daneben
    das Settings-Menü (E5, ohne „Charakter wechseln“).
  - Darunter eine Karte mit dem Label „Party · N“ und den Charakteren als Liste: je Zeile ein Button mit Avatar
    (Bild, sonst Initialen, wie die Spielerzeile im Admin), Charaktername und „Volk · Klasse · Spielername“, rechts
    ein Pfeil. Zeilen mit Touch-Ziel mindestens `size.control.lg`. Im Querformat wird die Liste von selbst
    mehrspaltig (Grid mit Mindestbreite je Spalte).
  - Ein Tipp auf eine Zeile öffnet `/player/<id>`.
  - Die Auswahl funktioniert im Hoch- und im Querformat und zeigt kein Overlay „Bitte das Handy quer halten“; sie
    scrollt, wenn die Liste nicht passt.
- **Verworfene Alternativen:** Kacheln mit großem Avatar (im Dialog verworfen: die Liste reicht).
- **Begründung:** Wie im Mockup; die Spielerzeile gibt es im Admin schon.

### E4: Zustände der Auswahl
- **Entscheidung:** Statt der Liste steht in der Karte (Label nur „Party“):
  - **Lädt:** drei Platzhalter-Zeilen, solange noch kein Spieltisch-Zustand oder die Spieler des aktiven
    Abenteuers noch nicht geladen sind.
  - **Kein Abenteuer aktiv:** „Noch kein Abenteuer aktiv“ und „Sobald der Spielleiter ein Abenteuer startet,
    erscheinen hier die Charaktere.“ (Kopf ohne Abenteuer-Label).
  - **Keine Charaktere:** „Noch keine Charaktere“ und „In diesem Abenteuer sind noch keine Charaktere angelegt.“
  - **Keine Verbindung:** wenn die WebSocket-Verbindung getrennt ist, bevor ein Zustand da ist, oder das Laden der
    Spieler fehlschlägt: „Keine Verbindung zum Spieltisch“, „Ist dein Handy im selben WLAN wie der Rechner des
    Spielleiters?“ und der Button „Erneut versuchen“ (verbindet sofort neu bzw. lädt die Spieler neu). Ist schon eine
    Liste geladen und bricht nur die Verbindung ab, bleibt die Liste stehen.
  - Wechselt das aktive Abenteuer, während die Auswahl offen ist, zeigt sie ohne Reload die Charaktere des neuen.
- **Begründung:** Wie im Mockup; die Auswahl ist ohne Daten nutzlos, deshalb zeigt sie (anders als der Player
  Screen) einen Fehler.

### E5: Settings-Menü
- **Entscheidung:**
  - Das bisherige Theme-Menü heißt künftig Settings-Menü (zugänglicher Name „Einstellungen“) und steht auf Auswahl
    und Player Screen. Einträge wie bisher „Wie Spieltisch“, „Dunkel“, „Taverne“.
  - Nur im Player Screen folgt nach einer Trennlinie als letzter Eintrag „Charakter wechseln“ mit Wechsel-Icon; er
    öffnet `/` (ohne Hinweis aus E7). Per Tastatur erreichbar wie die anderen Einträge.
  - Die geöffnete Liste liegt immer über allen anderen Elementen (`layer.popover`); nur das Overlay „Bitte das Handy
    quer halten“ deckt sie ab. Die Liste bleibt deckend (wie die Auswahllisten im Admin).
- **Verworfene Alternativen:** Chip mit Avatar und Namen neben dem Settings-Button (im Dialog verworfen).

### E6: Hintergrundbild und Glas-Look
- **Entscheidung:**
  - Auswahl und Player Screen zeigen hinter ihren Flächen das Hintergrundbild des aktiven Abenteuers zum
    **wirksamen** Theme des Geräts (Abweichung, sonst Spieltisch-Theme), abgedunkelt und bildschirmfüllend, mit
    demselben Verhalten wie im Admin: Überblendung bei Wechsel von Abenteuer oder Theme, ohne Übergang bei
    „Bewegung reduzieren“, einfarbig ohne Bild, während das Abenteuer lädt oder wenn das Bild nicht lädt. Dafür
    werden `useAdventureBackground` und `AdventureBackground` wiederverwendet (Kommentare von „Admin“ auf alle
    Nutzer verallgemeinern).
  - Solange das Bild zu sehen ist, sind die Karten (Party, Ressourcen) und der Settings-Button durchscheinend mit
    Unschärfe (`tileSurface` mit `$isTranslucent`), sonst deckend. Deckend bleiben immer die Flächen in den Karten
    (Spielerzeilen, Ressourcen-Buttons), die Liste des Settings-Menüs und das Overlay „Bitte das Handy quer halten“.
  - Ohne aktives Abenteuer und im Zustand „Keine Verbindung“ ist der Hintergrund einfarbig.
- **Begründung:** Damit haben alle vier Screens denselben Glas-Look; im Dialog gewünscht.

### E7: Abenteuerwechsel und ungültige IDs
- **Entscheidung:**
  - Der Player Screen lädt wie die Auswahl die Spieler des aktiven Abenteuers (E2).
  - Gehört der Charakter nicht (mehr) zum aktiven Abenteuer, nachdem er zuvor dazugehört hat (Abenteuerwechsel,
    kein Abenteuer mehr aktiv), leitet der Player Screen auf `/` um, und die Auswahl zeigt über der Karte den Hinweis
    „Der Spielleiter hat das Abenteuer gewechselt. Wähle deinen Charakter neu.“ Der Hinweis verschwindet mit der
    Wahl eines Charakters und nach einem Reload.
  - Ist die ID beim Öffnen unbekannt oder gehört nicht zum aktiven Abenteuer (z. B. alter Link), leitet der Player
    Screen ohne Hinweis auf `/` um. Eine ID, die keine positive ganze Zahl ist, ebenso.
  - Bis die Spieler geladen sind und bei Ladefehlern zeigt der Player Screen die Ressourcen wie bisher und leitet
    nicht um.
  - Die Entscheidung, ob umgeleitet wird und mit welchem Hinweis, liegt als reine Funktion in `src/utils/`
    (unit-getestet).
- **Begründung:** Am Tisch soll kein Handy einen Charakter eines anderen Abenteuers zeigen; ein Fehlschlag beim
  Laden soll niemanden aus seinem Screen werfen.

## Subtasks

### Frontend
- [x] Routing in `src/app/App.tsx`: `/` → Auswahl, `/player/:id` → Player Screen; beide mit `GameTableProvider`
      (`screen="player"`) und der Theme-Abweichung (E1).
- [x] Neuer Screen Charakterauswahl (z. B. `src/screens/PlayerSelectScreen.tsx`) mit Kopf, Karte „Party“,
      auswählbaren Spielerzeilen und den Zuständen aus E3/E4; Spielerzeile als Button, wo möglich aus
      `ListRow`/`CombatantAvatar`/`PlayerListItem` aufgebaut.
- [x] `ThemeMenu` zum Settings-Menü erweitern: Name „Einstellungen“, optionaler Eintrag „Charakter wechseln“ mit
      Trennlinie, `layer.popover` (E5).
- [x] `PlayerScreen`: Spieler laden, Umleitung nach E7 (reine Funktion in `src/utils/`), Hintergrundbild und
      Glas-Look (E6); Karte der Ressourcen (`ResourceBarPlayer`) und Settings-Button mit `tileSurface`.
- [x] `useAdventureBackground`/`AdventureBackground` für Auswahl und Player Screen nutzen (wirksames Theme).
- [x] Unit-Tests für die Umleitungs-Funktion und die Zustandsauswahl der Auswahl (falls als reine Funktion
      ausgelagert); BDD-Feature `playerSelect.feature`.

### Doku
- [x] `docs/screens.md`: Routentabelle, Abschnitt Player Screen (Soll/Ist) inklusive Auswahl.
- [x] `frontend/CLAUDE.md` (Routen, Struktur), `docs/architecture.md` (Player lädt `adventures/{id}`, nutzt das
      aktive Abenteuer aus dem Snapshot).
- [x] `frontend/DESIGN.md` und `frontend/docs/design/`: Settings-Menü (statt Theme-Menü), Ebenen im Player
      (`layer.popover` statt „kein `z-index`“), Abenteuer-Hintergrund und durchscheinende Flächen auch im Player,
      Screen-Layout der Auswahl, Rollen-Verwendungen.
- [x] `docs/known-issues.md` prüfen (Player-Ressourcen weiterhin nicht pro Charakter).

## Akzeptanzkriterien

### AK1: Auswahl über den QR-Code
- **Given** ein aktives Abenteuer mit Spielern
- **When** ein Spieler `/` auf dem Smartphone öffnet
- **Then** sieht er den Namen des Abenteuers, „Charakter wählen“ und die Karte „Party · N“ mit je einer Zeile pro
  Charakter (Avatar bzw. Initialen, Charaktername, „Volk · Klasse · Spielername“) in der Reihenfolge der API
- **And** es gibt keinen Link zu Admin, Wall oder Ground

### AK2: Charakter wählen
- **Given** die Auswahl mit den Charakteren
- **When** der Spieler auf einen Charakter tippt
- **Then** öffnet sich `/player/<id>` mit dem Player Screen (Ressourcen wie bisher)
- **And** mehrere Geräte können denselben Charakter wählen

### AK3: Charakter wechseln
- **Given** der Player Screen eines Charakters
- **When** der Spieler das Settings-Menü öffnet
- **Then** stehen dort „Wie Spieltisch“, „Dunkel“, „Taverne“, eine Trennlinie und „Charakter wechseln“
- **And** die Liste liegt über allen anderen Elementen
- **When** er „Charakter wechseln“ wählt
- **Then** zeigt das Gerät die Auswahl auf `/` ohne Hinweis
- **And** auf der Auswahl hat das Settings-Menü keinen Eintrag „Charakter wechseln“

### AK4: Abenteuerwechsel
- **Given** ein Gerät zeigt den Player Screen eines Charakters des aktiven Abenteuers
- **When** der Spielleiter im Admin ein Abenteuer aktiviert, zu dem der Charakter nicht gehört
- **Then** wechselt das Gerät ohne Reload auf `/` und zeigt den Hinweis „Der Spielleiter hat das Abenteuer
  gewechselt. Wähle deinen Charakter neu.“ über den Charakteren des neuen Abenteuers
- **And** nach der Wahl eines Charakters oder einem Reload ist der Hinweis weg

### AK5: Ungültiger Link
- **Given** ein aktives Abenteuer
- **When** jemand `/player/<id>` mit einer unbekannten ID, einer ID eines anderen Abenteuers oder einer ungültigen
  ID öffnet
- **Then** landet er auf `/` ohne Hinweis

### AK6: Leer- und Fehlerzustände
- **Given** kein aktives Abenteuer bzw. ein Abenteuer ohne Spieler bzw. kein erreichbarer Server
- **When** ein Spieler `/` öffnet
- **Then** zeigt die Karte „Noch kein Abenteuer aktiv“ bzw. „Noch keine Charaktere“ bzw. „Keine Verbindung zum
  Spieltisch“ mit „Erneut versuchen“ (nach E4)
- **And** sobald der Spielleiter ein Abenteuer aktiviert bzw. der Server erreichbar ist, erscheinen die Charaktere
  ohne Reload (bei „Keine Verbindung“ spätestens nach „Erneut versuchen“)

### AK7: Hoch- und Querformat
- **Given** ein Smartphone im Hochformat
- **When** es die Auswahl zeigt
- **Then** ist sie bedienbar, ohne Hinweis „Bitte das Handy quer halten“; im Querformat steht die Liste mehrspaltig
- **When** es den Player Screen im Hochformat zeigt
- **Then** deckt der Hinweis „Bitte das Handy quer halten“ alles ab, auch eine offene Liste des Settings-Menüs

### AK8: Hintergrundbild und Glas-Look
- **Given** das aktive Abenteuer hat Hintergrundbilder für Dark und Tavern
- **When** Auswahl oder Player Screen offen sind
- **Then** liegt das Bild zum wirksamen Theme abgedunkelt dahinter, Karten und Settings-Button sind durchscheinend
  mit Unschärfe, Spielerzeilen, Ressourcen-Buttons und die Liste des Menüs deckend
- **When** der Spielleiter das Theme wechselt oder der Spieler im Menü ein anderes Theme wählt
- **Then** blendet das Bild zum neuen wirksamen Theme über
- **And** ohne Bild für das Theme ist der Hintergrund einfarbig und die Flächen sind deckend

## Teststrategie / Verifikation

**Automatisch**
- Frontend (Unit): Umleitungs-Funktion aus E7 (Charakter gehört dazu, gehörte dazu und nicht mehr, nie
  dazugehört, ungültige ID, Spieler noch nicht geladen); ggf. Zustandsauswahl der Auswahl (E4).
- Frontend (BDD): `playerSelect.feature` mit den Seed-Spielern: Auswahl zeigt die vier Charaktere (AK1), Tipp öffnet
  `/player/<id>` (AK2), „Charakter wechseln“ führt zurück (AK3), ungültige ID landet auf `/` (AK5).
- Lint, Typecheck, `check:deadcode`, `check:dupes`, Build grün.

**Manuell**
1. Prod- oder Dev-Stack starten, QR-Code im Admin mit einem Smartphone scannen: Auswahl im Hochformat, dann quer
   (AK1, AK7).
2. Charakter wählen, Handy hochkant (Hinweis), quer; Settings-Menü öffnen, Theme wechseln, „Charakter wechseln“
   (AK2, AK3, AK8).
3. Zweites Abenteuer anlegen (DB) mit eigenen Spielern, im Admin aktivieren, während ein Handy einen Player Screen
   zeigt (AK4).
4. API stoppen und `/` neu laden (AK6, „Keine Verbindung“), API starten und „Erneut versuchen“.

## Offene Fragen

- Kontrast (aus der Umsetzung): Der Kopf der Auswahl (Abenteuername, „Charakter wählen“) steht wie im Mockup direkt
  auf dem abgedunkelten Hintergrundbild. Über sehr hellen Bildern erreicht `text.color` dort nur etwa 3,6:1 (Dark)
  bzw. 1,8:1 (Tavern) statt 4,5:1; in `frontend/docs/design/contrast.md` als offen vermerkt. Entscheidung, ob der Kopf
  eine Fläche bekommen soll, steht aus.

## Review
