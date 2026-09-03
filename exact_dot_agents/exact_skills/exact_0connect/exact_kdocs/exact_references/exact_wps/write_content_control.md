# wps.write_content_control

#### 功能说明

插入、修改或删除在线文字文档中的内容控件

**幂等性**：否 — 写操作非幂等，重试前请确认当前文档状态

> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_checkbox_content_control"
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.write_content_control`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `add_drop_down_item` | 添加下拉项 | [write_content_control/add_drop_down_item.md](write_content_control/add_drop_down_item.md) |
| `delete_all_content_controls` | 删除全部 | [write_content_control/delete_all_content_controls.md](write_content_control/delete_all_content_controls.md) |
| `delete_content_control` | 按索引删除 | [write_content_control/delete_content_control.md](write_content_control/delete_content_control.md) |
| `delete_content_control_by_tag` | 按 Tag 删除 | [write_content_control/delete_content_control_by_tag.md](write_content_control/delete_content_control_by_tag.md) |
| `insert_checkbox_content_control` | 复选框 | [write_content_control/insert_checkbox_content_control.md](write_content_control/insert_checkbox_content_control.md) |
| `insert_date_picker_content_control` | 日期选择器 | [write_content_control/insert_date_picker_content_control.md](write_content_control/insert_date_picker_content_control.md) |
| `insert_drop_down_content_control` | 下拉列表 | [write_content_control/insert_drop_down_content_control.md](write_content_control/insert_drop_down_content_control.md) |
| `insert_plain_text_content_control` | 纯文本控件 | [write_content_control/insert_plain_text_content_control.md](write_content_control/insert_plain_text_content_control.md) |
| `insert_rich_text_content_control` | 富文本控件 | [write_content_control/insert_rich_text_content_control.md](write_content_control/insert_rich_text_content_control.md) |
| `remove_drop_down_item` | 移除下拉项 | [write_content_control/remove_drop_down_item.md](write_content_control/remove_drop_down_item.md) |
| `set_content_control_props` | 设置属性 | [write_content_control/set_content_control_props.md](write_content_control/set_content_control_props.md) |
| `set_content_control_value` | 设置值 | [write_content_control/set_content_control_value.md](write_content_control/set_content_control_value.md) |
| `set_content_control_value_by_tag` | 按 Tag 设置值 | [write_content_control/set_content_control_value_by_tag.md](write_content_control/set_content_control_value_by_tag.md) |
