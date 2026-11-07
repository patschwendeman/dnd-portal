# DND-54: Auftritt des Admin Screens: Übergang aus der Abenteuerauswahl und Aufbau der Kacheln

**Typ:** feat
**Status:** Fertig

## Kontext & Ziel

Heute wechselt der Spielleiter hart von der Abenteuerauswahl (`/admin`) in den Admin Screen (`/admin/play`): Die
Auswahl verschwindet, der Admin steht sofort da. Künftig soll das Betreten eines Abenteuers ein kurzer, bewusster
Moment sein. Das Bild der angeklickten Abenteuerkarte wächst zum Abenteuer-Hintergrund des Admins, danach bauen sich
die Kacheln gestaffelt auf. „Abenteuer beenden“ spielt den Weg rückwärts. Betroffen ist nur der Admin (Auswahl und
Admin Screen), nicht Wall, Ground oder Player. Am Spieltisch merkt man es daran, dass der Einstieg ins Abenteuer
filmisch wirkt, ohne den Spielleiter aufzuhalten: Alles ist sofort bedienbar und nach etwa 1,4 s fertig.

Abgestimmter Mockup: https://claude.ai/artifact/VYrcxZ1MP69WxZHRtzGCsz (Ablauf und Richtungen; Dauern siehe E5).

## Scope / Non-Goals

**Im Scope**
- Übergang Auswahl → Admin: Das Kartenbild wächst zum Hintergrund (View Transition), beim Starten eines Abenteuers und
  beim Fortsetzen des aktiven Abenteuers.
- Gestaffelter Aufbau der Kacheln im Admin nach dem Übergang.
- Weiches Einblenden von Inhalten, die erst nach Beginn des Aufbaus geladen sind.
- Rückweg bei „Abenteuer beenden“: Die Kacheln blenden aus, der Hintergrund schrumpft in die Karte.
- Ohne Animation bei „Bewegung reduzieren“ und in Browsern ohne View Transitions API.
- Doku: `docs/screens.md` (Ist), `frontend/docs/design/components.md`.

**Nicht im Scope**
- Animationen auf Wall, Ground und Player (eigene Tasks).
- Animationen beim Wechsel des Menüpunkts, beim Ein- und Ausklappen des Panels und beim Aus- und Einblenden des
  Dashboards.
- Ein Schalter, um die Animationen abzuschalten (außer „Bewegung reduzieren“ im System).
- Animation in Admin-Fenstern, die einem anderen Admin-Fenster nur folgen (Abenteuerwechsel oder -ende dort).
- Neue Abhängigkeiten (keine Animations-Library).

## Entscheidungen

### E1: Übergang per View Transitions API, ohne Library
- **Entscheidung:** Step 1 läuft über `document.startViewTransition`. Die App nutzt `BrowserRouter`, das die
  `viewTransition`-Option von React Router nicht kennt. Deshalb startet der Code die Transition selbst und navigiert im
  Callback synchron (`flushSync(() => navigate(...))`). Ohne `document.startViewTransition` oder bei
  `prefers-reduced-motion: reduce` navigiert er ohne Übergang. Step 2 sind CSS-Keyframes in styled-components.
- **Verworfene Alternativen:** Motion/framer-motion (neue Abhängigkeit); eigener FLIP mit der Web Animations API über
  zwei Routen (aufwendiger, die Bilder müssten zwischen den Screens übergeben werden); Umstieg auf
  `createBrowserRouter` (großer Umbau nur für diesen Effekt).
- **Begründung:** Gemeinsame Elemente über zwei Routen sind genau der Fall, für den die API gemacht ist. Ohne
  Unterstützung im Browser fällt der Effekt einfach weg.

### E2: Variante A, das Kartenbild wird zum Hintergrund
- **Entscheidung:** Das Bild (16:9-Fläche) der angeklickten Karte und der Abenteuer-Hintergrund des Admins tragen
  denselben `view-transition-name` (z. B. `adventure-hero`). Das Bild wächst in 500 ms von der Karte auf die volle
  Fensterfläche und wird dabei dunkler, bis es so stark abgedunkelt ist wie der Hintergrund (Überblendung von hell zu
  abgedunkelt; die Abdunklung gehört zum benannten Element). Gleichzeitig sinken die übrigen Karten und der Kopf
  („Spielleiter“ / „Abenteuer wählen“) um 16px nach unten und blenden aus (260 ms). Der Rest der alten Seite, auch der
  Hintergrund des bisher aktiven Abenteuers, blendet aus (250 ms). Ein Abenteuer ohne Bild hat keine
  Hintergrundfläche: Dann gibt es nur Step 2.
