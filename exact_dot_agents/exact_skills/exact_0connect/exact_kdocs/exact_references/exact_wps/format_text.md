# wps.format_text

#### 功能说明

设置在线文字文档的文本格式。通过 `scope` 指定段落级或区间级，再按 `action` 设置格式。
scope：paragraph（段落）或 range（字符区间）

#### 调用约束

- **前置检查**：scope=range 时先用 read_text 确认 begin/end；scope=paragraph 时确认 paragraph_index

**幂等性**：是 — 格式操作可重复执行，失败或效果不符时可调整参数后再次调用

> scope=range 时必须同时提供 begin 与 end
> font_style 支持多属性自动路由到 font_batch；也可显式使用 action=font_batch + font_items
> action=font 的 font_key 使用 PascalCase（如 Superscript），扩展属性自动走 TEXT_FONT_BATCH
> highlight（高亮）和 font_color（字体颜色）是独立 property，必须分别调用， 不能和 font/font_batch 合并为一次调用
> font_key/font_items 中的 key 使用 PascalCase（如 Bold, Italic, Name, Size, Underline）
> heading_level 推荐使用正整数级别号（1=标题1，2=标题2，...9=标题9），也兼容 WPS 负整数（-2=标题1，-3=标题2），-1=正文

#### 调用示例

第 1 段居中：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "paragraph",
  "action": "alignment",
  "paragraph_index": 1,
  "alignment": 1
}
```

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

第 2 段首行缩进 2 字符：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "paragraph",
  "action": "indent",
  "paragraph_index": 2,
  "indent_type": "firstLine",
  "indent_value": 2,
  "indent_unit": "char"
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

区间设置上标+缩放（前5个字设为上标且缩放200%）：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "font_style",
  "begin": 0,
  "end": 5,
  "font_style": {
    "superscript": true,
    "scaling": 200
  }
}
```

区间设置下标+缩放（第6到10个字设为下标且缩放150%）：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "font_style",
  "begin": 5,
  "end": 10,
  "font_style": {
    "subscript": true,
    "scaling": 150
  }
}
```

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

区间设置字符间距和缩放：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "font_style",
  "begin": 0,
  "end": 50,
  "font_style": {
    "spacing": 2.5,
    "scaling": 150
  }
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.format_text`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `alignment` | 对齐方式 | [format_text/alignment.md](format_text/alignment.md) |
| `clear_format` | 清除格式 | [format_text/clear_format.md](format_text/clear_format.md) |
| `font` | 单属性字体 | [format_text/font.md](format_text/font.md) |
| `font_batch` | 批量字体 | [format_text/font_batch.md](format_text/font_batch.md) |
| `font_color` | 字体颜色 | [format_text/font_color.md](format_text/font_color.md) |
| `font_style` | 字体样式对象 | [format_text/font_style.md](format_text/font_style.md) |
| `format` | 段落单项格式 | [format_text/format.md](format_text/format.md) |
| `format_batch` | 批量段落格式 | [format_text/format_batch.md](format_text/format_batch.md) |
| `heading` | 标题级别 | [format_text/heading.md](format_text/heading.md) |
| `highlight` | 高亮 | [format_text/highlight.md](format_text/highlight.md) |
| `indent` | 缩进 | [format_text/indent.md](format_text/indent.md) |
| `line_spacing` | 行距 | [format_text/line_spacing.md](format_text/line_spacing.md) |
