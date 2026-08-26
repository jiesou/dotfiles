# 在线文字（wps）工具完整参考文档

本文件包含金山文档 Skill 中在线文字（`wps.*`）工具的操作说明。该类工具面向在线编辑中的文字文档，适合创建空白文档、导出和原子能力执行等场景。

---

## 通用说明

### 在线文字特点

- 面向在线文字文档，不是本地 `.docx` 文件直传接口
- 支持创建空白在线文档、导出为 DOCX / PDF / 图片 / AP
- 提供结构化原子工具，对文档进行段落/区间级别的增删改查和格式设置等操作
- 若只是读取正文内容，仍优先使用通用工具 `read_file`

### 何时使用 `wps.*`
- 需要新建一个空白在线文字文档
- 需要把在线文字导出为 DOCX、PDF、图片或 AP 文稿
- 需要对文档执行原子操作：读取/修改指定段落内容、查找替换、设置段落格式、设置字符格式等

### 何时不要用 `wps.*`
- 创建空白文档 `.docx` 文件：用 `create_empty_file`
- 创建并写入，优先用工具 `create_file_with_content`
- 上传本地 docx/pdf 等文件：用 `upload_new_file`；覆盖已有文档：用 `upload_replace_file`
- 写 Markdown 富文本内容到智能文档：用 `otl.*`

### `wps.*` 工具调用说明

- 格式：服务名和工具分开: 服务名 wps.xx
  例如：kdocs wps.export
- 文档定位：除创建空白文档 / 纯任务查询外，统一传 `url` / `link_id` / `file_id` **三选一**

## 导出能力总览

`wps.*` 中的导出能力对外拆分为三个工具：

- `wps.export`：导出 DOCX、创建 PDF 导出任务、发起 AP 导出流程
- `wps.export_image`：导出 PNG / JPEG 图片
- `wps.query_export`：统一查询异步导出结果

### 选择建议

- 需要拿到 `.docx` 下载地址：用 `wps.export`，传 `format=docx`
- 需要导出图片：用 `wps.export_image`，传 `format=png/jpeg`，定位 `url` / `link_id` / `file_id` 三选一
- 需要导出 PDF：先 `wps.export`，传 `format=pdf`；再按需用 `wps.query_export`
- 需要导出 AP：先 `wps.export`，传 `format=ap`；再用 `wps.query_export`（`format=ap` 时须传 export 返回的 `file_id`）

## 结构化文档工具

推荐优先使用以下按能力域划分的结构化原子工具：

| 能力域 | 工具 |
|--------|------|
| 文本 | `wps.read_text` / `wps.write_text` / `wps.search_replace` / `wps.format_text` |
| 表格 | `wps.read_table` / `wps.write_table` / `wps.format_table` |
| 图片 | `wps.read_image` / `wps.write_image` |
| 形状 | `wps.read_shape` / `wps.write_shape` |
| 元素 | `wps.read_element` / `wps.write_element` |
| 内容控件 | `wps.read_content_control` / `wps.write_content_control` |
| 脚注尾注 | `wps.read_footnote` / `wps.write_footnote` |
| 页眉页脚 | `wps.read_header_footer` / `wps.write_header_footer` |
| 域 | `wps.read_field` / `wps.write_field` |
| 水印 | `wps.write_watermark` |
| 文档属性 | `wps.read_info` / `wps.write_info` / `wps.set_list_style` |

### 图片类写操作

以下 action 需传入**公网可访问的图片 URL**（服务端会拉取图片）：

| 工具 | action | 顶层参数 | 说明 |
|------|--------|----------|------|
| `wps.write_watermark` | `insert_image_watermark` | `file_path` | 插入图片水印 |
| `wps.write_shape` | `insert_shape_picture` | `file_path` | 插入浮动图片形状 |

也可通过 `body` 传入完整请求体，`body` 优先于顶层参数；图片类 action 的底层字段由服务自动补全。

---

## 一、导出

### 1. wps.export

#### 功能说明

统一导出在线文字文档，按 `format` 分发到不同导出分支：

- `docx`：返回 DOCX 下载结果
- `pdf`：创建 PDF 导出任务
- `ap`：发起 AP 导出流程



**幂等性**：否 — 导出为异步任务，用 task_id 轮询结果而非重复提交


#### 调用示例

`format=docx` 导出 DOCX：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "format": "docx",
  "with_checksums": "md5,sha256"
}
```

`format=pdf` 导出 PDF：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "format": "pdf",
  "from_page": 1,
  "to_page": 10
}
```

`format=ap` 导出 AP 文稿：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "format": "ap",
  "name": "季度经营分析"
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `format` (string, 必填): 导出格式。可选值：`docx` / `pdf` / `ap`
- `with_checksums` (string, 可选): `format=docx` 时可传，校验算法列表，如 `md5,sha256`
- `cid` (string, 可选): `format=docx` 时可传，分享链接 ID
- `from_page` (number, 可选): `format=pdf` 时可传，起始页码；默认值：`1`
- `to_page` (number, 可选): `format=pdf` 时可传，结束页码；默认值：`9999`
- `client_id` (string, 可选): 导出时可选的客户端标识
- `password` (string, 可选): `format=pdf` 时可传，源文档密码
- `store_type` (string, 可选): `format=pdf` 时可传，如 `ks3`、`cloud`
- `multipage` (number, 可选): `format=pdf` 时可传；默认值：`1`
- `opt_frame` (boolean, 可选): `format=pdf` 时可传；默认值：`true`
- `export_open_password` (string, 可选): `format=pdf` 时可传，导出 PDF 打开密码
- `export_modify_password` (string, 可选): `format=pdf` 时可传，导出 PDF 修改密码
- `name` (string, 可选): `format=ap` 时必填，智能文档名称，不含后缀

---

### 2. wps.export_image

#### 功能说明

将在线文字导出为 `png` 或 `jpeg` 图片。该接口走图片导出链路。



**幂等性**：否 — 导出为异步任务，用 task_id 轮询结果而非重复提交


#### 调用示例

导出为 PNG 长图：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "format": "png",
  "dpi": 150,
  "from_page": 1,
  "to_page": 3,
  "combine_long_pic": true
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `format` (string, 必填): 导出图片格式。可选值：`png` / `jpeg`
- `dpi` (number, 可选): 导出图片 DPI。可选值：`96` / `150` / `300`；默认值：`96`
- `water_mark` (boolean, 可选): 是否添加水印；默认值：`true`
- `from_page` (number, 可选): 起始页码；默认值：`1`
- `to_page` (number, 可选): 结束页码；默认值：`9999`
- `combine_long_pic` (boolean, 可选): 是否合并为长图；`false` 表示逐页；默认值：`true`
- `use_xva` (boolean, 可选): 是否启用 XVA 渲染
- `client_id` (string, 可选): 导出时可选的客户端标识
- `password` (string, 可选): 源文档密码
- `store_type` (string, 可选): 存储类型，如 `ks3`、`cloud`

#### 返回值说明

```json
{
  "code": 0,
  "data": {
    "url": "https://xxx.wps.cn/export/image.png",
    "file_id": "string"
  }
}

```

| 字段 | 类型 | 说明 |
|------|------|------|
| `data.url` | string | 导出图片的下载地址 |
| `data.file_id` | string | 导出图片的文件 ID |

---

### 3. wps.query_export

#### 功能说明

统一查询异步导出结果：

- `format=pdf`：查询 PDF 导出任务
- `format=ap`：查询 AP 导出任务



