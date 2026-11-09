---
name: solidcraft
description: Enable mcp-solidcraft. USE when you need to model parametric 3D CAD parts, or run SolidCraft scripts headless.
disable-model-invocation: true
---

# SolidCraft

Toggle `mcp-solidcraft` in `~/.dsh/cordis.patch.yml`:

Turn ON:

```sh
sed -i '/- id: mcp-solidcraft/{n;n;s/disabled: true/disabled: false/}' ~/.dsh/cordis.patch.yml
```

When the task is complete, disable the MCP tool to avoid consuming context for subsequent tasks.

Turn OFF:

```sh
sed -i '/- id: mcp-solidcraft/{n;n;s/disabled: false/disabled: true/}' ~/.dsh/cordis.patch.yml
```

Notes:

- HMR applies the change in place; no DSH restart.
- The server runs `solidcraft-cli mcp` from `~/.local/bin/solidcraft-cli`, a two-line wrapper over the Flatpak install (`flatpak run --command=solidcraft-cli io.tangencylabs.solidcraft`). Edit the wrapper, not this skill, if the app id changes.
- Headless by default: no window, and `screenshot` still renders on the GPU. When the desktop app runs, the same server bridges to it, so the user watches the model appear.
- File access: the Flatpak sandbox sees `~/Documents` only, and the MCP server additionally limits itself to its recovery and scratch folders. Paths elsewhere fail with `… outside the folders this agent may use …` — add `--allow-path DIR` to the entry's `args` rather than widening the sandbox.
- Every tool runs the same engine commands the toolbar does: `execute` takes a command name and JSON params, `batch` takes a list, and `describe_command` returns a command's parameter contract. Call `commands`/`describe_command` instead of guessing parameter names.
- Units are millimetres and degrees unless an expression says otherwise (`"1 in"`, `"30 deg"`); Z is up.
- A feature that fails leaves the design without the bodies it should have made, and the tool reports it. Inspect before sending the next change.
- Prefer the MCP tools over shelling out to `solidcraft-cli run`. For a script that must be reproducible or benchmarked, the CLI (`run`/`eval`/`snapshot`) is the right tool and needs no MCP toggle.
- Safety: tools that save, export or overwrite files are not read-only — confirm before writing over an existing design.
