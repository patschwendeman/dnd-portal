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

- Der Dev-Stack verhält sich wie vorher, gestartet per `./dnd.sh dev` bzw. `docker compose -f compose.dev.yaml up`
  im Root (Root-Datei umbenannt, siehe E7) und weiterhin per `docker compose up` in `backend/` bzw. `frontend/`: Vite-Dev-Server auf
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
- Erweiterung nach Browser-Test (Runde 3): einheitliche Container-Namen, `compose.yaml` → `compose.dev.yaml`,
  einheitlicher CI-Jobname, Start-Skript `dnd.sh` (E6–E9).
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
- **Ergänzt durch E6:** Prod bekommt doch eigene, eindeutige `container_name`-Einträge.

### E6: Container-Namen einheitlich `dnd-<umgebung>-<rolle>`
- **Entscheidung:**

  | Rolle | Dev (bisher) | Dev (neu) | Prod (neu) |
  |---|---|---|---|
  | DB | dnd-postgres_db | dnd-dev-db | dnd-prod-db |
  | API | dnd-fastapi_backend | dnd-dev-api | dnd-prod-api |
  | Frontend | dnd-react_frontend | dnd-dev-frontend | dnd-prod-frontend |
  | pgAdmin | dnd-pgadmin4 | dnd-dev-pgadmin | – |

  Dev: `container_name` in `backend/docker-compose.yml` und `frontend/docker-compose.yml`; Prod: in
  `compose.prod.yaml`. Service-Namen (`db`, `app`, `react-app`, `web`) bleiben. `compose.dev.yaml` bekommt
  `name: dnd-portal-dev` → neues Dev-DB-Volume, der Seeder füllt es; das alte Volume `dnd-portal_postgres_data` wird
  nicht automatisch gelöscht (Hinweis in der Doku).
- **Begründung:** Prod-Container hießen nur `db-1`, `app-1`, `web-1` (Rückmeldung des Users nach dem Browser-Test).

### E7: `compose.yaml` → `compose.dev.yaml`
- **Entscheidung:** Umbenennen per `git mv` (Symmetrie zu `compose.prod.yaml`). `docker compose up` ohne `-f` im Root
  findet danach keine Datei mehr; Start über `./dnd.sh dev` oder `docker compose -f compose.dev.yaml up --build`.

### E8: CI-Jobs heißen in beiden Workflows `docker-prod`
- **Entscheidung:** Backend-Job `docker` → `docker-prod`. Kommentar: Backend-Dockerfile ist einstufig, daher kein
  `--target` (Frontend braucht `--target prod` wegen der Stages).

### E9: Start-Skript `dnd.sh` im Root
- **Entscheidung:** bash, ausführbar, `set -euo pipefail`, macOS.
  - `./dnd.sh dev [--tools]`: Docker sicherstellen, Prod-Stack stoppen, `docker compose -f compose.dev.yaml
    [--profile tools] up --build` im Vordergrund (Ctrl+C beendet).
  - `./dnd.sh prod`: Docker sicherstellen, Dev-Stack stoppen, `docker compose -f compose.prod.yaml up -d --build`,
    warten bis http://localhost:8080 antwortet (Timeout), dann per `open` `/admin`, `/wall`, `/ground` öffnen und die
    Smartphone-URL `http://<ipconfig getifaddr en0>:8080/` ausgeben. `VITE_API_URL` aus der Umgebung wird durchgereicht.
  - `./dnd.sh stop`: beide Stacks `down` (ohne `-v`).
  - `./dnd.sh logs [service]`: `docker compose -f compose.prod.yaml logs -f`.
  - Ohne/unbekanntes Argument: Hilfe, Exit 1.
  - Docker sicherstellen: läuft `docker info` nicht → `open -a Docker`, bis ca. 120 s auf `docker info` warten, sonst
    klare Fehlermeldung.
- **Verworfene Alternativen:** zwei Skripte (`dev.sh`/`prod.sh`); Makefile.

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

