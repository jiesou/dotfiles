#!/usr/bin/env bash
# 审计 workspace 每一项：能否重建。
# 用法: audit.sh [dir]     默认 ~/.agents/workspace
set -uo pipefail
WS="${1:-$HOME/.agents/workspace}"
cd "$WS" 2>/dev/null || { echo "进不去: $WS"; exit 1; }

KEEP=$'\033[33m'; DROP=$'\033[32m'; OFF=$'\033[0m'
keep(){ echo "${KEEP}保留${OFF}"; }
drop(){ echo "${DROP}可重建${OFF}"; }

# --- git 仓库：仅当 干净 + 无未推送 + origin 为远程 URL 才算可重建 ---
git_verdict(){
  local d="$1" dirty unp origin
  dirty=$(git -C "$d" status --porcelain 2>/dev/null | wc -l)
  unp=$(git -C "$d" log --branches --not --remotes --oneline 2>/dev/null | wc -l)
  origin=$(git -C "$d" remote get-url origin 2>/dev/null)
  if   [ "$dirty" -gt 0 ];  then echo "有本地改动($dirty)"; keep
  elif [ "$unp"   -gt 0 ];  then echo "有未推送提交($unp)"; keep
  elif [ -z "$origin" ];    then echo "无 origin"; keep
  elif [[ "$origin" == /* || "$origin" == .* ]]; then echo "origin 是本地路径，须人工核"; keep
  else drop; echo -n ""; printf ' ← %s' "$origin"
  fi
}

echo "== git 仓库 =="
find . -maxdepth 3 -name .git -type d 2>/dev/null | sort | while read -r g; do
  d=$(dirname "$g")
  printf '%-46s %6s  %s\n' "${d#./}" "$(du -sh "$d" 2>/dev/null | cut -f1)" "$(git_verdict "$d")"
done

echo; echo "== 依赖目录 =="
find . -maxdepth 4 \( -name node_modules -o -name .venv -o -name venv \) -type d 2>/dev/null | sort | while read -r v; do
  n=$(find "$v" -maxdepth 1 -type l 2>/dev/null | wc -l)
  if [ "$n" -gt 0 ]; then
    printf '%-46s %6s  %s\n' "${v#./}" "$(du -sh "$v" 2>/dev/null | cut -f1)" "$(echo "${KEEP}保留${OFF} — 纯符号链接($n)，删了断链且不省空间")"
  else
    printf '%-46s %6s  %s\n' "${v#./}" "$(du -sh "$v" 2>/dev/null | cut -f1)" "$(drop)"
  fi
done

echo; echo "== 大文件 (>100M) =="
find . -maxdepth 3 -type f -size +100M 2>/dev/null | sort | while read -r f; do
  a=$(stat -c%s "$f"); d=$(du -sh "$f" 2>/dev/null | cut -f1)
  note=""
  [ "$a" -gt $(( $(du --block-size=1 "$f" 2>/dev/null | cut -f1) * 2 )) ] && note="稀疏: 实际 $d / 标称 $((a/1024/1024))M"
  printf '%-46s %6s  %s\n' "${f#./}" "$d" "$note"
done

echo; echo "总计: $(du -sh . 2>/dev/null | cut -f1)   磁盘: $(df -h . | tail -1 | awk '{print $3" 已用 / "$4" 可用"}')"
