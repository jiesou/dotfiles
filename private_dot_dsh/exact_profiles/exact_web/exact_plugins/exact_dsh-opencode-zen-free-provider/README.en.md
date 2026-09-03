# dsh-opencode-zen-free-provider

OpenCode Zen Free provider for dsh.

[简体中文](README.md)

<img height="650" alt="image" src="https://github.com/user-attachments/assets/8cc57d90-76b8-4a7d-a9fe-1ebb39c4f51c" />

This plugin adds OpenCode Zen's free models to dsh. At startup it syncs the OpenCode Zen and models.dev catalogs and exposes the models whose ids end in `-free`; the catalog is fetched once, no rescan. If the first scan fails the plugin still mounts with an empty catalog — one network blip never takes the model surface down.

## Install

From npm (prebuilt, recommended):

```sh
dsh plugin --profile web add @jiesou/dsh-opencode-zen-free-provider
```

Or from GitHub:

```sh
dsh plugin --profile web add github:jiesou/dsh-opencode-zen-free-provider
```

## After install

The free endpoint works without an API key and uses the anonymous `Bearer public` credential by default. If `OPENCODE_ZEN_FREE_API_KEY` is stored through DSH's credentials service, it takes precedence.

No model configuration is needed. Pick the OpenCode Zen Free provider and a model on the Web Models page to start using it.

## Reasoning effort

A model exposes exactly the levels the upstream feed credits it with. **Default** means "do not send `reasoning_effort`" — the upstream picks its own depth. **Off** is a real switch: it sends the upstream's literal close value (`none`, `off`, …). Models whose effort entry is empty or a `toggle` show no level selector at all.

## Error reporting

OpenCode Zen returns non-credential refusals (ended free promotions, region blocks, …) as HTTP 401/403, which dsh otherwise classifies as "invalid API key". The plugin preserves the real reason in the terminal error event; genuine auth failures still surface as AUTH. Anything unparseable passes through verbatim — the original error is never swallowed.

## License

[MIT](LICENSE)
