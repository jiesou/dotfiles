> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.set_list_style`](../set_list_style.md)。

# wps.set_list_style（action=list_set）

#### 功能说明

设置列表

gallery_type：1=无序 2=有序 3=大纲；level 仅 1–9

#### 调用示例

设置有序列表：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "paragraph",
  "action": "list_set",
  "paragraph_index": 3,
  "gallery_type": 2,
  "template_index": 1,
  "level": 1
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): list_query / list_set / style_set
- `scope` (string, 必填): 作用范围，paragraph 或 range
- `paragraph_index` (number, 条件必填: scope=paragraph): 段落索引，从 1 开始
- `begin` (number, 条件必填: scope=range): 区间起始字符位置，从 0 开始
- `end` (number, 条件必填: scope=range): 区间结束字符位置
- `gallery_type` (number, 必填): 列表类型（1=无序/项目符号 2=有序/编号 3=大纲编号）
- `template_index` (number, 可选): 列表模板索引（默认 1）
- `level` (number, 可选): 列表级别（默认 1）
- `is_continue` (boolean, 可选): 是否继续上一列表编号（默认 false）