- **Verworfene Alternativen:** Variante B „Vorhang“ (über Schwarz überblenden).
- **Begründung:** Ein durchgehender Moment „ich betrete dieses Abenteuer“, ohne dass der Hintergrund springt.

### E3: Das Bild liegt schon im neuen Zustand
- **Entscheidung:** Der Admin lädt sein Abenteuer erst nach der Navigation. Die View Transition hält den neuen
  Zustand aber erst fest, wenn ihr Callback fertig ist. Deshalb gibt die Auswahl beim Navigieren den Einstieg mit
  (`location.state`, z. B. `{ entrance: 'select', image: <URL des Kartenbilds> }`). Der Admin zeigt dieses Bild sofort
  als Abenteuer-Hintergrund an, ohne Überblendung (es liegt schon im Browser-Cache), bis sein eigener Stand dasselbe
  Bild liefert. Der Callback der Transition wartet höchstens `HERO_WAIT_MS` = 300 ms, bis das Bild im Admin geladen
  ist. Ist es dann nicht da, läuft der Übergang ohne wachsendes Bild (nur Ausblenden der Auswahl), Step 2 folgt wie
  geplant.
- **Begründung:** Ohne Bild im neuen Zustand hätte die Transition kein Ziel, und der Hintergrund würde nach dem
  Übergang erst noch einblenden.

### E4: Aufbau nur beim Betreten aus der Auswahl
- **Entscheidung:** Der Aufbau (Step 2) läuft nur, wenn `location.state.entrance === 'select'` ist. Der Admin liest
  den Einstieg einmal beim Mounten und löscht ihn danach (`navigate(ADMIN_PLAY_PATH, { replace: true, state: null })`),
  weil `history.state` einen Reload überlebt. Ohne Einstieg steht alles sofort da: nach einem Reload, beim Folgen
  eines anderen Admin-Fensters (Abenteuerwechsel ohne Reload), beim direkten Aufruf von `/admin/play`. Ohne View
  Transition (E1) läuft der Aufbau trotzdem, außer bei „Bewegung reduzieren“.
- **Begründung:** Der Effekt gehört zum bewussten Betreten, nicht zu jedem Laden der Seite.

### E5: Dauern, Reihenfolge und Richtungen
- **Entscheidung:** Die Werte stehen als Konstanten in der Komponente, nicht als Tokens (DESIGN.md 1.4,
  „Übergangsdauern“). Die Kurve ist überall `cubic-bezier(.2, .7, .2, 1)` (wie beim Nachrücken der Initiative), nur
  beim Ausblenden `ease-in`.
  - Step 1: `HERO_TRANSITION_MS` = 500 ms (Wachsen und Schrumpfen des Bildes).
  - Step 2: 900 ms bis die letzte Kachel steht. Jede Kachel `TILE_ENTRANCE_MS` = 380 ms, der Start jeder Kachel ist
    um `TILE_STAGGER_MS` = 65 ms × Index versetzt (Index 0–8). Jede Kachel blendet ein und gleitet dabei von ihrem
    Versatz an ihren Platz:

    | Index | Kachel | Herkunft |
    |---|---|---|
    | 0 | Kopfzeile: „Zurück \| Vor“ | 12px von oben |
    | 1 | Kopfzeile: Abenteuername | 12px von oben |
    | 2 | Kopfzeile: „Vollbild \| Dashboard“ und Navigationsleiste | von oben bzw. 16px von links |
    | 3 | Panel des Menüpunkts | 16px von links |
    | 4 | erste Notizseite | 12px von unten |
    | 5 | alle weiteren Notizseiten; erstes Dashboard-Panel (Bühne bzw. „Am Zug“) | 12px von unten bzw. 16px von rechts |
    | 6–8 | weitere Dashboard-Panels in ihrer Reihenfolge (Audio, Spieltisch, Party bzw. Initiative, Audio, Spieltisch) | 16px von rechts |
  - Die Kacheln starten erst, wenn die View Transition beendet ist (`transition.finished`); ohne Transition sofort.
    Bis dahin sind sie unsichtbar.
