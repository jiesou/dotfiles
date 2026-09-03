# wps.write_shape

#### 功能说明

插入、修改或删除在线文字文档中的浮动形状对象

**幂等性**：否 — 写操作非幂等，重试前请确认当前文档状态

> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装
> insert_shape_picture 需 file_path 为公网可访问的图片 URL；action 选定后由服务自动补全图片形状所需字段

#### 调用示例

插入基本图形：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_basic_shape"
}
```

插入图片形状：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_shape_picture",
  "file_path": "https://example.com/picture.png",
  "left": 100,
  "top": 100,
  "width": 200,
  "height": 150
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.write_shape`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `delete_all_shapes` | 删除全部形状 | [write_shape/delete_all_shapes.md](write_shape/delete_all_shapes.md) |
| `delete_shape` | 删除指定形状 | [write_shape/delete_shape.md](write_shape/delete_shape.md) |
| `insert_basic_shape` | 插入基本图形 | [write_shape/insert_basic_shape.md](write_shape/insert_basic_shape.md) |
| `insert_line` | 插入线条 | [write_shape/insert_line.md](write_shape/insert_line.md) |
| `insert_shape_picture` | 插入图片形状 | [write_shape/insert_shape_picture.md](write_shape/insert_shape_picture.md) |
| `insert_text_box` | 插入文本框 | [write_shape/insert_text_box.md](write_shape/insert_text_box.md) |
| `set_shape_fill_color` | 设置填充色 | [write_shape/set_shape_fill_color.md](write_shape/set_shape_fill_color.md) |
| `set_shape_line_color` | 设置线条颜色 | [write_shape/set_shape_line_color.md](write_shape/set_shape_line_color.md) |
| `set_shape_line_width` | 设置线宽 | [write_shape/set_shape_line_width.md](write_shape/set_shape_line_width.md) |
| `set_shape_props` | 设置几何属性 | [write_shape/set_shape_props.md](write_shape/set_shape_props.md) |
| `set_shape_text` | 设置文本 | [write_shape/set_shape_text.md](write_shape/set_shape_text.md) |
| `set_shape_wrap_type` | 设置环绕方式 | [write_shape/set_shape_wrap_type.md](write_shape/set_shape_wrap_type.md) |
| `set_shape_zorder` | 设置叠放次序 | [write_shape/set_shape_zorder.md](write_shape/set_shape_zorder.md) |
