# wps.read_shape

#### 功能说明

查询在线文字文档中的浮动形状对象（线条、文本框、基本图形等，非位图图片）

**幂等性**：是

> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "get_all_shapes_info"
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.read_shape`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `find_shape_by_text` | 按文本查找形状 | [read_shape/find_shape_by_text.md](read_shape/find_shape_by_text.md) |
| `get_all_shapes_info` | 全部形状列表 | [read_shape/get_all_shapes_info.md](read_shape/get_all_shapes_info.md) |
| `get_shape_info` | 单个形状详情 | [read_shape/get_shape_info.md](read_shape/get_shape_info.md) |
| `get_shape_text` | 形状内文本 | [read_shape/get_shape_text.md](read_shape/get_shape_text.md) |
| `get_shapes_count` | 形状总数 | [read_shape/get_shapes_count.md](read_shape/get_shapes_count.md) |
