> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_shape`](../write_shape.md)。

# wps.write_shape（action=insert_shape_picture）

#### 功能说明

插入图片形状

`file_path` 须公网可访问图片 URL

#### 调用示例

插入图片形状：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_shape_picture",
  "file_path": "https://example.com/picture.png",
  "left": 100,
  "top": 100,
  "width": 200,
  "height": 150
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写操作
- `body` (object, 可选): 完整请求体，优先使用
- `value` (string, 可选): 通用属性值简写（部分 action 下与 color / font_value / shape_prop_value 等价）
- `file_path` (string, 必填): 图片 URL
- `left` (number, 必填): 左边距；默认值：`10`
- `top` (number, 必填): 上边距；默认值：`10`
- `width` (number, 必填): 宽度；默认值：`100`
- `height` (number, 必填): 高度；默认值：`100`
