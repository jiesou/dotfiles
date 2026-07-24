---
name: tmux
description: "Tmux for interactive CLIs (ssh, gdb, etc.) by sending keystrokes and scraping pane output."
---

# tmux

Use tmux for any long-term, interactive work.
Firstly, strictly follow the Quickstart flow.

Also grep `man tmux` to find anything you need!

## Quickstart

```
SOCKET="/tmp/agent.sock"
tmux -S "$SOCKET" list-sessions                  # reuse existing session if found anything related
```

### Create Session and Connect SSH

```
grep -A 8 "^Host hostname" ~/.ssh/config         # get host password & context in `~/.ssh/config`

SESSION=whatever-work
tmux -S "$SOCKET" new -d -s "$SESSION"
TARGET="$(tmux -S "$SOCKET" display-message -p -t "$SESSION" '#S:#W.#P')"
echo "$TARGET"

./scripts/wait-for-text.sh -h                    # get help

tmux -S "$SOCKET" send-keys \
  -t "$TARGET" \
  "ssh hostname" Enter                           # Use plain `hostname`, no user or ports needed
./scripts/wait-for-text.sh -S "$SOCKET" \
  -t "$TARGET" \
  -p '[$#❯ ]|password|密码|yes/no' \
  -T 5                                           # verify SSH connected
```

### Send command (Quick-shots)

```
tmux -S "$SOCKET" send-keys -t "$TARGET" "whoami" Enter
sleep 0.1
tmux -S "$SOCKET" capture-pane -p -t "$TARGET" | grep . | tail -4  # strip blank lines
```

### Send command (Long-running)

For any operation that requires more than `sleep 3`, use wait-for-text.sh.

```
tmux -S "$SOCKET" send-keys -t "$TARGET" 'sudo apt update' Enter
./scripts/wait-for-text.sh -S "$SOCKET" -t "$TARGET" -p '[$#❯ ]|password|密码'
# no separate capture needed
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

The heredoc content is pasted into the pane as if typed.

### Monitor hint for the user

Print this right after starting a session (fill args from the previous steps):

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

```
tmux -S "$SOCKET" new-window -t "$SESSION" -n "side"            # give it a meaningful name
TARGET_SIDE="$(tmux -S "$SOCKET" display-message -p -t "$SESSION:side" '#S:#W.#P')"

# Use distinct variables (like TARGET_FOO / TARGET_BAR).
# Finish current step before switching
TARGET_MAIN=$TARGET
echo $TARGET_SIDE
echo $TARGET_MAIN

tmux -S "$SOCKET" rename-window -t "$TARGET_MAIN" "main"       # rename the first window
```

_You don't need multiple panes, just windows._

### Send command after a long research

#### DO IT FIRST: check if SSH still connected

```
tmux -S "$SOCKET" capture-pane -p -t "$TARGET" -S -8
```
`write/edit` writes to the localhost, while tmux SSH are for remote.

_Do not confuse localhost & remote_

### Cleanup

- NEVER KILL W/O ALLOW: clean only after user confirms ALL PASS
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

Use `wait-for-text.sh -h` for help!

```
./scripts/wait-for-text.sh -S "$SOCKET" -t "$TARGET" -p 'pattern' [-T 10]
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
