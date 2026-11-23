#!/usr/bin/env bash
set -euo pipefail

if [[ -f "${DSH_ENV_FILE:-$HOME/.dsh/.env}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${DSH_ENV_FILE:-$HOME/.dsh/.env}"
  set +a
fi

: "${EZBOOKKEEPING_URL:?Set EZBOOKKEEPING_URL in ~/.dsh/.env}"
: "${EZBOOKKEEPING_TOKEN:?Set EZBOOKKEEPING_TOKEN in ~/.dsh/.env}"

export EBKTOOL_SERVER_BASEURL="${EBKTOOL_SERVER_BASEURL:-${EZBOOKKEEPING_URL%/}}"
export EBKTOOL_TOKEN="${EBKTOOL_TOKEN:-$EZBOOKKEEPING_TOKEN}"

install_dir="${EZBOOKKEEPING_DIR:-$HOME/Documents/dev/services/ezbookkeeping}"

if [[ -x "$install_dir/ezbookkeeping" ]]; then
  version="$("$install_dir/ezbookkeeping" --version 2>/dev/null | awk '{print $3}')"
else
  version="$(curl -fsS --max-time 10 -H "Authorization: Bearer $EBKTOOL_TOKEN" \
    "$EBKTOOL_SERVER_BASEURL/api/v1/systems/version.json" |
    sed -n 's/.*"version" *: *"\([^"]*\)".*/\1/p')"
fi

: "${version:?cannot determine ezBookkeeping version}"

cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/ezbookkeeping"
cache="$cache_dir/ebktools-$version.sh"
url="https://raw.githubusercontent.com/mayswind/ezbookkeeping/v$version/skills/ezbookkeeping/scripts/ebktools.sh"

if [[ ! -s "$cache" ]]; then
  mkdir -p "$cache_dir"
  tmp="$cache.part.$$"
  trap 'rm -f "$tmp"' EXIT
  curl -fsSL --max-time 60 "$url" -o "$tmp"
  head -n 1 "$tmp" | grep -q '^#!' || { echo "unexpected content from $url" >&2; exit 1; }
  mv "$tmp" "$cache"
fi

exec sh "$cache" "$@"
