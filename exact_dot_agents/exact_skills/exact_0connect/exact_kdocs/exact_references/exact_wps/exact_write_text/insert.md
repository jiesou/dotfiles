> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_text`](../write_text.md)。

# wps.write_text（action=insert）

#### 功能说明

在文档追加文本

仅追加到文末；文首插入用 paragraph_insert

#### 调用示例

在文档末尾追加文本：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "insert",
  "text": "【摘要】"
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写入操作类型
- `text` (string, 必填): 要插入或追加的文本内容
- `is_br` (boolean, 可选): 是否以换行方式插入；默认值：`false`
