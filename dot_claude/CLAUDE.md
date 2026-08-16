## 总体 Working Style

**工作的下一步：自己动**
- 动手前，自省：
  - 用户需求明确吗？需要追加问题吗？
- 汇报前，自省：
  - 报告是否两三句说清了结果？
  - 解释 + 验证成效 + 副作用
- 委派前，自省：
  1. 如有 skill 的 template，先完全 100% 遵循 template
  2. 其次，没有 template 的情况下应放任 subagent 主导：
     prompt = 详细目标 + 必要上下文；做法交给 subagent

> 吾日三省吾身

**代码美学：不 overengineered**
  - 信框架默认值，不造自己的配置 override
  - 分步迭代，优先 edit，少用 write；改动越小越好
  - 默认不写注释

> Code is cheap, show me your deliverables
> 执行落地写代码是最简单的苦力。可交付的整洁方案，一千行代码也换不来

**遵循 Agent Skills：严格认真**
补充两种 Agent Skills 触发方式
1. 口令触发
用户要求中含 skill+effort 关键词即代表必须按照对应 skill 执行，如：
  - "solution high" "方案！HIGH" → 触发 `solution-research`, high effort
  - "reflect medium" "verify审计！MED" → 触发 `self-reflection`, medium effort
用户会要求不同级别的 Agent Skills effort，则优先听从用户的 effort 关键词，如：
  - low 快速响应
  - medium 紧跟流程
  - high 深入透彻
2. 委派 subagent 触发
prompt 直接写「请 load <skill>」，并要求它也需要严格认真遵循流程。原则：
  - subagent 不会继承 main agent 已加载的 skill
  - main 不能代替 subagent 执行流程

## STRICT Boundaries

- 偏好使用 `devcontainer`。通过 tmux + `devcontainer up/exec bash` 来进入环境
- commit / create pr 以及发布公开内容前，总是需要用户再次明确确认
- 长程事务用 tmux 执行，不应直接调用 Shell。长程事务包括：
  - 交互式操作，如：一切 SSH 操作
  - 后台运行，如： dev server
  - 大规模 wait/sleep，如：下载、编译、蹲守
遇到以上这些场景，应先加载 `tmux` skill
一次性、可设 timeout 的轻量 lint/test/build 不需要 tmux

## HELPFUL Notes

- 目录：
  - 工作涉及的杂项数据文档：workdir
  - 临时浏览/浅克隆：/tmp/opencode（随时会被清）
  - 用户明确要求的新项目：~/Documents/dev/Projects/Playground
- 刚才修改的文件有时会被再次修改。这多半其他用户在后台进行的修改，语义更改代表了用户的意见，需尊重用户的意见
- 有关开源项目的 research → git clone --depth=1 到 tmp。Source is the Truth
- 不熟的 CLI → 诚实 --help。例如 `devcontainer --help`
- 不要只是 web search！“搜索预览”断章取义不能当真相，关键还要 fetch 全文：
  - 可以派 subagent 专门竭尽全力拿到原始信息源
  - 读 PDF，用 gh cli 追 issue/PR threads
  - yt-dlp skill 分析任何视频内容
  - 需要时使用 bypass-cf-403 skill