#### 调用示例

`format=pdf` 查询 PDF 导出结果：

```json
{
  "format": "pdf",
  "task_id": "task_xxx",
  "task_type": "normal_export"
}
```

`format=ap` 查询 AP 导出结果：

```json
{
  "format": "ap",
  "file_id": "ap_file_xxx",
  "task_id": "task_xxx"
}
```


#### 参数说明

- `format` (string, 必填): 导出格式。可选值：`pdf` / `ap`
- `task_id` (string, 必填): 导出任务 ID
- `task_type` (string, 可选): `format=pdf` 时可传，通常为 `normal_export`
- `file_id` (string, 可选): `format=ap` 时必填，传 `wps.export` 返回的新智能文档文件 ID
- `extra_query` (object, 可选): `format=ap` 时可传，补充查询参数

---

## 二、文档文本

### 4. wps.read_text

#### 功能说明

按 `action` 读取文档或段落/区间范围内的文本与元信息。

可用 action：
- full_content：全文内容
- page_count：页数
- word_count：字数
- doc_info：文档基本信息
- paragraph_count：段落数量
- paragraph：指定段落文本（需 paragraph_index）
- paragraph_range：段落字符范围（需 paragraph_index）
- paragraph_format：段落格式（需 paragraph_index）
- paragraph_font：段落字体（需 paragraph_index）
- paragraph_page_number：段落所在页码（需 paragraph_index）
- range_content：区间文本（需 begin、end）
- range_font：区间字体（需 begin、end）


#### 工具选择

- **适用**：读取在线文字文档正文内容时（优先于 wps.core_execute 的 getFullContent 等老命令）


> 段落索引从 1 开始；字符位置 begin/end 从 0 开始
> 定位传 url / link_id / file_id 三选一；file_id 为云文档文件 ID

#### 调用示例

读取全文：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "full_content"
}
```

读取第 2 段内容：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "paragraph",
  "paragraph_index": 2
}
```

读取字符区间 10–50：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "range_content",
  "begin": 10,
  "end": 50
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 读取操作类型，见 description.detail 中的 action 列表
- `paragraph_index` (number, 可选): 段落索引，从 1 开始；action 为 paragraph* 时必填
- `begin` (number, 可选): 起始字符位置，从 0 开始；action 为 range* 时必填
- `end` (number, 可选): 结束字符位置；action 为 range* 时必填

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"content": "文档正文..."}}

```

---

### 5. wps.write_text

#### 功能说明

按 `action` 在文档、段落或字符区间写入或删除文本。

可用 action：
- insert：在文档追加文本（需 text，可选 is_br 控制是否换行插入）
- append_heading：在文档末尾追加标题（需 text、heading_level）
- delete_all：删除全部正文
- paragraph_insert：在段落前/后插入（需 paragraph_index、text，可选 paragraph_position）
- paragraph_heading_insert：在段落处插入标题（需 paragraph_index、text、heading_level，可选 paragraph_position）
- paragraph_update：更新指定段落的文本内容（需 paragraph_index、content）
- paragraph_delete：删除指定段落内容（需 paragraph_index）
- range_insert：在字符区间插入（需 begin、end、text）
- range_update：更新字符区间的文本内容（需 begin、end、content）
- range_delete：删除字符区间（需 begin、end）
- set_borders：设置段落边框（需 paragraph_index、border_type、border_key、border_value）
  border_key=Color 时 border_value 必须是 RGB(BGR) 整数（如黄=65535、红=255、蓝=16711680），不是 WdColorIndex
  border_key=LineWidth 时 border_value 必须是 WdLineWidth 枚举（如 0.50磅=4、1.00磅=8、2.25磅=18、3.00磅=24），不是磅值小数
  Color / LineWidth 各自按官方类型传参，服务端不做换算、勿混用
- set_shading：设置段落底纹（需 paragraph_index、shading_key、shading_value）
  shading_key=BackgroundPatternColor → shading_value 为 RGB(BGR)，自动色用 -1
  shading_key=BackgroundPatternColorIndex → shading_value 为 WdColorIndex（0..16）
  两套 key 勿混用；不要把索引写到 BackgroundPatternColor 上
- set_tab_stops：设置制表位（需 paragraph_index、tab_position/tab_alignment/tab_leader 或 position/alignment/leader）
- clear_tab_stops：清除段落制表位（需 paragraph_index；不传 paragraph_index 时清除全部）


#### 调用约束

- **前置检查**：action=delete_all 会不可逆清空正文，执行前用 read_text 备份或确认；range_delete/paragraph_delete 同理先确认区间


**幂等性**：否 — 删除类操作不可重试；插入类操作重试前先用 read_text 确认当前内容，避免重复插入


> delete_all 会清空文档正文，操作前请确认
> paragraph_position 仅支持 before / after
> append_heading 与 paragraph_heading_insert 需配合 heading_level 使用
> heading_level 推荐使用正整数级别号（1=标题1，2=标题2，...9=标题9），也兼容 WPS 负整数（-2=标题1，-3=标题2）

#### 调用示例

在文档开头插入文本：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "insert",
  "text": "【摘要】",
  "position": 0
}
```

在第 1 段后插入正文：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "paragraph_insert",
  "paragraph_index": 1,
  "paragraph_position": "after",
  "text": "本段为补充说明。"
}
```

在第 2 段后插入二级标题：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "paragraph_heading_insert",
  "paragraph_index": 2,
  "paragraph_position": "after",
  "text": "1.1 引言",
  "heading_level": 2
}
```

在文档末尾追加一级标题：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "append_heading",
  "text": "第二章 方法",
  "heading_level": 1
}
```

删除字符区间：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "range_delete",
  "begin": 100,
  "end": 150
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 写入操作类型
- `text` (string, 可选): 要插入或追加的文本内容
- `content` (string, 可选): 更新后的文本内容（action=paragraph_update/range_update 时必填）
- `is_br` (boolean, 可选): 是否以换行方式插入（action=insert 时可选，默认 false）
- `paragraph_index` (number, 可选): 段落索引，从 1 开始
- `paragraph_position` (string, 可选): 相对段落的位置，before 或 after
- `heading_level` (number, 可选): 标题级别，支持两种传参方式： 1）直接用级别数字（推荐）：1=标题1, 2=标题2, 3=标题3, 4=标题4, 5=标题5, 6=标题6, 7=标题7, 8=标题8, 9=标题9 2）WdBuiltinStyle 负整数：-2=标题1, -3=标题2, -4=标题3, -5=标题4, -6=标题5, -7=标题6, -8=标题7, -9=标题8, -10=标题9, -1=正文

- `begin` (number, 可选): 区间起始字符位置
- `end` (number, 可选): 区间结束字符位置
- `border_type` (number, 可选): 边框位置 WdBorderIndex（上=-1 左=-2 底=-3 右=-4 横向=-5 纵向=-6 斜下=-7 斜上=-8）
- `border_key` (string, 可选): 边框属性名（action=set_borders）：LineStyle | LineWidth | Color。 各 key 的 value 类型不同，勿混用： LineStyle→WdLineStyle；LineWidth→WdLineWidth 枚举；Color→RGB(BGR)（不是 WdColorIndex）。

- `border_value` (number, 可选): 边框属性值（action=set_borders），必须与 border_key 匹配： LineStyle=WdLineStyle（如单实线=1）； LineWidth=WdLineWidth 枚举（0.25磅=2、0.50磅=4、0.75磅=6、1.00磅=8、1.50磅=12、2.25磅=18、3.00磅=24、4.50磅=36、6.00磅=48）， 禁止传磅值小数（如 2.25）；服务端不做磅值↔枚举换算； Color=RGB(BGR) 如 65535=黄、255=红、16711680=蓝、0=黑（不是 WdColorIndex）。

- `shading_key` (string, 可选): 底纹属性名（action=set_shading）： BackgroundPatternColor（RGB）或 BackgroundPatternColorIndex（WdColorIndex）。

- `shading_value` (number, 可选): 底纹属性值（action=set_shading）。 与 shading_key 匹配：BackgroundPatternColor 传 RGB(BGR，自动=-1）； BackgroundPatternColorIndex 传 WdColorIndex 0..16。

- `color` (number, 可选): 仅作 BackgroundPatternColor 的 RGB(BGR) 简写，勿传 WdColorIndex。 推荐显式传 shading_key + shading_value。

- `position` (number, 可选): 制表位位置磅值（action=set_tab_stops；等同 tab_position）
- `alignment` (number, 可选): 制表位对齐方式（action=set_tab_stops；等同 tab_alignment）
- `leader` (number, 可选): 前导符类型（action=set_tab_stops；等同 tab_leader）

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

### 6. wps.search_replace

#### 功能说明

全文搜索或替换指定文本。

可用 action：
- search：查找 find_text 的出现位置
- replace：将 find_text 替换为 replace_text


#### 调用约束

- **前置检查**：replace 前先用 action=search 确认 find_text 匹配处；is_all=true 时影响全文所有出现处


**幂等性**：否 — replace 不可盲目重试；重试前用 action=search 确认匹配位置与次数


> is_all 省略时默认为全部匹配
> replace 不会修改 find_text 为空时的行为，请确保 find_text 非空

#### 调用示例

搜索关键词：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "search",
  "find_text": "季度报告",
  "is_all": true
}
```

