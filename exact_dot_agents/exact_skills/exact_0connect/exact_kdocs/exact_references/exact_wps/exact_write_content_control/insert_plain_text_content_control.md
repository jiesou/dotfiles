> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_content_control`](../write_content_control.md)。

# wps.write_content_control（action=insert_plain_text_content_control）

#### 功能说明

纯文本控件

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写操作
- `body` (object, 可选): 完整请求体，优先使用
- `begin` (number, 可选): 区间起始，默认 0（L1 textRangeBE）
- `end` (number, 可选): 区间结束，默认 1（L1 textRangeBE）
- `title` (string, 可选): 控件 Title
- `tag` (string, 可选): 控件 Tag
