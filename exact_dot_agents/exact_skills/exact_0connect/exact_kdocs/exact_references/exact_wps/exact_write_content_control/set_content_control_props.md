> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_content_control`](../write_content_control.md)。

# wps.write_content_control（action=set_content_control_props）

#### 功能说明

设置属性

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写操作
- `body` (object, 可选): 完整请求体，优先使用
- `index` (number, 必填): 控件索引；默认值：`1`
- `value` (string, 必填): 控件值
- `title` (string, 可选): 设置 Title
- `cannot_delete` (boolean, 可选): 锁定控件不可删除
- `lock` (boolean, 可选): 锁定内容
- `appearance` (number, 可选): 外观
