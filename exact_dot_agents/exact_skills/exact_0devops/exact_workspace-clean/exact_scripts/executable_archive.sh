#!/usr/bin/env bash
# 把 workspace 根目录下所有条目移入 archived/<今天>/，跳过 .git 等。
# 用法: [cd ~/.agents/workspace &&] bash <此脚本路径>
set -euo pipefail
d="archived/$(date +%F)"
mkdir -p "$d"
shopt -s dotglob nullglob
moved=0 failed=0
for f in *; do
  [[ "$f" == .git || "$f" == .gitignore || "$f" == archived ]] && continue
  if mv -n "$f" "$d/" 2>/dev/null; then
    moved=$((moved+1))
  else
    echo "FAILED: $f"
    failed=$((failed+1))
  fi
done
echo "Moved $moved item(s) to $d/  (failed: $failed)"
