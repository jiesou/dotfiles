# wps.write_text

#### 功能说明

在在线文字文档中插入、追加或删除文本。按 `action` 在文档、段落或字符区间写入或删除文本。

#### 调用约束

- **前置检查**：action=delete_all 会不可逆清空正文，执行前用 read_text 备份或确认；range_delete/paragraph_delete 同理先确认区间

**幂等性**：否 — 删除类操作不可重试；插入类操作重试前先用 read_text 确认当前内容，避免重复插入

> delete_all 会清空文档正文，操作前请确认
> paragraph_position 仅支持 before / after
> append_heading 与 paragraph_heading_insert 需配合 heading_level 使用
> heading_level 推荐使用正整数级别号（1=标题1，2=标题2，...9=标题9），也兼容 WPS 负整数（-2=标题1，-3=标题2）

#### 调用示例

在文档开头插入文本：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "paragraph_insert",
  "paragraph_index": 1,
  "paragraph_position": "before",
  "text": "【摘要】"
}
```

在第 1 段后插入正文：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "paragraph_insert",
  "paragraph_index": 1,
  "paragraph_position": "after",
  "text": "本段为补充说明。"
}
```

在第 2 段后插入二级标题：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "paragraph_heading_insert",
  "paragraph_index": 2,
  "paragraph_position": "after",
  "text": "1.1 引言",
  "heading_level": 2
}
```

在文档末尾追加一级标题：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "append_heading",
  "text": "第二章 方法",
  "heading_level": 1
}
```

删除字符区间：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "range_delete",
  "begin": 100,
  "end": 150
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.write_text`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `append_heading` | 在文档末尾追加标题 | [write_text/append_heading.md](write_text/append_heading.md) |
| `clear_tab_stops` | 清除段落制表位 | [write_text/clear_tab_stops.md](write_text/clear_tab_stops.md) |
| `delete_all` | 删除全部正文 | [write_text/delete_all.md](write_text/delete_all.md) |
| `insert` | 在文档追加文本 | [write_text/insert.md](write_text/insert.md) |
| `paragraph_delete` | 删除指定段落 | [write_text/paragraph_delete.md](write_text/paragraph_delete.md) |
| `paragraph_heading_insert` | 在段落处插入标题 | [write_text/paragraph_heading_insert.md](write_text/paragraph_heading_insert.md) |
| `paragraph_insert` | 在段落前/后插入 | [write_text/paragraph_insert.md](write_text/paragraph_insert.md) |
| `paragraph_update` | 更新指定段落文本 | [write_text/paragraph_update.md](write_text/paragraph_update.md) |
| `range_delete` | 删除字符区间 | [write_text/range_delete.md](write_text/range_delete.md) |
| `range_insert` | 在字符区间插入 | [write_text/range_insert.md](write_text/range_insert.md) |
| `range_update` | 更新字符区间文本 | [write_text/range_update.md](write_text/range_update.md) |
| `set_borders` | 设置段落边框 | [write_text/set_borders.md](write_text/set_borders.md) |
| `set_shading` | 设置段落底纹 | [write_text/set_shading.md](write_text/set_shading.md) |
| `set_tab_stops` | 设置制表位 | [write_text/set_tab_stops.md](write_text/set_tab_stops.md) |
