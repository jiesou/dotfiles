> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_watermark`](../write_watermark.md)。

# wps.write_watermark（action=insert_image_watermark）

#### 功能说明

插入图片水印

须公网可访问的图片 URL；服务端自动补全其余字段

#### 调用示例

插入图片水印：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_image_watermark",
  "file_path": "https://example.com/watermark.png"
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写操作
- `body` (object, 可选): 完整请求体，优先使用
- `file_path` (string, 必填): 图片 URL（须公网可访问）
