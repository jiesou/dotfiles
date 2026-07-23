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
tmux -S "$SOCKET" list-sessions                  # reuse existing session if found anything related
```

### Create Session and Connect SSH

```bash
grep -A 5 "^Host .*hostname.*" ~/.ssh/config     # check config & password & context

SESSION=whatever-work
tmux -S "$SOCKET" new -d -s "$SESSION"
TARGET="$(tmux -S "$SOCKET" display-message -p -t "$SESSION" '#{window_index}.#{pane_index}')"
    
tmux -S "$SOCKET" send-keys -t "$SESSION:$TARGET" "ssh $HOST" Enter
./scripts/wait-for-text.sh -S "$SOCKET" -t "$SESSION:$TARGET" -p '[$#\E2\9D\AF ]'

# 5. Send command \E2\80\94 wait-for-text returns output on match, no separate capture needed
#    For long-running commands (e.g. dnf update), increase -T accordingly
tmux -S "$SOCKET" send-keys -t "$SESSION:$TARGET" 'some-command' Enter
./scripts/wait-for-text.sh -S "$SOCKET" -t "$SESSION:$TARGET" -p '[$#][[:space:]]*$' -T 30

```


# 5. Send command

```
tmux -S "$SOCKET" send-keys -t "$SESSION:$TARGET" 'some-command' Enter
./scripts/wait-for-text.sh -S "$SOCKET" -t "$SESSION:$TARGET" -p '[$#][[:space:]]*$' -T 30

> For really long-running commands (e.g. dnf update), increase -T (timeout)

# 6. Cleanup \E2\80\94 kill only what you created; never kill-server
tmux -S "$SOCKET" kill-session -t "$SESSION"
```

### Snaplook (for any short-term command in SSH)


```bash
tmux -S "$SOCKET" send-keys -t "$SESSION:$TARGET" "whoami" Enter
sleep 0.1
tmux -S "$SOCKET" capture-pane -p -t "openpnp-research:check" -S -8
./scripts/wait-for-text.sh -S "$SOCKET" -t "$SESSION:$TARGET" -p '[$#][[:space:]]*$' -T 30


tmux -S /tmp/agent.sock send-keys -t k60-re:0.0 -- 'cd ~/.local/share/chezmoi && git push --force origin main 2>&1; echo "EXIT=$?"' Enter && sleep 15 && tmux -S /tmp/agent.sock capture-pane -p -J -t k60-re:0.0 -S -8
```

### C. Create another pane (second terminal)

```bash
# When a sub-task needs a separate process (e.g. server + interaction)
tmux -S "$SOCKET" split-window -t "$SESSION"
PANE2="$(tmux -S "$SOCKET" display-message -p -t "$SESSION" '#{window_index}.#{pane_index}')"
# Use distinct variables (TARGET / PANE2). Finish current step before switching.
```

### Send command after a long research

# DO IT FIRST: check if SSH still connected
```bash
tmux -S "$SOCKET" capture-pane -p -t "openpnp-research:check" -S -8
```
`write/edit` writes to the local path, while tmux SSH are for remote paths. Do not confuse.

### Monitor hint for the user

Print this right after starting a session (using `SOCKET`, `SESSION`, `TARGET` from the Quick Start):

```
To monitor: tmux -S "$SOCKET" attach -t "$SESSION"
```

### Cleanup

- kill only what you created
- never kill-server
 
```
tmux -S "$SOCKET" kill-session -t "$SESSION"
```

## send-keys reference

| Mode | Syntax | C-escapes processed? | Use when |
|------|--------|:---:|----------|
| Literal | `send-keys -l 'text'` then `Enter` | No | Plain text \E2\80\94 `\|` `>` `$` `;` `&` all sent literally |
| Direct | `send-keys 'text'` then `Enter` | No | Commands with pipes, redirects, vars |
| C-literal | `send-keys $'text'` then `Enter` | Yes | Need `\n` `\t` escapes |

**Always send `Enter` as a separate invocation.** Control keys (`C-c`, `C-d`, etc.) are also sent separately. Never `sleep N` \E2\80\94 use `wait-for-text.sh` instead.

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

- **Python REPL**: start with `PYTHON_BASIC_REPL=1 python3 -q`, wait for `^>>>`, send code with `-l`, interrupt with `C-c`. Always use `PYTHON_BASIC_REPL=1` \E2\80\94 non-basic REPL breaks send-keys.
- **gdb**: `gdb --quiet ./a.out`, disable paging (`set pagination off`), break with `C-c`, inspect (`bt`, `info locals`), exit (`quit` then `y`).
- **Other TTY apps** (ipdb, psql, mysql, node, bash): same pattern \E2\80\94 start, wait for prompt, send text and Enter.
