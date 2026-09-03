> **重要提示**：当前文档为单个 action 的参数与示例。工具说明（适用场景、约束、全部 action 列表）见 [`wps.write_text`](../write_text.md)。

# wps.write_text（action=set_borders）

#### 功能说明

设置段落边框

border_key=Color 时 border_value 必须为 RGB(BGR) 整数；border_key=LineWidth 时必须为 WdLineWidth 枚举，禁止磅值小数；服务端不做换算

#### 调用示例

设置第 1 段上边框为单实线：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "set_borders",
  "paragraph_index": 1,
  "border_type": -1,
  "border_key": "LineStyle",
  "border_value": 1
}
```

#### 参数说明

- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `action` (string, 必填): 写入操作类型
- `paragraph_index` (number, 必填): 段落索引，从 1 开始
- `border_type` (number, 必填): 边框位置。见 [WdBorderIndex](../enums.md#wdborderindex--边框位置)
- `border_key` (string, 必填): 边框属性名：LineStyle | LineWidth | Color。各 key 的 value 类型不同，勿混用： LineStyle→[WdLineStyle](../enums.md#wdlinestyle--边框线型)； LineWidth→[WdLineWidth](../enums.md#wdlinewidth--边框线宽) 枚举； Color→RGB(BGR)（不是 WdColorIndex）。
- `border_value` (number, 必填): 边框属性值，必须与 border_key 匹配：LineStyle 见 [WdLineStyle](../enums.md#wdlinestyle--边框线型)； LineWidth 见 [WdLineWidth](../enums.md#wdlinewidth--边框线宽)，禁止传磅值小数； Color=RGB(BGR) 如 65535=黄、255=红、16711680=蓝、0=黑（不是 WdColorIndex）。
