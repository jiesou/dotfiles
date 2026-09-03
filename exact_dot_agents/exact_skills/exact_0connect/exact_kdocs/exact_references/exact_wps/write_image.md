# wps.write_image

#### 功能说明

在在线文字文档中插入或删除图片。按 `action` 在文档、段落或字符区间插入图片，或删除已有图片。

#### 调用约束

- **前置检查**：delete/delete_all 不可逆，执行前用 read_image list 确认 index；file_path 须存在且可读

**幂等性**：否 — delete/delete_all 不可重试；插入类操作重试前先 read_image 确认是否已插入

> file_path 须为运行环境可读的本地路径
> delete_all 不可恢复，操作前请确认

#### 调用示例

在文档末尾插入图片：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "insert",
  "file_path": "/tmp/chart.png",
  "width": 400,
  "height": 300
}
```

在第 2 段后插入图片：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "paragraph_insert",
  "paragraph_index": 2,
  "paragraph_position": "after",
  "file_path": "/tmp/logo.png"
}
```

删除第 1 张图片：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "delete",
  "index": 1
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.write_image`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `delete` | 删除指定图片 | [write_image/delete.md](write_image/delete.md) |
| `delete_all` | 删除全部图片 | [write_image/delete_all.md](write_image/delete_all.md) |
| `insert` | 在文档插入图片 | [write_image/insert.md](write_image/insert.md) |
| `paragraph_insert` | 在段落前/后插入 | [write_image/paragraph_insert.md](write_image/paragraph_insert.md) |
| `range_insert` | 在字符区间插入 | [write_image/range_insert.md](write_image/range_insert.md) |
