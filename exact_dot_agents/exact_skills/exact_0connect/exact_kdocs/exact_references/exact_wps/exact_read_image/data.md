> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.read_image`](../read_image.md)。

# wps.read_image（action=data）

#### 功能说明

指定图片详情

对应 InlineShape；用 index，不要传形状的 shape_index

#### 调用示例

获取第 1 张图片详情：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "data",
  "index": 1
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 查询类型，count / list / data
- `index` (number, 必填): 图片索引，从 1 开始；默认值：`1`
