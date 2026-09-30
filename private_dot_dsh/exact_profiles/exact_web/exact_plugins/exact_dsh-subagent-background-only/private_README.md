# dsh-subagent-background-only

只允许 Agent 调用后台自代理：continuable 的委派工具，其模型可见 schema
里根本没有 `run_in_background` 参数——而不是给了再拒绝。

纯 Cordis 插件（无 `dsh.bundle`）：经 web profile 的 `cordis.patch.yml` insert 行挂载，**配置 HMR 实时生效，零重启**。

## 做法

把 agent 实际解析到的那个工具定义**原地改写**：

- schema：删掉 `run_in_background`（连同 `required` 里的同名项）。
- description：去掉教模型传 `false` 的引导，改成"always runs in the background"。
- `execute`：包一层，强制注入 `run_in_background: true` 再调原 body——模型就算
  幻觉出 `false` 也照样进后台。
- `agent/created` 到达即改写，`tools/change` 做 top-up；靠 `Symbol` 标记幂等。
- one-shot 工具（`subagent_codex` / `subagent_claude_code`）无后台形态，
  guard 直接拒绝。

> **改写是单向的**：卸下本插件（删 insert 行 / disable）**不会**还原 schema 与
> description——被改的是定义本体。要恢复得重启宿主让它重新注册。

### 为什么是"原地改写"，而不是"注册同名遮蔽"

注册 scope-local 遮蔽**在这条路上必然失败**，而且是静默失败，别再试：

`@deepseek-ai/dsh-tool-subagent` 带 `modelSelectionSettings: true` 时（shipped
的 standard/ptc/cordis preset）走 `installScoped()`：

```js
candidate.ctx.inject([...], (runtimeCtx) => install(runtimeCtx, policy))
```

它把工具注册进 **agent 自己的 layer**，不是 preset 层。本插件若也用
`agent.ctx.tools.register(...)`，落进的是**同一个 layer**，而
`dsh-scope` 的 `NamedEntries.insert()` 对同层重名直接抛：

```
Error: tool "subagent" is already registered in this scope
```

更关键的是 `view()` 里 agent 自己的 layer **最后应用、无条件覆盖**所有继承层——
所以注册到作用域链上任何一层都盖不住它**——不带 `modelSelectionSettings` 的普通
preset 行（如 `focus`）则是注册进 **preset standing layer**，同样盖不住**。**原地改定义是唯一能改到 agent 实际
解析结果的手段**：`view()` 借出的是定义对象本体（不是副本），`schemaOf()` 在投影
时才读 `description` / `parameters`，所以原地改对模型目录和 dispatch 同时生效。

> **取定义必须带 scope**：`agent.ctx.tools.get(name, agent)`。
> `ToolRuntime.get(name)` 省略 scope 读的是**全局视图**
> （`view(undefined)` 只看 global layer），而 preset 的委派工具注册在 preset
> standing layer 里——省略 scope 就永远 `undefined`，静默 no-op。
> 全仓的读法都是带 scope 的：`tools.get("read", agent)`、`tools.schemas(agent)`。
> 2026-09-11 修复的正是这一处遗漏（此前只有 `modelSelectionSettings: true` 那条
> 路径被验证过，`focus` 这类普通 preset 行没走到，所以测试全绿却完全无效）。

### 为什么删参数是安全的（以及什么情况下不安全）

`tool-subagent` 这样解析路由：

```js
{ runInBackground: request.run_in_background ?? options.continuable }
```

`backgroundMode: continuable` 时，参数缺省本就是后台，删掉参数只是拿掉模型"退出
后台"的能力，默认路由不变。但 **`one-shot` 模式下删参数会把默认路由翻成前台**，
所以插件先认声明：只有工具描述承诺 durable subagent id、且参数自述
`Defaults to true.` 时才剥离；任一信号不符就**拒改并告警**。

同理，**改 description 的锚点改不动也拒改**：判定与改写同源，若上游只改了那句
"Set `run_in_background: false`…"的措辞，插件会拒改并告警，而不是留下一个删了参数、
提示词却还在教模型传它的半成品。

> 实测：dsh-headless 的 `subagent_fork` 配的是 `backgroundMode: one-shot`，
> 插件会拒改它并打印告警——这是正确行为，不是 bug。

