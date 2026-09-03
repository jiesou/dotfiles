# dsh-nous-portal-free-provider

Nous Portal 免费 Tier 接入 dsh

[English](README.en.md)

Hermes Agent（Nous Portal）上 OAuth 登录可以免费使用一些模型，包含 Hy3、Ox Alpha 等。本插件把它接到 dsh 上。

## 安装

从 npm 安装（预构建产物，推荐）：

```sh
dsh plugin --profile web add @jiesou/dsh-nous-portal-free-provider
```

或从 GitHub 安装：

```sh
dsh plugin --profile web add github:jiesou/dsh-nous-portal-free-provider
```

## 安装之后

登录：运行本插件自带的 CLI

```
# 根据实际 plugin 目录找到 lib/cli.js
node ~/.dsh/profiles/web/node_modules/@jiesou/dsh-nous-portal-free-provider/lib/cli.js
```

然后按照终端提示，使用 device code 登录即可
运行中的 dsh 热加载，无需重启

### CLI 选项

```
--portal-url <url>   Portal 地址（默认 https://portal.nousresearch.com）
--client-id <id>     OAuth client id（默认 hermes-cli）
--scope <scope>      申请的 scope（默认 inference:invoke）
--dsh-home <dir>     凭据文档所在 home（默认 $DSH_HOME 或 ~/.dsh）
--path <file>        凭据文档完整路径，优先于 --dsh-home
```

> 注：插件同时注册了 dsh 授权流（`ctx.authorization`），但 0.1.1-rc.x 的
> dsh 还没有能启动它的界面（seam 已有、surface 未发布）；上面这个独立
> CLI 是当前的推荐登录路径。

## 认证来源（按优先级）

| 优先级 | 来源 | 说明 |
|---|---|---|
| 1 | 凭据 `NOUS_PORTAL_API_KEY` | 普通 `sk-` key，付费账户 |
| 2 | 凭据记录 `<本插件>/portal` | 授权流写入的 OAuth grant |

存储完全走 `ctx.credentials` 统一接口：refresh token 是 grant record，
token 轮换通过 `modifyRecord` 写回（跨进程锁）；access token 只存内存。

本插件只有一个 settings 配置项 `retryPolicy`（模型请求重试策略），默认 `always`（每次失败都重试）；其余端点、目录均来自上游 `/v1/models` 动态发现，硬编码为免费层的合理默认值；唯一的登录入口是上面的 CLI。

## Reasoning effort（推理深度）

模型只暴露上游接受的档位，不造档位。**Default** 表示"不发送 `reasoning_effort`"字段，由上游自行决定深度。**Off** 是真开关——发送上游的关闭字面值（`none`、`off` 等）。上游标记为 mandatory 的模型干脆不显示 Off 选项，插件不替它伪造一个。`default_effort` 等元数据由上游决定，插件不替你固定某一档。

## 模型目录：动态发现

启动时从公开的 `/v1/models` 列表（无需认证）抓取一次，**不轮循**。
过滤出 prompt/completion 价格均为 $0 的模型作为目录，元数据
（context window、多模态输入、reasoning efforts）一并跟随上游。
免费集随上游轮换自动增减，不写死任何模型 id。挂载时上游不可达也不挂——目录暂时为空、不会拖垮插件。

## 错误提示

上游拒绝（"OpenRouter free models are not supported"、免费推广结束等）在终端错误事件里保留真实原因，不会被 harness 当 AUTH 吞掉。真正的鉴权失败仍按 AUTH 走，无法解析的内容原样透传。

## 注意事项

- **refresh token 会轮换且单次使用**：Portal 每次 refresh 都发新 refresh token、
  旧 token 立即作废；重复提交已用过的旧 token 会被服务端视为令牌被盗、**吊销整条
  会话**（原话 `Refresh token reuse detected; please re-authenticate`）。因此刷新的
  「读 RT → POST → 写回新 RT」整段都在凭据服务的 `modifyRecord` 锁内执行，避免多进程
  同时提交同一 RT。
  总之：若仍看到 re-authenticate 提示，按上面 CLI 重新登录即可。
- **device-code 审批页 bug**：Portal 端审批 UI 曾对部分用户不渲染
  （NousResearch/hermes-agent#47950）。如果授权卡住，先确认浏览器已登录
  Portal 再重试。
- **协议变更（2026-08）**：Portal 已下线 `/api/oauth/agent-key` 铸造端点，
  新版 hermes-cli 直接把 refresh 换来的 access token（invoke JWT）当推理密钥，
  登录 scope 改为 `inference:invoke`。本插件已跟进。

## License

MIT
