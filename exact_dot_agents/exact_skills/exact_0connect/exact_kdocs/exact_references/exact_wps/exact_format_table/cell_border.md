> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.format_table`](../format_table.md)。

# wps.format_table（action=cell_border）

#### 功能说明

设置单元格边框

border_key 勿混用；ColorIndex 非 RGB；LineWidth 用枚举非磅值

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 格式操作类型
- `table_index` (number, 必填): 表格索引，从 1 开始
- `border_index` (number, 必填): 单元格边框位置（cell_border，底边框=3）
- `border_value` (string, 必填): 边框属性值（cell_border），必须与 border_key 匹配：LineStyle 见 [WdLineStyle](../enums.md#wdlinestyle--边框线型)； LineWidth 见 [WdLineWidth](../enums.md#wdlinewidth--边框线宽)，禁止传磅值小数，服务端不做磅值↔枚举换算； ColorIndex 见 [WdColorIndex](../enums.md#wdcolorindex--颜色)。
- `border_key` (string, 可选): 边框属性名（cell_border）：LineStyle | LineWidth | ColorIndex。各 key 的 value 类型不同，勿混用： LineStyle→[WdLineStyle](../enums.md#wdlinestyle--边框线型)； LineWidth→[WdLineWidth](../enums.md#wdlinewidth--边框线宽)； ColorIndex→[WdColorIndex](../enums.md#wdcolorindex--颜色)（不要用 Color/RGB）。
- `row` (number, 可选): 行号
- `col` (number, 可选): 列号
