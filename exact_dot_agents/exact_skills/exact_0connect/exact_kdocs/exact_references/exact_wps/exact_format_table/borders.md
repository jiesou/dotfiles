> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.format_table`](../format_table.md)。

# wps.format_table（action=borders）

#### 功能说明

设置整表边框

line_width 为磅值，与 cell_border 的 LineWidth 枚举不同

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 格式操作类型
- `table_index` (number, 必填): 表格索引，从 1 开始
- `line_style` (number, 必填): 边框线样式（borders）。见 [WdLineStyle](../enums.md#wdlinestyle--边框线型)
- `line_width` (number, 可选): 整表边框线宽磅值（如 3.0）。与 cell_border 的 LineWidth（WdLineWidth 枚举）不是同一套类型，勿混用。
- `border_color` (number, 可选): 边框颜色索引（borders，WdColorIndex）。见 [WdColorIndex](../enums.md#wdcolorindex--颜色)