替换首处匹配：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "replace",
  "find_text": "草稿",
  "replace_text": "定稿",
  "is_all": false
}
```

全文替换：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "replace",
  "find_text": "2024",
  "replace_text": "2025",
  "is_all": true
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): search 或 replace
- `find_text` (string, 必填): 要查找的文本
- `replace_text` (string, 可选): 替换后的文本；action=replace 时必填
- `is_all` (boolean, 可选): 是否匹配/替换全部出现处，默认 true

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"matches": [{"begin": 12, "end": 18}]}}

```

---

### 7. wps.format_text

#### 功能说明

通过 `scope` 指定段落级或区间级，再按 `action` 设置格式。

scope：paragraph（段落）或 range（字符区间）

可用 action：
- alignment：对齐方式（alignment）
- font：单属性字体（font_key、font_value）
- highlight：高亮（highlight_color）
- line_spacing：行距（spacing_rule、spacing_value）
- indent：缩进（indent_type、indent_value、indent_unit）
- heading：标题级别（heading_level，正整数 1-9 或负整数）
- format：段落单项格式（key、value）
- format_batch：批量段落格式（format_items）
- font_color：字体颜色（r、g、b，RGB 分量 0-255）
- font_batch：批量字体（font_style 或 font_items）
- font_style：字体样式对象（font_style）
- clear_format：清除格式


#### 调用约束

- **前置检查**：scope=range 时先用 read_text 确认 begin/end；scope=paragraph 时确认 paragraph_index


**幂等性**：是 — 格式操作可重复执行，失败或效果不符时可调整参数后再次调用


> scope=range 时必须同时提供 begin 与 end
> font_style 支持多属性自动路由到 font_batch；也可显式使用 action=font_batch + font_items
> action=font 的 font_key 使用 PascalCase（如 Superscript），扩展属性自动走 TEXT_FONT_BATCH
> highlight（高亮）和 font_color（字体颜色）是独立 property，必须分别调用， 不能和 font/font_batch 合并为一次调用
> font_key/font_items 中的 key 使用 PascalCase（如 Bold, Italic, Name, Size, Underline）
> heading_level 推荐使用正整数级别号（1=标题1，2=标题2，...9=标题9），也兼容 WPS 负整数（-2=标题1，-3=标题2），-1=正文

#### 调用示例

第 1 段居中：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "paragraph",
  "action": "alignment",
  "paragraph_index": 1,
  "alignment": 1
}
```

区间加粗：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "font_style",
  "begin": 0,
  "end": 20,
  "font_style": {
    "bold": true,
    "size": 14
  }
}
```

第 2 段首行缩进 2 字符：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "paragraph",
  "action": "indent",
  "paragraph_index": 2,
  "indent_type": "firstLine",
  "indent_value": 2,
  "indent_unit": "char"
}
```

区间设置删除线：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "font_style",
  "begin": 0,
  "end": 20,
  "font_style": {
    "strike_through": true
  }
}
```

第 1 段设置上标：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "paragraph",
  "action": "font",
  "paragraph_index": 1,
  "font_key": "Superscript",
  "font_value": "true"
}
```

区间设置上标+缩放（前5个字设为上标且缩放200%）：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "font_style",
  "begin": 0,
  "end": 5,
  "font_style": {
    "superscript": true,
    "scaling": 200
  }
}
```

区间设置下标+缩放（第6到10个字设为下标且缩放150%）：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "font_style",
  "begin": 5,
  "end": 10,
  "font_style": {
    "subscript": true,
    "scaling": 150
  }
}
```

区间批量设置字体（推荐）：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "font_batch",
  "begin": 0,
  "end": 20,
  "font_items": [
    {
      "key": "Bold",
      "value": true
    },
    {
      "key": "Italic",
      "value": true
    },
    {
      "key": "Name",
      "value": "仿宋"
    },
    {
      "key": "Size",
      "value": 18
    },
    {
      "key": "Underline",
      "value": 9
    }
  ]
}
```

区间设置字符间距和缩放：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "scope": "range",
  "action": "font_style",
  "begin": 0,
  "end": 50,
  "font_style": {
    "spacing": 2.5,
    "scaling": 150
  }
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `scope` (string, 必填): 作用范围，paragraph 或 range
- `action` (string, 必填): 格式操作类型
- `paragraph_index` (number, 可选): 段落索引（scope=paragraph 时必填）
- `begin` (number, 可选): 区间起始（scope=range 时必填）
- `end` (number, 可选): 区间结束（scope=range 时必填）
- `alignment` (number, 可选): 对齐方式枚举值
- `heading_level` (number, 可选): 标题级别，支持两种传参方式： 1）直接用级别数字（推荐）：1=标题1, 2=标题2, 3=标题3, 4=标题4, 5=标题5, 6=标题6, 7=标题7, 8=标题8, 9=标题9 2）WdBuiltinStyle 负整数：-2=标题1, -3=标题2, -4=标题3, -5=标题4, -6=标题5, -7=标题6, -8=标题7, -9=标题8, -10=标题9, -1=正文

- `highlight_color` (number, 可选): 高亮颜色索引（WdColorIndex 枚举）： 0=自动, 1=黑, 2=蓝, 3=青, 4=绿, 5=品红, 6=红, 7=黄, 8=白, 9=深蓝, 10=深青, 11=深绿, 12=深品红, 13=深红, 14=深黄, 15=深灰, 16=浅灰

