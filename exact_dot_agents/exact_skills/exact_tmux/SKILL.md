---
name: tmux
description: "Tmux sessions for interactive CLIs (ssh, gdb, etc.) by sending keystrokes and scraping pane output."
---

# tmux Skill

Use tmux for any long-term, interactive work.

Grep `man tmux` to confirm anything you need.

## Quickstart

Firstly, strictly follow the flow below:

```bash
SOCKET="/tmp/agent.sock"
tmux -S "$SOCKET" list-sessions                # reuse existing session if found anything related
```

### SSH

```bash
grep -A 5 "^Host .*hostname.*" ~/.ssh/config   # check config & password & context

SESSION=whatever-work
tmux -S "$SOCKET" new -d -s "$SESSION"
TARGET="$(tmux -S "$SOCKET" display-message -p -t "$SESSION" '#{window_index}.#{pane_index}')"

tmux -S "$SOCKET" send-keys -t "$SESSION:$TARGET" "ssh $HOST" Enter
./scripts/wait-for-text.sh -S "$SOCKET" -t "$SESSION:$TARGET" -p '[$#❯ ]'

# 5. Send command — wait-for-text returns output on match, no separate capture needed
#    For long-running commands (e.g. dnf update), increase -T accordingly
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

Always print this right after starting a session (using `SOCKET`, `SESSION`, `TARGET` from the Quick Start):

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

Polls a pane for a regex pattern in the last line with timeout. On match, prints the last 30 lines of the pane to stdout. On timeout, prints error and last 30 lines to stderr.

```bash
./scripts/wait-for-text.sh -t "SESSION:WINDOW.PANE" -p 'pattern' [-S socket] [-T 30]
```

- `-t` pane target in tmux `session:window.pane` format (required)
- `-p` regex pattern (required)
- `-S` tmux socket path (optional)
- `-T` timeout seconds (default 30)
- exits 0 on match (last 30 lines to stdout) or 1 on timeout (last 30 lines to stderr).

> `wait-for-text.sh` only inspects the last line of the pane (expects the shell prompt to reappear). The command output itself is captured via the 30-line snapshot returned on match. For long-running commands, increase `-T`.

## Common prompt patterns

| Context | Pattern | Notes |
|---------|---------|-------|
| Shell prompt (bash/sh) | `'[$#][[:space:]]*$'` | Standard `$` or `#` prompt, end-anchored |
| SSH password | `'password:'` | English locale |
| Python REPL | `'^>>>'` | |
| GDB | `'^\(gdb\) '` | |

> **Portability**: use POSIX-compliant `[[:space:]]` instead of `\s` to work with both GNU grep and BSD/macOS grep.

## Interactive tool recipes

- **Python REPL**: start with `PYTHON_BASIC_REPL=1 python3 -q`, wait for `^>>>`, send code with `-l`, interrupt with `C-c`. Always use `PYTHON_BASIC_REPL=1` — non-basic REPL breaks send-keys.
- **gdb**: `gdb --quiet ./a.out`, disable paging (`set pagination off`), break with `C-c`, inspect (`bt`, `info locals`), exit (`quit` then `y`).
- **Other TTY apps** (ipdb, psql, mysql, node, bash): same pattern — start, wait for prompt, send text and Enter.
