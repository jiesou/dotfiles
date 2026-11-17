# LCSC 立创商城交互指南

本指南只记录商城搜索、购物车、商品数据、结算、领券与历史购买查询的操作方式和响应字段。优惠券资格、金额目标、运费与拆单政策统一见[coupons.md](coupons.md)。采购排除及决策流程见[技能主文档](../SKILL.md)。以下站点接口均为内部实现，可能变化；操作前先用当前页面核实。

## 一、品牌页与搜索

### 品牌页

- 毫欧（Milliohm）：`https://list.szlcsc.com/brand/12131.html`
- 杭晶（HCI）：`https://list.szlcsc.com/brand/12047.html`
- 合科泰（Hottech）：`https://list.szlcsc.com/brand/11439.html`
- 品牌内搜索：进入品牌页后使用 `input[placeholder="在结果中再搜索"]`。
- 品牌内排序：点击 `button#searchListButton`。
- 分类+品牌过滤：`https://list.szlcsc.com/catalog/<分类ID>.html?brand=<品牌ID>`；分类ID示例：陶瓷谐振器(无源)=530、无源晶振=537、贴片电阻=439。

### 搜索 API

优先使用搜索 API（可 curl；网页请求可能受 WAF 限制）：

```bash
curl -sS 'https://so.szlcsc.com/query/product' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Origin: https://so.szlcsc.com' \
  -H 'Referer: https://so.szlcsc.com/global.html?k=ABS210' \
  -A 'Mozilla/5.0' -X POST --data '{
    "currentPage":1,"pageSize":30,
    "catalogIdFilter":"","brandIdFilter":"","standardFilter":"","arrangeFilter":"",
    "labelFilter":"","authenticationFilter":"","keyword":"ABS210",
    "sortNumber":6,
    "satisfyStockType":"","startPrice":"","endPrice":"","demandNumber":"",
    "spotFilter":1,"discountFilter":1,"hasDataFile":false,
    "brandPlaceFilter":"","secondKeyword":"","queryParameterValue":"","lastParamName":""
  }'
```

- `result.searchResult.productRecordList[].productVO` 包含 `productCode`、`productModel`、`productGradePlateName`、`encapsulationModel`、`stockNumber`、`recentlySalesCount`、`productPriceList`、`productMinEncapsulationNumber`、`convesionRatio`、`productUnit` 等字段；同时关注 `totalCount`、`countPage`、`pageSize`。
- 排序 `sortNumber`：0综合（默认）、1价格升序、2价格降序、6销量、8/9库存（jx/sx）、10–13广东仓/江苏仓库存（jx/sx）。响应的 `querySortBySign` 可用于确认排序是否生效。
- 销量顺序通常与 `recentlySalesCount` 一致；若有置顶/推广位，以接口返回顺序为准。
- 分页用 `currentPage`；每页 `pageSize` 最大30。请求不要太密集，连续快速请求偶发空响应时，间隔1–2秒后重试。
- 请求需带 `Origin`、`Referer`、`User-Agent`。

### 浏览器搜索

- 全局搜索：`https://so.szlcsc.com/global.html?k=<关键词>`。
- 网页排序需点击排序条上的“销量”（触发 `sortNumber=6`）；只改 URL 中的 `sortNumber` 不会让服务端排序生效。
- 页面数据可从 `window.__NEXT_DATA__.props.pageProps.soData.searchResult.productRecordList` 读取，与 API 结构相近。

### 其他公开检索入口

- EasyEDA：`https://easyeda.com/api/eda/product/search?keyword=<词>&page=1&pageSize=10`，返回型号、封装、价格梯度、库存和 C 编号，无销量。
- LCSC 商品页：`https://www.lcsc.com/product-detail/C<编号>.html`，页面内嵌 schema.org JSON-LD `PropertyValue`，可提取 VR/IO/IFSM/Vf/封装等规格。
- JLC SMT：`POST https://jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList`，body 示例 `{"currentPage":1,"pageSize":30,"keyword":"<词>"}`，返回 C 编号、库存、价格、基础库/扩展库；忽略排序参数。

### 产品详情页

- 商品页通常使用内部 `productId`（如 `https://item.szlcsc.com/<productId>.html`），不是把 C 编号拼到路径；优先使用搜索结果中的实际 URL。
- C 编号不一定是数字 ID。部分 `item.szlcsc.com` 链接会重定向到 MRO 或其他产品。

## 二、购物车操作

### 读取购物车

- 分组列表：`GET https://cart-api.szlcsc.com/cart/group/list`。
- 购物车内容：`GET https://cart-api.szlcsc.com/cart/display?isInit=true&cartCode=<cartCode>`。
- 购物车代码保存在 cookie 中；从已登录页面/API 响应获取，不猜测。
- API 响应中的 `convesionRatio` 表示每“份”对应的元件数。

普通购物车的关键响应字段：

