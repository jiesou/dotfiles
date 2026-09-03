> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_info`](../write_info.md)。

# wps.write_info（action=section_columns）

#### 功能说明

设置分栏

其余可选参数，见参数说明

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 操作类型
- `section_index` (number, 必填): 节索引，从 1 开始
- `num_columns` (number, 必填): 栏数
- `spacing` (number, 必填): 栏间距磅值（section_columns）
