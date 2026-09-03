> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.read_image`](../read_image.md)。

# wps.read_image（action=list）

#### 功能说明

图片列表（索引、尺寸等摘要）

#### 调用示例

列出所有图片：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "list"
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 查询类型，count / list / data
