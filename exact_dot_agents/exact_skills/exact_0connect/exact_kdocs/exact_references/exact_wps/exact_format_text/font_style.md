> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.format_text`](../format_text.md)。

# wps.format_text（action=font_style）

#### 功能说明

字体样式对象

多属性自动路由 font_batch

#### 调用示例

区间加粗：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "font_style",
  "begin": 0,
  "end": 20,
  "font_style": {
    "bold": true,
    "size": 14
  }
}
```

区间设置删除线：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "font_style",
  "begin": 0,
  "end": 20,
  "font_style": {
    "strike_through": true
  }
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
- `font_style` (object, 必填): 字体样式对象（action=font_style 时）。 支持传入多个属性，系统会自动路由：单个基本属性走 TEXT_FONT， 多属性或含 StrikeThrough/Superscript/Spacing 等扩展属性时自动走 TEXT_FONT_BATCH。 也可直接使用 action=font_batch + font_items 明确指定批量模式。 支持字段：font_name(string)、font_size(float)、bold(bool)、italic(bool)、 underline(int, WdUnderline 枚举)、color_index(int, WdColorIndex 枚举)、 strike_through(bool)、double_strike_through(bool)、 superscript(bool)、subscript(bool)、spacing(float, 磅)、scaling(int, 百分比)。 underline 见 [WdUnderline](../enums.md#wdunderline--下划线样式)； color_index 见 [WdColorIndex](../enums.md#wdcolorindex--颜色)
