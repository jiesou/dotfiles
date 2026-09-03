# wps.write_element

## 1. wps.write_element

#### 功能说明

通过 `type` 选择元素类别，再按 `action` 执行增删改。

type 取值：bookmark、toc、hyperlink、comment

action 按 type 不同：
- bookmark：add、rename、replace_content、delete、paragraph_insert、range_insert
- toc：insert、delete、delete_all、paragraph_insert、range_insert、format、update、update_all（insert 可选 upper_level、lower_level、toc_index）
- hyperlink：modify_address、delete、delete_all、paragraph_insert、range_insert（需 address、display_text；delete/delete_all 可选 is_del_text）
- comment：paragraph_insert、range_insert、modify_text（需 index+text）、reply、delete、delete_all

#### 工具选择

- **勿用**（改用 `wps.read_element`）：查询元素

#### 调用约束

- **前置检查**：删除类 action 不可逆；执行前用 read_element 确认 type、索引或 bookmark_name

**幂等性**：否 — delete/delete_all 不可重试；增改操作重试前先 read_element 确认状态

> paragraph_insert / range_insert 各 type 含义不同，请对照 action 与必填参数
> rename 需同时提供 bookmark_name 与 new_name

#### 调用示例

添加书签：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "type": "bookmark",
  "action": "add",
  "bookmark_name": "Section_A"
}
```

插入目录：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "type": "toc",
  "action": "insert",
  "upper_level": 1,
  "lower_level": 3
}
```

在区间插入超链接：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "type": "hyperlink",
  "action": "range_insert",
  "begin": 50,
  "end": 60,
  "address": "https://www.kdocs.cn",
  "display_text": "金山文档"
}
```

#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `type` (string, 必填): 元素类型，bookmark / toc / hyperlink / comment
- `action` (string, 必填): 操作类型，见 description.detail
- `bookmark_name` (string, 可选): 书签名称
- `new_name` (string, 可选): 新书签名（action=rename）
- `text` (string, 可选): 书签替换内容或批注正文
- `index` (number, 可选): 超链接/批注等元素索引
- `toc_index` (number, 可选): 目录项索引
- `upper_level` (number, 可选): 目录上限标题级别
- `lower_level` (number, 可选): 目录下限标题级别
- `address` (string, 可选): 超链接 URL
- `display_text` (string, 可选): 超链接显示文本
- `paragraph_index` (number, 可选): 段落索引（paragraph_insert）
- `paragraph_position` (string, 可选): before 或 after
- `begin` (number, 可选): 区间起始（range_insert 或与 range 二选一）
- `end` (number, 可选): 区间结束
- `range` (object, 可选): 范围对象 {"begin": n, "end": m}，与 begin/end 等价
- `is_del_text` (boolean, 可选): 删除超链接时是否同时删除链接文本（type=hyperlink，action=delete/delete_all，默认 false）

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```
