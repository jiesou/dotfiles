<!-- 由 scripts/generate_coupon_brands.js 生成；请勿手工编辑，修改后重新生成。 -->

# LCSC 满16减15 / 满21减20品牌清单快照

- **快照时间：** 2026-11-11 15:36:25 CST (UTC+08:00)
- **数据日期：** 2026-11-11
- **来源接口：** `GET https://activity.szlcsc.com/activity/coupon?couponType=&sortColumn=&sortType=&searchValue=&searchCatalogStr=&searchBrandNameStr=&catalogId=`；页面入口：`https://www.szlcsc.com/huodong.html`
- **取得原始响应：** 在已登录的商城页面上下文调用 `fetch("https://activity.szlcsc.com/activity/coupon?couponType=&sortColumn=&sortType=&searchValue=&searchCatalogStr=&searchBrandNameStr=&catalogId=", {credentials:"include"})`，将响应 JSON 保存为文件。
- **生成脚本：** `scripts/generate_coupon_brands.js`。保存接口 JSON 响应后运行 `node scripts/generate_coupon_brands.js <response.json> <output.md> "YYYY-MM-DD HH:mm:ss"`；时间参数按 CST (UTC+08:00) 提供。
- **匹配口径：** 遍历响应 `result.couponModelVOListMap` 下所有数组；保留 `couponType=product`、`brandIds` 非空，且 `couponAmount/minOrderMoney` 精确为 `15/16` 或 `20/21`、有效期覆盖数据日期的记录。按优惠档位及品牌ID去重生成品牌索引；券记录表保留符合条件的每条记录及资格差异。
- **覆盖计数：** 满16减15 267 个品牌；满21减20 42 个品牌；共 300 个不同品牌。匹配券记录 313 条（按档位和品牌去重后 309 条）。
- **限制：** 这是券中心展示响应快照，不代表当前账号都可领取，也不保证所有SKU适用。资格、券余量、商品限制及结算可用性需在账号内复核。

## 去重品牌索引

### 满16减15（267个）

