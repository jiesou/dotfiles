#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: wait-for-text.sh -t target -p pattern [-T 10]

Polls a pane for a regex pattern and exit when found.
Exit 0 on match, exit 1 on timeout.
It polls to inspect the last 50 lines of the pane.

Options:
  -S, --socket    tmux socket path
  -t, --target    tmux target (be like: "SESSION:WINDOW.PANE")
  -p, --pattern   regex text pattern to look for
  -T, --timeout   seconds to wait (integer, default: 10)
  -h, --help      show this help
USAGE
}

socket=""
target=""
pattern=""
timeout=10

while [[ $# -gt 0 ]]; do
  case "$1" in
    -S|--socket)   socket="${2-}"; shift 2 ;;
    -t|--target)   target="${2-}"; shift 2 ;;
    -p|--pattern)  pattern="${2-}"; shift 2 ;;
    -T|--timeout)  timeout="${2-}"; shift 2 ;;
    -h|--help)     usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$target" || -z "$pattern" ]]; then
  echo "target and pattern are required" >&2
  usage
  exit 1
fi

if ! [[ "$timeout" =~ ^[0-9]+$ ]]; then
  echo "timeout must be an integer number of seconds" >&2
  exit 1
fi

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux not found in PATH" >&2
  exit 1
fi

tmux_cmd=("tmux")
[[ -n "$socket" ]] && tmux_cmd+=(-S "$socket")

start_epoch=$(date +%s)
deadline=$((start_epoch + timeout))

start_history_size=$("${tmux_cmd[@]}" display-message -p -t "$target" "#{history_size}")
start_cursor=$("${tmux_cmd[@]}" display-message -p -t "$target" '#{cursor_y}')
start_line=$((start_history_size + start_cursor))

while true; do
  pane_new_content="$("${tmux_cmd[@]}" capture-pane -p -t "$target" -S "$start_line" 2>/dev/null | tail -50)"
  pane_last_30line_content="$("${tmux_cmd[@]}" capture-pane -p -t "$target" 2>/dev/null | tail -30)"
  pane_lines=$(echo "$pane_last_30line_content" | wc -l)

  if printf '%s\n' "$pane_new_content" | grep -iE -- "$pattern" >/dev/null 2>&1; then
    if (( pane_lines > 30 )); then
        echo "[truncated; showing last 30 lines]"
    fi
    echo "$pane_last_30line_content"
    exit 0
  fi

  now=$(date +%s)
  if (( now >= deadline )); then
    echo "[TIMEOUT] after ${timeout}s waiting for pattern, set \`-T timeout\` larger?" >&2
    echo ""
    if (( pane_lines > 30 )); then
        echo "[truncated; showing last 30 lines]" >&2
    fi
    echo "$pane_last_30line_content"
    exit 1
  fi

  sleep 0.5
done
