# wps.read_table

#### 功能说明

查询在线文字文档中的表格信息。按 `action` 查询文档内表格的数量、尺寸与单元格内容。

#### 工具选择

- **适用**：读取在线文字文档中的表格时
- **勿用**（改用 `wps.write_table`）：修改表格结构
- **勿用**（改用 `wps.format_table`）：修改表格格式

> table_index、row、col 均从 1 开始

#### 调用示例

查询表格数量：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "count"
}
```

查询第 1 个表格行列数：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "dimensions",
  "table_index": 1
}
```

读取单元格 (2,3)：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "cell",
  "table_index": 1,
  "row": 2,
  "col": 3
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"count": 2}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.read_table`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `cell` | 单元格内容 | [read_table/cell.md](read_table/cell.md) |
| `column` | 整列内容 | [read_table/column.md](read_table/column.md) |
| `count` | 表格数量 | [read_table/count.md](read_table/count.md) |
| `dimensions` | 指定表格行列数 | [read_table/dimensions.md](read_table/dimensions.md) |
| `range` | 表格范围信息 | [read_table/range.md](read_table/range.md) |
| `row` | 整行内容 | [read_table/row.md](read_table/row.md) |