| 品牌 | 品牌ID | 券记录/资格提示 |
|---|---:|---|
| 国星光电 | 966 | <品牌新人>15元国星光电品牌商品券（新人标注） |
| 韩国韩荣 | 947 | 15元韩国韩荣品牌商品券 |
| 合肥智感 | 27311 | 15元合肥智感品牌指定类目商品券 |
| 晶扬电子 | 12581 | <品牌新人>15元晶扬电子品牌商品券（新人标注） |
| 精拓金 | 11735 | 15元精拓金品牌商品券 |
| 康深 | 13447 | 15元康深品牌商品券 |
| 柯睿 | 27248 | 15元柯睿品牌商品券 |
| 领晨 | 27131 | 15元领晨品牌商品券 |
| 同晶 | 16268 | <品牌新人>15元同晶品牌指定类目商品券（新人标注） |
| 众驰电子 | 12454 | 15元众驰电子品牌商品券 |
| ABC(千如) | 13155 | <品牌新人>15元千如品牌商品券（新人标注） |
| ACMECON(鼎容) | 15863 | 15元鼎容品牌商品券 |
| AKER(安碁科技) | 11913 | <品牌新人>15元安碁科技品牌商品券（新人标注） |
| AnBon(安邦) | 11549 | 15元安邦品牌商品券 |
| AOTE(奥特) | 15783 | 15元奥特品牌商品券 |
| APSEMI(先进光) | 17375 | 15元先进光品牌商品券 |
| APV(爱普微) | 15280 | 15元爱普微品牌商品券 |
| ARK(方舟微) | 13426 | 15元方舟微品牌商品券 |
| BAOTER(宝特) | 18552 | 15元宝特品牌商品券 |
| BAT WIRELESS(蝙蝠无线) | 12175 | 15元蝙蝠无线品牌商品券 |
| BORN(伯恩半导体) | 11393 | <品牌新人>15元伯恩半导体品牌商品券（新人标注） |
| Bossie(博锡) | 15538 | 15元博锡品牌商品券（目录:MRO所有目录） |
| BXCONN(宝讯) | 16108 | 15元宝讯品牌商品券 |
| BZCN(博众电气) | 12737 | 15元博众电气品牌商品券 |
| canfeng(灿峰) | 15964 | 15元灿峰品牌工业品券（工业品专区） |
| CAX(创都) | 12353 | 15元创都品牌商品券 |
| CBI(创基) | 12689 | <品牌新人>15元创基品牌商品券（新人标注） |
| CCX(晁禾) | 24412 | 15元晁禾品牌商品券 |
| ceaiya(柯爱亚) | 12191 | <品牌新人>15元柯爱亚品牌商品券（新人标注） |
| CH(创慧电子) | 16239 | 15元创慧电子品牌商品券（目录:MRO所有目录） |
| ChengTao(诚韬) | 17513 | 15元诚韬品牌商品券 |
| CHIN-BAN(勤本) | 15372 | 15元勤本品牌指定类目商品券 |
| chipfountain(芯涛微) | 24904 | 15元芯涛微品牌商品券 |
| CHK(今凯) | 27055 | 15元今凯品牌商品券 |
| cjiang(长江微电) | 11425 | <品牌新人>15元长江微电品牌商品券（新人标注） |
| CJT(长江连接器) | 935 | 15元长江连接器品牌商品券 |
| Ckmtw(灿科盟) | 1262 | <品牌新人>15元灿科盟品牌商品券（新人标注） |
| cntitle(中戈泰斗) | 15742 | 15元中戈泰斗品牌商品券 |
| Coilank(驰兴电感) | 11602 | 15元驰兴电感品牌商品券 |
| coileasy(线易) | 16599 | 15元线易品牌商品券 |
| COILMX(迈翔科技) | 11934 | <品牌新人>15元迈翔科技品牌商品券（新人标注） |
| Consensic(康森斯克) | 12162 | 15元康森斯克品牌商品券 |
| CPT(元精技术) | 27484 | 15元元精技术品牌商品券 |
| CYT(长运通) | 1186 | 15元长运通品牌商品券 |
| DDY(德立)/MYX(铭易轩) | 18591 | 15元铭易轩品牌指定类目商品券 |
| DEALON(德艺隆) | 13026 | <品牌新人>15元德艺隆品牌商品券（新人标注） |
| Dersonic(德尔创) | 11570 | 15元德尔创品牌商品券 |
| DEXU(德旭电子) | 12428 | 15元德旭电子品牌商品券（目录:MRO所有目录） |
| DIANWEI(钿威科技) | 15598 | 15元钿威科技品牌商品券 |
| DLL(德利) | 15765 | 15元德利品牌商品券 |
| DMBJ(振宝佳) | 12498 | 15元振宝佳品牌商品券 |
| DOINGTER(杜因特) | 16607 | 15元杜因特品牌商品券 |
| DORABO(地博电气) | 11964 | 15元地博电气品牌商品券 |
| Dragonstate(华龙) | 15481 | <品牌新人>15元华龙品牌商品券（新人标注；目录:MRO所有目录） |
| DreamLNK(骏晔科技) | 11933 | 15元骏晔科技品牌商品券 |
| Econd(米朗电子) | 18256 | 15元米朗电子品牌商品券 |
| EG(屹晶微) | 857 | <商城新人>15元屹晶微品牌商品券（新人标注） |
| ElecSuper(静芯) | 14038 | 15元静芯品牌商品券 |
| everanalog(申风) | 1207 | <品牌新人>15元申风品牌商品券（新人标注） |
| EVERCOM(恒连) | 13455 | 15元恒连品牌商品券 |
| Existar(毅芯达) | 16251 | <品牌新人>15元毅芯达品牌商品券（新人标注） |
| FOLLON(富隆电子) | 15954 | 15元富隆电子品牌商品券 |
| Forsinve(福芯微) | 15272 | 15元福芯微品牌商品券（目录:MRO所有目录） |
| FOSAN(富捷/富信) | 13045 | 15元富信品牌商品券 |
| FREESOR(飞轩) | 25050 | 15元飞轩品牌商品券 |
| Full-Way(四方杰芯) | 15732 | 15元四方杰芯品牌商品券 |
| FUXINSEMI(富芯森美) | 12406 | 15元富芯森美品牌商品券 |
| G-Switch(品赞) | 12389 | 15元品赞品牌商品券 |
| GDHUIZHI(汇智) | 11866 | 15元汇智品牌商品券（目录:MRO所有目录） |
| GMIC(绿微) | 18721 | 15元绿微品牌商品券 |
| GN(旌芯半导体) | 11681 | 15元旌芯半导体品牌商品券（目录:MRO所有目录） |
| GONGMOSEMI(共模半导体) | 13157 | <品牌新人>15元共模半导体品牌商品券（新人标注） |
| GOODWORK(固得沃克) | 12245 | 15元固得沃克品牌商品券 |
| GR(国睿) | 15555 | 15元国睿品牌商品券 |
| GTL-POWER(冠图电子) | 11739 | <品牌新人>15元冠图电子品牌商品券（新人标注；目录:MRO所有目录） |
| Guangcai Display(光彩显示) | 15941 | 15元光彩显示品牌商品券 |
| GUDIAN(固电) | 18661 | 15元固电品牌商品券 |
| Guiguang light(桂光光电) | 24911 | 15元桂光光电品牌商品券 |
| Gyunrui(云睿) | 25414 | 15元云睿品牌商品券 |
| GYZ(昀冢科技) | 26922 | 15元昀冢科技品牌商品券 |
| Hallwee(霍尔微电子) | 12515 | 15元霍尔微电子品牌商品券 |
| HANBO(汉博) | 12025 | 15元汉博品牌商品券 |
| HanElectricity(瀚源) | 15277 | 15元瀚源品牌商品券 |
| hanxia(韩下) | 14053 | 15元韩下品牌商品券 |
| HAOSWITCH(皓通) | 27277 | 15元皓通品牌商品券 |
| Hawtry(华铸) | 27487 | 15元华铸品牌商品券 |
| HBGK(豪帮高科) | 16923 | 15元豪帮高科品牌商品券 |
| HCI(杭晶) | 12047 | 15元杭晶品牌商品券 |
| HCTL(华灿天禄) | 12732 | 15元华灿天禄品牌商品券（目录:MRO所有目录） |
| HDGC(华德共创) | 13047 | 15元华德共创品牌商品券 |
| HEERMICR(赫尔半导体) | 12343 | 15元赫尔半导体品牌商品券 |
| HEGA(和佳) | 27312 | 15元和佳品牌商品券 |
| Hengtuo(恒拓电子) | 16616 | 15元恒拓电子品牌商品券 |
| HenryTech(恒利泰) | 15271 | 15元恒利泰品牌商品券 |
| HEXIN(禾芯微) | 11438 | <品牌新人>15元禾芯微品牌商品券（新人标注） |
| HGC(深圳汉芯) | 13175 | 15元深圳汉芯品牌商品券（短期至2026-11-13）<br>15元深圳汉芯品牌商品券 |
| HH(辉焕) | 18884 | 15元辉焕品牌商品券 |
| HI-LINK(海凌科) | 11515 | 15元海凌科品牌商品券（目录:MRO所有目录；短期至2026-11-13） |
| Hichips(智芯) | 11741 | <品牌新人>15元智芯品牌商品券（新人标注） |
| HK(航顺) | 832 | <品牌新人>15元航顺品牌商品券（新人标注；目录:MRO所有目录） |
| HKT(合科泰) | 11439 | 15元合科泰品牌商品券 |
| HMTCONN(华明通) | 17129 | 15元华明通品牌商品券 |
| HOAUC(华宇创) | 11834 | <品牌新人>15元华宇创品牌商品券（新人标注）<br>15元华宇创品牌工业品券（工业品专区） |
| HRE(芯声) | 13390 | <品牌新人>15元芯声品牌商品券（新人标注） |
| HRK(鸿瑞凯电子) | 13168 | 15元鸿瑞凯电子品牌商品券 |
| HTCSEMI(海天芯) | 12706 | 15元海天芯品牌商品券 |
| HUASHUO(华朔) | 12197 | 15元华朔品牌商品券 |
| HUAXIN(华昕) | 15355 | 15元华昕品牌商品券 |
| HYDZ(华宇) | 15503 | <品牌新人>15元华宇品牌商品券（新人标注） |
| HYHONGYEX(宏业) | 12450 | <品牌新人>15元宏业品牌商品券（新人标注） |
| HYP(鸿源精密) | 11586 | 15元鸿源精密品牌商品券 |
| IDCHIP(英锐芯) | 11772 | <品牌新人>15元英锐芯品牌商品券（新人标注） |
| INGHAi(赢海) | 11537 | <品牌新人>15元赢海品牌商品券（新人标注） |
| ISOMICRON(安芯微半导体) | 15462 | 15元安芯微半导体品牌商品券 |
| JARSON(伽盛) | 13495 | 15元伽盛品牌商品券 |
| JBL(金比莱) | 16697 | <品牌新人>15元金比莱品牌商品券（新人标注） |
| JCHL(晶创和立) | 11601 | 15元晶创和立品牌商品券 |
| JETEKPS(健特) | 11954 | <品牌新人>15元健特品牌商品券（新人标注） |
| JGHC(晶光华) | 11947 | <品牌新人>15元晶光华品牌商品券（新人标注） |
| jianfu(键富) | 15617 | 15元键富品牌商品券 |
| JIERR(捷而瑞) | 18279 | 15元捷而瑞品牌商品券 |
| JILN(锦凌) | 11870 | 15元锦凌品牌商品券（短期至2026-11-13）<br>15元锦凌品牌商品券 |
| JMEconn(文章济美) | 18565 | 15元文章济美品牌商品券 |
| JNJOPTO(强生光电) | 15459 | 15元强生光电品牌商品券 |
| JORDUN(乔顿) | 18660 | 15元乔顿品牌商品券 |
| JS(钜硕电子) | 349 | 15元钜硕电子品牌商品券 |
| JSMSEMI(杰盛微) | 12313 | 15元杰盛微品牌商品券 |
| JTD(晶泰达) | 17201 | 15元晶泰达品牌商品券 |
| JUXING(钜兴) | 13374 | 15元钜兴品牌商品券 |
| JXTCONN(聚兴泰) | 16624 | 15元聚兴泰品牌商品券 |
| KANGNEX(康奈克斯电气) | 11478 | <品牌新人>15元康奈克斯电气品牌商品券（新人标注） |
| KEXIN(科信) | 11914 | <品牌新人>15元科信品牌商品券（新人标注） |
| kinghelm(金航标) | 11647 | <品牌新人>15元金航标品牌商品券（新人标注） |
| KNSCHA(科尼盛) | 12108 | <品牌新人>15元科尼盛品牌商品券（新人标注） |
| KOHERelec(科或) | 12351 | 15元科或品牌商品券（目录:MRO所有目录） |
| KTP(科泰普) | 15592 | 15元科泰普品牌商品券 |
| KUU | 13024 | <品牌新人>15元KUU品牌商品券（新人标注） |
| KYET(科雅) | 11973 | 15元科雅品牌商品券（目录:MRO所有目录） |
| LanTu Micro(蓝图微电) | 14041 | 15元蓝图微电品牌商品券（目录:MRO所有目录） |
| LCKELEC(联晟欣) | 23848 | 15元联晟欣品牌商品券 |
| LEADER(立得) | 12535 | <品牌新人>15元立得品牌商品券（新人标注） |
| Leiditech(雷卯电子) | 11948 | 15元雷卯电子品牌商品券 |
| Lewa Micro(乐瓦微电子) | 15786 | 15元乐瓦微电子品牌商品券 |
| LGE(鲁光) | 11743 | 15元鲁光品牌商品券 |
| Liansheng(连盛) | 12531 | 15元连盛品牌商品券 |
| LINGQIANG(领强) | 26727 | 15元领强品牌商品券 |
| LinkMems(聆麦声学) | 15302 | <品牌新人>15元聆麦声学品牌商品券（新人标注） |
| Liown(里阳半导体) | 12139 | 15元里阳半导体品牌商品券 |
| LR(朗瑞) | 11995 | <品牌新人>15元朗瑞品牌商品券（新人标注） |
| Lucki(蓝晶) | 15257 | <品牌新人>15元蓝晶品牌商品券（新人标注） |
| luJing(鲁晶) | 18832 | 15元鲁晶品牌商品券 |
| LUTE(陆特) | 15464 | 15元陆特品牌商品券 |
| LX(连欣科技) | 15466 | <品牌新人>15元连欣科技品牌商品券（新人标注） |
| LX(灵星芯微) | 15920 | 15元灵星芯微品牌商品券 |
| LXWCONN(连兴旺电子) | 25051 | 15元连兴旺电子品牌商品券 |
| MAX(迈旭) | 15187 | 15元迈旭品牌商品券 |
| MDD(辰达半导体) | 164 | <品牌新人>15元MDD品牌商品券（新人标注；目录:MRO所有目录） |
| Megastar(兆星) | 15340 | 15元兆星品牌商品券（目录:MRO所有目录） |
| MEIHUA(美华) | 11965 | 15元美华品牌商品券 |
| MHCH(明惠成和) | 27394 | <品牌新人>15元明惠成和品牌指定类目商品券（新人标注） |
| Milliohm(毫欧) | 12131 | 15元毫欧品牌商品券 |
| minos(迈诺斯) | 13052 | 15元迈诺斯品牌商品券 |
| MINTRON(明硕) | 11880 | 15元明硕品牌商品券 |
| MOT(仁懋) | 14048 | 15元仁懋品牌商品券（目录:MRO所有目录） |
| MP(美禄科技) | 15548 | 15元美禄科技品牌商品券 |
| MPS(芯源) | 283 | <品牌新人>15元MPS品牌商品券（新人标注） |
| MSKSEMI(美森科) | 12667 | 15元美森科品牌商品券（目录:MRO所有目录） |
| MyAntenna(摩天射频) | 16013 | 15元摩天射频品牌商品券 |
| Mysentech(敏源传感) | 12731 | 15元敏源传感品牌商品券 |
| NBC(宝橙) | 11984 | 15元宝橙品牌商品券 |
| NH(纽航) | 15356 | 15元纽航品牌商品券 |
| NYBOXING(尼博星) | 12133 | 15元尼博星品牌商品券 |
| Nyfea(徕飞) | 17208 | 15元徕飞品牌商品券 |
| OPSCO(欧思科) | 12580 | 15元欧思科品牌商品券 |
| PAKER(派克微) | 13369 | 15元派克微品牌商品券 |
| PROD(谱罗德) | 12072 | 15元谱罗德品牌商品券 |
| QNHCHIP(乾能惠) | 17333 | <品牌新人>15元乾能惠品牌商品券（新人标注） |
| RealChip(正芯半导体) | 13712 | <品牌新人>15元正芯半导体品牌商品券（新人标注） |
| ROCPU Switches(台普) | 12574 | 15元台普品牌商品券 |
| ROQANG(容强) | 851 | 15元容强品牌商品券（短期至2026-11-13） |
| RS(容硕) | 14032 | 15元容硕品牌商品券 |
| RUILON(瑞隆源) | 1117 | 15元瑞隆源品牌商品券 |
| S&S(海旭) | 11883 | <品牌新人>15元海旭品牌商品券（新人标注） |
| SAMZO(三佐) | 16226 | 15元三佐品牌商品券 |
| SANHI(深海电子) | 18751 | 15元深海电子品牌商品券 |
| SCTF(星通时频) | 11630 | 15元星通时频品牌商品券 |
| SHENGYANG(升阳) | 17425 | 15元升阳品牌商品券 |
| SHIKUES(时科) | 1138 | <品牌新人>15元时科品牌商品券（新人标注） |
| SiChange(芯昌科技) | 16222 | 15元芯昌科技品牌商品券 |
| SIE(永星科技) | 27001 | 15元永星科技品牌商品券（短期至2026-11-13） |
| Siliup(矽普) | 15945 | 15元矽普品牌商品券 |
| Silverlight(银月光) | 12705 | <品牌新人>15元银月光品牌商品券（新人标注；目录:MRO所有目录） |
| Siproin(上海矽朋) | 11694 | 15元上海矽朋品牌商品券 |
| SM Switch | 12572 | 15元SM Switch品牌商品券 |
| SOFNG(硕方) | 1218 | 15元硕方品牌商品券 |
| SOREDE(索瑞达) | 12685 | 15元索瑞达品牌商品券 |
| SOSET(索斯特) | 13181 | <品牌新人>15元索斯特品牌商品券（新人标注） |
| SRD(圣融达) | 1056 | 15元圣融达品牌商品券 |
| SRT(斯瑞特) | 12586 | 15元斯瑞特品牌商品券 |
| Starwave(思大) | 12464 | 15元思大品牌商品券 |
| STE(松田) | 11597 | 15元松田品牌商品券 |
| STEIPU(斯泰普) | 12388 | <品牌新人>15元斯泰普品牌工业品券（新人标注；工业品专区） |
| SUNGMUN(韩国星炆电子) | 12028 | <品牌新人>15元韩国星炆电子品牌商品券（新人标注） |
| Sunltech(顺磁) | 11440 | 15元顺磁品牌商品券 |
| SUNMATE(森美特) | 1195 | <品牌新人>15元森美特品牌商品券（新人标注） |
| suntek(洺太电子) | 12518 | 15元洺太电子品牌商品券 |
| Sunway(信维通信) | 13452 | 15元信维通信品牌商品券 |
| SUPSiC(国晶微半导体) | 12612 | 15元国晶微半导体品牌商品券 |
| SURGING(绍鑫) | 12247 | 15元绍鑫品牌商品券（目录:MRO所有目录） |
| SXN(顺翔诺) | 11353 | 15元顺翔诺品牌商品券（目录:MRO所有目录） |
| TCWIN(天成) | 12404 | <品牌新人>15元天成品牌商品券（新人标注） |
| TDSEMIC(拓电半导体) | 16094 | <品牌新人>15元拓电半导体品牌商品券（新人标注） |
| TECH PUBLIC(台舟) | 12241 | 15元台舟品牌商品券 |
| TFSS(德律风根) | 12547 | 15元德律风根品牌商品券 |
| TKD(泰晶) | 11696 | 15元泰晶品牌商品券 |
| TOGIALED(统佳) | 11541 | 15元统佳品牌商品券 |
| TOPAZCON(黄宝石) | 11401 | 15元黄宝石品牌商品券 |
| TPOWER(天源) | 11941 | 15元天源品牌商品券 |
| TROQ(创捷) | 12546 | 15元创捷品牌商品券（目录:MRO所有目录） |
| Truesemi(信安) | 11939 | <品牌新人>15元信安品牌商品券（新人标注） |
| Tudi(钍地半导体) | 16038 | 15元钍地半导体品牌商品券 |
| TUOZHAN(拓展光电) | 12297 | 15元拓展光电品牌商品券 |
| TWGMC(迪嘉) | 12376 | 15元迪嘉品牌商品券（目录:MRO所有目录） |
| UMaxconn(友贸) | 12006 | 15元友贸品牌商品券 |
| UMW(友台半导体) | 11853 | 15元友台半导体品牌商品券 |
| UNI-SEMIC(宇力半导体) | 11999 | 15元宇力半导体品牌商品券（目录:MRO所有目录） |
| VISOM | 12425 | 15元VISOM品牌商品券 |
| Vollgo(沃进) | 12356 | 15元沃进品牌商品券 |
| WALSON(万盛) | 18304 | <品牌新人>15元万盛品牌商品券（新人标注） |
| WF(伟烽) | 12761 | 15元伟烽品牌商品券 |
| WingTAT(格林柏) | 15171 | 15元格林柏品牌商品券 |
| worldsemi | 1250 | 15元worldsemi品牌商品券 |
| WXNSIC(国硅集成) | 15349 | 15元国硅集成品牌商品券 |
| XBLW(芯伯乐) | 15584 | 15元芯伯乐品牌商品券 |
| XDS(芯鼎盛) | 11758 | 15元芯鼎盛品牌商品券 |
| XFCN(兴飞) | 12130 | 15元兴飞品牌商品券 |
| XHXDZ(兴华鑫) | 18771 | <品牌新人>15元兴华鑫品牌商品券（新人标注） |
| XINGLIGHT(成兴光) | 12469 | 15元成兴光品牌商品券 |
| XINLUDA(信路达) | 12211 | 15元信路达品牌商品券 |
| Xinyangze(鑫扬泽) | 13320 | 15元鑫扬泽品牌商品券 |
| XKB Connection(中国星坤) | 11722 | 15元中国星坤品牌商品券 |
| XMXW(芯网) | 11962 | <品牌新人>15元芯网品牌工业品券（新人标注；工业品专区） |
| XNRUSEMI(新锐) | 17409 | 15元新锐品牌商品券 |
| XR(祥如) | 15267 | 15元祥如品牌商品券 |
| XUMAO(旭茂微) | 16031 | 15元旭茂微品牌商品券 |
| XUNDA(讯答) | 15535 | 15元讯答品牌商品券（目录:MRO所有目录） |
| XUNPU(讯普) | 11687 | 15元讯普品牌商品券 |
| XYECONN(辛译) | 15593 | 15元辛译品牌商品券 |
| yezhan(业展) | 12113 | <业展>15元PLUS专属券（PLUS） |
| YFW(佑风微) | 12510 | <品牌新人>15元佑风微品牌商品券（新人标注） |
| yiyuanxny(广东怡远) | 15458 | <品牌新人>15元广东怡远品牌工业品券（新人标注；工业品专区） |
| YIZHI(逸致) | 18649 | 15元逸致品牌工业品券（工业品专区） |
| YJX(雅晶鑫) | 1181 | 15元雅晶鑫品牌商品券（目录:MRO所有目录） |
| YJYCOIN(益嘉源) | 11837 | <品牌新人>15元益嘉源品牌商品券（新人标注） |
| Ymin(永铭) | 11692 | 15元永铭品牌商品券 |
| YONGYUTAI(永裕泰) | 13025 | <品牌新人>15元永裕泰品牌商品券（新人标注） |
| YTL(亚特联) | 12342 | <品牌新人>15元亚特联品牌商品券（新人标注） |
| Yuandi(元迪) | 12165 | 15元元迪品牌商品券（目录:MRO所有目录） |
| YUFENG(裕峰) | 18367 | 15元裕峰品牌工业品券（工业品专区） |
| YXC(扬兴晶振) | 287 | <品牌新人>15元扬兴晶振品牌商品券（新人标注） |
| Yxcon(宇熙精密) | 15465 | 15元宇熙精密品牌商品券 |
| ZE(增益) | 12475 | 15元增益品牌商品券（目录:MRO所有目录） |
| ZGWD(温达电子) | 16617 | 15元温达电子品牌商品券 |
| Zhengxin(正芯) | 13493 | 15元正芯品牌商品券 |
| Zhongdi(众迪) | 15966 | 15元众迪品牌商品券 |
| Zhongke Wireless(中科无线) | 25253 | 15元中科无线品牌商品券 |
| ZOEYGO(中逸光) | 11876 | <品牌新人>15元中逸光品牌商品券（新人标注） |

