# 中转站面板完整指纹清单

> 来源：2026-07-31 调研（克隆 Sub2API / new-api / one-api / codex2api / CLIProxyAPI 源码逐行比对 + 对 9 个真实 Sub2API 实例 + 1 个真实 New API 实例 + Codex2API 官方 demo 进行 curl 实测）。

## Sub2API

官方仓库：`github.com/Wei-Shaw/sub2api`（Go 1.25 + Gin + Ent，Vue 3 + Vite，PostgreSQL 15 + Redis 7，前端打进单二进制，默认端口 8080）。

### API 端点

| 端点 | 说明 |
|---|---|
| `POST /v1/messages` | Claude API 兼容（Anthropic 分组主入口） |
| `POST /v1/chat/completions` | OpenAI 兼容 |
| `POST /v1/responses` / `/v1/responses/*` | OpenAI Responses |
| `GET /v1/models` | 带 `?client_version=` 返回 Codex manifest，否则按分组返回模型列表 |
| **`GET /v1/sub2api/billing`** | 倍率自省端点（新版独有），成功返回 `{"object":"sub2api.key_billing",...}` |
| `GET /v1/usage` | 余额/订阅/用量（供 CC Switch 等工具） |
| `GET /v1beta/models` | Gemini 原生列表 |
| `/backend-api/codex/*` | Codex 客户端直连 |
| `/antigravity/v1/messages`、`/antigravity/models` | Antigravity 账户专用（独有） |
| `/setup/status` | 面板状态（**所有版本都有**）→ `{"code":0,"data":{"needs_setup":false,"step":"completed"}}` |
| `/health` | → `{"status":"ok"}` |
| `/api/event_logging/batch` | POST 恒返回 200（Claude Code 遥测，独有） |
| `/api/v1/auth/login`、`/api/v1/auth/register`、`/api/v1/user/*`、`/api/v1/admin/*` | 面板（JWT） |

### 鉴权（很独特）

同时接受三种 key 传递方式（`api_key_auth.go`）：
1. `Authorization: Bearer <key>`
2. `x-api-key: <key>`
3. **`x-goog-api-key: <key>`** ← Gemini CLI 兼容，只有 Sub2API 系这么干

key 放 query 参数（`?key=`/`?api_key=`）会主动拒绝，报 `api_key_in_query_deprecated`（防套娃转发）。

### 响应头

- **`X-Client-Request-Id: <uuid4>`** — 每个网关请求都带
- `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`
- **没有** `X-Oneapi-Request-Id`、**没有** `X-New-Api-Version`

### 错误格式（关键指纹）

1. 鉴权层 → `{"code":"API_KEY_REQUIRED","message":"API key is required in Authorization header (Bearer scheme), x-api-key header, or x-goog-api-key header"}`（HTTP 401 真状态码）
   - key 无效 → `{"code":"INVALID_API_KEY","message":"Invalid API key"}`
2. 业务层（Anthropic 风格）→ `{"type":"error","error":{"type":"authentication_error","message":"..."}}`
3. OpenAI 兼容配额 → `{"error":{"message":"...","type":"insufficient_quota",...}}`

**关键：错误 message 不附加 request id，也没有 `new_api_error`。**

### 模型命名

按分组平台返回**订阅账号的真实模型名**（非自造别名）：
- Anthropic → `claude-sonnet-4-5-20250929`、`claude-opus-4-5-20251101` 等（真实 OAuth 名）
- OpenAI → `gpt-5.x*`、`gpt-image-*`
- `/v1/models` 的 Claude 列表 `created_at` 恒为 `2024-01-01T00:00:00Z`（源码硬编码 fallback）

### 前端特征

- Vue3 SPA，默认标题 `<站点名> - AI API Gateway`
- **Vite chunk 独有命名**：`vendor-vue-*.js`、`vendor-i18n-*.js`、`vendor-misc-*.js`
- 用户路由：`/login` `/register` `/dashboard` `/keys` `/usage` `/redeem` `/affiliate` `/subscriptions` `/purchase` `/orders` `/model-plaza` `/available-channels`
- 管理路由：`/admin/dashboard` `/admin/accounts` `/admin/groups` `/admin/api-keys` …

### 计费

- 按 token 倍率：分组 `RateMultiplier`，`/v1/sub2api/billing` 可查
- 售卖形态：分组（group）绑定订阅账号池；订阅型按日/周/月 USD 限额，余额型按钱包

