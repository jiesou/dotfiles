# 网络拓扑

## 私网互联

```
我的 PC (linux 桌面)
  └─ 192.168.11.192

本地单臂无公网路由器 (immortalwrt)    ← 3 个 OpenClash 节点之一
  └─ eth0: 192.168.11.1

hp-server (ubuntu server)
  ├─ eno1: 192.168.11.131
  └─ eno2: 10.55.225.235

公司大内网路由 (不可控)
  └─ 10.55.2.1

eduGateway (immortalwrt)
  ├─ 10.55.2.118
  └─ 192.168.100.100

外部公网拨号路由器 (immortalwrt)      ← 3 个 OpenClash 节点之一
  ├─ DHCP server: 192.168.100.1
  └─ PPPoE 出口

13 网段路由器 (immortalwrt)           ← 3 个 OpenClash 节点之一
  └─ 192.168.13.1
```

11/100/13 三网段通过各类穿透已互通。

## 三台 OpenClash 节点

| 代号 | SSH 地址 | 端口 | 配置文件 | 系统 |
|------|----------|------|----------|------|
| wy11 | root@192.168.11.1 | 22 | `/etc/openclash/config/wscmixed.yaml` | immortalwrt |
| wy100 | root@192.168.100.1 | 23333 | `/etc/openclash/config/wscmixed.yaml` | immortalwrt |
| wy13 | root@192.168.13.1 | 22 | `/etc/openclash/config/config.yaml` | immortalwrt |

三台均无 python，只有 busybox 自带的 awk 和 sed。

## 三台配置差异要点

见 [config-diff.md](references/config-diff.md)。
