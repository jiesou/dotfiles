> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.read_header_footer`](../read_header_footer.md)。

# wps.read_header_footer（action=get_footer_content）

#### 功能说明

页脚内容

header_footer_type：1=主 2=首页 3=偶数页

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "get_footer_content"
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 查询操作
- `body` (object, 可选): 完整请求体，优先使用
- `header_footer_type` (number, 可选): 页眉/页脚类型：1=主（默认）、2=首页、3=偶数页。文档已开启「首页不同」时，查首页内容用 2。
- `section_index` (number, 可选): 节索引，默认 1
