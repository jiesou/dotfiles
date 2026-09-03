# wps.read_image

#### 功能说明

查询在线文字文档中的图片信息。按 `action` 查询文档内嵌入图片的数量、列表或单张详情。

> 图片索引从 1 开始，与 list 返回顺序一致
> 插入/删除图片请用 wps.write_image

#### 调用示例

查询图片数量：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "count"
}
```

列出所有图片：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "list"
}
```

获取第 1 张图片详情：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "data",
  "index": 1
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"count": 3}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.read_image`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `count` | 图片数量 | [read_image/count.md](read_image/count.md) |
| `data` | 指定图片详情 | [read_image/data.md](read_image/data.md) |
| `list` | 图片列表（索引、尺寸等摘要） | [read_image/list.md](read_image/list.md) |