## New API / One API

- 响应头：**`X-Oneapi-Request-Id`**（`20260731<时间戳><随机>`）
- 错误：`{"error":{"code":"","message":"... (request id: ...)","type":"new_api_error"}}`
- 面板 API：`/api/status` 等，信封 `{"success":true,"data":...}`（含 `HeaderNavModules` 配置）
- `/v1/models` 带 `success:true`
- 前端：React（one-api 主题 / New API）
- **New API 有官方 `relay/channel/sub2api/` 渠道类型 → 可以套上游 Sub2API 倒卖**

## CPA (CLIProxyAPI, `router-for-me/CLIProxyAPI`)

- 管理面板单文件 `/management.html`，管理 API `/v0/management/*`（management key）
- 健康检查 `/healthz`
- 无 `/setup/status`、无 `/v1/sub2api/billing`、无 `/api/v1/*`
- 无注册/充值/用户系统——本质是"把自己的订阅账号本地跑代理"，公网中转站若用 CPA 会自己再套一层
- 典型部署：本机/小 VPS，systemd，不需要数据库

## Codex2API (`james-6-23/codex2api`)

- 根路径 302 → `/admin/`（另有 `/key-usage`、`/image-studio`、`/account-portal`）
- 响应头独有：`X-Request-ID: req_<...>`、`X-API-Version: v1`、`X-Codex2API-Affinity-Key`
- 错误：`{"error":{"code":"missing_api_key","message":"Missing Authorization header","type":"authentication_error"}}`
- `/health` → `{"available":0,"status":"ok","total":0}`
- 模型：Codex 订阅账号池，`gpt-5.4`、`gpt-5.4-mini` 等，`/v1/models` OpenAI 风格 `owned_by:"openai"`

## 实测样例（2026-07-31）

### Sub2API 实锤（9 个实例）

pptoken / sui-xiang / anpin / aimzoon / sub.666api / cctk / nagora / unity2 / fastaitoken。均满足 401 + `x-goog-api-key` 文案 + `X-Client-Request-Id`；7 个新版带 billing，2 个旧版（fastaitoken/unity2）billing 404 但 `/setup/status` 命中。

```
$ curl -s -i -X POST https://api.pptoken.cc/v1/messages -H "Content-Type: application/json" \
    -d '{"model":"claude-sonnet-4-5","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}'

HTTP/1.1 401 Unauthorized
X-Client-Request-Id: fc8e3e9c-9655-4308-8d26-8d504d1fb168
{"code":"API_KEY_REQUIRED","message":"API key is required in Authorization header (Bearer scheme), x-api-key header, or x-goog-api-key header"}

$ curl -s -H "Authorization: Bearer sk-invalid" https://api.pptoken.cc/v1/sub2api/billing
{"code":"INVALID_API_KEY","message":"Invalid API key"}

$ curl -s https://api.pptoken.cc/setup/status
{"code":0,"data":{"needs_setup":false,"step":"completed"}}
```

### New API 实锤（code0.ai）

```
HTTP/2 401
x-new-api-version: v1.0.0-rc.22
x-oneapi-request-id: 202607310251377201926528268d9d67HPgoOAV
{"error":{"code":"","message":"Invalid token (request id: 202607310251377201926528268d9d67HPgoOAV)","type":"new_api_error"}}
```

### Codex2API 官方 demo

```
302 → /admin/
401 /v1/models: x-api-supported-versions: v1, x-api-version: v1, x-request-id: req_...
{"error":{"code":"missing_api_key","message":"Missing Authorization header","type":"authentication_error"}}
/health → {"available":0,"status":"ok","total":0}
```

## 源码证据位置

- Sub2API 网关路由：`backend/internal/server/routes/gateway.go`
- Sub2API 鉴权文案与三种 key 头：`backend/internal/server/middleware/api_key_auth.go:49-96`
- Sub2API `X-Client-Request-Id`：`backend/internal/server/middleware/client_request_id.go`
- Sub2API 前端 chunk：`frontend/vite.config.ts:115-148`
- Sub2API 面板信封：`backend/internal/pkg/response/response.go`
- New API：`middleware/request-id.go`、`middleware/utils.go:20-30`、`controller/model.go`
- CPA：`CLIProxyAPI/internal/api/server_routes.go:52`、`server_management.go`
- Codex2API：`main.go:438-462`、`api/errors.go:145-212`
