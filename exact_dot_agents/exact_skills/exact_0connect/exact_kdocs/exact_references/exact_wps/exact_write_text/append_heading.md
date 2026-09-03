> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_text`](../write_text.md)。

# wps.write_text（action=append_heading）

#### 功能说明

在文档末尾追加标题

#### 调用示例

在文档末尾追加一级标题：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "append_heading",
  "text": "第二章 方法",
  "heading_level": 1
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写入操作类型
- `text` (string, 必填): 要插入或追加的文本内容
- `heading_level` (number, 必填): 标题级别，支持两种传参方式：1）直接用级别数字（推荐）：1=标题1 … 9=标题9； 2）[WdBuiltinStyle](../enums.md#wdbuiltinstyle--内置样式标题子集) 负整数（-2=标题1 … -10=标题9，-1=正文）