- `spacing_rule` (number, 可选): 行距规则
- `spacing_value` (number, 可选): 行距值
- `indent_value` (number, 可选): 缩进值
- `indent_type` (string, 可选): 缩进类型，left / right / firstLine
- `indent_unit` (string, 可选): 缩进单位，pt 或 char
- `font_key` (string, 可选): 字体属性名（action=font 时）。支持：Bold、Italic、Name（字体名）、Size（字号）、 Underline（WdUnderline 枚举值：0=无,1=单线,3=双线,4=虚线,6=粗线,7=短划线,9=点-划线,10=点-点-划线,11=波浪线,20=粗点,23=粗短划线,25=粗-点-划,26=粗-点-点-划,27=粗波浪线,39=长划线,43=双波浪线,55=粗长划线）、 ColorIndex（WdColorIndex 枚举值）、StrikeThrough、DoubleStrikeThrough、 Superscript、Subscript、Spacing（字符间距,磅）、Scaling（字符缩放,百分比）。 注意：font_key 使用 PascalCase 属性名（如 Bold 而非 bold），因为它直接映射到 WPS 内核 Font 对象属性

- `font_value` (string, 可选): 字体属性值（action=font 时）
- `font_style` (object, 可选): 字体样式对象（action=font_style 时）。 支持传入多个属性，系统会自动路由：单个基本属性走 TEXT_FONT， 多属性或含 StrikeThrough/Superscript/Spacing 等扩展属性时自动走 TEXT_FONT_BATCH。 也可直接使用 action=font_batch + font_items 明确指定批量模式。 支持字段：font_name(string)、font_size(float)、bold(bool)、italic(bool)、 underline(int, WdUnderline 枚举)、color_index(int, WdColorIndex 枚举)、 strike_through(bool)、double_strike_through(bool)、 superscript(bool)、subscript(bool)、spacing(float, 磅)、scaling(int, 百分比)。 underline 枚举(WdUnderline)：0=无, 1=单线, 2=仅单词, 3=双线, 4=虚线, 6=粗线, 7=短划线, 9=点-划线, 10=点-点-划线, 11=波浪线, 20=粗点, 23=粗短划线, 25=粗-点-划, 26=粗-点-点-划, 27=粗波浪线, 39=长划线, 43=双波浪线, 55=粗长划线

- `key` (string, 可选): 格式属性名（action=format 时，如 Alignment、LineSpacing）
- `value` (string, 可选): 格式属性值（action=format 时，会自动推断类型）
- `format_items` (array, 可选): 批量格式项数组（action=format_batch 时）
- `font_items` (array, 可选): 批量字体项数组（action=font_batch 时），每项为 {key, value} 对象。 key 使用 PascalCase WPS Font 属性名：Name（字体名）、Size（字号）、Bold（true/false）、 Italic、Underline（WdUnderline 枚举数值）、Color（RGB 整数值）、ColorIndex（WdColorIndex）、 StrikeThrough、DoubleStrikeThrough、Superscript、Subscript、Spacing、Scaling。 示例：[{"key":"Bold","value":true},{"key":"Size","value":18},{"key":"Name","value":"仿宋"}]。 这是**同时设置多个字体属性的推荐方式**

- `r` (number, 可选): 红色分量 0-255（action=font_color 时）
- `g` (number, 可选): 绿色分量 0-255（action=font_color 时）
- `b` (number, 可选): 蓝色分量 0-255（action=font_color 时）

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

## 三、文档表格

### 8. wps.read_table

#### 功能说明

按 `action` 查询文档内表格的数量、尺寸与单元格内容。

可用 action：
- count：表格数量
- dimensions：指定表格行列数（需 table_index）
- cell：单元格内容（需 table_index、row、col）
- row：整行内容（需 table_index、row）
- column：整列内容（需 table_index、col）
- range：表格范围信息（需 table_index）


#### 工具选择

- **适用**：读取在线文字文档中的表格时
- **勿用**（改用 `wps.write_table`）：修改表格结构
- **勿用**（改用 `wps.format_table`）：修改表格格式


> table_index、row、col 均从 1 开始

#### 调用示例

查询表格数量：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "count"
}
```

查询第 1 个表格行列数：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "dimensions",
  "table_index": 1
}
```

读取单元格 (2,3)：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "cell",
  "table_index": 1,
  "row": 2,
  "col": 3
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 查询类型
- `table_index` (number, 可选): 表格索引，从 1 开始；除 count 外通常必填
- `row` (number, 可选): 行号，从 1 开始
- `col` (number, 可选): 列号，从 1 开始

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"count": 2}}

```

---

### 9. wps.write_table

#### 功能说明

按 `action` 插入、删除或调整表格结构。

可用 action：
- insert：在文档末尾插入新表格（需 rows、cols）
- delete：删除指定表格（需 table_index）
- delete_row：删除行（需 table_index、row）
- delete_column：删除列（需 table_index、col）
- delete_cell_content：清空单元格（需 table_index、row、col）
- delete_all：删除文档内所有表格
- insert_row：插入行（需 table_index、row、position）
- insert_column：插入列（需 table_index、col、position）
- paragraph_insert：在段落处插入表格（需 paragraph_index、paragraph_position、rows、cols）
- range_insert：在字符区间处插入表格（需 begin、end、rows、cols）


#### 工具选择

- **勿用**（改用 `wps.format_table`）：设置表格单元格内容与样式

#### 调用约束

- **前置检查**：delete/delete_all 等删除操作不可逆，执行前用 read_table 确认 table_index 与行列号


**幂等性**：否 — delete/delete_row/delete_column/delete_all 不可重试；插入类操作重试前先 read_table 确认结构


> delete_all 会移除文档内全部表格，请谨慎使用
> insert_row / insert_column 的 position 表示在目标行/列之前或之后插入

#### 调用示例

插入 3×4 表格：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "insert",
  "rows": 3,
  "cols": 4
}
```

