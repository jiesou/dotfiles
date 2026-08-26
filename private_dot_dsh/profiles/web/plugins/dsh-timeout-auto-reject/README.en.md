# dsh-timeout-auto-reject

[简体中文](README.md)

<img height="200" alt="timeout reject 截图 2026-08-18 16-37-55" src="https://github.com/user-attachments/assets/92c64038-5054-4721-9af9-032904fd974c" />

<img height="600" alt="timeout reject 截图 2026-08-18 16-33-19" src="https://github.com/user-attachments/assets/7b731119-9bb2-466a-b4f5-e15f7f5e2d49" />

Auto-reject unanswered permission requests.

Any permission request left unanswered for 180s is automatically rejected (fail-closed), and a model-visible `SYSTEM` notice is injected into the agent, which then continues automatically.

Stop being lulled by auto-mode's illusion of safety. When a permission lands on "ask" and you're off-screen, this plugin rejects it by default. Fail-closed is the real safety.

## Install

From npm (prebuilt, recommended):

```sh
dsh plugin --profile web add @jiesou/dsh-timeout-auto-reject
```

Or from GitHub:

```sh
dsh plugin --profile web add github:jiesou/dsh-timeout-auto-reject
```

## After installing

No configuration needed.

The implementation is very simple and compact; feel free to edit `src/index.ts`.

## License

[MIT](LICENSE)
