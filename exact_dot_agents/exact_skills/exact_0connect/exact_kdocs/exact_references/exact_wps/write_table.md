# wps.write_table

#### 功能说明

在在线文字文档中创建或删除表格。按 `action` 插入、删除或调整表格结构。

#### 工具选择

- **勿用**（改用 `wps.format_table`）：设置表格单元格内容与样式

#### 调用约束

- **前置检查**：delete/delete_all 等删除操作不可逆，执行前用 read_table 确认 table_index 与行列号

**幂等性**：否 — delete/delete_row/delete_column/delete_all 不可重试；插入类操作重试前先 read_table 确认结构

> delete_all 会移除文档内全部表格，请谨慎使用
> insert_row / insert_column 的 position 表示在目标行/列之前或之后插入

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

删除第 1 个表格的第 2 行：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "delete_row",
  "table_index": 1,
  "row": 2
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.write_table`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `delete` | 删除指定表格 | [write_table/delete.md](write_table/delete.md) |
| `delete_all` | 删除文档内所有表格 | [write_table/delete_all.md](write_table/delete_all.md) |
| `delete_cell_content` | 清空单元格 | [write_table/delete_cell_content.md](write_table/delete_cell_content.md) |
| `delete_column` | 删除列 | [write_table/delete_column.md](write_table/delete_column.md) |
| `delete_row` | 删除行 | [write_table/delete_row.md](write_table/delete_row.md) |
| `insert` | 在文档末尾插入新表格 | [write_table/insert.md](write_table/insert.md) |
| `insert_column` | 插入列 | [write_table/insert_column.md](write_table/insert_column.md) |
| `insert_row` | 插入行 | [write_table/insert_row.md](write_table/insert_row.md) |
| `paragraph_insert` | 在段落处插入表格 | [write_table/paragraph_insert.md](write_table/paragraph_insert.md) |
| `range_insert` | 在字符区间处插入表格 | [write_table/range_insert.md](write_table/range_insert.md) |
