# DND-14: Alte Asset-Benennungen battle/side_maps auf main/side umstellen

**Typ:** refactor
**Status:** Fertig

## Kontext & Ziel

Seit „battlemap“ in „mainmap“ umbenannt wurde, heißen die Assets noch nach dem alten Schema: Musik-Ordner
`battle_maps`/`side_maps`, Ground-Bilder `battle_N.jpg`. Dazu kommt `images/maps/` mit 25 bytegleichen Kopien der
Ground-Bilder (13 MB), auf die nur noch ein veralteter BDD-Test verweist. Ziel: Asset-Namen folgen den Code-Begriffen
`main`/`side`, das Duplikat entfällt und der Punkt „Altlasten“ in `docs/known-issues.md` wird geschlossen.

## Invarianten

- Sichtbares Verhalten bleibt unverändert: dieselben Bilder und dieselbe Musik je Szene, Musiktitel-Anzeige identisch.
- WallScreen-Button-Labels bleiben `BATTLE`/`WORLD`/`OFF`.
- API-Endpoints, Response-Form und Datenmodell unverändert – nur die `source`-Werte im Seed ändern sich.
- Dateiinhalte der Assets unverändert (nur verschoben/umbenannt, `git mv`).

## Scope / Non-Goals

**Im Scope**
- `frontend/public/assets/music/battle_maps/` → `music/main/`, `music/side_maps/` → `music/side/` (Unterordner bleiben).
- `frontend/public/assets/images/ground_screen/battle_N.jpg` → `main_N.jpg` (N = 1–25).
- `frontend/public/assets/images/maps/` löschen (Duplikat).
- Alle Referenzen anpassen: `backend/src/db/data/seed_data.json`, `frontend/src/screens/AdminScreen.tsx:4`,
  `frontend/__tests__/unit/musicTitle.spec.ts`, `frontend/__tests__/bdd/steps/selectFightScene.ts`.
- Doku nachziehen.

**Nicht im Scope**
- Button-Label „BATTLE“ (bleibt, siehe E3).
- `wall_screen/fight.jpg` und `fight` in `SceneDetailMock.json` (eigener known-issue-Punkt).
- Übrige Seed-Mängel aus known-issues (Ground „Level_up“, doppelte Musiknamen).
- Migrationen oder Seeder, der bestehende DBs aktualisiert.

## Entscheidungen

### E1: Musik-Ordner `main` / `side`
- **Entscheidung:** `assets/music/main/{boss,event,loot,normal}/…`, `assets/music/side/{forest,level_up,shop,tavern}/…`.
- **Verworfene Alternativen:** `mainmaps`/`sidemaps`, `combat`/`non_combat`.
- **Begründung:** Gleiche Begriffe wie im Code (`main`, `/maps/main`, `/maps/side`).

### E2: Ground-Bilder `main_N.jpg`
- **Entscheidung:** `ground_screen/battle_N.jpg` → `ground_screen/main_N.jpg`.
- **Verworfene Alternativen:** `room_N.jpg`, unverändert lassen.
- **Begründung:** Einheitlich mit E1.

### E3: Button „BATTLE“ bleibt
- **Entscheidung:** Label unverändert; es gilt nicht mehr als Altlast, sondern als bewusste UI-Bezeichnung.
- **Begründung:** Sichtbares Verhalten bleibt gleich; `frontend/DESIGN.md:178` sieht die vorhandenen Bezeichnungen vor.

### E4: Duplikat `images/maps/` löschen
- **Entscheidung:** Ordner löschen; der BDD-Test erwartet künftig `/assets/images/ground_screen/main_N.jpg`, also die
  Quelle, die `/maps/main` tatsächlich liefert (`backend/src/services/maps.py`: `graphics_ground.source`).
- **Begründung:** Alle 25 Dateien sind bytegleich mit `ground_screen/battle_N.jpg`; im App-Code nicht referenziert.

## Subtasks

### Backend
- [x] `seed_data.json`: alle `source`-Pfade `/assets/music/battle_maps/` → `/assets/music/main/`,
      `/assets/music/side_maps/` → `/assets/music/side/`, `/assets/images/ground_screen/battle_N.jpg` → `main_N.jpg`.
- [x] Prüfen: jeder `source`-Pfad im Seed zeigt auf eine existierende Datei in `frontend/public/` (Skript/Einzeiler, Ergebnis im Bericht).

