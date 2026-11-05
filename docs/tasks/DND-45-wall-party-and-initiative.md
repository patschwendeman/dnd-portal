# DND-45: Party und Initiative auf dem Wall Screen, Glas-Look für Wall und Ground

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Den Kampf (DND-43) sieht bisher nur der Spielleiter im Admin; die Spieler am Tisch wissen nicht, wer am Zug ist.
Dieser Task bringt die Spieler auf die Wall: ohne Kampf als Kacheln am linken und rechten Rand, im Kampf als
Initiative-Leiste am oberen Rand, die nach jedem Zug nachrückt (Mockups
[wall-party-mockup.html](../../frontend/docs/design/mockup/wall-party-mockup.html) und
[wall-fight-mockup.html](../../frontend/docs/design/mockup/wall-fight-mockup.html)). Dazu bekommen alle Panels und
Overlays auf Wall und Ground den Glas-Look der Admin-Kacheln. Am Spieltisch sieht jeder auf einen Blick, wer am Zug
ist, wer folgt und in welcher Runde der Kampf steht.

## Scope / Non-Goals

**Im Scope**
- Wall ohne Kampf: Party-Kacheln links und rechts.
- Wall im Kampf: Initiative-Leiste oben mit Nachrücken pro Zug, Rundentrenner und Überlauf.
- Kampf an die Walls pushen, ohne die Bezeichnungen der NPCs.
- Glas-Look für das Weltkarten-Panel der Wall und die Vollbild-Overlays von Wall und Ground.

**Nicht im Scope**
- Kampf oder Party auf Ground oder Player Screen.
- Schalter im Admin, um Party oder Initiative auf der Wall aus- oder einzublenden.
- Level, Effekte oder Trefferpunkte auf der Wall.
- Änderungen am Admin oder an der Kampflogik.
- Neue Mockups (die Entscheidungen zum Glas-Look stehen hier).

## Entscheidungen

### E1: Daten für die Wall
- **Entscheidung:**
  - Der Server schickt `fight` zusätzlich an alle Walls (direkt nach dem Verbinden und nach jeder Änderung, wie an
    die Admins), dort mit `label: null` für jeden Teilnehmer. Ground und Player bekommen weiterhin kein `fight`.
  - Die Wall lädt die Spieler des aktiven Abenteuers per `GET /adventures/{id}` beim Laden und bei jedem Wechsel
    des aktiven Abenteuers (über `loadLatest`); Ladefehler nur per `console.error`, die Wall behält den letzten
    Stand. Name, Volk, Klasse und Avatar kommen von dort.
- **Verworfene Alternativen:** Spielerdaten im `fight`-Payload (die Party ohne Kampf bräuchte sie trotzdem);
  eigene Nachricht für die Wall (gleicher Inhalt wie `fight`).
- **Begründung:** Die Bezeichnungen sieht nur der Spielleiter (DND-43, E4/E7); `GET /adventures/{id}` gibt es
  schon.

### E2: Party ohne Kampf
- **Entscheidung:** Ist eine Szene aktiv und kein Kampf läuft, zeigt die Wall die Spieler als Kacheln in der
  Reihenfolge der API: die erste Hälfte links, der Rest rechts, bei ungerader Zahl einer mehr links (2 → 1/1,
  4 → 2/2, 5 → 3/2). Jede Seite ist für sich vertikal zentriert, mit Abstand zum Rand. Kachel: Avatar (Bild, sonst
  Initialen; Fläche `background`), Vorname des Charakters, „Volk · Klasse“ (gekürzt mit „…“). Ohne aktive Szene
  zeigt die Wall wie bisher nur die Hintergrundfarbe; ohne Spieler keine Kacheln.

### E3: Initiative im Kampf
- **Entscheidung:** Läuft ein Kampf, ersetzt eine Leiste am oberen Rand (Kacheln oben bündig) die Party-Kacheln:
  - Warteschlange ab dem Teilnehmer am Zug: links groß der Aktive (Label „Am Zug“ in der Hauptfarbe – nach Review
    Runde 1 als Badge mit Fläche `primary` und Text `onPrimary`, Texte der Kacheln in `text.color` –, „Runde N“,
    Rahmen in der Hauptfarbe, voller Name, „Volk · Klasse“), rechts die Folgenden in Initiative-Reihenfolge (Vorname
    bzw. „Gegner 3“/„Verbündeter 4“).
  - NPCs: Nummer im Avatar in `negative` (Gegner) bzw. `positive` (Verbündete); nie die Bezeichnung.
  - Rundentrenner „Runde N+1“ an der Stelle, an der die Initiative-Reihenfolge von vorn beginnt (steht der Erste der
    Reihenfolge am Zug, am Ende der Leiste).
  - Besiegte NPCs erscheinen nicht (außer sie sind am Zug); tote Spieler bleiben ausgegraut mit Totenkopf am Avatar
    und „Tot“ statt „Volk · Klasse“.
  - Passen nicht alle Kacheln in die Breite, fasst eine Kachel „+N weitere“ die restlichen Teilnehmer zusammen.
  - Ist niemand am Zug (alle ausgeschieden), zeigt die Leiste die Teilnehmer ohne große Kachel.
