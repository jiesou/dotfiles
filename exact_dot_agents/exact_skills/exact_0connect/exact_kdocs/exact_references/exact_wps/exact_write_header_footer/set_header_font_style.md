> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_header_footer`](../write_header_footer.md)。

# wps.write_header_footer（action=set_header_font_style）

#### 功能说明

设置页眉字体

color_index 为 WdColorIndex，非 RGB；每次仅生效 font_style 首属性

#### 调用示例

页眉字体颜色（WdColorIndex 红=6）：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "set_header_font_style",
  "section_index": 1,
  "font_style": {
    "color_index": 6
  }
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写操作（见 detail 列表）
- `body` (object, 可选): 完整请求体，优先使用
- `font_style` (object, 必填): 字体样式。支持：font_name(string)、font_size(float)、bold(bool)、italic(bool)、 underline(string/int, WdUnderline)、color_index(string/int, WdColorIndex 0..16)。 underline 见 [WdUnderline](../enums.md#wdunderline--下划线样式)； color_index 见 [WdColorIndex](../enums.md#wdcolorindex--颜色)。不要传 RGB。 也可把 font_name / italic / color_index 等放在顶层，服务端会折叠进 font_style。
- `section_index` (number, 可选): 节索引
- `font_name` (string, 可选): 字体名简写（等同 font_style.font_name）
- `font_size` (number, 可选): 字号简写（等同 font_style.font_size）
- `bold` (boolean, 可选): 加粗简写（等同 font_style.bold）
- `italic` (boolean, 可选): 斜体简写（等同 font_style.italic）
- `color_index` (number, 可选): 字体颜色索引简写（等同 font_style.color_index，WdColorIndex 0..16），不是 RGB。见 [WdColorIndex](../enums.md#wdcolorindex--颜色)
- `key` (string, 可选): 字体属性名备选（如 Italic、Bold、ColorIndex、Name），与 value 成对使用
- `value` (string, 可选): 与 key 成对；布尔用 true/false，枚举用数字字符串
