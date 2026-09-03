# wps.read_text

#### 功能说明

读取在线文字文档的文本内容。按 `action` 读取文档或段落/区间范围内的文本与元信息。

#### 工具选择

- **适用**：读取在线文字文档正文内容时（优先于 wps.core_execute 的 getFullContent 等老命令）

> 段落索引从 1 开始；字符位置 begin/end 从 0 开始
> 定位传 url / link_id / file_id 三选一；file_id 为云文档文件 ID

#### 调用示例

读取全文：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "full_content"
}
```

读取第 2 段内容：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "paragraph",
  "paragraph_index": 2
}
```

读取字符区间 10–50：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "range_content",
  "begin": 10,
  "end": 50
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"content": "文档正文..."}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.read_text`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `doc_info` | 文档基本信息 | [read_text/doc_info.md](read_text/doc_info.md) |
| `full_content` | 全文内容 | [read_text/full_content.md](read_text/full_content.md) |
| `page_count` | 页数 | [read_text/page_count.md](read_text/page_count.md) |
| `paragraph` | 指定段落文本 | [read_text/paragraph.md](read_text/paragraph.md) |
| `paragraph_count` | 段落数量 | [read_text/paragraph_count.md](read_text/paragraph_count.md) |
| `paragraph_font` | 段落字体 | [read_text/paragraph_font.md](read_text/paragraph_font.md) |
| `paragraph_format` | 段落格式 | [read_text/paragraph_format.md](read_text/paragraph_format.md) |
| `paragraph_page_number` | 段落所在页码 | [read_text/paragraph_page_number.md](read_text/paragraph_page_number.md) |
| `paragraph_range` | 段落字符范围 | [read_text/paragraph_range.md](read_text/paragraph_range.md) |
| `range_content` | 区间文本 | [read_text/range_content.md](read_text/range_content.md) |
| `range_font` | 区间字体 | [read_text/range_font.md](read_text/range_font.md) |
| `word_count` | 字数 | [read_text/word_count.md](read_text/word_count.md) |
