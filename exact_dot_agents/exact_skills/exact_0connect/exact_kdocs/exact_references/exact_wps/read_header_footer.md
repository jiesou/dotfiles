# wps.read_header_footer

#### 功能说明

查询在线文字文档的页眉与页脚内容

**幂等性**：是

> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "get_footer_content"
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"header_content": "技术文档"}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.read_header_footer`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `get_footer_content` | 页脚内容 | [read_header_footer/get_footer_content.md](read_header_footer/get_footer_content.md) |
| `get_header_content` | 页眉内容 | [read_header_footer/get_header_content.md](read_header_footer/get_header_content.md) |
