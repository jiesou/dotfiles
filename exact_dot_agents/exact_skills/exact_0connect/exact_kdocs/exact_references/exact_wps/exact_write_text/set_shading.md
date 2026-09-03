> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_text`](../write_text.md)。

# wps.write_text（action=set_shading）

#### 功能说明

设置段落底纹

shading_key=BackgroundPatternColorIndex 时 shading_value 为 WdColorIndex（0..16，见 [WdColorIndex](../enums.md#wdcolorindex--颜色)）；两套 key 勿混用

#### 调用示例

设置第 1 段底纹为浅灰色：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "set_shading",
  "paragraph_index": 1,
  "shading_key": "BackgroundPatternColorIndex",
  "shading_value": 15
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写入操作类型
- `paragraph_index` (number, 必填): 段落索引，从 1 开始
- `shading_key` (string, 必填): 底纹属性名：BackgroundPatternColor（RGB）或 BackgroundPatternColorIndex（WdColorIndex，见 [WdColorIndex](../enums.md#wdcolorindex--颜色)）。
- `shading_value` (number, 必填): 底纹属性值，与 shading_key 匹配：BackgroundPatternColor 传 RGB(BGR，自动=-1）； BackgroundPatternColorIndex 传 WdColorIndex 0..16（见 [WdColorIndex](../enums.md#wdcolorindex--颜色)）。
- `color` (number, 可选): 仅作 BackgroundPatternColor 的 RGB(BGR) 简写，勿传 WdColorIndex；推荐显式传 shading_key + shading_value