- **Begründung:** Wie im Mockup; die große Kachel bleibt immer an derselben Stelle.

### E4: Nachrücken
- **Entscheidung:** Ändert sich der Teilnehmer am Zug, gleiten die Kacheln in etwa 0,5 s an ihre neue Position und
  Größe; wer ans Ende rückt, verblasst an der alten Stelle und kommt rechts herein; wer wegfällt, verblasst.
  Bei „Bewegung reduzieren“ im System ohne Animation. Andere Änderungen (Verstärkung, Umsortieren) dürfen ohne
  Animation erscheinen.

### E5: Glas-Look auf Wall und Ground
- **Entscheidung:** Alle Panels und Overlays auf Wall und Ground nutzen die Kachel-Fläche des Admins (`tileSurface`
  mit `$isTranslucent`: `secondaryTranslucent`, Unschärfe, Rand und Lichtkante):
  - Weltkarten-Panel der Wall: durchscheinend, liegt über Initiative-Leiste und Party-Kacheln. Solange es zu sehen
    ist, liegt darunter über dem ganzen Screen dieselbe Abdunklung wie bei den Dialogen im Admin.
  - Vollbild-Overlay auf Wall und Ground: Icon und Text sitzen in einer Glas-Kachel in der Mitte (bisher Fläche
    `background`) über der Abdunklung.
  - Initiative- und Party-Kacheln ebenfalls mit dieser Fläche.
- **Begründung:** Einheitlicher Look über alle Screens; die Weltkarte ist meist nur kurz eingeblendet.

### E5a: Eine Abdunklung für alle Overlays
- **Entscheidung:** Dialoge im Admin, Vollbild-Overlay auf Wall und Ground und die Weltkarte nutzen dieselbe
  Abdunklung: die Farbrolle `overlay` (heute 85 % Schwarz, bei den Dialogen). Das Vollbild-Overlay wechselt dafür von
  `backdrop` (50 %) auf `overlay`. `backdrop` bleibt nur für das Abdunkeln des Hintergrundbilds im Admin. Rolle und
  Verwendung in `DESIGN.md` nachziehen (Entscheidung im Dialog: vereinheitlichen; Wert der Dialoge übernommen).
- **Verworfene Alternativen:** Weltkarte nur mit `overlay` oder nur mit `backdrop`, Vollbild-Overlay unverändert.

### E6: Größen und Ebenen
- **Entscheidung:** Ausgelegt für 1920×1080, Werte als benannte Layout-Konstanten (in `screen-layouts.md`):
  - Party-Kachel 176px breit, Avatar 84×112px; Seitenabstand 32px.
  - Initiative: Leiste 32px vom oberen Rand, 48px links und rechts; kleine Kachel 168×176px mit Avatar 72×96px,
    große Kachel 240px breit mit Avatar 120×160px; Rundentrenner 72px, „+N weitere“ 96px breit; Abstand 16px.
  - Reihenfolge der Ebenen: Szenenbild < Party/Initiative < Abdunklung der Weltkarte < Weltkarte <
    Vollbild-Overlay.

## Subtasks

### Schritt 1: Glas-Look und Party

#### Frontend
- [x] Weltkarten-Panel und `FullscreenHoverOverlay` mit `tileSurface` (E5); Abdunklung `overlay` unter der
      Weltkarte und im Vollbild-Overlay (E5a); Ebenen (E6).
- [x] Wall lädt die Spieler des aktiven Abenteuers (E1).
- [x] Party-Kacheln links und rechts (E2); Aufteilung als Funktion in `src/utils/` mit Unit-Tests.
- [x] BDD: Wall zeigt die Spieler links und rechts; Weltkarte erscheint darüber.

