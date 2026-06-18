---
name: network-management
description: Network topology, SSH access, routing, OpenClash config for all routers and subnets.
---

## HytronHK 香港 VPS

| 属性 | 值 |
|------|-----|
| 地址 | `hytron-hk.qqo.pp.ua` |
| 用户 | root |
| 密码 | Vhqm-axmc-W41w-hJ8t-RqB3 |
| 系统 | Ubuntu 24.04 |
| IP | 45.207.152.77 |
| ASN | AS151407 / AS202662 Hytron Network Services Limited (Akile LTD 下游) |
| 用途 | Trojan+Shadowsocks 代理落地 (sing-box) |
| DNS 解锁 | AKDNS 已配置 (`166.0.199.207`)，使用 `akile-network/aktools` 脚本一键安装 |

# 网络管理

## 操作原则

- **长程 SSH 任务全都用 tmux 执行**（每个 ssh 连接必须独立 `tmux_create_session`）。
- 不要直接用 bash tool 在宿主机操作。

## 三条宽带

| 出口路由器 | ISP | 带宽 | 备注 |
|-----------|-----|------|------|
| 192.168.100.1 | 联通 | 300M | 学校,WY信息中心  ImmortalWrt，直连 PPPoE |
| 192.168.11.1 | 电信 | 50M, 上行 10M | 学校,实验室独立 ImmortalWrt，没改桥接，光猫拨号 |
| 192.168.13.1 | 移动 | 1000M | WSC家 pveImmortalWrt，直连 PPPoE |

## 拓扑总览

```
Internet
    │
    ├── 联通 300M(学校,WY信息中心) — [PPPoE] 192.168.100.1 i5 小主机 (ImmortalWrt)
    │   └── SSH 端口 23333
    │        │
    │        └── 192.168.100.100 — J1900 (eduGatewayImmortalWrt)
    |            EasyTier: 10.144.100.100/24
    │            10.55.2.118 ←→ 校园大内网 10.55.2.1 (不可控)
    │                    │
    │            10.55.225.235 — hp-server (Ubuntu Server)
    │            192.168.11.131
    │                    │
    │                    │
    │                    ▼
    ├── 电信 50M(学校,实验室) — [没改桥接] 192.168.11.1 — NanoPi R2S 路由器 (ImmortalWrt)
    │                    │
    │                    ├── 192.168.11.192 — chenPC (Fedora Bluefin)
    │                    │   └── DHCP 模式 → 默认走 11.1 (电信)
    │                    │   └── GRE 模式 → 切 hp-server 网关走 100.1 (联通)
    │                    └── EasyTier: 10.144.11.1/24
    │                         │
    │                    ─ ─ ─ ─ ─ ─ ─ ─ ─  (EasyTier 子网 VPN)
    │                         │
    ├── 移动 1000M(WSC家) — [PPPoE] 外部公网拨号路由器 (pveImmortalWrt) 
    │   192.168.13.1 (LAN / br-lan)
    │   EasyTier: 10.144.13.1/24
    │        │
    │        └── 192.168.13.101 — PVE Ubuntu LXC / CasaOS
    │             Docker 网络 172.18.0.0/16
    │               └── Hermes 容器 172.18.0.2
    │             Docker 网络 172.17.0.0/16
    │               ├── aria2
    │               ├── openlist
    │               ├── rustdesk-server
    │               └── ...
    │
    ├──── (13.x ←→ 11.x 通过 EasyTier 覆盖网络 — 10.144.x.x/24，跨越物理位置)
    ├──── (13.x ←→ 100.x 通过 EasyTier P2P 打洞，绕过 11.1 的 50M 电信)
    └──── (192.168.11.131/10.55.225.235 ←→ 10.55.2.118，跨越物理位置)
```

## 网段细节

### 192.168.1.0/24 — 学校,实验室,电信50M光猫下游