在第 1 段后插入表格：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "paragraph_insert",
  "paragraph_index": 1,
  "paragraph_position": "after",
  "rows": 2,
  "cols": 3
}
```

删除第 1 个表格的第 2 行：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "delete_row",
  "table_index": 1,
  "row": 2
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 操作类型
- `rows` (number, 可选): 表格行数（插入时）
- `cols` (number, 可选): 表格列数（插入时）
- `table_index` (number, 可选): 表格索引，从 1 开始
- `row` (number, 可选): 行号
- `col` (number, 可选): 列号
- `paragraph_index` (number, 可选): 段落索引
- `paragraph_position` (string, 可选): 相对段落位置，before 或 after
- `begin` (number, 可选): 区间起始字符位置
- `end` (number, 可选): 区间结束字符位置
- `position` (string, 可选): 行列插入相对位置，before 或 after

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

### 10. wps.format_table

#### 功能说明

对指定表格（table_index）的单元格、行、列或整表设置格式。

可用 action：
- cell_content、cell_font、cell_alignment、cell_vertical_alignment、cell_background
- row_height、row_font、row_alignment
- column_width、column_font、column_alignment
- borders、table_alignment
- cell_border（单元格边框，需 border_index/border_key/border_value；
  颜色必须用 border_key=ColorIndex + WdColorIndex，不要用 Color/RGB；
  线宽必须用 border_key=LineWidth + WdLineWidth 枚举，不要传磅值小数）
- repeat_header_row（首行跨页重复，enabled 默认 true）
- table_sort、auto_fit、cell_margins、row_break_across_pages、convert_to_text
- merge_cells（合并矩形区域，需 start_row/start_col/end_row/end_col）
- split_cell、split_table
- merge_row（将指定行的所有单元格合并为一个，需 row）
- merge_column（将指定列的所有单元格合并为一个，需 col）
- append_text、batch_rows
- row_vertical_alignment、row_background、row_height_rule
- column_vertical_alignment、column_background
- split_cell_rows、split_cell_cols

【重要】合并含"最后/前/第N列/行"等相对位置的操作流程：
1. 必须先调 wps.read_table(action=dimensions, table_index=X) 获取 rows 和 cols 总数
2. 根据返回的总列数计算正确的 start_col/end_col（如"最后两列"= start_col=cols-1, end_col=cols）
3. 再调 merge_cells(start_row=1, start_col=计算值, end_row=rows, end_col=计算值)
禁止直接猜测列号！如5列表格的"最后两列"是 start_col=4,end_col=5 而非 1,2


#### 工具选择

- **勿用**（改用 `wps.write_table`）：创建或删除表格

#### 调用约束

- **前置检查**：先用 read_table 确认 table_index、row、col；merge/split 前确认目标区域


**幂等性**：是 — 格式与单元格内容设置可重复执行，失败或效果不符时可调整参数后再次调用


> table_index 为必填；merge_* 与 split_* 需配合行列范围参数
> merge_row 将指定 row 的所有列合并为一个单元格；merge_column 将指定 col 的所有行合并为一个单元格
> 合并跨多行或多列的矩形区域（如合并最后两列、合并前三行的第1-2列）必须使用 merge_cells + start_row/start_col/end_row/end_col，而非 merge_row/merge_column
> 使用 merge_cells 合并'最后N列'等相对位置时，需先调用 read_table(action=dimensions) 获取总行列数，再计算正确的 start_col/end_col
> batch_data 结构以 API 返回字段为准，示例仅为示意

#### 调用示例

设置单元格文本：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "cell_content",
  "table_index": 1,
  "row": 1,
  "col": 1,
  "text": "项目名称"
}
```

合并单元格区域：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "merge_cells",
  "table_index": 1,
  "start_row": 1,
  "start_col": 1,
  "end_row": 1,
  "end_col": 3
}
```

合并整行（将第1行所有列合并为一个单元格）：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "merge_row",
  "table_index": 1,
  "row": 1
}
```

合并整列（将第2列所有行合并为一个单元格）：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "merge_column",
  "table_index": 1,
  "col": 2
}
```

合并最后两列（两步工作流：先查维度再合并）：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "merge_cells",
  "table_index": 3,
  "start_row": 1,
  "start_col": 4,
  "end_row": 5,
  "end_col": 5
}
```

合并第一行前两个单元格：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "merge_cells",
  "table_index": 3,
  "start_row": 1,
  "start_col": 1,
  "end_row": 1,
  "end_col": 2
}
```

批量更新多行：

```json
{
  "file_id": "0adce7c06a112f869cd1d24bbe598cbe",
  "action": "batch_rows",
  "table_index": 1,
  "batch_data": [
    {
      "row": 2,
      "cells": [
        {
          "col": 1,
          "text": "A"
        },
        {
          "col": 2,
          "text": "B"
        }
      ]
    }
  ]
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 格式操作类型
- `table_index` (number, 必填): 表格索引，从 1 开始
- `row` (number, 可选): 行号（cell_*、row_*、merge_row 等操作需要）
- `col` (number, 可选): 列号（cell_*、column_*、merge_column 等操作需要）
- `text` (string, 可选): 单元格文本（cell_content、append_text）
- `font_style` (object, 可选): 字体样式对象
- `alignment` (number, 可选): 水平对齐方式
- `vertical_alignment` (number, 可选): 垂直对齐方式
- `color_index` (number, 可选): 背景色索引（cell_background）
- `height` (number, 可选): 行高（row_height）
- `width` (number, 可选): 列宽（column_width）
- `line_style` (number, 可选): 边框线样式（borders）
- `line_width` (number, 可选): 整表边框线宽磅值（仅 action=borders，如 3.0）。 与 cell_border 的 LineWidth（WdLineWidth 枚举）不是同一套类型，勿混用。

- `border_color` (number, 可选): 边框颜色索引（borders，WdColorIndex）
- `border_index` (number, 可选): 单元格边框位置（cell_border，底边框=3）
- `border_key` (string, 可选): 边框属性名（cell_border）：LineStyle | LineWidth | ColorIndex。 各 key 的 value 类型不同，勿混用： LineStyle→WdLineStyle；LineWidth→WdLineWidth 枚举；ColorIndex→WdColorIndex（不要用 Color/RGB）。

- `border_value` (string, 可选): 边框属性值（cell_border），必须与 border_key 匹配： LineStyle=WdLineStyle； LineWidth=WdLineWidth 枚举（0.25磅=2、0.50磅=4、0.75磅=6、1.00磅=8、1.50磅=12、2.25磅=18、3.00磅=24、4.50磅=36、6.00磅=48）， 禁止传磅值小数；服务端不做磅值↔枚举换算； ColorIndex=WdColorIndex（0..16，如 6=红、7=黄）。

- `enabled` (boolean, 可选): 是否启用首行重复（repeat_header_row）
- `table_alignment` (number, 可选): 表格整体对齐方式
- `start_row` (number, 可选): 合并区域起始行
- `start_col` (number, 可选): 合并区域起始列
- `end_row` (number, 可选): 合并区域结束行
- `end_col` (number, 可选): 合并区域结束列
- `num_rows` (number, 可选): 拆分行数（split_cell、split_cell_rows）
- `num_cols` (number, 可选): 拆分列数（split_cell、split_cell_cols）
- `split_at_row` (number, 可选): 拆分表格位置行号（split_table）
- `datas` (array, 可选): 批量行数据（batch_rows）
- `height_rule` (number, 可选): 行高规则（row_height_rule）

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

## 四、文档图片

### 11. wps.read_image

#### 功能说明

按 `action` 查询文档内嵌入图片的数量、列表或单张详情。

可用 action：
- count：图片数量
- list：图片列表（索引、尺寸等摘要）
- data：指定图片详情（需 index）



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


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 查询类型，count / list / data
- `index` (number, 可选): 图片索引，从 1 开始；action=data 时必填

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"count": 3}}

```

---

### 12. wps.write_image

#### 功能说明

按 `action` 在文档、段落或字符区间插入图片，或删除已有图片。

可用 action：
- insert：在文档插入图片（需 file_path，可选 width、height）
- delete：删除指定图片（需 index）
- delete_all：删除文档内全部图片
- paragraph_insert：在段落前/后插入（需 paragraph_index、paragraph_position、file_path）
- range_insert：在字符区间插入（需 begin、end、file_path）


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


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 操作类型
- `file_path` (string, 可选): 本地或可访问的图片文件路径（插入类 action 时必填）
- `width` (number, 可选): 插入时图片宽度（像素或磅，依 API 约定）
- `height` (number, 可选): 插入时图片高度
- `index` (number, 可选): 图片索引（action=delete 时必填）
- `paragraph_index` (number, 可选): 段落索引
- `paragraph_position` (string, 可选): before 或 after
- `begin` (number, 可选): 区间起始字符位置
- `end` (number, 可选): 区间结束字符位置

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

## 五、文档元素

### 13. wps.read_element

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

---

### 14. wps.write_element

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

---

## 六、文档属性

### 15. wps.read_info

#### 功能说明

按 `action` 查询修订、节与样式等文档级属性。

可用 action：
- revision_count：修订记录数量
- revision_status：修订跟踪是否开启
- section_count：节（分节）数量
- section_page_setup：指定节的页面设置（需 section_index）
- style_list：文档可用样式列表
- revision_all：获取全部修订信息
- revision_by_author：按作者筛选修订（需 author）


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


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 查询类型
- `section_index` (number, 可选): 节索引，从 1 开始；action=section_page_setup 时必填
- `author` (string, 可选): 修订作者（action=revision_by_author）

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"revision_count": 3}}

```

