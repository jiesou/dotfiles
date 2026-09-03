# wps.write_info

#### 功能说明

修改在线文字文档的属性。按 `action` 修改修订跟踪、接受/拒绝修订，或节的页面设置与删除。

#### 调用约束

- **前置检查**：revision_accept_all 不可逆，执行前用 read_info revision_count 确认；section_delete 前确认 section_index

**幂等性**：否 — revision_accept_all、section_delete 不可重试；revision_switch 可重复设置

> revision_accept_all 不可撤销，执行前请确认
> page_setup 字段以 API 文档为准，示例键名仅为示意
> section_delete 可能影响分节与页码，请谨慎操作

#### 调用示例

开启修订跟踪：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "revision_switch",
  "enable": true
}
```

接受全部修订：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "revision_accept_all"
}
```

设置第 1 节页宽：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "section_page_setup",
  "section_index": 1,
  "key": "PageWidth",
  "value": "595"
}
```

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

#### 支持的 action

> **action 分发**：工具名固定为 `wps.write_info`；具体操作由请求 JSON 的 `action` 区分。下表 action 列为该字段取值，各 action 参数与示例见对应详情页。

| action | 说明 | 详情 |
|--------|------|------|
| `revision_accept` | 接受指定修订 | [write_info/revision_accept.md](write_info/revision_accept.md) |
| `revision_accept_all` | 接受全部修订 | [write_info/revision_accept_all.md](write_info/revision_accept_all.md) |
| `revision_accept_by_author` | 接受指定作者修订 | [write_info/revision_accept_by_author.md](write_info/revision_accept_by_author.md) |
| `revision_reject` | 拒绝指定修订 | [write_info/revision_reject.md](write_info/revision_reject.md) |
| `revision_reject_all` | 拒绝全部修订 | [write_info/revision_reject_all.md](write_info/revision_reject_all.md) |
| `revision_reject_by_author` | 拒绝指定作者修订 | [write_info/revision_reject_by_author.md](write_info/revision_reject_by_author.md) |
| `revision_switch` | 开关修订跟踪 | [write_info/revision_switch.md](write_info/revision_switch.md) |
| `section_border` | 设置节页面边框 | [write_info/section_border.md](write_info/section_border.md) |
| `section_break` | 在段落后插入分节符 | [write_info/section_break.md](write_info/section_break.md) |
| `section_columns` | 设置分栏 | [write_info/section_columns.md](write_info/section_columns.md) |
| `section_delete` | 删除节 | [write_info/section_delete.md](write_info/section_delete.md) |
| `section_page_setup` | 设置节页面属性 | [write_info/section_page_setup.md](write_info/section_page_setup.md) |