### 满21减20（42个）

| 品牌 | 品牌ID | 券记录/资格提示 |
|---|---:|---|
| 国星光电 | 966 | <品牌新人>20元国星光电品牌商品券（新人标注；短期至2026-11-13）<br><国星光电>20元PLUS专属券（PLUS） |
| 台湾陆海 | 462 | 20元台湾陆海品牌商品券 |
| baocheng(宝乘) | 11854 | 20元宝乘品牌商品券 |
| BHFUSE(佰宏) | 12424 | 20元佰宏品牌商品券（目录:MRO所有目录） |
| BNstar(比诺星) | 12606 | 20元比诺星品牌商品券 |
| CAZN(正成) | 15353 | <品牌新人>20元正成品牌商品券（新人标注） |
| CCX(晁禾) | 24412 | 20元晁禾品牌商品券（短期至2026-11-13） |
| Chinocera(华瓷) | 12099 | 学生认证 \| 20元华瓷品牌商品券（学生认证） |
| cjiang(长江微电) | 11425 | 20元长江微电品牌商品券（短期至2026-11-13） |
| Cmos(广东场效应半导体) | 15188 | 20元广东场效应半导体品牌商品券 |
| CND-tek(磁联达) | 12021 | 20元磁联达品牌商品券 |
| Coilank(驰兴电感) | 11602 | 20元驰兴电感品牌商品券（短期至2026-11-13） |
| EVISUN(易成) | 15453 | 20元易成品牌商品券 |
| FAUKU(高芯电子) | 24398 | 20元高芯电子品牌商品券 |
| FG(富港) | 12635 | 20元富港品牌商品券 |
| hanxia(韩下) | 14053 | <韩下>20元PLUS专属券（PLUS） |
| HC(虹成电子) | 15376 | 20元虹成电子品牌商品券 |
| HEGA(和佳) | 27312 | 20元和佳品牌商品券（短期至2026-11-13） |
| HONOR(荣誉) | 991 | 20元荣誉品牌商品券 |
| HXY MOSFET(华轩阳电子) | 13437 | 20元华轩阳电子品牌商品券 |
| JDTfuse(集电通) | 419 | 20元集电通品牌商品券 |
| JLYE(晶力源) | 18554 | 20元晶力源品牌商品券 |
| Khon(康宏电子) | 17159 | 20元康宏电子品牌商品券 |
| KYX(凯越翔) | 11898 | 20元凯越翔品牌商品券 |
| LAILAN(莱联) | 26882 | 20元莱联品牌商品券 |
| LINKEYCON(联盈控) | 16314 | 20元联盈控品牌商品券 |
| LUTE(陆特) | 15464 | 20元陆特品牌商品券（短期至2026-11-13） |
| LX(连线电子) | 11956 | 20元连线电子品牌商品券 |
| Magnetsyc(元磁) | 16049 | <品牌新人>20元元磁品牌商品券（新人标注） |
| MetalLions(美铼) | 365 | <品牌新人>20元美铼品牌商品券（新人标注） |
| Milliohm(毫欧) | 12131 | 20元毫欧品牌商品券（短期至2026-11-13） |
| R+O(宏嘉诚) | 15352 | <品牌新人>20元宏嘉诚品牌商品券（新人标注） |
| RESI(开步睿思) | 11761 | <品牌新人>20元开步睿思品牌商品券（新人标注） |
| ReSine PS(瑞鑫) | 15768 | 20元瑞鑫品牌商品券 |
| SDTRUVAL(信德) | 17310 | 20元信德品牌工业品券（工业品专区） |
| SHETIME(高钺达) | 25186 | 20元高钺达品牌商品券 |
| SHOU HAN(首韩) | 11955 | 20元首韩品牌商品券 |
| WIER(微尔) | 12362 | 20元微尔品牌商品券 |
| WINSOK(微硕) | 941 | 20元微硕品牌指定类目商品券 |
| yezhan(业展) | 12113 | 20元业展品牌商品券 |
| YLPTEC(易川) | 13306 | 20元易川品牌商品券 |
| YWF(宇文发) | 26864 | 20元宇文发品牌商品券 |