### Runde 3 (E6–E9)
- [x] `compose.yaml` → `compose.dev.yaml` (`git mv`), Kopfkommentar, `name: dnd-portal-dev` (E6, E7).
- [x] `container_name` nach E6 in `backend/docker-compose.yml`, `frontend/docker-compose.yml`, `compose.prod.yaml`.
- [x] `.github/workflows/backend.yml`: Job → `docker-prod` (E8).
- [x] `dnd.sh` nach E9 (ausführbar).
- [x] Doku: `README.md`, `CONTRIBUTING.md`, `docs/architecture.md`, `frontend/CLAUDE.md`, `backend/CLAUDE.md`,
      ggf. Root-`CLAUDE.md`, Kommentare in `compose.prod.yaml`: Startbefehle auf `./dnd.sh` bzw. `-f compose.dev.yaml`,
      neue Container-Namen, Hinweis altes Dev-Volume.

### Doku
- [x] `docs/architecture.md`: Abschnitt „Lokal starten“ um „Am Spieltisch (Production)“ ergänzen
      (Befehle, Ports, URL http://localhost:8080/admin usw., Smartphones über `http://<IP des Rechners>:8080/`);
      Hinweis Assets (in Prod liefert nginx `public/` aus dem Build); `VITE_API_URL`.
- [x] `frontend/CLAUDE.md`: Dockerfile-Stages, `VITE_API_URL`, Node-Version-Hinweis (Stage `dev` und `build`).
- [x] `backend/CLAUDE.md`: `CMD` ohne Reload, Reload kommt aus Dev-Compose.
- [x] `docs/known-issues.md`: Einträge „API-Base-URL fest verdrahtet …“ und „Docker-Image startet den
      Vite-Dev-Server …“ entfernen.

## Akzeptanzkriterien

- [x] AK1: `docker compose -f compose.prod.yaml up -d --build` startet DB, API und nginx; http://localhost:8080/admin,
      `/wall`, `/ground` und `/` laden (auch bei direktem Aufruf/Reload einer Unterroute), Szenen, Bilder, Musik und
      Notizen funktionieren, Szenenwechsel synchronisiert Wall und Ground.
- [ ] AK2: Wirksamkeit nachgewiesen: lokaler Prod-Build und -Start (Ausgabe/Screenshots im Review), CI-Jobs
      `docker-prod` (Frontend und Backend, E8) grün nach dem Push.
- [x] AK3: `VITE_API_URL` wirkt: Build mit `--build-arg VITE_API_URL=http://example.invalid:9999/` → das gebaute
      Bundle enthält diese URL (z. B. `grep` in `dist/assets`); ohne Variable `http://localhost:8000/`.
- [x] AK4: Alle Invarianten eingehalten: Dev-Stack startet wie vorher (Hot-Reload Frontend und
      Backend geprüft), `npm run lint`, `typecheck`, `test:unit`, `build` grün.
- [x] AK5: Doku nachgezogen, beide Known Issues entfernt.
- [x] AK6: Container heißen nach E6 (`docker ps` für Dev und Prod belegt); `compose.dev.yaml` ersetzt `compose.yaml`,
      `config -q` für alle Compose-Dateien grün.
- [x] AK7: `dnd.sh`: `prod` startet den Stack, wartet auf :8080 und öffnet Admin/Wall/Ground; `dev` startet Dev (vorher
      Prod gestoppt, kein Port-Konflikt); `stop` stoppt beide; Hilfe ohne Argument; Start von Docker Desktop bei
      beendetem Daemon (geprüft oder als manuell offen markiert).
- [x] AK8: Doku und CI-Jobname nachgezogen; keine Verweise mehr auf `compose.yaml` außerhalb von `docs/tasks/`.

## Teststrategie / Verifikation

**Automatisch**
- Frontend: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`.
- `docker compose config -q` für `compose.dev.yaml`, `compose.prod.yaml`, in `backend/` und in `frontend/`.
- `bash -n dnd.sh`, `shellcheck dnd.sh` (falls installiert).
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

### Runde 2 – Review 85a2672

**Empfehlung:** Abnahme. Blockierende Befunde aus Runde 1 erledigt, neue Änderungen (nginx, dockerignore, Pin) korrekt;
Nachweise per eigenem Prod-Start stichprobenartig bestätigt. Offen: Browser-Teil von AK1 durch den User und CI-Jobs
nach Push (AK2) – Checkboxen erst danach setzen.

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 Prod-Stack, Routen, Szenen/Medien/Notizen/Sync | erfüllt (per curl), Browser-Teil offen | Eigener Start: `db` healthy, `app` :8000, `web` :8080; `/`, `/admin`, `/wall`, `/ground`, `/admin/` → 200 `text/html`; `/scenes` 29 Szenen; `battle_17.jpg` 200 `image/jpeg`; `/story/main/tavern.md` 200 `text/markdown` + gzip; `missing.md` 404. Szenenwechsel-Sync/Abspielen nur im Browser |
| AK2 Lokaler Prod-Build/-Start, CI-Jobs | lokal erfüllt, CI nach Push | Prod-Build ok; App-Log `Application startup complete.` ohne Reloader; `nginx -v` 1.27.5, `nginx -t` ok |
| AK3 `VITE_API_URL` per Build-Arg | erfüllt | Mit Arg `example.invalid:9999` im Bundle, ohne Arg `http://localhost:8000/` (eigene Stichprobe) |
| AK4 Invarianten | erfüllt | Hot-Reload Frontend (`page reload src/main.tsx`) und Backend (`WatchFiles … Reloading`) belegt; lint/typecheck/52 Tests/build grün; `config -q` ok |
| AK5 Doku, Known Issues | erfüllt | Unverändert seit Runde 1 |

**Neue Änderungen:** `frontend/nginx.conf:20-26` (`.md` als `text/markdown`, nur dort, gzip greift, kein Einfluss auf
`/assets/` und SPA-Fallback); `frontend/.dockerignore:5-7` (`.env`, `.env.*`, `!.env.example`); `frontend/Dockerfile:39`
`nginx:1.27.5-alpine`. Scope und Konventionen eingehalten, ein Commit pro Runde.

#### Blockierende Befunde
- keine

#### Hinweise (nicht blockierend)
- Offen beim User: AK1 im Browser (Szenenwechsel synchronisiert Wall/Ground, Musik, Notizen).
- Offen nach Push: CI-Jobs `docker-prod` (frontend.yml) und `docker` (backend.yml) grün.
- Aus Runde 1 bestehend: kein Commit `docs(DND-12): approve plan`, CI-Path-Filter für `compose.prod.yaml`, `env_file` auf `db`, `version: '3.4'` (Altlast).
- `text/markdown` ohne `charset`; für `fetch().text()` unkritisch (UTF-8).
- 2026-10-10: Browser-Teil von AK1 durch den User geprüft – Szenenwechsel synchronisiert Wall und Ground, Musik spielt, Notizen werden angezeigt.

### Runde 3 – Nachweise der Umsetzung

Docker Desktop lief (nicht beendet). Zu Beginn lief noch ein Prod-Stack mit alten Namen (`dnd-portal-prod-*-1`);
`./dnd.sh prod` hat ihn per `up` neu erstellt. Am Ende laufen keine Container.

**AK6 – Container-Namen, `compose.dev.yaml`**
- `git mv compose.yaml compose.dev.yaml`; Kopfkommentar, `name: dnd-portal-dev`.
- `docker compose config -q` → Exit 0 für `-f compose.dev.yaml`, `-f compose.prod.yaml`, in `backend/` und in
  `frontend/` (nur bekannte Warnung `version` obsolet in `frontend/docker-compose.yml`).
- `config` Dev (`--profile tools`): `dnd-dev-api`, `dnd-dev-db`, `dnd-dev-pgadmin`, `dnd-dev-frontend`.
- `docker ps` nach `./dnd.sh prod`: `dnd-prod-frontend 0.0.0.0:8080->80`, `dnd-prod-api 0.0.0.0:8000->8000`,
  `dnd-prod-db (healthy) 0.0.0.0:5432->5432`.
- `docker ps` nach `./dnd.sh dev`: `dnd-dev-api :8000`, `dnd-dev-db (healthy) :5432`, `dnd-dev-frontend :5173`.

**AK7 – `dnd.sh`** (bash 3.2 unter macOS, `chmod +x`, `cd "$(dirname "$0")"`; alle Aufrufe aus `/tmp`)
- `bash -n dnd.sh` ok; shellcheck nicht installiert.
- `./dnd.sh` und `./dnd.sh foo`, `./dnd.sh dev a b`, `./dnd.sh dev --bad` → Hilfe, Exit 1.
- `./dnd.sh prod`: Build, `dnd-prod-db Healthy`, API und Frontend gestartet, `Warte auf http://localhost:8080 ...`,
  Admin/Wall/Ground im Browser geöffnet, Ausgabe `Smartphones (Player): http://192.168.178.49:8080/`.
  curl :8080 `/`, `/admin`, `/wall`, `/ground` → je `200 text/html`; :8000 `/scenes` → 29 Szenen.
- Wechsel prod→dev: `./dnd.sh dev` im Hintergrund → Log `dnd-prod-frontend/-api/-db Stopped … Removed`, dann
  `dnd-dev-*` erstellt und gestartet, kein Port-Konflikt; `Started reloader process [1] using WatchFiles`;
  :5173 `/admin` 200, :8000 `/scenes` 200 mit 29 Szenen → neues Volume `dnd-portal-dev_postgres_data`, Seeder gelaufen.
  Altes Volume `dnd-portal_postgres_data` unverändert vorhanden.
- `./dnd.sh stop` → Exit 0, `dnd-dev-*` gestoppt und entfernt, Netzwerk `dnd-portal-dev_default` entfernt;
  der Vordergrund-Prozess von `dev` hat sich beendet (`npm error signal SIGTERM` beim Stoppen des Vite-Containers –
  Verhalten von npm beim Beenden, nicht neu). `docker ps -a` danach leer.
- `--tools`: Array-Expansion unter bash 3.2 mit `set -u` geprüft (leer und `--profile tools`); Start mit pgAdmin
  nicht ausgeführt.
- **Manuell offen (User):** Start von Docker Desktop bei beendetem Daemon (`open -a Docker`, Wartezeit bis 120 s) –
  nicht geprüft, Docker Desktop wurde bewusst nicht beendet.

**AK8 – Doku, CI-Jobname**
- `.github/workflows/backend.yml`: Job `docker-prod`, Kommentar zum fehlenden `--target`.
- `README.md`, `CONTRIBUTING.md` (Start, Container-Namen, altes Volume, CI-Job `docker-prod`), `docs/architecture.md`
  (`dnd.sh`-Tabelle, `-f compose.dev.yaml`, Namenstabelle, altes Volume, CI-Jobname), `backend/CLAUDE.md`,
  `frontend/CLAUDE.md`, Kopfkommentar `compose.prod.yaml`. Root-`CLAUDE.md` ohne betroffene Stellen, unverändert.
- `git grep -nE "compose\.yaml|dnd-postgres_db|dnd-fastapi_backend|dnd-react_frontend|dnd-pgadmin4" -- ':!docs/tasks/'`
  → keine Treffer.
- Nicht angepasst (außerhalb der Subtask-Liste): `.claude/skills/quick-task/SKILL.md:35-36` (`docker compose run …`
  bzw. `config -q` „im Root“ – braucht jetzt `-f compose.dev.yaml`), `backend/.env.example:13` (Kommentar
  `docker compose --profile tools up`).

**Checks**
- Frontend: `npm run lint` 0 Fehler (1 Altwarnung `WallScreen.tsx:161`), `typecheck` ok, `test:unit` 52/52, `build` ok.
- **Nach Push zu prüfen:** CI-Jobs `docker-prod` in frontend.yml und backend.yml (AK2).

### Runde 3 – Review 09e02dd

**Empfehlung:** Abnahme. E6–E9 vollständig umgesetzt, `dnd.sh` robust (bash 3.2), Compose-Dateien gültig,
Container-Namen per eigenem Prod-Start belegt. Offen: CI-Jobs `docker-prod` nach Push (AK2), Docker-Desktop-Autostart
manuell (AK7). Zwei versionierte Dateien außerhalb der Subtasks sind durch E7 veraltet (siehe Hinweise).

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | Unverändert; Browser-Teil vom User bestätigt; eigener Start: Routen auf :8080 → 200 |
| AK2 | lokal erfüllt, CI nach Push | `compose.prod.yaml up -d --build` Exit 0, `dnd-prod-db` healthy; Job `docker-prod` in `backend.yml:60` |
| AK3 | erfüllt | `VITE_API_URL` aus der Umgebung landet in `args` (`config`); `dnd.sh:82-83` überschreibt nicht |
| AK4 | erfüllt | Kein Diff in `frontend/src`, `backend/src` seit 85a2672; Dev nur `container_name`/`name` geändert |
| AK5 | erfüllt | Unverändert |
| AK6 | erfüllt | `config -q` für alle Compose-Dateien Exit 0; `name: dnd-portal-dev`, `dnd-dev-*`; `docker ps` Prod: `dnd-prod-frontend`, `dnd-prod-api`, `dnd-prod-db` |
| AK7 | erfüllt (Docker-Autostart manuell offen) | Mode 100755, `bash -n` ok; Fehlaufrufe → Hilfe, Exit 1; `stop` Exit 0; `logs nosuch` Exit 1; leeres Array unter `set -u`/bash 3.2 ok |
| AK8 | erfüllt | Kein `compose.yaml` und keine alten Container-Namen außerhalb `docs/tasks/`; Doku und Jobname nachgezogen |

#### Blockierende Befunde
- keine

#### Hinweise (nicht blockierend)
- `.claude/launch.json:7`: `["compose", "up"]` ohne `-f` → im Root kein Compose-File mehr, Preview-Start kaputt.
- `.claude/skills/quick-task/SKILL.md:35-36`: `docker compose run …`/`config -q` im Root brauchen `-f compose.dev.yaml`.
- `backend/.env.example:13`: `docker compose --profile tools up` stimmt nur in `backend/`; optional `./dnd.sh dev --tools` ergänzen.
- Alte Root-Container (`dnd-portal`-Projekt) stoppt `dnd.sh` nicht; dann `docker compose -p dnd-portal down` (optional in Doku).
- `dnd.sh` optional: `curl --max-time` in `wait_for_web`; `docker info` kann beim Desktop-Start blockieren; `stop` startet Docker Desktop unnötig; fehlende `backend/.env` lässt `stop` scheitern; IP nur über `en0`.
- Aus Vorrunden: kein Commit `docs(DND-12): approve plan`; `version: '3.4'` (Altlast).

**Nachtrag nach Runde 3 (auf Wunsch des Users):** `.claude/launch.json` (`compose -f compose.dev.yaml up`),
`.claude/skills/quick-task/SKILL.md` (Root-Befehle mit `-f compose.dev.yaml`/`compose.prod.yaml`),
`backend/.env.example` (pgAdmin-Hinweis mit `./dnd.sh dev --tools`) sowie Jobname `docker-prod` in
`backend/CLAUDE.md` korrigiert. `docker compose -f compose.dev.yaml config -q` ok, `launch.json` valides JSON.
