# 直接改 SQLite

MCP 有管不到的东西（比如那个删不掉的 `MCP` 标签）。这时停服务、改库、重启。

## 部署

```bash
~/Documents/dev/services/beecount-cloud/
├── compose.yaml        # podman,镜像 sunxiao0721/beecount-cloud:1.9.0,端口 8869:8080
└── data/beecount.db    # SQLite
```

容器名 `beecount-cloud_beecount-cloud_1`，host 上用 `podman`（rootless）。

## 操作流程

```bash
cd ~/Documents/dev/services/beecount-cloud

# 1. 备份
cp data/beecount.db data/beecount.db.bak-$(date +%Y%m%d-%H%M%S)

# 2. 停服务
podman-compose down
# 或 podman stop beecount-cloud_beecount-cloud_1

# 3. 改库
sqlite3 data/beecount.db

# 4. 起服务
podman-compose up -d
```

**必须停服务再改**，SQLite 单写者，容器活着改会冲突或覆盖。

## 表结构

### user_tag_projection

```sql
CREATE TABLE user_tag_projection (
  user_id VARCHAR(36) NOT NULL,
  sync_id VARCHAR(255) NOT NULL,
  name TEXT,
  color VARCHAR(32),
  source_change_id BIGINT DEFAULT '0' NOT NULL,
  PRIMARY KEY (user_id, sync_id),
  FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

### read_tx_projection（交易）

关键列：`ledger_id`、`sync_id`、`tx_type`、`amount`、`happened_at`、`note`、`category_sync_id`、`category_name`、`category_kind`、`account_sync_id`、`tags_csv`、`tag_sync_ids_json`、`source_change_id`。

标签存**两处**，改的时候必须同步：

- `tags_csv`：逗号分隔的标签名，如 `闲鱼,MCP`
- `tag_sync_ids_json`：JSON 数组，如 `["tag_cc3a4106f453","tag_26ad1bcd5d24"]`

`source_change_id` 用于同步，手工改完要 bump，否则客户端拉不到变更。

### user_category_projection

同理，`(user_id, sync_id)` 主键，`name` + `kind`。**同名分类可以有 expense 和 income 两条**。

## 常见操作

### 删除一个标签

```sql
-- 1. 确认引用数
SELECT COUNT(*) FROM read_tx_projection WHERE tags_csv LIKE '%MCP%';

-- 2. 从所有交易里摘掉（先看 sync_id）
SELECT sync_id, tags_csv, tag_sync_ids_json FROM read_tx_projection LIMIT 1;

-- 3. 批量清理（SQLite 没有原生 JSON 数组函数，建议用 Python 脚本跑）
-- 4. 删标签本体
DELETE FROM user_tag_projection WHERE name='MCP';
```

`tags_csv` / `tag_sync_ids_json` 的批量改写用 Python + `sqlite3` 模块更安全，别在 shell 里拼 SQL。

### 标签改名

```sql
UPDATE user_tag_projection SET name='csv导入' WHERE name='MCP';
UPDATE read_tx_projection
   SET tags_csv = REPLACE(tags_csv, 'MCP', 'csv导入')
 WHERE tags_csv LIKE '%MCP%';
```

改完记得 bump `source_change_id`。

### 查某标签有多少笔

```sql
SELECT COUNT(*) FROM read_tx_projection WHERE tags_csv LIKE '%标签名%';
```

`LIKE` 会误伤子串（如 `闲鱼` 匹配到 `闲鱼手续费`），精确匹配要拆 CSV：
`WHERE ',' || tags_csv || ',' LIKE '%,闲鱼,%'`

## 注意

- 改之前**一定备份**，`data/` 下有 `backup_*` 表说明有内置备份机制，也可以从那儿取。
- 手工改完，客户端可能显示不同步，需要触发一次全量同步或在 App 里下拉刷新。
- `sync_changes` 表记录每次变更，手工改库不会自动写入，如需严格一致要手动补一条。