#### Doku
- [x] `docs/screens.md` (Wall, Ground), `frontend/DESIGN.md` und `frontend/docs/design/` (Bausteine, Layout-Konstanten),
      `frontend/CLAUDE.md`.

### Schritt 2: Initiative

#### Backend
- [x] `fight` auch an Walls, mit `label: null` (E1); beim Verbinden einer Wall den laufenden Kampf senden.
- [x] Tests: Wall erhält `fight` ohne Bezeichnungen, beim Verbinden und nach Änderungen; Ground und Player nicht.

#### Frontend
- [x] `fight` im Wall-Screen bereitstellen (heute nur im Admin gefüllt).
- [x] Initiative-Leiste (E3) mit Nachrücken (E4); Warteschlange, Rundentrenner, Filter und Überlauf als Funktionen
      in `src/utils/` mit Unit-Tests.
- [x] BDD: Kampf starten → Wall zeigt die Leiste mit dem Aktiven groß und keine Party-Kacheln; „Zug beenden“ →
      nächster Teilnehmer groß; Kampf beenden → Party-Kacheln wieder da. Aufräumen wie in `adminFight`.

#### Doku
- [x] `docs/screens.md` (Wall), `docs/architecture.md` (WebSocket `fight` an Walls), `frontend/docs/design/`,
      `frontend/CLAUDE.md`, `backend/CLAUDE.md`.

## Akzeptanzkriterien

### AK1: Party ohne Kampf (Schritt 1)
- **Given** ein Abenteuer mit fünf Spielern, eine aktive Szene, kein Kampf
- **When** die Wall geöffnet ist
- **Then** stehen drei Spieler-Kacheln links und zwei rechts, jede Seite vertikal zentriert, mit Avatar bzw.
  Initialen, Vorname und „Volk · Klasse“
- **And** ohne aktive Szene zeigt die Wall keine Kacheln

### AK2: Glas-Look (Schritt 1)
- **Given** Wall und Ground sind geöffnet
- **When** die Maus über einem der Fenster steht
- **Then** liegt „Vollbild“ in einer durchscheinenden Kachel mit Rand über dem Screen, abgedunkelt so stark wie
  unter einem Dialog im Admin
- **When** der Spielleiter die Weltkarte einblendet
- **Then** ist der ganze Screen genauso abgedunkelt, und das Panel liegt durchscheinend darüber, über den
  Party-Kacheln bzw. der Initiative
- **When** er sie ausblendet
- **Then** verschwinden Panel und Abdunklung

### AK3: Initiative im Kampf (Schritt 2)
- **Given** eine Wall ist geöffnet, der Spielleiter startet einen Kampf mit Spielern, Gegnern und einem Verbündeten
- **Then** verschwinden die Party-Kacheln, oben erscheint die Leiste mit dem ersten Teilnehmer groß („Am Zug“,
  „Runde 1“) und den übrigen in Initiative-Reihenfolge, NPCs als „Gegner N“/„Verbündeter N“ ohne Bezeichnung
- **And** eine Wall, die erst danach geöffnet wird, zeigt sofort denselben Stand

### AK4: Nachrücken und Runde (Schritt 2)
- **Given** ein laufender Kampf
- **When** der Spielleiter „Zug beenden“ klickt
- **Then** rückt die Leiste nach: der bisherige Aktive steht am Ende, der Nächste groß links
- **And** nach dem Letzten der Reihenfolge zeigt die große Kachel „Runde N+1“; der Trenner steht wieder vor dem, der
  diese Runde schon dran war

### AK5: Ausgeschiedene und Überlauf (Schritt 2)
- **Given** ein laufender Kampf
- **When** der Spielleiter einen Gegner als besiegt und einen Spieler als tot markiert
- **Then** verschwindet der Gegner von der Wall, der Spieler bleibt ausgegraut mit Totenkopf und „Tot“
- **When** so viele Teilnehmer im Kampf sind, dass nicht alle in die Breite passen
- **Then** steht am Ende „+N weitere“ mit der Zahl der nicht gezeigten Teilnehmer

### AK6: Kampfende (Schritt 2)
- **Given** ein laufender Kampf
- **When** der Spielleiter den Kampf beendet
- **Then** verschwindet die Leiste, die Party-Kacheln stehen wieder links und rechts

## Teststrategie / Verifikation

**Automatisch**
- Backend: Tests wie in den Subtasks; `ruff`, `mypy`, `make check-quality`, `pytest` grün.
- Frontend: Unit-Tests für Aufteilung, Warteschlange, Rundentrenner, Filter und Überlauf; BDD für Wall; Lint,
  Typecheck, Build, knip, jscpd grün.

