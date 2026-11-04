# DND-43: Kampfmodus im Admin Screen

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Alle Szenen sind gleich (DND-29); einen Kampf soll der Spielleiter künftig in jeder Szene starten können. Bisher gibt
es dafür nichts: Initiative und Züge hält er auf Papier fest. Dieser Task ergänzt den Admin um den Menüpunkt „Kampf“
nach dem Mockup [admin-fight-mockup.html](../../frontend/docs/design/mockup/admin-fight-mockup.html): Er stellt
Spieler, Gegner und Verbündete in Initiative-Reihenfolge zusammen, startet den Kampf, schaltet Zug für Zug weiter
und beendet ihn. Am Spieltisch sieht er jederzeit, wer am Zug ist, wer folgt und in welcher Runde der Kampf steht;
die Nummern der NPCs entsprechen den Figuren auf dem Tisch.

## Scope / Non-Goals

**Im Scope**
- Datenmodell und API für einen laufenden Kampf je Abenteuer (persistent), Push an alle Admin-Fenster.
- Menüpunkt „Kampf“ mit Vorbereitung im Panel (Spieler vorbelegt, Gegner und Verbündete mit Nummer und Bezeichnung,
  Reihenfolge per ↑/↓), Kampf starten und beenden.
- Dashboard im Kampf: „Am Zug“ und „Initiative“ statt Bühne und Party.
- Zug beenden, Rundenzähler; Teilnehmer als tot bzw. besiegt markieren.
- Bearbeiten während des Kampfes: Verstärkung, umsortieren, entfernen.
- Sperre von Szenen- und Abenteuerwechsel während des Kampfes (Admin und Server).

**Nicht im Scope**
- Anzeige des Kampfes auf Wall, Ground oder Player Screen (eigener Task; Wall mit der Kachel-Variante).
- „Zug beenden“ auf dem Smartphone, Zuordnung Gerät → Spieler.
- Trefferpunkte, Rüstungsklasse, Effekte/Zustände mit Rundenzahl.
- NPC-Katalog je Abenteuer (Bilder, Werte), Gruppen („Goblin ×3“ auf einem Platz).
- Initiativewerte eintragen und automatisch sortieren; Drag & Drop (nur ↑/↓).
- Kampf-Historie oder Protokoll.
- Nebenwirkungen beim Start oder Ende (Musik, Sound, Raster, Wall-Overlay bleiben, wie sie sind).
- „Zug beenden“ im Panel „Kampf“ (nur im Dashboard).

## Entscheidungen

### E1: Kampf persistent, Vorbereitung lokal
- **Entscheidung:** Der laufende Kampf steht in der Datenbank und übersteht Reloads und API-Neustarts. Die
  Vorbereitung ist lokaler Zustand des Admin-Fensters; erst „Kampf starten“ legt den Kampf auf dem Server an.
  Ein Reload, ein Abenteuerwechsel oder ein Kampfende setzt die Vorbereitung zurück (alle Spieler des aktiven
  Abenteuers in der Reihenfolge der API, keine NPCs). Jedes Admin-Fenster hat seine eigene Vorbereitung.
- **Verworfene Alternativen:** Kampf nur im Speicher (wie Wall-Overlay) – ein Neustart mitten im Kampf verlöre
  Reihenfolge und Runde; Vorbereitung als Entwurf auf dem Server – zusätzlicher Zustand ohne echten Nutzen.
- **Begründung:** Ein Kampf dauert oft eine Stunde; die Vorbereitung ist in einer Minute neu erstellt.

