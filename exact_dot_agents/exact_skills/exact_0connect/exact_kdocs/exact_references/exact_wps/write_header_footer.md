# wps.write_header_footer

#### 功能说明

设置或删除在线文字文档的页眉页脚。推荐顶层传参；也可传 `body` 覆盖完整请求体。
对齐：WdParagraphAlignment，0=左、1=居中、2=右、3=两端对齐。0 是有效左对齐，勿省略。
字体颜色：用 font_style.color_index（WdColorIndex 0..16），不是 RGB。
每次 font 调用只生效 font_style 中的第一个属性；多属性请分多次调用。

**幂等性**：否 — 写操作非幂等，重试前请确认当前文档状态

> 未传 body 时由顶层参数组装；alignment/enabled/font_style 必须出现在请求中才会生效
> alignment=0 表示左对齐，不是「未设置」
> 页眉页脚字体颜色用 color_index（WdColorIndex），不是 RGB
> 推荐传 `body` 对象承载完整请求体

#### 调用示例

第1节启用首页不同页眉页脚：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "set_different_first_page_header_footer",
  "section_index": 1,
  "enabled": true
}
```

第2节页眉右对齐：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "set_header_alignment",
  "section_index": 2,
  "alignment": 2
}
```

第1节页脚设为斜体：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "set_footer_font_style",
  "section_index": 1,
  "font_style": {
    "italic": true
  }
}
```

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

页脚插入页码：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_page_number_in_footer",
  "section_index": 1,
  "alignment": 1
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.write_header_footer`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `insert_page_number_in_footer` | 在页脚插入页码 | [write_header_footer/insert_page_number_in_footer.md](write_header_footer/insert_page_number_in_footer.md) |
| `insert_page_number_in_header` | 在页眉插入页码 | [write_header_footer/insert_page_number_in_header.md](write_header_footer/insert_page_number_in_header.md) |
| `link_to_previous_footer` | 页脚链接上一节 | [write_header_footer/link_to_previous_footer.md](write_header_footer/link_to_previous_footer.md) |
| `link_to_previous_header` | 页眉链接上一节 | [write_header_footer/link_to_previous_header.md](write_header_footer/link_to_previous_header.md) |
| `remove_footer` | 删除页脚 | [write_header_footer/remove_footer.md](write_header_footer/remove_footer.md) |
| `remove_header` | 删除页眉 | [write_header_footer/remove_header.md](write_header_footer/remove_header.md) |
| `set_different_first_page_header_footer` | 首页不同 | [write_header_footer/set_different_first_page_header_footer.md](write_header_footer/set_different_first_page_header_footer.md) |
| `set_different_odd_even_header_footer` | 奇偶页不同 | [write_header_footer/set_different_odd_even_header_footer.md](write_header_footer/set_different_odd_even_header_footer.md) |
| `set_footer_alignment` | 设置页脚对齐 | [write_header_footer/set_footer_alignment.md](write_header_footer/set_footer_alignment.md) |
| `set_footer_content` | 设置页脚内容 | [write_header_footer/set_footer_content.md](write_header_footer/set_footer_content.md) |
| `set_footer_font_style` | 设置页脚字体 | [write_header_footer/set_footer_font_style.md](write_header_footer/set_footer_font_style.md) |
| `set_header_alignment` | 设置页眉对齐 | [write_header_footer/set_header_alignment.md](write_header_footer/set_header_alignment.md) |
| `set_header_content` | 设置页眉内容 | [write_header_footer/set_header_content.md](write_header_footer/set_header_content.md) |
| `set_header_font_style` | 设置页眉字体 | [write_header_footer/set_header_font_style.md](write_header_footer/set_header_font_style.md) |