**Manuell**
1. Wall in 1920×1080 mit 2, 4 und 5 Spielern (Seed anpassen oder DB) neben die Mockups legen, Dark und Tavern (AK1).
2. Vollbild-Overlay auf Wall und Ground, Weltkarte ein- und ausblenden (AK2).
3. Kampf im Admin starten, mehrere Runden durchklicken, Gegner besiegen, Spieler tot markieren, Verstärkung bis zum
   Überlauf, Kampf beenden; zweite Wall nachträglich öffnen (AK3–AK6). Animation einmal mit „Bewegung reduzieren“.

## Offene Fragen

Keine.

## Review

### Runde 1 – 2026-11-05

**Empfehlung:** Nacharbeiten – ein blockierender Befund (Kontrast auf den Wall-Kacheln, `DESIGN.md` 2.6).
Funktional sind alle sechs Akzeptanzkriterien erfüllt.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `wallParty.ts` (ungerade Zahl: einer mehr links), `WallParty.tsx`, `WallScreen.tsx:171`; Unit `wallParty.spec.ts`, BDD `wallParty` grün |
| AK2 | erfüllt | `FullscreenHoverOverlay.tsx:22` nutzt `overlay`; Weltkarte in `WorldMapLayer` (`layer.panel` über `layer.tiles`), Panel `tileSurface` durchscheinend; BDD `screenFullscreen`, `wallParty` grün |
| AK3 | erfüllt | `push.py`: `wall_fight` ohne `label`, Push an Walls, Initialzustand; `test_fight.py:547/572/580/594`; `wallInitiative.ts`, `WallInitiative.tsx:126`; BDD „The wall follows the fight“ grün |
| AK4 | erfüllt | Warteschlange und Rundentrenner `wallInitiative.ts:46-62` (Unit: erster, mittlerer, letzter am Zug); Animation `useInitiativeTransitions.ts` (500 ms, nicht bei reduzierter Bewegung) nur manuell prüfbar |
| AK5 | erfüllt | `wallInitiative.ts:32-34` (besiegte NPCs weg, tote Spieler bleiben), `WallCharacterTile.tsx:156-166`, `fitToWidth` „+N weitere“; Unit grün |
| AK6 | erfüllt | `WallScreen.tsx:170-171`; BDD „ends the fight“ grün |

**Blockierende Befunde**
- [x] **Kontrast auf durchscheinenden Wall-Kacheln verfehlt `DESIGN.md` 2.6** und ist weder gemessen noch dokumentiert.
  Party- und Initiative-Kacheln liegen in `secondaryTranslucent` ohne `backdrop` direkt auf dem Szenenbild
  (ungünstigster Fall: weißes Bild). Rechnung über Weiß: `text.muted` Dark 4,32:1, Tavern 3,30:1 (Tavern über
  Schwarz 4,06:1); `primary` („Am Zug“) Dark 2,46:1, Tavern 2,62:1; Ziel 4,5:1. `text.color` erreicht das Ziel
  (6,99 / 5,13). `contrast.md:69` schließt `text.muted` auf `secondary` bereits aus.

**Hinweise**
- `docs/domain.md` zusätzlich nachgeführt (Eintrag „Kampf“); funktional kein Scope-Überschreiten.
- Gemeldete Abweichungen unkritisch: Mockup-Schriftgrößen auf nächste Tokens, `getWallScene` benannter Export,
  kein Rundentrenner ohne Teilnehmer am Zug (in `screens.md` dokumentiert).
- Veraltete Kommentare in `frontend/src/style/GlobalStyle.ts:34-35`, `:39` (Durchscheinen „nur im Admin“).
- Kachelbreiten 168/240/176 doppelt in `WallInitiative.tsx` und `WallCharacterTile.tsx` gepflegt.
- Vermutung, nicht verifiziert: `useInitiativeTransitions` bricht bei jedem Render laufende Animationen ab
  (`useLayoutEffect` ohne Abhängigkeiten); Risiko gering.
- Spieler werden nur beim Abenteuerwechsel geladen (E1); neu angelegte Spieler fehlen auf der Wall bis zum Neuladen.

**Checks:** Backend ruff, format, mypy, `make check-quality` grün; pytest 318 grün, 3 rot in
`test_adventures.py` (Dev-DB weicht vom Seed ab, nicht durch die Änderung). Frontend lint, typecheck, build,
unit 285/285, knip, jscpd grün. BDD 31/32 (rot: „audio output“, Admin-Fenster außerhalb der Tests ist Ausgabe;
„dashboard panels“ einmal flaky).

