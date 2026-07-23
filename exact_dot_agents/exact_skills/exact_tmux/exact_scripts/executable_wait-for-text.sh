#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: wait-for-text.sh -t target -p pattern [options]

Poll a tmux pane for text in the last line and exit when found.

Options:
  -S, --socket    tmux socket path
  -t, --target    tmux target (session:window.pane)
  -p, --pattern   regex text pattern to look for
  -T, --timeout   seconds to wait (integer, default: 30)
  -h, --help      show this help
USAGE
}

target=""
pattern=""
socket=""
timeout=30

while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--target)   target="${2-}"; shift 2 ;;
    -p|--pattern)  pattern="${2-}"; shift 2 ;;
    -S|--socket)   socket="${2-}"; shift 2 ;;
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

start_epoch=$(date +%s)
deadline=$((start_epoch + timeout))

tmux_cmd=("tmux")
[[ -n "$socket" ]] && tmux_cmd+=(-S "$socket")

while true; do
  last_line="$("${tmux_cmd[@]}" capture-pane -p -J -t "$target" 2>/dev/null | tail -1 || true)"

  if printf '%s\n' "$last_line" | grep -E -- "$pattern" >/dev/null 2>&1; then
    "${tmux_cmd[@]}" capture-pane -p -J -t "$target" -S -30 2>/dev/null || true
    exit 0
  fi

  now=$(date +%s)
  if (( now >= deadline )); then
    echo "Timed out after ${timeout}s waiting for pattern: $pattern" >&2
    echo "Last line was: $last_line" >&2
    "${tmux_cmd[@]}" capture-pane -p -J -t "$target" -S -30 >&2 || true
    exit 1
  fi

  sleep 0.5
done
