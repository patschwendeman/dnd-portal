# DND-53: Logo in der Navigationsleiste des Admins, Web-App-Manifest für den Homescreen

**Typ:** feat
**Status:** Im Review

## Kontext & Ziel

Die App zeigt bisher nirgends ein Logo. Der Spielleiter soll es im Admin oben in der Navigationsleiste sehen, ohne dass
es Platz für das Spiel kostet. Die Spieler sollen den Player Screen auf dem Smartphone als App auf dem Homescreen
ablegen können, mit Logo als Icon und dem Namen „DnD Portal“. Als Logo dient vorerst das Favicon `dice.svg` als
Platzhalter. Vorlage ist das Mockup „Admin Logo Mockup“ (Version 1, Variante „1 · Unter dem Logo“, Logo-Ort „In der
Leiste“, Logo-Farbe primary, 32px); es liegt außerhalb des Repos.

## Scope / Non-Goals

**Im Scope**
- Logo als erstes Element der Navigationsleiste im Admin, darunter „Notizen“, „Szenen“, „Kampf“, unten weiter
  „Einstellungen“.
- Web-App-Manifest mit Name, Start-URL, Anzeige ohne Browserleiste und App-Icons in den Cyber-Farben.
- Einträge in `index.html` für Manifest, Apple-Touch-Icon und die Meta-Tags für iOS.
- Doku: Ist-Stand und Style Guide.

**Nicht im Scope**
- Klick auf das Logo (keine Funktion, kein Link zur Abenteuerauswahl).
- Ein endgültiges Logo; `dice.svg` bleibt Platzhalter, ein späterer Austausch ist ein eigener Task.
- Logo an anderen Stellen (Kopfzeile, Abenteuerauswahl, Player, Wall, Ground).
- Icon, das dem Theme folgt (siehe E3), sowie Änderung des Favicons im Browser-Tab und des Seitentitels `DnD`.
- HTTPS im LAN und alles, was eine echte PWA-Installation darüber hinaus braucht (Service Worker, Offline-Betrieb).
- Eigene Start-URL für den Admin; das Manifest gilt für die ganze Seite und startet in der Charakterauswahl.

## Entscheidungen

### E1: Logo oben in der Leiste, Menüpunkte direkt darunter
- **Entscheidung:** Das Logo steht ganz oben in der Navigationsleiste. „Notizen“, „Szenen“ und „Kampf“ folgen direkt
  darunter mit `space.6` (32px) Abstand zum Logo und wie bisher `space.2` untereinander. „Einstellungen“ bleibt am
  unteren Ende (`margin-top: auto`).
- **Verworfene Alternativen:** Menüpunkte vertikal zentriert (wirkten in der langen Leiste verloren); zentriert auf
  eigener Fläche; Beschriftung unter den Icons; Logo als eigene Kachel in der Kopfzeile mit Leiste darunter.
- **Begründung:** Logo und Menüpunkte bilden einen gemeinsamen Kopf, die freie Fläche liegt nur zwischen „Kampf“ und
  „Einstellungen“. Entspricht dem Mockup, Variante 1.

### E2: Logo ohne Funktion, 32px, Farbe primary
- **Entscheidung:** `dice.svg` in 32px (`LOGO_SIZE`), eingefärbt in `primary` des aktiven Themes. Kein Button, kein
  Hover, nicht fokussierbar, Klick ohne Wirkung. Für Screenreader `role="img"` mit `aria-label="DnD Portal"`.
- **Verworfene Alternativen:** 24px (zu unauffällig) und 40px; Textfarbe; Klick zur Abenteuerauswahl.
- **Begründung:** Wunsch des Users; die Frage „Abenteuer verlassen oder beenden?“ bei einem Klick entfällt damit.

### E3: Ein festes App-Icon in den Cyber-Farben
- **Entscheidung:** Ein Icon-Satz: Würfel in `#4493F8` auf vollflächigem Grund `#0e1117`. Der Würfel liegt in der
  sicheren Zone für maskierbare Icons (mittlere 80 %, Würfel etwa 60 % der Kantenlänge), sodass dasselbe Bild für
  `any` und `maskable` taugt.
