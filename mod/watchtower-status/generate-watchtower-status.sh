#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

LOG_FILE="watchtower.log"
STATUS_FILE="status.json"
TAIL_LINES=120
WATCHTOWER_CONTAINER="watchtower"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

detect_watchtower_container() {
  if ! command_exists docker; then
    return
  fi
  local name
  name="$(docker ps --format '{{.Names}}' 2>/dev/null | grep -iw '^watchtower$' | head -n1 || true)"
  if [ -n "$name" ]; then
    printf '%s' "$name"
    return
  fi

  name="$(docker ps --all --format '{{.Names}}' 2>/dev/null | grep -i 'watchtower' | head -n1 || true)"
  if [ -n "$name" ]; then
    printf '%s' "$name"
    return
  fi

  name="$(docker ps --all --format '{{.Names}} {{.Image}}' 2>/dev/null | grep -i 'watchtower' | awk '{print $1}' | head -n1 || true)"
  if [ -n "$name" ]; then
    printf '%s' "$name"
    return
  fi

  name="$(docker ps --all --format '{{.ID}} {{.Image}}' 2>/dev/null | grep -i 'watchtower' | awk '{print $1}' | head -n1 || true)"
  printf '%s' "$name"
}

trim() {
  local s="$1"
  s="${s#${s%%[![:space:]]*}}"
  s="${s%${s##*[![:space:]]}}"
  printf '%s' "$s"
}

escape_json() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  printf '%s' "$s"
}

json_array_from_lines() {
  local sep=""
  printf '['
  while IFS= read -r item; do
    if [ -z "$item" ]; then
      continue
    fi
    printf '%s"%s"' "$sep" "$(escape_json "$item")"
    sep=','
  done
  printf ']'
}

collect_log() {
  if [ -f "$LOG_FILE" ]; then
    tail -n "$TAIL_LINES" "$LOG_FILE"
    return
  fi
  if ! command_exists docker; then
    echo ""
    return
  fi
  local container_name
  container_name="$(detect_watchtower_container)"
  if [ -z "$container_name" ]; then
    return
  fi
  docker logs --tail "$TAIL_LINES" "$container_name" 2>&1 || true
}

log_data="$(collect_log)"

if [ -z "$log_data" ]; then
  container_name="$(detect_watchtower_container)"
  if [ -z "$container_name" ]; then
    status="unknown"
    message="Nessun container Watchtower trovato. Controlla il nome del container Docker."
  else
    status="unknown"
    message="Watchtower trovato come '$container_name', ma docker logs non ha restituito output."
  fi
else
  if grep -Ei 'Found new image|Stopping container|Updated container|Pulling new image|Downloaded new image' <<<"$log_data" >/dev/null; then
    status="warning"
    message="Sono presenti aggiornamenti o attività recenti di Watchtower."
  elif grep -Ei 'No new images found|All containers are up to date|No updates found' <<<"$log_data" >/dev/null; then
    status="ok"
    message="Tutto aggiornato."
  else
    status="ok"
    message="Stato Watchtower rilevato."
  fi
fi

updated=()
pending=()
failed=()

while IFS= read -r line; do
  container=""
  if [[ "$line" =~ container=([^[:space:]]+) ]]; then
    container="${BASH_REMATCH[1]}"
  fi
  if [[ "$line" =~ [Uu]pdated ]]; then
    [ -n "$container" ] && updated+=("$container")
  elif [[ "$line" =~ ([Nn]ew[[:space:]]image|[Ff]ound[[:space:]]new[[:space:]]image) ]]; then
    [ -n "$container" ] && pending+=("$container")
  elif [[ "$line" =~ [Ff]ailed ]]; then
    [ -n "$container" ] && failed+=("$container")
  fi
done <<<"$log_data"

unique() {
  awk '!seen[$0]++'
}

updated_json="$(printf '%s\n' "${updated[@]}" | unique)"
pending_json="$(printf '%s\n' "${pending[@]}" | unique)"
failed_json="$(printf '%s\n' "${failed[@]}" | unique)"

updated_json="$(printf '%s\n' "$updated_json" | json_array_from_lines)"
pending_json="$(printf '%s\n' "$pending_json" | json_array_from_lines)"
failed_json="$(printf '%s\n' "$failed_json" | json_array_from_lines)"

log_json="$(escape_json "$log_data")"

cat > "$STATUS_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "${status}",
  "message": "${message}",
  "updated": ${updated_json},
  "pending": ${pending_json},
  "failed": ${failed_json},
  "recent_log": "${log_json}"
}
EOF