- **Begründung:** Dauern vom User im Mockup gewählt (500 ms / 900 ms). Die Kacheln warten aufs Bild, weil die
  Momentaufnahmen der View Transition ohne `backdrop-filter`-Unschärfe gerendert werden und die durchscheinenden
  Kacheln sonst sichtbar umspringen würden.

### E6: Sofort bedienbar, Inhalte blenden weich ein
- **Entscheidung:** Die Animationen blockieren nichts: Klicks, Tastatur und Tastenkürzel wirken die ganze Zeit
  (Keyframes nur auf `opacity` und `transform`, kein `pointer-events: none`). Notizseiten, Bühne und das Panel
  „Party“ (im Kampf „Am Zug“ und „Initiative“) zeigen Inhalte, die erst nach dem Start des Aufbaus geladen sind, mit
  200 ms Einblenden statt hart. Die Unschärfe (`backdrop-filter`) wird nie animiert.
- **Begründung:** Der Spielleiter soll nie auf eine Animation warten. Ein Weichzeichner, der animiert wird, ruckelt
  auf großen Monitoren.

### E7: Fortsetzen bekommt denselben Übergang
- **Entscheidung:** Auch ein Klick auf die Karte des aktiven Abenteuers (Fortsetzen ohne Speichern) spielt Step 1 und
  Step 2. Beim Starten eines anderen Abenteuers beginnt der Übergang erst, wenn das Speichern geklappt hat. Schlägt es
  fehl, bleibt die Auswahl wie bisher mit Hinweis und ohne Animation.
- **Begründung:** Das Betreten soll sich immer gleich anfühlen (Entscheidung des Users).

### E8: Rückweg bei „Abenteuer beenden“, immer an
- **Entscheidung:** Nach „Confirm“ im Dialog „Abenteuer beenden“ wird erst gespeichert. Klappt das, schließt der
  Dialog, dann:
  1. Alle Kacheln blenden gleichzeitig aus und schrumpfen leicht (`scale(.98)`, `TILE_EXIT_MS` = 200 ms, `ease-in`).
  2. Die View Transition zur Auswahl startet: Der Hintergrund schrumpft in 500 ms in das Bild der Karte dieses
     Abenteuers (jetzt ohne „Aktiv“), die Auswahl hat keinen Hintergrund mehr. Der Kopf und die übrigen Karten steigen
     von 16px unten auf (300 ms, Kopf ab 300 ms, Karten ab 350 ms, je Karte 60 ms später).
  - Die Auswahl lädt ihre Karten erst nach der Navigation. Der Callback wartet höchstens `HERO_WAIT_MS` (300 ms), bis
    die Karte gerendert ist. Fehlt sie dann (z. B. langsames Laden), läuft der Rückweg ohne schrumpfendes Bild (nur
    Ausblenden).
  - Es gibt keinen Schalter. Nur „Bewegung reduzieren“ oder ein Browser ohne API schalten den Rückweg ab. Schlägt das
    Speichern fehl, bleibt alles wie heute (Hinweisleiste, keine Animation).
- **Verworfene Alternativen:** Schalter in „Einstellungen → Darstellung“; gar kein Rückweg.
- **Begründung:** Entscheidung des Users: im Mockup gefallen, kein zusätzlicher Schalter.

## Subtasks

### Frontend
- [x] Hilfsmodul für den Übergang (z. B. `src/utils/viewTransition.ts`): Prüfung auf API und „Bewegung reduzieren“,
      Start mit `flushSync`, Warten auf ein Signal mit Obergrenze (`HERO_WAIT_MS`), Rückgabe von `finished`; mit
      Unit-Tests.
- [x] Globale Regeln für die Pseudo-Elemente `::view-transition-*` (Dauern und Kurven aus E5, Ausblenden der alten
      Seite, Sinken und Aufsteigen von Kopf und Karten, `object-fit: cover` und `overflow: hidden` für das Bild) an
      einer Stelle, die Auswahl und Admin teilen.
- [x] `AdminSelectScreen`: Namen für das Bild der angeklickten Karte, die übrigen Karten und den Kopf; Übergang beim
      Starten (nach erfolgreichem Speichern) und beim Fortsetzen; Einstieg per `location.state` (E3, E4).
