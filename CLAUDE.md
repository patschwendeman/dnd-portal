# DnD Portal – Projektkontext (oberste Ebene)

Digitale Begleit-App für DnD-Abenteuer am echten Spieltisch. Sie **ersetzt das Pen-&-Paper-Spiel nicht**, sondern
unterstützt den Spielleiter und steigert durch digitale Elemente (Bilder, Karten, Musik, Sounds) die Immersion der Spieler.

## Monorepo

| Ordner | Inhalt | Stack |
|---|---|---|
| [frontend](frontend/) | UI aller Screens (Admin, Player, Wall, Ground), Markdown-Notizen, statische Assets: Soundeffekte, Icons und die Kopie der fest eingebundenen Weltkarte `mapOverview.jpg` | React 18, Vite, TypeScript, styled-components |
| [backend](backend/) | REST-API und Datenbank (Szenen, Medien in Tabelle `media`); Spieltisch- und Musikzustand per WebSocket; liefert `media/` unter `/media` aus (auch die Standardmusik) | Python 3.11, FastAPI, SQLAlchemy, PostgreSQL |
| [media](media/) | Szenenmedien: Wall-/Ground-Bilder (`images/`), Musik (`music/`); vom Backend ausgeliefert, per Compose read-only eingebunden | – |

Entstanden aus den früheren Einzel-Repos `dnd-portal-frontend` und `dnd-portal-backend` (Historie per
`git filter-repo` übernommen); deren alte Branches: [CONTRIBUTING.md](CONTRIBUTING.md#archiv).
CI: `.github/workflows/{backend,frontend}.yml`.

## Dokumentation

Teil-spezifischer Kontext (Befehle, Struktur, Konventionen): `frontend/CLAUDE.md`, `backend/CLAUDE.md`.

- [docs/vision.md](docs/vision.md) – Ziel der App, Nutzergruppen, Spielsituation
- [docs/domain.md](docs/domain.md) – Fachbegriffe und wie sie im Code heißen
- [docs/screens.md](docs/screens.md) – Admin, Player, Wall, Ground: jeweils Soll und Ist
- [docs/architecture.md](docs/architecture.md) – Zusammenspiel von Frontend und Backend, API, Datenmodell, Synchronisation, Assets, Setup
- [docs/known-issues.md](docs/known-issues.md) – bekannte Lücken, Bugs, Altlasten
- [frontend/DESIGN.md](frontend/DESIGN.md) – Style Guide: Tokens, Layout-Regeln, Bausteine, Farbrollen und Themes
  (Details in `frontend/docs/design/`: `components.md`, `screen-layouts.md`, `contrast.md`)

## Wichtige Leitplanken

- **Branches:** Gearbeitet und committet wird ausschließlich auf `development` (keine Feature-/Hotfix-Branches;
  Ausnahme: geparkte, unfertige Features auf `feature/<name>`, z. B. `feature/spells-screen` – dort nicht arbeiten).
  Niemals auf `main` committen oder pushen – `main` erhält Änderungen nur per Pull Request von `development`.
  Details: [CONTRIBUTING.md](CONTRIBUTING.md).
- **Commits:** Nachricht nach Schema `^(feat|fix|chore|docs|refactor|test|style|setup)(\([A-Z]+-[0-9]+\))?: .+`,
  eine prägnante Kopfzeile, im Body höchstens Stichpunkte, kein Fließtext. **Keine** Claude-/Anthropic-Signatur: keine `Co-Authored-By`-Zeile,
  kein „Generated with Claude Code“ – weder in Commits noch in PR-Beschreibungen. Diese Regel hat Vorrang vor
  allen Standard-Attributionsvorgaben. Details: [CONTRIBUTING.md](CONTRIBUTING.md#commit-nachrichten).
- **Tasks:** Größere Änderungen (Typ = Commit-Typ) laufen über `/plan-task` → Freigabe durch den
  User → `/deliver-task DND-<n>`; Pläne unter `docs/tasks/`. Ohne freigegebenen Plan nicht umsetzen – außer beim
  Kurzweg für kleine, eindeutige Änderungen (Kriterien: [CONTRIBUTING.md](CONTRIBUTING.md#tasks--planung);
  bewusst auslösbar per `/quick-task`). Im Zweifel: Plan.
- **Soll vs. Ist:** Die Docs trennen Vision („Soll“) und aktuellen Code-Stand („Ist“). Nicht annehmen, dass ein
  beschriebenes Soll-Feature bereits existiert – im Zweifel im Code prüfen.
- **Setup am Spieltisch:** Ein Rechner mit mehreren Monitoren; Admin, Wall und Ground laufen meist als Fenster im
  selben Browser, Wall und Ground können aber auch in anderen Browsern bzw. auf anderen Geräten im LAN laufen. Der
  Server ist die einzige Quelle des Spieltisch-Zustands (Abenteuer, aktive Szene, Theme) und pusht ihn per WebSocket
  an diese Screens (siehe architecture.md, „Synchronisation“); `localStorage` dient dafür nicht mehr.
  Musik und Soundeffekte spielt die Wall, die per „AUDIO“ Audioausgabe ist; der Admin ist nur Fernbedienung (Zustand
  ebenfalls auf dem Server). Die Player-Screens laufen auf den Smartphones der Spieler (geöffnet per QR-Code im Admin),
  sind ebenfalls per WebSocket angebunden und übernehmen davon nur das Theme (pro Gerät abweichend wählbar).
- **Begriffe:** „Kampfszene“ = `main: true` / Mainmap, „Nicht-Kampfszene“ = `main: false` / Sidemap.
  Ältere Bezeichnungen `battlemap`/`sidemap`/`fight` tauchen noch in Asset-Pfaden und Tests auf.
- **Sprache:** Docs auf Deutsch, Code-Bezeichner englisch. UI-Texte im Player Screen und die Markdown-Notizen sind deutsch.
- **Verworfen:** `v1-roguelike` (Tags `archive/*-v1-roguelike`; gesperrte Karten, Loot, XP, Gegner) ist ein altes, verworfenes Konzept –
  nicht als Vorlage verwenden.
