# wps.read_info

#### 功能说明

查询在线文字文档的属性信息。按 `action` 查询修订、节与样式等文档级属性。

#### 工具选择

- **适用**：读取在线文字文档信息/节属性时
- **勿用**（改用 `wps.write_info`）：修改修订/节属性
- **勿用**（改用 `wps.set_list_style`）：列表与段落样式

> section_index 从 1 开始

#### 调用示例

查询修订数量：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "revision_count"
}
```

查询修订跟踪状态：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "revision_status"
}
```

读取第 1 节页面设置：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "section_page_setup",
  "section_index": 1
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"revision_count": 3}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.read_info`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `revision_all` | 获取全部修订信息 | [read_info/revision_all.md](read_info/revision_all.md) |
| `revision_by_author` | 按作者筛选修订 | [read_info/revision_by_author.md](read_info/revision_by_author.md) |
| `revision_count` | 修订记录数量 | [read_info/revision_count.md](read_info/revision_count.md) |
| `revision_status` | 修订跟踪是否开启 | [read_info/revision_status.md](read_info/revision_status.md) |
| `section_count` | 节数量 | [read_info/section_count.md](read_info/section_count.md) |
| `section_page_setup` | 指定节的页面设置 | [read_info/section_page_setup.md](read_info/section_page_setup.md) |
| `style_list` | 文档可用样式列表 | [read_info/style_list.md](read_info/style_list.md) |