```json
{
  "currentlyProductList": [{
    "shopCarId": "xxx",
    "productCode": "Cxxxxxx",
    "productModel": "型号名",
    "productNumber": 3,
    "convesionRatio": 20,
    "productConsultPrice": 0.1507,
    "lineMoney": 9.04,
    "productGradePlateName": "Milliohm(毫欧)",
    "encapsulationModel": "0805",
    "productPriceDiscountList": [{"discount": 0.95, "price": 0.07942}],
    "priceDiscount": null,
    "stockNumber": 4540,
    "isChecked": true,
    "checked": true
  }],
  "cartTotalSize": 9,
  "cartSelfMoney": 52.60,
  "discountMoney": 2.95
}
```

分组购物车结构见“同一购物车内按订单分组”。

### 修改购物车

- 页面数量控件：`input[class*="num"]`；spinbutton 通常按 API 返回的商品顺序排列。
- UI 修改数量：点击 spinbutton 右侧“+”按钮；每次增加一个最小包装单位（`convesionRatio`）。可用控件 bounding box 定位，按钮大致在 `x = box.x + box.width + 20, y = box.y + box.height / 2`。
- API 加入：`POST https://cart-api.szlcsc.com/cart/add/normal`，JSON：`{"cartKeyStr":"0~<productId>~RMB~CN~<份数>","cartCode":"...","requestSource":"pc"}`。其中 `productId` 不是 C 编号，应取搜索 API 的 `productVO.productId`。
- API 改数量：`POST https://cart-api.szlcsc.com/cart/update`，form：`cartKey=<shopCarMapKey>&productNumber=<份数>&cartCode=<cartCode>`；数量不能为0。
- 删除没有可靠公开接口，使用 UI：行内“删除”，再点击弹窗中同名“删除”按钮（不是 OK/Cancel）。
- 从产品页加入：填写页面输入框后点击“加入购物车”。
- 所有修改后重新读取购物车，确认实际数量和行金额；请求超时先检查是否已执行，避免盲目重试。
- 购物车自定义编号：实测先由 UI 在商品行打开「自定义编号」、输入并失焦保存，触发 `POST https://cart-api.szlcsc.com/async/edit/material`，form 为 `materialCode=<文字>&productId=<数字>&productCode=<C编号>`；成功返回 `ok:true`。可用当前 UI 请求验证后的接口批量填写并回读 `materialCode`。
- 编号**按账号及商品共享**，同商品在其他购物车也会显示相同编号。原购物车受保护时应先核对影响范围；本次任务用户明确允许同步。商城允许中文、空格、连字符；`/` 会报“物料编码内包含特殊字符”。提交前保护已有非空编号。
- 新增商品可能自动勾选；逐一恢复勾选状态时要等待每次保存，再用 `isInit=false` 回读，避免连续修改导致状态丢失。仅操作目标商品，保留用户其他分组的勾选状态。
- 购物车范围和采购边界见[技能主文档](../SKILL.md)。

## 三、产品数据及计费字段

- 产品页常见字段：现货 `现货[：:]\s*([\d,]+)`；起订量 `起订量[：:]\s*(\d+)` 或 `最小起订量\s*(\d+)`；价格梯度 `(\d+)[+]\s*[￥¥](\d+\.\d+)`。
- 页面价格梯度常见格式如 `50+¥0.07942`。价格分为售价和折扣价；折扣价可从 `productPriceDiscountList[].price` 等字段读取。
- `productConsultPrice` 是参考价，`productPriceList` 是梯度，`productDiscountPrice` 是活动计费价；不能假设某档价格已自动选中。
- 搜索响应中的促销价位于 `productRecordList[].priceDiscount.priceList[].price`，不在 `productVO` 中。候选价仅供预测。
- 购物车实际计费以当前 `lineMoney`（已含折扣及行金额取分）为准；改数量或价格变化后重新读取。不要从截短单价反算，也不要为恢复旧金额改动受保护的原购物车。
- 实际件数通常按 `productNumber × convesionRatio` 计算；`minBuyNumber` 的单位需根据页面/响应验证，不能只看包装倍数。部分商品的 `minBuyNumber` 大于1（例如某些 WS2812C 为100）；对MOQ和数量倍数分别核实。

## 四、结算页

- UI 入口：点击购物车页面“结算”。结算页常见 URL：`https://order.szlcsc.com/member/perfect.html?traceId=xxx`。
- 默认“优惠组合”会自动选券；需要时取消自动组合并检查券面板中的实际选择。页面选券结果才是该订单资格和金额的证据。
- 摘要通常包含总金额、运费、商品折扣、优惠券、包装费和应付总金额。
- 订单商品行通常包含序号、型号/品牌/封装/编号、数量、折扣单价/原价、金额和交货方式；品牌字段可用 `productGradePlateName`。
- 页面按钮文本可能为“提交订单”。券的资格、互斥和运费判断见[coupons.md](coupons.md)。

## 五、券 API 查询

以下调用需在已登录商城的浏览器页面上下文中使用 `fetch(url, {credentials:'include'})`；curl 直连可能被 WAF/ACL 拦截。规则解释见[coupons.md](coupons.md)。

