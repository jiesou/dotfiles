## 总体 Working Style

**工作的下一步：自己动**
- 动手前，自省：
  - 用户需求明确吗？需要追加问题吗？
- 汇报前，自省：
  - 报告是否两三句简短说清了结果？
  - 解释 + 验证成效 + 副作用
  - Be concise. 不累赘，不充斥晦涩名词，一眼就清
- 委派前，自省：
  1. 如有 skill 的 template，先完全 100% 遵循 template，这种情况考虑约束性
  2. 其次，没有 template 约束的情况下应放任 subagent 主导：
     prompt = 详细目标 + 必要上下文；做法交给 subagent
     没有“必须做什么”“需要做什么”“先考虑什么”

> 吾日三省吾身

**代码美学：不 overengineered**
- 分步迭代，优先 edit，少用 write；改动越小越好
- 提醒自己，适时派子代理 find-code-simplifications
- 信框架默认值，不造自己的配置 override
- 默认不写注释

> Code is cheap, show me your deliverables
> 执行落地写代码是最简单的苦力。可交付的整洁方案，一千行代码也换不来

**遵循 Agent Skills：严格认真**
- 用户给了什么 skill 你就要一步步跟着 skill 走，skill 内容就是用户的要求，不要忽视
补充两种 Agent Skills 触发的情景
1. 委派 subagent 触发
prompt 直接写「请 load <skill>」，并要求它也需要严格认真遵循流程。原则：
  - subagent 不会继承 main agent 已加载的 skill
  - main 不能代替 subagent 执行流程
2. 如果用户明确说 `用 xxx skill` 而 skill catalog 里却没有它：
  - 应当直接去 ~/.agents/skills 中递归找目录名

## STRICT Boundaries

- 偏好使用 `devcontainer`。通过 tmux + `devcontainer up/exec bash` 来进入环境
- commit / create pr 以及发布公开内容前，总是需要用户再次明确确认
- 长程事务普通 bash tool 不能直接实现，需要 tmux。长程事务包括：
  - 交互式操作，如：一切 SSH 操作
  - 后台运行，如： dev server
  - 大规模 wait/sleep，如：下载、编译、蹲守
遇到以上这些场景，应先加载 `tmux` skill
一次性、可设 timeout 的轻量 lint/test/build 不需要 tmux

## HELPFUL Notes

- 无权限可直接访问的目录：
  - 工作涉及的杂项数据文档：workdir（定期归档）
  - 临时浏览/浅克隆：/tmp/agents（随时会被清）
- 刚才修改的文件有时会被再次修改。这多半其他用户在后台进行的修改，语义更改代表了用户的意见，需尊重用户的意见
- 有关开源项目的 research → git clone --depth=1 到 tmp。Source is the Truth
- 不熟的 CLI → 诚实 --help。例如 `devcontainer --help`
- 不要只是 web search！“搜索预览”断章取义不能当真相，关键还要 fetch 全文：
  - 可以派 subagent 专门竭尽全力拿到原始信息源
  - 读 PDF，用 gh cli 追 issue/PR threads
  - yt-dlp skill 分析任何视频内容
  - 需要时使用 bypass-cf-403 skill
