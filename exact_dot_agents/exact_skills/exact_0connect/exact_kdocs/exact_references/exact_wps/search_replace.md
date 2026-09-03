# wps.search_replace

#### 功能说明

在在线文字文档中搜索或替换文本。

#### 调用约束

- **前置检查**：replace 前先用 action=search 确认 find_text 匹配处；is_all=true 时影响全文所有出现处

**幂等性**：否 — replace 不可盲目重试；重试前用 action=search 确认匹配位置与次数

> is_all 省略时默认为全部匹配
> replace 不会修改 find_text 为空时的行为，请确保 find_text 非空

#### 调用示例

搜索关键词：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "search",
  "find_text": "季度报告",
  "is_all": true
}
```

替换首处匹配：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "replace",
  "find_text": "草稿",
  "replace_text": "定稿",
  "is_all": false
}
```

全文替换：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "replace",
  "find_text": "2024",
  "replace_text": "2025",
  "is_all": true
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"matches": [{"begin": 12, "end": 18}]}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.search_replace`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `replace` | 替换文本 | [search_replace/replace.md](search_replace/replace.md) |
| `search` | 查找出现位置 | [search_replace/search.md](search_replace/search.md) |
