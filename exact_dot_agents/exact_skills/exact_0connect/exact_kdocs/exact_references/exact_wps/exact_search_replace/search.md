> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.search_replace`](../search_replace.md)。

# wps.search_replace（action=search）

#### 功能说明

查找出现位置

is_all 默认 true

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

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): search 或 replace
- `is_all` (boolean, 可选): 是否匹配/替换全部出现处，默认 true；默认值：`true`
- `find_text` (string, 必填): 要查找的文本
