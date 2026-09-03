> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.read_text`](../read_text.md)。

# wps.read_text（action=full_content）

#### 功能说明

全文内容

#### 调用示例

读取全文：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "full_content"
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 读取操作类型，见 description.detail 中的 action 列表
