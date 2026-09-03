> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_header_footer`](../write_header_footer.md)。

# wps.write_header_footer（action=set_footer_alignment）

#### 功能说明

设置页脚对齐

alignment=0 为左对齐，1=居中、2=右、3=两端对齐

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写操作（见 detail 列表）
- `body` (object, 可选): 完整请求体，优先使用
- `alignment` (number, 必填): 对齐方式。必须显式传数字；传 0 表示左对齐（不会被当成缺省）。见 [WdParagraphAlignment](../enums.md#wdparagraphalignment--对齐方式)
- `section_index` (number, 可选): 节索引
