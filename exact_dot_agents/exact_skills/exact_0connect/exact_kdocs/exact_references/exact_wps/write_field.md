# wps.write_field

#### 功能说明

插入、更新或删除在线文字文档中的域

**幂等性**：否 — 写操作非幂等，重试前请确认当前文档状态

> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_field_by_paragraph"
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.write_field`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `delete_field` | 删除域 | [write_field/delete_field.md](write_field/delete_field.md) |
| `insert_field_by_paragraph` | 在段落处插入域 | [write_field/insert_field_by_paragraph.md](write_field/insert_field_by_paragraph.md) |
| `insert_field_by_range` | 在区间插入域 | [write_field/insert_field_by_range.md](write_field/insert_field_by_range.md) |
| `toggle_field_code` | 切换域代码显示 | [write_field/toggle_field_code.md](write_field/toggle_field_code.md) |
| `unlink_field` | 断开域链接 | [write_field/unlink_field.md](write_field/unlink_field.md) |
| `update_all_fields` | 更新全部域 | [write_field/update_all_fields.md](write_field/update_all_fields.md) |
| `update_field` | 更新单个域 | [write_field/update_field.md](write_field/update_field.md) |
