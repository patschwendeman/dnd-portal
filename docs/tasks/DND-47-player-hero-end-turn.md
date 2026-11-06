# DND-47: Hero-Karte und „Zug beenden“ auf dem Player Screen

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Seit DND-46 öffnet jeder Spieler auf dem Smartphone seinen eigenen Player Screen (`/player/:id`). Dieser zeigt aber
nur die Ressourcen, keinen Charakter, und vom Kampf weiß das Handy nichts. Den Zug kann nur der Spielleiter im Admin
beenden. Dieser Task zeigt den eigenen Charakter als Hero-Karte auf dem Player Screen. Im Kampf sieht der Spieler,
dass er am Zug ist, und gibt den Zug mit „Zug beenden“ selbst weiter. Am Spieltisch merkt man es daran, dass der
Spielleiter nicht mehr für jeden Spieler klicken muss und Admin und Wall sofort zum nächsten Teilnehmer springen.
Vorlage: Mockup [player-hero-split-mockup.html](../../frontend/docs/design/mockup/player-hero-split-mockup.html)
(Querformat).

## Scope / Non-Goals

**Im Scope**
- Teil 1 (Backend): Der Server schickt den Kampf des aktiven Abenteuers auch an alle Player, wie an die Wall ohne
  die Bezeichnungen der NPCs. Das gilt beim Verbinden und bei jeder Änderung. Der Player beendet seinen Zug über den
  bestehenden Endpoint `POST table/fight/turn`.
- Teil 2 (Frontend): Player Screen neu aufgeteilt: oben die Hero-Karte, unten die Ressourcen, je die halbe Höhe.
  Beide Karten im Glas-Look wie die übrigen Kacheln. Dazu „Am Zug“ (Rahmen und Badge) und der Button „Zug beenden“,
  nur wenn der eigene Charakter am Zug ist.
- Doku: Screens, Synchronisation, Style Guide (Layout, Bausteine).

**Nicht im Scope**
- Effekte (Segen, Vergiftet …) auf der Hero-Karte: Sie gibt es im Datenmodell noch nicht. Das Mockup zeigt sie nur
  als Soll.
- Detail-Sheet beim Tipp auf den Avatar, Hinweis „Als Nächstes dran“, Vibration bei Zugbeginn, automatisches
  Auffüllen der Ressourcen bei Zugbeginn (im Dialog nicht gewählt).
- Hochformat: Der Player Screen bleibt nur im Querformat, das Overlay „Bitte das Handy quer halten“ bleibt. Die
  Hochformat-Ansicht im Mockup dient nur dem Vergleich.
- Anzeige des Kampfes über den eigenen Zug hinaus (Initiative, Runde, andere Teilnehmer) auf dem Handy.
- Anzeige „Tot“ für einen ausgeschiedenen Charakter.
- Authentifizierung: Wie bei DND-46 kann jedes Handy jeden Charakter öffnen und damit dessen Zug beenden.
- Änderungen an der Charakterauswahl (`/`), an Admin, Wall und Ground.
- Änderungen an Logik und Werten der Ressourcen (`ResourceBarPlayer` bleibt lokaler State); nur Layout und Höhe
  ändern sich.

## Entscheidungen

### E1: Kampf an die Player
- **Entscheidung:** Player-Verbindungen bekommen die Nachricht `fight` wie die Wall: den Kampf des aktiven Abenteuers
  ohne `label` der NPCs (`wall_fight`), oder `null`. Sie kommt beim Verbinden (`send_initial_state`) und bei jedem
  `push_fight`. Ground bekommt den Kampf weiterhin nicht. Das Nachrichtenformat bleibt unverändert. Im Frontend füllt
  `useGameTable` den `FightContext` auch für `screen=player`.
- **Verworfene Alternativen:** Eine eigene schmale Nachricht nur mit der `player_id` am Zug (eigener Nachrichtentyp,
  kein Gewinn).
- **Begründung:** Im Dialog gewählt. Das wiederverwendet die vorhandene Wall-Variante, und das Handy prüft selbst, ob
  sein Charakter am Zug ist.

