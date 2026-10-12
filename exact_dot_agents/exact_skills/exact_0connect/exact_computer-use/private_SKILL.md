---
name: computer-use
description: Enable mcp-computer-use-linux. USE when you need to control the user's own Linux Desktop.
---

# Computer Use

Toggle `mcp-computer-use-linux` in `~/.dsh/cordis.patch.yml`:

Turn ON:

```sh
sed -i '/- id: mcp-computer-use-linux/{n;n;s/disabled: true/disabled: false/}' ~/.dsh/cordis.patch.yml
```

When the task is complete, disable the MCP tool to avoid consuming context for subsequent tasks.

Turn OFF:

```sh
sed -i '/- id: mcp-computer-use-linux/{n;n;s/disabled: false/disabled: true/}' ~/.dsh/cordis.patch.yml
```

Verify current state (`disabled:` line of the entry):

```sh
sed -n '/- id: mcp-computer-use-linux/{n;n;p;}' ~/.dsh/cordis.patch.yml
```

Notes:

- HMR applies the change in place; no DSH restart.
- First call after turning ON is `mcp__computer-use-linux__doctor`.
- Prefer semantic actions: `get_app_state` (AT-SPI tree) → `perform_action` / `set_value` — element-level hits with exact values; fall back to coordinate `click` / `drag` only when no element matches.
- Always `activate_window` before coordinate input and take fresh bounds; convert with the screenshot's `scale` field (screen = image ÷ scale; do not hardcode 4/3, resolution changes).
- Clicks are one-way injection with no receipt: verify each action's effect (screenshot / `pactl` etc.), retry or switch to semantic on failure.
- If nothing reacts at all: `pgrep -f "computer-use-linux mcp"` must show exactly 1 process; a dead uinput channel recovers after an MCP OFF→ON restart.
- Safety: real desktop inputs — confirm before destructive

