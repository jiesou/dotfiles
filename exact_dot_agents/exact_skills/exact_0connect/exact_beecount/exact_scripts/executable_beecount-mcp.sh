#!/usr/bin/env bash
set -euo pipefail

if [[ -f "${DSH_ENV_FILE:-$HOME/.dsh/.env}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${DSH_ENV_FILE:-$HOME/.dsh/.env}"
  set +a
fi

: "${BEECOUNT_URL:?Set BEECOUNT_URL in ~/.dsh/.env}"
: "${BEECOUNT_PAT:?Set BEECOUNT_PAT in ~/.dsh/.env}"
endpoint="${BEECOUNT_URL%/}/api/v1/mcp"

rpc() {
  curl --fail-with-body --silent --show-error --max-time 30 \
    -X POST "$endpoint" \
    -H "Authorization: Bearer $BEECOUNT_PAT" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    --data "$1"
}

case "${1:-}" in
  initialize)
    rpc '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"beecount-curl","version":"1.0"}}}'
    ;;
  list-tools)
    rpc '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
    ;;
  call)
    : "${2:?Usage: $0 call TOOL_NAME [JSON_ARGUMENTS]}"
    args="${3-}"
    [[ -n "$args" ]] || args='{}'
    python3 -c 'import json,sys; json.loads(sys.argv[1])' "$args"
    rpc "$(python3 -c 'import json,sys; print(json.dumps({"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":sys.argv[1],"arguments":json.loads(sys.argv[2])}},separators=(",",":")))' "$2" "$args")"
    ;;
  *)
    printf 'Usage: %s {initialize|list-tools|call TOOL_NAME [JSON_ARGUMENTS]}\n' "$0" >&2
    exit 2
    ;;
esac
