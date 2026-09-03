> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.format_text`](../format_text.md)。

# wps.format_text（action=font_batch）

#### 功能说明

批量字体

font_items 的 key 用 PascalCase

#### 调用示例

区间批量设置字体（推荐）：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "font_batch",
  "begin": 0,
  "end": 20,
  "font_items": [
    {
      "key": "Bold",
      "value": true
    },
    {
      "key": "Italic",
      "value": true
    },
    {
      "key": "Name",
      "value": "仿宋"
    },
    {
      "key": "Size",
      "value": 18
    },
    {
      "key": "Underline",
      "value": 9
    }
  ]
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
- `font_items` (array, 必填): 批量字体项数组（action=font_batch 时），每项为 {key, value} 对象。 key 使用 PascalCase WPS Font 属性名：Name（字体名）、Size（字号）、Bold（true/false）、Italic、Underline（WdUnderline 枚举）、 Color（RGB 整数值）、ColorIndex（WdColorIndex）、StrikeThrough、DoubleStrikeThrough、 Superscript、Subscript、Spacing、Scaling。 Underline 见 [WdUnderline](../enums.md#wdunderline--下划线样式)； ColorIndex 见 [WdColorIndex](../enums.md#wdcolorindex--颜色)。 示例：[{"key":"Bold","value":true},{"key":"Size","value":18},{"key":"Name","value":"仿宋"}]。 这是**同时设置多个字体属性的推荐方式**
