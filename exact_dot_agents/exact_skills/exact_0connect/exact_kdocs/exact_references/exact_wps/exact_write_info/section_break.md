> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_info`](../write_info.md)。

# wps.write_info（action=section_break）

#### 功能说明

在段落后插入分节符

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 操作类型
- `paragraph_index` (number, 必填): 段落索引；默认值：`1`
- `break_type` (string, 必填): 分节符类型 next_page / continuous 等（section_break）
