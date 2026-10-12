# dnd-portal

Digitale Begleit-App für DnD-Sessions am echten Spieltisch: unterstützt den Spielleiter und erhöht die Immersion
der Spieler durch Bilder, Karten, Musik und Sounds auf mehreren Screens.

| Ordner | Inhalt |
|---|---|
| [`frontend/`](frontend/) | React/Vite-UI: Admin, Player, Wall und Ground Screen |
| [`backend/`](backend/) | FastAPI + PostgreSQL: Szenen, Bilder, Musik |
| [`media/`](media/) | Szenenmedien (Wall-/Ground-Bilder, Musik), vom Backend unter `/media` ausgeliefert |
| [`docs/`](docs/) | Projektbeschreibung (Vision, Domäne, Screens, Architektur, bekannte Probleme) |

## Lokal starten

Alles läuft in Docker, Start aus dem Root:

```bash
cp backend/.env.example backend/.env    # einmalig, Platzhalter ersetzen
./script.sh dev                         # Entwicklung: UI :5173 (/admin, /wall, /ground, /), API :8000
./script.sh prod                        # Spieltisch: UI :8080, öffnet Admin/Wall/Ground
```

Weitere Befehle und Details: [docs/architecture.md](docs/architecture.md#lokal-starten).
Mitarbeit: [CONTRIBUTING.md](CONTRIBUTING.md). Projektkontext: [CLAUDE.md](CLAUDE.md).
