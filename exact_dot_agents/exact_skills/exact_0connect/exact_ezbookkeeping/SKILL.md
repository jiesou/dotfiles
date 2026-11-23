---
name: ezbookkeeping
description: USE when operating the user's ezBookkeeping 记账 — 查交易、加交易、查账户/分类/标签、汇率、导入导出，操作它的本地二进制 CLI。
disable-model-invocation: true
---

# ezBookkeeping 记账操作

官方提供 API 命令行工具 `ebktools.sh`

## 来源

完整 SKILL `https://raw.githubusercontent.com/mayswind/ezbookkeeping/main/skills/ezbookkeeping/SKILL.md`
- 脚本：`https://raw.githubusercontent.com/mayswind/ezbookkeeping/main/skills/ezbookkeeping/scripts/ebktools.sh`
- 文档：`https://ezbookkeeping.mayswind.net/zh_Hans/agent/skill`
- 注意：发行包 tar.gz 里**不含** `skills/`，只有 git 仓库有

## 本地用法

```bash
./scripts/ebk.sh list          # 命令清单
./scripts/ebk.sh help <命令>   # 参数说明
./scripts/ebk.sh server-version
```

命令：`tokens-list` `accounts-list` `accounts-add` `transaction-categories-list` `transaction-categories-add` `transaction-tags-list` `transaction-tags-add` `transactions-list` `transactions-list-all` `transactions-add` `exchangerates-latest` `server-version`。

## 凭据

`ebk.sh` 自己读 `~/.dsh/.env`：`EZBOOKKEEPING_URL`、`EZBOOKKEEPING_TOKEN`、`EZBOOKKEEPING_MCP_TOKEN`，再映射成官方脚本要的 `EBKTOOL_SERVER_BASEURL` / `EBKTOOL_TOKEN`（已 export，shell 环境变量优先）。可覆盖：`DSH_ENV_FILE`、`EZBOOKKEEPING_DIR`、`EBKTOOL_*`。**不要把令牌打印或写进文件。**

版本号取自本地二进制（`$EZBOOKKEEPING_DIR`，默认 `~/Documents/dev/services/ezbookkeeping`）；取不到时问服务端 `/api/v1/systems/version.json`。

## 服务侧部署信息

- 部署在 chenpc 的 `~/Documents/dev/services/ezbookkeeping`
- systemd 用户服务 `ezbookkeeping.service`，`ExecStartPost` 每次启动拉最新 release 覆盖（`tar -U` 换 inode，运行中的进程不受影响）。**重启即升级**：`systemctl --user restart ezbookkeeping`。
- 数据/日志/存储：`data/ezbookkeeping.db`、`log/`、`storage/`，更新钩子已排除这三处；备份就备 `data/` + `storage/`。
- 退款记成负数的支出，手续费记成单独的支出交易。