### E2: Datenmodell
- **Entscheidung:** Migration `0007` legt zwei Tabellen an (Models `Fight`, `Combatant`):
  ```
  fight     (id, adventure_id → adventure (unique, ON DELETE CASCADE),
             scene_id → scene (NOT NULL, ON DELETE CASCADE),             Szene beim Start
             round (int, CHECK ≥ 1, Default 1),
             active_combatant_id → combatant (nullable, ON DELETE SET NULL))
  combatant (id, fight_id → fight (ON DELETE CASCADE),
             position (int),                                             Initiative-Reihenfolge
             kind ('player' | 'enemy' | 'ally', CHECK),
             player_id → player (nullable, ON DELETE CASCADE),
             number (int, nullable, CHECK 1–99),                         Nummer der Figur, nur NPCs
             label (Text, nullable),                                     Bezeichnung, nur NPCs, nur Admin
             defeated (bool, Default false))
             unique (fight_id, position), unique (fight_id, player_id), unique (fight_id, number)
             CHECK: kind = 'player' ⇔ player_id NOT NULL ⇔ number NULL; label nur bei NPCs
  ```
  Höchstens ein Kampf je Abenteuer. `fight` ↔ `combatant` sind zirkulär verknüpft (wie `adventure` ↔ `scene`:
  FK `active_combatant_id` zuletzt anlegen, `use_alter`/`post_update`). Das Umsortieren darf die Eindeutigkeit von
  `position` nicht zwischendurch verletzen (z. B. Constraint `DEFERRABLE INITIALLY DEFERRED`). Seed legt keinen
  Kampf an; `downgrade` entfernt beide Tabellen.
- **Verworfene Alternativen:** Tabelle für Runden (nur für eine Historie nötig); aktiver Zug als Index (verschiebt
  sich beim Umsortieren und Entfernen); Spielerdaten in `combatant` kopieren.
- **Begründung:** Spieler werden per `player_id` verknüpft, Name, Avatar und Level kommen weiter aus `player`.

### E3: API unter `/table/fight`
- **Entscheidung:** Alle Endpoints wirken auf den Kampf des **aktiven** Abenteuers (wie `/table/audio`):

  | Endpoint | Body | Antwort |
  |---|---|---|
  | `GET /table/fight` | – | `FightState \| null` |
  | `POST /table/fight` | `FightStart { combatants: list[CombatantCreate] }` (mindestens einer) | 201 `FightState` |
  | `DELETE /table/fight` | – | 204 |
  | `POST /table/fight/turn` | `{ from_combatant_id: int }` | `FightState` |
  | `POST /table/fight/combatants` | `CombatantCreate` | 201 `FightState` (Teilnehmer am Ende) |
  | `PATCH /table/fight/combatants/{id}` | `{ defeated: bool }` | `FightState` |
  | `DELETE /table/fight/combatants/{id}` | – | `FightState` |
  | `PUT /table/fight/order` | `{ combatant_ids: list[int] }` (genau die aktuellen IDs) | `FightState` |

  ```
  FightState      { round: int, active_combatant_id: int | null, scene_id: int,
                    combatants: list[Combatant] }                       combatants in Initiative-Reihenfolge
  Combatant       { id: int, kind: "player" | "enemy" | "ally", player_id: int | null,
                    number: int | null, label: str | null, defeated: bool }
  CombatantCreate { kind, player_id?: int, number?: int (1–99), label?: str (getrimmt, leer = null, max. 60) }
  ```
  Fehler: 409 `{"detail": "No active adventure"}`, `"No active scene"` (Start), `"Fight in progress"` (Start bei
  laufendem Kampf), 404 `{"detail": "No fight"}` (alle anderen ohne Kampf), 404 `"Combatant not found"`; 422 bei
  ungültigem Body, Spieler aus einem anderen Abenteuer, doppeltem Spieler, doppelter Nummer, `kind` passt nicht zu
  den Feldern, `combatant_ids` keine Permutation der aktuellen IDs. Abgelehnte Requests ändern nichts.
- **Begründung:** Abenteuerwechsel ist im Kampf gesperrt (E6), also gibt es nur den Kampf des aktiven Abenteuers zu
  bedienen; der Admin muss keine IDs kennen. `PUT /order` mit der ganzen Liste statt „eins hoch“ verträgt mehrere
  Admin-Fenster.

### E4: Push nur an Admins
- **Entscheidung:** Neue WebSocket-Nachricht `{"type": "fight", "payload": FightState | null}` **nur an Admins**:
  direkt nach dem Verbinden (nach `screens`) und nach jeder erfolgreichen Änderung am Kampf (Background-Task nach dem
  Commit, wie `state`); `null` ohne Kampf, auch nach einem Abenteuerwechsel. Der `state`-Snapshot bleibt unverändert.
  Schreiben ohne lokale Vorwegnahme; der letzte Schreibzugriff gewinnt.
- **Verworfene Alternativen:** Kampf im `GameTableState` – jeder Zug löste einen `state`-Push aus, auf den Wall und
  Ground mit Neuladen der Szene reagieren.
