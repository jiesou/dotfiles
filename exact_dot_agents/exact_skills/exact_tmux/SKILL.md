---
name: tmux
description: "Tmux for interactive CLIs (ssh, gdb, etc.) by sending keystrokes and scraping pane output."
---

# tmux

Use tmux for any long-running, interactive work.
Firstly, **strictly** follow the instructions below.

Also grep `man tmux` to find anything you need!

## Quickstart

```
SOCKET="/tmp/agent.sock"
tmux -S "$SOCKET" list-sessions                  # reuse existing session if found anything related
```

### Create Session

```
SESSION=whatever-work
tmux -S "$SOCKET" new -d -s "$SESSION"
TARGET="$(tmux -S "$SOCKET" display-message -p -t "$SESSION" '#{session_name}:#{window_id}.#{pane_id}')"
echo "$TARGET"
# Don't assume that target is `session:0.0`; instead, display-message and save
# Once `TARGET` got, it can be always reused
```

### Enter Shell Env

```
# SSH
grep -A 8 "^Host hostname" ~/.ssh/config         # get host password & context in `~/.ssh/config` quickly
tmux -S "$SOCKET" send-keys \
  -t "$TARGET" \
  "ssh hostname" Enter                           # use plain `hostname`, no user or ports needed

# devcontainer
devcontainer --help                              # get help
tmux -S "$SOCKET" send-keys \
  -t "$TARGET" \
  "devcontainer exec --config path/to/project/.devcontainer/devcontainer.json bash" Enter


# verify SSH connected/devcontainer entered
./scripts/wait-for-text.sh -S "$SOCKET" \
  -t "$TARGET" \
  -p '[$#❯ ]|password|密码|yes/no'
```

Shell Envs such as python venv, gdb ... all be enter in this way.

### Send command (Quick-shots)

```
tmux -S "$SOCKET" send-keys -t "$TARGET" "whoami" Enter
sleep 0.1
tmux -S "$SOCKET" capture-pane -p -t "$TARGET" | grep . | tail -4  # strip blank lines
```

### Send command (Long-running)

For any operation that require waiting longer than 5 seconds, do not use `sleep [large number]`; instead, use wait-for-text.sh.

Always set the shell tool caller's timeout to a reasonable value (such as 20 seconds) instead of the default 120 seconds. Time is money!

```
tmux -S "$SOCKET" send-keys -t "$TARGET" 'sudo apt update' Enter
sleep 5
# important: before waiting, confirm if it IS proceeding instead of failing in seconds
tmux -S "$SOCKET" capture-pane -p -t "$TARGET"

./scripts/wait-for-text.sh -S "$SOCKET" -t "$TARGET" -p '[$#❯ ]|password|密码'
# set caller timeout to 20s (not 120s), and start a wait  
```
OR
```
tmux -S "$SOCKET" send-keys -t "$TARGET" 'sudo apt update && echo DONE' Enter
./scripts/wait-for-text.sh -S "$SOCKET" -t "$TARGET" -p 'DONE|Already|password|密码'
```

##### send-keys reference

| Mode | Syntax | Use when |
|------|--------|:---:|----------|
| Direct | `send-keys 'text'` then `Enter` | |
| Literal | `send-keys -l 'text'` then `Enter`| Plain text `\|` `>` `$` `;` `&` all sent literally |
| C-literal | `send-keys $'text'` then `Enter` | Need `\n` `\t` escapes |
 
For multi-line commands:

```
tmux -S "$SOCKET" load-buffer -b cmd - <<'CMD'
echo "hello from $(whoami)"
echo "hostname: $(hostname)"
uptime
CMD
tmux -S "$SOCKET" paste-buffer -t "$TARGET" -b cmd
```

### Monitor hint for the user

Print this right after starting a session:

```md
To monitor: tmux -S "[SOCKET]" attach -t "[TARGET]"
```

## Helpful informations

### Create another TARGET (second terminal)

When you need a second terminal, such as:
- compare something
- sync something
- a side-task
- server + interaction
Finish current step before switching.

```
tmux -S "$SOCKET" new-window -t "$SESSION" -n "side"            # give it a meaningful name
TARGET_SIDE="$(tmux -S "$SOCKET" display-message -p -t "$SESSION:side" '#{session_name}:#{window_id}.#{pane_id}')"
TARGET_MAIN=$TARGET
echo $TARGET_SIDE
echo $TARGET_MAIN

tmux -S "$SOCKET" rename-window -t "$TARGET_MAIN" "main"       # rename the first window
```

_You don't need multiple panes/sessions, just windows!_

### Send command after a long research

#### DO IT FIRST: check if SSH still connected

```
tmux -S "$SOCKET" capture-pane -p -t "$TARGET" -S -8
```
`write/edit` writes to the localhost, while tmux SSH are for remote.

_Do not confuse localhost & remote_

### Cleanup

- DONT CLEANUP AUTOMATICALLY
- NEVER KILL ANYTHING WITHOUT USER'S ALLOW
- only kill what you created
- if there is someone else's session —— try reuse instead of kill
- never kill-server
 
```
tmux -S "$SOCKET" send-keys -t "$TARGET" C-c    # if needed
tmux -S "$SOCKET" send-keys -t "$TARGET" C-d
tmux -S "$SOCKET" kill-session -t "$SESSION"    # final
```

### Helper: wait-for-text.sh

Polls a TARGET for a regex pattern and exit when found.
On match, prints `matched: <the exact word that hit>`, then the last 30 lines of the pane, then exits 0.

Use `wait-for-text.sh -h` for help!

```
./scripts/wait-for-text.sh -S "$SOCKET" -t "$TARGET" -p 'pattern'
```

### Common prompt patterns

| Context | Pattern |
|---------|---------|
| General | `error|[$#❯ ]|password|密码|yes/no` |
| Python REPL | `^>>>` |
| GDB | `^\(gdb\) ` |

### Interactive tool recipes

- Python REPL: start with `PYTHON_BASIC_REPL=1 python3 -q`, wait for `^>>>`, send code with `-l`, interrupt with `C-c`. Always use `PYTHON_BASIC_REPL=1` because non-basic REPL breaks send-keys.
- gdb: `gdb --quiet ./a.out`, disable paging (`set pagination off`), break with `C-c`, inspect (`bt`, `info locals`), exit (`quit` then `y`).
- Other TTY apps (ipdb, psql, mysql, node, bash): same pattern —— start, wait for prompt, send text and Enter.
