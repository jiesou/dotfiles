# wps.write_watermark

#### 功能说明

插入或删除在线文字文档的水印

**幂等性**：否 — 写操作非幂等，重试前请确认当前文档状态

> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装
> insert_image_watermark 需 file_path 为公网可访问的图片 URL；action 选定后由服务自动补全图片水印所需字段

#### 调用示例

插入文字水印：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_text_watermark",
  "text": "机密"
}
```

插入图片水印：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_image_watermark",
  "file_path": "https://example.com/watermark.png"
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.write_watermark`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `delete_watermark` | 删除水印 | [write_watermark/delete_watermark.md](write_watermark/delete_watermark.md) |
| `insert_image_watermark` | 插入图片水印 | [write_watermark/insert_image_watermark.md](write_watermark/insert_image_watermark.md) |
| `insert_text_watermark` | 插入文字水印 | [write_watermark/insert_text_watermark.md](write_watermark/insert_text_watermark.md) |
