# DND-15: E2E-Tests und SceneDetailMock an aktuellen Stand anpassen

**Typ:** fix
**Status:** Im Review

## Kontext & Ziel
Die BDD/E2E-Tests (`frontend/__tests__/bdd/`, jest-cucumber + Selenium) sind teilweise veraltet: Der Ground-Screen-Test
sucht einen Selektor, den es nicht mehr gibt, und die Tests nutzen noch die alten Begriffe „fight / none fight“ sowie
feste Wartezeiten. Der Unit-Test-Mock `SceneDetailMock.json` entspricht nicht mehr dem Modell `SceneDetail`. Betroffen
sind nur Entwickler; am Spieltisch merkt man nichts davon. Ziel: `npm run test:e2e` läuft lokal gegen das
Seed-Backend grün, und der Mock entspricht der echten Backend-Antwort. Quelle: `docs/known-issues.md`.

## Fehlerbild

**Reproduktion**
1. `./script.sh dev` im Root (Backend mit Seed-Daten auf :8000).
2. In `frontend/`: `npm run test:e2e`.

**Ist:** Szenario „I select a fight scene to see the battle map at the ground screen“ schlägt fehl (`NoSuchElementError`
für `[data-test-id="groundImg"]`). `SceneDetailMock.json` enthält `"fight"` statt `"main"` und `music` als Objekt
statt Array; das fällt nicht auf, weil `tsconfig.app.json` nur `src` typprüft und vitest nicht typprüft.
**Soll:** Alle E2E-Szenarien laufen grün. Der Mock hat die Form von `SceneDetail` (`main: boolean`, `music: Music[]`).

## Ursache
- `frontend/src/screens/GroundScreen.tsx:102-103`: `BackgroundMedia` (img bzw. video) trägt keine `data-test-id` mehr
  (beim Umbau des Ground Screens entfallen), der Test fragt sie aber noch ab
  (`frontend/__tests__/bdd/steps/selectFightScene.ts:61`).
- `frontend/__tests__/unit/SceneDetailMock.json`: Das Feld `fight` wurde im Modell zu `main` umbenannt
  (`frontend/src/models/models.ts`), `music` wurde zu `Music[]`; der Mock wurde dabei nicht nachgezogen.

## Scope / Non-Goals

**Im Scope**
- Ground Screen: `data-test-id='groundImg'` an `BackgroundMedia`, für Bild **und** Video.
- E2E-Selektor für das Ground-Bild wieder lauffähig.
- `SceneDetailMock.json` an `SceneDetail` angleichen.
- BDD-Tests aufräumen: Begriffe, Typen und doppelte Helper, feste `sleep`s.
- Doku: Known Issue entfernen, Hinweis „teilweise veraltet“ in `docs/architecture.md` aktualisieren.

**Nicht im Scope**
- E2E-Tests in CI (wäre ein eigener `setup`-Task).
- Neue Szenarien bzw. zusätzliche Abdeckung (z. B. Player Screen, Musik).
- Sonstige Änderungen an Screens oder Komponenten.
- `public/story/fight/` und `musicTitle.spec.ts` (`fight.mp3` ist ein echter Dateiname).

## Entscheidungen

### E1: Test-ID im Produktivcode statt Workaround im Test
- **Entscheidung:** `BackgroundMedia` im Ground Screen bekommt wieder `data-test-id='groundImg'` (img und video).
- **Verworfene Alternativen:** Selektor über `img[alt="Background"]`, ohne Änderung am Code.
- **Begründung:** Stabiler Selektor, der nicht vom Alt-Text abhängt. Konsistent mit `wallImg` im Wall Screen.

### E2: Mock vollständig ans Modell angleichen
- **Entscheidung:** `fight` → `main`, `music` als Array (`Music[]`), und zwar in allen Einträgen. Die Werte bleiben
  erhalten (die ersten drei Einträge `main: true`, der vierte `main: false`).
- **Verworfene Alternativen:** nur `fight` → `main`.
- **Begründung:** Der Mock soll die echte Backend-Antwort abbilden.

### E3: Begriffe in den BDD-Tests angleichen
- **Entscheidung:** Feature-/Step-Dateien, Feature-Titel, Szenarien und Steps von „fight / none fight“ auf
  Kampfszene/Nicht-Kampfszene im Code-Vokabular umstellen: `selectMainScene.feature`/`.ts` und
  `selectSideScene.feature`/`.ts`, Texte z. B. „I select a main scene …“, „When I click on a main scene“, Variablen
  `mainScene`, `sideScene` usw. Die Feature-Texte bleiben englisch. Asset-Pfade wie `wall_screen/fight.jpg` bleiben
  unverändert (echte Dateinamen).
- **Begründung:** Begriffsregel aus `CLAUDE.md` (`fight` ist eine Altbezeichnung).

### E4: Kleinkram in den Step-Dateien
- **Entscheidung:** `getRandomNumber` typisieren und nicht in jeder Datei neu definieren, sondern als gemeinsamen Helper
  ablegen (z. B. `__tests__/bdd/steps/helpers.ts`; Basis-URL und Driver-Aufbau dürfen mit hinein). Zufallsbereich der
  Kampfszene in allen Szenarien einheitlich `1–25` (25 Kampfszenen im Seed, `backend/src/db/data/seed_data.json`).
