> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_image`](../write_image.md)。

# wps.write_image（action=range_insert）

#### 功能说明

在字符区间插入

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 操作类型
- `begin` (number, 必填): 区间起始字符位置
- `end` (number, 必填): 区间结束字符位置
- `file_path` (string, 必填): 本地或可访问的图片文件路径
