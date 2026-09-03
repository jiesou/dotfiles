> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_table`](../write_table.md)。

# wps.write_table（action=insert）

#### 功能说明

在文档末尾插入新表格

成功后用返回 tableIndex

#### 调用示例

插入 3×4 表格：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "insert",
  "rows": 3,
  "cols": 4
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 操作类型
- `rows` (number, 必填): 表格行数
- `cols` (number, 必填): 表格列数
