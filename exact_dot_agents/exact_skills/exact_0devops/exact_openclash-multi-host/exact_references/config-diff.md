# 三台 OpenClash 配置差异

> 只记录**不一致**的地方；三台一致的部分统一写在「公共部分」，不在逐台差异中重复。

## 公共部分（三台一致）

- `proxy-providers`: 都有 `local_Servers`(file)、`特价机场-1T`、`特价机场wy`、`赔钱机场`、`一元机场`、`猫猫互联`(http)
- `rule-providers`: 除 inno11 额外有 `premiumip`（inline，见下）外完全一致
- `sniffer` / `dns`: 结构一致（nameserver IP 因运营商不同有差异）
- `CommonProxy` 结构: type smart、`uselightgbm: true`、`prefer-asn: true`、`policy-priority: "Hytron HK direct:0.5;ByteVirt HK direct:0.5"`、tolerance 100、interval 600、exclude-filter `(?<!\\.)[1-9][0-9]*倍`
- `CommonProxy USA`: use `local_Servers`, `特价机场-1T`, `赔钱机场`；filter `US|us|美国|🇺🇸`；tolerance 100
- `LoadProxy`: type load-balance、strategy round-robin、tolerance 100、exclude-filter 一致
- `CommonProxy w/o HK` / `Dialer`: type smart、uselightgbm 一致；`CommonProxy w/o HK` 有 exclude-filter，`Dialer` 无
- `SelectProxy` / `SpecificProxy`: select + include-all

## 逐台差异

### inno11 (192.168.11.1, wscmixed.yaml)

| 项目 | 特征 |
|------|------|
| **CommonProxy use** | `特价机场-1T`, `赔钱机场`, `一元机场`, `特价机场wy`（**无** `local_Servers`）|
| **CommonProxy filter** | **无** `ByteVirt`（wy100/wsc13 有）|
| **CommonProxy USA** | 有 `prefer-asn: true`（wy100/wsc13 无）|
| **CommonProxy w/o HK** | use 含 `赔钱机场`；filter 用 `US`（大写，其余用 `us`）|
| **LoadProxy use** | `特价机场-1T`, `赔钱机场`（wy100/wsc13 为 `local_Servers`, `特价机场-1T`, `一元机场`）|
| **Dialer** | 有 `prefer-asn`；use 含 `特价机场wy`；有 `猫猫互联SAVE` proxy |
| **特有 group** | `Premium`、`PremiumDomesticSites`、`WYUnicom`、`猫猫互联SAVE`、`赔钱机场SAVE` |
| **DomesticSites** | proxies 含 `WYUnicom`（wy100/wsc13 只有 `DIRECT`, `Default`）|
| **listeners** | **无**（wy100/wsc13 有 `ss-in`/`trojan-in` 回家监听）|
| **sub-rules** | 有 `premium` 子规则 |
| **特殊 rule** | `IP-CIDR,192.168.100.0/24,WYUnicom`、`SUB-RULE,(RULE-SET,premiumip),premium` |
| **fake-IP 覆盖规则** | 主 rules 在 `privateip` 前加 `IP-CIDR,198.18.0.0/15,Default` + `IP-CIDR6,fdfe:dcba:9876::/64,Default`；premium 子规则同样两段→`Premium`（2026-09-17 加，备份 `wscmixed.yaml.bak-20260917-fakeoverride`，RUN/API/日志已确认命中）|
| **Fake-IP 池** | v4 `198.18.0.1/15`；v6 UCI `fakeip_range6='0'`（未启用，RUN 无 `fake-ip-range6`，与 wy100 不一致，待定）|
| **china_ip6_route** | `0`（关闭，国内 v6 也经联通走；2026-09-17 由 1 改为 0）|
| **DNS 劫持** | `enable_redirect_dns='1'`（dnsmasq 转发）|
| **LAN RA** | `dhcp.lan.ra_default='1'`（2026-09-17 加）|
| **premiumip** | 有内嵌 IP 列表（SRC-IP-CIDR，变动频繁，以实际文件为准）|
| **DNS** | `61.153.81.74`, `202.96.104.17`, `202.96.104.15`（慈溪电信）+ `221.12.33.227`, `221.12.1.227`（宁波联通）|
| **Tailscale** | 有规则 |

### wy100 (192.168.100.1:23333, wscmixed.yaml)

| 项目 | 特征 |
|------|------|
| **CommonProxy use** | `local_Servers`, `特价机场-1T`, `一元机场`, `特价机场wy`（**无** `赔钱机场`）|
| **CommonProxy w/o HK use** | `local_Servers`, `特价机场-1T`, `一元机场` |
| **LoadProxy use** | `local_Servers`, `特价机场-1T`, `一元机场` |
| **Dialer use** | `local_Servers`, `特价机场-1T`, `一元机场`（**无** `猫猫互联SAVE` proxy）|
| **listeners** | 有 `ss-in`/`trojan-in` 回家监听（inno11 无）|
| **特有 group** | 无 Premium/PremiumDomesticSites/WYUnicom/猫猫互联SAVE/赔钱机场SAVE |
| **sub-rules** | 无 |
| **premiumip** | 无 |
| **DNS** | `221.12.33.227`, `221.12.1.227`（仅联通）|
| **DNS 劫持** | `enable_redirect_dns='2'`（防火墙重定向，白名单模式要求）|
| **china_ip6_route** | `1`（绕过大陆）|
| **Fake-IP 池** | v4 `198.18.0.1/15`；v6 UCI `fakeip_range6='fdfe:dcba:9876::1/64'`（RUN 有 `fake-ip-range6`，与 inno11 不一致，待定）|
| **白名单** | `lan_ac_white_ips`: `192.168.100.100/68/98` + edu eth1 双栈 `fd71…40c5`、`2408:8340:2841:d300…40c5`（2026-09-17 删旧 `2408:8340:2823:14e0…`、加新，UCI+nft 双改）|
| **Tailscale** | 无规则 |

### wsc13 (192.168.13.1, config.yaml)

| 项目 | 特征 |
|------|------|
| **CommonProxy w/o HK** | **无** `prefer-asn`（inno11/wy100 有）；use `local_Servers`, `特价机场-1T`, `一元机场` |
| **LoadProxy use** | `local_Servers`, `特价机场-1T`, `一元机场` |
| **Dialer** | 有 `猫猫互联SAVE` proxy（wy100 无）；use `local_Servers`, `特价机场-1T`, `一元机场` |
| **特有 group** | `猫猫互联SAVE`, `赔钱机场SAVE`（无 Premium/PremiumDomesticSites/WYUnicom）|
| **listeners** | 有 `ss-in`/`trojan-in` 回家监听（inno11 无）|
| **sub-rules** | 无 |
| **premiumip** | 无 |
| **DNS** | `211.140.13.188`, `211.140.188.188`, `2409:8028:2000::1111`, `2409:8028:2000::2222`（浙江电信，含 IPv6）|
| **Tailscale** | 有规则 |
