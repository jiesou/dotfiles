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

#### 操作类型子命令

- 工具命令：CLI `<action>` 为工具名（如 `read-table` → `wps.read_table`）
- 操作类型：`wps.read_table` / `wps.write_text` / `wps.format_text` 等结构化工具须在 JSON 中传 `action` 选择具体操作（如 `count`）
- 第四段子命令：`kdocs-cli wps <工具命令> <操作类型>` 自动填入 JSON `action`；完整列表见该工具 `--help` 中的「操作类型（JSON 参数 action）」

```
kdocs-cli wps read-table count --help
kdocs-cli wps read-table count file_id=xxx
kdocs-cli wps read-table '{"action":"count","file_id":"..."}'
kdocs-cli call wps.read_table.count '{"file_id":"..."}'
```

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

下表按能力域列出结构化工具。查参数与示例须先访问「参考」进入工具页，再从「支持的 action」表进入对应 action 详情页。

| 能力域 | 工具 | 参考 |
|--------|------|------|
| 文本 | `wps.read_text` / `wps.write_text` / `wps.search_replace` / `wps.format_text` | [read_text](wps/read_text.md) · [write_text](wps/write_text.md) · [search_replace](wps/search_replace.md) · [format_text](wps/format_text.md) |
| 表格 | `wps.read_table` / `wps.write_table` / `wps.format_table` | [read_table](wps/read_table.md) · [write_table](wps/write_table.md) · [format_table](wps/format_table.md) |
| 图片 | `wps.read_image` / `wps.write_image` | [read_image](wps/read_image.md) · [write_image](wps/write_image.md) |
| 形状 | `wps.read_shape` / `wps.write_shape` | [read_shape](wps/read_shape.md) · [write_shape](wps/write_shape.md) |
| 元素 | `wps.read_element` / `wps.write_element` | [read_element](wps/read_element.md) · [write_element](wps/write_element.md) |
| 内容控件 | `wps.read_content_control` / `wps.write_content_control` | [read_content_control](wps/read_content_control.md) · [write_content_control](wps/write_content_control.md) |
| 脚注尾注 | `wps.read_footnote` / `wps.write_footnote` | [read_footnote](wps/read_footnote.md) · [write_footnote](wps/write_footnote.md) |
| 页眉页脚 | `wps.read_header_footer` / `wps.write_header_footer` | [read_header_footer](wps/read_header_footer.md) · [write_header_footer](wps/write_header_footer.md) |
| 域 | `wps.read_field` / `wps.write_field` | [read_field](wps/read_field.md) · [write_field](wps/write_field.md) |
| 水印 | `wps.write_watermark` | [write_watermark](wps/write_watermark.md) |
| 文档属性 | `wps.read_info` / `wps.write_info` / `wps.set_list_style` | [read_info](wps/read_info.md) · [write_info](wps/write_info.md) · [set_list_style](wps/set_list_style.md) |

### 图片类写操作

以下 action 需传入**公网可访问的图片 URL**（服务端会拉取图片）：

| 工具 | action | 顶层参数 | 说明 |
|------|--------|----------|------|
| `wps.write_watermark` | `insert_image_watermark` | `file_path` | 插入图片水印 |
| `wps.write_shape` | `insert_shape_picture` | `file_path` | 插入浮动图片形状 |

也可通过 `body` 传入完整请求体，`body` 优先于顶层参数；图片类 action 的底层字段由服务自动补全。

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
