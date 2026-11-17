#!/usr/bin/env node

const fs = require('node:fs');

function loadApiResponse(path) {
  const input = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (input.result?.couponModelVOListMap) return input;

  const result = input.results?.find((item) => item.url?.includes('/activity/coupon'));
  if (!result?.text) throw new Error('Input must be the coupon API JSON or its fetch wrapper.');
  const text = result.text.replaceAll('\\_', '_');
  const api = JSON.parse(text);
  if (!api.result?.couponModelVOListMap) throw new Error('Coupon list not found in response.');
  return api;
}

function main() {
  const [inputPath, outputPath, capturedAt] = process.argv.slice(2);
  if (!inputPath || !outputPath || !capturedAt) {
    throw new Error('Usage: generate_coupon_brands.js <response.json> <output.md> "YYYY-MM-DD HH:mm:ss"');
  }
  const date = capturedAt.slice(0, 10);
  const [year, month] = date.split('-').map(Number);
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`;
  const groups = loadApiResponse(inputPath).result.couponModelVOListMap;
  const rows = [];

  for (const [section, coupons] of Object.entries(groups)) {
    if (!Array.isArray(coupons)) continue;
    for (const coupon of coupons) {
      const tier = coupon.couponAmount === 15 && coupon.minOrderMoney === 16 ? '16-15'
        : coupon.couponAmount === 20 && coupon.minOrderMoney === 21 ? '21-20' : null;
      if (!tier || !coupon.brandIds || coupon.couponType !== 'product') continue;
      if (coupon.couponValidBeginTime && coupon.couponValidBeginTime.slice(0, 10) > date) continue;
      if (coupon.couponValidEndTime && coupon.couponValidEndTime.slice(0, 10) < date) continue;

      rows.push({
        tier,
        section,
        couponId: coupon.couponId,
        couponName: coupon.couponName || '',
        brand: coupon.brandNames || '',
        brandId: coupon.brandIds,
        customerType: coupon.customerType || '',
        grantLevel: coupon.grantLevel || '',
        limitCatalog: coupon.limitCatalogNames || '',
        limitProductCodes: coupon.limitProductCodes || '',
        validFrom: coupon.couponValidBeginTime || '',
        validTo: coupon.couponValidEndTime || '',
        activity: coupon.couponActivityName || '',
        isInvalid: coupon.isInvalid,
        isDone: coupon.isDone,
      });
    }
  }

  const tierOrder = { '16-15': 0, '21-20': 1 };
  rows.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]
    || a.brand.localeCompare(b.brand, 'zh')
    || a.brandId.localeCompare(b.brandId)
    || String(a.couponId).localeCompare(String(b.couponId)));

  const byBrandTier = new Map();
  for (const row of rows) byBrandTier.set(`${row.tier}|${row.brandId}`, row);
  const brandIds = new Set(rows.map((row) => row.brandId));
  const countBrands = (tier) => new Set(rows.filter((row) => row.tier === tier).map((row) => row.brandId)).size;
  const countRows = (tier) => rows.filter((row) => row.tier === tier).length;
  const tag = (row) => {
    const tags = [];
    if (/新人|新客/.test(row.couponName)) tags.push('新人标注');
    if (row.customerType === 'plus') tags.push('PLUS');
    if (row.customerType === 'student_auth') tags.push('学生认证');
    if (row.limitCatalog) tags.push(`目录:${row.limitCatalog}`);
    if (row.limitProductCodes) tags.push(`SKU:${row.limitProductCodes}`);
    if (/工业品/.test(row.couponName) || row.section === '5') tags.push('工业品专区');
    if (row.validTo && row.validTo.slice(0, 10) !== monthEnd) tags.push(`短期至${row.validTo.slice(0, 10)}`);
    return tags.join('；') || '未见额外资格标签';
  };
  const escapeCell = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');

  let output = '<!-- 由 scripts/generate_coupon_brands.js 生成；请勿手工编辑，修改后重新生成。 -->\n\n';
  output += '# LCSC 满16减15 / 满21减20品牌清单快照\n\n';
  output += `- **快照时间：** ${capturedAt} CST (UTC+08:00)\n`;
  output += `- **数据日期：** ${date}\n`;
  output += '- **来源接口：** `GET https://activity.szlcsc.com/activity/coupon?couponType=&sortColumn=&sortType=&searchValue=&searchCatalogStr=&searchBrandNameStr=&catalogId=`；页面入口：`https://www.szlcsc.com/huodong.html`\n';
  output += '- **取得原始响应：** 在已登录的商城页面上下文调用 `fetch("https://activity.szlcsc.com/activity/coupon?couponType=&sortColumn=&sortType=&searchValue=&searchCatalogStr=&searchBrandNameStr=&catalogId=", {credentials:"include"})`，将响应 JSON 保存为文件。\n';
  output += '- **生成脚本：** `scripts/generate_coupon_brands.js`。保存接口 JSON 响应后运行 `node scripts/generate_coupon_brands.js <response.json> <output.md> "YYYY-MM-DD HH:mm:ss"`；时间参数按 CST (UTC+08:00) 提供。\n';
  output += '- **匹配口径：** 遍历响应 `result.couponModelVOListMap` 下所有数组；保留 `couponType=product`、`brandIds` 非空，且 `couponAmount/minOrderMoney` 精确为 `15/16` 或 `20/21`、有效期覆盖数据日期的记录。按优惠档位及品牌ID去重生成品牌索引；券记录表保留符合条件的每条记录及资格差异。\n';
  output += `- **覆盖计数：** 满16减15 ${countBrands('16-15')} 个品牌；满21减20 ${countBrands('21-20')} 个品牌；共 ${brandIds.size} 个不同品牌。匹配券记录 ${rows.length} 条（按档位和品牌去重后 ${byBrandTier.size} 条）。\n`;
  output += '- **限制：** 这是券中心展示响应快照，不代表当前账号都可领取，也不保证所有SKU适用。资格、券余量、商品限制及结算可用性需在账号内复核。\n\n';
  output += '## 去重品牌索引\n\n';

  for (const [tier, title] of [['16-15', '满16减15'], ['21-20', '满21减20']]) {
    const brands = [...byBrandTier.entries()]
      .filter(([key]) => key.startsWith(`${tier}|`))
      .map(([, row]) => row);
    output += `### ${title}（${brands.length}个）\n\n`;
    output += '| 品牌 | 品牌ID | 券记录/资格提示 |\n|---|---:|---|\n';
    for (const row of brands) {
      const variants = rows.filter((item) => item.tier === tier && item.brandId === row.brandId);
      const notes = [...new Set(variants.map((item) => `${item.couponName}${tag(item) === '未见额外资格标签' ? '' : `（${tag(item)}）`}`))].join('<br>');
      output += `| ${escapeCell(row.brand)} | ${escapeCell(row.brandId)} | ${escapeCell(notes)} |\n`;
    }
    output += '\n';
  }

  output += '## 匹配券记录明细\n\n每条匹配记录单独列出，避免合并时丢失同品牌不同资格、专区或有效期。\n\n';
  output += '| 档位 | 券ID | 券名称 | 品牌 | 品牌ID | 资格/范围标注 | 适用会员 | 会员等级 | 有效期 | 活动/分区 | 状态字段 |\n|---|---:|---|---|---:|---|---|---|---|---|---|\n';
  const sections = { '1': '精选专区', '2': '品牌券专区', '3': '活动专区', '4': 'PLUS专区', '5': '工业品专区' };
  for (const row of rows) {
    const section = sections[row.section] || `分区${row.section}`;
    const validity = `${row.validFrom || '未提供'} – ${row.validTo || '未提供'}`;
    const status = `invalid=${row.isInvalid}; done=${row.isDone}`;
    output += `| ${row.tier === '16-15' ? '16减15' : '21减20'} | ${escapeCell(row.couponId)} | ${escapeCell(row.couponName)} | ${escapeCell(row.brand)} | ${escapeCell(row.brandId)} | ${escapeCell(tag(row))} | ${escapeCell(row.customerType || '未提供')} | ${escapeCell(row.grantLevel || '未提供')} | ${escapeCell(validity)} | ${escapeCell(`${section}；${row.activity}`)} | ${escapeCell(status)} |\n`;
  }

  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(JSON.stringify({
    outputPath,
    capturedAt,
    records: rows.length,
    uniqueBrands: brandIds.size,
    tiers: {
      '16-15': { records: countRows('16-15'), brands: countBrands('16-15') },
      '21-20': { records: countRows('21-20'), brands: countBrands('21-20') },
    },
  }));
}

main();
