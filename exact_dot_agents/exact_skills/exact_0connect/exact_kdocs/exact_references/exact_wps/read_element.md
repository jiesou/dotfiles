# wps.read_element

## 1. wps.read_element

#### 功能说明

通过 `type` 选择元素类别，再按 `action` 查询。

type 取值：bookmark、toc、hyperlink、comment

action 按 type 不同：
- bookmark：count、list、data、exists（data/exists 需 bookmark_name）
- toc：count、exists、data（data 可选 toc_index）
- hyperlink：count、list、data（data 需 index）
- comment：count、list、data、index、author（author 筛选作者）

#### 工具选择

- **适用**：查询在线文字文档中的元素时
- **勿用**（改用 `wps.write_element`）：增删改元素

> type 与 action 组合须匹配，否则会返回参数错误
> hyperlink 的 index 从 1 开始，与 list 结果对应

#### 调用示例

统计书签数量：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "type": "bookmark",
  "action": "count"
}
```

检查书签是否存在：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "type": "bookmark",
  "action": "exists",
  "bookmark_name": "Chapter1"
}
```

列出全部批注：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "type": "comment",
  "action": "list"
}
```

#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `type` (string, 必填): 元素类型，bookmark / toc / hyperlink / comment
- `action` (string, 必填): 查询操作，见 description.detail
- `bookmark_name` (string, 可选): 书签名称（type=bookmark 且 action=data/exists 时）
- `index` (number, 可选): 元素索引（hyperlink/comment 的 data 等）
- `toc_index` (number, 可选): 目录项索引（type=toc）
- `comment_index` (number, 可选): 批注自定义索引（type=comment，action=index 时）
- `author` (string, 可选): 批注作者（type=comment，action=author 时）

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"count": 5}}

```
