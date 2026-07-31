---
name: relay-panel-forensics
description: "判断 AI API 中转站（relay/proxy station）底层使用的面板/源头：Sub2API vs New API vs One API vs CPA vs Codex2API vs 自研。用无 key 的公开 API 探测即可判定号商直营还是聚合倒卖。Use when auditing or vetting an AI API relay station (ChatGPT/Claude/Gemini API proxy), verifying whether a 中转站 is subscription-based (Sub2API 号商直营) or aggregated reseller (New API 套娃), or researching relay panel fingerprints."
---

# Relay Panel Forensics — 中转站面板/源头审计

## 快速判定

对目标站发一个无 key 的 `POST /v1/messages`（或 `GET /v1/models`）：

| 观测结果 | 结论 |
|---|---|
| 401 + `"x-goog-api-key header"` 文案 + `X-Client-Request-Id` 头 | **Sub2API**（号商直营概率极高） |
| `X-Oneapi-Request-Id` 头 + `new_api_error`/`api_error` 错误 | **New API / One API**（聚合倒卖） |
| 根路径 302→`/admin/` + `X-API-Version` 头 | **Codex2API** |
| `/v0/management/` 或 `/management.html` 存在 | **CPA (CLIProxyAPI)** |
| 独立 CDN + 自研前端 + 全路径 SPA fallback | **自研面板** |

## 完整探测流程

### Step 0 — 前端弱指纹（辅助）

```bash
curl -s $TARGET/ | grep -oE '(src|href)="[^"]*\.(js|css)[^"]*"'
curl -s $TARGET/ | grep -oE '<title>[^<]*</title>'
```

- JS chunk 含 `vendor-vue-*`/`vendor-i18n-*`/`vendor-misc-*` → **Sub2API 强指纹**（源码 `vite.config.ts` 硬编码，别的面板不撞）
- JS 含 `vendor-react-*` / `_next/static/` → 自研 React / Next.js 前端，需看 API 层
- `<title>New API</title>` / `X-Oneapi-Request-Id` → New API 系

### Step 1 — 无 key 探测（核心，公开无副作用）

```bash
# 最强指纹：鉴权文案（Sub2API 源码独有 x-goog-api-key）
curl -s -i -X POST $TARGET/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-5","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}'

curl -s -i $TARGET/v1/models
```

- `{"code":"API_KEY_REQUIRED","message":"...x-goog-api-key header"}` → **Sub2API**
- `{"error":{"code":"","message":"... (request id: ...)","type":"new_api_error"}}` → **New API**
- 响应头 `X-Oneapi-Request-Id` → New API 系；`X-Client-Request-Id`(uuid) → Sub2API 系

### Step 2 — Sub2API 独有端点

```bash
curl -s $TARGET/setup/status
curl -s -H "Authorization: Bearer sk-invalid" $TARGET/v1/sub2api/billing
curl -s $TARGET/health
```

- `/setup/status` → `{"code":0,"data":{"needs_setup":false,"step":"completed"}}` → **Sub2API（全版本）**
- `/v1/sub2api/billing` → `{"code":"INVALID_API_KEY",...}` → **Sub2API 新版**；`404 page not found` + `/setup/status` 命中 → **旧版**（该端点是后加的）
- `/health` = `{"status":"ok"}` → Sub2API；`{"available":0,"status":"ok","total":0}` → Codex2API；`/healthz` → CPA

### Step 3 — 套娃检测

- 只有 `/api/status`（New API 面板）没有 `/api/v1/*` → 外层 New API，可能套了上游 Sub2API 倒卖
- `/setup/status` 透传存在 → 底层就是 Sub2API
- 报错出现**多个 request id** → 套娃中转（中间商赚差价），最高见过套 8 层

## 判定要点

1. **别只看 UI**：标题/logo/文案都能自定义（实测有站把鉴权文案改成客服 QQ）。看 API 层硬指纹。
2. **Sub2API = 号商直营**：为自持订阅账号（Plus/Pro/Claude/Gemini coding plan）逆向设计，用它的基本自己就是号商，不易遇到倒卖。
3. **New API 可套 Sub2API**：New API 有官方 `sub2api` 渠道类型，能挂上游 Sub2API 的 key 倒卖。判定"源头"看底层（`/setup/status` 是否透传）。
4. **边界**：Sub2API `RUN_MODE=simple` 会禁用部分端点；billing 在旧版/simple 模式 404。
5. **安全提示**：CISPA 实测 45.83% 中转站模型调包、17/428 窃取 AWS 密钥。选标注渠道来源（Pro号池/Plus号池）的站，小额多次充值。

## 参考

详见 `references/fingerprints.md`：各面板完整指纹清单、源码证据位置、实测样例（真实 Sub2API 与 New API 响应原文对比）。
