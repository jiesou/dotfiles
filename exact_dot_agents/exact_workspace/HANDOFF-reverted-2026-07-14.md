# Handoff — OpenCode Telegram Bot（2026-07-14 14:03 已还原至上游）

## 1. 用户需求（原文，按时间）

**第一轮（前次会话）：**
1. "检查一下当前 OpenCode Telegram Bot 的 3D Service 这个 Your Service，它是负责起一个 Telegram Bot 的，但似乎它会一直轮询我们本地 OpenCode 的 Web 端口，导致我另外设计了一个 OpenCode Serve 的 Service，它永远不会 Auto Stop。你查一下那些项目的源码，分析一下，有什么方式可以让这个 Telegram Bot 更 Lazy 一点，就不主动去轮询它。这样它可以 Auto Stop，平时节省我的内存。因为原本这两个 Service 全是我自己写的"
2. "你是方案 A、B 还是 C？直观感觉你说的 B 和 C 其实没啥区别，基本上是一个方案，你自己看着决定吧。而且这涉及一个对代码的持久化 patch，这个怎么规划你考虑一下。假如我后续还要考虑更新这个服务的话，尤其考虑这个服务现在是通过 npx 来安装的，没有什么好办法。或者换个说法，你还是尽可能试一下方案 A 吧，我觉得毕竟这个方案是通过 npx 来安装的。"
3. "所以你是方案 A、B 还是 C？还是遇到了问题让你改了哪些地方？如果 npx 更新了会怎么样？还有就是现在这个服务已经重启应用了吗？我看到过去几个小时了，好像电脑依然没有休眠"
4. "直到 Telegram Bot 确定可以休眠，电脑确定可以休眠（通过log）。要有验证、完整的报告"
5. "后台通知的功能还在吗"
6. "你检查一下log，现在一直 向 OpenCode 发送请求失败。"
7. "根本不对，它本来就会自动拉起。你不要改了，把你的修改撤回去，本来就有"
8. "停下手头的一切工作，生成交接文档"

**第二轮（本次会话）：**
9. "我怎么感觉现在我在 Bot 这边直接收发不了消息了？就是这个状态同步是没有的。我网页上收发以前在 Bot 上，他会有一些状态同步，他实时的会变。那现在好像不行了吗？多试试看"
10. "你先让我知道你现在想干嘛"
11. "规划清楚再执行动作，你现在动作很危险"
12. "你应该是新起一个 Plan 了，你要不要生成一个重新 Handoff 的报告？就是还原之后你再进行一个 Handoff，然后再考虑你现在已经还原了吗？验证"
13. "你的 handoff 一点都不合规范。关键是我要做什么你毛都没写，而且全都是你瞎几把在那边说我接下来要干嘛、我接下来要干嘛。你你你你瞎几把写，根本没按照规范来。你有一个 handoff 的 skill 啊"

## 2. 上下文（事实）

### 架构
| 组件 | 服务 | 端口 | 说明 |
|------|------|------|------|
| Bot | `opencode-telegram-bot.service` | — | grammy long polling 收 Telegram 消息；SSE 连 OpenCode 事件流 |
| Socket | `opencode-wake-on-demand.socket` | 4096 | 按需启动 proxy |
| Proxy | `opencode-wake-on-demand.service` | 4096→4097 | systemd-socket-proxyd 转发 |
| Serve | `opencode-serve.service` | 4097 | OpenCode HTTP API |
| Probe | `custom-status-probe.js` | 4098 | 返回 `{"busy":bool,"count":N}`，供 auto-stop 脚本查询 |

唤醒链：`Bot 连接 4096 → socket 激活 proxy → proxy Requires=opencode-serve.service → serve 启动`

