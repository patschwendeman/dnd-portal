#!/usr/bin/env bash
# Start-Skript für das DnD Portal (macOS). Dev- und Prod-Stack laufen nie gleichzeitig (gleiche Ports).
#   ./dnd.sh dev [--tools]   Dev-Stack im Vordergrund (Hot-Reload; --tools: zusätzlich pgAdmin), Ctrl+C beendet
#   ./dnd.sh prod            Prod-Stack im Hintergrund, wartet bis alle Dienste healthy sind, öffnet
#                            Admin/Wall/Ground, zeigt die Smartphone-URL
#   ./dnd.sh stop            beide Stacks stoppen (DB-Volumes bleiben erhalten)
#   ./dnd.sh logs [service]  Logs des Prod-Stacks verfolgen (db, app, web)
#   ./dnd.sh install         globalen Befehl `dnd` anlegen (Symlink), danach z. B. `dnd prod` aus jedem Ordner
#   ./dnd.sh uninstall       Symlink `dnd` wieder entfernen (nur wenn er auf dieses Skript zeigt)
set -euo pipefail

# Pfad nach Auflösung aller Symlinks (bash 3.2: kein readlink -f; relative Link-Ziele gelten ab dem Link-Ordner).
resolve_path() {
  local path=$1 dir target
  while [ -L "$path" ]; do
    dir=$(cd -P "$(dirname "$path")" && pwd)
    target=$(readlink "$path")
    case "$target" in
      /*) path=$target ;;
      *) path=$dir/$target ;;
    esac
  done
  dir=$(cd -P "$(dirname "$path")" && pwd)
  echo "$dir/$(basename "$path")"
}

SCRIPT_PATH=$(resolve_path "${BASH_SOURCE[0]}")
SCRIPT_DIR=$(dirname "$SCRIPT_PATH")
# Aufgerufener Name für Hilfe und Ausgaben: `dnd` (globaler Befehl) bzw. z. B. `./dnd.sh`.
case "$(basename "$0")" in
  dnd) PROG=dnd ;;
  *) PROG=$0 ;;
esac

cd "$SCRIPT_DIR"

DEV_FILE=compose.dev.yaml
PROD_FILE=compose.prod.yaml
PROD_URL=http://localhost:8080
DOCKER_TIMEOUT=120
WAIT_TIMEOUT=180
INSTALL_DIRS="/opt/homebrew/bin /usr/local/bin"
INSTALL_NAME=dnd

usage() {
  cat <<EOF
Usage: $PROG <command>

  dev [--tools]    Dev-Stack starten (Vite :5173, API :8000 mit Reload, DB :5432; --tools: pgAdmin :5050)
  prod             Prod-Stack starten (UI :8080, API :8000, DB :5432), auf healthy warten, Admin/Wall/Ground öffnen
  stop             Dev- und Prod-Stack stoppen (ohne Volumes zu löschen)
  logs [service]   Logs des Prod-Stacks verfolgen (db, app, web)
  install          globalen Befehl '$INSTALL_NAME' anlegen (Symlink in /opt/homebrew/bin bzw. /usr/local/bin)
  uninstall        globalen Befehl '$INSTALL_NAME' entfernen
EOF
  exit 1
}

ensure_docker() {
  if docker info >/dev/null 2>&1; then
    return
  fi
  echo "Docker läuft nicht – starte Docker Desktop ..."
  open -a Docker
  local waited=0
  until docker info >/dev/null 2>&1; do
    if [ "$waited" -ge "$DOCKER_TIMEOUT" ]; then
      echo "Fehler: Docker ist nach ${DOCKER_TIMEOUT}s nicht erreichbar. Docker Desktop prüfen." >&2
      exit 1
    fi
    sleep 2
    waited=$((waited + 2))
  done
  echo "Docker läuft."
}

stop_dev() {
  docker compose -f "$DEV_FILE" --profile tools down
}

stop_prod() {
  docker compose -f "$PROD_FILE" down
}

cmd_dev() {
  local profile=()
  case "${1:-}" in
    "") ;;
    --tools) profile=(--profile tools) ;;
    *) usage ;;
  esac
  ensure_docker
  stop_prod
  docker compose -f "$DEV_FILE" "${profile[@]+"${profile[@]}"}" up --build
}

cmd_prod() {
  ensure_docker
  stop_dev
  # VITE_API_URL aus der Umgebung wird von compose.prod.yaml als Build-Argument übernommen.
  # --wait: kehrt erst zurück, wenn alle Dienste laufen bzw. healthy sind (API-Healthcheck in compose.prod.yaml).
  echo "Starte Prod-Stack und warte bis zu ${WAIT_TIMEOUT}s, bis alle Dienste bereit sind ..."
  if ! docker compose -f "$PROD_FILE" up -d --build --wait --wait-timeout "$WAIT_TIMEOUT"; then
    echo "Fehler: Prod-Stack ist nicht bereit (Timeout oder Healthcheck fehlgeschlagen). Logs: $PROG logs" >&2
    exit 1
  fi
  open "$PROD_URL/admin"
  open "$PROD_URL/wall"
  open "$PROD_URL/ground"
  local ip
  ip=$(ipconfig getifaddr en0 2>/dev/null || true)
  echo
  echo "Admin/Wall/Ground: $PROD_URL/admin, $PROD_URL/wall, $PROD_URL/ground"
  if [ -n "$ip" ]; then
    echo "Smartphones (Player): http://$ip:8080/"
  else
    echo "Smartphones (Player): http://<IP des Rechners>:8080/ (IP für en0 nicht ermittelbar)"
  fi
  echo "Stoppen: $PROG stop"
}

cmd_stop() {
  ensure_docker
  stop_prod
  stop_dev
}

cmd_logs() {
  docker compose -f "$PROD_FILE" logs -f "$@"
}

# Zeigt der Pfad (Symlink) auf dieses Skript?
is_own_link() {
  [ -L "$1" ] && [ "$(resolve_path "$1")" = "$SCRIPT_PATH" ]
}

cmd_install() {
  local dir link
  for dir in $INSTALL_DIRS; do
    case ":$PATH:" in
      *":$dir:"*) ;;
      *) continue ;;
    esac
    if [ ! -d "$dir" ] || [ ! -w "$dir" ]; then
      continue
    fi
    link=$dir/$INSTALL_NAME
    if is_own_link "$link"; then
      echo "'$INSTALL_NAME' ist bereits installiert: $link -> $SCRIPT_PATH"
      return
    fi
    if [ -e "$link" ] || [ -L "$link" ]; then
      echo "Fehler: $link existiert bereits und gehört nicht zu diesem Projekt – nicht überschrieben." >&2
      exit 1
    fi
    ln -s "$SCRIPT_PATH" "$link"
    echo "Installiert: $link -> $SCRIPT_PATH"
    echo "Ab jetzt aus jedem Ordner: $INSTALL_NAME prod | dev | stop | logs"
    return
  done
  echo "Fehler: kein beschreibbares Verzeichnis im PATH gefunden ($INSTALL_DIRS)." >&2
  exit 1
}

cmd_uninstall() {
  local dir link removed=0
  for dir in $INSTALL_DIRS; do
    link=$dir/$INSTALL_NAME
    if is_own_link "$link"; then
      rm "$link"
      echo "Entfernt: $link"
      removed=1
    elif [ -e "$link" ] || [ -L "$link" ]; then
      echo "Übersprungen: $link gehört nicht zu diesem Projekt."
    fi
  done
  if [ "$removed" -eq 0 ]; then
    echo "'$INSTALL_NAME' war nicht installiert."
  fi
}

case "${1:-}" in
  dev) shift; [ "$#" -le 1 ] || usage; cmd_dev "$@" ;;
  prod) shift; [ "$#" -eq 0 ] || usage; cmd_prod ;;
  stop) shift; [ "$#" -eq 0 ] || usage; cmd_stop ;;
  logs) shift; cmd_logs "$@" ;;
  install) shift; [ "$#" -eq 0 ] || usage; cmd_install ;;
  uninstall) shift; [ "$#" -eq 0 ] || usage; cmd_uninstall ;;
  *) usage ;;
esac
