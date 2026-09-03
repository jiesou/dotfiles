> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_text`](../write_text.md)。

# wps.write_text（action=paragraph_heading_insert）

#### 功能说明

在段落处插入标题

heading_level 推荐 1–9

#### 调用示例

在第 2 段后插入二级标题：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "paragraph_heading_insert",
  "paragraph_index": 2,
  "paragraph_position": "after",
  "text": "1.1 引言",
  "heading_level": 2
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写入操作类型
- `paragraph_index` (number, 必填): 段落索引，从 1 开始；默认值：`1`
- `paragraph_position` (string, 可选): 相对段落的位置，before 或 after；默认 after；默认值：`after`
- `text` (string, 必填): 要插入或追加的文本内容
- `heading_level` (number, 必填): 标题级别，支持两种传参方式：1）直接用级别数字（推荐）：1=标题1 … 9=标题9； 2）[WdBuiltinStyle](../enums.md#wdbuiltinstyle--内置样式标题子集) 负整数（-2=标题1 … -10=标题9，-1=正文）
