# Agent Skills 约定

## 目录分类

顶层放跨领域的通用 skill（tmux、notepad、grilling、handoff、find-skills…）。其余按前缀归类：

- `0connect/` 连接外部服务
- `0devops/` 环境cleanup、运维流程
- `0workflow/` 端到端可复用的工作流程
- `0edu/` 学科学习
- `0enhance/` 增强模型自身能力
- `0archived/` 已废弃，勿用

## disable-model-invocation

默认加上。

只有需要模型在合适场景自动触发的通用 skill 不加 —— 即顶层那批 skill，以及 bypass-cf-403、cpp-style、gh、markitdown、yt-dlp、watch-video 这类 0connect 内的常用 skill。其余一律加。

## description

常驻上下文，越短越好。一句话，只写触发条件，`USE when` 开头。

安装他人的skill，description通常较长，需自行精简。

## 新建 skill

放进对应分类目录，目录名 = skill 名（小写连字符）。用 skill-creator 的 init_skill.py 起手，然后：

- frontmatter 三行：name / description / disable-model-invocation
- 正文只留踩过才知道的东西：判定阈值、反直觉行为、命令陷阱
- 反复重写的逻辑收进 scripts/，别在正文贴代码
- 脚本要实际跑过再算数
- 别写 README / CHANGELOG 等辅助文档

写文档别堆料。默认模型已经很聪明，它已经懂的不用写；写下来是为了少踩坑，不是为了交代清楚。

