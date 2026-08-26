# dsh-timeout-auto-reject

Auto-reject unanswered permission requests.

[English](README.en.md)

<img height="200" alt="timeout reject 截图 2026-08-18 16-37-55" src="https://github.com/user-attachments/assets/92c64038-5054-4721-9af9-032904fd974c" />

<img height="600" alt="timeout reject 截图 2026-08-18 16-33-19" src="https://github.com/user-attachments/assets/7b731119-9bb2-466a-b4f5-e15f7f5e2d49" />

自动拒绝未应答的权限请求。

任何 permission 请求如果在 180s 内无人应答，插件会自动拒绝，同时向 agent 注入一条模型可见的 `SYSTEM` 提示，agent 不停止，自动继续运行。

别再被“auto-mode”的安全感骗了，fail-close 才是真安全

## 安装

从 npm 安装（预构建产物，推荐）：

```sh
dsh plugin --profile web add @jiesou/dsh-timeout-auto-reject
```

或从 GitHub 安装：

```sh
dsh plugin --profile web add github:jiesou/dsh-timeout-auto-reject
```

## 安装之后

无需任何配置。

代码实现非常简单小巧，你可以随意修改 `src/index.ts`

## License

[MIT](LICENSE)
