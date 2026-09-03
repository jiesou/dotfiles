# wps.read_field

#### 功能说明

查询在线文字文档中的域（Field，如页码、日期、交叉引用等）  

**幂等性**：是

> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "get_all_fields"
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.read_field`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `get_all_fields` | 全部域列表 | [read_field/get_all_fields.md](read_field/get_all_fields.md) |
| `get_field_by_index` | 按索引查询 | [read_field/get_field_by_index.md](read_field/get_field_by_index.md) |
| `get_fields_count` | 域总数 | [read_field/get_fields_count.md](read_field/get_fields_count.md) |