- [x] `AdventureBackground` bzw. `useAdventureBackground`: Bild aus dem Einstieg sofort ohne Überblendung zeigen;
      Name `adventure-hero` am Hintergrund; Signal, sobald das Bild geladen ist.
- [x] `AdminScreen`: Einstieg lesen und löschen; Zustand des Auftritts (`pending` → `building` → `done`, ohne Einstieg
      gleich `done`), als `data-entrance` am Screen für Tests; Kacheln mit Index und Herkunft nach E5 (gemeinsamer
      Baustein für die Keyframes, z. B. neben `tileSurface`).
- [x] Weiches Einblenden der nachgeladenen Inhalte nach E6.
- [x] Rückweg nach E8 in `AdminScreen` (nach erfolgreichem Speichern) und Ziel-Karte in `AdminSelectScreen`.

### Doku
- [x] `docs/screens.md`, Ist von „Abenteuerauswahl“ und „Admin Screen“: Übergang, Aufbau, Rückweg, wann nichts
      animiert ist.
- [x] `frontend/docs/design/components.md`: Abschnitte „Abenteuer-Karte“, „Abenteuer-Hintergrund“ und „Kachel“
      (Auftritt mit Dauern, Reihenfolge, Herkunft, „Bewegung reduzieren“).

## Akzeptanzkriterien (nur feat)

### AK1: Abenteuer starten mit Übergang
- **Given** die Abenteuerauswahl mit mehreren Abenteuern, ein Browser mit View Transitions API, ohne „Bewegung reduzieren“
- **When** der Spielleiter ein nicht aktives Abenteuer mit Bild anklickt und das Speichern klappt
- **Then** wächst dessen Kartenbild in etwa 0,5 s zum abgedunkelten Hintergrund des Admins, die übrigen Karten und der
  Kopf sinken weg, und der Admin zeigt das Abenteuer.

### AK2: Aufbau der Kacheln
- **Given** der Übergang aus AK1 ist beendet
- **When** der Admin aufgebaut wird
- **Then** erscheinen die Kacheln in der Reihenfolge und aus der Richtung nach E5, die letzte steht etwa 0,9 s nach
  Ende des Übergangs, und `data-entrance` endet bei `done`.

### AK3: Sofort bedienbar
- **Given** der Aufbau aus AK2 läuft
- **When** der Spielleiter einen Menüpunkt, einen Button im Dashboard oder ein Tastenkürzel nutzt
- **Then** wirkt die Eingabe sofort, ohne auf das Ende der Animation zu warten.

### AK4: Fortsetzen
- **Given** die Auswahl mit einem aktiven Abenteuer
- **When** der Spielleiter dessen Karte anklickt
- **Then** laufen Übergang und Aufbau wie in AK1 und AK2, ohne dass etwas gespeichert wird.

### AK5: Kein Aufbau ohne Betreten aus der Auswahl
- **Given** der Admin ist offen und fertig aufgebaut
- **When** der Spielleiter die Seite neu lädt oder ein anderes Admin-Fenster das Abenteuer wechselt
- **Then** steht der Admin sofort da, ohne Aufbau (`data-entrance` ist direkt `done`).

### AK6: Rückweg bei „Abenteuer beenden“
- **Given** der Admin mit einem Abenteuer mit Bild
- **When** der Spielleiter „Abenteuer beenden“ bestätigt und das Speichern klappt
- **Then** blenden die Kacheln aus, der Hintergrund schrumpft in die Karte dieses Abenteuers, die übrigen Karten
  steigen auf, und die Auswahl zeigt kein aktives Abenteuer.

### AK7: Fehler beim Speichern
- **Given** das Speichern schlägt fehl (Starten in der Auswahl bzw. Beenden im Admin)
- **When** der Spielleiter klickt bzw. bestätigt
- **Then** läuft keine Animation, und es erscheint der bisherige Hinweis („Das Abenteuer konnte nicht gestartet
  werden.“ bzw. „Änderung konnte nicht gespeichert werden“).

### AK8: Bewegung reduzieren und Browser ohne API
- **Given** „Bewegung reduzieren“ ist im System an
- **When** der Spielleiter ein Abenteuer startet, fortsetzt oder beendet
- **Then** wechselt der Screen ohne Übergang und ohne Aufbau; ohne View Transitions API (aber ohne „Bewegung
  reduzieren“) wechselt er ohne Übergang, der Aufbau aus AK2 läuft.

