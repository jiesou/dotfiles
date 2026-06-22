#!/bin/bash
set -euo pipefail

ROUTERS=(
  "wy11    root@192.168.11.1    22    /etc/openclash/config/wscmixed.yaml"
  "wy100   root@192.168.100.1   23333 /etc/openclash/config/wscmixed.yaml"
  "wy13    root@192.168.13.1    22    /etc/openclash/config/config.yaml"
)

usage() {
  cat <<EOF
Usage: $(basename "$0") <awk-script> [router...]
       $(basename "$0") -f <awk-file> [router...]

Routers: wy11, wy100, wy13, all (default)

Examples:
  oc-sync.sh '{print; if (/特价机场-1T/) print "  新机场:"}' wy11 wy13
  oc-sync.sh -f transform.awk wy100
  oc-sync.sh -f transform.awk all
EOF
  exit 1
}

resolve_routers() {
  local requested=("$@")
  local results=()
  if [[ ${#requested[@]} -eq 0 ]]; then
    requested=("all")
  fi
  for r in "${requested[@]}"; do
    if [[ "$r" == "all" ]]; then
      results=("${ROUTERS[@]}")
      break
    fi
    local found=0
    for entry in "${ROUTERS[@]}"; do
      local name
      name=$(echo "$entry" | awk '{print $1}')
      if [[ "$name" == "$r" ]]; then
        results+=("$entry")
        found=1
        break
      fi
    done
    if [[ $found -eq 0 ]]; then
      echo "Unknown router: $r" >&2
      echo "Valid: wy11 wy100 wy13 all" >&2
      exit 1
    fi
  done
  printf '%s\n' "${results[@]}"
}

apply_awk() {
  local awk_script="$1"
  shift
  local targets=("$@")

  if [[ ${#targets[@]} -eq 0 ]]; then
    echo "No targets to apply." >&2
    return
  fi

  local pids=()
  for entry in "${targets[@]}"; do
    local name host port cfg
    name=$(echo "$entry" | awk '{print $1}')
    host=$(echo "$entry" | awk '{print $2}')
    port=$(echo "$entry" | awk '{print $3}')
    cfg=$(echo "$entry" | awk '{print $4}')

    (
      echo "[$name] Applying to $host:$port $cfg ..."
      printf '%s\n' "$awk_script" | \
        ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no \
          -p "$port" "$host" \
          "awk -f - \"$cfg\" > /tmp/oc_tmp.yaml && mv /tmp/oc_tmp.yaml \"$cfg\""
      echo "[$name] OK"
    ) &
    pids+=($!)
  done

  local failed=0
  for pid in "${pids[@]}"; do
    wait "$pid" || { echo "PID $pid failed" >&2; failed=1; }
  done

  if [[ $failed -eq 0 ]]; then
    echo "--- All OK ---"
  else
    echo "--- Some failed ---" >&2
    return 1
  fi
}

main() {
  if [[ $# -eq 0 ]]; then
    usage
  fi

  local awk_script
  if [[ "$1" == "-f" ]]; then
    shift
    local awk_file="$1"
    shift
    if [[ ! -f "$awk_file" ]]; then
      echo "File not found: $awk_file" >&2
      exit 1
    fi
    awk_script=$(cat "$awk_file")
  else
    awk_script="$1"
    shift
  fi

  local target_str
  target_str=$(resolve_routers "$@")

  # Convert space-separated router entries into array
  local targets=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && targets+=("$line")
  done <<< "$target_str"

  apply_awk "$awk_script" "${targets[@]}"
}

main "$@"
