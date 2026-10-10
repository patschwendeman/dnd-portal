#!/usr/bin/env bash
# Start-Skript für das DnD Portal (macOS). Dev- und Prod-Stack laufen nie gleichzeitig (gleiche Ports).
#   ./dnd.sh dev [--tools]   Dev-Stack im Vordergrund (Hot-Reload; --tools: zusätzlich pgAdmin), Ctrl+C beendet
#   ./dnd.sh prod            Prod-Stack im Hintergrund, öffnet Admin/Wall/Ground, zeigt die Smartphone-URL
#   ./dnd.sh stop            beide Stacks stoppen (DB-Volumes bleiben erhalten)
#   ./dnd.sh logs [service]  Logs des Prod-Stacks verfolgen (db, app, web)
set -euo pipefail

cd "$(dirname "$0")"

DEV_FILE=compose.dev.yaml
PROD_FILE=compose.prod.yaml
PROD_URL=http://localhost:8080
DOCKER_TIMEOUT=120
WEB_TIMEOUT=60

usage() {
  cat <<'EOF'
Usage: ./dnd.sh <command>

  dev [--tools]    Dev-Stack starten (Vite :5173, API :8000 mit Reload, DB :5432; --tools: pgAdmin :5050)
  prod             Prod-Stack starten (UI :8080, API :8000, DB :5432) und Admin/Wall/Ground öffnen
  stop             Dev- und Prod-Stack stoppen (ohne Volumes zu löschen)
  logs [service]   Logs des Prod-Stacks verfolgen (db, app, web)
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

wait_for_web() {
  local waited=0
  until curl -fsS -o /dev/null "$PROD_URL/"; do
    if [ "$waited" -ge "$WEB_TIMEOUT" ]; then
      echo "Fehler: $PROD_URL antwortet nach ${WEB_TIMEOUT}s nicht. Logs: ./dnd.sh logs" >&2
      exit 1
    fi
    sleep 1
    waited=$((waited + 1))
  done
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
  docker compose -f "$PROD_FILE" up -d --build
  echo "Warte auf $PROD_URL ..."
  wait_for_web
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
  echo "Stoppen: ./dnd.sh stop"
}

cmd_stop() {
  ensure_docker
  stop_prod
  stop_dev
}

cmd_logs() {
  docker compose -f "$PROD_FILE" logs -f "$@"
}

case "${1:-}" in
  dev) shift; [ "$#" -le 1 ] || usage; cmd_dev "$@" ;;
  prod) shift; [ "$#" -eq 0 ] || usage; cmd_prod ;;
  stop) shift; [ "$#" -eq 0 ] || usage; cmd_stop ;;
  logs) shift; cmd_logs "$@" ;;
  *) usage ;;
esac
