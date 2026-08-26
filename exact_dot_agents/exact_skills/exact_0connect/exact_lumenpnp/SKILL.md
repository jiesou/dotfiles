---
name: lumenpnp
description: LumenPnP 开源贴片机中文知识库
disable-model-invocation: true
---

# LumenPnP 知识库

所有知识库内容，都以 `.md` 的方式存放于当前 skill 的 `references` 目录下

## MidMaker 知识库

> Source: https://tcnyw794ws3e.feishu.cn/wiki/LVXow8r6MiKV5KkbJgZcMZUrnPg

该知识库是关于 LumenPnP 开源贴片机的中文教程，由 MidMake（南京睿造科技）维护。
MidMake 是中国国内品牌，旨在 1:1 复刻 opulo 原厂 LumenPnP v4，国产化该设备，让国内玩家以更低的价格购买到该设备。

```
LumenPnP 开源贴片机教程
├── LumenPnP 是什么？                    # 项目介绍、能力规格
├── LumenPnP 组装
│   ├── 开箱                            # 开箱清单
│   ├── 框架组装
│   └── 电气部分组装
├── LumenPnP V4校准
│   ├── 准备工作
│   ├── 验证校准
│   └── 问题与解决方案                    # OpenPNP 的一系列自动化正式校准向导
├── V4.0版本校准教程（单校准板版本）
│   ├── OpenPnP安装调试
│   └── LumenPnP V4 校准
├── 常见错误汇总                          # 贴装错误排查
├── 视觉通道调整
├── 飞达使用教程
│   ├── 电动飞达
│   ├── 编带散料飞达
│   ├── 视觉散料
│   └── 其它第三方电动飞达
├── 指南-其它
│   ├── Mark点
│   ├── 新建封装和底部视觉配置
│   ├── 常用软件的坐标文件导出和导入
│   ├── 真空元件检测（气压传感器）
│   ├── 更新飞达固件
│   └── pos2PnP - POS 文件转换工具
└── llms.txt                             # 知识库全文（自动生成）
```

_以上所含的 Markdown 就是飞书文档 知识库 的全部内容。你不需要访问飞书文档 Source_

## 第一步：加载全文

先 `read` 本 skill 目录下的 `llms.txt` **全文**。这是整个知识库的完整拼接，读完后你心里要知道全局有什么内容。

## 第二步：按需搜索

用户提问后，先用 grep 在 `references/` 搜索具体关键词，找到对应 `.md` 后按需 `read` 该文件获取完整内容。文档含图片引用，图片在同名子目录下，可直接引用 Markdown 中的相对路径。

## 第三步：丰富资料

若 MidMaker 知识库没有准确合适的内容，则需要使用 web search 来查找有关 opulo 原厂机/OpenPnP 等更丰富的资料，重点关注：

- https://docs.opulo.io/*
- https://github.com/openpnp/openpnp/wiki/*

但铭记：MidMaker 知识库 作为 source of truth

## 更新知识库

知识库从飞书 wiki 自动导出。如需更新：

```bash
bash scripts/update.sh
```

这个脚本会：
1. `discover_pages.py` — Playwright 遍历飞书 wiki 节点树，发现所有页面
2. `export_pages.py` — Playwright 渲染每页 → html2text 转 Markdown → 下载内容图片
3. `generate_llms_txt.py` — 按层级结构拼接 `llms.txt`

依赖通过 `uv run --with` 自动管理，无需全局 pip install。
