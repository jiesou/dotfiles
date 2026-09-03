> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.format_table`](../format_table.md)。

# wps.format_table（action=merge_cells）

#### 功能说明

合并矩形区域

相对位置须先 read_table dimensions 取 rows/cols

#### 调用示例

合并单元格区域：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "merge_cells",
  "table_index": 1,
  "start_row": 1,
  "start_col": 1,
  "end_row": 1,
  "end_col": 3
}
```

合并最后两列（两步工作流：先查维度再合并）：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "merge_cells",
  "table_index": 3,
  "start_row": 1,
  "start_col": 4,
  "end_row": 5,
  "end_col": 5
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 格式操作类型
- `table_index` (number, 必填): 表格索引，从 1 开始
- `start_row` (number, 必填): 合并区域起始行
- `start_col` (number, 必填): 合并区域起始列
- `end_row` (number, 必填): 合并区域结束行
- `end_col` (number, 必填): 合并区域结束列
