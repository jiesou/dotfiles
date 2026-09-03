> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_text`](../write_text.md)。

# wps.write_text（action=set_tab_stops）

#### 功能说明

设置制表位

position/alignment/leader 与 tab_* 等价

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写入操作类型
- `paragraph_index` (number, 必填): 段落索引，从 1 开始；默认值：`1`
- `position` (number, 可选): 制表位位置磅值（等同 tab_position）
- `alignment` (number, 可选): 制表位对齐方式（等同 tab_alignment）
- `leader` (number, 可选): 前导符类型（等同 tab_leader）