### 关键机制（已查证源码/单元文件）
- **Probe BUSY 集合**：仅由 `session.status`(busy/retry) 与 `session.idle` 事件维护（`custom-status-probe.js`）。与 Bot 是否持有 SSE 订阅无关。
- **serve auto-stop**：`opencode-serve.service` 的 `ExecStartPost` 每 300s 查 4098 的 `.busy`；连续 600s 非 busy 则 `systemctl --user stop opencode-serve.service`。serve 运行时持 `systemd-inhibit --what=sleep`（sleep blocker）。
- **serve 被唤醒的真实路径**：Bot 的 SSE 连接打 4096 → systemd socket 激活 `opencode-wake-on-demand.service` → 其 `Requires=opencode-serve.service` 拉起 serve。Bot 每 ~30s 因 idle timeout 重连，故周期性唤醒 serve。
- **idle-stop patch（plan B，已撤销）**：`events.ts` 中 `subscribeToEvents()` 在第 3 次 idle timeout（`MAX_CONSECUTIVE_IDLE_TIMEOUTS=3`）后调用 `stopEventListening()` 并 return；重连仅由收到 Telegram 消息时的 `ensureEventSubscription()` 触发，本地网页活动不触发。

### 已发生的动作（本会话，事实记录）
- `git checkout src/opencode/events.ts` → 还原到上游 v0.22.2 tag `639288c`（工作区干净）。
- `npm run build`（14:03）→ `dist/cli.js` 重编，不含 patch。
- `systemctl --user restart opencode-telegram-bot.service`（14:03:52）。
- serve 此前在 13:56:06 因 auto-stop 变 inactive；Bot 重启订阅后 serve 于 14:03:53 被唤醒并 active。

### 已查证状态
- `git status` 干净；`dist/cli.js` 不含 `MAX_CONSECUTIVE_IDLE_TIMEOUTS` / `stopping listener`（grep 计数 0）。
- Bot 日志 `[14:05:16] Subscribing to OpenCode events for project: /var/home/chen/.agents/workspace`（SSE 订阅恢复）。
- 用户 `/new` + prompt 被接受（`session.promptAsync accepted`），serve active（14:05 起）。
- 当前 Bot 持续持有 SSE → serve 被保活（电脑不会眠，回到用户最初抱怨的状态）。

## 3. 文件 / 关键信息 / skill

| 文件 | 状态 |
|------|------|
| `~/Documents/dev/Projects/opencode-telegram-bot/src/opencode/events.ts` | 已还原（clean，= 上游 `639288c`） |
| `~/Documents/dev/Projects/opencode-telegram-bot/dist/cli.js` | 重编于 2026-07-14 14:03，无 patch |
| `~/.config/systemd/user/opencode-telegram-bot.service` | `ExecStart=/home/linuxbrew/.linuxbrew/bin/node .../dist/cli.js start`（`Restart=on-failure`）；**未**还原成 npx |
| `~/.config/systemd/user/opencode-serve.service` | `Restart=on-failure, RestartSec=5`；`ExecStartPost` 含 4098 查询的 auto-stop 循环 |
| `~/.config/systemd/user/opencode-wake-on-demand.service` | `Requires=opencode-serve.service`、`Requires=opencode-wake-on-demand.socket` |
| `~/.config/systemd/user/opencode-wake-on-demand.socket` | `ListenStream=0.0.0.0:4096` |
| `~/.config/opencode-telegram-bot/.env` | `OPENCODE_API_URL=http://127.0.0.1:4096`、`TRACK_BACKGROUND_SESSIONS=true`、`OPENCODE_AUTO_RESTART_ENABLED=false` |
| `~/.config/opencode/plugins/custom-status-probe.js` | BUSY 仅由 session.status / session.idle 维护 |

**Skill**：`handoff`（`/var/home/chen/.agents/skills/handoff`，规范：需求原文 + 上下文 + 文件/关键信息/skill/mcp，不含推测与建议）
**MCP**：本次未涉及
**待办事实项（非建议，仅列出未决状态）**：
- 方向未定：保持已还原状态（serve 被保活、电脑不眠）/ 重新 idle-stop（电脑眠但网页同步断）/ 折中。
- `ExecStart` 仍指向本地 `dist/cli.js`，未还原为 npx。
- serve 当前被 Bot 保活，未处于休眠态。
