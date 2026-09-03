> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_shape`](../write_shape.md)。

# wps.write_shape（action=set_shape_line_color）

#### 功能说明

设置线条颜色

color 为 RGB(BGR)，非 WdColorIndex

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写操作
- `body` (object, 可选): 完整请求体，优先使用
- `value` (string, 可选): 通用属性值简写（部分 action 下与 color / font_value / shape_prop_value 等价）
- `color` (number, 必填): 填充/线条颜色 RGB(BGR) 整数值。 例：黄=65535、红=255、蓝=16711680、黑=0。不是 WdColorIndex（0..16）。
- `color_value` (string, 可选): 颜色值字符串，与 color 等价，部分路径用此透传；传数字 RGB 时用 color 参数
- `shape_index` (number, 必填): 形状索引，从 1 开始
