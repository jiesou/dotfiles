> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_info`](../write_info.md)。

# wps.write_info（action=revision_accept_all）

#### 功能说明

接受全部修订

不可撤销

#### 调用示例

接受全部修订：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "revision_accept_all"
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 操作类型