### Frontend
- [x] Ordner/Dateien per `git mv` umbenennen (siehe Scope); `images/maps/` per `git rm` löschen.
- [x] `AdminScreen.tsx:4`: Import auf `public/assets/music/side/forest/From_Past_To_Present.mp3` (dabei doppelten `//` entfernen).
- [x] `musicTitle.spec.ts`: Pfade in den Testeingaben anpassen (erwartete Titel unverändert).
- [x] `selectFightScene.ts`: erwarteten Pfad auf `/assets/images/ground_screen/main_${n}.jpg` umstellen (3 Stellen).

### Doku
- [x] `docs/known-issues.md`: Abschnitt „Altlasten“ entfernen (oder leeren Abschnitt streichen).
- [x] `docs/domain.md` „Historische Bezeichnungen“: Hinweise auf `battle_maps`/`side_maps`/`battle_N.jpg`/„BATTLE“ entfernen bzw. auf erledigt anpassen.
- [x] `docs/architecture.md:55,82`, `backend/CLAUDE.md:70`: Beispielpfade und Asset-Liste aktualisieren (`images/maps` entfällt).
- [x] Hinweis auf nötigen DB-Reset nach dem Update (dev und Spieltisch-Stack) in `backend/CLAUDE.md` bzw. Commit-Body.

## Akzeptanzkriterien

- [x] AK1: Unter `frontend/public/assets` existieren keine `battle_maps`, `side_maps`, `battle_N.jpg` und kein `images/maps/` mehr;
      `grep -rn "battle_maps\|side_maps\|/battle_[0-9]\|images/maps" frontend/src frontend/__tests__ backend/src docs --exclude-dir=tasks` ist leer.
- [x] AK2: Jeder `source`-Pfad in `seed_data.json` verweist auf eine existierende Datei.
- [x] AK3: Alle Invarianten eingehalten – keine Verhaltensänderung (nach DB-Reset zeigen Admin, Wall, Ground dieselben Bilder/Musik wie vorher).
- [x] AK4: Lint, Typecheck, Unit-Tests, Build (Frontend) und pylint/Unit-Tests (Backend) so grün wie vorher.
- [x] AK5: Bestehende Tests inhaltlich unverändert (nur Pfad-Anpassungen).

## Teststrategie / Verifikation

**Automatisch**
- Backend: `pylint src/`, `python -m unittest …` (per Docker, siehe `backend/CLAUDE.md`).
- Frontend: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`.
- Pfad-Check aus AK2.

**Manuell**
1. DB zurücksetzen (`docker compose -f compose.dev.yaml down -v`), Stack neu starten, Seed läuft.
2. Admin: Kampfszene wählen → Ground zeigt das Bild, Musik spielt, Titel korrekt; Nicht-Kampfszene ebenso.
3. Wall: BATTLE-Raster zeigt 25 Kacheln; Default-Musik im Admin spielt.
4. Netzwerk-Tab: keine 404 auf `/assets/…`.

## Offene Fragen
- AK1 vs. Invariante: Der AK1-grep (`battle_[0-9]`) trifft weiterhin die 25 `name`-Werte `battle_1`…`battle_25` in
  `graphics_ground` (`seed_data.json:14-38`). Die Invariante erlaubt aber nur Änderungen an `source`-Werten (`name`
  wird per `/scenes/details` ausgeliefert, im Frontend nicht angezeigt). Sollen die `name`-Werte zu `main_N` werden
  (Invariante lockern) oder bleiben sie und AK1 gilt nur für Pfade (grep-Muster anpassen)?
  **Entscheidung (User): Variante b** – `name`-Werte bleiben, Invariante bleibt; AK1-grep auf Pfade eingeschränkt
  (`/battle_[0-9]`). Umbenennung der `name`-Werte als Eintrag in `docs/known-issues.md` (Backend) festgehalten.

## Review

### Runde 1 – Review 715b860

**Empfehlung:** Nacharbeiten, nur wegen der fehlenden manuellen Prüfung (AK3). Im Code keine blockierenden Befunde;
lint, typecheck, test:unit, build, pylint und unittest grün. Voraussichtlich keine Codeänderung nötig.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Keine Legacy-Assets/-Pfade (grep auf Pfade eingeschränkt, Variante b) | erfüllt | `music` → `main side`; `images` → `ground_screen wall_screen`; `find … battle_*/battle_maps/side_maps` leer; Plan-grep leer (Exit 1), auch repoweit per `git grep` ohne `docs/tasks`; `name`-Werte `battle_N` bleiben (`seed_data.json:14-38`), Known Issue in `docs/known-issues.md:25-26` |
| AK2 Jeder `source`-Pfad existiert | erfüllt | Python-Check: 77 `source`-Werte, fehlend `[]` |
| AK3 Invarianten / keine Verhaltensänderung (nach DB-Reset) | nicht prüfbar | Statisch belegt (siehe unten); manuelle Prüfung nach Teststrategie 1–4 fehlt |
| AK4 Checks so grün wie vorher | erfüllt | siehe Checks |
| AK5 Tests nur in Pfaden angepasst | erfüllt | `musicTitle.spec.ts:7,19`: nur Eingabepfade; `selectFightScene.ts:32,75,118`: nur erwarteter Pfad `ground_screen/main_${n}.jpg`, Zufallsbereiche unverändert |

**Statische Prüfung der Invarianten:**
- Alle 68 Umbenennungen `R100` (25 Ground-Bilder, 43 Musikdateien); `images/maps/` mit 25 Löschungen entfernt
- Seed: Pfad-Ersetzung auf Elternstand angewendet ergibt exakt das neue `seed_data.json` – nur `source` geändert, `name`/IDs/Reihenfolge gleich
- Dateinamen unverändert → `getMusicTitle` liefert dieselben Titel; Default-Import `AdminScreen.tsx:4` zeigt auf existierende Datei, doppelter `//` entfernt
- WallScreen-Labels `['BATTLE', 'WORLD', 'OFF']` unverändert (`WallScreen.tsx:103`)
- Services, Routen, Models, `frontend/src/models` nicht im Diff