- 券中心全量：`GET https://activity.szlcsc.com/activity/coupon?couponType=&sortColumn=&sortType=&searchValue=&searchCatalogStr=&searchBrandNameStr=&catalogId=`。`result.couponModelVOListMap` 分区数组字段包括 `couponName`、`couponAmount`、`minOrderMoney`、`brandIds`、`brandNames`、`couponType`、`uuid`。
- 领券：`GET https://activity.szlcsc.com/getCoupon/<uuid>`，成功响应示例 `{"result":"success"}`。
- 账户未用券：`GET https://activity.szlcsc.com/member/couponList/page?currentPage=1&pageSize=60&isExpire=false&couponTypeList=&keywords=&couponUseStatus=no`。`result.pageVO.dataList[]` 包含 `useBeginTime`、`useEndTime`、`isFreeExpress`、`useChannel` 等字段。

## 六、历史购买查询

在已登录商城的浏览器中查询：

```text
GET https://order-api.szlcsc.com/member/oftenbuy/list?currentPage=1&pageSize=100&sortField=time&sortType=desc&orderTimeBegin=2020-01-01&orderTimeEnd=<今天YYYY-MM-DD>
```

- 响应 `result.page.dataList[]`（常购物料）关注 `productCode`、`productModel`、`brandName`、`catalogNames`、`orderFinalNumberTotal`、`lastOrderTime`。
- 按返回分页信息递增 `currentPage`，覆盖所需历史；不能只查第一页就断定未买过。
- 这是常购物料视图，不是完整库存账。要追溯具体订单时查看商城“我的订单”；不要输出无关订单、地址或电话。接口失败时标记未核实，不编造已购结论。
- 如何用历史记录排除重复采购，见[技能主文档](../SKILL.md)。

## 七、浏览器交互速查

- 产品页输入框通常为页面第一个 `input`；加入购物车使用 `button:has-text("加入购物车")`。
- 购物车数量输入框可用 `input[class*="num"]`；结算按钮通常为 `button:has-text("结算")`。
- 多余标签页可用浏览器标签管理操作关闭。页面选择器可能变化，先检查当前 DOM。
- 页面正则提取仅作辅助；价格梯度可能因渲染问题而混乱，必要时结合 API 响应核对。

## 八、同一购物车内按订单分组

**2026-11 结构，站点可能变化：**

- 首次点击“创建分组”后入口会变成“管理分组(N)”；之后在管理弹窗中创建分组。
- 开启分组后，购物车行不再位于 `shoppingCartVO.rmbCnShoppingCart`，改读 `shoppingCartVO.cartItemGroups[].rmbCnShoppingCart.currentlyProductList`。空分组可能没有该字段。
- 分组列表：`GET /cart/item/group/list?cartCode=...`；字段为 `result.cartItemGroupList[].cartItemGroupId/cartItemGroupName/cartItemCount`。
- 勾选商品：`POST /cart/update/checked`，form：`ck=<shopCarId以~连接>&cartCode=...`。回读勾选状态并刷新页面；只改 DOM checkbox 不可靠。
- 移入分组：`POST /cart/item/group/move`，form：`cartItemGroupId=...&shoppingCartIds=<shopCarId以逗号连接>`。操作后回读分组和行金额。
- 行容器可用 `ul.cv-auto`，文本包含 C 编号；不要假定编号在第一项 `li` 或链接元素内。
- 同一 SKU 的购物车行无法简单拆分到两个组；具体订单分配策略见[coupons.md](coupons.md)。

## 九、绑定发货接口

优先由页面操作产生真实请求，再查看网络响应，避免猜测参数。以下接口为2026-11-11实测的站点内部接口，可能变化；仅在登录会话使用，不要把地址或联系人 ID 存入 skill。

- `POST https://order-api.szlcsc.com/async/order/perfect/delivery/express/list`：读取 `deliveryExpressList[]` 的 `fullAmountFreeExpressVO` 和 `expressCalculteVO.freightMoney/discountFreightMoney/actualFreightMoney`，区分原运费、抵扣和实付邮费。
- `GET https://order-api.szlcsc.com/async/select/wait/bind/order/list?...`：参数沿用当前 UI 请求；读取 `allowBindOrderList/unAllowBindOrderList` 及 `notAllowBindReason/isFullAmountFreeOrder`。
- 可打开绑定窗口或读取前端标志，只说明当前页面未被对应条件拦截，不代表支付后绑定成功。运费与绑定政策及日期核验记录见[coupons.md](coupons.md)。

## 十、兼容替代规格核验案例

- 商品页标注 SOP-4 不足以证明封装兼容；检查数据手册的引脚跨度、脚距及 CTR 档。已核验的 UMW LTV-354T 引脚跨度约10mm，与7mm小型 LTV354 封装不同，不能仅凭型号相似宣称可替换。
- 端子除5.08mm脚距外，还需核对本体高度、针脚截面、孔径及脚中心到外壳边缘尺寸。
