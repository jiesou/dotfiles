---
name: browser-use
description: USE when you need to control the user's own daily-use browser.
---

# Browser Use

## Route A: Playwright CLI (default)

The user-level CLI configuration is already at `~/.playwright/cli.config.json`:

```json
{
  "extension": true,
  "browser": {
    "userDataDir": "/var/home/chen/.var/app/com.brave.Browser/config/BraveSoftware/Brave-Browser",
    "launchOptions": {
      "executablePath": "/var/home/chen/.local/bin/brave-flatpak"
    }
  }
}
```

Attach to the already-running local Flatpak Brave through the Playwright Extension. **Never run bare `attach`**: it has no target and produces `no target specified`.

Run this exact command from any directory:

```sh
set -a
. ~/.dsh/.env
set +a
npx --offline @playwright/cli attach --extension=chromium --session=brave
```

Playwright CLI automatically loads the global user config at `~/.playwright/cli.config.json` (a project-local `.playwright/cli.config.json` takes precedence if present). `--extension=chromium` is the required attach target; Brave is Chromium-compatible. `--session=brave` names the Playwright tab group/session and is not a replacement for `--extension`. Loading `~/.dsh/.env` supplies `PLAYWRIGHT_MCP_EXTENSION_TOKEN` when the user is off-screen; it does not change the browser route.

Use the session for browser actions:

```sh
npx --offline @playwright/cli
 --session=brave snapshot
npx --offline @playwright/cli
 --session=brave tab-list
npx --offline @playwright/cli
 --session=brave screenshot
```

Detach without closing Brave:

```sh
npx --offline @playwright/cli
 --session=brave detach
```

The CLI package is intentionally invoked with `npx --offline`; do not install it globally. The CLI extension target is `chromium`, while the configured executable is the Flatpak Brave wrapper.

## Route B: MCP (explicit request only)

If user explicitly requests MCP, toggle `mcp-playwright` in `~/.dsh/profiles/web/cordis.patch.yml`.

Turn ON:

```sh
sed -i '/- id: mcp-playwright/{n;n;s/disabled: true/disabled: false/}' ~/.dsh/profiles/web/cordis.patch.yml
```

After the task is complete, ask whether the user wants MCP disabled. If confirmed, turn it OFF:

```sh
sed -i '/- id: mcp-playwright/{n;n;s/disabled: false/disabled: true/}' ~/.dsh/profiles/web/cordis.patch.yml
```

MCP notes:

- HMR applies the change in place; no DSH restart.
- The first browser tool call opens the Playwright connect page inside Flatpak Brave (`~/.local/bin/brave-flatpak`) and uses `PLAYWRIGHT_MCP_EXTENSION_TOKEN`.
- Do not enable MCP merely because this skill was loaded.

## Authentication (keep in mind, feel free to use)

You can use the `bw` (Bitwarden) CLI to log in.

- Including 2FA (via TOTP)
  - while `bw get totp <id>` requires a Premium, you can instead use `bw get item | jq -r .login.totp` to get the SHA seed and calculate the code yourself.
- Still requires user confirmation: before post public content, especially things that cannot be undo.
