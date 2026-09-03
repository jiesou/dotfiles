# wps.write_footnote

#### 功能说明

插入、修改或删除在线文字文档中的脚注与尾注

**幂等性**：否 — 写操作非幂等，重试前请确认当前文档状态

> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_endnote_by_paragraph"
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.write_footnote`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `delete_all_endnotes` | 删除全部尾注 | [write_footnote/delete_all_endnotes.md](write_footnote/delete_all_endnotes.md) |
| `delete_all_footnotes` | 删除全部脚注 | [write_footnote/delete_all_footnotes.md](write_footnote/delete_all_footnotes.md) |
| `delete_endnote` | 删除尾注 | [write_footnote/delete_endnote.md](write_footnote/delete_endnote.md) |
| `delete_footnote` | 删除脚注 | [write_footnote/delete_footnote.md](write_footnote/delete_footnote.md) |
| `insert_endnote_by_paragraph` | 在段落处插尾注 | [write_footnote/insert_endnote_by_paragraph.md](write_footnote/insert_endnote_by_paragraph.md) |
| `insert_endnote_by_range` | 在区间插尾注 | [write_footnote/insert_endnote_by_range.md](write_footnote/insert_endnote_by_range.md) |
| `insert_footnote_by_paragraph` | 在段落处插脚注 | [write_footnote/insert_footnote_by_paragraph.md](write_footnote/insert_footnote_by_paragraph.md) |
| `insert_footnote_by_range` | 在区间插脚注 | [write_footnote/insert_footnote_by_range.md](write_footnote/insert_footnote_by_range.md) |
| `modify_endnote_text` | 修改尾注文本 | [write_footnote/modify_endnote_text.md](write_footnote/modify_endnote_text.md) |
| `modify_footnote_text` | 修改脚注文本 | [write_footnote/modify_footnote_text.md](write_footnote/modify_footnote_text.md) |