**Scope/Konventionen:** Alle Subtasks im Diff; Doku (`docs/architecture.md:55,82`, `backend/CLAUDE.md:70`,
`docs/domain.md:22-24`, `docs/known-issues.md`) stimmt mit Code überein; `frontend/CLAUDE.md:79` außerhalb des Plans,
vom User akzeptiert; ein Commit `refactor(DND-14): …`, Body nur Stichpunkte inkl. DB-Reset-Hinweis, ohne KI-Signatur.

#### Blockierende Befunde
- [x] AK3: Manuelle Prüfung nach Teststrategie 1–4 durchführen und Ergebnis festhalten (DB-Reset, Admin/Ground mit Kampf- und Nicht-Kampfszene, Wall-BATTLE-Raster mit 25 Kacheln und Default-Musik, Netzwerk-Tab ohne 404 auf `/assets/…`; erledigt, siehe unten)

#### Hinweise (nicht blockierend)
- Kein Commit `docs(DND-14): approve plan`; Plan und README-Eintrag kamen erst mit 715b860 ins Repo (wie bei DND-12/13)
- AK1, AK2, AK4, AK5 vom Implementer vor dem Review abgehakt
- E2E (`selectFightScene.ts`) nicht ausgeführt; laut `docs/known-issues.md` ohnehin teils veraltet (`groundImg`-Selector)
- Bestehende `alt-text`-Warnung `WallScreen.tsx:164`, Datei nicht im Diff

#### Checks
- `npm run lint`: 0 Fehler, 1 Warnung (bestehende `alt-text`)
- `npm run typecheck`: grün
- `npm run test:unit`: 57/57 grün
- `npm run build`: grün
- Backend `pylint src/`: 10.00/10; `unittest`: 0 Tests, OK (wie vorher)
- Pfad-Check AK2: 77/77 vorhanden

#### Manuelle Prüfung (AK3, nach dem Review, 2026-10-10)
Lokaler Dev-Stack (`compose.dev.yaml`), Admin, Wall und Ground als Tabs im selben Browser.
1. `docker compose -f compose.dev.yaml down -v`, Stack neu gestartet, Seed gelaufen; `/scenes/details/1` liefert
   `music/side/forest/…`, Kampfszenen liefern `ground_screen/main_N.jpg` – ok. Alle 74 von den 29 Szenen referenzierten
   Assets werden vom Dev-Server ausgeliefert (kein 404, kein HTML-Fallback)
2. Admin → Fight 7 (Kampfszene): Ground zeigt `main_7.jpg`, Musik aus `music/main/boss/` spielt, aktive Szene korrekt;
   Admin → Shop (Nicht-Kampfszene): Ground `ground_screen/shop.jpg`, Wall `wall_screen/shop.jpg`, Titel „Bittersweet regrets“ – ok
3. Wall: BATTLE-Raster mit 25 Kacheln `ground_screen/main_1…25.jpg`, alle geladen; Default-Musik
   `music/side/forest/From_Past_To_Present.mp3` lädt (206, `audio/mpeg`, 302 s) – ok
4. Resource-Timing in Admin, Wall, Ground: keine Antwort ≥ 400 auf `/assets/…` – ok. Einziges `<img>` ohne `src` ist
   der verborgene Szenendialog (`Dialogue.tsx`, nicht im Diff)