### AK9: Abenteuer ohne Bild oder Bild zu spät
- **Given** ein Abenteuer ohne Bild, oder das Bild bzw. die Zielkarte ist nach 300 ms noch nicht da
- **When** der Spielleiter das Abenteuer startet oder beendet
- **Then** blendet die alte Seite ohne wachsendes bzw. schrumpfendes Bild aus, der Rest läuft wie in AK2 bzw. AK6.

## Teststrategie / Verifikation

**Automatisch**
- Frontend Unit: Hilfsmodul (ohne API und mit „Bewegung reduzieren“ kein Übergang, Obergrenze beim Warten);
  Ermittlung von Index und Herkunft je Kachel, falls als Funktion ausgelagert; Einstieg wird nur einmal gelesen.
- Frontend BDD (`adminAdventureSelect.feature`, `adminSettings.feature`): Betreten aus der Auswahl endet bei
  `data-entrance="done"`, nachdem es `building` war; Reload zeigt direkt `done`; Beenden landet in der Auswahl ohne
  aktives Abenteuer; bestehende Szenarien bleiben grün.
- Lint, Typecheck, Build.

**Manuell**
1. Chrome und Safari: Abenteuer starten, fortsetzen und beenden; Ablauf wie im Mockup, kein Springen von Hintergrund
   oder Kacheln, die Unschärfe ist ab dem ersten sichtbaren Frame der Kacheln da.
2. Während des Aufbaus einen Menüpunkt und „Dashboard“ klicken: wirkt sofort.
3. DevTools-Netzwerk gedrosselt: Inhalte blenden weich ein, Übergang ohne Bild nach 300 ms wie in AK9.
4. macOS „Bewegung reduzieren“ an: kein Übergang, kein Aufbau.
5. Zwei Admin-Fenster: Wechsel und Beenden im einen; das andere folgt ohne Animation. Reload von `/admin/play`: kein
   Aufbau.
6. Auf einem großen Monitor (≥ 2560px) flüssig, ohne Ruckeln.

## Offene Fragen
- (keine)

## Review

### Runde 1 – Review vom 2026-11-07 (Commit ab96baf, Gesamtstand gegen bc0df03)

