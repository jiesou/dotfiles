# dsh-focus-preset

A Focus agent preset for dsh: a leaner variant of the standard preset.

[简体中文](README.md)

![Context usage: system prompt at ~586 tokens](https://raw.githubusercontent.com/jiesou/dsh-focus-preset/main/docs/context-budget.jpg)

The system prompt weighs in at **~586 tokens** — roughly half of the standard preset and twice the minimal one, leaving the context budget for the actual work.

The `standard` preset built into [dsh](https://github.com/deepseek-ai/deepseek-harness) is the full coding agent. Focus tightens a few things on top of it, to make one preset closer to "a focused executor":

- **Shorter persona**: a compact system-prompt prefix replaces the long standard one, keeping the safety boundaries, tool-usage discipline and parallelism rules.
- **Spawn-only delegation**: the `subagent` tool mounts the spawn backend only; `tool-subagent-fork` is not mounted, so there is exactly one delegation shape.
- **No background jobs**: `tool-bash` / `tool-pwsh` mount with `enableRunInBackground: false` and the `jobs` tool is not mounted — one foreground thing at a time.
- **No str-replace-editor**: file changes go through the `write` / `edit` tools, with no third editing entry point.
- **Compaction unchanged**: `compaction-basic`, the `/compact` command and `tool-result-pruner` (8192/4096/1024 thresholds) match standard.

The preset itself is a composition layer: `cordis.patch.yml` registers a preset with `id: focus` and `order: 10` through `@deepseek-ai/dsh-agent-preset`, and its plugins are a full `standard`-shaped agent-plane composition (persona / shell / filesystem / skill / goal / compaction / delegation / todo / ask-user / web). The host-plane registries, sandbox, approvals, persistence and model routes stay in the profile's host composition — a preset does not own them.

## Install

From npm (recommended):

```sh
dsh plugin --profile web add @jiesou/dsh-focus-preset
```

Or from GitHub:

```sh
dsh plugin --profile web add github:jiesou/dsh-focus-preset
```

This is a pure composition-layer (bundle) plugin with no runtime code; it takes effect after **restarting dsh**.

## After installing

The preset id is `focus` and shows up as **Focus** in the web preset picker (`order: 10`, right after standard). To make it the default for new sessions, change one row in the profile's `cordis.patch.yml`:

```yaml
- id: agent-preset-registry
  name: "@deepseek-ai/dsh-agent-preset-registry"
  config:
    default: standard
    selectedDefault: focus
```

### Customizing the preset

The preset content is the `config.plugins` of the `preset-focus` row in `cordis.patch.yml`. To edit it after installing from npm, first `dsh plugin --profile web remove @jiesou/dsh-focus-preset`, then clone the repo locally and install by path:

```sh
dsh plugin --profile web add /path/to/dsh-focus-preset
```

Restart dsh after editing.

## Compatibility

Declared in `package.json` under `engines.dsh` and `dsh.compatibility`: DSH `>=0.2.0-rc.2 <0.3`, Node.js `^22.19.0 || >=24.0.0`, Profile `web` / `headless`.

The lower bound is not a preference: from `0.2.0-rc.2` on, agent presets follow the "preset row + entry-local realm" composition contract, where a service row must sit inside a group carrying an `isolate` realm — otherwise it publishes into the root realm and collides with other presets. Earlier dsh releases do not understand this composition.

## Release

Version numbers look like `0.1.0` (no `v` prefix); npm config lives in the repo-root `.npmrc`. Pushing a version tag runs GitHub Actions, which publishes through npm Trusted Publishing (OIDC) with no `NPM_TOKEN` at all:

```sh
npm run release   # = npm version patch && git push --follow-tags
```

`.githooks/pre-push` verifies the pushed tag matches `package.json`'s version and aborts the push on a mismatch (`git config core.hooksPath .githooks` ships with the repo).

## License

[MIT](LICENSE)
