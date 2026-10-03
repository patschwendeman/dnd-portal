# dnd-portal

Digitale Begleit-App für DnD-Sessions am echten Spieltisch: unterstützt den Spielleiter und erhöht die Immersion
der Spieler durch Bilder, Karten, Musik und Sounds auf mehreren Screens.

| Ordner | Inhalt |
|---|---|
| [`frontend/`](frontend/) | React/Vite-UI: Admin, Player, Wall und Ground Screen |
| [`backend/`](backend/) | FastAPI + PostgreSQL: Szenen, Bilder, Musik |
| [`docs/`](docs/) | Projektbeschreibung (Vision, Domäne, Screens, Architektur, bekannte Probleme) |

## Lokal starten

```bash
cd backend && docker compose up --build   # API auf :8000 (benötigt backend/.env)
cd frontend && npm install && npm run dev # UI auf :5173 (/admin, /wall, /ground, /)
```

Details: [CLAUDE.md](CLAUDE.md), [backend/CLAUDE.md](backend/CLAUDE.md), [frontend/CLAUDE.md](frontend/CLAUDE.md).

Dieses Repo vereint die früheren Repos `dnd-portal-frontend` und `dnd-portal-backend` inklusive ihrer Historie.