---

### 16. wps.write_info

#### 功能说明

按 `action` 修改修订跟踪、接受/拒绝修订，或节的页面设置与删除。

可用 action：
- revision_switch：开关修订跟踪（需 enable）
- revision_accept：接受指定修订（需 revision_index）
- revision_reject：拒绝指定修订（需 revision_index）
- revision_accept_all：接受全部修订
- revision_reject_all：拒绝全部修订
- revision_accept_by_author：接受指定作者修订（需 author）
- revision_reject_by_author：拒绝指定作者修订（需 author）
- section_page_setup：设置节页面属性（需 section_index、key、value）
- section_delete：删除节（需 section_index）
- section_break：在段落后插入分节符（需 paragraph_index、break_type）
- section_border：设置节页面边框（需 section_index；key/value 或 line_style）
  key=Color 时 value 必须是 RGB(BGR)，不是 WdColorIndex
- section_columns：设置分栏（需 section_index、num_columns、spacing 等）


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


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 操作类型
- `revision_index` (number, 可选): 修订索引（accept/reject 时）
- `enable` (boolean, 可选): 是否启用修订跟踪（revision_switch）
- `section_index` (number, 可选): 节索引，从 1 开始
- `key` (string, 可选): section_page_setup：页面属性名（如 PageWidth、TopMargin）。 section_border：LineStyle | LineWidth | Color（Color 值为 RGB/BGR，非 WdColorIndex）。

- `value` (string, 可选): section_page_setup：页面属性值。 section_border：与 key 匹配（Color=RGB(BGR)；LineStyle/LineWidth=枚举）。

- `author` (string, 可选): 修订作者（revision_accept_by_author / revision_reject_by_author）
- `paragraph_index` (number, 可选): 段落索引（section_break）
- `break_type` (string, 可选): 分节符类型 next_page / continuous 等（section_break）
- `line_style` (number, 可选): 页面边框线型 WdLineStyle（section_border，等价 key=LineStyle）
- `color` (number, 可选): 页面边框颜色 RGB(BGR)（section_border 简写，勿传 WdColorIndex）
- `num_columns` (number, 可选): 栏数（section_columns）
- `spacing` (number, 可选): 栏间距磅值（section_columns）

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

### 17. wps.set_list_style

#### 功能说明

通过 `scope` 指定段落级或区间级，再按 `action` 查询/设置列表或应用样式。

scope：paragraph 或 range

可用 action：
- list_query：查询当前列表信息
- list_set：设置列表（需 gallery_type，可选 template_index、level、is_continue）
- list_remove：移除列表格式
- style_set：应用命名样式（需 style_name）


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


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `scope` (string, 必填): 作用范围，paragraph 或 range
- `action` (string, 必填): list_query / list_set / style_set
- `paragraph_index` (number, 可选): 段落索引（scope=paragraph 时必填）
- `begin` (number, 可选): 区间起始（scope=range 时必填）
- `end` (number, 可选): 区间结束（scope=range 时必填）
- `gallery_type` (number, 可选): 列表类型（action=list_set 时必填，1=无序/项目符号 2=有序/编号 3=大纲编号）
- `template_index` (number, 可选): 列表模板索引（action=list_set，默认 1）
- `level` (number, 可选): 列表级别（action=list_set，默认 1）
- `is_continue` (boolean, 可选): 是否继续上一列表编号（action=list_set，默认 false）
- `style_name` (string, 可选): 样式名称（action=style_set，可先 read_info style_list 获取）

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"list_type": "bullet"}}

```

---

## 七、内容控件

### 18. wps.read_content_control

#### 功能说明


可用 action：
- get_content_controls_count：控件总数
- get_all_content_controls：全部控件列表
- get_content_control_by_index：按索引查询
- get_content_control_by_tag：按 Tag 查询
- get_content_control_by_title：按 Title 查询



**幂等性**：是


> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "get_content_control_by_index"
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 查询操作
- `index` (number, 可选): 控件索引，get_content_control_by_index 时必填
- `tag` (string, 可选): 控件 Tag，get_content_control_by_tag 时必填
- `title` (string, 可选): 控件 Title，get_content_control_by_title 时必填
- `body` (object, 可选): 完整请求体，优先使用

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

### 19. wps.write_content_control

#### 功能说明


可用 action：
- insert_plain_text_content_control：纯文本控件
- insert_rich_text_content_control：富文本控件
- insert_checkbox_content_control：复选框
- insert_date_picker_content_control：日期选择器
- insert_drop_down_content_control：下拉列表
- add_drop_down_item：添加下拉项
- remove_drop_down_item：移除下拉项
- set_content_control_value：设置值
- set_content_control_value_by_tag：按 Tag 设置值
- set_content_control_props：设置属性
- delete_content_control：按索引删除
- delete_content_control_by_tag：按 Tag 删除
- delete_all_content_controls：删除全部



**幂等性**：否 — 写操作非幂等，重试前请确认当前文档状态


> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_checkbox_content_control"
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 写操作
- `index` (number, 可选): 控件索引
- `tag` (string, 可选): 控件 Tag
- `title` (string, 可选): 控件 Title
- `value` (string, 可选): 控件值
- `body` (object, 可选): 完整请求体，优先使用

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

## 八、文档形状

### 20. wps.read_shape

#### 功能说明


可用 action：
- get_shapes_count：形状总数
- get_all_shapes_info：全部形状列表
- get_shape_info：单个形状详情
- get_shape_text：形状内文本



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


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 查询操作
- `shape_index` (number, 可选): 形状索引，get_shape_info/get_shape_text 时必填
- `body` (object, 可选): 完整请求体，优先使用

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

### 21. wps.write_shape

#### 功能说明


可用 action：
- insert_basic_shape：插入基本图形
- insert_line：插入线条
- insert_text_box：插入文本框
- insert_shape_picture：插入图片形状（需公网可访问的图片 URL）
- set_shape_props：设置属性
- set_shape_text：设置文本
- set_shape_fill_color：设置填充色（传 color=RGB(BGR) 整数，如黄=65535、红=255；勿传 WdColorIndex）
- set_shape_line_color：设置线条颜色（同上，color=RGB(BGR)，非 WdColorIndex）
- set_shape_line_width：设置线宽
- set_shape_wrap_type：设置环绕方式
- set_shape_zorder：设置叠放次序
- delete_shape：删除指定形状
- delete_all_shapes：删除全部形状



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


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 写操作
- `shape_index` (number, 可选): 形状索引
- `color` (number, 可选): 填充/线条颜色 RGB(BGR) 整数值（set_shape_fill_color / set_shape_line_color）。 例：黄=65535、红=255、蓝=16711680、黑=0。不是 WdColorIndex（0..16）。

- `value` (string, 可选): 与 color 等价的颜色值字符串（部分路径用 value 透传）
- `begin_x` (number, 可选): 线条起点 X（insert_line）
- `begin_y` (number, 可选): 线条起点 Y（insert_line）
- `end_x` (number, 可选): 线条终点 X（insert_line）
- `end_y` (number, 可选): 线条终点 Y（insert_line）
- `left` (number, 可选): 左边距
- `top` (number, 可选): 上边距
- `width` (number, 可选): 宽度
- `height` (number, 可选): 高度
- `text` (string, 可选): 形状文本
- `file_path` (string, 可选): 图片 URL（insert_shape_picture 时必填，须公网可访问）
- `body` (object, 可选): 完整请求体，优先使用

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

## 九、脚注尾注

### 22. wps.read_footnote

#### 功能说明


可用 action：
- get_footnotes_count：脚注总数
- get_endnotes_count：尾注总数
- get_all_footnotes：全部脚注列表
- get_all_endnotes：全部尾注列表
- get_footnote_by_index：按索引查脚注
- get_endnote_by_index：按索引查尾注



**幂等性**：是


> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "get_all_endnotes"
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 查询操作
- `index` (number, 可选): 脚注/尾注索引
- `body` (object, 可选): 完整请求体，优先使用

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

### 23. wps.write_footnote

#### 功能说明


可用 action：
- insert_footnote_by_paragraph：在段落处插脚注
- insert_footnote_by_range：在区间插脚注
- insert_endnote_by_paragraph：在段落处插尾注
- insert_endnote_by_range：在区间插尾注
- modify_footnote_text：修改脚注文本
- modify_endnote_text：修改尾注文本
- delete_footnote：删除脚注
- delete_endnote：删除尾注
- delete_all_footnotes：删除全部脚注
- delete_all_endnotes：删除全部尾注



**幂等性**：否 — 写操作非幂等，重试前请确认当前文档状态


> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_endnote_by_paragraph"
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 写操作
- `index` (number, 可选): 脚注/尾注索引
- `paragraph_index` (number, 可选): 段落索引
- `begin` (number, 可选): 区间起始
- `end` (number, 可选): 区间结束
- `text` (string, 可选): 脚注/尾注文本
- `body` (object, 可选): 完整请求体，优先使用

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

## 十、页眉页脚

### 24. wps.read_header_footer

#### 功能说明


可用 action：
- get_header_content：页眉内容
- get_footer_content：页脚内容



**幂等性**：是


> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "get_footer_content"
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 查询操作
- `section_index` (number, 可选): 节索引，从 1 开始，默认 1
- `header_footer_type` (number, 可选): 页眉/页脚类型：1=主（默认）、2=首页、3=偶数页。 文档已开启「首页不同」时，查首页内容用 2。

- `body` (object, 可选): 完整请求体，优先使用

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {"header_content": "技术文档"}}

```

