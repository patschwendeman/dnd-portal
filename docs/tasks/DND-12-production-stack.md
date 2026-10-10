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
- [x] AK3: `VITE_API_URL` wirkt: Build mit `--build-arg VITE_API_URL=http://example.invalid:9999/` → das gebaute
      Bundle enthält diese URL (z. B. `grep` in `dist/assets`); ohne Variable `http://localhost:8000/`.
- [x] AK4: Alle Invarianten eingehalten: `docker compose up` im Root startet Dev wie vorher (Hot-Reload Frontend und
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

### Runde 1 – Review c6bf131

**Empfehlung:** Nacharbeiten. Statisch keine Fehler in Code/Konfiguration; es fehlen die Docker-Nachweise (Daemon lief
nicht, `docker info` Exit 1). Voraussichtlich keine Codeänderung nötig.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Prod-Stack, Routen, Szenen/Medien/Notizen/Sync | nicht prüfbar | `docker compose -f compose.prod.yaml config -q` Exit 0; SPA-Fallback `frontend/nginx.conf:26-28`; Notizen per `fetch('/story/...')` (`DocumentReader.tsx:203-204`), `dist/story/main/*.md` im Build |
| AK2 Lokaler Prod-Build/-Start, CI-Jobs grün | nicht erfüllt | Keine Build-/Start-Ausgabe; CI erst nach Push. Statisch: `working-directory` `frontend`/`backend`, `package-lock.json` vorhanden |
| AK3 `VITE_API_URL` per Build-Arg | teilweise (Docker nicht prüfbar) | Nativ: mit Variable URL im Bundle, kein `localhost:8000`; ohne Variable `localhost:8000`. `ARG`→`ENV` (`frontend/Dockerfile:32-33`) schlüssig |
| AK4 Invarianten | teilweise (Hot-Reload nicht prüfbar) | lint 0 Fehler (1 Altwarnung `WallScreen.tsx:161`), typecheck, 52/52 Tests, build grün; Dev-Config: `target: dev`, `--reload`, Mount `./src:/app/src` erhalten |
| AK5 Doku, Known Issues | erfüllt | Beide Einträge entfernt; `architecture.md`, `frontend/CLAUDE.md`, `backend/CLAUDE.md` angepasst |

**Scope/Konventionen:** Alle Änderungen im Scope, `backend/src` unverändert, ein Commit `setup(DND-12): ...` ohne
KI-Signatur, alle Subtasks im Diff.

#### Blockierende Befunde
- [x] AK1: Prod-Stack per Docker starten, `/`, `/admin`, `/wall`, `/ground` direkt aufrufen und neu laden, Szenenwechsel, Musik, Notizen prüfen; Ergebnis im Plan. – per curl belegt (siehe Nachweise Runde 2); Browser-Teil (Szenenwechsel-Sync, Abspielen) manuell offen.
- [x] AK2: Ausgabe von lokalem Prod-Build und -Start im Plan; CI-Jobs `docker-prod`/`docker` als „nach Push“ markieren und belegen. – lokal belegt (siehe Nachweise Runde 2); CI: nach Push zu prüfen.
- [x] AK3: `docker build --target build --build-arg VITE_API_URL=http://example.invalid:9999/ frontend/` und URL im Ergebnis suchen.
- [x] AK4: Hot-Reload im Dev-Stack für Frontend und Backend prüfen.

#### Hinweise (nicht blockierend)
- Kein Commit `docs(DND-12): approve plan`; Freigabe erfolgte durch den User im Chat, Status-Wechsel ging in den Runden-Commit.
- `frontend/.dockerignore` schließt `.env*` nicht aus (Prod-URL unbeeinflusst, da `ENV` Vorrang hat).
- `gzip_types text/markdown` greift vermutlich nicht: nginx-`mime.types` kennt `.md` nicht (`types { text/markdown md; }`).
- `db` erhält per `env_file` alle Variablen aus `backend/.env` (unschädlich); Healthcheck-Escaping `$${POSTGRES_USER}` korrekt.
- `nginx:1.27-alpine` pinnt nur Minor-Version.
- CI-Path-Filter lösen bei Änderung nur an `compose.prod.yaml` nicht aus (vertretbar).
- `version: '3.4'` in `frontend/docker-compose.yml` erzeugt Warnung (Altlast).

### Runde 2 – Nachweise der Umsetzung

Docker Desktop lief; Dev- und Prod-Stack nie gleichzeitig.

**Hinweise aus Runde 1 umgesetzt**
- `frontend/.dockerignore`: `.env`, `.env.*` ausgeschlossen, `!.env.example` bleibt (im Build-Image liegt nur
  `/app/.env.example`).
- `frontend/nginx.conf`: `location ~* \.md$ { types { } default_type text/markdown; … }` – nur für `.md`, die
  Standard-`mime.types` bleiben für alles andere gültig; `nginx -t` im Image ok.
- `frontend/Dockerfile`: `nginx:1.27.5-alpine` (exakte Patch-Version, `nginx -v` → `nginx/1.27.5`).

**AK2 – lokaler Prod-Build und -Start** (gekürzt)
- `docker build --target prod frontend/` → Exit 0; `vite v5.4.2 building for production... ✓ built in 1.24s`,
  Image-Export ok.
- `docker build backend/` → Exit 0; `Config.Cmd` = `["uvicorn","src.main:app","--host","0.0.0.0","--port","8000"]`
  (ohne `--reload`).
- `docker compose -f compose.prod.yaml up -d --build` → `db` healthy, `app` und `web` gestartet; `ps`:
  `dnd-portal-prod-app-1 0.0.0.0:8000->8000`, `dnd-portal-prod-db-1 (healthy) 0.0.0.0:5432->5432`,
  `dnd-portal-prod-web-1 0.0.0.0:8080->80`; App-Log `Application startup complete.`, kein Reloader.
- **Nach Push zu prüfen:** CI-Jobs `docker-prod` (frontend.yml) und `docker` (backend.yml).

**AK1 – Prod-Stack per curl** (Browser-Interaktion nicht möglich)
- `/`, `/admin`, `/wall`, `/ground`, `/admin/`, `/wall?reload=1` auf :8080 → je `200 text/html`, `index.html`
  (`<title>DnD</title>`, `id="root"`); `Cache-Control: no-cache` auch für `/admin` (Fallback auf `/index.html`).
- API :8000: `/scenes` 200 (29 Szenen → Seeder gelaufen), `/scenes/1` 200, `/maps/main` 200 (25), `/maps/side` 200 (4);
  `access-control-allow-origin: *`.
- Medien :8080: `/assets/images/maps/battle_17.jpg` 200 `image/jpeg`; `/assets/music/battle_maps/boss/Track_44.mp3`
  200 `audio/mpeg`; `/assets/sounds/debuff_1.mp3` 200 `audio/mpeg`; `/story/fight/assets/room_8.png` 200 `image/png`.
- Notizen: alle 46 `.md` unter `public/story` → `200 text/markdown`; `/story/main/tavern.md` mit
  `Content-Encoding: gzip`, Inhalt korrekt (UTF-8).
- Gehashtes Bundle `/assets/index-*.js`: `application/javascript`, `Content-Encoding: gzip`,
  `Cache-Control: public, max-age=31536000, immutable`; Medien in `/assets/<Unterordner>/` ohne Immutable-Header.
- Fehlende Dateien: `/story/main/missing.md` und `/assets/missing.png` → 404 (kein HTML-Fallback).
- `docker compose -f compose.prod.yaml down` → Container und Netzwerk entfernt (Volume bleibt).
- **Manuell offen (User):** im Browser Szenenwechsel im Admin → Sync auf Wall und Ground, Musik abspielen, Notizen
  anzeigen.

**AK3 – `VITE_API_URL`**
- `docker build --target build --build-arg VITE_API_URL=http://example.invalid:9999/ frontend/`, darin
  `grep -rl` in `/app/dist/assets`: `http://example.invalid:9999/` in `index-DOaxWd6r.js`, `http://localhost:8000/`
  nirgends.
- Gegenprobe ohne Build-Arg: `http://localhost:8000/` in `index-yUum66nz.js`, `example.invalid` nirgends.

**AK4 – Invarianten / Dev-Stack**
- `docker compose up -d --build` im Root: `dnd-react_frontend` :5173, `dnd-fastapi_backend` :8000
  (`Started reloader process [1] using WatchFiles`), `dnd-postgres_db` healthy; `/admin` :5173 → 200, `/scenes` :8000 → 200.
- Frontend: Kommentarzeile an `frontend/src/main.tsx` angehängt → Datei im Container geändert (Mount),
  Vite-Log `[vite] page reload src/main.tsx`.
- Backend: Kommentarzeile an `backend/src/main.py` angehängt → `WatchFiles detected changes in 'src/main.py'.
  Reloading...`, `Started server process [11]`, `/scenes` danach 200.
- Beide Änderungen per `git checkout` zurückgenommen (Arbeitsverzeichnis ohne Änderungen an `src`), `docker compose down`.
- `npm run lint` 0 Fehler (1 Altwarnung `WallScreen.tsx:161`), `typecheck` ok, `test:unit` 52/52, `build` ok;
  `docker compose config -q` für `compose.yaml`, `compose.prod.yaml`, `backend/`, `frontend/` ok.