| 调用 | 模型看到 | 结果 |
|---|---|---|
| `subagent`（continuable） | 无 `run_in_background` 参数 | 后台执行，返回 durable id |
| `subagent_fork`（one-shot 配置时） | 原样 | 拒改 + 告警，行为不变 |
| `subagent_codex` / `subagent_claude_code` | 原样 | 拒绝：one-shot run denied |
| `send_message` / `interrupt_agent` / `job_*` | 原样 | 放行 |

### 已知残留：system prompt 里还有一句在教 `false`

`tool-subagent` 在 continuable 时另外注册一段 system prompt
（`name: 'tool:<toolName>'`），文案仍是 "Set `run_in_background: false` only when
your next action depends on that subagent's result."——而那个参数已经不在 schema 里了。
插件没有覆盖它，因为覆盖不了：

- 该段与工具一起注册进**同一个 layer**。带 `modelSelectionSettings: true` 的行
  （shipped standard/ptc/cordis 三个 preset 的 `subagent` 都是）走 `installScoped()`，
  工具和段落都进 **agent 自己的 layer**；插件再从 `agent.ctx` 注册同名段落会抛
  `prompt section "tool:subagent" is already registered in this scope`。
- 只有在 preset standing layer 里的行（如 `subagent_fork`）才盖得住——但那样插件就得
  依赖 `tool:<toolName>` 段名与 `TOOL_SUBAGENT` order 常量，等于把上游内部结构抄进来。

所以现状是：**schema 层已彻底删掉参数，提示词层还剩一句陈旧引导**。模型仍可能试传
一次 `run_in_background: false`，收到参数校验错误（该参数已不存在），随后照 schema 走。
要根治得靠上游给一个"只允许后台"的 `backgroundMode`。

## 安装

```sh
dsh plugin --profile web add /var/home/chen/.dsh/profiles/web/plugins/dsh-subagent-background-only
```

然后向 `$DSH_HOME/profiles/web/cordis.patch.yml` 追加 insert 行：

```yaml
- insert:
    - id: subagent-background-only
      name: 'dsh-subagent-background-only'
```

保存后 HMR 实时挂载。改 Node half 源码需重启 web（ESM 缓存）：

```sh
systemctl --user restart dsh-web.service
```

## 排障

挂载后会打印一行 `active: ...`（logger 与 console 双写）。**看不到它、或看不到告警，
就是没生效**——早期版本把 `register()` 的异常整个吞掉，导致插件静默无效了很久，所以现在
改写失败一律 `logger.warn` + `console.warn`，不吞异常。日志里带前缀
`subagent-background-only:`，console 里是 `[subagent-background-only] ...`。

真正的"生效"证据是这两行之一：

```
[subagent-background-only] agent/created: stripped run_in_background from 1 delegation tool(s)
[subagent-background-only] mount: stripped run_in_background from 1 delegation tool(s)
```

只有 `active: ...` 而没有 `stripped ...`，就是取定义取空了（历史 bug：`get`
漏传 scope）。要 100% 确认，去看会话日志里模型真实收到的目录：

```sh
zstd -dc ~/.dsh/sessions/<slug>/<session-id>/session.v3.jsonl.zstd \
  | grep -o '"type": "request/header".*' | head -c 2000
```

`request/header.tools` 就是发给模型的 tools 数组；`subagent` 的 `parameters`
里不该再有 `run_in_background`。description 里原来那句 false 引导会被
`This tool always runs in the background.` 替换掉——注意它**不总在结尾**：带
`modelSelectionSettings: true` 的行（shipped preset 的 `subagent`）后面还接着一段
child LLM selection 文案，只有不带该配置的行才是结尾。

## 开发

```sh
pnpm run check   # typecheck + build + test
```

- `src/index.ts` 只有 cordis 契约（`name` / `inject` / `apply`），引擎耦合的改写逻辑
  在 `src/patch.ts`，不进发布面。
- `tests/engine.spec.ts` 用**真引擎**（本机 dsh 的 `dsh-tools` + `dsh-scope`）搭出
  "preset standing scope + agent scope" 的形状，断言 `tools.schemas(agent)`，并在真引擎
  里核对 `src/patch.ts` 依赖的每一句上游文案仍在——本机的 dsh 找不到时整组 skip。

## 许可

MIT