- **Verworfene Alternativen:** Taverne-Farben; Icon passend zum Theme, das beim Hinzufügen auf dem Gerät aktiv ist
  (zwei Icon-Sätze, Umschalten per JavaScript). Das Betriebssystem speichert das Icon beim Hinzufügen und folgt einem
  späteren Theme-Wechsel ohnehin nicht.
- **Begründung:** Einfach und zuverlässig; Cyber ist das Standard-Theme.

### E4: Name „DnD Portal“, ohne Browserleiste, Start in der Charakterauswahl
- **Entscheidung:** Manifest mit `name` und `short_name` „DnD Portal“, `start_url` und `scope` `/`,
  `display: standalone`, `background_color` und `theme_color` `#0e1117`, ohne `orientation` (die Charakterauswahl
  geht auch im Hochformat). Für iOS zusätzlich `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`
  „DnD Portal“ und `apple-mobile-web-app-status-bar-style` `black`.
- **Verworfene Alternativen:** Name „DnD“; Anzeige im normalen Browser.
- **Begründung:** Wunsch des Users. Hinweis: Chrome auf Android öffnet ohne Browserleiste nur über HTTPS; über
  `http://<IP>:8080` im LAN legt es lediglich eine Verknüpfung mit Icon an. Das iPhone kann es auch über HTTP. Die
  Einschränkung kommt nach `docs/known-issues.md`.

### E5: App-Icons als PNG im Repo, keine neue Abhängigkeit
- **Entscheidung:** Quelle ist ein eigenes SVG `frontend/public/assets/icons/appIcon.svg` (Fläche plus Würfelpfad aus
  `dice.svg`). Daraus werden einmalig `appIcon-192.png`, `appIcon-512.png` und `appleTouchIcon-180.png` (iOS, ohne
  Transparenz) erzeugt und eingecheckt. Das Werkzeug zum Rendern ist frei (z. B. `rsvg-convert` oder ein einmaliger
  `npx`-Aufruf), es kommt aber nicht in `package.json` und nicht in den Build.
- **Verworfene Alternativen:** Icons im Build erzeugen (zusätzliche Abhängigkeit); nur SVG im Manifest (iOS kann
  kein SVG als Homescreen-Icon).
- **Begründung:** Die Icons ändern sich selten; feste Dateien halten den Build einfach.

## Subtasks

### Frontend
- [x] `NavRail` ([src/components/NavRail.tsx](../../frontend/src/components/NavRail.tsx)): Logo als erstes Element
      der Leiste (`ReactSVG` mit `/assets/icons/dice.svg`, Füllung `primary`, Größe `LOGO_SIZE` = 32px,
      `role="img"`, `aria-label="DnD Portal"`, `data-test-id="nav-logo"`, kein Button). Die oberen Menüpunkte als
      Gruppe mit `space.6` Abstand zum Logo; untere Gruppe unverändert. Menüpunkte, Punkt am „Kampf“, Bedienung und
      `nextOpenPanel`/`splitByPlacement` bleiben unverändert.
- [x] `frontend/public/assets/icons/appIcon.svg` und die PNGs (192, 512, Apple 180) nach E3/E5.
- [x] `frontend/public/manifest.webmanifest` nach E4 mit den Icons: 192 und 512 als `any`, 512 zusätzlich als
      eigener Eintrag mit `purpose: "maskable"`.
- [x] `frontend/index.html`: `<link rel="manifest">`, `<link rel="apple-touch-icon">`, `<meta name="theme-color">`
      und die iOS-Meta-Tags nach E4. Favicon und `<title>` bleiben.
- [x] `frontend/nginx.conf`: prüfen, dass `.webmanifest` als `application/manifest+json` ausgeliefert wird; sonst
      ergänzen (wie bei `.md`).

### Tests
- [x] BDD `adminNavigation.feature`: Szenario zum Logo (erstes Element der Leiste, nicht fokussierbar, kein Button;
      Klick ändert weder Panel noch aktiven Menüpunkt).
