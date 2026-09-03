> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.format_text`](../format_text.md)。

# wps.format_text（action=line_spacing）

#### 功能说明

行距

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 格式操作类型
- `scope` (string, 必填): 作用范围，paragraph 或 range
- `paragraph_index` (number, 条件必填: scope=paragraph): 段落索引，从 1 开始
- `begin` (number, 条件必填: scope=range): 区间起始字符位置，从 0 开始
- `end` (number, 条件必填: scope=range): 区间结束字符位置
- `spacing_rule` (number, 必填): 行距规则。见 [WdLineSpacing](../enums.md#wdlinespacing--行间距)
- `spacing_value` (number, 可选): 行距值
