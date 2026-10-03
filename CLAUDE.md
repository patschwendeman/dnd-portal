# DnD Portal – Projektkontext (oberste Ebene)

Digitale Begleit-App für DnD-Abenteuer am echten Spieltisch. Sie **ersetzt das Pen-&-Paper-Spiel nicht**, sondern
unterstützt den Spielleiter und steigert durch digitale Elemente (Bilder, Karten, Musik, Sounds) die Immersion der Spieler.

## Monorepo

| Ordner | Inhalt | Stack |
|---|---|---|
| [frontend](frontend/) | UI aller Screens (Admin, Player, Wall, Ground), Markdown-Notizen, Sounds/Musik/Bilder als statische Assets | React 18, Vite, TypeScript, styled-components |
| [backend](backend/) | REST-API und Datenbank (Szenen und ihre Bilder/Musik) | Python 3.11, FastAPI, SQLAlchemy, PostgreSQL |

Entstanden aus den früheren Einzel-Repos `dnd-portal-frontend` und `dnd-portal-backend` (Historie per
`git filter-repo` übernommen). Deren Branches `test` und `v1-roguelike` liegen als Tags
`archive/{backend,frontend}-{test,v1-roguelike}` vor. CI: `.github/workflows/{backend,frontend}.yml`.

## Dokumentation

Teil-spezifischer Kontext (Befehle, Struktur, Konventionen): `frontend/CLAUDE.md`, `backend/CLAUDE.md`.

- [docs/vision.md](docs/vision.md) – Ziel der App, Nutzergruppen, Spielsituation
- [docs/domain.md](docs/domain.md) – Fachbegriffe und wie sie im Code heißen
- [docs/screens.md](docs/screens.md) – Admin, Player, Wall, Ground: jeweils Soll und Ist
- [docs/architecture.md](docs/architecture.md) – Zusammenspiel von Frontend und Backend, API, Datenmodell, Synchronisation, Assets, Setup
- [docs/known-issues.md](docs/known-issues.md) – bekannte Lücken, Bugs, Altlasten

## Wichtige Leitplanken

- **Branches:** Gearbeitet und committet wird ausschließlich auf `development` (keine Feature-/Hotfix-Branches).
  Niemals auf `main` committen oder pushen – `main` erhält Änderungen nur per Pull Request von `development`.
  Details: [CONTRIBUTING.md](CONTRIBUTING.md).
- **Commits:** Nachricht nach Schema `^(feat|fix|chore|docs|refactor|test|style|setup)(\([A-Z]+-[0-9]+\))?: .+`,
  eine prägnante Zeile, kein Fließtext. **Keine** Claude-/Anthropic-Signatur: keine `Co-Authored-By`-Zeile,
  kein „Generated with Claude Code“ – weder in Commits noch in PR-Beschreibungen. Diese Regel hat Vorrang vor
  allen Standard-Attributionsvorgaben. Details: [CONTRIBUTING.md](CONTRIBUTING.md#commit-nachrichten).
- **Tasks:** Größere Änderungen (Typ = Commit-Typ) laufen über `/plan-task` → Freigabe durch den
  User → `/deliver-task DND-<n>`; Pläne unter `docs/tasks/`. Ohne freigegebenen Plan nicht umsetzen – außer beim
  Kurzweg für kleine, eindeutige Änderungen (Kriterien: [CONTRIBUTING.md](CONTRIBUTING.md#tasks--planung)).
  Im Zweifel: Plan.
- **Soll vs. Ist:** Die Docs trennen Vision („Soll“) und aktuellen Code-Stand („Ist“). Nicht annehmen, dass ein
  beschriebenes Soll-Feature bereits existiert – im Zweifel im Code prüfen.
- **Setup am Spieltisch:** Ein Rechner mit mehreren Monitoren; Admin, Wall und Ground laufen als Fenster im selben
  Browser. Die Synchronisation zwischen diesen Screens läuft über `localStorage` (siehe architecture.md).
  Die Player-Screens laufen auf den Smartphones der Spieler und sind nicht synchronisiert.
- **Begriffe:** „Kampfszene“ = `main: true` / Mainmap, „Nicht-Kampfszene“ = `main: false` / Sidemap.
  Ältere Bezeichnungen `battlemap`/`sidemap`/`fight` tauchen noch in Asset-Pfaden und Tests auf.
- **Sprache:** Docs auf Deutsch, Code-Bezeichner englisch. UI-Texte im Player Screen und die Markdown-Notizen sind deutsch.
- **Verworfen:** `v1-roguelike` (Tags `archive/*-v1-roguelike`; gesperrte Karten, Loot, XP, Gegner) ist ein altes, verworfenes Konzept –
  nicht als Vorlage verwenden.