- **Begründung:** Die Bezeichnungen der NPCs sieht nur der Spielleiter; Wall und Player bekommen den Kampf erst mit
  dem Anzeige-Task, dann ohne `label`.

### E5: Züge und Runden
- **Entscheidung:**
  - Start: Runde 1, am Zug ist der erste Teilnehmer der Liste.
  - `POST /turn`: Am Zug ist der nächste nicht ausgeschiedene Teilnehmer nach dem aktuellen; geht es dabei über das
    Listenende hinaus, steigt `round` um 1. Gibt es keinen, ist niemand am Zug (`null`). Stimmt
    `from_combatant_id` nicht mit dem aktuellen Zug überein (Doppelklick, zweites Admin-Fenster), ändert sich nichts
    (200 mit dem aktuellen Stand, kein Push).
  - Wer als ausgeschieden markiert wird, während er am Zug ist, bleibt am Zug bis „Zug beenden“.
  - Wird der Teilnehmer am Zug entfernt, ist der nächste nicht ausgeschiedene am Zug (ohne Rundenwechsel).
  - Ist niemand am Zug und gibt es (durch Hinzufügen oder Zurücknehmen) wieder einen nicht ausgeschiedenen
    Teilnehmer, ist der erste davon in der Reihenfolge am Zug.
- **Begründung:** Gleiches Verhalten wie im Mockup; die Prüfung von `from_combatant_id` verhindert, dass ein
  Doppelklick einen Zug überspringt.

### E6: Szene und Abenteuer im Kampf gesperrt
- **Entscheidung:** Solange das aktive Abenteuer einen Kampf hat, lehnt der Server einen Wechsel des aktiven
  Abenteuers (`PATCH /table`, auch auf `null`) und der aktiven Szene dieses Abenteuers (`PATCH /adventures/{id}`)
  mit 409 `{"detail": "Fight in progress"}` ab; derselbe Wert ist kein Wechsel und erlaubt. Ein Kampf startet nur
  mit aktiver Szene. Im Admin steht über der Szenenliste der Hinweis „Kampf läuft. Die Szene lässt sich erst nach
  „Kampf beenden“ wechseln.“ (Schloss-Icon), die Einträge sind deaktiviert (`aria-disabled`, Klick öffnet keinen
  Dialog); die Abenteuer-Auswahl ist deaktiviert, mit Schloss statt Pfeil und Tooltip „Während des Kampfes nicht
  wechselbar“.
- **Begründung:** Ein Szenenwechsel ergibt im Kampf keinen Sinn; der Kampf gehört damit fest zu seiner Szene.

### E7: NPCs mit Nummer und Bezeichnung
- **Entscheidung:** Gegner und Verbündete bekommen eine Nummer aus einer **gemeinsamen** Zahlenreihe (1–99). Beim
  Hinzufügen ist die kleinste freie Nummer vorgeschlagen und änderbar; eine vergebene wird abgelehnt („Nummer N ist
  schon vergeben.“, außerhalb 1–99 „Nummer 1–99 eingeben.“). Die Nummer bleibt belegt, solange der Teilnehmer in der
  Liste steht, auch besiegt. Optional eine Bezeichnung („Ghul“), die nur der Spielleiter sieht. Anzeige: „Gegner 3“
  bzw. „Verbündeter 4“, darunter die Bezeichnung; der Avatar zeigt die Nummer statt Initialen.
- **Begründung:** Die Figuren auf dem Tisch tragen Nummern; auf Wall und Handys sollen später keine Namen stehen.

### E8: Ausgeschieden: „Tot“ und „Besiegt“
- **Entscheidung:** Jeder Teilnehmer, auch ein Spieler, lässt sich in der Initiative per Totenkopf-Button
  (`aria-pressed`) als ausgeschieden markieren und zurücknehmen (`defeated`). Ausgeschiedene sind ausgegraut und
  werden beim Zugwechsel übersprungen. Unter dem Namen steht bei Spielern „Tot“, bei NPCs „Besiegt“ (vor der
  Bezeichnung); Tooltip „Als tot markieren“ bzw. „Als besiegt markieren“, markiert „Wieder im Kampf“. Der Status
  gilt nur im laufenden Kampf.

