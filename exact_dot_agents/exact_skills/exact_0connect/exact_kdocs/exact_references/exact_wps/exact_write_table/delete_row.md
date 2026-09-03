> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_table`](../write_table.md)。

# wps.write_table（action=delete_row）

#### 功能说明

删除行

#### 调用示例

删除第 1 个表格的第 2 行：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "delete_row",
  "table_index": 1,
  "row": 2
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 操作类型
- `table_index` (number, 必填): 表格索引，从 1 开始
- `row` (number, 必填): 行号
