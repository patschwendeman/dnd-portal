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
docker compose up --build               # DB :5432, API :8000, UI :5173 (/admin, /wall, /ground, /)
docker compose --profile tools up       # zusätzlich pgAdmin :5050
docker compose logs -f app              # Logs eines Service (db, app, react-app, pgadmin)
docker compose down                     # stoppen (mit -v auch die DB zurücksetzen)
```

Hot-Reload: Änderungen in `frontend/src` (Vite) und `backend/src` (uvicorn `--reload`) wirken ohne Neustart.
Einzelstart weiterhin mit `cd backend && docker compose up` bzw. `cd frontend && docker compose up`.
Hinweise: [CONTRIBUTING.md](CONTRIBUTING.md#lokale-entwicklung).

Details: [CLAUDE.md](CLAUDE.md), [backend/CLAUDE.md](backend/CLAUDE.md), [frontend/CLAUDE.md](frontend/CLAUDE.md).

Dieses Repo vereint die früheren Repos `dnd-portal-frontend` und `dnd-portal-backend` inklusive ihrer Historie.
