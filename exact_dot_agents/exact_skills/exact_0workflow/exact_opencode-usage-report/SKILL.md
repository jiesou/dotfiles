---
name: opencode-usage-report
description: opencode go token usage report from opencode workspace API.
---

# opencode-usage-report

## Quick start

```bash
# 1. 创建 venv + 安装依赖
uv venv && uv pip install httpx openpyxl

# 2. 从浏览器导出 opencode.ai cookie (Playwright 格式 JSON)
#    await page.context().cookies() → 保存为 cookies.json

# 3. 生成报表
python3 scripts/generate_report.py \
  --cookie-file cookies.json \
  --year 2026 --month 6 \
  --output report.xlsx
```

## How it works

1. Sends RPC POST to `https://opencode.ai/_server` with workspace/month params
2. Parses usage records (date, model, totalCost in µ$) from response
3. Estimates tokens via `total_cost / (ratio * p_in + p_out) × 1e6`
4. Outputs 3-sheet Excel: 费用总览 (pie+bar charts), 每日明细 (stacked bar), 原始数据

## Key details

- `totalCost` unit: microcents (µ¢), `$1 = 100,000,000 µ¢`
- Token estimation uses **effective input price** = `cache_hit_rate × p_cache + (1 − cache_hit_rate) × p_in`, where `cache_hit_rate` defaults to 98.6% (measured from 100 real Flash sessions)
- Token ratio (input:output): 142:1 for Flash, 100:1 for others — adjust `ratio` in `estimate_tokens()` if actual usage differs
- Cookie extraction via Playwright JSON array filters for `opencode.ai` domain cookies
- Pricing table includes `cache` field for each model; if a model lacks cache pricing, pass `p_cache=0.0`
- POST body uses custom RPC format (not seroval). Requires `x-server-id: 15702f3a12ff8bff357f8c2aa154a17e65b746d5f6b96adc9002c86ee0c15205` and `x-server-instance: server-fn:0` headers
- Response is seroval-encoded: `$R["server-fn:N"]` array with `{usage: [...records], keys: [...]}`

## scripts/

- `scripts/generate_report.py` — standalone CLI, run directly

## HTML 可视化报表

除了 Excel，也可以直接生成一个自包含的 HTML 文件，用 Chart.js 渲染堆叠柱状图。

流程：

```bash
# 1. 提取数据到 JSON
python3 scripts/generate_report.py --cookie-file cookies.json --year 2026 --month 6 --output /dev/null \
  | grep -oP '共\s+\d+\s+条记录'  # 验证数据可获取

# 或用 Python 直接 dump：
python3 -c "
import json, re
import httpx
cookies = json.loads(open('cookies.json').read())
cookie_str = '; '.join(f\"{c['name']}={c['value']}\" for c in cookies)
resp = httpx.post('https://opencode.ai/_server', headers={
    'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json',
    'Cookie': cookie_str,
    'x-server-id': '15702f3a12ff8bff357f8c2aa154a17e65b746d5f6b96adc9002c86ee0c15205',
    'x-server-instance': 'server-fn:0',
}, json={'t':{'t':9,'i':0,'l':4,'a':[{'t':1,'s':'WORKSPACE_ID'},{'t':0,'s':2026},{'t':0,'s':6},{'t':1,'s':'+08:00'}],'o':0},'f':31,'m':[]})
pattern = r'(\{date:\"[^\"]+\",model:\"[^\"]+\",totalCost:\d+,keyId:\"[^\"]+\",plan:\"[^\"]+\"\})'
records = [{'date':r.group(1),'model':r.group(2),'cost':int(r.group(3))} for r in re.finditer(pattern, resp.text) for r in [re.search(r'date:\"([^\"]+)\"',r.group()), re.search(r'model:\"([^\"]+)\"',r.group()), re.search(r'totalCost:(\d+)',r.group())]]
json.dump(records, open('usage_data.json','w'))
"

# 2. 生成 HTML（内嵌 Chart.js CDN）
#    代码见 reference/html_report_template.html
#    或直接用已有脚本传入 --html 参数（如果用 Python 生成）
```

HTML 报表特点：

- **堆叠柱状图**：每天一根柱子，各模型按颜色堆叠
- **两种计量单位**：USD 费用 或 Token 数（通过定价表 + 98.6% 缓存命中率反推）
- **自包含**：单文件，无外部依赖（Chart.js 走 CDN）
- **暗色主题**，hover tooltip 显示明细

Token 反推公式（JavaScript）：
```js
function estimateTokens(costUsd, model) {
  const p = PRICING[model] || { in: 1.0, out: 2.0, cache: 0.0 };
  const ratio = model === 'deepseek-v4-flash' ? 142 : 100;
  const effIn = 0.986 * p.cache + 0.014 * p.in;
  const outTokens = costUsd * 1_000_000 / (ratio * effIn + p.out);
  return Math.round(outTokens * (ratio + 1));
}
```

定价表（PRICING）和颜色表（COLORS）需手动维护，新增模型时同步更新。
