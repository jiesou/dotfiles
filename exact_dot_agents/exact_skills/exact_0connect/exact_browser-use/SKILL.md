---
name: browser-use
description: Enable mcp-playwright. USE when you need to control the user's own daily-use browser.
---

# Browser Use

Toggle `mcp-playwright` in `~/.dsh/cordis.patch.yml`:

Turn ON:

```sh
sed -i '/- id: mcp-playwright/{n;n;s/disabled: true/disabled: false/}' ~/.dsh/cordis.patch.yml
```

When the task is complete, disable the MCP tool to avoid consuming context for subsequent tasks.

Turn OFF:

```sh
sed -i '/- id: mcp-playwright/{n;n;s/disabled: false/disabled: true/}' ~/.dsh/cordis.patch.yml
```

Verify current state (`disabled:` line of the entry):

```sh
sed -n '/- id: mcp-playwright/{n;n;p;}' ~/.dsh/cordis.patch.yml
```

Notes:

- HMR applies the change in place; no DSH restart.
- After turning ON, the first browser tool call opens the Playwright connect page inside the Flatpak Brave (`~/.local/bin/brave-flatpak`) and auto-authenticates with `PLAYWRIGHT_MCP_EXTENSION_TOKEN`.
- When the task is complete, disable the MCP tool to avoid consuming context for subsequent tasks.
- This tool won't break.

## Authentication

You can use the `bw` (Bitwarden) CLI to log in.

- Including 2FA (via TOTP)
  - while `bw get totp <id>` requires a Premium, you can instead use `bw get item | jq -r .login.totp` to get the SHA seed and calculate the code yourself.
- Still requires user confirmation: before post public content, especially things that cannot be undo.