### E9: Admin-Oberfläche nach Mockup
- **Entscheidung:** Umsetzung nach `admin-fight-mockup.html` (ohne die Mockup-Leiste):
  - Navigationsleiste: dritter Menüpunkt „Kampf“ (Icon gekreuzte Schwerter) unter „Szenen“; läuft ein Kampf und ist
    ein anderes Panel offen oder das Panel eingeklappt, trägt er einen roten Punkt, Tooltip „Kampf (läuft)“.
  - Panel „Kampf“ ist 280px breit (die anderen Panels bleiben 240px). Inhalt: Label „Kampf vorbereiten“ bzw.
    „Kampf“ mit „Runde N“, Hinweis „Reihenfolge = Initiative“, Liste (Avatar 32px, Name, zweite Zeile; Buttons „Nach
    vorn“, „Nach hinten“, „Entfernen“), darunter „Hinzufügen“ bzw. „Verstärkung“ (Segment „Gegner“/„Verbündeter“,
    Felder Nummer und Bezeichnung, Hinweis „Nummer = Figur am Tisch. Die Bezeichnung sieht nur der Spielleiter.“,
    Button „Hinzufügen“, Enter im Feld wirkt ebenso), fehlende Spieler als „+ Vorname“, unten „Kampf starten“
    (Hauptfarbe; deaktiviert ohne Teilnehmer oder ohne aktive Szene) bzw. „Kampf beenden“.
  - „Kampf beenden“ öffnet einen Dialog „Kampf beenden?“ mit „Reihenfolge, Runde und Nummern werden verworfen.
    Szene und Abenteuer lassen sich danach wieder wechseln.“ und Decline/Confirm (wie „Szene wechseln“).
  - Dashboard im Kampf, in dieser Reihenfolge: „Am Zug“ (Hero-Karte: Avatar mit Level-Badge bei Spielern, Label
    Spielername bzw. „Gegner“/„Verbündeter“, Name, Chips Volk/Klasse bzw. Bezeichnung; Kopf „Runde N“; Fuß „Als
    Nächstes:“ bzw. „Runde N+1:“ mit Avatar und Name, Button „Zug beenden“ in Hauptfarbe; ohne Zug „Niemand am Zug –
    alle Teilnehmer sind ausgeschieden.“), „Initiative · N“ (Kompakt-Liste in Reihenfolge mit Zahl je Art, aktive
    Zeile mit Rahmen in Hauptfarbe und „Am Zug“, Totenkopf je Zeile), „Audio“, „Spieltisch“. Bühne und Party
    (samt Level) sind während des Kampfes nicht zu sehen.
  - Fläche der Spieler-Avatare richtet sich nach dem Untergrund: direkt auf der Kachel (Hero in „Am Zug“, Avatar bei
    „Als Nächstes“) `background`, auf Zeilen mit Fläche `background` (Initiative, Liste im Panel „Kampf“, Party)
    `secondary`. NPC-Avatare behalten überall die Farben ihrer Art (Entscheidung nach Runde 1).
  - Farbrollen `negative` und `positive` (je `text`, `surface`, `border`, in beiden Themes gleich) statt
    `combatant.enemy`/`combatant.ally`: `negative` Text `#ff6b6b`, Fläche `#290000`, Rand `#ff2424` – Gegner-Avatar,
    markierter Totenkopf, Fehlertext im Panel „Kampf“, Schloss im Hinweis „Kampf läuft“, Punkt am Menüpunkt;
    `positive` `#3fd033`, `#072900`, `#099000` – Verbündeten-Avatar. Fläche und Rand teilen ihre Werte mit
    `resource.special` bzw. `resource.action` über gemeinsame Konstanten in den Theme-Dateien (die Rollen bleiben
    getrennt, Ressourcen-Farben tragen eine andere Bedeutung); neu sind nur die beiden Textfarben. Die Rollen sind
    auch für spätere Effekt-Chips (positiv/negativ) gedacht. Kontrast der Textfarben auf `secondaryTranslucent`
    messen und in `contrast.md` eintragen (Entscheidung nach Runde 1). Dass in Tavern die Hauptfarbe ebenfalls rot
    ist, bleibt so (Entscheidung im Dialog).

