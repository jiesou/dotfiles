> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.format_table`](../format_table.md)。

# wps.format_table（action=batch_rows）

#### 功能说明

批量更新一行

datas 按列顺序；勿传 batch_data

#### 调用示例

批量更新多行：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "batch_rows",
  "table_index": 1,
  "row": 2,
  "datas": [
    {
      "col": 1,
      "text": "A"
    },
    {
      "col": 2,
      "text": "B"
    }
  ]
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 格式操作类型
- `table_index` (number, 必填): 表格索引，从 1 开始
- `row` (number, 必填): 行号
- `datas` (array, 必填): 批量行数据（batch_rows）
