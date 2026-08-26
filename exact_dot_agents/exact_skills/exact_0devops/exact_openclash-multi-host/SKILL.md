---
name: openclash-multi-host
description: "Manage OpenClash persistent config across 3 routers (inno11/wy100/wsc13). Use when: syncing subscription URLs, filters, config across routers. Do NOT use when: perform live operations such as changing nodes (you need clash api operation skill). The 3 routers have DIFFERENT configs — do NOT blindly apply the same change to all."
disable-model-invocation: true
---

# OpenClash Multi-Host

## 网络拓扑、Routers IP

轻量拓扑和设备 IP 连接配置信息见 [topology.md](references/topology.md)。

> 亦须阅读 network-management SKILL 中所包含的完整拓扑

三台 OpenClash 节点配置各不相同，见 [config-diff.md](references/config-diff.md)。

**每次操作前先读 config-diff.md 确认每台要改什么。**

## 工作流

### 工具

`scripts/oc-sync.sh` — 通过 SSH+awk 管道向指定路由器应用 awk 变换。

```bash
# 单台
oc-sync.sh '{awk 程序}' inno11

# 多台（分别指定，因为配置不同）
oc-sync.sh '{inno11 的 awk}' inno11
oc-sync.sh '{wy100 的 awk}' wy100

# 从文件读 awk 程序
oc-sync.sh -f transform.awk wsc13

# 全部（仅当 awk 对三台都适用时）
oc-sync.sh '{...}' all
```

`scripts/add-category-ai.awk` — 往 rule-providers 加 `category-ai-!cn` 并插入对应 RULE-SET。**非幂等**：已应用到三台，不要重复运行，否则会重复插入。

### 每个操作的步骤（严格遵守）

1. **读** [config-diff.md](references/config-diff.md) 确认三台当前状态
2. **判断** 每台需要什么具体修改（可能不同）
3. **改前校验** — 用 mihomo core 验证原配置合法性，作为基线：
   ```bash
   ssh root@192.168.11.1 '/etc/openclash/core/clash_meta -t -f /etc/openclash/config/wscmixed.yaml'
   ssh -p 23333 root@192.168.100.1 '/etc/openclash/core/clash_meta -t -f /etc/openclash/config/wscmixed.yaml'
   ssh root@192.168.13.1 '/etc/openclash/core/clash_meta -t -f /etc/openclash/config/config.yaml'
   ```
   如有预存错误，记录下来，确认它们**不是本次修改引入的**。
4. **生成** 为每台对应的 awk 程序
5. **应用** — 用 `oc-sync.sh` 逐台或批量执行
6. **改后复核（肉眼）** — 确认只改了目标行，没有误伤周围内容：
   ```bash
   # 在对应行号附近 grep 确认
   ssh root@192.168.11.1 "grep -n '相关关键字' /etc/openclash/config/wscmixed.yaml"
   ```
7. **改后校验** — 再次用 mihomo `-t` 验证配置，确认**没有新增错误**：
   ```bash
   ssh root@192.168.11.1 '/etc/openclash/core/clash_meta -t -f /etc/openclash/config/wscmixed.yaml'
   ```
   - 如果报错和改前**完全一致**（相同错误、相同行号）→ 安全
   - 如果出现**新错误** → 立即回滚，排查问题
8. **询问用户是否需要重启 OpenClash** — 一台一台逐步重启，核对正常再处理下一台，不要同时重启多台，避免全部失联后无处登入排查。

## 常用 awk 编辑模式

目标文件都是 YAML，用缩进 2 空格。所有 router 都是 busybox awk。

### 在 proxy-providers 中添加 provider

在 `特价机场-1T` 块末尾（`exclude-filter` 行后）插入新 provider：

```awk
/    exclude-filter: "邀请|官网|群组"/ {
    print
    print "  新机场名:"
    print "    type: http"
    print "    interval: 7200"
    print "    path: ./proxy_provider/新机场名.yaml"
    print "    url: \"订阅URL\""
    print "    health-check: { \"enable\": true, \"interval\": 600, lazy: false, \"url\": \"https://www.gstatic.com/generate_204\" }"
    next
}
{ print }
```

### 在 proxy-group 的 use 列表添加 provider

定位到特定 group 块，在 `一元机场` 行后插入：

```awk
/^  - name: "CommonProxy"$/ { in_cp = 1 }
/^  - name: "/ && !/^  - name: "CommonProxy"$/ { in_cp = 0 }
in_cp && /      - "一元机场"/ {
    print
    print "      - \"特价机场wy\""
    next
}
{ print }
```

### 注释/取消注释 provider

注释掉一整个块（从 `名称:` 到下一个顶层 key）：

```awk
/^  老机场:/ { commented = 1 }
commented && /^  [^ ]/ && !/^  老机场:/ { commented = 0 }
commented { print "#" $0; next }
{ print }
```

### 修改 override / filter

```awk
/^  - name: "CommonProxy"$/ { in_cp = 1 }
/^  - name: "/ && !/^  - name: "CommonProxy"$/ { in_cp = 0 }
in_cp && /    filter:/ {
    print "    filter: \"新filter正则\""
    next
}
```

### 条件排除（exclude-filter）

```awk
/    url:.*特定token/ { found=1 }
found && /    exclude-filter:/ {
    print "    exclude-filter: \"到期|剩余|官网\""
    found=0
    next
}
found && /^  [^ ]/ { found=0 }
{ print }
```

## 注意事项

- **配置不同**：三台 CommonProxy 的 use 列表不同，LoadProxy 也不同。不要假设某 provider 在某台存在。
- **busybox awk**：不支持 `-i inplace`，必须写 temp file 再 mv。`oc-sync.sh` 已处理。
- **YAML 缩进严格**：awk 插入行必须保持 2 空格缩进对齐。
- **已知预存警告**：`clash_meta -t` 会输出 `[Smart] Transform parsing errors: feature index 27/28/29 out of range`，三台都有且改前就存在，是 smart 模型 feature 数与 `policy-priority`/filter 不匹配导致，**非本次修改引入**，可忽略。改后校验只对比是否出现**新**错误。