### E2: „Am Zug“ auf dem Handy
- **Entscheidung:** Der Charakter ist am Zug, wenn es einen Kampf gibt und der Teilnehmer mit
  `id === active_combatant_id` den `kind` `player` und die `player_id` des Player Screens hat. Eine reine Funktion in
  `utils` (z. B. `ownTurnCombatantId(fight, playerId): number | null`) liefert die `id` dieses Teilnehmers oder `null`.
  Kein Kampf, Charakter nicht im Kampf oder ein anderer am Zug: `null`.

### E3: Zug beenden
- **Entscheidung:**
  - Ein Tipp auf „Zug beenden“ schickt `POST table/fight/turn` mit `from_combatant_id` = Teilnehmer aus E2 (ohne
    Rückfrage). Die Funktion `endTurn` aus `service/fight.ts` wird wiederverwendet; ihr Kommentar „Writes of the
    Admin“ wird angepasst.
  - Ohne lokale Vorwegnahme: Button, Rahmen und Badge verschwinden erst mit dem nächsten `fight`-Push.
  - Während die Anfrage läuft, ist der Button deaktiviert (`disabled`, `aria-busy`). So löst ein Doppeltipp nur eine
    Anfrage aus. Der Server ignoriert ohnehin ein `from_combatant_id`, der nicht mehr am Zug ist.
  - Schlägt die Anfrage fehl, wird der Button wieder aktiv. Unter dem Button steht dann der Hinweis „Zug konnte nicht
    beendet werden“, bis der nächste Tipp oder der nächste `fight`-Push kommt.
  - Backend: keine Änderung an Endpoint oder Service nötig. Ein Test sichert ab, dass das Beenden durch einen
    Spieler (Request ohne Admin-Kontext) alle Admins, Walls und Player per Push erreicht.
- **Verworfene Alternativen:** Rückfrage „Zug beenden?“ und langes Drücken (im Dialog verworfen). Eine
  WebSocket-Nachricht statt REST (der Endpoint existiert, und alle Schreibzugriffe laufen über REST).
- **Begründung:** Gleiches Verhalten wie „Zug beenden“ im Admin.

### E4: Layout des Player Screens
- **Entscheidung:**
  - Querformat: Grid mit zwei gleich hohen Zeilen (`minmax(0, 1fr)` je Zeile, `gap` `space.4`), Bildschirmrand wie
    bisher. Oben die Hero-Karte, unten die Ressourcen-Karte.
  - Die Ressourcen bleiben 4 × 2. Die Buttons füllen die untere Hälfte (Zeilen `minmax(0, 1fr)`) statt fester
    64 px. Mindesthöhe bleibt `size.control.lg` (Touch-Ziel).
  - Das Settings-Menü wandert von der eigenen Zeile in die Hero-Karte oben rechts. Inhalt unverändert, Liste weiter
    über allem (`layer.popover`).
- **Begründung:** Wie im Mockup, vom User vorgegeben (50/50, untereinander).

### E5: Hero-Karte
- **Entscheidung:**
  - Links der Avatar im Hochformat 3:4. Seine Höhe folgt der Kartenhöhe (Bild, sonst Initialen wie
    `CombatantAvatar`), oben links das Level-Badge mit `global_level` des Abenteuers. Rechts daneben: Spielername als
    Label, Charaktername (`text.xl`/`semibold`), Chips „Volk“ und „Klasse“.
  - Am Zug: Rahmen in `primary` und Badge „Am Zug“ neben dem Spielernamen. Dazu unten rechts in der Karte der Button
    „Zug beenden“ (Hauptfarbe, Icon „Weiter“, Höhe `size.control.lg`).
  - Den vorhandenen `HeroCard` (Admin) erweitern oder seine Bausteine (Badge, Chips) teilen, statt sie zu kopieren
    (jscpd-Schwellwert). Wie, entscheidet die Umsetzung. Admin-Darstellung bleibt unverändert.
  - Neue Assets: Icon „Weiter“ (`public/assets/icons/`).

### E6: Glas-Look
- **Entscheidung:** Hero- und Ressourcen-Karte nutzen `tileSurface` mit `$isTranslucent` wie bisher die
  Ressourcen-Karte (durchscheinend, solange das Hintergrundbild zu sehen ist, sonst deckend). Deckend bleiben die
  Flächen in den Karten (Avatar, Chips, Ressourcen-Buttons, „Zug beenden“) und die Liste des Settings-Menüs. Der
  Rahmen „Am Zug“ ersetzt nur die Randfarbe und ändert nicht die Fläche.