---

### 25. wps.write_header_footer

#### 功能说明

设置/删除页眉页脚。推荐顶层传参；也可传 `body` 覆盖完整请求体。

可用 action：
- set_header_content / set_footer_content：设置内容（需 content）
- set_header_font_style / set_footer_font_style：设置字体（需 font_style，或顶层 font_name/italic/color_index 等）
- set_header_alignment / set_footer_alignment：对齐（需 alignment；0=左 1=中 2=右）
- insert_page_number_in_header / insert_page_number_in_footer：插入页码（可选 alignment）
- link_to_previous_header / link_to_previous_footer：链接上一节（可选 enabled，默认开启链接）
- set_different_first_page_header_footer：首页不同（需 enabled=true/false）
- set_different_odd_even_header_footer：奇偶页不同（需 enabled=true/false）
- remove_header / remove_footer：删除

对齐：WdParagraphAlignment，0=左、1=居中、2=右、3=两端对齐。0 是有效左对齐，勿省略。
字体颜色：用 font_style.color_index（WdColorIndex 0..16），不是 RGB。
每次 font 调用只生效 font_style 中的第一个属性；多属性请分多次调用。



**幂等性**：否 — 写操作非幂等，重试前请确认当前文档状态


> 未传 body 时由顶层参数组装；alignment/enabled/font_style 必须出现在请求中才会生效
> alignment=0 表示左对齐，不是「未设置」
> 页眉页脚字体颜色用 color_index（WdColorIndex），不是 RGB
> 推荐传 `body` 对象承载完整请求体

#### 调用示例

第1节启用首页不同页眉页脚：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "set_different_first_page_header_footer",
  "section_index": 1,
  "enabled": true
}
```

第2节页眉右对齐：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "set_header_alignment",
  "section_index": 2,
  "alignment": 2
}
```

第1节页脚设为斜体：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "set_footer_font_style",
  "section_index": 1,
  "font_style": {
    "italic": true
  }
}
```

页眉字体颜色（WdColorIndex 红=6）：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "set_header_font_style",
  "section_index": 1,
  "font_style": {
    "color_index": 6
  }
}
```

页脚插入页码：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_page_number_in_footer",
  "section_index": 1,
  "alignment": 1
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 写操作（见 detail 列表）
- `section_index` (number, 可选): 节索引，从 1 开始，默认 1
- `header_footer_type` (number, 可选): 页眉/页脚类型（WPS Headers/Footers.Item）：1=主页眉页脚（默认）、 2=首页、3=偶数页。开启「首页不同」后写首页内容时用 2。

- `content` (string, 可选): 页眉/页脚文本（set_header_content / set_footer_content）
- `alignment` (number, 可选): 对齐（set_*_alignment / insert_page_number_*）： 0=左、1=居中、2=右、3=两端对齐。必须显式传数字；传 0 表示左对齐（不会被当成缺省）。

- `enabled` (boolean, 可选): 开关。set_different_first_page_header_footer / set_different_odd_even_header_footer 时必填 true/false；link_to_previous_* 时 true=链接上一节、false=取消链接。

- `font_style` (object, 可选): 字体样式（set_header_font_style / set_footer_font_style）。 支持：font_name(string)、font_size(float)、bold(bool)、italic(bool)、 underline(string/int, WdUnderline)、color_index(string/int, WdColorIndex 0..16)。 color_index 示例：6=红、7=黄、2=蓝；不要传 RGB。 也可把 font_name / italic / color_index 等放在顶层，服务端会折叠进 font_style。

- `font_name` (string, 可选): 字体名简写（等同 font_style.font_name）
- `font_size` (number, 可选): 字号简写（等同 font_style.font_size）
- `bold` (boolean, 可选): 加粗简写（等同 font_style.bold）
- `italic` (boolean, 可选): 斜体简写（等同 font_style.italic）
- `color_index` (number, 可选): 字体颜色索引简写（等同 font_style.color_index，WdColorIndex 0..16）。 不是 RGB；段落/形状 RGB 颜色接口与此不同，勿混用。

- `key` (string, 可选): 字体属性名备选（如 Italic、Bold、ColorIndex、Name），与 value 成对使用
- `value` (string, 可选): 与 key 成对；布尔用 true/false，枚举用数字字符串
- `body` (object, 可选): 完整请求体，优先使用（可含 properties / font_style / alignment / enabled 等）

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

## 十一、域

### 26. wps.read_field

#### 功能说明


可用 action：
- get_fields_count：域总数
- get_all_fields：全部域列表
- get_field_by_index：按索引查询



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


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 查询操作
- `index` (number, 可选): 域索引，get_field_by_index 时必填
- `body` (object, 可选): 完整请求体，优先使用

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

### 27. wps.write_field

#### 功能说明


可用 action：
- insert_field_by_paragraph：在段落处插入域
- insert_field_by_range：在区间插入域
- update_field：更新单个域
- update_all_fields：更新全部域
- toggle_field_code：切换域代码显示
- unlink_field：断开域链接
- delete_field：删除域