**Empfehlung: Abnahme.** Es gibt keinen blockierenden Befund. Alle neun AK sind erfüllt, belegt durch Code, Unit- und BDD-Tests und eine eigene Live-Messung in headless Chrome (`document.startViewTransition` instrumentiert, `data-entrance` und `getAnimations()` mitgeschrieben; Skript außerhalb des Repos). Die fünf gemeldeten Abweichungen sind vertretbar (Hinweise 1–5); die einzige echte Abweichung vom Plan betrifft nur Listen mit mehr als 12 Abenteuern (Hinweis 5). Lint, Typecheck, Unit-Tests, Build, knip und jscpd sind grün. Im ersten E2E-Lauf waren 2 von 63 Tests rot, weil gleichzeitig jemand anderes auf den Server schrieb (Hinweis 6); die Wiederholung lief mit 63/63 grün.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Abenteuer starten mit Übergang | erfüllt | Live gestartet, als kein Abenteuer aktiv war. Vor dem Übergang trägt das `IMG` der Karte `data-view-hero`, danach das `DIV` des Admin-Hintergrunds; das Bild war innerhalb der Wartezeit da. Gemessene Dauern: `group(adventure-hero)` 500 ms, `old(adventure-select-head)` und `old(adventure-card-0)` 260 ms (Sinken), `root` 250 ms. Abdunklung: Das `::after` mit `backdrop` liegt im benannten `Layer` (`AdventureBackground.tsx:14-32`, `data-view-hero` an Zeile 68), dadurch geht das Bild von hell zu abgedunkelt über. Start erst nach dem Speichern: `AdminSelectScreen.tsx:249` `.then(() => enter(adventure))`. Regeln in `PageTransitionStyle.ts`. |
| AK2 Aufbau der Kacheln | erfüllt | Live: Transition endet bei 1791 ms, `building` bei 1818, `done` bei 2736, also nach 918 ms. Index/Herkunft/Verzögerung je Kachel wie E5: history-buttons 0/top/0 ms, adventure-name 1/top/65, Vollbild-Gruppe 2/top/130, nav-rail 2/left/130, nav-panel 3/left/195, erste Notizseite 4/bottom/260, weitere Notizseiten 5/bottom/325, Bühne 5/right/325, Audio 6/390, Spieltisch 7/455, Party 8/520. Je Kachel 380 ms, Versatz ±12px bzw. ±16px. Kampf laut Code: `dashboardTile(0..3)`, `AdminScreen.tsx:880-950`. `backdrop-filter: blur(12px)` schon beim Start des Aufbaus gesetzt. BDD „builds up … until all of them stand“ grün. |
| AK3 Sofort bedienbar | erfüllt | Live während `building`: Klick auf „Szenen“ wechselt das Panel nach 75 ms, Klick auf „Dashboard“ blendet es sofort aus. Keyframes nur auf `opacity` und `transform`, nirgends `pointer-events` (`GlobalStyle.ts`, `tileEntrance`). Tastenkürzel nicht live geprüft; laut Code blockiert nichts. |
| AK4 Fortsetzen | erfüllt | Live: Klick auf die aktive Karte startet denselben Übergang mit Bild und denselben Aufbau (918 ms). Nichts gespeichert: `AdminSelectScreen.tsx:240-243` ruft `enter` ohne `saveActiveAdventure`. BDD „I continue the active adventure“ grün. |
| AK5 Kein Aufbau ohne Betreten aus der Auswahl | erfüllt | Live nach Reload: `data-entrance` direkt `done`, `history.state.usr` nach dem Betreten `null` (`navigate(ADMIN_PLAY_PATH, { replace: true, state: null })`). BDD: Reload-Schritt und `adminSettings` „stood there at once“ grün. Folgen eines anderen Fensters nur im Code: `AdminScreen` ist nicht nach Abenteuer gekeyt (`App.tsx:72-73`), die Phase wird nur beim Mounten bestimmt. |
| AK6 Rückweg bei „Abenteuer beenden“ | erfüllt | Live: nach Bestätigen `exiting` mit 200 ms `tileOut`, nach 201 ms startet die View Transition. Hintergrund (`DIV`) wird zum Kartenbild (`IMG`), `group(adventure-hero)` 500 ms, `new(adventure-select-head)` 300 ms ab 300 ms, `new(adventure-card-0)` 300 ms ab 350 ms. Endstand: `/admin`, 0 aktive Karten, 0 Hintergrundbilder. BDD „I end the adventure“ grün. |
| AK7 Fehler beim Speichern | erfüllt | Live, `PATCH /api/table` per CDP blockiert. Starten: kein `startViewTransition`, bleibt `/admin`, Hinweis „Das Abenteuer konnte nicht gestartet werden.“. Beenden: kein `exiting`, keine Transition, bleibt `/admin/play`, Hinweisleiste „Änderung konnte nicht gespeichert werden“, Hintergrund steht. `onFailed` setzt `ending` zurück (`handleEndAdventureDialog`). |
| AK8 Bewegung reduzieren / ohne API | erfüllt | Live mit `prefers-reduced-motion: reduce` (CDP): Fortsetzen und Starten ohne Transition, Phase direkt `done`, Beenden ohne `exiting`. Ohne API: keine Transition, `pending` → `building` nach 4 ms, `done` nach rund 920 ms; Beenden ohne Rückweg. Unit-Tests `viewTransition.spec.ts` grün. |
| AK9 Ohne Bild / Bild zu spät | erfüllt | Live ohne Bild (Kartenliste per XHR-Hook ohne `image`): kein `data-view-hero`, nur `root`, Kopf und Karte sinken, danach `building` und `done`. Rückweg mit Karte zu spät (700 ms Latenz): Wartezeit 338 ms, kein Hero auf der neuen Seite, nur `old(adventure-hero)` blendet aus. „Bild zu spät“ beim Betreten nicht live erzeugbar (Cache); gleicher Code (`waitUntil`, `HERO_WAIT_MS`), per Unit-Test abgedeckt („captures the new page after the limit“). |

**Blockierende Befunde**
- keine