- **Begründung:** Vom User gefordert: dieselben Styleregeln wie die übrigen Kacheln.

## Subtasks

### Vertrag
- [x] Kein neuer Endpoint, keine Schemaänderung. Nur die Zustellung von `fight` an `screen=player` ändert sich. Das
  in `docs/architecture.md` (Synchronisation, WebSocket-Nachrichten) dokumentieren.

### Backend
- [x] `realtime/push.py`: `push_fight` schickt `wall_fight(fight)` auch an `player`. `send_initial_state` schickt
  ihn neuen Player-Verbindungen. Docstrings anpassen.
- [x] Tests: Ein Player bekommt beim Verbinden den Kampf ohne `label` (bzw. `null`). Nach Start, Zugwechsel und Ende
  des Kampfes bekommt er den Push. Ground bekommt weiterhin keinen `fight`. `POST table/fight/turn` erreicht per Push
  Admin, Wall und Player.

### Frontend
- [x] `realtime/useGameTable.ts` / `GameTableProvider.tsx`: `fight` auch für `player` (Kommentare „Only for Admin
  and Wall“ anpassen).
- [x] `utils`: `ownTurnCombatantId` (E2) mit Unit-Tests.
- [x] Hero-Karte für den Player (E5) mit Avatar, Level, Spielername, Name, Chips, „Am Zug“, „Zug beenden“ und
  Fehlerhinweis (E3); Settings-Menü in der Karte.
- [x] `PlayerScreen.tsx`: Layout 50/50 (E4). Daten aus `usePlayerOutlet()` (Spieler, `global_level`) und
  `FightContext`.
- [x] `ResourceBarPlayer.tsx`: Buttons füllen die Höhe (E4), Logik unverändert.
- [x] Glas-Look beider Karten (E6).
- [x] BDD: neues Feature (z. B. `playerTurn.feature`) für AK2–AK5. Den Kampf über die API starten.

### Doku
- [x] `docs/screens.md` (Player Screen Soll/Ist, Hinweis „Ground und Player zeigen ihn (noch) nicht“ im Admin-Teil)
- [x] `docs/architecture.md` (Synchronisation: Kampf an Player)
- [x] `frontend/DESIGN.md`, `frontend/docs/design/components.md`, `frontend/docs/design/screen-layouts.md`
  (Layout-Konstanten, Player-Layout)
- [x] `frontend/CLAUDE.md` (FightContext, Struktur), `backend/CLAUDE.md` falls dort die Empfänger von `fight`
  stehen, `docs/known-issues.md` falls betroffen

## Akzeptanzkriterien

### AK1: Hero-Karte
- **Given** ein Spieler hat auf `/` seinen Charakter gewählt und hält das Handy quer
- **When** sein Player Screen `/player/:id` erscheint
- **Then** nimmt oben die Hero-Karte und unten die Ressourcen-Karte je die halbe Höhe ein
- **And** die Hero-Karte zeigt Avatar (Bild oder Initialen), Level-Badge mit dem Level des Abenteuers,
  Spielername, Charaktername, Volk und Klasse sowie oben rechts das Settings-Menü

### AK2: Am Zug
- **Given** ein Kampf läuft und der Charakter des Player Screens ist am Zug
- **When** der Spieltisch-Zustand ankommt (beim Öffnen oder durch einen Zugwechsel im Admin)
- **Then** zeigt die Hero-Karte den Rahmen in der Hauptfarbe, das Badge „Am Zug“ und den Button „Zug beenden“

### AK3: Nicht am Zug
- **Given** kein Kampf läuft, der Charakter nimmt nicht teil, oder ein anderer Teilnehmer ist am Zug
- **When** der Player Screen angezeigt wird
- **Then** gibt es keinen Rahmen „Am Zug“, kein Badge und keinen Button „Zug beenden“

### AK4: Zug beenden
- **Given** der Charakter ist am Zug
- **When** der Spieler auf „Zug beenden“ tippt
- **Then** ist der nächste nicht ausgeschiedene Teilnehmer am Zug (über das Listenende hinaus mit neuer Runde), wie
  bei „Zug beenden“ im Admin
- **And** Admin und Wall zeigen den neuen Teilnehmer am Zug ohne Reload
- **And** auf dem Handy verschwinden Rahmen, Badge und Button

