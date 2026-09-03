> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_table`](../write_table.md)。

# wps.write_table（action=paragraph_insert）

#### 功能说明

在段落处插入表格

#### 调用示例

在第 1 段后插入表格：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "paragraph_insert",
  "paragraph_index": 1,
  "paragraph_position": "after",
  "rows": 2,
  "cols": 3
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 操作类型
- `paragraph_index` (number, 必填): 段落索引；默认值：`1`
- `paragraph_position` (string, 必填): 相对段落位置，before 或 after；默认值：`after`
- `rows` (number, 必填): 表格行数
- `cols` (number, 必填): 表格列数
