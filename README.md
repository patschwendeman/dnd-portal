# dnd-portal

Digitale Begleit-App für DnD-Sessions am echten Spieltisch: unterstützt den Spielleiter und erhöht die Immersion
der Spieler durch Bilder, Karten, Musik und Sounds auf mehreren Screens.

| Ordner | Inhalt |
|---|---|
| [`frontend/`](frontend/) | React/Vite-UI: Admin, Player, Wall und Ground Screen |
| [`backend/`](backend/) | FastAPI + PostgreSQL: Szenen, Bilder, Musik |
| [`docs/`](docs/) | Projektbeschreibung (Vision, Domäne, Screens, Architektur, bekannte Probleme) |

## Lokal starten

Alles läuft in Docker (keine lokale Python- oder Node-Installation nötig), Start aus dem Root:

```bash
cp backend/.env.example backend/.env    # einmalig, Platzhalter ersetzen
./dnd.sh dev                            # Entwicklung: DB :5432, API :8000, UI :5173 (/admin, /wall, /ground, /)
./dnd.sh dev --tools                    # zusätzlich pgAdmin :5050
./dnd.sh prod                           # Spieltisch: UI :8080, öffnet Admin/Wall/Ground, zeigt die Smartphone-URL
./dnd.sh logs [service]                 # Logs des Prod-Stacks (db, app, web)
./dnd.sh stop                           # beide Stacks stoppen (DB-Volumes bleiben)
```

`./dnd.sh` startet bei Bedarf Docker Desktop und stoppt vor dem Start den jeweils anderen Stack. Ohne Skript:
`docker compose -f compose.dev.yaml up --build` bzw. `docker compose -f compose.prod.yaml up -d --build`.
Hot-Reload (nur Dev): Änderungen in `frontend/src` (Vite) und `backend/src` (uvicorn `--reload`) wirken ohne Neustart.
Einzelstart weiterhin mit `cd backend && docker compose up` bzw. `cd frontend && docker compose up`.
Hinweise: [CONTRIBUTING.md](CONTRIBUTING.md#lokale-entwicklung).

Details: [CLAUDE.md](CLAUDE.md), [backend/CLAUDE.md](backend/CLAUDE.md), [frontend/CLAUDE.md](frontend/CLAUDE.md).

Dieses Repo vereint die früheren Repos `dnd-portal-frontend` und `dnd-portal-backend` inklusive ihrer Historie.