**幂等性**：否 — 写操作非幂等，重试前请确认当前文档状态


> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装

#### 调用示例

示例调用：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_field_by_paragraph"
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 写操作
- `index` (number, 可选): 域索引
- `paragraph_index` (number, 可选): 段落索引
- `begin` (number, 可选): 区间起始
- `end` (number, 可选): 区间结束
- `field_code` (string, 可选): 域代码
- `body` (object, 可选): 完整请求体，优先使用

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---

## 十二、水印

### 28. wps.write_watermark

#### 功能说明


可用 action：
- insert_text_watermark：插入文字水印（可选 color=RGB 整数，默认灰 12632256；勿传 WdColorIndex）
- insert_image_watermark：插入图片水印（需公网可访问的图片 URL）
- delete_watermark：删除水印



**幂等性**：否 — 写操作非幂等，重试前请确认当前文档状态


> 推荐传 `body` 对象承载完整请求体；未传时从顶层参数组装
> insert_image_watermark 需 file_path 为公网可访问的图片 URL；action 选定后由服务自动补全图片水印所需字段

#### 调用示例

插入文字水印：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_text_watermark",
  "text": "机密"
}
```

插入图片水印：

```json
{
  "file_id": "023bf8fd81ab3d089b9d284a29d9b143",
  "action": "insert_image_watermark",
  "file_path": "https://example.com/watermark.png"
}
```


#### 参数说明

- `url` (string, 三选一必填: `url` / `link_id` / `file_id`): 文档 URL；与 link_id、file_id 三选一
- `link_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 分享 id；与 url、file_id 三选一
- `file_id` (string, 三选一必填: `url` / `link_id` / `file_id`): 文件 id；与 url、link_id 三选一
- `action` (string, 必填): 写操作
- `text` (string, 可选): 水印文字（insert_text_watermark 时）
- `color` (number, 可选): 文字水印颜色 RGB 整数（默认 12632256 灰色），不是 WdColorIndex
- `file_path` (string, 可选): 图片 URL（insert_image_watermark 时必填，须公网可访问）
- `body` (object, 可选): 完整请求体，优先使用

#### 返回值说明

```json
{"code": 0, "message": "成功", "data": {}}

```

---


## 工具速查表

| # | 工具名 | 分类 | 功能 | 必填参数 |
|---|--------|------|------|----------|
| 1 | `wps.export` | export | 统一导出在线文字文档 | `url`\|`link_id`\|`file_id`, `format` |
| 2 | `wps.export_image` | export | 将在线文字导出为图片 | `url`\|`link_id`\|`file_id`, `format` |
| 3 | `wps.query_export` | export | 统一查询异步导出结果 | `format`, `task_id` |
| 4 | `wps.read_text` | doc_text | 读取在线文字文档的文本内容 | `url`\|`link_id`\|`file_id`, `action` |
| 5 | `wps.write_text` | doc_text | 在在线文字文档中插入、追加或删除文本 | `url`\|`link_id`\|`file_id`, `action` |
| 6 | `wps.search_replace` | doc_text | 在在线文字文档中搜索或替换文本 | `url`\|`link_id`\|`file_id`, `action`, `find_text` |
| 7 | `wps.format_text` | doc_text | 设置在线文字文档的文本格式 | `url`\|`link_id`\|`file_id`, `scope`, `action` |
| 8 | `wps.read_table` | doc_table | 查询在线文字文档中的表格信息 | `url`\|`link_id`\|`file_id`, `action` |
| 9 | `wps.write_table` | doc_table | 在在线文字文档中创建或删除表格 | `url`\|`link_id`\|`file_id`, `action` |
| 10 | `wps.format_table` | doc_table | 设置在线文字文档中表格的格式 | `url`\|`link_id`\|`file_id`, `action`, `table_index` |
| 11 | `wps.read_image` | doc_image | 查询在线文字文档中的图片信息 | `url`\|`link_id`\|`file_id`, `action` |
| 12 | `wps.write_image` | doc_image | 在在线文字文档中插入或删除图片 | `url`\|`link_id`\|`file_id`, `action` |
| 13 | `wps.read_element` | doc_element | 查询在线文字文档中的元素（书签、目录、超链接、批注） | `url`\|`link_id`\|`file_id`, `type`, `action` |
| 14 | `wps.write_element` | doc_element | 在在线文字文档中创建、修改或删除元素 | `url`\|`link_id`\|`file_id`, `type`, `action` |
| 15 | `wps.read_info` | doc_info | 查询在线文字文档的属性信息 | `url`\|`link_id`\|`file_id`, `action` |
| 16 | `wps.write_info` | doc_info | 修改在线文字文档的属性 | `url`\|`link_id`\|`file_id`, `action` |
| 17 | `wps.set_list_style` | doc_info | 设置在线文字文档的列表或段落样式 | `url`\|`link_id`\|`file_id`, `scope`, `action` |
| 18 | `wps.read_content_control` | doc_content_control | 查询在线文字文档中的内容控件（ContentControl） | `url`\|`link_id`\|`file_id`, `action` |
| 19 | `wps.write_content_control` | doc_content_control | 插入、修改或删除在线文字文档中的内容控件 | `url`\|`link_id`\|`file_id`, `action` |
| 20 | `wps.read_shape` | doc_shape | 查询在线文字文档中的浮动形状对象（线条、文本框、基本图形等，非位图图片） | `url`\|`link_id`\|`file_id`, `action` |
| 21 | `wps.write_shape` | doc_shape | 插入、修改或删除在线文字文档中的浮动形状对象 | `url`\|`link_id`\|`file_id`, `action` |
| 22 | `wps.read_footnote` | doc_footnote | 查询在线文字文档中的脚注与尾注 | `url`\|`link_id`\|`file_id`, `action` |
| 23 | `wps.write_footnote` | doc_footnote | 插入、修改或删除在线文字文档中的脚注与尾注 | `url`\|`link_id`\|`file_id`, `action` |
| 24 | `wps.read_header_footer` | doc_header_footer | 查询在线文字文档的页眉与页脚内容 | `url`\|`link_id`\|`file_id`, `action` |
| 25 | `wps.write_header_footer` | doc_header_footer | 设置或删除在线文字文档的页眉页脚 | `url`\|`link_id`\|`file_id`, `action` |
| 26 | `wps.read_field` | doc_field | 查询在线文字文档中的域（Field，如页码、日期、交叉引用等） | `url`\|`link_id`\|`file_id`, `action` |
| 27 | `wps.write_field` | doc_field | 插入、更新或删除在线文字文档中的域 | `url`\|`link_id`\|`file_id`, `action` |
| 28 | `wps.write_watermark` | doc_watermark | 插入或删除在线文字文档的水印 | `url`\|`link_id`\|`file_id`, `action` |

## 典型用途

| 场景 | 说明 |
|------|------|
| 空白文档创建 | 新建在线文字后再进入后续编辑流程 |
| 文档导出 | 通过 `wps.export`、`wps.export_image`、`wps.query_export` 完成 |
| AP 生成 | 通过 `wps.export(format=ap)` 与 `wps.query_export(format=ap)` 完成 |
| 内容读写 | 通过 `wps.read_text` / `wps.write_text` 等结构化工具完成 |
| 查找替换 | 通过 `wps.search_replace` 完成 |
| 段落格式 | 通过 `wps.format_text` 完成 |
| 字符样式 | 通过 `wps.format_text` 完成 |
