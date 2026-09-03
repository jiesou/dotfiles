> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.format_text`](../format_text.md)。

# wps.format_text（action=font）

#### 功能说明

单属性字体

font_key 用 PascalCase（如 Bold）

#### 调用示例

第 1 段设置上标：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "paragraph",
  "action": "font",
  "paragraph_index": 1,
  "font_key": "Superscript",
  "font_value": "true"
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 格式操作类型
- `scope` (string, 必填): 作用范围，paragraph 或 range
- `paragraph_index` (number, 条件必填: scope=paragraph): 段落索引，从 1 开始
- `begin` (number, 条件必填: scope=range): 区间起始字符位置，从 0 开始
- `end` (number, 条件必填: scope=range): 区间结束字符位置
- `font_key` (string, 必填): 字体属性名（action=font 时）。支持：Bold、Italic、Name（字体名）、Size（字号）、 Underline（WdUnderline 枚举）、ColorIndex（WdColorIndex 枚举值）、StrikeThrough、DoubleStrikeThrough、 Superscript、Subscript、Spacing（字符间距,磅）、Scaling（字符缩放,百分比）。 Underline 见 [WdUnderline](../enums.md#wdunderline--下划线样式)； ColorIndex 见 [WdColorIndex](../enums.md#wdcolorindex--颜色)。 注意：font_key 使用 PascalCase 属性名（如 Bold 而非 bold），因为它直接映射到 WPS 内核 Font 对象属性
- `font_value` (string, 必填): 字体属性值（action=font 时）
