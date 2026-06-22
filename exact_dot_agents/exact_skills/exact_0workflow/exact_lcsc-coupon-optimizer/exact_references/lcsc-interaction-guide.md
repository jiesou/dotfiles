# LCSC 立创商城交互指南

## 一、品牌页与搜索

### 品牌 ID 查找
- 毫欧 (Milliohm): `https://list.szlcsc.com/brand/12131.html`
- 杭晶 (HCI): `https://list.szlcsc.com/brand/12047.html`
- 合科泰 (Hottech): `https://list.szlcsc.com/brand/11439.html`

### 搜索方式
- **全局搜索**: `https://so.szlcsc.com/global.html?k=<关键词>`
- **品牌内搜索**: 进入 `https://list.szlcsc.com/brand/<id>.html` 品牌页后 input[placeholder="在结果中再搜索"]
- **品牌内排序**: 进入 `https://list.szlcsc.com/brand/<id>.html` 品牌页后点击 button#searchListButton
- **分类+品牌过滤**: `https://list.szlcsc.com/catalog/<分类ID>.html?brand=<品牌ID>`
- 分类ID: 陶瓷谐振器(无源)=530, 无源晶振=537, 贴片电阻=439
- 使用品牌页面的"在结果中再搜索"文本框搜索特定型号

### 产品详情页
- 格式: `https://item.szlcsc.com/<C编号>.html`
- 注意: C编号不一定是数字ID，先从搜索结果中获取准确URL
- 部分重定向: `https://item.szlcsc.com/XXXX.html` 可能重定向到 MRO 或其他产品

## 二、购物车操作

### 购物车 API
- 查看购物车: `GET https://cart-api.szlcsc.com/cart/display?isInit=true&cartCode=<cartCode>`
- 获取分组列表: `GET https://cart-api.szlcsc.com/cart/group/list`
- 购物车代码存储在 cookie 中，RoboRig 购物车的 cartCode 在页面加载时从 API 返回
- 响应中包含的 `convesionRatio` 表示每"份"对应多少个元件

### 购物车页面操作
- 页面上每个产品的数量控件使用 `input[class*="num"]` 定位
- 产品的 spinbutton 按 API 返回的产品列表顺序排列
- 修改数量: 通过点击 spinbutton 右侧的 "+" 按钮（使用鼠标坐标点击）
  - 获取 spinbutton 的 boundingBox
  - 计算 "+" 位置: `x = box.x + box.width + 20, y = box.y + box.height / 2`
  - 每点击一次增加一个最小包装单位 (convesionRatio)
- 从产品页添加: 填写 `input` 然后点击 `button:has-text("加入购物车")`

### 购物车数据结构 (API响应)
```json
{
  "currentlyProductList": [{
    "shopCarId": "xxx",
    "productCode": "Cxxxxxx",
    "productModel": "型号名",
    "productNumber": 3,           // 购买份数
    "convesionRatio": 20,         // 每份件数
    "productConsultPrice": 0.1507,// 参考单价（不含折扣）
    "lineMoney": 9.04,            // 行金额
    "productGradePlateName": "Milliohm(毫欧)", // 品牌
    "encapsulationModel": "0805",
    "productPriceDiscountList": [ // 折扣活动
      {"discount": 0.95, "price": 0.07942}
    ],
    "priceDiscount": null,        // 当前应用的价格折扣
    "stockNumber": 4540,
    "isChecked": true,
    "checked": true
  }],
  "cartTotalSize": 9,
  "cartSelfMoney": 52.60,        // 总金额
  "discountMoney": 2.95           // 折扣总额
}
```

## 三、产品数据获取

### 从产品页提取价格
- 价格梯度文本: 页面文字中包含 `50+¥0.07942` 格式的梯度价格
- 关键字段:
  - 现货: `现货[：:]\s*([\d,]+)` 
  - 起订量: `起订量[：:]\s*(\d+)` 或 `最小起订量\s*(\d+)`
  - 价格梯度: `(\d+)[+]\s*[￥¥](\d+\.\d+)`
- 注意: 价格分为"售价"(原价)和折扣价，折扣价通过 `productPriceDiscountList[].price` 计算

### 产品价格层级理解
- `productConsultPrice`: 参考单价（不随数量变化）
- `productPriceList`: 价格梯度（根据购买数量自动应用）
  - `startPurchasedNumber` / `endPurchasedNumber`: 数量区间
  - `productPrice`: 该区间的单价
- `productPriceDiscountList`: 折扣活动（如 5月现货让利95折/94折）
- `productDiscountPrice`: 最终折扣价（已应用折扣活动）
- `lineMoney`: 实际行金额（= 数量 × 实际计费单价）
- LCSC的计费逻辑是 `lineMoney = productNumber × convesionRatio × productConsultPrice`，价格梯度在购物车中不自动应用，需要在提交时由系统重新计算。

## 四、订单结算页

### 结算入口
- 点击购物车页面的 `button:has-text("结算")`
- 结算页 URL: `https://order.szlcsc.com/member/perfect.html?traceId=xxx`

### 优惠券
- 默认勾选"优惠组合"，系统自动选择最优券组合
- 品牌券自动匹配到对应品牌的产品，只要满¥16即自动使用
- 优惠券区域显示在"使用优惠券/采购晶"折叠面板中
- 三张品牌券可同时使用（分属不同品牌）

### 摘要信息提取
```
总金额：¥56.45
运费：¥9
商品折扣：-¥2.98
优惠券：-¥45
包装费：（限免）¥1
应付总金额：¥17.47
```

### 订单商品列表
- 表格行包含: 序号, 商品信息(型号+品牌+封装+编号), 数量, 单价(折扣价+原价), 金额, 交货方式
- 品牌通过 `productGradePlateName` 字段区分

## 五、优惠券规则

### 通用规则
- 满16减15品牌券: 同一品牌商品总价 ≥ ¥16 即可使用
- 三张不同品牌券可叠加使用（同一订单）
- 优惠券在结算页自动选择最优组合
- 可通过取消"优惠组合"复选框手动配置

### 已知品牌券
| 品牌 | 门槛 | 减免 | 品类 |
|------|:----:|:----:|------|
| 杭晶 (HCI) | ¥16 | ¥15 | 晶振/谐振器 |
| 毫欧 (Milliohm) | ¥16 | ¥15 | 电阻/采样电阻 |
| 合科泰 (Hottech) | ¥16 | ¥15 | 二极管/三极管 |

### 包邮
- 应用邮费券后实付满¥9.9包邮（全场）
- 运费通常为¥9（京东快递特惠）
- 需要领取"9.9自营免邮券"或订单金额满足条件

### 已知限制
- 产品的最小起购量 (min_qty) 和倍数 (qty_multiple) 通常对应 convesionRatio
- 部分产品 MOQ 为 5 或 10，部分为 50（如合科泰 BAT54 系列）
- 价格梯度的实际应用不清晰，购物车行金额 = productNumber × convesionRatio × productConsultPrice

## 六、浏览器交互注意事项

### Playwright 操作
- 产品页输入框: `input` 选择器（通常是页面第一个）
- 加入购物车: `button:has-text("加入购物车")`
- 购物车数量修改: 用 `input[class*="num"]` 找到输入框，鼠标点击右侧区域模拟 "+" 按钮
- 结算: `button:has-text("结算")`
- 提交订单: `button:has-text("提交订单")`
- 关闭多余标签页: `browser_tabs close` index

### 数据提取
- 优先通过 API (`cart-api.szlcsc.com`) 获取购物车精确数据
- 产品页数据通过正则从页面文本提取
- 价格梯度格式可能因页面渲染问题而混乱

