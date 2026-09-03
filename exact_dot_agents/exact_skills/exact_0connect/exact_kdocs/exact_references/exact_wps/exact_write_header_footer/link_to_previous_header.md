> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_header_footer`](../write_header_footer.md)。

# wps.write_header_footer（action=link_to_previous_header）

#### 功能说明

页眉链接上一节

enabled：true=链接上一节

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写操作（见 detail 列表）
- `body` (object, 可选): 完整请求体，优先使用
- `enabled` (boolean, 可选): 开关。
- `section_index` (number, 可选): 节索引