- **Hinweis:** Der Helper darf nicht unter `testMatch` (`**/__tests__/bdd/steps/*.ts`) als Testdatei laufen. Wahlweise
  den Helper außerhalb von `steps/` ablegen (z. B. `__tests__/bdd/support/`) oder `testMatch` passend einschränken.

### E5: Explizite Waits statt fester sleeps
- **Entscheidung:** `sleep(ms)` vollständig durch `driver.wait(until.elementLocated(…), timeout)` bzw.
  `until.elementIsVisible`/eine Bedingung auf das `src`-Attribut ersetzen. Bei Klicks auf `await` achten
  (`map.click()` wird bisher nicht abgewartet). Der Timeout pro Wait muss unter dem jest-`testTimeout` (10 s) liegen.
- **Begründung:** Robuster und schneller als feste Wartezeiten.

### E6: Nachweis lokal, nicht in CI
- **Entscheidung:** `npm run test:e2e` wird lokal gegen das laufende Dev-Backend (`./script.sh dev`, Seed-Daten) mit
  Chrome ausgeführt. Die Ausgabe wird im Review dokumentiert.

## Subtasks

### Frontend
- [x] `src/screens/GroundScreen.tsx`: `data-test-id='groundImg'` an beiden `BackgroundMedia` (img und video).
- [x] `__tests__/unit/SceneDetailMock.json`: `fight` → `main`, `music` als Array (E2).
- [x] BDD: gemeinsamen Helper anlegen (typisiertes `getRandomNumber`, ggf. Basis-URL/Driver), `testMatch` beachten (E4).
- [x] BDD: Feature- und Step-Dateien umbenennen und Texte und Variablen angleichen (E3).
- [x] BDD: Zufallsbereich der Kampfszene einheitlich 1–25 (E4).
- [x] BDD: `sleep` durch explizite Waits ersetzen, Klicks abwarten (E5).
- [x] Regressionsnachweis: `npm run test:e2e` vor dem Fix (Ground-Szenario rot) und danach (alle grün) lokal ausführen.

### Doku
- [x] `docs/known-issues.md`: Eintrag zu E2E-Tests/`SceneDetailMock.json` entfernen.
- [x] `docs/architecture.md` (Test-Tabelle, Zeile E2E): „teilweise veraltet“ entfernen; Hinweis, dass die Tests das
  Seed-Backend voraussetzen, beibehalten.
- [x] `frontend/CLAUDE.md` nur anpassen, falls sich Befehle oder die Teststruktur (z. B. der Helper-Ordner) ändern.

## Akzeptanzkriterien

### AK1: Ground-Szenario wieder lauffähig
- **Given** das Dev-Backend läuft mit Seed-Daten, und der Admin Screen ist geöffnet
- **When** eine Kampfszene ausgewählt, im Dialog bestätigt und der Ground Screen geöffnet wird
- **Then** findet der Test das Element `[data-test-id="groundImg"]`, und sein `src` ist das Bild der gewählten Szene

### AK2: Regressionstest
- `npm run test:e2e` ist lokal vor dem Fix im Ground-Szenario rot und danach in allen Szenarien grün (Ausgabe im
  Review). Bei einem Video als Ground-Medium trägt das `<video>` dieselbe Test-ID.

### AK3: Mock entspricht dem Modell
- `SceneDetailMock.json` enthält kein `fight` mehr. Jeder Eintrag hat `main: boolean` und `music` als Array.
  `npm run test:unit` ist grün.

### AK4: BDD-Tests aufgeräumt
- In `__tests__/bdd/` kommt „fight“ nur noch in echten Asset-Pfaden vor (`wall_screen/fight.jpg`).
- Kein `sleep`/`setTimeout` mehr in den Step-Dateien.
- `getRandomNumber` ist typisiert und nur einmal definiert; der Helper wird nicht als Testdatei ausgeführt.
- Der Zufallsbereich der Kampfszene ist überall 1–25.

### AK5: Keine weiteren Verhaltensänderungen
- Außer dem `data-test-id`-Attribut im Ground Screen bleibt der Produktivcode unverändert. Lint, Typecheck, Unit-Tests
  und Build sind grün.

## Teststrategie / Verifikation

**Automatisch**
- Frontend (Unit): `npm run test:unit` (insbesondere `utils.spec.ts` mit dem angepassten Mock).
- Frontend (BDD/E2E): `npm run test:e2e` lokal, Backend per `./script.sh dev` mit Seed-Daten; Chrome muss installiert
  sein (Selenium Manager lädt den Driver).
- `npm run lint`, `npm run typecheck`, `npm run build`.

**Manuell**
1. Ground Screen im Browser öffnen und im DOM prüfen, dass das Hintergrundbild `data-test-id="groundImg"` trägt.
2. Optisch keine Änderung am Ground Screen.

## Offene Fragen
- keine

## Review
