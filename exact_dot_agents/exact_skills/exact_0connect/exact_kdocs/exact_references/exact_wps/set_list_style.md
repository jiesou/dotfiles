# wps.set_list_style

#### 功能说明

设置在线文字文档的列表或段落样式。通过 `scope` 指定段落级或区间级，再按 `action` 查询/设置列表或应用样式。
scope：paragraph 或 range

#### 调用约束

- **前置检查**：style_set 前用 read_info action=style_list 确认 style_name 存在；list_set 前可用 list_query 查看当前列表

**幂等性**：是 — 列表与样式设置可重复执行，效果不符时可调整 list_info/style_name 后再次调用

> style_name 须为文档已有样式，可用 wps.read_info action=style_list 列举
> gallery_type 为列表样式类型，template_index/level/is_continue 为可选配置
> scope=range 时须提供 begin 与 end

#### 调用示例

查询第 3 段列表信息：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "paragraph",
  "action": "list_query",
  "paragraph_index": 3
}
```

设置有序列表：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "paragraph",
  "action": "list_set",
  "paragraph_index": 3,
  "gallery_type": 2,
  "template_index": 1,
  "level": 1
}
```

对区间应用标题样式：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "style_set",
  "begin": 0,
  "end": 15,
  "style_name": "标题 1"
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"list_type": "bullet"}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.set_list_style`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `list_query` | 查询当前列表信息 | [set_list_style/list_query.md](set_list_style/list_query.md) |
| `list_remove` | 移除列表格式 | [set_list_style/list_remove.md](set_list_style/list_remove.md) |
| `list_set` | 设置列表 | [set_list_style/list_set.md](set_list_style/list_set.md) |
| `style_set` | 应用命名样式 | [set_list_style/style_set.md](set_list_style/style_set.md) |