| 设备 | IP | 角色 |
| -------------- | -------- | -------- |
| 电信光猫 | 192.168.1.1 | 光猫拨号，提供 WAN 出口和 DHCP |
| QKJ 白色方盒子硬路由  | 192.168.1.2 | QKJ TL-RAC1950G 易展版，普通硬路由 |
| QKJ 飞牛台式机 | 192.168.1.5 | QKJ 飞牛 NAS |
| NanoPi R2S (主路由) | 192.168.1.6 | ImmortalWrt WAN 侧，NAT 到 192.168.11.0/24 |
| wy TPLINK 硬路由 | 192.168.1.8 | 硬路由，NAT 到 192.168.2.0/24 |

- 电信光猫假超管页面：http://192.168.1.1:8080/start.ghtml，用普通账号登录即可有部分超管功能。
- QKJ 白色方盒子硬路由 提供 WiFi：
  - 提供 `CMCC-SDyb`（2.4G）和 `CMCC-SprF`（5G）WiFi

### 192.168.11.0/24 — 学校,实验室

| 设备 | IP | 角色 |
| -------------- | -------------- | ---------------------------------------------- |
| NanoPi R2S 路由器 | 192.168.11.1 | ImmortalWrt, DHCP 服务器, OpenClash fake-IP, EasyTier 10.144.11.1/24 |
| chenpc.lan | 192.168.11.192 | Fedora Bluefin Linux 桌面 |
| hp-server.lan | 192.168.11.131 | Ubuntu Server (双网卡: 同时有 10.55.225.235) |
| 360T5G-BCA2.lan | 192.168.11.118 | 360 T5G 硬路由 |
| R7000-E772.lan | 192.168.11.843 | Netgear 网件 R7000 路由器，Merlin |
| BatteryAngle-81a518.lan | 192.168.11.120 | 贴片机厂房排风扇的智能插座 |

- 此网段网络设施的 IP 基本都通过 R2S 的 DHCP Server 设置了静态

#### 学校,实验室 内的网络设施细节

##### 网是怎么连的？

- NanoPi R2S 作为主路由，提供光猫下 192.168.1.6 到 192.168.11.0 的 NAT
- 360T5G-BCA2.lan 仅提供 WiFi：设置为 AP 模式，不额外带 NAT
  - 提供 `TP-LINK-AC1900` 和 `TP-LINK-AC1900-5G` WiFi
    - WiFi SSID 叫作“TP-LINK”是 **历史遗留** ，设备实际上就是 360 硬路由
  - 两路 LAN
    - 一路给 网件R7000 提供给学生用
    - 一路走到楼上再走下来，给瑞捷 YS110G 交换机 提供给老师用
- R7000-E772.lan 仅作为交换机使用：设置为 AP 模式，不额外带 NAT，同时还把 WiFi 无线 功能关掉了
  - 没有多的千兆交换机了，“AC1900”级别的路由器却有很多，于是将路由器关掉无线，当作纯交换机了，还附带 Merlin 丰富的网管功能
  - R7000-E772.lan 下游主线分两路
    - 一路直接提供给 实验室里面 几台电脑
    - 一路通过长长的白色网线走出来 连接到 D-Link 友讯 DES-1024R+ 24 口的百兆 大交换机上
      - 提供给 实验室外面 两台电脑
      - 也迂回去，提供给 实验室里面 的几台电脑（提供更多网口）
      - hp-server 物理上也是连接在这里的

> 友讯 百兆 大交换机 是网络瓶颈，别的地方都是千兆了。
> 十块钱买个千兆小交换机 菊花链上 即可给实验室外面的两个电脑提供千兆，也可给 hp-server 提供千兆

##### 关于其他线路

- 黑色大的 wy TPLINK 硬路由 (192.168.1.8) 和 NanoPi R2S (192.168.1.6) 是兄弟设备
- 192.168.1.8 作为路由和 WiFi，下游网段 2.x，提供光猫下 192.168.1.8 到 192.168.2.0 的 NAT
  - 提供 `TP-LINK_wy` 和 `TP-LINK-5` WiFi
  - `TP-LINK_wy` 和 `TP-LINK-5` SSID 看上去是两个不相干的网络，实际上就是同一个网络的 2.4G 和 5G，是 **历史遗留**

