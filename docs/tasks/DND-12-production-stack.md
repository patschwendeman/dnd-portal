# DND-12: API-URL per Env-Variable und Production-Stack für den Spieltisch

**Typ:** setup
**Status:** Im Review

## Kontext & Ziel

Am Spielabend läuft heute derselbe Stack wie in der Entwicklung: Vite-Dev-Server mit Hot-Reload und gemountetem
Quellcode, Backend mit `uvicorn --reload`. Das ist langsamer, empfindlicher und nicht für den Betrieb gedacht; ein
Production-Image fehlt. Außerdem ist die API-URL im Frontend fest auf `http://localhost:8000/` verdrahtet
([apiClient.ts](../../frontend/src/api/apiClient.ts)). Ziel: ein eigener Production-Stack (`compose.prod.yaml`), der
mit einem Befehl Frontend (statischer Build hinter nginx), Backend (ohne Reload, ohne Code-Mount) und DB startet, und
eine per Build-Variable konfigurierbare API-URL. Die lokale Entwicklung bleibt unverändert.

## Invarianten

- `docker compose up` im Root (und in `backend/` bzw. `frontend/`) verhält sich wie vorher: Vite-Dev-Server auf
  :5173 mit Hot-Reload und Mount von `frontend/`, API auf :8000 mit `--reload` und Mount von `backend/src`, DB, pgAdmin
  per Profil `tools`.
- `npm run dev`/`npm run build` ohne gesetzte Variable rufen die API wie bisher unter `http://localhost:8000/` auf.
- App-Verhalten (Screens, Routen `/`, `/admin`, `/wall`, `/ground`, Sync über `localStorage`) unverändert.
- API-Endpoints und Datenmodell unverändert; Backend-Code (`backend/src`) unverändert.
- Bestehende CI-Jobs (Build, Typecheck, Lint, Tests) unverändert.

## Scope / Non-Goals

**Im Scope**
- `VITE_API_URL` im Frontend (Build-Zeit), Typ, `.env.example`.
- Frontend-Dockerfile als Multi-Stage (`dev`, `build`, `prod`), nginx-Konfiguration mit SPA-Fallback.
- Backend-Dockerfile: `CMD` ohne `--reload` (Dev setzt `--reload` weiter per Compose-`command`).
- `compose.prod.yaml` im Root für den ganzen Stack.
- CI: Production-Images bauen (ohne Push).
- Doku: `docs/architecture.md` (Lokal starten, Assets), `frontend/CLAUDE.md`, `backend/CLAUDE.md`,
  `docs/known-issues.md`.

**Nicht im Scope**
- Deployment auf einen entfernten Server, HTTPS, Domain, Authentifizierung.
- Image-Registry / Push, Versionierung von Images.
- Verkleinern von `public/` (≈ 289 MB Medien landen im Image).
- Laufzeit-Konfiguration der API-URL (env.js) oder Reverse-Proxy `/api`.
- CORS-Einstellungen des Backends (bleibt `*`).
- Gleichzeitiger Betrieb von Dev- und Prod-Stack (siehe E5).

## Entscheidungen

### E1: Ganzer Stack am Spieltisch per `compose.prod.yaml`
- **Entscheidung:** Neue Datei `compose.prod.yaml` im Root. Start: `docker compose -f compose.prod.yaml up -d --build`.
  Services: `db` (wie Dev, eigenes Volume), `app` (Backend-Image, ohne Mount, ohne `--reload`, `env_file:
  backend/.env`, `depends_on` DB healthy, `restart: unless-stopped`), `web` (Frontend-`prod`-Stage, nginx,
  `restart: unless-stopped`). pgAdmin nicht enthalten.
- **Verworfene Alternativen:** nur Frontend-Image; Server-Deployment.

### E2: API-URL als `VITE_API_URL` zur Build-Zeit
- **Entscheidung:** `apiClient` nutzt `import.meta.env.VITE_API_URL ?? 'http://localhost:8000/'`. Typ in
  `src/vite-env.d.ts` (`ImportMetaEnv`). `frontend/.env.example` dokumentiert die Variable. Im Prod-Build kommt sie
  als Build-Argument (`ARG VITE_API_URL`) aus `compose.prod.yaml` (Default `http://localhost:8000/`, da Admin, Wall
  und Ground im Browser auf dem Spieltisch-Rechner laufen). Andere URL = Image neu bauen.
- **Verworfene Alternativen:** nginx-Proxy `/api`; Laufzeit-Konfiguration per `env.js`.

### E3: Ein Frontend-Dockerfile mit Stages
- **Entscheidung:** `frontend/Dockerfile` mit Stages
  - `dev`: wie heute (`node:18-slim`, `npm install`, `npm run dev-exposed`, Port 5173),
  - `build`: `npm ci`, `ARG VITE_API_URL`, `npm run build`,
  - `prod`: `nginx` (Alpine, feste Version) mit `dist/` und eigener `nginx.conf`: SPA-Fallback
    (`try_files $uri $uri/ /index.html`), sinnvolle Cache-Header für gehashte Assets unter `/assets/`, gzip für
    Text-Typen.
  `frontend/docker-compose.yml` setzt `target: dev`. `.dockerignore` prüfen (`node_modules`, `dist` bleiben draußen).
