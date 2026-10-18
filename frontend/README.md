# dnd-portal – Frontend

UI des DnD Portals mit vier Screens für den Spieltisch. Holt Szenen vom Backend ([`../backend`](../backend/)); die
Szenenbilder und die Musik liefert ebenfalls das Backend aus (Ordner [`../media`](../media/)), Sounds, Icons und
Markdown-Notizen das Frontend selbst aus `public/`.

| Route | Screen | Zweck |
|---|---|---|
| `/admin` | Admin | Spielleiter: Szenen aktivieren, Notizen lesen, Musik und Sounds steuern |
| `/wall` | Wall | Atmosphäre: Hintergrundbild der aktiven Szene, optional Karten-Overlay; spielt als Audioausgabe Musik und Sounds |
| `/ground` | Ground | Digitales Spielbrett: Kampfschauplatz, optional mit Grid |
| `/` | Player | Smartphone der Spieler: Ressourcen des Charakters |

Admin, Wall und Ground folgen dem Spieltisch-Zustand des Servers (aktives Abenteuer, aktive Szene, Theme), den er per
WebSocket pusht; sie können daher auch in verschiedenen Browsern bzw. auf verschiedenen Geräten laufen. Der Player
Screen ist noch nicht angebunden.

## Starten

Empfohlen ist der Start der ganzen Anwendung aus dem Monorepo-Root (siehe [README](../README.md)):

```bash
./script.sh dev
```

Nur das Frontend (das Backend muss auf `:8000` laufen):

```bash
docker compose -f compose.dev.yaml up --build ui   # im Root, Vite-Dev-Server mit Hot-Reload auf :5173
npm ci && npm run dev                              # nativ, Node 18 (siehe .nvmrc)
```

## Konfiguration

`VITE_API_URL` legt die Backend-URL fest (Default `/api/`: der Vite-Dev-Server bzw. nginx leiten `/api/` und `/ws` an
das Backend weiter, Ziel in Dev per `API_PROXY_TARGET`, Default `http://localhost:8000`). Vite setzt den Wert zur
Build-Zeit ins Bundle ein: lokal per `.env` (Vorlage [`.env.example`](.env.example)), im Docker-Build per
`--build-arg VITE_API_URL=…`.

## Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` | Vite-Dev-Server |
| `npm run build` | Typprüfung und Production-Build |
| `npm run typecheck` | nur Typprüfung (`tsc -b`) |
| `npm run lint` | ESLint |
| `npm run test:unit` | Unit-Tests (vitest) |
| `npm run test:e2e` | BDD/E2E (jest-cucumber + Selenium/Chrome); braucht laufendes Backend mit Seed-Daten, läuft nicht in CI |

## Weiterführend

- [CLAUDE.md](CLAUDE.md) – Entwickler-Referenz: Stack, Struktur, Datenfluss, Konfiguration, Konventionen
- [DESIGN.md](DESIGN.md) – Style Guide
- [../docs/](../docs/) – Vision, Screens, Architektur (Start, Production, CI), bekannte Probleme
- [../CONTRIBUTING.md](../CONTRIBUTING.md) – Branches, Commits, Tasks
