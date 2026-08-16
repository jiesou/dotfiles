# opencode-timeout-auto-reject

Auto-reject unanswered OpenCode permission requests.

Recommended to use with `experimental.continue_loop_on_deny: true` in `opencode.json` (See: [OpenCode Source Code](https://github.com/anomalyco/opencode/blob/3fd77ae980c9e68eccd10f1c396f32c6e3965046/packages/core/src/v1/config/config.ts#L179)).

Stop being lulled by auto-mode's illusion of safety. When a permission lands on "ask" and you're off-screen, this plugin rejects it by default.

## Install

```sh
opencode plugin opencode-timeout-auto-reject
```

Or add to `opencode.json`:

```json
{ "plugin": ["opencode-timeout-auto-reject"] }
```

No configuration needed. Requests unanswered for 3 minutes get auto-rejected.

A very simple and compact code implementation, edit `index.ts` if you like.
