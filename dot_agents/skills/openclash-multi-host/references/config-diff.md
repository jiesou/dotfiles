# 三台 OpenClash 配置差异

## 公共部分

- `proxy-providers`: 都有 `local_Servers`(file)、`特价机场-1T`、`赔钱机场`、`一元机场`、`猫猫互联`(http)
- `rule-providers`: 完全一致
- `sniffer` / `dns` 结构一致（nameserver IP 因运营商不同有差异）

## 逐台差异

### wy11 (192.168.11.1, wscmixed.yaml)

| 项目 | 特征 |
|------|------|
| **CommonProxy use** | `特价机场-1T`, `赔钱机场`, `一元机场`（**无** `local_Servers`）|
| **LoadProxy use** | `特价机场-1T`, `赔钱机场` |
| **CommonProxy w/o HK use** | `local_Servers`, `特价机场-1T`, `赔钱机场`, `一元机场` |
| **CommonProxy USA use** | `local_Servers`, `特价机场-1T`, `赔钱机场` |
| **Dialer use** | `local_Servers`, `特价机场-1T`, `一元机场`；有 `猫猫互联SAVE` proxy |
| **特有 group** | `Premium`、`PremiumDomesticSites`、`WYUnicom`、`猫猫互联SAVE`、`赔钱机场SAVE` |
| **sub-rules** | 有 `premium` 子规则 |
| **特殊 rule** | `IP-CIDR,192.168.100.0/24,WYUnicom`、`SUB-RULE,(RULE-SET,premiumip),premium` |
| **premiumip** | 有内嵌 IP 列表（chenpc, hp-book, 老班长, WY 联想一体机, wy-QiTianM420）|
| **DNS** | `61.153.81.74`, `202.96.104.17`, `202.96.104.15`（慈溪电信）+ `221.12.33.227`, `221.12.1.227`（宁波联通）|
| **Tailscale** | 有规则 |

### wy100 (192.168.100.1:23333, wscmixed.yaml)

| 项目 | 特征 |
|------|------|
| **CommonProxy use** | `local_Servers`, `特价机场-1T`, `一元机场`（**无** `赔钱机场`）|
| **LoadProxy use** | `local_Servers`, `特价机场-1T`, `一元机场` |
| **CommonProxy w/o HK use** | `local_Servers`, `特价机场-1T`, `一元机场` |
| **CommonProxy USA use** | `local_Servers`, `特价机场-1T`, `赔钱机场` |
| **Dialer use** | `local_Servers`, `特价机场-1T`, `一元机场`（**无** `猫猫互联SAVE` proxy）|
| **特有 group** | 无 Premium/PremiumDomesticSites/WYUnicom/猫猫互联SAVE/赔钱机场SAVE |
| **sub-rules** | 无 |
| **premiumip** | 无 |
| **DNS** | `221.12.33.227`, `221.12.1.227`（仅联通）|
| **Tailscale** | 无规则 |

### wy13 (192.168.13.1, config.yaml)

| 项目 | 特征 |
|------|------|
| **CommonProxy use** | `local_Servers`, `特价机场-1T`, `一元机场`；有 `policy-priority: "Hytron HK direct:0.5"` |
| **LoadProxy use** | `local_Servers`, `特价机场-1T`, `一元机场` |
| **CommonProxy w/o HK use** | `local_Servers`, `特价机场-1T`, `一元机场` |
| **CommonProxy USA use** | `local_Servers`, `特价机场-1T`, `赔钱机场` |
| **Dialer use** | `local_Servers`, `特价机场-1T`, `一元机场`；有 `猫猫互联SAVE` proxy |
| **特有 group** | `猫猫互联SAVE`, `赔钱机场SAVE`（无 Premium/PremiumDomesticSites/WYUnicom）|
| **sub-rules** | 无 |
| **premiumip** | 无 |
| **DNS** | `211.140.13.188`, `211.140.188.188`（浙江电信）|
| **Tailscale** | 有规则 |