### AK5: Doppeltipp und mehrere Handys
- **Given** der Charakter ist am Zug und zwei Handys zeigen denselben Charakter (oder der Spieler tippt doppelt)
- **When** beide kurz nacheinander „Zug beenden“ auslösen
- **Then** geht der Zug nur um einen Teilnehmer weiter

### AK6: Fehler beim Beenden
- **Given** der Charakter ist am Zug und die API ist nicht erreichbar
- **When** der Spieler auf „Zug beenden“ tippt
- **Then** wird der Button nach der fehlgeschlagenen Anfrage wieder aktiv, darunter steht „Zug konnte nicht beendet
  werden“, und der Charakter bleibt am Zug

### AK7: Glas-Look
- **Given** das aktive Abenteuer hat ein Hintergrundbild zum wirksamen Theme
- **When** der Player Screen angezeigt wird
- **Then** sind Hero- und Ressourcen-Karte durchscheinend mit Unschärfe wie die Kacheln in Admin, Wall und Ground
- **And** ohne Bild sind beide deckend

### AK8: Kampfdaten auf dem Handy
- **Given** ein Kampf mit NPCs mit Bezeichnung läuft
- **When** ein Player sich verbindet oder der Kampf sich ändert
- **Then** bekommt er den Kampf ohne die Bezeichnungen der NPCs, Ground bekommt keinen Kampf

### AK9: Querformat
- **Given** der Player Screen ist offen
- **When** das Handy hochkant gehalten wird
- **Then** erscheint wie bisher „Bitte das Handy quer halten“

## Teststrategie / Verifikation

**Automatisch**
- Backend (pytest): Zustellung von `fight` an Player beim Verbinden und bei Push, ohne `label`. Ground ohne `fight`.
  Zugwechsel über `POST table/fight/turn` erreicht Admin, Wall und Player. Doppelter Request mit derselben
  `from_combatant_id` ändert nur einmal (vorhanden, ggf. erweitern).
- Frontend Unit (vitest): `ownTurnCombatantId` für Kampf `null`, Charakter nicht im Kampf, anderer am Zug, eigener
  Zug, `active_combatant_id` `null`. `parseServerMessage` bzw. `useGameTable` mit `fight` für `player`.
- Frontend BDD: AK1–AK4 und AK7 (Kampf per API starten, Player Screen öffnen, „Zug beenden“ tippen, im Admin bzw.
  über die API prüfen, wer am Zug ist).
- Lint, Typecheck, `check:deadcode`, `check:dupes` grün.

**Manuell**
1. `dnd prod` starten, Admin am Rechner, zwei Handys per QR-Code mit zwei Charakteren verbinden.
2. Im Admin einen Kampf mit beiden Charakteren und einem NPC starten: Das Handy am Zug zeigt Rahmen, Badge und
   Button, das andere nicht.
3. Am Handy „Zug beenden“ tippen: Admin, Wall und das andere Handy springen weiter. Im Admin bis zum NPC
   weiterschalten: Keines der Handys zeigt den Button.
4. Theme wechseln, Hintergrundbild prüfen (Glas-Look), Handy hochkant halten (Overlay).
5. API stoppen, „Zug beenden“ tippen: Hinweis erscheint, Button wieder aktiv.

## Offene Fragen
- keine

## Hinweise zur Umsetzung
- Ressourcen-Karte ohne sichtbare Labels („Aktion“ … „Zauberplätze“), wie im Mockup: Die Namen stehen nur als
  `aria-label` an den Buttons. Mit Labels und Mindesthöhe `size.control.lg` passt die Karte bei der dokumentierten
  Mindesthöhe von 344px nicht in die halbe Höhe (etwa 168px statt 148px). Bitte im Review bestätigen.
- `docs/domain.md` ebenfalls nachgezogen (Empfänger von `fight`); in `docs/known-issues.md` den veralteten Eintrag
  zur alten, seit DND-43 umbenannten Datei `PlayerHeroCard.tsx` entfernt (der Name ist jetzt neu belegt).
- AK6 nur manuell geprüft (Request im Browser umgeleitet: Hinweis erscheint, Button wieder aktiv, Hinweis weg mit
  dem nächsten Push); kein BDD-Szenario.

## Review