### E10: Schnitt in zwei Schritte
- **Entscheidung:** Ein Task, zwei vertikale Schritte (je lauffähig, je eine Review-Runde möglich): Schritt 1
  Vorbereiten, Starten, Zug beenden, Beenden, Sperre; Schritt 2 Bearbeiten im Kampf (ausgeschieden, Verstärkung,
  umsortieren, entfernen). In Schritt 1 zeigt das Panel „Kampf“ im Kampf die Liste ohne Bearbeiten.

## Subtasks

### Schritt 1: Kampf vorbereiten, führen und beenden

#### Vertrag
- [x] `FightState`, `Combatant`, `CombatantCreate`, `FightStart`, `TurnRequest` (E3); `GET`/`POST`/`DELETE
      /table/fight`, `POST /table/fight/turn`; 409 bei Szenen- und Abenteuerwechsel (E6). `openapi.json` und
      `schema.d.ts` neu erzeugen.

#### Backend
- [x] Models `Fight`, `Combatant`, Migration `0007` (E2), Migrationstest wie `test_migration_0006.py`.
- [x] Service/CRUD: Kampf starten (Validierung E3, E7), Zug beenden (E5), beenden.
- [x] Sperre in `services/game_table.py` und `services/adventure.py` (E6).
- [x] WebSocket `fight` nur an Admins, beim Verbinden und nach Änderungen (E4).
- [x] Tests: Start inkl. aller 409/422; Zugwechsel (Überspringen, Rundenwechsel, veraltetes
      `from_combatant_id`); Sperre beider Wechsel, gleicher Wert erlaubt; Push nur an Admins, neuer Admin erhält den
      Kampf; Kampf nach Neustart lesbar (DB); Löschen von Abenteuer/Szene/Spieler kaskadiert.

#### Frontend
- [x] Modelle in `src/models/models.ts`; `fight` in `parseServerMessage`, Bereitstellung im Context (nur Admin).
- [x] Navigationsleiste: Menüpunkt „Kampf“ mit Punkt (E9); `nextOpenPanel` erweitern; Panelbreite 280px.
- [x] Panel „Kampf“: Vorbereitung als lokaler Zustand (E1, E7), Start, Liste im Kampf (ohne Bearbeiten),
      „Kampf beenden“ mit Dialog. Reine Logik (Vorbelegung, kleinste freie Nummer, Prüfung, Verschieben) als
      Funktionen in `src/utils/` mit Unit-Tests.
- [x] Dashboard: „Am Zug“ (bestehende `PlayerHeroCard` nutzen bzw. erweitern) und „Initiative“ (auf Basis von
      `PlayerListItem`), Reihenfolge der Panels (E9); Farbrolle in beiden Themes.
- [x] Sperre: Szenenliste und Abenteuer-Auswahl (E6).
- [x] Speicherfehler über die bestehende Hinweisleiste mit „Erneut versuchen“.
- [x] BDD `adminFight.feature`: vorbereiten, starten, Zug beenden mit Rundenwechsel, Szene gesperrt, beenden.
      Jedes Szenario beendet einen offenen Kampf im Aufräumen, damit die anderen Suites Szenen wechseln können.

#### Doku
- [x] `docs/screens.md` (Admin Soll/Ist), `docs/architecture.md` (Datenmodell, Migration, Endpoints, WebSocket,
      Synchronisation), `docs/domain.md` (Kampf, Kampfteilnehmer, Runde, Initiative, Nummer; „NPC“ ohne
      Datenmodell anpassen), `frontend/DESIGN.md` und `frontend/docs/design/` (Farbrolle, Kontrast, Panelbreite,
      Bausteine), `frontend/CLAUDE.md`, `backend/CLAUDE.md`.

### Schritt 2: Bearbeiten während des Kampfes

#### Vertrag
- [x] `POST /table/fight/combatants`, `PATCH`/`DELETE /table/fight/combatants/{id}`, `PUT /table/fight/order` (E3);
      `openapi.json`, `schema.d.ts`.

#### Backend
- [x] Endpoints mit Regeln aus E5 (Entfernen des aktiven, Zurücknehmen bei niemand am Zug) und E7.
- [x] Tests: je Endpoint Erfolg, 404, 422; Umsortieren ohne Constraint-Verletzung; Push nach jeder Änderung.