- [x] Unit-Test zum Manifest: Pflichtfelder nach E4, jede Icon-Datei existiert unter `public/`, `index.html`
      verweist auf Manifest und Apple-Touch-Icon.

### Doku
- [x] `docs/screens.md`: Admin, Ist (Navigationsleiste mit Logo); Player, Ist (Homescreen: Name, Icon, Start in der
      Charakterauswahl, ohne Browserleiste).
- [x] `frontend/docs/design/components.md`, Abschnitt „Navigationsleiste“: Logo, Abstand `space.6`, ohne Funktion.
- [x] `frontend/docs/design/screen-layouts.md`: Konstante `LOGO_SIZE` (32px) in der Tabelle der Layout-Konstanten.
- [x] `docs/architecture.md` (Assets): Manifest und App-Icons; `docs/known-issues.md`: Android nur Verknüpfung ohne
      HTTPS, Logo ist Platzhalter.

## Akzeptanzkriterien

### AK1: Logo oben in der Leiste
- **Given** der Spielleiter hat ein Abenteuer gestartet und sieht den Admin Screen
- **When** er auf die Navigationsleiste schaut
- **Then** steht ganz oben der Würfel in 32px in der Farbe `primary` des aktiven Themes (Cyber blau, Taverne rot)
- **And** das Logo ist auch bei eingeklapptem Panel und mit Hintergrundbild zu sehen

### AK2: Menüpunkte direkt unter dem Logo
- **Given** der Admin Screen ist offen
- **When** der Spielleiter die Leiste ansieht
- **Then** folgen „Notizen“, „Szenen“ und „Kampf“ 32px unter dem Logo, untereinander mit 8px Abstand
- **And** „Einstellungen“ steht weiter am unteren Ende
- **And** Klick, Tastatur, Hervorhebung und der Punkt am „Kampf“ verhalten sich wie bisher

### AK3: Logo ohne Funktion
- **Given** der Admin Screen ist offen
- **When** der Spielleiter auf das Logo klickt oder mit Tab durch die Leiste geht
- **Then** passiert nichts: kein Panel wechselt, das Logo bekommt keinen Fokus und zeigt keinen Hover

### AK4: Player als App auf dem Homescreen
- **Given** ein Spieler hat die Player-URL auf dem Smartphone geöffnet
- **When** er die Seite über das Browsermenü zum Homescreen hinzufügt
- **Then** zeigt der Homescreen den blauen Würfel auf dunklem Grund mit dem Namen „DnD Portal“
- **And** ein Tipp darauf öffnet die Charakterauswahl; auf dem iPhone ohne Browserleiste

### AK5: Manifest wird ausgeliefert
- **Given** der Prod-Stack läuft (nginx, Port 8080)
- **When** ein Browser `/manifest.webmanifest` und die Icons abruft
- **Then** antwortet nginx mit Status 200, das Manifest mit `Content-Type: application/manifest+json`

## Teststrategie / Verifikation

**Automatisch**
- Frontend (Unit): Manifest-Test nach Subtask „Tests“; bestehender `navRail.spec.ts` bleibt grün.
- Frontend (BDD): neues Logo-Szenario in `adminNavigation.feature`; übrige Admin-Features bleiben grün.
- Lint, Typecheck und Build grün.

**Manuell**
1. Admin in beiden Themes öffnen, mit und ohne Hintergrundbild, Panel offen und eingeklappt: Logo und Abstände wie
   im Mockup (Variante 1).
2. Logo anklicken und mit Tab durch die Leiste gehen: keine Wirkung, kein Fokus.
3. Prod-Stack starten, `curl -I http://localhost:8080/manifest.webmanifest` und die Icon-URLs prüfen.
4. Chrome DevTools, Application → Manifest: Name, Icons (auch maskable) ohne Fehler.
5. Wenn möglich: auf einem iPhone über `http://<IP>:8080/` „Zum Home-Bildschirm“, Icon, Name und Start ohne
   Browserleiste prüfen; auf Android Icon und Name der Verknüpfung.

## Offene Fragen
- keine

## Review