- **Verworfene Alternative:** separates `Dockerfile.prod`.

### E4: CI baut die Production-Images
- **Entscheidung:** Neuer Job in `.github/workflows/frontend.yml`: `docker build --target prod frontend/` (ohne Push).
  In `.github/workflows/backend.yml` ein Job `docker build backend/`, da der Prod-Stack das Backend-Image nutzt.
- **Verworfene Alternative:** nur lokal prüfen.

### E5: Ports und Parallelbetrieb
- **Entscheidung:** Frontend im Prod-Stack auf Port **8080** (nginx intern 80), API auf 8000, DB auf 5432 – Dev und
  Prod laufen nicht gleichzeitig (gleiche Ports für API/DB). Prod-Stack bekommt einen eigenen Projektnamen
  (`name: dnd-portal-prod`) und damit ein eigenes DB-Volume; `container_name`-Einträge der Dev-Dateien werden nicht
  übernommen. Der Seeder füllt die Prod-DB beim ersten Start (wie in Dev).
- **Begründung:** 8080 verwechselt man nicht mit dem Dev-Server (5173) und braucht keine Sonderrechte.

## Subtasks

### Frontend
- [x] `src/api/apiClient.ts`: `baseURL` aus `import.meta.env.VITE_API_URL` mit Fallback (E2).
- [x] `src/vite-env.d.ts`: `ImportMetaEnv` mit `readonly VITE_API_URL?: string`.
- [x] `frontend/.env.example` mit `VITE_API_URL=http://localhost:8000/` und Kommentar; `.env` in `.gitignore`
      prüfen.
- [x] `frontend/Dockerfile` als Multi-Stage (E3); `frontend/nginx.conf`.
- [x] `frontend/docker-compose.yml`: `build.target: dev`.

### Backend
- [x] `backend/Dockerfile`: `CMD` ohne `--reload` (Dev-Compose behält `command` mit `--reload`).

### Root / CI
- [x] `compose.prod.yaml` nach E1/E5.
- [x] `.github/workflows/frontend.yml`: Job `docker-prod` (`docker build --target prod`, Build-Arg Default).
- [x] `.github/workflows/backend.yml`: Job `docker` (`docker build`).

### Doku
- [x] `docs/architecture.md`: Abschnitt „Lokal starten“ um „Am Spieltisch (Production)“ ergänzen
      (Befehle, Ports, URL http://localhost:8080/admin usw., Smartphones über `http://<IP des Rechners>:8080/`);
      Hinweis Assets (in Prod liefert nginx `public/` aus dem Build); `VITE_API_URL`.
- [x] `frontend/CLAUDE.md`: Dockerfile-Stages, `VITE_API_URL`, Node-Version-Hinweis (Stage `dev` und `build`).
- [x] `backend/CLAUDE.md`: `CMD` ohne Reload, Reload kommt aus Dev-Compose.
- [x] `docs/known-issues.md`: Einträge „API-Base-URL fest verdrahtet …“ und „Docker-Image startet den
      Vite-Dev-Server …“ entfernen.

## Akzeptanzkriterien

- [ ] AK1: `docker compose -f compose.prod.yaml up -d --build` startet DB, API und nginx; http://localhost:8080/admin,
      `/wall`, `/ground` und `/` laden (auch bei direktem Aufruf/Reload einer Unterroute), Szenen, Bilder, Musik und
      Notizen funktionieren, Szenenwechsel synchronisiert Wall und Ground.
- [ ] AK2: Wirksamkeit nachgewiesen: lokaler Prod-Build und -Start (Ausgabe/Screenshots im Review), CI-Jobs
      `docker-prod` (Frontend) und `docker` (Backend) grün nach dem Push.
- [ ] AK3: `VITE_API_URL` wirkt: Build mit `--build-arg VITE_API_URL=http://example.invalid:9999/` → das gebaute
      Bundle enthält diese URL (z. B. `grep` in `dist/assets`); ohne Variable `http://localhost:8000/`.
- [ ] AK4: Alle Invarianten eingehalten: `docker compose up` im Root startet Dev wie vorher (Hot-Reload Frontend und
      Backend geprüft), `npm run lint`, `typecheck`, `test:unit`, `build` grün.
- [x] AK5: Doku nachgezogen, beide Known Issues entfernt.

## Teststrategie / Verifikation

**Automatisch**
- Frontend: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`.
- `docker compose config -q` im Root, in `backend/`, in `frontend/` und für `compose.prod.yaml`.
- CI nach dem Push: neue Docker-Jobs grün.

**Manuell**
1. Dev-Stack: `docker compose up --build`, Änderung in einer Frontend- und einer Backend-Datei → Hot-Reload greift;
   danach `docker compose down`.
2. Prod-Stack: `docker compose -f compose.prod.yaml up -d --build`; `/admin`, `/wall`, `/ground`, `/` direkt aufrufen
   und neu laden; Szene wechseln; Musik und Notizen prüfen; `docker compose -f compose.prod.yaml down`.
3. AK3: `docker build --target build --build-arg VITE_API_URL=http://example.invalid:9999/ frontend/` und im
   Build-Ergebnis nach der URL suchen.

## Offene Fragen
- keine

## Review