实验室 WAN 默认走电信 50M
在 NanoPi R2S 坏的情况下：
  - 替代路径（电信 50M）: → `TP-LINK_wy` WiFi → 电信 50M

在电信 50M 坏的情况下：
  - 替代路径（专线）: → hp-server(11.131) → 校园网 → eduGateway → 100.1 (联通 300M)
  - 替代路径（校园网）: → hp-server(11.131) → 校园网

##### 关于贴片机厂房排风扇的智能插座

开放接口可以开关，通过：
```
curl 'http://192.168.11.120/api/set_relay_switch' -H 'Content-Type: application/json' --data-raw '{"relay_switch":true}'
```
true 即开启， false 即断电

- NanoPi R2S 上通过 cron 实现了排风扇的定时开关，详阅 http://192.168.11.1/cgi-bin/luci/admin/system/crontab
- 也提供一个网页面板，直接访问 http://192.168.11.120 即可
  - 贴片机厂房内 WiFi 信号很差，网页很慢，可能需要耐心等待一分钟以上！晚上不行就早上试！
  - 直接使用 http 接口更轻更快
- 会提供一个 mDNS，可以 ArduinoOTA（小心不要 OTA 坏了）
- 硬件是修改了 https://oshwhub.com/oldfox126/xin-guo-biao-wu-kong-ji-liang-cha-zuo-10a

### 192.168.13.0/24 — WSC家

| 设备 | IP | 角色 |
| -------------- | -------------- | ------------------------------------------------------- |
| pveImmortalWrt | 192.168.13.1 | ImmortalWrt, PPPoE 出口, DHCP 服务器, OpenClash fake-IP, EasyTier 10.144.13.1/24 |
| PVE LXC 容器 | 192.168.13.101 | CasaOS + Docker |

### 10.55.0.0/16 — 校园大内网

| 设备 | IP | 角色 |
|--------|-----|------|
| 校园大内网路由 | 10.55.2.1 | 不可控的上游路由器 |
| hp-server | 10.55.225.235 | 从 11.x LAN 双网卡接入 |
| eduGateway | 10.55.2.118 | ImmortalWrt，桥接到 192.168.100.x |

### 192.168.100.0/24 — 学校,WY信息中心 外部路由器网段

| 设备 | IP | 角色 |
| ---------- | --------------- | ------------------------------------------------------- |
| 外部公网拨号路由器 | 192.168.100.1 | ImmortalWrt, PPPoE 出口, DHCP 服务器, OpenClash fake-IP |
| eduGateway | 192.168.100.100 | ImmortalWrt，外部路由器前的终端节点，EasyTier 10.144.100.100/24 |

## 关键路径

### 13.x → 11.192：EasyTier LPM + GRE（绕过 50M 电信）

100.100 通过 EasyTier 宣告 `192.168.11.192/32`（LPM 优先于 11.1 的 `/24`），13.1 自动将 11.192 流量发往 100.100：

```
13.1 → EasyTier P2P → 100.100 → GRE (gre4-innogre, 172.16.69.0/30) → hp-server → 11.192
```

回程：

```
11.192 → 11.131 (chenPC 静态路由: 10.144.0.0/16 via 11.131) → GRE → 100.100 → EasyTier → 13.1
```

### chenPC 互联网出口

| 模式 | 路径 |
|------|------|
| DHCP (默认) | 11.192 → 11.1 → 电信 50M |
| GRE 隧道 | 11.192 → hp-server → 校园网 10.55.2.1 → eduGateway → 100.1 → 联通 300M |

## chenPC NetworkManager 配置

chenPC 上有三个有线配置文件，均绑定 enp9s0：

| 配置名 | 方法 | IP | 网关 | DNS | 出口 |
|--------|------|------|-----|------|-----|------|
| 有线连接 DHCP | DHCP (auto) | DHCP 分配 | 192.168.11.1 (11.1) | 11.1 分配 | 电信 50M |
| WY UNICOM GRE 隧道 | Manual | 192.168.11.192/24 | 192.168.11.131 (hp-server) | 192.168.100.1 | 联通 300M |
| 校园网 DIRECT | Manual | 10.55.225.235/24 | 10.55.225.1 | 223.5.5.5 | 校园内网直连，无物理连接，仅在需要时调试使用 |

