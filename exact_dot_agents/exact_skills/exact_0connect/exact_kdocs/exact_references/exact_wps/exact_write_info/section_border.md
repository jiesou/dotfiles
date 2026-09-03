> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_info`](../write_info.md)。

# wps.write_info（action=section_border）

#### 功能说明

设置节页面边框

可用 `line_style` / `color`；color 为 RGB(BGR)，勿传 WdColorIndex

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 操作类型
- `section_index` (number, 必填): 节索引，从 1 开始
- `line_style` (number, 可选): 页面边框线型（section_border，等价 key=LineStyle）。见 [WdLineStyle](../enums.md#wdlinestyle--边框线型)
- `color` (number, 可选): 页面边框颜色 RGB(BGR)（section_border 简写，勿传 WdColorIndex）
- `key` (string, 可选): 边框属性名：LineStyle | LineWidth | Color（Color 值为 RGB/BGR，非 WdColorIndex）。 LineStyle→[WdLineStyle](../enums.md#wdlinestyle--边框线型)；LineWidth→[WdLineWidth](../enums.md#wdlinewidth--边框线宽)
- `value` (string, 可选): 与 key 匹配的边框属性值：Color=RGB(BGR)；LineStyle 见 [WdLineStyle](../enums.md#wdlinestyle--边框线型)； LineWidth 见 [WdLineWidth](../enums.md#wdlinewidth--边框线宽)
