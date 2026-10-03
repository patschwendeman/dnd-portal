# DND-3: Lokale Entwicklung komplett in Docker, Start aus dem Root

**Typ:** setup
**Status:** Fertig

## Kontext & Ziel

Gearbeitet wird meist im Monorepo-Root, es gibt aber keinen gemeinsamen Startweg: Backend per
`cd backend && docker compose up`, Frontend per `cd frontend && npm run dev`. Ist-Befunde:

- `backend/.env` fehlt im Monorepo (liegt nur im alten Ordner `DnD/dnd-portal-backend/.env`). Sie enthält
  `HOST=db` – die API läuft also nur im Compose-Netz.
- Lokal ist nur Python 3.9 installiert, das Backend braucht 3.11.
- Lokal läuft Node 24, CI und `frontend/Dockerfile` nutzen Node 18.
- `frontend/docker-compose.yml` hat keinen Source-Mount – kein Hot-Reload im Container.
- Die Backend-App bekommt ihre Env nur über die per `COPY . /app` ins Image kopierte `.env` (keine `.dockerignore`).

Ziel: Die ganze Anwendung (DB, API, Frontend) startet mit einem Befehl aus dem Root in Docker, mit Hot-Reload.

## Invarianten

- App-Code (`backend/src`, `frontend/src`), `frontend/package.json`, `frontend/package-lock.json`,
  `backend/requirements.txt` unverändert.
- CI-Prüfungen unverändert (geändert wird nur die Quelle der Node-Version, siehe E5).
- `cd backend && docker compose up` und `cd frontend && docker compose up` funktionieren weiterhin einzeln.
- Ports unverändert: Frontend 5173, API 8000, Postgres 5432, pgAdmin 5050.
- Das Frontend erreicht die API weiterhin über `http://localhost:8000/` (fest in `frontend/src/api/apiClient.ts`).

## Scope / Non-Goals

**Im Scope**
- Root-`compose.yaml`.
- Anpassungen an `backend/docker-compose.yml` und `frontend/docker-compose.yml`.
- `.dockerignore` für Backend und Frontend.
- `backend/.env.example`, `frontend/.nvmrc`, `.claude/launch.json`.
- Doku.

**Nicht im Scope**
- Produktions-Images, Deployment.
- API-URL konfigurierbar machen.
- Dockerfiles umbauen (z. B. `npm ci`, Multi-Stage).
- DB-Migrationen.
- Node-Upgrade.

## Entscheidungen

### E1: Root-Compose bindet die Teil-Dateien per `include` ein
- **Entscheidung:** `compose.yaml` im Root nutzt Compose-`include` für `backend/docker-compose.yml` und
  `frontend/docker-compose.yml`; beim Backend mit `env_file: backend/.env` für die Variablen-Interpolation.
- **Verworfene Alternativen:** Eigene Service-Definitionen im Root (doppelte Pflege); Teil-Dateien löschen
  (User will sie für den Einzelstart behalten).
- **Begründung:** Eine Quelle je Teil, trotzdem Start aus dem Root.

### E2: Frontend im Container mit Hot-Reload
- **Entscheidung:** Source-Bind-Mount `./:/app` plus separates Volume für `/app/node_modules`;
  `CHOKIDAR_USEPOLLING=true` bleibt.
- **Verworfene Alternativen:** Frontend nativ per `npm run dev` (vom User verworfen: alles in Docker).
- **Begründung:** Hot-Reload ohne lokale Node-Installation; Polling ist auf macOS mit Bind-Mounts zuverlässig.

### E3: Env der Backend-App per `env_file`, nicht im Image
- **Entscheidung:** Service `app` erhält `env_file: .env`; `backend/.dockerignore` schließt `.env` aus.
- **Begründung:** Secrets landen nicht im Image; Änderungen an `.env` wirken ohne Rebuild.

### E4: pgAdmin optional
- **Entscheidung:** `pgadmin` erhält `profiles: [tools]`; Start nur mit `docker compose --profile tools up`.
- **Begründung:** Wird selten gebraucht, soll nicht bei jedem Start laufen.

### E5: Node-Version aus `.nvmrc`
- **Entscheidung:** `frontend/.nvmrc` mit `18`; die CI liest sie per `node-version-file: frontend/.nvmrc`.
  `frontend/Dockerfile` bleibt `node:18-slim` – die Doku weist darauf hin, beides synchron zu halten.
- **Begründung:** Eine Quelle für CI und lokale Node-Tools (nvm/fnm) statt fest verdrahteter Version im Workflow.

## Subtasks

### Backend
- [x] `backend/docker-compose.yml`: `app` erhält `env_file: .env`; `pgadmin` erhält `profiles: [tools]`;
      Healthcheck auf `$$POSTGRES_USER`/`$$POSTGRES_DB` umstellen, falls die Interpolation über `include`
      sonst nicht greift.
