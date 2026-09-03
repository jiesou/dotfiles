# wps.read_content_control

#### 功能说明

查询在线文字文档中的内容控件（ContentControl）

**幂等性**：是

> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "get_content_control_by_index"
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.read_content_control`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `get_all_content_controls` | 全部控件列表 | [read_content_control/get_all_content_controls.md](read_content_control/get_all_content_controls.md) |
| `get_content_control_by_index` | 按索引查询 | [read_content_control/get_content_control_by_index.md](read_content_control/get_content_control_by_index.md) |
| `get_content_control_by_tag` | 按 Tag 查询 | [read_content_control/get_content_control_by_tag.md](read_content_control/get_content_control_by_tag.md) |
| `get_content_control_by_title` | 按 Title 查询 | [read_content_control/get_content_control_by_title.md](read_content_control/get_content_control_by_title.md) |
| `get_content_controls_count` | 控件总数 | [read_content_control/get_content_controls_count.md](read_content_control/get_content_controls_count.md) |
