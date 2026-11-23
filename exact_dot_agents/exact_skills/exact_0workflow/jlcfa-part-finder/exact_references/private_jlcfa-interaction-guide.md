# 嘉立创FA交互参考

本文件记录 `www.jlcfa.com` 当前实测的查找接口。接口属于站点内部实现，可能变化；每次使用前先打开当前页面、检查请求和页面结果。所有示例只用于读取，不用于购物车或下单。

## 1. 页面入口

- 首页：`https://www.jlcfa.com/`
- 全局搜索：`https://www.jlcfa.com/search?q=<URL编码关键词>`
- 商品详情：`https://www.jlcfa.com/item/<goodsBizKey>.html`
- 分类入口：首页“全部商品分类”链接到 `/category.html`，分类结果的实际 URL 以当前页面为准。
- BOM 匹配：`/bommatch`，这是站内辅助工具；不要默认上传或提交用户 BOM，除非用户明确要求。

FA 的详情 ID 是 `goodsBizKey`（例如 `1582666995083`），不要用 LCSC 的 C 编号或 LCSC 的 `productId` 替代。

## 2. 搜索请求

当前搜索结果页会发送：

```http
POST https://www.jlcfa.com/api/fa-platform/web/search-page/products
Content-Type: application/json
```

请求体示例：

```json
{
  "searchKeyWord": "SS-5GL2",
  "frontendCategoryBizKey": "",
  "brandIds": [],
  "secondFrontCategoryBizKey": "",
  "secondFrontIsCheckAll": false,
  "serialConditionSelectVos": [],
  "checkAll": false,
  "pageNum": 1,
  "pageSize": 20
}
```

可先用页面操作获取当前字段和 headers；不要硬编码 cookies、登录令牌或个人信息。搜索结果常见响应结构：

```text
data.totalRows / totalPages
 data.productSerialVOList[]
```

每个 `productSerialVOList[]` 候选重点读取：

- `modelBizKey` / `bizKey`：详情页 ID，通常可拼为 `/item/<bizKey>.html`
- `productModel`：型号
- `serialName`：页面显示的品名、品牌和系列，可能含 HTML 标记
- `attributeList[]`：规格属性，字段为 `attrName`、`attrValue`
- `categoryCode` / `parentCategoryCode`：分类编码
- `price`：含税起价（搜索列表展示口径）
- `taxExcludedPrice`：未税起价
- `warehouseStock`：库存数量；结合 `units[].unit` 解读
- `units[]`：单位、`minimumOrderNum`、`saleIncrement`
- `minimumOrderNum` / `saleIncrement`：详情或下单约束，缺失时不要自行假设为 1
- `showDeliveryTime.deliveryDesc`：页面交期描述
- `hasSubstitute`：页面是否显示有替代品；它不是兼容性证明
- `showViewFileList[]`：公开图片或文件路径（需要时作为证据入口）
- `productCodeAccessId`：内部访问标识，不要把它误报成用户可采购型号

搜索接口还会请求筛选信息：

```http
POST /api/fa-platform/search/frontend-category/search/filters
```

请求体包含 `searchKeyWord`、分类/品牌筛选和 `attrMultiSelectionModels`，响应里的 `brandVOList`、属性筛选可帮助缩小结果。品牌筛选使用当前响应给出的 `brandAccessId`；不要从其他站点猜品牌 ID。

## 3. 详情页核价

打开详情页后，页面会按候选型号读取分档价格和报价：

```http
POST /api/fa-platform/web/detail-page/brand-product/detail-promotion
POST /api/fa-platform/web/detail-page/quotation/query-lite
POST /api/faMall/serial/queryBestPriceRelatedProduct
GET  /api/faMall/goods/queryMaterialNum?productModel=<型号>
```

其中 `detail-promotion` 的 `discountVOS[]` 常见字段：

- `lowerLimit` / `upperLimit`：数量区间，`-1` 表示无上限
- `includingTaxUnitPrice`：含税单价
- `taxExcludedPrice`：未税单价
- `deliveryDescribe`：该数量档的交期

详情查询还可能返回：

- `minimumOrderNum`、`saleIncrement`、`minimumOrderNumSpecification`
- `showDeliveryTime.deliveryDesc`、`deliveryHour`、`deliveryDay`
- `warehouseStock`（搜索结果常见）
- `packageSpecification`、`unit` 或包装说明
- `useCouponInfo`、促销标记（只记录为页面报价信息，不做券优化）

实价报告必须说明数量档、含税/未税口径和采集时间。搜索页的“¥X起”不能直接当成用户采购数量的单价。

## 4. 图纸、规格表与尺寸核验

详情页/系列页不是只有搜索摘要，常见只读资源包括：

- `规格表`：当前选定型号的结构化参数和尺寸表
- `参数图`：尺寸代号、安装孔、剖面和视图说明
- `PDF图档`：产品手册或工程图（有些页面以按钮或图片形式提供）
- `下载模型`、`3D模型预览`：用于查看外形；精确尺寸仍以尺寸表/工程图为准
- `材质图`、`产品详情`、`订货引导`：补充材料、安装和订货条件

遇到机械尺寸需求，必须先选定具体型号/变体，再读取图纸和表格。搜索 API 的属性字段只能初筛，不能替代工程图。报告中要把用户尺寸对应到图纸字段，并注明字段定义。例如某微型立式带座轴承 UP 系列的参数图中：

```text
d = 轴承内径
L = 座体总长
J = 两个底部安装孔中心距
H/H1/H2 = 高度相关尺寸
A = 座宽或底部尺寸
S/N/Bi = 图纸定义的其他安装/轴承尺寸
```

这些字母只在该图纸表头和视图确认后才能这样解释，不能跨产品系列套用。以 UP004 的公开参数图为例，表中 `d=20`、`L=100`、`J=80`：20 mm 是轴承内径，底部孔中心距是 80 mm。若用户要求孔距 20 mm，UP004 应判为不符合。

详情页图片资源通常来自 `static.jlcfa.com` 的 `Serial/...`、`SKU/...` 或 `RichText/Serial/...` 路径；这些公开图片可作为尺寸证据。图片可能返回 WebP/JPEG 内容，即使 URL 后缀或页面展示名称写成 PNG，不要把格式当作尺寸字段。

## 5. 系列页与选型变体

系列页常见路径为 `/serial/<serialBizKey>.html`，并通过只读请求加载选型参数：

```http
POST /api/fa-platform/web/detail-page/selection/serial-lite
```

请求通常包含 `serialBizKey`、`serialCode`、`model`、`productCode` 和 `paramSelectionList`。响应中的 `paramValueInfoList` 是可选属性值；用户选定后，页面会生成具体 `productModel`，再读取对应价格、库存和图纸。系列页的“共 N 种规格”代表已有标准变体，不代表任意尺寸定制。

对轴承座、导轨、法兰、型材等产品，先利用系列选型收窄到具体型号，再查该型号的参数图和规格表；不能用系列名或型号后缀推导安装孔距。


优先使用页面可见文本和实际网络响应；DOM 结构变化时不要依赖深层 CSS 路径。常用入口：

- 搜索框：`input`/`combobox`，页面可见名称通常为“搜索关键词”
- 搜索按钮：按钮文本“搜索”
- 结果列表：商品表格或列表，商品链接形如 `/item/<id>.html`
- 详情页：商品属性、价格档、库存、交期和“相似商品”区域

必要时用浏览器网络面板记录一次请求，再回读响应；不要仅凭静态 HTML 推断异步加载的数据。
