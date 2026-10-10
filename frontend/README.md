# dnd-portal – Frontend

UI des DnD Portals mit vier Screens für den Spieltisch. Holt Szenen vom Backend ([`../backend`](../backend/)) und
liefert alle Medien (Bilder, Musik, Sounds, Markdown-Notizen) selbst aus `public/` aus.

| Route | Screen | Zweck |
|---|---|---|
| `/admin` | Admin | Spielleiter: Szenen aktivieren, Notizen lesen, Musik und Sounds steuern |
| `/wall` | Wall | Atmosphäre: Hintergrundbild der aktiven Szene, optional Karten-Overlay |
| `/ground` | Ground | Digitales Spielbrett: Kampfschauplatz, optional mit Grid |
| `/` | Player | Smartphone der Spieler: Ressourcen des Charakters |

Admin, Wall und Ground laufen als Fenster im selben Browser und synchronisieren sich über `localStorage`;
der Player Screen ist nicht angebunden.

## Starten

Empfohlen ist der Start der ganzen Anwendung aus dem Monorepo-Root (siehe [README](../README.md)):

```bash
./script.sh dev
```

Nur das Frontend (das Backend muss auf `:8000` laufen):

```bash
docker compose -f compose.dev.yaml up --build ui           # im Root, Vite-Dev-Server mit Hot-Reload auf :5173
npm ci && npm run dev        # nativ, Node 18 (siehe .nvmrc)
```

## Konfiguration

`VITE_API_URL` legt die Backend-URL fest (Default `http://localhost:8000/`). Vite setzt den Wert zur Build-Zeit ins
Bundle ein: lokal per `.env` (Vorlage [`.env.example`](.env.example)), im Docker-Build per
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

## Medien und Notizen

- `public/assets/` – Bilder (Wall/Ground), Musik, Sounds, Icons
- `public/story/` – Markdown-Notizen für den Admin Screen (deutsch)

Medienpfade kommen aus dem Backend-Seed und müssen zu den Dateien in `public/` passen.

## Weiterführend

- [CLAUDE.md](CLAUDE.md) – Entwickler-Referenz: Stack, Struktur, Datenfluss, Konventionen, CI
- [DESIGN.md](DESIGN.md) – Style Guide
- [../docs/](../docs/) – Vision, Screens, Architektur, bekannte Probleme
- [../CONTRIBUTING.md](../CONTRIBUTING.md) – Branches, Commits, Tasks