## 匹配券记录明细

每条匹配记录单独列出，避免合并时丢失同品牌不同资格、专区或有效期。

| 档位 | 券ID | 券名称 | 品牌 | 品牌ID | 资格/范围标注 | 适用会员 | 会员等级 | 有效期 | 活动/分区 | 状态字段 |
|---|---:|---|---|---:|---|---|---|---|---|---|
| 16减15 | 46063 | <品牌新人>15元国星光电品牌商品券 | 国星光电 | 966 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66287 | 15元韩国韩荣品牌商品券 | 韩国韩荣 | 947 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66288 | 15元合肥智感品牌指定类目商品券 | 合肥智感 | 27311 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66290 | <品牌新人>15元晶扬电子品牌商品券 | 晶扬电子 | 12581 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66292 | 15元精拓金品牌商品券 | 精拓金 | 11735 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46159 | 15元康深品牌商品券 | 康深 | 13447 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66313 | 15元柯睿品牌商品券 | 柯睿 | 27248 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66314 | 15元领晨品牌商品券 | 领晨 | 27131 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46036 | <品牌新人>15元同晶品牌指定类目商品券 | 同晶 | 16268 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66294 | 15元众驰电子品牌商品券 | 众驰电子 | 12454 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66315 | <品牌新人>15元千如品牌商品券 | ABC(千如) | 13155 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66819 | 15元鼎容品牌商品券 | ACMECON(鼎容) | 15863 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66699 | <品牌新人>15元安碁科技品牌商品券 | AKER(安碁科技) | 11913 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66385 | 15元安邦品牌商品券 | AnBon(安邦) | 11549 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66319 | 15元奥特品牌商品券 | AOTE(奥特) | 15783 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66662 | 15元先进光品牌商品券 | APSEMI(先进光) | 17375 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66494 | 15元爱普微品牌商品券 | APV(爱普微) | 15280 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66553 | 15元方舟微品牌商品券 | ARK(方舟微) | 13426 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66674 | 15元宝特品牌商品券 | BAOTER(宝特) | 18552 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46139 | 15元蝙蝠无线品牌商品券 | BAT WIRELESS(蝙蝠无线) | 12175 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66321 | <品牌新人>15元伯恩半导体品牌商品券 | BORN(伯恩半导体) | 11393 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66168 | 15元博锡品牌商品券 | Bossie(博锡) | 15538 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46118 | 15元宝讯品牌商品券 | BXCONN(宝讯) | 16108 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46065 | 15元博众电气品牌商品券 | BZCN(博众电气) | 12737 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66471 | 15元灿峰品牌工业品券 | canfeng(灿峰) | 15964 | 工业品专区 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 工业品专区；立创工业品-品牌推广-26年11月 | invalid=false; done=false |
| 16减15 | 66170 | 15元创都品牌商品券 | CAX(创都) | 12353 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66324 | <品牌新人>15元创基品牌商品券 | CBI(创基) | 12689 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46066 | 15元晁禾品牌商品券 | CCX(晁禾) | 24412 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66630 | <品牌新人>15元柯爱亚品牌商品券 | ceaiya(柯爱亚) | 12191 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66835 | 15元创慧电子品牌商品券 | CH(创慧电子) | 16239 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46002 | 15元诚韬品牌商品券 | ChengTao(诚韬) | 17513 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46160 | 15元勤本品牌指定类目商品券 | CHIN-BAN(勤本) | 15372 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46071 | 15元芯涛微品牌商品券 | chipfountain(芯涛微) | 24904 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66329 | 15元今凯品牌商品券 | CHK(今凯) | 27055 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46005 | <品牌新人>15元长江微电品牌商品券 | cjiang(长江微电) | 11425 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66803 | 15元长江连接器品牌商品券 | CJT(长江连接器) | 935 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66173 | <品牌新人>15元灿科盟品牌商品券 | Ckmtw(灿科盟) | 1262 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66174 | 15元中戈泰斗品牌商品券 | cntitle(中戈泰斗) | 15742 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46006 | 15元驰兴电感品牌商品券 | Coilank(驰兴电感) | 11602 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66607 | 15元线易品牌商品券 | coileasy(线易) | 16599 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66733 | <品牌新人>15元迈翔科技品牌商品券 | COILMX(迈翔科技) | 11934 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66487 | 15元康森斯克品牌商品券 | Consensic(康森斯克) | 12162 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66297 | 15元元精技术品牌商品券 | CPT(元精技术) | 27484 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66178 | 15元长运通品牌商品券 | CYT(长运通) | 1186 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46031 | 15元铭易轩品牌指定类目商品券 | DDY(德立)/MYX(铭易轩) | 18591 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66605 | <品牌新人>15元德艺隆品牌商品券 | DEALON(德艺隆) | 13026 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66820 | 15元德尔创品牌商品券 | Dersonic(德尔创) | 11570 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46141 | 15元德旭电子品牌商品券 | DEXU(德旭电子) | 12428 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66180 | 15元钿威科技品牌商品券 | DIANWEI(钿威科技) | 15598 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46121 | 15元德利品牌商品券 | DLL(德利) | 15765 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66822 | 15元振宝佳品牌商品券 | DMBJ(振宝佳) | 12498 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66182 | 15元杜因特品牌商品券 | DOINGTER(杜因特) | 16607 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66558 | 15元地博电气品牌商品券 | DORABO(地博电气) | 11964 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66673 | <品牌新人>15元华龙品牌商品券 | Dragonstate(华龙) | 15481 | 新人标注；目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66298 | 15元骏晔科技品牌商品券 | DreamLNK(骏晔科技) | 11933 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46041 | 15元米朗电子品牌商品券 | Econd(米朗电子) | 18256 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66572 | <商城新人>15元屹晶微品牌商品券 | EG(屹晶微) | 857 | 新人标注 | all | general | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66387 | 15元静芯品牌商品券 | ElecSuper(静芯) | 14038 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66389 | <品牌新人>15元申风品牌商品券 | everanalog(申风) | 1207 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66795 | 15元恒连品牌商品券 | EVERCOM(恒连) | 13455 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66391 | <品牌新人>15元毅芯达品牌商品券 | Existar(毅芯达) | 16251 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66843 | 15元富隆电子品牌商品券 | FOLLON(富隆电子) | 15954 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66608 | 15元福芯微品牌商品券 | Forsinve(福芯微) | 15272 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66723 | 15元富信品牌商品券 | FOSAN(富捷/富信) | 13045 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66561 | 15元飞轩品牌商品券 | FREESOR(飞轩) | 25050 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66300 | 15元四方杰芯品牌商品券 | Full-Way(四方杰芯) | 15732 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66496 | 15元富芯森美品牌商品券 | FUXINSEMI(富芯森美) | 12406 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46135 | 15元品赞品牌商品券 | G-Switch(品赞) | 12389 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66517 | 15元汇智品牌商品券 | GDHUIZHI(汇智) | 11866 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66656 | 15元绿微品牌商品券 | GMIC(绿微) | 18721 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46011 | 15元旌芯半导体品牌商品券 | GN(旌芯半导体) | 11681 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66629 | <品牌新人>15元共模半导体品牌商品券 | GONGMOSEMI(共模半导体) | 13157 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46045 | 15元固得沃克品牌商品券 | GOODWORK(固得沃克) | 12245 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66498 | 15元国睿品牌商品券 | GR(国睿) | 15555 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66521 | <品牌新人>15元冠图电子品牌商品券 | GTL-POWER(冠图电子) | 11739 | 新人标注；目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66802 | 15元光彩显示品牌商品券 | Guangcai Display(光彩显示) | 15941 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66192 | 15元固电品牌商品券 | GUDIAN(固电) | 18661 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46047 | 15元桂光光电品牌商品券 | Guiguang light(桂光光电) | 24911 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46032 | 15元云睿品牌商品券 | Gyunrui(云睿) | 25414 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66103 | 15元昀冢科技品牌商品券 | GYZ(昀冢科技) | 26922 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46162 | 15元霍尔微电子品牌商品券 | Hallwee(霍尔微电子) | 12515 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66194 | 15元汉博品牌商品券 | HANBO(汉博) | 12025 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46076 | 15元瀚源品牌商品券 | HanElectricity(瀚源) | 15277 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46143 | 15元韩下品牌商品券 | hanxia(韩下) | 14053 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66719 | 15元皓通品牌商品券 | HAOSWITCH(皓通) | 27277 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66724 | 15元华铸品牌商品券 | Hawtry(华铸) | 27487 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66831 | 15元豪帮高科品牌商品券 | HBGK(豪帮高科) | 16923 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66565 | 15元杭晶品牌商品券 | HCI(杭晶) | 12047 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66196 | 15元华灿天禄品牌商品券 | HCTL(华灿天禄) | 12732 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66198 | 15元华德共创品牌商品券 | HDGC(华德共创) | 13047 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66079 | 15元赫尔半导体品牌商品券 | HEERMICR(赫尔半导体) | 12343 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46050 | 15元和佳品牌商品券 | HEGA(和佳) | 27312 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66340 | 15元恒拓电子品牌商品券 | Hengtuo(恒拓电子) | 16616 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66200 | 15元恒利泰品牌商品券 | HenryTech(恒利泰) | 15271 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66690 | <品牌新人>15元禾芯微品牌商品券 | HEXIN(禾芯微) | 11438 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46096 | 15元深圳汉芯品牌商品券 | HGC(深圳汉芯) | 13175 | 短期至2026-11-13 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-11 00:00:00 – 2026-11-13 23:59:59 | 活动专区；2026年双11优惠券活动 | invalid=false; done=false |
| 16减15 | 66574 | 15元深圳汉芯品牌商品券 | HGC(深圳汉芯) | 13175 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66302 | 15元辉焕品牌商品券 | HH(辉焕) | 18884 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66762 | 15元海凌科品牌商品券 | HI-LINK(海凌科) | 11515 | 目录:MRO所有目录；短期至2026-11-13 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-11 00:00:00 – 2026-11-13 23:59:59 | 活动专区；2026年双11优惠券活动 | invalid=false; done=false |
| 16减15 | 46169 | <品牌新人>15元智芯品牌商品券 | Hichips(智芯) | 11741 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66791 | <品牌新人>15元航顺品牌商品券 | HK(航顺) | 832 | 新人标注；目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66702 | 15元合科泰品牌商品券 | HKT(合科泰) | 11439 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66091 | 15元华明通品牌商品券 | HMTCONN(华明通) | 17129 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66202 | <品牌新人>15元华宇创品牌商品券 | HOAUC(华宇创) | 11834 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66481 | 15元华宇创品牌工业品券 | HOAUC(华宇创) | 11834 | 工业品专区 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 工业品专区；立创工业品-品牌推广-26年11月 | invalid=false; done=false |
| 16减15 | 46051 | <品牌新人>15元芯声品牌商品券 | HRE(芯声) | 13390 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66783 | 15元鸿瑞凯电子品牌商品券 | HRK(鸿瑞凯电子) | 13168 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66672 | 15元海天芯品牌商品券 | HTCSEMI(海天芯) | 12706 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66700 | 15元华朔品牌商品券 | HUASHUO(华朔) | 12197 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66342 | 15元华昕品牌商品券 | HUAXIN(华昕) | 15355 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66828 | <品牌新人>15元华宇品牌商品券 | HYDZ(华宇) | 15503 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66392 | <品牌新人>15元宏业品牌商品券 | HYHONGYEX(宏业) | 12450 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46163 | 15元鸿源精密品牌商品券 | HYP(鸿源精密) | 11586 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66488 | <品牌新人>15元英锐芯品牌商品券 | IDCHIP(英锐芯) | 11772 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66652 | <品牌新人>15元赢海品牌商品券 | INGHAi(赢海) | 11537 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66210 | 15元安芯微半导体品牌商品券 | ISOMICRON(安芯微半导体) | 15462 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66726 | 15元伽盛品牌商品券 | JARSON(伽盛) | 13495 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66212 | <品牌新人>15元金比莱品牌商品券 | JBL(金比莱) | 16697 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46072 | 15元晶创和立品牌商品券 | JCHL(晶创和立) | 11601 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66344 | <品牌新人>15元健特品牌商品券 | JETEKPS(健特) | 11954 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66704 | <品牌新人>15元晶光华品牌商品券 | JGHC(晶光华) | 11947 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66303 | 15元键富品牌商品券 | jianfu(键富) | 15617 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 45995 | 15元捷而瑞品牌商品券 | JIERR(捷而瑞) | 18279 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 精选专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46097 | 15元锦凌品牌商品券 | JILN(锦凌) | 11870 | 短期至2026-11-13 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-11 00:00:00 – 2026-11-13 23:59:59 | 活动专区；2026年双11优惠券活动 | invalid=false; done=false |
| 16减15 | 66728 | 15元锦凌品牌商品券 | JILN(锦凌) | 11870 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66208 | 15元文章济美品牌商品券 | JMEconn(文章济美) | 18565 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66706 | 15元强生光电品牌商品券 | JNJOPTO(强生光电) | 15459 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66729 | 15元乔顿品牌商品券 | JORDUN(乔顿) | 18660 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66346 | 15元钜硕电子品牌商品券 | JS(钜硕电子) | 349 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66348 | 15元杰盛微品牌商品券 | JSMSEMI(杰盛微) | 12313 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66806 | 15元晶泰达品牌商品券 | JTD(晶泰达) | 17201 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66350 | 15元钜兴品牌商品券 | JUXING(钜兴) | 13374 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66216 | 15元聚兴泰品牌商品券 | JXTCONN(聚兴泰) | 16624 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46114 | <品牌新人>15元康奈克斯电气品牌商品券 | KANGNEX(康奈克斯电气) | 11478 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66529 | <品牌新人>15元科信品牌商品券 | KEXIN(科信) | 11914 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66094 | <品牌新人>15元金航标品牌商品券 | kinghelm(金航标) | 11647 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66741 | <品牌新人>15元科尼盛品牌商品券 | KNSCHA(科尼盛) | 12108 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66304 | 15元科或品牌商品券 | KOHERelec(科或) | 12351 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66394 | 15元科泰普品牌商品券 | KTP(科泰普) | 15592 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66708 | <品牌新人>15元KUU品牌商品券 | KUU | 13024 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66082 | 15元科雅品牌商品券 | KYET(科雅) | 11973 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46014 | 15元蓝图微电品牌商品券 | LanTu Micro(蓝图微电) | 14041 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66305 | 15元联晟欣品牌商品券 | LCKELEC(联晟欣) | 23848 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66306 | <品牌新人>15元立得品牌商品券 | LEADER(立得) | 12535 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46145 | 15元雷卯电子品牌商品券 | Leiditech(雷卯电子) | 11948 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66873 | 15元乐瓦微电子品牌商品券 | Lewa Micro(乐瓦微电子) | 15786 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46054 | 15元鲁光品牌商品券 | LGE(鲁光) | 11743 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66218 | 15元连盛品牌商品券 | Liansheng(连盛) | 12531 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66220 | 15元领强品牌商品券 | LINGQIANG(领强) | 26727 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66396 | <品牌新人>15元聆麦声学品牌商品券 | LinkMems(聆麦声学) | 15302 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46147 | 15元里阳半导体品牌商品券 | Liown(里阳半导体) | 12139 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46170 | <品牌新人>15元朗瑞品牌商品券 | LR(朗瑞) | 11995 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66307 | <品牌新人>15元蓝晶品牌商品券 | Lucki(蓝晶) | 15257 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66500 | 15元鲁晶品牌商品券 | luJing(鲁晶) | 18832 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46055 | 15元陆特品牌商品券 | LUTE(陆特) | 15464 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66400 | <品牌新人>15元连欣科技品牌商品券 | LX(连欣科技) | 15466 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66567 | 15元灵星芯微品牌商品券 | LX(灵星芯微) | 15920 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66224 | 15元连兴旺电子品牌商品券 | LXWCONN(连兴旺电子) | 25051 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46078 | 15元迈旭品牌商品券 | MAX(迈旭) | 15187 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66226 | <品牌新人>15元MDD品牌商品券 | MDD(辰达半导体) | 164 | 新人标注；目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66228 | 15元兆星品牌商品券 | Megastar(兆星) | 15340 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46149 | 15元美华品牌商品券 | MEIHUA(美华) | 11965 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46034 | <品牌新人>15元明惠成和品牌指定类目商品券 | MHCH(明惠成和) | 27394 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66668 | 15元毫欧品牌商品券 | Milliohm(毫欧) | 12131 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66083 | 15元迈诺斯品牌商品券 | minos(迈诺斯) | 13052 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66236 | 15元明硕品牌商品券 | MINTRON(明硕) | 11880 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66720 | 15元仁懋品牌商品券 | MOT(仁懋) | 14048 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66095 | 15元美禄科技品牌商品券 | MP(美禄科技) | 15548 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66577 | <品牌新人>15元MPS品牌商品券 | MPS(芯源) | 283 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66241 | 15元美森科品牌商品券 | MSKSEMI(美森科) | 12667 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66354 | 15元摩天射频品牌商品券 | MyAntenna(摩天射频) | 16013 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66489 | 15元敏源传感品牌商品券 | Mysentech(敏源传感) | 12731 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66634 | 15元宝橙品牌商品券 | NBC(宝橙) | 11984 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66356 | 15元纽航品牌商品券 | NH(纽航) | 15356 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66416 | 15元尼博星品牌商品券 | NYBOXING(尼博星) | 12133 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66242 | 15元徕飞品牌商品券 | Nyfea(徕飞) | 17208 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66358 | 15元欧思科品牌商品券 | OPSCO(欧思科) | 12580 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66104 | 15元派克微品牌商品券 | PAKER(派克微) | 13369 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66244 | 15元谱罗德品牌商品券 | PROD(谱罗德) | 12072 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66530 | <品牌新人>15元乾能惠品牌商品券 | QNHCHIP(乾能惠) | 17333 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66559 | <品牌新人>15元正芯半导体品牌商品券 | RealChip(正芯半导体) | 13712 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66360 | 15元台普品牌商品券 | ROCPU Switches(台普) | 12574 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 45989 | 15元容强品牌商品券 | ROQANG(容强) | 851 | 短期至2026-11-13 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-11 00:00:00 – 2026-11-13 23:59:59 | 活动专区；2026年双11优惠券活动 | invalid=false; done=false |
| 16减15 | 66308 | 15元容硕品牌商品券 | RS(容硕) | 14032 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66362 | 15元瑞隆源品牌商品券 | RUILON(瑞隆源) | 1117 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66800 | <品牌新人>15元海旭品牌商品券 | S&S(海旭) | 11883 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66246 | 15元三佐品牌商品券 | SAMZO(三佐) | 16226 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66309 | 15元深海电子品牌商品券 | SANHI(深海电子) | 18751 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66502 | 15元星通时频品牌商品券 | SCTF(星通时频) | 11630 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66250 | 15元升阳品牌商品券 | SHENGYANG(升阳) | 17425 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66364 | <品牌新人>15元时科品牌商品券 | SHIKUES(时科) | 1138 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66740 | 15元芯昌科技品牌商品券 | SiChange(芯昌科技) | 16222 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66841 | 15元永星科技品牌商品券 | SIE(永星科技) | 27001 | 短期至2026-11-13 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-11 00:00:00 – 2026-11-13 23:59:59 | 活动专区；2026年双11优惠券活动 | invalid=false; done=false |
| 16减15 | 66366 | 15元矽普品牌商品券 | Siliup(矽普) | 15945 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66463 | <品牌新人>15元银月光品牌商品券 | Silverlight(银月光) | 12705 | 新人标注；目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46073 | 15元上海矽朋品牌商品券 | Siproin(上海矽朋) | 11694 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66254 | 15元SM Switch品牌商品券 | SM Switch | 12572 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46154 | 15元硕方品牌商品券 | SOFNG(硕方) | 1218 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66256 | 15元索瑞达品牌商品券 | SOREDE(索瑞达) | 12685 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66159 | <品牌新人>15元索斯特品牌商品券 | SOSET(索斯特) | 13181 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46024 | 15元圣融达品牌商品券 | SRD(圣融达) | 1056 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66465 | 15元斯瑞特品牌商品券 | SRT(斯瑞特) | 12586 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66739 | 15元思大品牌商品券 | Starwave(思大) | 12464 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66824 | 15元松田品牌商品券 | STE(松田) | 11597 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66423 | <品牌新人>15元斯泰普品牌工业品券 | STEIPU(斯泰普) | 12388 | 新人标注；工业品专区 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 工业品专区；立创工业品-品牌推广-26年11月 | invalid=false; done=false |
| 16减15 | 66468 | <品牌新人>15元韩国星炆电子品牌商品券 | SUNGMUN(韩国星炆电子) | 12028 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66258 | 15元顺磁品牌商品券 | Sunltech(顺磁) | 11440 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66368 | <品牌新人>15元森美特品牌商品券 | SUNMATE(森美特) | 1195 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66504 | 15元洺太电子品牌商品券 | suntek(洺太电子) | 12518 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66160 | 15元信维通信品牌商品券 | Sunway(信维通信) | 13452 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66663 | 15元国晶微半导体品牌商品券 | SUPSiC(国晶微半导体) | 12612 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66260 | 15元绍鑫品牌商品券 | SURGING(绍鑫) | 12247 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46026 | 15元顺翔诺品牌商品券 | SXN(顺翔诺) | 11353 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66161 | <品牌新人>15元天成品牌商品券 | TCWIN(天成) | 12404 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66370 | <品牌新人>15元拓电半导体品牌商品券 | TDSEMIC(拓电半导体) | 16094 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66263 | 15元台舟品牌商品券 | TECH PUBLIC(台舟) | 12241 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66472 | 15元德律风根品牌商品券 | TFSS(德律风根) | 12547 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66473 | 15元泰晶品牌商品券 | TKD(泰晶) | 11696 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66506 | 15元统佳品牌商品券 | TOGIALED(统佳) | 11541 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46164 | 15元黄宝石品牌商品券 | TOPAZCON(黄宝石) | 11401 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66476 | 15元天源品牌商品券 | TPOWER(天源) | 11941 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66090 | 15元创捷品牌商品券 | TROQ(创捷) | 12546 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66097 | <品牌新人>15元信安品牌商品券 | Truesemi(信安) | 11939 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66787 | 15元钍地半导体品牌商品券 | Tudi(钍地半导体) | 16038 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66372 | 15元拓展光电品牌商品券 | TUOZHAN(拓展光电) | 12297 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66271 | 15元迪嘉品牌商品券 | TWGMC(迪嘉) | 12376 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46028 | 15元友贸品牌商品券 | UMaxconn(友贸) | 12006 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66374 | 15元友台半导体品牌商品券 | UMW(友台半导体) | 11853 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66531 | 15元宇力半导体品牌商品券 | UNI-SEMIC(宇力半导体) | 11999 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66563 | 15元VISOM品牌商品券 | VISOM | 12425 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66532 | 15元沃进品牌商品券 | Vollgo(沃进) | 12356 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66665 | <品牌新人>15元万盛品牌商品券 | WALSON(万盛) | 18304 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66272 | 15元伟烽品牌商品券 | WF(伟烽) | 12761 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66274 | 15元格林柏品牌商品券 | WingTAT(格林柏) | 15171 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66633 | 15元worldsemi品牌商品券 | worldsemi | 1250 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66101 | 15元国硅集成品牌商品券 | WXNSIC(国硅集成) | 15349 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66508 | 15元芯伯乐品牌商品券 | XBLW(芯伯乐) | 15584 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66479 | 15元芯鼎盛品牌商品券 | XDS(芯鼎盛) | 11758 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66277 | 15元兴飞品牌商品券 | XFCN(兴飞) | 12130 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46035 | <品牌新人>15元兴华鑫品牌商品券 | XHXDZ(兴华鑫) | 18771 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66376 | 15元成兴光品牌商品券 | XINGLIGHT(成兴光) | 12469 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66836 | 15元信路达品牌商品券 | XINLUDA(信路达) | 12211 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66162 | 15元鑫扬泽品牌商品券 | Xinyangze(鑫扬泽) | 13320 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66736 | 15元中国星坤品牌商品券 | XKB Connection(中国星坤) | 11722 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66426 | <品牌新人>15元芯网品牌工业品券 | XMXW(芯网) | 11962 | 新人标注；工业品专区 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 工业品专区；立创工业品-品牌推广-26年11月 | invalid=false; done=false |
| 16减15 | 66510 | 15元新锐品牌商品券 | XNRUSEMI(新锐) | 17409 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66087 | 15元祥如品牌商品券 | XR(祥如) | 15267 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66482 | 15元旭茂微品牌商品券 | XUMAO(旭茂微) | 16031 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66278 | 15元讯答品牌商品券 | XUNDA(讯答) | 15535 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46074 | 15元讯普品牌商品券 | XUNPU(讯普) | 11687 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 46156 | 15元辛译品牌商品券 | XYECONN(辛译) | 15593 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66655 | <业展>15元PLUS专属券 | yezhan(业展) | 12113 | PLUS | plus | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 分区plus；2026年11月PLUS专属品牌优惠 | invalid=false; done=false |
| 16减15 | 66378 | <品牌新人>15元佑风微品牌商品券 | YFW(佑风微) | 12510 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66430 | <品牌新人>15元广东怡远品牌工业品券 | yiyuanxny(广东怡远) | 15458 | 新人标注；工业品专区 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 工业品专区；立创工业品-品牌推广-26年11月 | invalid=false; done=false |
| 16减15 | 66474 | 15元逸致品牌工业品券 | YIZHI(逸致) | 18649 | 工业品专区 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 工业品专区；立创工业品-品牌推广-26年11月 | invalid=false; done=false |
| 16减15 | 66312 | 15元雅晶鑫品牌商品券 | YJX(雅晶鑫) | 1181 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66380 | <品牌新人>15元益嘉源品牌商品券 | YJYCOIN(益嘉源) | 11837 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66660 | 15元永铭品牌商品券 | Ymin(永铭) | 11692 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66716 | <品牌新人>15元永裕泰品牌商品券 | YONGYUTAI(永裕泰) | 13025 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66698 | <品牌新人>15元亚特联品牌商品券 | YTL(亚特联) | 12342 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66512 | 15元元迪品牌商品券 | Yuandi(元迪) | 12165 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66525 | 15元裕峰品牌工业品券 | YUFENG(裕峰) | 18367 | 工业品专区 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 工业品专区；立创工业品-品牌推广-26年11月 | invalid=false; done=false |
| 16减15 | 66283 | <品牌新人>15元扬兴晶振品牌商品券 | YXC(扬兴晶振) | 287 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66163 | 15元宇熙精密品牌商品券 | Yxcon(宇熙精密) | 15465 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66717 | 15元增益品牌商品券 | ZE(增益) | 12475 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66484 | 15元温达电子品牌商品券 | ZGWD(温达电子) | 16617 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66692 | 15元正芯品牌商品券 | Zhengxin(正芯) | 13493 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66789 | 15元众迪品牌商品券 | Zhongdi(众迪) | 15966 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66537 | 15元中科无线品牌商品券 | Zhongke Wireless(中科无线) | 25253 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 16减15 | 66632 | <品牌新人>15元中逸光品牌商品券 | ZOEYGO(中逸光) | 11876 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 46084 | <品牌新人>20元国星光电品牌商品券 | 国星光电 | 966 | 新人标注；短期至2026-11-13 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-11 00:00:00 – 2026-11-13 23:59:59 | 活动专区；2026年双11优惠券活动 | invalid=false; done=false |
| 21减20 | 66654 | <国星光电>20元PLUS专属券 | 国星光电 | 966 | PLUS | plus | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 分区plus；2026年11月PLUS专属品牌优惠 | invalid=false; done=false |
| 21减20 | 66701 | 20元台湾陆海品牌商品券 | 台湾陆海 | 462 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66686 | 20元宝乘品牌商品券 | baocheng(宝乘) | 11854 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66164 | 20元佰宏品牌商品券 | BHFUSE(佰宏) | 12424 | 目录:MRO所有目录 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66166 | 20元比诺星品牌商品券 | BNstar(比诺星) | 12606 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66386 | <品牌新人>20元正成品牌商品券 | CAZN(正成) | 15353 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 46080 | 20元晁禾品牌商品券 | CCX(晁禾) | 24412 | 短期至2026-11-13 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-11 00:00:00 – 2026-11-13 23:59:59 | 活动专区；2026年双11优惠券活动 | invalid=false; done=false |
| 21减20 | 66616 | 学生认证 \| 20元华瓷品牌商品券 | Chinocera(华瓷) | 12099 | 学生认证 | student_auth | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；2026年11月学生认证专属优惠券 | invalid=false; done=false |
| 21减20 | 46000 | 20元长江微电品牌商品券 | cjiang(长江微电) | 11425 | 短期至2026-11-13 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-11 00:00:00 – 2026-11-13 23:59:59 | 活动专区；2026年双11优惠券活动 | invalid=false; done=false |
| 21减20 | 66331 | 20元广东场效应半导体品牌商品券 | Cmos(广东场效应半导体) | 15188 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66333 | 20元磁联达品牌商品券 | CND-tek(磁联达) | 12021 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 45984 | 20元驰兴电感品牌商品券 | Coilank(驰兴电感) | 11602 | 短期至2026-11-13 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-11 00:00:00 – 2026-11-13 23:59:59 | 活动专区；2026年双11优惠券活动 | invalid=false; done=false |
| 21减20 | 46043 | 20元易成品牌商品券 | EVISUN(易成) | 15453 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66688 | 20元高芯电子品牌商品券 | FAUKU(高芯电子) | 24398 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66188 | 20元富港品牌商品券 | FG(富港) | 12635 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66624 | <韩下>20元PLUS专属券 | hanxia(韩下) | 14053 | PLUS | plus | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 分区plus；2026年11月PLUS专属品牌优惠 | invalid=false; done=false |
| 21减20 | 46110 | 20元虹成电子品牌商品券 | HC(虹成电子) | 15376 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 46081 | 20元和佳品牌商品券 | HEGA(和佳) | 27312 | 短期至2026-11-13 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-11 00:00:00 – 2026-11-13 23:59:59 | 活动专区；2026年双11优惠券活动 | invalid=false; done=false |
| 21减20 | 66848 | 20元荣誉品牌商品券 | HONOR(荣誉) | 991 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 46012 | 20元华轩阳电子品牌商品券 | HXY MOSFET(华轩阳电子) | 13437 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66214 | 20元集电通品牌商品券 | JDTfuse(集电通) | 419 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66089 | 20元晶力源品牌商品券 | JLYE(晶力源) | 18554 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66575 | 20元康宏电子品牌商品券 | Khon(康宏电子) | 17159 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 46137 | 20元凯越翔品牌商品券 | KYX(凯越翔) | 11898 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 45993 | 20元莱联品牌商品券 | LAILAN(莱联) | 26882 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 精选专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66801 | 20元联盈控品牌商品券 | LINKEYCON(联盈控) | 16314 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 46082 | 20元陆特品牌商品券 | LUTE(陆特) | 15464 | 短期至2026-11-13 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-11 00:00:00 – 2026-11-13 23:59:59 | 活动专区；2026年双11优惠券活动 | invalid=false; done=false |
| 21减20 | 66222 | 20元连线电子品牌商品券 | LX(连线电子) | 11956 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66658 | <品牌新人>20元元磁品牌商品券 | Magnetsyc(元磁) | 16049 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66232 | <品牌新人>20元美铼品牌商品券 | MetalLions(美铼) | 365 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 46039 | 20元毫欧品牌商品券 | Milliohm(毫欧) | 12131 | 短期至2026-11-13 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-11 00:00:00 – 2026-11-13 23:59:59 | 活动专区；2026年双11优惠券活动 | invalid=false; done=false |
| 21减20 | 66491 | <品牌新人>20元宏嘉诚品牌商品券 | R+O(宏嘉诚) | 15352 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 46166 | <品牌新人>20元开步睿思品牌商品券 | RESI(开步睿思) | 11761 | 新人标注 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 46059 | 20元瑞鑫品牌商品券 | ReSine PS(瑞鑫) | 15768 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66542 | 20元信德品牌工业品券 | SDTRUVAL(信德) | 17310 | 工业品专区 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 工业品专区；立创工业品-品牌推广-26年11月 | invalid=false; done=false |
| 21减20 | 66695 | 20元高钺达品牌商品券 | SHETIME(高钺达) | 25186 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 46152 | 20元首韩品牌商品券 | SHOU HAN(首韩) | 11955 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66311 | 20元微尔品牌商品券 | WIER(微尔) | 12362 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66569 | 20元微硕品牌指定类目商品券 | WINSOK(微硕) | 941 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66075 | 20元业展品牌商品券 | yezhan(业展) | 12113 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66382 | 20元易川品牌商品券 | YLPTEC(易川) | 13306 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
| 21减20 | 66280 | 20元宇文发品牌商品券 | YWF(宇文发) | 26864 | 未见额外资格标签 | all | general,bronzemedal,silvermedal,goldmedal,diamondmedal,lmperialcrown | 2026-11-01 00:00:00 – 2026-11-30 23:59:59 | 品牌券专区；26年11月品牌商品券活动 | invalid=false; done=false |
