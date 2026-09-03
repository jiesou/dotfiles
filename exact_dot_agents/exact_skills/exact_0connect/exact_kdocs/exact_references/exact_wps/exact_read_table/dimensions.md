> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.read_table`](../read_table.md)。

# wps.read_table（action=dimensions）

#### 功能说明

指定表格行列数

#### 调用示例

查询第 1 个表格行列数：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "dimensions",
  "table_index": 1
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 查询类型
- `table_index` (number, 必填): 表格索引，从 1 开始；除 count 外通常必填