### DHCP 模式静态路由

两条静态路由（`nmcli con show "有线连接 DHCP"` 的 `ipv4.routes`），都是**基础设施路由**——不管 chenPC 走哪个出口，始终必需：

| 路由 | 下一跳 | 用途 | 性质 |
|------|-------|------|------|
| `172.16.69.0/30` | `192.168.11.131` (hp-server) | GRE 隧道点对点子网，隧道保活 | 双向可达 |
| `10.144.0.0/16` | `192.168.11.131` (hp-server) | EasyTier 虚拟网段回程，走 GRE → 100.100 P2P → 13.1，绕过 50M 电信瓶颈 | 回程锚点 |

**设计意图：**
- `172.16.69.0/30` 和 `10.144.0.0/16 via 11.131` 放在 DHCP 配置而非 "WY UNICOM GRE 隧道" 里，因为 GRE 隧道是双向基础设施——13.x 回程无论 chenPC 用哪个出口都走这条路径。放在 GRE 配置里的话，切回 DHCP 模式时这些路由会被撤销，回程就断了。
- **核心目的**：DHCP 模式下 EasyTier 仍可用，使 `10.144.100.100`（eduGateway）能通过回程路径 P2P 直通 `192.168.11.192`。
- `10.144.0.0/16` 精确覆盖 EasyTier 虚拟网段 `10.144.0.0/16`，且不干扰 `10.55.0.0/16` 校园网路由。

## 管理密码/密钥

SSH 均可直接通过密钥接入以下设备：

| 设备                     | 地址                      | 端口    | 密码             | 系统             |
| ----------------------- | ----------------------- | ----- | -------------- | -------------- |
| NanoPi R2S              | `root@192.168.11.1`     | 22    | `vM4*2kQY`       | ImmortalWrt    |
| hp-server               | `ubuntu@192.168.11.131` | 22    | sudo 密码 12345678 | Ubuntu Server  |
| chenPC                  | `chen@chenpc.lan`       | 22    | -              | Fedora/Bluefin |
| eduGateway              | `root@192.168.100.100`  | 22    | `12345678`       | ImmortalWrt    |
| WY信息中心 外部路由器      | `root@192.168.100.1`    | 23333 | `12345678`       | ImmortalWrt    |
| pveImmortalWrt          | `root@192.168.13.1`     | 22    | -              | ImmortalWrt    |
| PVE Ubuntu LXC / CasaOS | `root@192.168.13.101`   | 22    | -              | Ubuntu Server  |

统一使用 `servers_id_jiesou_ed25519` 密钥，使用 `ssh-copy-id` 拷贝到所有服务器上
一般均使用 SSH 密钥认证，不需要密码。

其他各种密码：

| 设备 | 密码 |
| ----- | ---- |
| 电信光猫 (192.168.1.1) | 用户 useradmin 密码 Lenovo2366 |
| 360T5G-BCA2.lan (192.168.11.118) | 用户 admin 密码 12345678 |
| R7000-E772.lan (192.168.11.843) | 用户 admin/root 密码 12345678 |
| WiFi: TP-LINK-AC1900 | `2QiA74UZ` |
| WiFi: TP-LINK-AC1900-5G | `2QiA74UZ` |
| 黑色大的 wy TPLINK 硬路由 (192.168.2.1) | 管理密码 Lenovo2366 |
| WiFi: TP-LINK_wy | `Innovation` |
| WiFi: TP-LINK_5 | `Lenovo2366` |
| QKJ 白色方盒子硬路由 (192.168.1.2) | 用户 admin 密码 uAw6WZ5D |
| WiFi: CMCC-SDyb | `2QiA74UZ` |
| WiFi: CMCC-SprF | `2QiA74UZ` |

## OpenClash 配置