#### Frontend
- [x] Panel „Kampf“ im Kampf: ↑/↓ (sendet die ganze Reihenfolge), Entfernen, „Verstärkung“, fehlende Spieler.
- [x] Initiative: Totenkopf mit „Tot“/„Besiegt“ (E8).
- [x] BDD: Ausgeschiedene werden übersprungen, Verstärkung erscheint am Ende, Entfernen des aktiven Teilnehmers.

#### Doku
- [x] Wie Schritt 1, um Bearbeiten und Ausscheiden ergänzt.

## Akzeptanzkriterien

### AK1: Vorbereitung (Schritt 1)
- **Given** ein Abenteuer mit vier Spielern und aktiver Szene, kein Kampf
- **When** der Spielleiter in der Navigationsleiste auf „Kampf“ klickt
- **Then** zeigt das Panel „Kampf vorbereiten“ mit allen vier Spielern in der Reihenfolge der Party
- **When** er „Gegner“ wählt, Bezeichnung „Ghul“ eingibt und „Hinzufügen“ klickt
- **Then** steht „Gegner 1“ mit „Ghul“ und roter Nummer 1 am Ende der Liste, das Nummernfeld schlägt 2 vor
- **When** er die Nummer 1 noch einmal hinzufügen will
- **Then** erscheint „Nummer 1 ist schon vergeben.“ und die Liste bleibt unverändert
- **When** er Einträge mit „Nach vorn“/„Nach hinten“ verschiebt oder einen Spieler entfernt
- **Then** ändert sich die Reihenfolge entsprechend, der entfernte Spieler ist per „+ Vorname“ wieder hinzuzufügen

### AK2: Kampf starten (Schritt 1)
- **Given** eine vorbereitete Liste und zwei geöffnete Admin-Fenster
- **When** der Spielleiter „Kampf starten“ klickt
- **Then** zeigen beide Fenster im Dashboard „Am Zug“ mit dem ersten Teilnehmer und „Runde 1“, darunter „Initiative“
  in der vorbereiteten Reihenfolge, dann „Audio“ und „Spieltisch“; Bühne und Party sind ausgeblendet
- **And** ohne aktive Szene ist „Kampf starten“ deaktiviert

### AK3: Zug beenden (Schritt 1)
- **Given** ein laufender Kampf mit drei Teilnehmern, der zweite ist am Zug
- **When** der Spielleiter zweimal „Zug beenden“ klickt
- **Then** ist der erste Teilnehmer am Zug und die Runde um 1 höher; „Als Nächstes“ zeigt jeweils den Folgenden
- **And** ein Doppelklick auf „Zug beenden“ schaltet nur einen Zug weiter

### AK4: Szene und Abenteuer gesperrt (Schritt 1)
- **Given** ein laufender Kampf
- **When** der Spielleiter im Panel „Szenen“ auf eine andere Szene klickt
- **Then** öffnet sich kein Dialog, der Hinweis „Kampf läuft …“ steht über der Liste, die Szene bleibt
- **And** die Abenteuer-Auswahl ist deaktiviert und zeigt ein Schloss
- **And** `PATCH /adventures/{id}` mit anderer Szene bzw. `PATCH /table` mit anderem Abenteuer antwortet 409

### AK5: Kampf beenden (Schritt 1)
- **Given** ein laufender Kampf
- **When** der Spielleiter „Kampf beenden“ klickt
- **Then** fragt der Dialog „Kampf beenden?“; „Decline“ lässt alles unverändert
- **When** er „Confirm“ klickt
- **Then** zeigen alle Admin-Fenster wieder Bühne und Party, das Panel „Kampf vorbereiten“ mit allen Spielern, und
  Szene sowie Abenteuer lassen sich wieder wechseln

### AK6: Kampf bleibt erhalten (Schritt 1)
- **Given** ein laufender Kampf in Runde 3
- **When** der Admin neu geladen oder die API neu gestartet wird
- **Then** zeigt der Admin denselben Kampf mit Reihenfolge, Runde und Zug; der Menüpunkt „Kampf“ trägt den Punkt,
  solange ein anderes Panel offen ist

