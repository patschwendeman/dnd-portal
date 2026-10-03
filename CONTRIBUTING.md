# Mitarbeit & Branch-Strategie

## Branches

| Branch | Zweck |
|---|---|
| `development` | Arbeits-Branch. Alle Änderungen – Features, Fixes, Doku, auch dringende Fixes – werden hier committet. |
| `main` | Release-Stand. Erhält Änderungen ausschließlich per Pull Request von `development`. |

- Es gibt **keine** separaten Feature- oder Hotfix-Branches.
- Auf `main` wird **nie direkt** committet oder gepusht.
- Releases werden **nicht** getaggt.

## Ablauf

1. Auf `development` arbeiten und committen.
2. `development` pushen – die CI läuft für den jeweils geänderten Teil (`backend/` bzw. `frontend/`).
3. Für ein Release einen Pull Request `development` → `main` auf GitHub öffnen und mergen, wenn die CI grün ist.

## CI

`.github/workflows/backend.yml` und `.github/workflows/frontend.yml` laufen bei Pushes auf `main` und `development`,
jeweils nur bei Änderungen im zugehörigen Ordner (bzw. an der Workflow-Datei selbst): Docker-Image bauen und nach
`ghcr.io/<owner>/dnd-portal-backend` bzw. `dnd-portal-frontend` pushen, darin Tests und Lint ausführen.

## Archiv

Die Branches `test` und `v1-roguelike` der früheren Einzel-Repos liegen als Tags
`archive/{backend,frontend}-{test,v1-roguelike}` vor. Sie werden nicht weiterentwickelt.