- 所有路由器都运行 OpenClash **fake-IP 模式+nftables TProxy 透明代理**。
- 通过 clash 内核内的 SRC-IP-CIDR 规则分流，以及 OpenClash 基于 nftables 的“来源流量访问控制”功能，实现部分设备走科学，部分设备不走科学。
- OpenClash 通常都设置了 **定时重启** ，每天早上 6:00。
- OpenClash 主要只用一个 .yaml 配置，将各种机场、自建节点混到一个配置文件里使用，也方便设置自己的规则和 DNS。

### 配置文件约定

同步/修改 OpenClash 配置时，始终编辑当前活跃的配置文件：

| 路由器 | 活跃配置 |
|--------|--------------|
| 192.168.11.1 | `/etc/openclash/config/wscmixed.yaml` |
| 192.168.13.1 | `/etc/openclash/config/config.yaml` |
| 192.168.100.1 | `/etc/openclash/config/wscmixed.yaml` |

**重要：** 各路由器的 OpenClash 设置独立 — DNS 配置尤其不同。不要盲目复制配置，要先检查差异，只应用 diff。

### 修改配置

```bash
# 11.1 (本地 ARM 路由器)
ssh root@192.168.11.1 'vim /etc/openclash/config/wscmixed.yaml'
# 然后重启
ssh root@192.168.11.1 '/etc/init.d/openclash restart'

# 13.1 (pveImmortalWrt)
ssh root@192.168.13.1 'vim /etc/openclash/config/config.yaml'
# 然后重启
ssh root@192.168.13.1 '/etc/init.d/openclash restart'
```

## 故障排除直接流程

1. 实验室内完全连不上网，检查电信光猫是否“光信号闪红灯”，如果是，则是运营商的问题，打师傅电话修光纤了
 - 修光纤的期间，可以见 #关于其他线路 章节，切换其他线路
2. 如果不是运营商的问题，重启（直接拔电插电）NanoPi R2S 能解决 99% 的问题
3. 如果 R2S 不可恢复，用 `TP-LINK_wy` 和 `TP-LINK-5` WiFi 即可，见 #关于其他线路 章节
4. 如果 运营商问题 和 R2S故障 叠加，可以将终端设备默认网关指向 192.168.11.131，通过二层网络转发，出口走WY信息中心联通300M网络，见 #关于其他线路 章节
5. **重要：** 绝大多数问题和 openclash/mihomo **无关** ，不要绕弯路去研究 openclash

## 验证命令

```bash
# 检查路由器上 OpenClash 状态
ssh root@<路由器IP> 'ps | grep clash | grep -v grep; uci show openclash | grep -E "enabled|mode"'

# 列出 OpenClash 配置
ssh root@<路由器IP> 'ls -la /etc/openclash/config/'

# 检查网络接口
ssh root@<路由器IP> 'ip -4 addr show | grep inet | grep -v 127.0.0.1'

# 检查路由表
ssh root@<路由器IP> 'ip route show'

# 检查 EasyTier 状态
ssh root@<路由器IP> 'ps | grep easytier | grep -v grep; ip addr show tun0'

# 检查 EasyTier 路由表
ssh root@<路由器IP> 'easytier-cli route'

# 检查 EasyTier peers
ssh root@<路由器IP> 'easytier-cli peer'

# 测试 13.1 → 11.192 连通性
ssh root@192.168.13.1 'ping -c 5 192.168.11.192; traceroute -n 192.168.11.192'

# 测试 100.100 → 11.192
ssh root@192.168.100.100 'ping -c 5 192.168.11.192'

# 查看 100.100 的 EasyTier proxy_network
ssh root@192.168.100.100 'uci get easytier.@easytier[0].proxy_network'

# 查看 hp-server 的 netplan 路由
ssh ubuntu@192.168.11.131 'ip route show | grep 10.0.0.0'

# 查看 chenPC 静态路由
ssh chen@192.168.11.192 'ip route show | grep "proto static"'

# 查看 11.1 conntrack invalid drop 计数
ssh root@192.168.11.1 'nft list ruleset | grep "invalid.*drop"'
```