### AK7: Ausscheiden (Schritt 2)
- **Given** ein laufender Kampf mit Spieler A, Gegner 1 und Spieler B, A ist am Zug
- **When** der Spielleiter bei Gegner 1 auf den Totenkopf klickt und dann „Zug beenden“
- **Then** ist Gegner 1 ausgegraut mit „Besiegt“, und B ist am Zug
- **When** er bei Spieler A auf den Totenkopf klickt
- **Then** steht bei A „Tot“, A wird beim Zugwechsel übersprungen
- **When** er erneut auf den Totenkopf von A klickt
- **Then** ist A wieder im Kampf und kommt in der Reihenfolge wieder dran

### AK8: Verstärkung, Umsortieren, Entfernen (Schritt 2)
- **Given** ein laufender Kampf
- **When** der Spielleiter unter „Verstärkung“ einen Gegner hinzufügt
- **Then** steht er in allen Admin-Fenstern am Ende der Initiative, mit der nächsten freien Nummer
- **When** er einen Teilnehmer per „Nach vorn“ verschiebt
- **Then** ändert sich die Reihenfolge in Panel und Initiative, der aktive Zug bleibt beim selben Teilnehmer
- **When** er den Teilnehmer entfernt, der am Zug ist
- **Then** ist der nächste nicht ausgeschiedene am Zug, die Runde bleibt gleich

### AK9: Speicherfehler (Schritt 1 und 2)
- **Given** das Backend lehnt eine Kampf-Änderung ab oder ist nicht erreichbar
- **When** der Spielleiter startet, „Zug beenden“ klickt oder die Liste im Kampf ändert
- **Then** ändert sich in keinem Admin-Fenster etwas, die Hinweisleiste „Änderung konnte nicht gespeichert werden“
  erscheint, „Erneut versuchen“ wiederholt den Schreibzugriff

## Teststrategie / Verifikation

**Automatisch**
- Backend: Tests wie in den Subtasks; `ruff`, `mypy`, `make check-quality`, `pytest` grün; `openapi.json` aktuell.
- Frontend: Unit-Tests für die Logik in `src/utils/` und `parseServerMessage`; BDD `adminFight.feature`; Lint,
  Typecheck, Build, knip, jscpd grün; `schema.d.ts` aktuell.

**Manuell**
1. Zwei Admin-Fenster, Vorbereitung mit zwei Gegnern und einem Verbündeten, starten, mehrere Runden spielen
   (AK1–AK3), in beiden Themes mit dem Mockup vergleichen.
2. Szene und Abenteuer wechseln wollen (AK4); API neu starten, Admin neu laden (AK6); beenden (AK5).
3. Schritt 2: Teilnehmer ausscheiden lassen, Verstärkung, umsortieren, aktiven entfernen (AK7, AK8); Backend
   stoppen und eine Änderung versuchen (AK9).

## Offene Fragen

Keine.

## Review

### Runde 1 – 2026-11-04
**Empfehlung:** Abnahme

Geprüft: Commit `684e876` gegen Basis `d757c38`. Alle 9 AK erfüllt (Code, Backend-Tests 308/308 auf frischer DB,
Unit-Tests). Manuelle Prüfschritte 1–3 (Mockup-Vergleich in beiden Themes) stehen noch aus.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `initialPreparation`, `useFightPreparation.ts`, `numberError`, `moveItem`/`missingPlayers`; `fight.spec.ts`, BDD „I prepare a fight“ |
| AK2 | erfüllt | Dashboard-Reihenfolge in `AdminScreen.tsx`; `push_fight` → `send_admins`; `test_every_change_is_pushed` |
| AK3 | erfüllt | `end_turn` mit `with_for_update`, veraltetes `from_combatant_id` ignoriert; `test_stale_end_turn_changes_nothing` |
| AK4 | erfüllt | Sperre in `SideBarLeftElement`, `SceneNavigation.tsx`, `AdventureSelect`; Server `check_unlocked`; Tests zu 409 |
| AK5 | erfüllt | `ConfirmDialog` + `runSave(endFight)`; `test_end_deletes_the_fight`, BDD „I end the fight“ |
| AK6 | erfüllt | Migration `0007`, `test_fight_survives_a_restart`, `test_new_admin_receives_the_running_fight`; Punkt in `NavRail.tsx` |
| AK7 | erfüllt | Totenkopf mit `aria-pressed` (`InitiativePanel.tsx`); Tests zu besiegten Teilnehmern, BDD „Defeated combatants are skipped“ |
| AK8 | erfüllt | `test_added_combatant_is_appended`, `test_reorder_keeps_the_turn_…` (Constraint deferred), `test_removing_the_active_combatant_…` |
| AK9 | erfüllt | Schreibzugriffe über `runSave` → bestehende Hinweisleiste; `test_failed_and_stale_changes_are_not_pushed`; kein eigener Frontend-Test |

