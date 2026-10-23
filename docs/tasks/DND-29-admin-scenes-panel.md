# DND-29: Menüpunkt „Szenen“ im Admin, Szenen ohne Kampf-/Nicht-Kampf-Unterscheidung

**Typ:** feat
**Status:** Fertig

## Kontext & Ziel

Bisher wählt der Spielleiter Szenen über zwei getrennte Stellen: das Kachelraster „Kampfszenen“ rechts und die
„Szenen“ (Nicht-Kampfszenen) in der Bottom-Bar. Die Trennung hängt am Flag `scene.main`. Künftig sind alle Szenen
gleich: Ob in einer Szene gekämpft wird, entscheidet nicht mehr die Szene. Einen Kampf startet der Spielleiter später
in jeder Szene über den Menüpunkt „Kampf“ (Folgetask). Dieser Task ergänzt die Navigationsleiste aus DND-28 um den
Menüpunkt „Szenen“ mit einer Liste aller Szenen des Abenteuers und entfernt `main`/`side` aus Datenmodell, API,
Admin und Wall. Am Spieltisch wählt der Spielleiter jede Szene an einer Stelle aus einer Liste.

## Scope / Non-Goals

**Im Scope**
- Menüpunkt „Szenen“ in der Navigationsleiste mit einer Liste aller Szenen des aktiven Abenteuers im Panel.
- Szenenwechsel aus der Liste mit dem bestehenden Bestätigungsdialog „Szene wechseln“.
- Entfernen der Karte „Kampfszenen“ (rechte Spalte) und der „Szenen“ in der Bottom-Bar.
- Entfernen von `scene.main` (Spalte, Migration, Seed, Schema), der Endpoints `/adventures/{id}/maps/main` und
  `/maps/side` samt Service/CRUD/Schema.
- Wall: Overlay „Kampfschauplätze“ (BATTLE) und dessen automatisches Einblenden entfernen.
- Aufräumen der dann ungenutzten Frontend-Teile, Tests und Doku.

**Nicht im Scope**
- Menüpunkt „Kampf“ und alles, was ein Kampf auf Wall oder Ground zeigt (Folgetask).
- Eigene Sortierung, Suche, Filter oder Gruppen in der Szenenliste; Anlegen/Bearbeiten von Szenen.
- Vorschaubilder in der Liste.
- Umbenennen alter Asset-Pfade (`music/main/`, `images/ground_screen/main_N.jpg`, `images/wall_screen/…`); sie bleiben
  als Altbezeichnungen.
- Inhalte der Szenen im Seed (Namen wie „Fight 1 [lvl. 6]“ bleiben).
- Platzhalter „Enemies“/„Loot“ in der Karte „Aktive Szene“; Nutzung des freien Platzes rechts und in der Bottom-Bar.
- Weltkarte auf der Wall (WORLD) bleibt inhaltlich unverändert.

## Entscheidungen

### E1: Alte Szenenauswahl im Admin entfällt
- **Entscheidung:** Karte „Kampfszenen“ (rechte Spalte) und „Szenen“ in der Bottom-Bar werden entfernt. Szenen wählt
  der Spielleiter nur noch im Panel „Szenen“. Rechts bleibt die Karte „Aktive Szene“, die Mitte der Bottom-Bar bleibt
  leer (Musik links bleibt, wo sie ist).
- **Verworfene Alternativen:** Kachelraster aller Szenen als zusätzliche Übersicht rechts behalten.
- **Begründung:** Eine Stelle für die Szenenauswahl; das Raster ergab nur mit Kampfszenen als „Räume“ Sinn.

### E2: Wall ohne Overlay „Kampfschauplätze“
- **Entscheidung:** Das Overlay „Kampfschauplätze“ und der Button BATTLE entfallen; die Steuerleiste zeigt WORLD,
  OFF und AUDIO, Start ist OFF. Ein Szenenwechsel blendet kein Overlay mehr ein; eine offene Weltkarte wird beim
  Szenenwechsel wie bisher geschlossen. Die Weltkarte passt vollständig über die Steuerleiste (Breite bisher aus dem
  Kampfszenen-Raster abgeleitet, künftig für ein einzelnes 16:9-Bild).
- **Verworfene Alternativen:** Overlay mit allen Szenen (auch Dorf, Shop … mit Raumnummer); Overlay vorübergehend
  behalten bis zum Kampf-Task.
- **Begründung:** Ohne Kampfszenen gibt es keine „Räume“ mehr; was die Wall bei einem Kampf zeigt, entscheidet der
  Kampf-Task.

