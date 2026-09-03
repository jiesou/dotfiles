# wps.format_table

#### 功能说明

设置在线文字文档中表格的格式。对指定表格（table_index）的单元格、行、列或整表设置格式。

【重要】合并含"最后/前/第N列/行"等相对位置的操作流程：
1. 必须先调 wps.read_table(action=dimensions, table_index=X) 获取 rows 和 cols 总数
2. 根据返回的总列数计算正确的 start_col/end_col（如"最后两列"= start_col=cols-1, end_col=cols）
3. 再调 merge_cells(start_row=1, start_col=计算值, end_row=rows, end_col=计算值)
禁止直接猜测列号！如5列表格的"最后两列"是 start_col=4,end_col=5 而非 1,2

#### 工具选择

- **勿用**（改用 `wps.write_table`）：创建或删除表格

#### 调用约束

- **前置检查**：先用 read_table 确认 table_index、row、col；merge/split 前确认目标区域

**幂等性**：是 — 格式与单元格内容设置可重复执行，失败或效果不符时可调整参数后再次调用

> table_index 为必填；merge_* 与 split_* 需配合行列范围参数
> merge_row 将指定 row 的所有列合并为一个单元格；merge_column 将指定 col 的所有行合并为一个单元格
> 合并跨多行或多列的矩形区域（如合并最后两列、合并前三行的第1-2列）必须使用 merge_cells + start_row/start_col/end_row/end_col，而非 merge_row/merge_column
> 使用 merge_cells 合并'最后N列'等相对位置时，需先调用 read_table(action=dimensions) 获取总行列数，再计算正确的 start_col/end_col
> batch_rows 传 row + datas（按列）；勿传 batch_data

#### 调用示例

设置单元格文本：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "cell_content",
  "table_index": 1,
  "row": 1,
  "col": 1,
  "text": "项目名称"
}
```

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

合并整行（将第1行所有列合并为一个单元格）：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "merge_row",
  "table_index": 1,
  "row": 1
}
```

合并整列（将第2列所有行合并为一个单元格）：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "merge_column",
  "table_index": 1,
  "col": 2
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

合并第一行前两个单元格：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "merge_cells",
  "table_index": 3,
  "start_row": 1,
  "start_col": 1,
  "end_row": 1,
  "end_col": 2
}
```

批量更新一行：

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

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.format_table`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `append_text` | 追加单元格文本 | [format_table/append_text.md](format_table/append_text.md) |
| `auto_fit` | 自动调整列宽 | [format_table/auto_fit.md](format_table/auto_fit.md) |
| `batch_rows` | 批量更新一行 | [format_table/batch_rows.md](format_table/batch_rows.md) |
| `borders` | 设置整表边框 | [format_table/borders.md](format_table/borders.md) |
| `cell_alignment` | 设置单元格水平对齐 | [format_table/cell_alignment.md](format_table/cell_alignment.md) |
| `cell_background` | 设置单元格背景色 | [format_table/cell_background.md](format_table/cell_background.md) |
| `cell_border` | 设置单元格边框 | [format_table/cell_border.md](format_table/cell_border.md) |
| `cell_content` | 设置单元格文本 | [format_table/cell_content.md](format_table/cell_content.md) |
| `cell_font` | 设置单元格字体 | [format_table/cell_font.md](format_table/cell_font.md) |
| `cell_margins` | 设置单元格边距 | [format_table/cell_margins.md](format_table/cell_margins.md) |
| `cell_vertical_alignment` | 设置单元格垂直对齐 | [format_table/cell_vertical_alignment.md](format_table/cell_vertical_alignment.md) |
| `column_alignment` | 设置列水平对齐 | [format_table/column_alignment.md](format_table/column_alignment.md) |
| `column_background` | 设置列背景色 | [format_table/column_background.md](format_table/column_background.md) |
| `column_font` | 设置列字体 | [format_table/column_font.md](format_table/column_font.md) |
| `column_vertical_alignment` | 设置列垂直对齐 | [format_table/column_vertical_alignment.md](format_table/column_vertical_alignment.md) |
| `column_width` | 设置列宽 | [format_table/column_width.md](format_table/column_width.md) |
| `convert_to_text` | 表格转文本 | [format_table/convert_to_text.md](format_table/convert_to_text.md) |
| `merge_cells` | 合并矩形区域 | [format_table/merge_cells.md](format_table/merge_cells.md) |
| `merge_column` | 合并整列 | [format_table/merge_column.md](format_table/merge_column.md) |
| `merge_row` | 合并整行 | [format_table/merge_row.md](format_table/merge_row.md) |
| `repeat_header_row` | 首行跨页重复 | [format_table/repeat_header_row.md](format_table/repeat_header_row.md) |
| `row_alignment` | 设置行水平对齐 | [format_table/row_alignment.md](format_table/row_alignment.md) |
| `row_background` | 设置行背景色 | [format_table/row_background.md](format_table/row_background.md) |
| `row_break_across_pages` | 设置行跨页断行 | [format_table/row_break_across_pages.md](format_table/row_break_across_pages.md) |
| `row_font` | 设置行字体 | [format_table/row_font.md](format_table/row_font.md) |
| `row_height` | 设置行高 | [format_table/row_height.md](format_table/row_height.md) |
| `row_height_rule` | 设置行高规则 | [format_table/row_height_rule.md](format_table/row_height_rule.md) |
| `row_vertical_alignment` | 设置行垂直对齐 | [format_table/row_vertical_alignment.md](format_table/row_vertical_alignment.md) |
| `split_cell` | 拆分单元格 | [format_table/split_cell.md](format_table/split_cell.md) |
| `split_cell_cols` | 按列拆分单元格 | [format_table/split_cell_cols.md](format_table/split_cell_cols.md) |
| `split_cell_rows` | 按行拆分单元格 | [format_table/split_cell_rows.md](format_table/split_cell_rows.md) |
| `split_table` | 拆分表格 | [format_table/split_table.md](format_table/split_table.md) |
| `table_alignment` | 设置表格整体对齐 | [format_table/table_alignment.md](format_table/table_alignment.md) |
| `table_sort` | 表格排序 | [format_table/table_sort.md](format_table/table_sort.md) |
