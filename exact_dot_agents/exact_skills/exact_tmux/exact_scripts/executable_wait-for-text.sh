#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: wait-for-text.sh -t target -p pattern

Polls a pane for a regex pattern and exit when found.
Never stop until matched.

Exit 0 on match.

Options:
  -S, --socket    tmux socket path
  -t, --target    tmux target (be like: "SESSION:WINDOW.PANE")
  -p, --pattern   regex text pattern to look for
  -h, --help      show this help
USAGE
}

socket=""
target=""
pattern=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -S|--socket)   socket="${2-}"; shift 2 ;;
    -t|--target)   target="${2-}"; shift 2 ;;
    -p|--pattern)  pattern="${2-}"; shift 2 ;;
    -h|--help)     usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$target" || -z "$pattern" ]]; then
  echo "target and pattern are required" >&2
  usage
  exit 1
fi

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux not found in PATH" >&2
  exit 1
fi

tmux_cmd=("tmux")
[[ -n "$socket" ]] && tmux_cmd+=(-S "$socket")

start_history_size=$("${tmux_cmd[@]}" display-message -p -t "$target" "#{history_size}")
start_cursor=$("${tmux_cmd[@]}" display-message -p -t "$target" '#{cursor_y}')
while true; do
  current_history_size=$("${tmux_cmd[@]}" display-message -p -t "$target" "#{history_size}")
  start_line=$((start_history_size + start_cursor - current_history_size))
  pane_new_content="$("${tmux_cmd[@]}" capture-pane -p -t "$target" -S "$start_line" 2>/dev/null | tail -50)"
  pane_content="$("${tmux_cmd[@]}" capture-pane -p -t "$target" -S - 2>/dev/null)"
  pane_last_30line_content=$(printf '%s\n' "$pane_content" | tail -30)
  pane_lines=$(printf '%s\n' "$pane_content" | wc -l)

  if matched=$(printf '%s\n' "$pane_new_content" | grep -ioE -- "$pattern" | head -1); then
    if (( pane_lines > 30 )); then
        echo "[truncated; showing last 30 lines]"
    fi
    echo "[matched: $matched]"
    echo ""
    echo "$pane_last_30line_content"
    exit 0
  fi

  sleep 0.5
done
