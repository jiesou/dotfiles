> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.read_footnote`](../read_footnote.md)。

# wps.read_footnote（action=get_endnote_by_index）

#### 功能说明

按索引查尾注

须先 get_all_endnotes

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 查询操作
- `body` (object, 可选): 完整请求体，优先使用
- `index` (number, 必填): 脚注/尾注索引；默认值：`1`
