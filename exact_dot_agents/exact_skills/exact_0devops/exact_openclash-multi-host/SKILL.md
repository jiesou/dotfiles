---
name: openclash-multi-host
description: "Manage OpenClash configurations across a 3-router homelab (wy11/wy100/wy13). Use when: (1) adding/modifying proxy-providers or proxy-groups on any combination of the 3 routers, (2) syncing subscription URLs, filters, overrides across routers, (3) editing /etc/openclash/config/*.yaml on immortalwrt nodes. The 3 routers have DIFFERENT configs — do NOT blindly apply the same change to all."
---

# OpenClash Multi-Host

## 网络拓扑

见 [topology.md](references/topology.md)。

三台 OpenClash 节点配置各不相同，见 [config-diff.md](references/config-diff.md)。

**每次操作前先读 config-diff.md 确认每台要改什么。**

## 工作流

### 工具

`scripts/oc-sync.sh` — 通过 SSH+awk 管道向指定路由器应用 awk 变换。

```bash
# 单台
oc-sync.sh '{awk 程序}' wy11

# 多台（分别指定，因为配置不同）
oc-sync.sh '{wy11 的 awk}' wy11
oc-sync.sh '{wy100 的 awk}' wy100

# 从文件读 awk 程序
oc-sync.sh -f transform.awk wy13

# 全部（仅当 awk 对三台都适用时）
oc-sync.sh '{...}' all
```

### 每个操作的步骤

1. 读 [config-diff.md](references/config-diff.md) 确认三台当前状态
2. 判断每台需要什么具体修改（可能不同）
3. 为每台生成对应的 awk 程序
4. 用 `oc-sync.sh` 逐台或批量应用
5. 重启 OpenClash（或重载配置）使生效

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
