---
name: tmux
description: "Tmux sessions for interactive CLIs (ssh, gdb, etc.) by sending keystrokes and scraping pane output."
---

# tmux Skill

Use tmux for any long-term, interactive work.

## Quick Start

Strictly follow this flow. `wait-for-text.sh` skips matching on the very first frame to let send-keys take effect — no `sleep` needed.

### A. Interactive SSH session

```bash
SOCKET="/tmp/agent.sock" # 独立 socket，避免与个人 tmux 冲突

# 1. 检查状态 — 如果已有同名 session 则复用（避免重复创建）
#    如果 list-sessions 返回空，说明 socket 可用，继续下一步
#    如果已有 session，评估是否可复用：同名 session 可直接用，否则建议新建
tmux -S "$SOCKET" list-sessions

# 2. 获取主机上下文（SSH 前先了解目标主机配置）
#    从 ~/.ssh/config 中 grep 目标 Host 块，获取 User、Port、密码等
HOST=hp-book
grep -A 10 "^Host $HOST\b" ~/.ssh/config

# 3. 创建 session 并解析 target（永远不要硬编码 :0.0）
SESSION=$HOST-check # 用目标主机名命名，便于识别
tmux -S "$SOCKET" new -d -s "$SESSION"
TARGET="$(tmux -S "$SOCKET" display-message -p -t "$SESSION" '#{window_index}.#{pane_index}')"

# 4. SSH 到远程主机
tmux -S "$SOCKET" send-keys -t "$SESSION:$TARGET" "ssh $HOST" Enter
./scripts/wait-for-text.sh -S "$SOCKET" -t "$SESSION:$TARGET" -p '[$#][[:space:]]*$' -T 30

# 5. 发送命令 — wait-for-text 返回输出，无需单独 capture
#    注意：对于长时间运行的命令（如 dnf update），请增大 -T 值
tmux -S "$SOCKET" send-keys -t "$SESSION:$TARGET" 'some-command' Enter
./scripts/wait-for-text.sh -S "$SOCKET" -t "$SESSION:$TARGET" -p '[$#][[:space:]]*$' -T 30

# 6. Cleanup — kill only what you created; never kill-server
tmux -S "$SOCKET" kill-session -t "$SESSION"
```

### B. Compound SSH (faster for read-only checks)

```bash
# Bundle commands — wait-for-text returns output on prompt match
tmux -S "$SOCKET" send-keys -t "$SESSION:$TARGET" "ssh $HOST \"cmd1 && cmd2\"" Enter
./scripts/wait-for-text.sh -S "$SOCKET" -t "$SESSION:$TARGET" -p '[$#][[:space:]]*$' -T 30
```

### C. Create another pane (second terminal)

```bash
# When a sub-task needs a separate process (e.g. server + interaction)
tmux -S "$SOCKET" split-window -t "$SESSION"
PANE2="$(tmux -S "$SOCKET" display-message -p -t "$SESSION" '#{window_index}.#{pane_index}')"
# Use distinct variables (TARGET / PANE2). Finish current step before switching.
```

### Monitor hint for the user

Always print this right after starting a session (沿用 Quick Start 中的 `SOCKET`、`SESSION`、`TARGET` 变量):

```
To monitor: tmux -S "$SOCKET" attach -t "$SESSION"
To capture: tmux -S "$SOCKET" capture-pane -p -J -t "$SESSION:$TARGET" -S -200
```

## send-keys reference

| Mode | Syntax | C-escapes processed? | Use when |
|------|--------|:---:|----------|
| Literal | `send-keys -l 'text'` then `Enter` | No | Plain text — `\|` `>` `$` `;` `&` all sent literally |
| Direct | `send-keys 'text'` then `Enter` | No | Commands with pipes, redirects, vars |
| C-literal | `send-keys $'text'` then `Enter` | Yes | Need `\n` `\t` escapes |

**Always send `Enter` as a separate invocation.** Control keys (`C-c`, `C-d`, etc.) are also sent separately. Never `sleep N` — use `wait-for-text.sh` instead.

## Helper: wait-for-text.sh

Polls a pane for a regex (or fixed string) with timeout. Only checks the last line. Skips matching on the very first frame to let send-keys take effect (replaces an explicit `sleep 0.1` in the caller). On success, prints the matched pane output to stdout.

```bash
./scripts/wait-for-text.sh -t "SESSION:WINDOW.PANE" -p 'pattern' [-S socket] [-F] [-T 15] [-i 0.5] [-l 1000]
```

- `-t` pane target in tmux `session:window.pane` format (required)
- `-p` regex pattern (required); `-F` for fixed string
- `-S` tmux socket path (optional)
- `-T` timeout seconds (default 15)
- `-i` poll interval seconds (default 0.5)
- `-l` history lines to search (default 1000)
- exits 0 on match (prints output to stdout) or 1 on timeout.

> **注意**：`wait-for-text.sh` 只检查 pane 的最后一行。如果命令输出很长（如 `dnf update`），请等待命令完成、shell prompt 重新出现后再匹配。对于长时间运行的命令，适当增大 `-T` 值。

## Common prompt patterns

| Context | Pattern | Notes |
|---------|---------|-------|
| Shell prompt (bash/sh) | `'[$#][[:space:]]*$'` | Standard `$` or `#` prompt, end-anchored |
| SSH password | `'password:'` | 英文 locale |
| Python REPL | `'^>>>'` | |
| GDB | `'^\(gdb\) '` | |

> **可移植性**：使用 POSIX 兼容的 `[[:space:]]` 而非 `\s`，确保在 GNU grep 和 BSD/macOS grep 下均能工作。

## Interactive tool recipes

- **Python REPL**: start with `PYTHON_BASIC_REPL=1 python3 -q`, wait for `^>>>`, send code with `-l`, interrupt with `C-c`. Always use `PYTHON_BASIC_REPL=1` — non-basic REPL breaks send-keys.
- **gdb**: `gdb --quiet ./a.out`, disable paging (`set pagination off`), break with `C-c`, inspect (`bt`, `info locals`), exit (`quit` then `y`).
- **Other TTY apps** (ipdb, psql, mysql, node, bash): same pattern — start, wait for prompt, send text and Enter.

