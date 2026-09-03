# wps.read_footnote

#### 功能说明

查询在线文字文档中的脚注与尾注

**幂等性**：是

> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "get_all_endnotes"
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.read_footnote`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `get_all_endnotes` | 全部尾注列表 | [read_footnote/get_all_endnotes.md](read_footnote/get_all_endnotes.md) |
| `get_all_footnotes` | 全部脚注列表 | [read_footnote/get_all_footnotes.md](read_footnote/get_all_footnotes.md) |
| `get_endnote_by_index` | 按索引查尾注 | [read_footnote/get_endnote_by_index.md](read_footnote/get_endnote_by_index.md) |
| `get_endnotes_count` | 尾注总数 | [read_footnote/get_endnotes_count.md](read_footnote/get_endnotes_count.md) |
| `get_footnote_by_index` | 按索引查脚注 | [read_footnote/get_footnote_by_index.md](read_footnote/get_footnote_by_index.md) |
| `get_footnotes_count` | 脚注总数 | [read_footnote/get_footnotes_count.md](read_footnote/get_footnotes_count.md) |