- [x] `backend/.dockerignore`: `.env`, `__pycache__/`, `*.pyc`, `.git`.
- [x] `backend/.env.example`: alle Schlüssel (`DRIVERNAME`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`,
      `HOST`, `PORT`, `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`) mit Platzhaltern bzw. unkritischen
      Defaults (`DRIVERNAME=postgresql+psycopg2`, `HOST=db`, `PORT=5432`); Kommentar zu `HOST=db`.

### Frontend
- [x] `frontend/docker-compose.yml`: Volumes `./:/app` und `/app/node_modules`; sonst unverändert.
- [x] `frontend/.dockerignore`: `node_modules`, `dist`.
- [x] `frontend/.nvmrc`: `18`.

### Root / Tooling
- [x] `compose.yaml` im Root mit `include` beider Teil-Dateien (E1).
- [x] `.github/workflows/frontend.yml`: in allen Jobs `node-version: 18` → `node-version-file: frontend/.nvmrc`.
- [x] `.claude/launch.json`: Konfiguration `dnd-portal` (`docker compose up`, Port 5173).

### Doku
- [x] `README.md` („Lokal starten“), `docs/architecture.md` („Lokal starten“), `backend/CLAUDE.md` und
      `frontend/CLAUDE.md` (Befehle), `CONTRIBUTING.md` (kurzer Abschnitt „Lokale Entwicklung“): Start aus dem
      Root (`docker compose up`, `--profile tools`, `down`, `logs -f`); `backend/.env` aus `.env.example` anlegen.
- [x] `docs/known-issues.md`: Punkte zu fehlender `.env.example` und Dev-Compose ohne Hot-Reload
      entfernen bzw. aktualisieren.

## Akzeptanzkriterien

Vorbedingung: `backend/.env` existiert (z. B. aus `DnD/dnd-portal-backend/.env` kopiert).

- [ ] AK1: Im Root startet `docker compose up` DB, API und Frontend (ohne pgAdmin);
      `http://localhost:5173/admin` lädt Szenen, `curl localhost:8000/scenes/details/` liefert Daten.
- [ ] AK2: `docker compose --profile tools up` startet zusätzlich pgAdmin auf :5050.
- [ ] AK3: Hot-Reload: Eine Änderung in `frontend/src` erscheint ohne Neustart im Browser; eine Änderung in
      `backend/src` lädt uvicorn neu (Log-Beleg). Teständerungen danach verwerfen.
- [ ] AK4: `cd backend && docker compose up` und `cd frontend && docker compose up` funktionieren weiterhin einzeln.
- [ ] AK5: `.env` ist nicht im Backend-Image (`docker compose run --rm app ls -a /app` zeigt keine `.env`) und
      nicht im Git (`git check-ignore backend/.env`).
- [ ] AK6: CI grün nach Push; die Frontend-Jobs nutzen Node aus `.nvmrc` (Log zeigt v18).
- [ ] AK7: Invarianten eingehalten – `git diff --stat` ohne App-Code, Lockfile, `requirements.txt`.

## Teststrategie / Verifikation

**Automatisch**
- `docker compose config` im Root und in beiden Teilordnern ohne Fehler.
- Frontend lokal: `npm run lint`, `npm run typecheck`, `npm run test:unit` unverändert grün.

**Manuell**
1. Root: `docker compose up --build`, `/admin` im Browser öffnen, Szene wechseln.
2. Hot-Reload Frontend und Backend wie in AK3.
3. `docker compose --profile tools up`, pgAdmin auf :5050 öffnen.
4. `docker compose down`; Einzelstart in `backend/` und `frontend/` prüfen.
5. Nach Push (nur nach Bestätigung durch den User) CI-Lauf prüfen.

## Offene Fragen

- ~~Laufzeitprüfung von AK1/AK2/AK4 blockiert durch Alt-Container (`dnd_postgres_db`, `dnd_fastapi`,
  `pgadmin4_container`) aus `DnD/dnd-portal-backend`.~~ Erledigt: Der User hat die Container entfernt, danach
  wurden AK1/AK2/AK4 geprüft (siehe Review Runde 1).

## Review
<!--
Wird von der Hauptsession im Skill /deliver-task gepflegt – nicht beim Planen ausfüllen.
Pro Review-Runde ein Eintrag; ältere Runden bleiben stehen.
-->

### Runde 1 – 2026-10-03
**Empfehlung:** Abnahme (AK6 erst nach Push prüfbar)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Root `docker compose up`: nur `dnd_postgres_db` (healthy), `dnd_fastapi`, `dnd-portal-react-app-1`, kein pgAdmin. `curl localhost:8000/scenes/details/` → 29 Szenen; `/admin` im Browser lädt Szenen, alle Requests an :8000 (`/scenes/details/`, `/maps/side`, `/maps/main?players=false`, `/scenes/details/1`) → 200. pgAdmin mit `profiles: [tools]` (`backend/docker-compose.yml:22`). |
| AK2 | erfüllt | `docker compose --profile tools up -d` startet zusätzlich `pgadmin4_container` auf 0.0.0.0:5050; `curl -L localhost:5050` → 200. |
| AK3 | erfüllt | Backend: `touch backend/src/main.py` → uvicorn-Log `WatchFiles detected changes in 'src/main.py'. Reloading...`. Frontend: temporäre Änderung in `frontend/src/sceens/players/DnDScreen.tsx` → Vite-Log `hmr update`, ausgeliefertes Modul enthält den Marker sofort. Änderungen verworfen, `git status` sauber. |
| AK4 | erfüllt | `cd backend && docker compose up -d` → API liefert 29 Szenen; `cd frontend && docker compose up -d` → `/admin` 200. `docker compose config -q` im Root und in beiden Teilordnern fehlerfrei. |
| AK5 | erfüllt | `docker compose run --rm --no-deps app ls -a /app` zeigt keine `.env` (nur `.env.example`); `git check-ignore -v backend/.env` → `backend/.gitignore:123:.env`. |
| AK6 | offen (nach Push) | Konfiguration korrekt: alle 4 Jobs in `.github/workflows/frontend.yml` mit `node-version-file: frontend/.nvmrc`, `.nvmrc` = `18`. |
| AK7 | erfüllt | `git diff --stat dd70a7e..HEAD` ohne App-Code, Lockfile, `package.json`, `requirements.txt`, Dockerfiles, `backend.yml`; Ports unverändert. |

**Blockierende Befunde**
- keine

**Hinweise**
- `frontend/docker-compose.yml:1`: veraltetes `version: '3.4'` erzeugt bei jedem Compose-Aufruf eine Warnung (bestand schon vorher, außerhalb des Plans; Kandidat für Kurzweg-chore).
- `README.md` „keine lokale Python- oder Node-Installation nötig“ gilt fürs Starten, nicht für lokales `npm run lint/typecheck/test:unit`; ggf. präzisieren.
- Healthcheck nicht auf `$$POSTGRES_USER` umgestellt – nicht nötig, Interpolation über `include` greift (`pg_isready -U dnd -d dnd_portal`).
- Getrennte DB-Volumes `dnd-portal_postgres_data` (Root) und `backend_postgres_data` (Einzelstart) wie dokumentiert; Alt-Volume `dnd-portal-backend_postgres_data` existiert noch (Aufräumen nach Entscheidung des Users).

**Checks:** `docker compose config -q` Root/backend/frontend OK; Frontend `npm run lint` (0 Fehler, 3 bekannte Warnungen), `npm run typecheck`, `npm run test:unit` 5/5 grün; Backend `pylint src/` 10.00/10, `unittest` 0 Tests (bekannt); 12 Commits nach Schema, ohne KI-Signatur, auf `development`; nur Dateien im Scope geändert.

### Nachtrag – 2026-10-03
AK6 erfüllt: Nach dem Push von `76db855` auf `development` sind beide Workflows grün:
[Frontend CI 37133006816](https://github.com/patschwendeman/dnd-portal/actions/runs/37133006816) (`build`, `lint`,
`test`, `typecheck` success) und [Backend CI 37133006810](https://github.com/patschwendeman/dnd-portal/actions/runs/37133006810)
(`lint`, `test` success). Die Job-Logs sind ohne Login nicht einsehbar, daher ist die Zeile „v18“ nicht direkt
belegt; `setup-node` mit `node-version-file: frontend/.nvmrc` (Inhalt `18`) lief in allen 4 Jobs erfolgreich.
Annotations: nur die bekannten Lint-Warnungen sowie GitHub-Hinweise (Action-Runtime Node 20 → 24, `ubuntu-latest`
→ Ubuntu 26), keine davon durch DND-3 verursacht. Abnahme durch den User.

### Nachtrag 2 – 2026-10-03
Nach Abschluss Containernamen geändert (Commit `setup: rename docker containers`): `dnd_postgres_db` →
`dnd-postgres_db`, `dnd_fastapi` → `dnd-fastapi_backend`, `pgadmin4_container` → `dnd-pgadmin4`; das Frontend hat
neu den festen Namen `dnd-react_frontend` (vorher von Compose vergeben, z. B. `dnd-portal-react-app-1`). Die Belege
in Review Runde 1 nennen bewusst die Namen zum Zeitpunkt der Prüfung. Folge: Auch Root-Start und Einzelstart in
`frontend/` schließen sich jetzt gegenseitig aus (siehe CONTRIBUTING.md, „Lokale Entwicklung“).
