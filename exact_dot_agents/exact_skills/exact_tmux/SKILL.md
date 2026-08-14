---
name: tmux
description: "Use tmux for any long-running, interactive CLIs (ssh, gdb, etc.)"
---

# tmux

Firstly, **strictly** follow the instructions below.

Also grep `man tmux` to find anything you need!

## Quickstart

```
tmux list-sessions  # try reuse existing session
```

### Create Session

```
SESSION=whatever-work
tmux new -d -s "$SESSION"
TARGET="$(tmux display-message -p -t "$SESSION" '#{session_name}:#{window_id}.#{pane_id}')"
echo "$TARGET"
# Don't assume that target is `session:0.0`; instead, display-message and save
# Once `TARGET` got, the session can be always reused
```

### Enter Shell Env

```
# SSH
grep -A 8 "^Host hostname" ~/.ssh/config        # get host password & context in `~/.ssh/config`
tmux send-keys \
  -t "$TARGET" \
  "ssh hostname" Enter                           # use plain `hostname`, no user or ports needed

# devcontainer
devcontainer --help                               # get help
tmux send-keys \
  -t "$TARGET" \
  "devcontainer exec --workspace-folder path/to/project bash" Enter

# verify SSH connected/devcontainer entered
./scripts/wait-for-text.sh \
  -t "$TARGET" \
  -p '[$#❯ ]|password|密码|yes/no'
```

Shell Envs such as python venv, gdb ... all be enter in this way.

### Send command (Quick-shots)

```
tmux send-keys -t "$TARGET" "whoami" Enter
sleep 0.1
tmux capture-pane -p -t "$TARGET" | grep . | tail -4  # strip blank lines
```

### Send command (Long-running)

For any operation that require waiting longer than 5 seconds, don't use `sleep [large number]`; instead, use wait-for-text.sh and follow these guidelines:
- Invoking two commands in one toolcall (avoid waiting timing issues)
- Set caller timeout to 20s (not default 120s)

Always set your shell tool caller's timeout to a reasonable upper bound (e.g. timeout=20000ms), instead of the default 120s.
Let wait-for-text poll indefinitely; your caller's timeout is the source of truth that cuts it off.

```
tmux send-keys -t "$TARGET" 'sudo apt update' Enter
./scripts/wait-for-text.sh -t "$TARGET" -p '[$#❯ ]|password|密码'
```

### Send command (Super-long-running)

For any operation that require waiting longer than 60 seconds, you'd better:

1. Call `capture-pane` first, before `wait-for-text`.
To confirm that it IS proceeding instead of failing in seconds.
2. Set caller timeout to a value that is "not too long".
To check the status periodically, because the completion time is uncertain.

##### send-keys reference

| Mode | Syntax | Use for |
|-----|------|----|
| Direct | `send-keys 'text'` then `Enter` | Some commands |
| Literal | `send-keys -l 'text'` then `Enter`| Most commands, plain text `\|` `>` `$` `;` `&` all sent literally |
| C-literal | `send-keys $'text'` then `Enter` | Cases need `\n` `\t` escapes |

For multi-line commands:

```
tmux load-buffer -b cmd - <<'CMD'
echo "hello from $(whoami)"
echo "hostname: $(hostname)"
uptime
CMD
tmux paste-buffer -p -b cmd -t "$TARGET"
sleep 1        # pasting takes some time
tmux send-keys -t "$TARGET" Enter
```

### Monitor hint for the user

Print this right after starting a session:

```md
To monitor: tmux attach -t "[TARGET]"
```

## Helpful informations

### Create another TARGET (second terminal)

When you need a second terminal, such as:
- sync something
- server + interaction
You can create multiple tmux windows in the same session, follow these steps:

```
tmux new-window -t "$SESSION" -n "side"            # give it a meaningful name
TARGET_SIDE="$(tmux display-message -p -t "$SESSION:side" '#{session_name}:#{window_id}.#{pane_id}')"
TARGET_MAIN=$TARGET
echo $TARGET_SIDE
echo $TARGET_MAIN

tmux rename-window -t "$TARGET_MAIN" "main"     # rename the first window
```

### Send command after a long research

#### DO IT FIRST: check if SSH still connected

```
tmux capture-pane -p -t "$TARGET" -S -8
```
`write/edit` writes to the localhost, while tmux SSH are for remote.

Don't confuse localhost & remote

### Graceful cleanup

No cleanup by default.

First, always ask the user if they really need the cleanup!
Second:
```
tmux send-keys -t "$TARGET" C-c    # if needed
tmux kill-session -t "$SESSION"       # final
```

### Helper: wait-for-text.sh

Polls a TARGET for a regex pattern and exit when found.
On match, prints the last 30 lines of the pane, then exits 0.

Use `wait-for-text.sh -h` for help!

```
./scripts/wait-for-text.sh -t "$TARGET" -p 'pattern'
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
- Other TTY apps: same pattern —— enter shell env, wait for prompt, send text and Enter.