### Runde 2 – 2026-11-05

**Empfehlung:** Nacharbeiten – außer der User bestätigt das Ausgrauen toter Spieler als bewusste Ausnahme, dann
Abnahme. Befund aus Runde 1 behoben, alle sechs Akzeptanzkriterien weiter erfüllt.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | unverändert: `WallScreen.tsx:171`, `wallParty.ts`; Unit und BDD `wallParty` grün |
| AK2 | erfüllt | `FullscreenHoverOverlay.tsx:22/34`, `WallScreen.tsx:47-55`; BDD `screenFullscreen`, `wallParty` grün |
| AK3 | erfüllt | `WallInitiative.tsx:130-131`: „Am Zug“ als Badge, „Runde N“ in `text.color`; BDD „The wall follows the fight“ grün |
| AK4 | erfüllt | Logik unverändert (`wallInitiative.ts`), Unit grün; Animation nur manuell prüfbar |
| AK5 | erfüllt | `WallCharacterTile.tsx:68-70/159-170`, `fitToWidth`; Unit grün; Kontrast siehe Befund |
| AK6 | erfüllt | `WallScreen.tsx:170-171`; BDD „ends the fight“ grün |

**Befund aus Runde 1:** behoben – `Details` erbt `text.color`, `MutedLabel` entfernt, `OnTurn` als Badge
`primary`/`onPrimary` (`WallInitiative.tsx:74-79`), Kacheln weiter durchscheinend. Kontrast nachgerechnet:
`onPrimary` auf `primary` Dark 6,10, Tavern 4,72; `text.color` auf Kachel über Weiß 6,97 / 5,13; Werte stimmen mit
`contrast.md` überein.

**Blockierende Befunde**
- [x] **Tote Spieler verfehlen das Kontrastziel aus `DESIGN.md` 2.6.** Name und „Tot“ mit `DEAD_OPACITY` 0,45:
  über Weiß Dark 2,78, Tavern 2,24 (Tavern über Schwarz 2,54); Ziel 4,5:1. Der Totenkopf wird mit ausgegraut und
  erreicht auf seinem Badge nur 2,59 / 2,60 (Ziel 3:1) – damit erfüllt kein Merkmal für „tot“ das Ziel; dieser Teil
  ist nicht dokumentiert. Plan (E3/AK5) verlangt „ausgegraut“, daher Entscheidung des Users: (a) dokumentierte
  Ausnahme (dann Totenkopf in der Doku ergänzen) oder (b) nur das Avatarbild ausgrauen, Name, „Tot“ und Totenkopf
  in voller Deckkraft.
  Entscheidung User: Ausnahme dokumentiert (Variante a) – `DESIGN.md` 2.6, `contrast.md` (inkl. Totenkopf); aus
  `known-issues.md` entfernt, da bewusste Entscheidung statt Lücke.

**Hinweise**
- Rahmen der Kachel am Zug in `primary` (2,45 / 2,62 über Weiß, Ziel 3:1): nicht blockierend, Zusatzsignal
  (Badge, Größe, Position, `aria-current`); in `DESIGN.md` 2.6 und `contrast.md` dokumentiert.
- `contrast.md`: Zeile „`text.color` auf `secondaryTranslucent` ohne `backdrop`“ nennt „Tot“, das nur ausgegraut
  erscheint und allein in die `DEAD_OPACITY`-Zeile gehört.
- Hinweise aus Runde 1 umgesetzt (`GlobalStyle.ts:34-42`, `WALL_TILE_SIZE` in `WallCharacterTile.tsx:15-19`).
- Weiter offen, nicht verlangt: `useInitiativeTransitions` ohne Abhängigkeiten; Spieler nur beim Abenteuerwechsel
  geladen.
- Doku stimmig, Konventionen eingehalten, keine Regressionen.

**Checks:** Backend ruff, format, mypy, `make check-quality` grün; pytest 318 grün, 3 rot in `test_adventures.py`
(Dev-DB, wie Runde 1; ein einmaliger Abbruch mit 15 rot/60 Errors, danach zweimal stabil). Frontend lint,
typecheck, build, unit 285/285, knip, jscpd grün. BDD 30/32 (rot: „audio output“ wie Runde 1, „dashboard panels“
flaky, einzeln grün).
