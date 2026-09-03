> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.read_content_control`](../read_content_control.md)。

# wps.read_content_control（action=get_content_control_by_tag）

#### 功能说明

按 Tag 查询

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 查询操作
- `body` (object, 可选): 完整请求体，优先使用
- `tag` (string, 必填): 控件 Tag
