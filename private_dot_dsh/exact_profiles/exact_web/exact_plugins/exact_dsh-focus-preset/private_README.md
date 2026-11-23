# dsh-focus-preset

为 dsh 提供 Focus Agent 预设：标准预设的精简变体。

[English](README.en.md)

![上下文占用：系统提示词约 586 tokens](https://raw.githubusercontent.com/jiesou/dsh-focus-preset/main/docs/context-budget.jpg)

系统提示词只占 **约 586 tokens**：大约是 standard 预设的一半、minimal 预设的两倍——上下文预算省下来留给真正要干的活。

[dsh](https://github.com/deepseek-ai/deepseek-harness) 内置的 `standard` 预设是完整的编码 Agent。Focus 在它基础上收紧了几处，让一个预设更接近「一个专注的执行者」：

- **更短的 persona**：用精简的 system prompt 前缀替代 standard 的长 prompt，保留安全边界、工具使用纪律与并行原则。
- **只留 spawn 委派**：`subagent` 工具只挂 spawn backend，`tool-subagent-fork` 不挂载，委派形态只有一种。
- **不开后台任务**：`tool-bash` / `tool-pwsh` 都以 `enableRunInBackground: false` 挂载，`jobs` 工具不挂——一次只做一件跑在前台的事。
- **不做 str-replace-editor**：文件改动走 `write` / `edit` 两个工具，不额外挂第三套编辑入口。
- **压缩与工具结果裁剪照旧**：`compaction-basic`、`/compact` 命令、`tool-result-pruner`（8192/4096/1024 阈值）与 standard 一致。

预设本体就是一份组合层：`cordis.patch.yml` 通过 `@deepseek-ai/dsh-agent-preset` 注册 `id: focus`、`order: 10` 的预设，内部是一整个 `standard` 形态的 agent-plane 组合（persona / shell / filesystem / skill / goal / compaction / delegation / todo / ask-user / web）。host 侧的注册表、沙箱、审批、持久化与模型路由仍由 profile 的宿主组合提供，预设不拥有它们。

## 安装

从 npm 安装（推荐）：

```sh
dsh plugin --profile web add @jiesou/dsh-focus-preset
```

或从 GitHub 安装：

```sh
dsh plugin --profile web add github:jiesou/dsh-focus-preset
```

这是个纯组合层（bundle）插件，没有运行时代码，装进 profile 的层栈后**重启 dsh** 生效。

## 安装之后

预设 id 是 `focus`，在 Web 的预设选择器里显示为 **Focus**（`order: 10`，排在 standard 之后）。想让它成为新会话的默认预设，在 profile 的 `cordis.patch.yml` 里改一行：

```yaml
- id: agent-preset-registry
  name: "@deepseek-ai/dsh-agent-preset-registry"
  config:
    default: standard
    selectedDefault: focus
```

### 改预设

预设内容就是 `cordis.patch.yml` 里 `preset-focus` 那一行的 `config.plugins`。装成 npm 包后想改，先 `dsh plugin --profile web remove @jiesou/dsh-focus-preset`，再把仓库 clone 到本地、按路径安装：

```sh
dsh plugin --profile web add /path/to/dsh-focus-preset
```

改完重启 dsh 生效。

## 兼容性

声明在 `package.json` 的 `engines.dsh` 与 `dsh.compatibility`：DSH `>=0.2.0-rc.2 <0.3`，Node.js `^22.19.0 || >=24.0.0`，Profile `web` / `headless`。

下界不是偏好：`0.2.0-rc.2` 起 agent preset 走「预设行 + entry-local realm」这套组合契约，service 行必须落在带 `isolate` 的 group 里，否则发布到 root realm 与其他预设冲突。更早的 dsh 不认这份组合。

## 发布

版本号格式 `0.1.0`（不带 `v` 前缀），`pnpm`/`npm` 配置见仓库根的 `.npmrc`。推版本 tag 触发 GitHub Actions 用 npm Trusted Publishing（OIDC）发版，全程不需要 `NPM_TOKEN`：

```sh
npm run release   # = npm version patch && git push --follow-tags
```

`.githooks/pre-push` 会在推送版本 tag 时校验 tag 与 `package.json` 的 version 一致，不一致直接中止推送（`git config core.hooksPath .githooks` 已随仓库配置）。

## License

[MIT](LICENSE)