### E3: Listeneintrag wie die Notizen
- **Entscheidung:** Jede Szene ist ein [Navigationseintrag](../../frontend/docs/design/components.md#navigationseintrag)
  wie die Notizen-Einträge: nur der Name, die aktive Szene (Spieltisch-Zustand) hervorgehoben (Fläche `primary`, Text
  `onPrimary`). Über der Liste das Label „Szenen“. Zu lange Namen werden mit „…“ gekürzt, der volle Name steht als
  `title`. Die Liste scrollt im Panel.
- **Verworfene Alternativen:** Vorschaubild + Name.
- **Begründung:** Kompakt, gleicher Baustein wie „Notizen“; bei vielen Szenen wenig Scrollen.

### E4: Einträge als Buttons, für Notizen und Szenen gemeinsam
- **Entscheidung:** Der Eintrag (`SideBarLeftElement`) wird zu einem neutralen Baustein mit `name`, `isActive`,
  `onSelect` und wird als `<button>` gerendert (per Tab erreichbar, Enter/Leertaste lösen aus, Fokus sichtbar wie bei
  den Icon-Buttons). Notizen- und Szenenliste nutzen ihn; die aktive Szene trägt `aria-current="true"`, der gewählte
  Notizen-Eintrag ebenso.
- **Verworfene Alternativen:** eigener Eintrag nur für Szenen; Einträge weiter als `div` ohne Tastaturbedienung.
- **Begründung:** Ein Baustein für beide Listen; die Szenenauswahl ist eine Kernfunktion und soll per Tastatur gehen.
  Für die Notizen ist das die einzige sichtbare Änderung (Fokusrahmen bei Tastaturbedienung).

### E5: Aktivieren mit Bestätigungsdialog, aktive Szene ohne Wirkung
- **Entscheidung:** Klick auf eine nicht aktive Szene öffnet den bestehenden Dialog „Szene wechseln“ (Wall-Bild, Name,
  Beschreibung); „Confirm“ speichert, „Decline“ bricht ab – wie bisher bei den Kacheln. Klick auf die bereits aktive
  Szene tut nichts (kein Dialog, kein Speichern).
- **Verworfene Alternativen:** direkt aktivieren ohne Dialog; Dialog auch für die aktive Szene.
- **Begründung:** Schutz vor Fehlklicks vor den Spielern; erneutes Speichern der aktiven Szene hätte nur den
  Nebeneffekt eines Trackwechsels.

### E6: Reihenfolge wie angelegt
- **Entscheidung:** Die Liste zeigt die Szenen in der Reihenfolge, die `GET /adventures/{id}/scenes` liefert (nach
  ID, also wie in `seed_data.json`).
- **Verworfene Alternativen:** alphabetisch.
- **Begründung:** Entspricht dem Ablauf des Abenteuers; „Fight 10“ würde alphabetisch vor „Fight 2“ stehen.

### E7: Menüpunkt, Startzustand, Icon
- **Entscheidung:** „Szenen“ ist der zweite Menüpunkt unter „Notizen“ (ID `scenes`). Beim Öffnen des Admin Screens
  ist weiter „Notizen“ offen. Die Mitte zeigt unabhängig vom Menüpunkt die Notizen (DND-28 E5). Neues Icon
  `public/assets/icons/scenes.svg` (z. B. Karte/Bild), frei lizenziert, `fill="currentColor"`, wie `notes.svg`.
- **Verworfene Alternativen:** „Szenen“ als Startpanel.
- **Begründung:** Wunsch des Spielleiters; Verhalten beim Start wie bisher.

### E8: Leere Liste
- **Entscheidung:** Ohne aktives Abenteuer oder ohne Szenen zeigt das Panel unter „Szenen“ den Hinweis
  „Keine Szenen“. Ladefehler zeigt wie bisher die Hinweisleiste „Backend nicht erreichbar“.
- **Begründung:** Das Panel bleibt nicht kommentarlos leer; Ladefehler sind bereits geregelt.

### E9: `main` wird aus der Datenbank entfernt
- **Entscheidung:** Neue Alembic-Migration `0005` entfernt die Spalte `scene.main`. Alle Szenen, Bilder, Tracks und
  die aktive Szene bleiben erhalten. Downgrade legt die Spalte wieder an (`NOT NULL`, Default `false`); die frühere
  Einteilung ist dann verloren. `main` verschwindet aus `seed_data.json`, Modell und `SceneDetail`. Die Endpoints
  `/adventures/{id}/maps/main` und `/maps/side` entfallen ersatzlos (danach 404), ebenso `MapEntry`, `services/map.py`
  und `read_scenes_by_main`.
- **Verworfene Alternativen:** Spalte ungenutzt stehen lassen; Endpoints als einen gemeinsamen `/maps` behalten.
- **Begründung:** Wunsch „alle Szenen sind gleich“; nach E1 und E2 nutzt kein Screen mehr die Kachel-Endpoints.

### E10: Zwei Schritte in einem Task
- **Entscheidung:** Schritt 1 baut das Panel „Szenen“ und entfernt die alte Auswahl im Admin (nur Frontend, Backend
  unverändert). Schritt 2 entfernt `main`/`side` aus Backend, API-Vertrag, Wall und Frontend-Resten. Jeder Schritt ist
  für sich lauffähig.
- **Verworfene Alternativen:** zwei getrennte Tasks.
- **Begründung:** Inhaltlich ein Vorhaben; die Schritte halten jede Umsetzungsrunde klein.

### E11: Panel und Navigationsleiste luftiger (bei Abnahme festgelegt)
- **Entscheidung:** Inaktive Navigationseinträge haben keine eigene Fläche (transparent, Hover `secondary`), der
  aktive bleibt `primary`/`onPrimary`. Das Panel wird 240px breit (`LEFT_COLUMN_WIDTH`) und bekommt mehr
  Innenabstand, die Navigationsleiste mehr Innenabstand oben/unten und mehr Abstand zwischen den Menüpunkten.
- **Verworfene Alternativen:** Einträge gefüllt lassen und nur die Abstände vergrößern (Variante A).
- **Begründung:** Rückmeldung des Users bei der Abnahme: Rail und Panel wirken gequetscht. Ursache waren gefüllte
  Einträge mit `space.1` Abstand (bei 29 Szenen ein dichter Kachelstapel), `space.3` Innenabstand neben `space.5` im
  Rest des Admins und ein schmales Panel. Ohne Flächen hebt sich die aktive Szene klar ab.

### E12: Menüpunkte der Navigationsleiste wie die Panel-Einträge, größeres Icon (bei Abnahme festgelegt)
- **Entscheidung:** Inaktive Menüpunkte der Navigationsleiste haben keine eigene Fläche (transparent, Hover
  `secondary`), der aktive bleibt `primary` mit Icon `onPrimary` – genau wie die Navigationseinträge im Panel (E11).
  Das Icon in den Menüpunkten wird 24px groß (neues Token, z. B. `size.iconLg`); `size.icon` (20px) bleibt für alle
  anderen Icons. Der Menüpunkt bleibt `size.control.md`, die Leiste `NAV_RAIL_WIDTH`.
- **Verworfene Alternativen:** `size.icon` allgemein vergrößern (betrifft Top-Bar, Player und weitere Icons).
- **Begründung:** Rückmeldung des Users bei der Abnahme: Leiste und Panel sollen sich gleich verhalten; das Icon
  wirkt zu klein.

## Subtasks

### Schritt 1: Panel „Szenen“ im Admin

#### Frontend
- [x] `SideBarLeftElement` zum neutralen Eintrag umbauen (E4): Props `name`, `isActive`, `onSelect`, `<button>`,
      `aria-current`, Kürzen mit „…“ und `title` (E3); `DocumentNavigation` darauf umstellen.
- [x] Neue Komponente Szenenliste (z. B. `SceneNavigation`): Label „Szenen“, ein Eintrag je Szene, aktive Szene aus
      `ActiveSceneContext` hervorgehoben, Hinweis „Keine Szenen“ (E8).
- [x] `AdminScreen`: Menüpunkt `scenes` „Szenen“ in `navItems` ergänzen (E7). Klick auf eine Szene: aktive Szene →
      nichts, sonst Dialog wie bisher (`handleSceneSelection`, E5).
- [x] `AdminScreen`: Karte „Kampfszenen“ mit `MapOverview` und `SideMaps` in der Bottom-Bar entfernen (E1); Admin
      lädt nur noch `adventures/{id}/scenes` (nicht mehr `maps/main`/`maps/side`), `getAdminData` entsprechend.
- [x] Icon `public/assets/icons/scenes.svg` (E7).
- [x] E2E: `selectMainScene.feature`/`selectSideScene.feature` durch `selectScene.feature` ersetzen: Szene über das
      Panel „Szenen“ wählen, bestätigen, Wall zeigt das Wall-Bild und Ground das Ground-Bild der Szene. Szenario
      „updated map overview“ entfällt. Steps für „Notizen“ (`adminNavigation`) weiter grün.

#### Doku
- [x] `docs/screens.md` (Admin, Ist): Navigationsleiste mit „Szenen“, Szenenauswahl über die Liste, Karte
      „Kampfszenen“ und Bottom-Bar-Szenen entfernt.
- [x] `frontend/docs/design/components.md`: Navigationseintrag als `<button>` mit Fokus, `aria-current`, Kürzen;
      Navigationsleiste mit zwei Menüpunkten. `screen-layouts.md`: rechte Spalte nur „Aktive Szene“, Bottom-Bar ohne
      Szenen. `DESIGN.md`/`contrast.md` nur falls betroffen.
- [x] `frontend/CLAUDE.md`: neue Komponente(n) nennen.

### Schritt 2: Szenen ohne `main`/`side`

#### Vertrag
- [x] `SceneDetail` ohne `main`; Endpoints `GET /adventures/{id}/maps/main` und `/maps/side` entfallen (E9).
      `backend/openapi.json` neu erzeugen, `frontend/src/api/schema.d.ts` per `npm run generate:api`
      (Ablauf: `docs/architecture.md#api-vertrag--typgenerierung`).

#### Backend
- [x] Migration `0005`: Spalte `scene.main` entfernen, Downgrade nach E9; Migrationstest nach Vorbild von
      `tests/test_migration_0003.py` (Szenen, Bilder, Tracks und aktive Szene bleiben).
- [x] `models/scene.py`, `schemas/scene.py`, `seed_data.json` ohne `main`.
- [x] Routen `maps/main`/`maps/side`, `services/map.py`, `schemas/map.py` (`MapEntry`), `get_maps` im
      Adventure-Service und `crud.scene.read_scenes_by_main` entfernen.
- [x] Tests anpassen: `conftest.py` (Szenen-Fixtures ohne `main`, Namen der Fixtures nach Bedarf), `test_adventures.py`
      (Map-Tests entfernen, `SCENE_FIELDS` ohne `main`, ein Test „`maps/main` und `maps/side` liefern 404“),
      `test_seed.py`, `test_scenes.py`, `test_audio.py` soweit betroffen.

#### Frontend
- [x] `models/models.ts`: `Map`, `MapResponse` entfernen.
- [x] Wall (E2): Overlay „Kampfschauplätze“, Laden der Kampfszenen (`getWallMainmaps`), `isActiveMainMap` und
      automatisches Einblenden entfernen; `buttonLabels` WORLD / OFF; Breite des Weltkarten-Overlays unabhängig vom
      Raster (passt über die Steuerleiste).
- [x] Ungenutzte Teile entfernen: `MapOverview`, `MapElement`, `SideMaps`, `getGridLayout` samt
      `__tests__/unit/gridLayout.spec.ts`, `service/WallScreen.ts`-Funktion `getWallMainmaps`; Layout-Konstanten
      und Styles, die nur dafür da waren.
- [x] E2E: Helper/Steps ohne Kampfszenen-Bezug („25 Kampfszenen“ o. ä.) – Szenen über Namen aus dem Seed wählen.

#### Doku
- [x] `docs/domain.md`: „Kampfszene“/„Nicht-Kampfszene“, Mainmap/Sidemap und Endpoints ersetzen durch „Szene“;
      Hinweis, dass Kampf künftig in jeder Szene stattfinden kann; Altbezeichnungen in Asset-Pfaden erwähnen.
- [x] `CLAUDE.md` (Root, „Begriffe“), `frontend/CLAUDE.md` (Kacheln/`sceneId`, `mediaUrl`-Verwendungen, E2E-Seed-
      Hinweis, Komponentenliste), `backend/CLAUDE.md`, `backend/README.md`.
- [x] `docs/architecture.md` (Endpoints, Datenmodell, Migrationen), `docs/screens.md` (Admin und Wall, Ist und Soll),
      `docs/vision.md` (Kernkonzept Szenen), `docs/known-issues.md` (veraltete Punkte).
- [x] `frontend/docs/design/`: Bausteine „Kachel“ und „Nummern-Badge“ entfernen, Wall-Layout (Overlay nur
      Weltkarte) in `screen-layouts.md`, `contrast.md` und `DESIGN.md` bereinigen.

### Runde 3 (User-Rückmeldung: Panel und Navigationsleiste luftiger, E11)
- [x] `SideBarLeftElement`: inaktiv ohne Fläche (`transparent`), Hover `secondary`; aktiv unverändert `primary`/
      `onPrimary`; Fokus-Outline unverändert. Gilt für Notizen und Szenen.
- [x] `AdminScreen`: `LEFT_COLUMN_WIDTH` 240px; Panel-Innenabstand `space.5` oben/unten und `space.4` seitlich.
- [x] `NavRail`: Innenabstand `space.5` oben/unten, `gap` `space.2` zwischen den Menüpunkten; Breite bleibt
      `NAV_RAIL_WIDTH`, Menüpunkte bleiben gefüllt.
- [x] Labels „Notizen“/„Szenen“ und der Hinweis „Keine Szenen“ bleiben am Text der Einträge ausgerichtet.
- [x] Kontrast von `text.color` auf `background` (inaktiv) und auf `secondary` (Hover) in beiden Themes prüfen,
      `contrast.md` bei Bedarf ergänzen.
- [x] Im Browser in beiden Themes (Dunkel, Taverne) prüfen: Notizen- und Szenen-Panel, Hover, Tastatur-Fokus.
- [x] Doku: `DESIGN.md` (Abstände nach Beziehung, Innenabstand von Flächen), `components.md` (Navigationseintrag,
      Navigationsleiste, Verweis der Auswahlliste auf den Navigationseintrag), `screen-layouts.md`
      (`LEFT_COLUMN_WIDTH`).

### Runde 4 (User: Doku-Korrektur Navigationsleiste)
- [x] `components.md` (Navigationsleiste): Innenabstand `space.5` oben/unten und `gap` `space.2` in der Zeile
      „Leiste“, aus der Zeile „Fläche“ entfernt (passt zu `NavRail.tsx` und `DESIGN.md`).

### Runde 5 (User-Rückmeldung: Menüpunkte wie Panel-Einträge, größeres Icon, E12)
- [x] `NavRail`: Menüpunkt inaktiv ohne Fläche (`transparent`), Hover `secondary`; aktiv unverändert `primary`, Icon
      `onPrimary`; Fokus-Outline unverändert.
- [x] Neues Token für das größere Icon (24px) in `src/style/tokens.ts`, in `NavRail` statt `size.icon` verwenden.
- [x] Kontrast des Icons `text.color` auf `background` und `secondary` in beiden Themes prüfen, `contrast.md` bei
      Bedarf ergänzen.
- [x] Im Browser in beiden Themes prüfen: Leiste mit offenem und eingeklapptem Panel, Hover, Tastatur-Fokus.
- [x] Doku: `DESIGN.md` (Token-Tabelle, Ausnahme beim Zustand „inaktiv“), `components.md` (Navigationsleiste:
      Menüpunkt, Zustände; Abgrenzung zum allgemeinen Icon-Button).

## Akzeptanzkriterien

### AK1: Menüpunkt „Szenen“
- **Given** der Admin Screen ist geöffnet, ein Abenteuer mit Szenen ist aktiv
- **When** er geladen ist
- **Then** zeigt die Leiste die Icon-Buttons „Notizen“ und darunter „Szenen“, offen ist „Notizen“
- **When** der Spielleiter auf „Szenen“ klickt
- **Then** zeigt das Panel das Label „Szenen“ und alle Szenen des Abenteuers in der Reihenfolge wie angelegt
  (Seed: Default, Shop, Tavern, Level Up, Fight 1 … Fight 25), die aktive Szene ist hervorgehoben
- **And** die Mitte zeigt weiter die zuvor gewählten Notizen

### AK2: Szene wechseln
- **Given** das Panel „Szenen“ ist offen
- **When** der Spielleiter auf eine nicht aktive Szene klickt
- **Then** öffnet sich der Dialog „Szene wechseln“ mit Wall-Bild, Name und Beschreibung dieser Szene
- **When** er „Confirm“ klickt
- **Then** wechseln Admin, Wall und Ground zu dieser Szene, und die Liste hebt sie als aktiv hervor
- **When** er stattdessen „Decline“ klickt
- **Then** ändert sich nichts

### AK3: Aktive Szene anklicken
- **Given** das Panel „Szenen“ ist offen
- **When** der Spielleiter auf die bereits aktive Szene klickt
- **Then** öffnet sich kein Dialog und nichts wird gespeichert

### AK4: Alte Szenenauswahl entfernt
- **Given** der Admin Screen ist geöffnet
- **Then** gibt es keine Karte „Kampfszenen“ und keine Szenen in der Bottom-Bar; rechts steht nur „Aktive Szene“,
  die Musik-Steuerung in der Bottom-Bar ist unverändert

### AK5: Abenteuer und leere Liste
- **Given** das Panel „Szenen“ ist offen
- **When** der Spielleiter das Abenteuer wechselt
- **Then** zeigt die Liste die Szenen des neuen Abenteuers
- **Given** kein Abenteuer ist aktiv oder das Abenteuer hat keine Szenen
- **Then** zeigt das Panel „Keine Szenen“

### AK6: Tastatur und lange Namen
- **Given** das Panel „Szenen“ oder „Notizen“ ist offen
- **When** der Spielleiter per Tab auf einen Eintrag geht und Enter oder Leertaste drückt
- **Then** wirkt das wie ein Klick; der Fokus ist sichtbar, der aktive Eintrag trägt `aria-current`
- **And** ein Name, der nicht in die Panelbreite passt, endet mit „…“ und zeigt den vollen Namen als Tooltip

### AK7: Szenen ohne `main`
- **Given** eine bestehende Datenbank vor diesem Task (mit aktiver Szene)
- **When** die API startet und die Migration läuft
- **Then** sind alle Szenen mit Bildern und Tracks sowie die aktive Szene unverändert vorhanden, die Spalte `main`
  gibt es nicht mehr
- **And** `GET /scenes/{id}` und `GET /adventures/{id}/scenes` liefern Szenen ohne `main`;
  `GET /adventures/{id}/maps/main` und `/maps/side` liefern 404

### AK8: Wall ohne „Kampfschauplätze“
- **Given** die Wall ist geöffnet
- **When** der Spielleiter eine beliebige Szene aktiviert (auch eine frühere Kampfszene wie „Fight 1“)
- **Then** zeigt die Wall nur deren Wall-Bild, ohne Overlay
- **And** die Steuerleiste bietet WORLD, OFF und AUDIO; WORLD zeigt die Weltkarte vollständig über der Steuerleiste

### AK9: Rest unverändert
- **Given** Admin, Wall und Ground sind geöffnet
- **When** der Spielleiter Notizen liest, Musik und Sounds bedient, Theme oder Abenteuer wechselt
- **Then** verhält sich alles wie vor dem Task; Ground zeigt das Ground-Bild der aktiven Szene, Musik spielt die
  Playlist der aktiven Szene

## Teststrategie / Verifikation

**Automatisch**
- Backend: Migrationstest `0005`; angepasste Tests für Szenen und Abenteuer (ohne `main`, `maps/*` → 404);
  `ruff`, `mypy`, `pytest` grün; `openapi.json` aktuell.
- Frontend Unit: bestehende Tests grün (`gridLayout.spec.ts` entfällt mit `getGridLayout`); Logik für „Klick auf
  aktive Szene tut nichts“ als reine Funktion testen, falls sie nicht trivial im Handler steht.
- Frontend BDD: `selectScene.feature` (AK1, AK2 über das Panel, Wall-Bild und Ground-Bild), `adminNavigation.feature`
  weiter grün.
- Lint, Typecheck (inkl. `schema.d.ts` aktuell), Build grün.

**Manuell**
1. Admin öffnen: Leiste mit „Notizen“ und „Szenen“, „Notizen“ offen (AK1).
2. „Szenen“ öffnen: 29 Szenen in Seed-Reihenfolge, aktive hervorgehoben; Szene wählen, Confirm und Decline prüfen,
   Wall und Ground folgen (AK2); aktive Szene anklicken (AK3).
3. Rechte Spalte und Bottom-Bar ansehen (AK4); Abenteuer wechseln (AK5).
4. Per Tab durch Notizen- und Szenenliste, Enter/Leertaste; einen langen Szenennamen prüfen (AK6).
5. Bestehende Dev-DB migrieren, aktive Szene vorher/nachher vergleichen; `maps/main` aufrufen (AK7).
6. Wall: Szenen „Default“ und „Fight 1“ aktivieren, Steuerleiste und WORLD prüfen (AK8).
7. Musik, Sound, Theme mit offenem Panel „Szenen“ (AK9); beide Themes ansehen.

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-10-24
**Empfehlung:** Nacharbeiten

Fast alles passt. Blockierend ist nur ein Punkt: Der neue E2E-Test ist rot, wenn keine Szene aktiv ist. Genau das ist der Zustand nach einem frischen Seed.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `AdminScreen.tsx:197` (Start `'docs'`), `:392` (Menüpunkt `scenes` als zweiter Eintrag). `SceneNavigation.tsx:38-43`: Label, Reihenfolge der API, aktive Szene aus `ActiveSceneContext`. Die Mitte (`DocumentReader`) hängt nicht am Panel. E2E `adminNavigation` (2 Rail-Buttons in der Reihenfolge docs, scenes) grün. Szenario 1 von `selectScene` (29 Einträge, Default/Shop/Tavern/Level Up, dann Fight 1…25) grün im 2. Lauf, siehe Befund |
| AK2 | erfüllt | `AdminScreen.tsx:362-380`: der bestehende `Dialogue` mit `sceneOption`, Confirm speichert, Decline schließt ohne Speichern. E2E-Szenario 2 (Auswahl über das Panel, Confirm, Eintrag wird aktiv, Wall-Bild und Ground-Bild stimmen) in beiden Läufen grün |
| AK3 | erfüllt | `AdminScreen.tsx:363`: früher Abbruch bei `sceneId === activeSceneId`, also kein Dialog und kein Speichern. Kein automatisierter Test; laut Teststrategie nicht verlangt, weil die Logik trivial im Handler steht |
| AK4 | erfüllt | `AdminScreen.tsx:442`: rechts nur `DetailsSideBar`. `:472-473`: Mitte und rechte Seite der Bottom-Bar leer, Musik-Block unverändert (Diff) |
| AK5 | erfüllt | Szenen werden bei Wechsel von `loadedAdventureId` neu geladen (`AdminScreen.tsx:267`). Ohne Abenteuer `[]` (`:246`), dann zeigt `SceneNavigation.tsx:38` „Keine Szenen“ |
| AK6 | erfüllt (laut Code; Tastatur und Tooltip nicht im Browser geprüft) | `SideBarLeftElement.tsx:7,49`: natives `<button type='button'>`, Enter/Leertaste lösen also aus. `:29` `:focus-visible` wie bei `NavRail.tsx:35`. `:52` `aria-current`. `:27` Ellipsis, `:51` `title`. Gilt für Notizen und Szenen (`DocumentNavigation`, `SceneNavigation`) |
| AK7 | erfüllt | Migration `0005_drop_scene_main.py` (Upgrade löscht die Spalte, Downgrade `NOT NULL`/Default false und danach ohne Default). `test_migration_0005.py`: Szenen, Tracks, Medien und aktive Szene bleiben erhalten, auch beim Downgrade. `test_adventures.py:122`: `maps/main` und `maps/side` liefern 404. `SCENE_FIELDS` ohne `main` (test_scenes, test_adventures). pytest auf frischer DB 165 grün |
| AK8 | erfüllt (laut Code; Darstellung nicht im Browser geprüft) | `WallScreen.tsx:95` WORLD/OFF, AUDIO aus `ScreenControlBar`. Kein Overlay „Kampfschauplätze“ mehr, kein Einblenden beim Szenenwechsel, eine offene Weltkarte wird geschlossen (`:108`, `:114`). Breitenformel `:51-60` ist die bisherige Formel für 1 Zeile × 1 Spalte und nicht mehr an das Raster gebunden |
| AK9 | erfüllt | Musik, Sound, Theme, Abenteuerwahl und Ground im Diff nicht verändert (Ground und Dialogue ohne Diff). Unit-Tests 158 grün, pytest 165 grün |

**Blockierende Befunde**
- [x] `npm run test:e2e` ist rot, wenn keine Szene aktiv ist (Seed-Zustand): `frontend/__tests__/bdd/steps/selectScene.ts:108` erwartet genau einen Eintrag mit `aria-current="true"`. Szenario 1 legt aber keine aktive Szene an. Der Seed setzt kein `active_scene_id`, und das Backend wählt keine Standardszene.
  - Reproduziert gegen den Dev-Stack mit `adventure 1 active_scene_id = NULL`: 1. Lauf `Tests: 1 failed, 4 passed` mit „Expected length: 1, Received length: 0“.
  - 2. Lauf, nachdem Szenario 2 eine Szene aktiviert hatte: `5 passed`. Das Ergebnis hängt also vom Zustand und der Reihenfolge ab.
  - Lösungsvorschlag: Die Vorbedingung im Szenario selbst herstellen, z. B. eine Szene per API oder über das Panel aktivieren. Oder im Feature „Given a scene is active“ ergänzen.

**Hinweise**
- Abweichungen, die der Implementer genannt hat, selbst geprüft:
  - Das optionale Prop `testId` an `SideBarLeftElement` ist harmlos. `components.md` nennt nur `name`, `isActive`, `onSelect`.
  - Die Anpassungen an `adminNavigation.ts`, `apiErrors.spec.ts` und `test_media.py` sind nötig, weil die Endpoints bzw. der zweite Menüpunkt wegfallen bzw. dazukommen. Sie sind nicht aufgeweicht.
  - `layer.raised` ist jetzt unbenutzt. `DESIGN.md:81` markiert es als „derzeit nicht verwendet“. Der Subtask verlangt eigentlich, Styles zu entfernen, die nur für die Kacheln da waren. Ob ein allgemeiner Layer-Token darunter fällt, entscheidet der User.
- Die Liste zeigt kurz „Keine Szenen“, während sie lädt (Startwert `[]`). Beim Abenteuerwechsel stehen bis zum Ende des Ladens noch die Szenen des alten Abenteuers da. Verletzt kein AK, könnte aber bei langsamem Backend irritieren.
- Der Plan wurde ohne eigenen Commit `docs(DND-29): approve plan` im Runden-Commit mitcommittet. Das entspricht der Praxis bei DND-24 bis DND-27 und ist laut deliver-task zulässig. Beide Schritte (E10) stehen in einem Runden-Commit: zulässig, nur nicht so klein wie in E10 gedacht.
- Bestehender Lint-Warning, nicht durch diese Änderung: `WallScreen.tsx:157` `img` ohne `alt` (`MapEnvironment`; war vorher schon `:216`).
- pytest gegen die Dev-DB hängt vom Zustand ab (bestehendes Problem, nicht durch DND-29 verursacht).
- Nebeneffekt der Prüfung: Die E2E-Läufe haben im Dev-Stack eine aktive Szene gesetzt; vorher war `active_scene_id` NULL.
- Doku stichprobenartig geprüft: Root-`CLAUDE.md` (Begriffe), `screens.md`, `domain.md`, `architecture.md` und `components.md` passen zum Code. Keine Änderungen außerhalb des Scopes.
- Commit `508b2e3`: Schema `feat(DND-29): …` passt zum Plan-Typ. Body nur aus Stichpunkten, keine KI-Signatur.

**Checks:**
- **Backend:** `ruff check` grün, `ruff format --check` grün, `mypy app` grün. `pytest` auf frischer, temporärer Postgres-17-DB: 165 passed. `openapi.json` aktuell.
- **Frontend:** `npm run lint` 0 Fehler, 1 bestehender Warning. `typecheck` grün. `test:unit` 158 Tests grün. `build` grün. `schema.d.ts` aktuell.
- **E2E:** `test:e2e` im 1. Lauf rot (1 von 5, siehe Befund), im 2. Lauf 5 von 5 grün.

### Runde 2 – 2026-10-24
**Empfehlung:** Abnahme

Der blockierende Befund aus Runde 1 ist behoben. Szenario 1 in `selectScene` stellt die aktive Szene jetzt selbst her und ist auch dann grün, wenn keine Szene aktiv ist. Die Nacharbeit (`afc983d`) ändert nur die Feature-Datei, die Step-Datei und den Plan (Review-Bericht Runde 1). Produktivcode und Backend sind gegenüber `508b2e3` unverändert, die Ergebnisse aus Runde 1 gelten also weiter.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Code wie in Runde 1 (`AdminScreen.tsx:197`, `:392`; `SceneNavigation.tsx:38-43`). E2E-Szenario 1 (29 Einträge in Seed-Reihenfolge, genau ein Eintrag mit `aria-current="true"`) ist jetzt unabhängig vom Ausgangszustand grün. Beleg: Einzellauf mit `active_scene_id = NULL` ergibt `1 passed`; danach ist Szene 2 („Shop“) aktiv, über das Panel aktiviert. `adminNavigation` grün |
| AK2 | erfüllt | Unverändert seit Runde 1 (`AdminScreen.tsx:362-380`). E2E-Szenario 2 in allen Läufen grün |
| AK3 | erfüllt | Unverändert seit Runde 1 (`AdminScreen.tsx:363`, früher Abbruch bei aktiver Szene) |
| AK4 | erfüllt | Unverändert seit Runde 1 (`AdminScreen.tsx:442`, `:472-473`) |
| AK5 | erfüllt | Unverändert seit Runde 1 (`AdminScreen.tsx:246`, `:267`; `SceneNavigation.tsx:38`) |
| AK6 | erfüllt (laut Code; Tastatur und Tooltip nicht im Browser geprüft) | Unverändert seit Runde 1 (`SideBarLeftElement.tsx:7,27,29,49,51,52`) |
| AK7 | erfüllt | Backend ohne Diff zwischen `508b2e3` und `afc983d`. Dev-DB: `alembic_version` = `0005`, `\d scene` ohne Spalte `main`. Tests wie in Runde 1 (`test_migration_0005.py`, `test_adventures.py:122`) |
| AK8 | erfüllt (laut Code; Darstellung nicht im Browser geprüft) | Unverändert seit Runde 1 (`WallScreen.tsx:51-60`, `:95`, `:108`, `:114`) |
| AK9 | erfüllt | Kein Produktivcode in der Nacharbeit geändert. Unit 158 grün, E2E 5/5 grün |

**Blockierende Befunde**
- keine

**Hinweise**
- Befund aus Runde 1 unabhängig geprüft: Mit `adventure 1 active_scene_id = NULL` ist der volle Lauf `npm run test:e2e` grün (`Tests: 5 passed`), Szenario 1 allein ebenfalls. Gegenprobe mit dem alten Step-Stand `508b2e3` (temporärer Worktree, danach entfernt) aus `NULL`: `1 failed` – die Prüfung erkennt den Fehler, die Nacharbeit behebt ihn.
- `ensureActiveScene` (`frontend/__tests__/bdd/steps/selectScene.ts:71-86`) liest den Zustand über `GET /api/table` (Vite-Proxy) und aktiviert bei Bedarf „Shop“ über Panel und Dialog. Der Kommentar begründet, warum der Zustand vom Server gelesen wird.
- Commit `afc983d`: `feat(DND-29): address review round 1` passt zum Schema und zum Plan-Typ, keine KI-Signatur.
- Bestehender Lint-Warning unverändert: `WallScreen.tsx:157` `img` ohne `alt`, nicht durch DND-29 verursacht.
- `layer.raised`: offene Entscheidung des Users, kein Befund (siehe Runde 1).
- Dev-DB auf den vorgefundenen Stand zurückgesetzt (`active_adventure_id 1`, `active_scene_id 2`, `theme dark`, Audio unverändert).

**Checks:**
- **Backend** (unverändert seit Runde 1): `ruff check` grün, `ruff format --check` grün, `mypy app` grün. `pytest` nicht erneut ausgeführt (kein Backend-Diff; Runde 1: 165 passed).
- **Frontend:** `npm run lint` 0 Fehler, 1 bestehender Warning. `typecheck` grün. `test:unit` 158 Tests grün. `build` grün.
- **E2E:** aus `active_scene_id = NULL` 5/5 grün; mit `active_scene_id = 2` 5/5 grün; Szenario 1 allein aus `NULL` grün; Gegenprobe mit altem Stand aus `NULL` rot, wie erwartet.

### Runde 3 – 2026-10-24
**Empfehlung:** Nacharbeiten

Der Code der Nacharbeit (`f760dc0`) setzt E11 und die Subtasks von Runde 3 um, und alle Checks sind grün. Blockierend ist nur ein Doku-Fehler: In `components.md` steht für die Navigationsleiste noch eine Zeile mit den alten Werten. Sie widerspricht dem Code und der Zeile direkt darüber. Die Behebung ist eine Zeile.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Logik unverändert seit Runde 2. Die Nacharbeit ändert nur Styles (`NavRail.tsx:16-17`, `SideBarLeftElement.tsx:13,30-32`, `AdminScreen.tsx:43,77`). E2E `adminNavigation` und `selectScene` Szenario 1 grün. Die aktive Szene ist weiter `primary`/`onPrimary` (Screenshots `dark-scenes-hover.png`, `tavern-scenes-focus.png`) |
| AK2 | erfüllt | Unverändert (`AdminScreen.tsx:362-380`). E2E Szenario 2 grün |
| AK3 | erfüllt | Unverändert (`AdminScreen.tsx:363`) |
| AK4 | erfüllt | Unverändert, im Diff kein Eingriff in die rechte Spalte oder die Bottom-Bar |
| AK5 | erfüllt | Unverändert (`AdminScreen.tsx:246`, `:267`; `SceneNavigation.tsx:38`) |
| AK6 | erfüllt (laut Code und Screenshots; Tastatur selbst nicht im Browser bedient) | `<button>`, `aria-current`, Ellipse und `title` unverändert. Fokus-Rahmen `primary` mit Abstand `borderWidth.thick` (`SideBarLeftElement.tsx:34-37`), sichtbar auch am aktiven Eintrag in Taverne. Bei 240px wird „Fight 11 [lvl. 7] (Boss)“ ungekürzt angezeigt |
| AK7 | erfüllt | Backend ohne Diff zwischen `508b2e3` und `f760dc0`. Ergebnisse aus Runde 1 gelten weiter |
| AK8 | erfüllt (laut Code) | Wall ohne Diff seit Runde 1 |
| AK9 | erfüllt | Kein Verhalten geändert, nur Abstände und Flächen. Unit 158 grün, E2E 5/5 grün |

**Blockierende Befunde**
- [x] `frontend/docs/design/components.md:68` (Navigationsleiste, Zeile „Leiste“) nennt noch „Innenabstand `space.3` oben/unten, `gap` `space.1` zwischen den Menüpunkten“. Das widerspricht dem Code (`NavRail.tsx:16-17`: `space.2`/`space.5`), der Zeile „Fläche“ direkt darüber (`:67`, neue Werte) und `DESIGN.md:102,116`. Vorschlag: die neuen Werte in die Zeile „Leiste“ übernehmen und aus der Zeile „Fläche“ wieder herausnehmen, damit sie nur einmal dastehen.

**Hinweise**
- E11 und Runde 3 geprüft: inaktive Einträge transparent, Hover `secondary`, aktiv `primary`/`onPrimary` (auch bei Hover), Fokus unverändert; Panel 240px mit `space.5`/`space.4`; Leiste `space.5`/`gap space.2`, Breite und gefüllte Menüpunkte unverändert; 4px-Raster eingehalten; Labels, „Keine Szenen“ und Eintragstext bündig (x=92).
- Kontrast: `text.color` auf `background` 17,4/9,2 und auf `secondary` 15,9/6,5 (`contrast.md:39-40`). Die Hover-Fläche hebt sich nur schwach ab (1,1 bzw. 1,4), bewusst dokumentiert (`contrast.md:49`), nur Zusatzsignal.
- Auswahlliste (`components.md:168`) übernimmt vom Navigationseintrag nur Höhe, Innenabstand und Schrift; stimmt mit `AdventureSelect.tsx:87` überein.
- `DESIGN.md:249` (Ausnahme „inaktiv“ für Panel-Einträge), `:101-103` und `:116-117` stimmen mit dem Code überein.
- Commit-Kopfzeile `feat(DND-29): address review round 2` passt zum Schema, inhaltlich ist es aber die User-Nacharbeit nach Runde 2.
- Bestehende Lint-Warnung `WallScreen.tsx:157` unverändert; `layer.raised` offene User-Entscheidung.
- Spieltisch-Zustand der Dev-DB nach dem E2E-Lauf nicht zurückgesetzt (PATCH wurde abgelehnt): vorgefunden Szene 4 („Level Up“), Theme `tavern`, Track 76; jetzt Szene 2, Theme `dark`, Track 37.

**Checks:**
- **Backend:** nicht erneut ausgeführt, kein Diff seit Runde 1 (dort `ruff`, `mypy` grün, `pytest` 165 passed).
- **Frontend:** `npm run lint` 0 Fehler, 1 bestehende Warnung. `typecheck` grün. `test:unit` 158 Tests grün. `build` grün.
- **E2E:** 5/5 grün.

### Runde 4 – 2026-10-24
**Empfehlung:** Abnahme

Der blockierende Befund aus Runde 3 ist behoben. Commit `ad7f87f` ändert nur die Doku; für die Akzeptanzkriterien gelten die Ergebnisse aus Runde 3 weiter, denn seit `f760dc0` hat sich am Code nichts geändert.

**Blockierende Befunde**
- keine

**Hinweise**
- Umfang: `git show --stat ad7f87f` zeigt nur `frontend/docs/design/components.md` (Zeilen „Fläche“ und „Leiste“) und den Plan (Abschnitt „Runde 4“, Bericht Runde 3 mit abgehaktem Befund).
- `components.md:68` (Zeile „Leiste“) nennt Innenabstand `space.5` oben/unten und `gap` `space.2`, passend zu `NavRail.tsx:16-17` und `DESIGN.md:102,116`. Aus der Zeile „Fläche“ (`:67`) sind die Abstände entfernt, keine Doppelung. Die Zeile „Panel“ (`:71`) betrifft das Panel und widerspricht nicht.
- `screen-layouts.md:12` („`space.3` auf beiden Seiten“ für `NAV_RAIL_WIDTH`) meint den seitlichen Abstand und widerspricht dem vertikalen Innenabstand nicht.
- Commit-Nachricht `feat(DND-29): address review round 3` passt zu Schema und Plan-Typ, keine KI-Signatur.

**Checks:**
- Nur Doku geändert: Lint, Tests, Build und E2E nicht erneut ausgeführt (Code seit `f760dc0` unverändert, dort in Runde 3 alle grün). Arbeitsbaum sauber, Dev-DB nicht angefasst.

### Runde 5 – 2026-10-24
**Empfehlung:** Abnahme

Commit `edf2d60` setzt E12 und alle Subtasks von Runde 5 um. Die Menüpunkte der Navigationsleiste verhalten sich jetzt wie die Panel-Einträge, das Icon ist 24px groß über `size.iconLg`. Die Doku passt zum Code und widerspricht sich nicht. Lint, Typecheck, Unit-Tests, Build und E2E sind grün.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Logik seit Runde 2 unverändert. Runde 5 ändert nur Styles in `NavRail.tsx:30,36-38,47-48`. E2E `adminNavigation` und `selectScene` Szenario 1 grün. Der aktive Menüpunkt ist weiter `primary`/`onPrimary` (Selenium, Theme Taverne) |
| AK2 | erfüllt | Unverändert (`AdminScreen.tsx:362-380`). E2E Szenario 2 grün |
| AK3 | erfüllt | Unverändert (`AdminScreen.tsx:363`) |
| AK4 | erfüllt | Unverändert, kein Eingriff in rechte Spalte oder Bottom-Bar |
| AK5 | erfüllt | Unverändert (`AdminScreen.tsx:246`, `:267`; `SceneNavigation.tsx:38`) |
| AK6 | erfüllt | `SideBarLeftElement` seit Runde 3 unverändert. Tastatur an den Menüpunkten geprüft: Tab erreicht beide, `:focus-visible` mit Outline 2px `primary` und Abstand 2px, Enter öffnet, Leertaste klappt ein |
| AK7 | erfüllt | Backend seit `508b2e3` ohne Diff, Ergebnisse aus Runde 1 gelten weiter |
| AK8 | erfüllt (laut Code) | Wall seit Runde 1 ohne Diff |
| AK9 | erfüllt | Kein Verhalten geändert. `size.icon` (20px) unverändert, `size.iconLg` nur in `NavRail.tsx:47-48`. Unit 158 grün, E2E 5/5 grün |

**Blockierende Befunde**
- keine

**Hinweise**
- E12 im Browser geprüft (Theme Taverne): inaktiv `transparent`, Hover inaktiv `secondary`, Hover aktiv bleibt `primary`, Fokus-Outline an aktivem und inaktivem Menüpunkt sichtbar – wie `SideBarLeftElement`.
- Icon-`fill` stimmt in allen Zuständen (aktiv `onPrimary`, inaktiv `text.color`), auch nach Ein-/Ausklappen und Wechsel; `react-svg` injiziert bei geänderten Props neu. Icon in allen Zuständen 24×24px.
- Dark-Theme über die Screenshots des Implementers geprüft, nicht selbst gemessen.
- Token `size.iconLg` (`tokens.ts:60-61`) folgt dem Muster `size.button.minWidth`; `styled.d.ts` leitet den Typ ab.
- Doku: `DESIGN.md:67-68`, `:250`; `components.md:69-70`; `contrast.md:49-52`, `:66-70` stimmen mit dem Code überein. Die Abgrenzung zum Icon-Button steht zweimal (`components.md:23`, `:70`), ohne Widerspruch. Kleine Ungenauigkeit: „der allgemeine Icon-Button bleibt gefüllt“ gilt nicht in Top-Bar und Hinweisleiste (dort transparent, `components.md:22`); optional „außer in Top-Bar und Hinweisleiste“ ergänzen.
- Umfang: `edf2d60` ändert nur die 6 Dateien aus E12/Runde 5. Commit-Nachricht nach Schema, keine KI-Signatur.
- Bekannt, nicht durch DND-29: Lint-Warnung `WallScreen.tsx:157`. `layer.raised` ist kein Befund.
- Spieltisch-Zustand: vorgefunden Szene 2, Theme `dark`; nach E2E Szene 2 wiederhergestellt (Track jetzt 39, vorher nicht notiert). Theme steht auf `tavern` – Umstellung per `PATCH /table` über den UI-Container, nicht durch die Prüfläufe; nicht zurückgesetzt.

**Checks:**
- **Backend:** nicht erneut ausgeführt, seit Runde 1 kein Diff (`ruff`, `mypy` grün, `pytest` 165 passed).
- **Frontend:** `npm run lint` 0 Fehler, 1 bestehende Warnung. `typecheck` grün. `test:unit` 158 Tests grün. `build` grün.
- **E2E:** 5/5 grün. Eigener Selenium-Lauf über Zustände und Fokus der Menüpunkte.