**Hinweise (nicht blockierend)**
1. **Zusätzlicher Zustand `exiting`:** vertretbar; E8 Schritt 1 braucht ihn. In `adminEntrance.ts` beschrieben und in `components.md` („Auftritt im Admin“) dokumentiert.
2. **Medienpfad statt URL im Einstieg:** vertretbar; E3 nennt die URL nur als Beispiel, `frontend/CLAUDE.md` verlangt `mediaUrl` (geschieht in `useAdventureBackground.ts`).
3. **`{ endedAdventureId }` an die Auswahl:** vertretbar; die Auswahl löscht den State nach dem Lesen, ein Reload sieht keinen Rückweg. `heroId` bleibt auf der beendeten Karte und wandert beim nächsten Klick per `flushSync` – unkritisch, pro Seite trägt nur ein Element den Namen.
4. **Push „kein Abenteuer“ während `ending` nicht sofort umleiten, Hintergrund halten:** vertretbar und für E8 nötig. Kein Pfad gefunden, auf dem der Admin ohne Abenteuer hängen bleibt. Vermutung, nicht beobachtet: Kommt der Push vor der REST-Antwort, zeigen die Kacheln bis `exiting` kurz „Kein Abenteuer“ im Kopf. Beim manuellen Test (Schritt 1) darauf achten.
5. **`NAMED_CARD_COUNT` = 12:** echte, kleine Abweichung von E2/E8. Ab der 13. Karte sinken/steigen die Karten nicht, sondern blenden mit der Seite aus/ein (`PageTransitionStyle.ts:13`). In `components.md` dokumentiert. Ob das reicht, entscheidet der User.
6. **E2E:** Im ersten Lauf 2/63 rot (`groundGrid` „I set the grid of all grounds“, `adminAdventureSelect` „I start an adventure while none is active“). Backend-Logs zeigen fremde `PATCH /table` mit neuen Admin-WebSockets vor und während des Laufs. Einzeln wiederholt grün, voller Lauf 63/63 grün.
7. **E6 nur eingeschränkt:** Weich eingeblendet werden nur direkte Kinder von `[data-entrance-content]`, die während `data-content-fade` neu ins DOM kommen; geänderter Text in bestehenden Elementen (z. B. „Party · N“) erscheint hart. Vermutung: Die Bühne tauscht beim Laden das ganze Kachel-Element und beginnt ihren Auftritt neu. Kein AK prüft E6 direkt; manueller Schritt 3 steht aus.
8. Die angeklickte Karte trägt selbst `adventure-card-N` und sinkt als Rahmen ohne Bild mit, während ihr Bild wächst. Laut E2 sinken nur die „übrigen Karten“. Nur visuell prüfbar (Schritt 1).
9. Manuelle Schritte offen: Safari (1), zwei Admin-Fenster (5), Monitor ≥ 2560px (6). Chrome nur headless geprüft.
10. Konventionen: `feat(DND-54): …` passt zum Plan-Typ, ein Commit, 5 Stichpunkte, keine KI-Signatur. Alle Subtasks abgehakt, nichts außerhalb des Scopes. Neue optionale Props von `AdventureBackground`/`useAdventureBackground` mit Defaults, Player und Auswahl unverändert. `screens.md` und `components.md` stimmen mit Code und Messung überein.
11. Server-Zustand nach den Checks: aktives Abenteuer 1 und `wall_overlay: join` wie vorher, `active_scene_id` 6 statt 1 (durch E2E und Live-Checks).

**Checks**
- `npm run lint`: grün, ohne Fehler und Warnungen.
- `npm run typecheck`: grün.
- `npm run test:unit`: 37 Dateien, 382/382 grün, darunter `viewTransition.spec.ts` und `adminEntrance.spec.ts`.
- `npm run build`: grün; die Warnung zur Chunk-Größe gab es schon vorher.
- `npm run check:deadcode` (knip): grün.
- `npm run check:dupes` (jscpd): grün, 0,22 %, 1 Klon (Baseline).
- E2E (`jest --runInBand` gegen `dnd-dev-api` und `dnd-dev-ui`): erster Lauf 61/63 (Hinweis 6), Wiederholung 63/63 grün.
- Live-Prüfung in headless Chrome 1920×1080: normal, reduced motion, ohne API, Beenden fehlgeschlagen, Auswahl langsam, Start fehlgeschlagen, Start ohne Bild.
