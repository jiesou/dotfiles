# dsh-nous-portal-free-provider

Nous Portal free tier for dsh.

[简体中文](README.md)

OAuth sign-in on the Hermes Agent (Nous Portal) unlocks free access to a set of models, including Hy3, Ox Alpha, and more. This plugin wires that into dsh.

## Installation

Install from npm (prebuilt artifacts, recommended):

```sh
dsh plugin --profile web add @jiesou/dsh-nous-portal-free-provider
```

Or install from GitHub:

```sh
dsh plugin --profile web add github:jiesou/dsh-nous-portal-free-provider
```

## After installation

Sign in with the bundled CLI:

```
# locate lib/cli.js under your actual plugin directory
node ~/.dsh/profiles/web/node_modules/@jiesou/dsh-nous-portal-free-provider/lib/cli.js
```

Then follow the terminal prompts and sign in with the device code.
A running dsh hot-reloads the result; no restart needed.

### CLI options

```
--portal-url <url>   Portal base URL (default https://portal.nousresearch.com)
--client-id <id>     OAuth client id (default hermes-cli)
--scope <scope>      Requested scope (default inference:invoke)
--dsh-home <dir>     Home holding the credentials document (default $DSH_HOME or ~/.dsh)
--path <file>        Full credentials document path; wins over --dsh-home
```

> Note: the plugin also registers a dsh authorization flow (`ctx.authorization`),
> but dsh 0.1.1-rc.x ships no surface able to start one (the seam exists, the
> page/command does not); the standalone CLI above is the recommended sign-in
> path for now.

## Credential sources (by priority)

| Priority | Source | Notes |
|---|---|---|
| 1 | Credential ref `NOUS_PORTAL_API_KEY` | plain `sk-` key, funded accounts |
| 2 | Credential record `<this plugin>/portal` | OAuth grant written by the sign-in flow |

Storage rides the unified `ctx.credentials` seam entirely: the refresh token is a
grant record, rotation written back through `modifyRecord` (cross-process lock);
access tokens stay in memory only.

The plugin exposes exactly one settings key, `retryPolicy` (per-request retry
policy), defaulting to `always` (retry every failure); every endpoint and the
catalog are discovered dynamically from the upstream `/v1/models`, hardcoded to
sane free-tier defaults, and the CLI above is the only sign-in entry.

## Reasoning effort

A model exposes exactly the levels the upstream feed credits it with. **Default** means "do not send `reasoning_effort`" — the upstream picks its own depth. **Off** is a real switch: it sends the upstream's literal close value (`none`, `off`, …). Models the upstream marks mandatory drop the `Off` entry — there is no way to disable thinking, and the plugin doesn't fabricate one. The plugin never pins a level for you.

## Model catalog: live discovery

Fetched once at startup from the public `/v1/models` listing (no auth needed), keeping the models whose prompt/completion prices are both exactly `$0` as the catalog; metadata (context window, input modalities, reasoning efforts) follows upstream as well. The free set grows and shrinks automatically as upstream rotates — no model id is hardcoded. If the upstream is unreachable at mount the plugin still comes up with an empty catalog; one network blip never takes the plugin down.

## Error reporting

Upstream refusals ("OpenRouter free models are not supported", ended promotions, …) preserve the real reason in the terminal error event — the harness would otherwise mask them under "API key is invalid". Genuine auth failures still surface as AUTH. Anything unparseable passes through verbatim — the original error is never swallowed.

## Caveats

- **Refresh tokens rotate and are single-use**: Portal issues a fresh refresh
  token on every refresh and retires the old one immediately; replaying an
  already-used token is treated server-side as token theft and **revokes the
  entire session** (verbatim: `Refresh token reuse detected; please
  re-authenticate`). The refresh cycle of "read RT → POST → write back new RT"
  therefore runs inside the credential service's `modifyRecord` lock, so no
  second process can submit the same RT concurrently.
  Bottom line: if you still hit a re-authenticate prompt, just run the CLI
  sign-in above again.
- **Device-code approval page bug**: the approval UI on the Portal side has
  failed to render for some users (NousResearch/hermes-agent#47950). If the
  flow stalls, confirm the browser is signed into the Portal and retry.
- **Protocol change (2026-08)**: the Portal retired the `/api/oauth/agent-key`
  minting endpoint; the newer hermes-cli uses the access token (invoke JWT)
  obtained from refresh directly as the inference key, and the sign-in scope
  changed to `inference:invoke`. This plugin follows along.

## License

MIT