**Blockierende Befunde**
- keine

**Hinweise**
- `GET /table/fight` ohne aktives Abenteuer liefert `null` statt 409 – weicht vom Wortlaut von E3 ab, passt aber zum
  Push (E4); dokumentiert in `docs/architecture.md`, Test `test_get_returns_null_without_active_adventure`. Entscheidung beim User.
- Normale statt gedämpfter Textfarbe auf der Kachel folgt `DESIGN.md` (Tavern verfehlt 4,5:1). Plausibel.
- Hero-Karte (24px semibold, ohne Fläche) entspricht dem Mockup; `PlayerHeroCard` → `HeroCard`.
- Neue Icons selbst gezeichnet, `fill="currentColor"`.
- CORS weiter nur GET/PATCH, wie bisher bei `POST /table/sounds` – bestehende Lücke, ggf. in `docs/known-issues.md` aufnehmen.
- Test-Helfer: `receive_any` überspringt `fight`, keine Assertion aufgeweicht; `TRUNCATE` in `test_seed.py` nötig.
- 3 rote BDD-Szenarien (`adminDashboard`, `screenFullscreen`) hängen nicht an DND-43: `screenFullscreen` einzeln grün,
  keine 409/5xx im API-Log, Aufräumschritte in `adminFight` greifen.
- In der Dev-DB lief zum Prüfzeitpunkt ein manuell gestarteter Kampf (`fight` 337); vor dem nächsten E2E-Lauf beenden.
  Robuster wäre `DELETE /table/fight` im Setup der anderen Suites (nicht im Plan).
- Kleinigkeiten: `RowInfo` jetzt `flex: 1 1 auto`; endet der Kampf in einem anderen Fenster, bleibt ein offener
  „Kampf beenden?“-Dialog stehen (Confirm → 404 + Hinweisleiste); Kontrast von `combatant.enemy.text` auf
  `secondaryTranslucent` nicht gemessen.

**Checks:** Backend ruff, format, mypy, `make check-quality`, OpenAPI ohne Diff; pytest 308/308 (frische DB).
Frontend lint, typecheck, unit 262/262, build, knip, jscpd 0,85 %, `generate:api` ohne Diff. E2E nur `screenFullscreen`
(2/2); Gesamtlauf nicht gestartet, um den laufenden manuellen Kampf nicht zu beenden.

### Runde 2 – 2026-11-04 (Feedback User)
**Empfehlung:** Nacharbeiten

Manueller Vergleich mit dem Mockup (offen aus Runde 1) durch den User, dazu Prüfung der neuen Farbrollen. Diese
Runde betrifft nur Farben; die Entscheidungen stehen in E9 (markiert „Entscheidung nach Runde 1“).

**Blockierende Befunde**
- [x] Spieler-Avatar in „Am Zug“ (und bei „Als Nächstes“) hat `secondary` und hebt sich nicht von der Kachel ab;
      `CombatantAvatar.tsx` setzt für Spieler immer `secondary` – Fläche nach Untergrund wie in E9.
- [x] `combatant.*` dupliziert vier Werte von `resource.special`/`resource.action`: ersetzen durch
      `negative`/`positive` mit gemeinsamen Konstanten (E9); Nutzungen in `CombatantAvatar.tsx`,
      `InitiativePanel.tsx`, `FightPanel.tsx`, `SceneNavigation.tsx`, `NavRail.tsx`; `DESIGN.md`, `contrast.md`
      (inkl. Kontrast auf `secondaryTranslucent`) und `components.md` nachziehen.

**Hinweise**
- Nicht Teil dieser Runde: die Höhe des Panels „Am Zug“ (Avatar 96×128, Badge 36px statt 80×104 und 32px im
  Mockup) bleibt, ebenso der offene Dialog „Kampf beenden?“, wenn der Kampf in einem anderen Fenster endet.
- Weitere Abweichungen zum Mockup außerhalb des Panels „Am Zug“ sind nicht gemeldet.
