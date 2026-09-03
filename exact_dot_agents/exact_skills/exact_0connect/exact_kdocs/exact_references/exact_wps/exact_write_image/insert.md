> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_image`](../write_image.md)。

# wps.write_image（action=insert）

#### 功能说明

在文档插入图片

追加到文档末尾

#### 调用示例

在文档末尾插入图片：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "insert",
  "file_path": "/tmp/chart.png",
  "width": 400,
  "height": 300
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 操作类型
- `file_path` (string, 必填): 本地或可访问的图片文件路径
- `width` (number, 可选): 图片宽度（像素）
- `height` (number, 可选): 图片高度（像素）
