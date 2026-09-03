> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_watermark`](../write_watermark.md)。

# wps.write_watermark（action=insert_text_watermark）

#### 功能说明

插入文字水印

#### 调用示例

插入文字水印：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_text_watermark",
  "text": "机密"
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写操作
- `body` (object, 可选): 完整请求体，优先使用
- `text` (string, 必填): 水印文字
- `color` (number, 可选): 文字水印颜色 RGB 整数（默认 12632256 灰色），不是 WdColorIndex
