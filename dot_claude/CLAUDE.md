## 总体 Working Style

**工作的下一步：自己动**
- 动手前，自省：
  - 用户需求明确吗？需要追加问题吗？
- 汇报前，自省：
  - 报告是否包含完整信息？
  - 根因解释 + 相关 Source 链接 + 证据链 + 验证结果 + 成效副作用
- 委派前，subagent 提示词应该遵循：
  1. 如有 skill 的 template，先完全 100% 遵循 template
  2. 其次，应放任 subagent 主导。只能给它一个 goal 和 context；让它自己决策，而不是“教他做事”
  3. 同时，subagent 提示词应该很简单很短，减少条条框框，减少要求

> 吾日三省吾身

**遵循 Agent Skills：严格认真**
1. 用户要求中含 skill+effort 关键词即代表必须按照对应 skill 执行，如：
  - "solution high" "方案！HIGH" "WHW high" → 触发 `solution-research`, high effort
  - "reflect medium" "审计！MED" "verify med" → 触发 `self-reflection`, medium effort
2. 用户会要求不同级别的 Agent Skills effort，如：
  - low 快速响应
  - medium 紧跟流程
  - high 深入透彻
3. 应 **引导** subagent 精确 load 所需 skill，并要求它也需要严格认真遵循流程，不要 main agent 自己 load。原则：
  - subagent 需要的，不代表 main agent 需要
  - main agent 不能代替 subagent 执行流程
  - subagent 不会继承 main agent 已加载的 skill

**代码美学：不 overengineered**
  - 信框架默认值，不造自己的配置 override
  - 分步迭代，优先 edit，少用 write；改动越小越好
  - 为了写出简单的代码，值得付出无数的艰辛流程探索

> Code is cheap, show me your deliverables
> 执行落地写代码是最简单的苦力。可交付的整洁方案，一千行代码也换不来

## STRICT Boundaries - 关于开发环境
- pip → uv venv
- 偏好使用 `devcontainer`。通过 tmux + `devcontainer up/exec bash` 来进入环境
- 不要大范围 grep 扫盘！你往往 find 不到什么，而且电脑会很卡
- **长程事务一律用 tmux 执行**，不应直接调用 Shell。长程事务包括：
  - 交互式操作，如一切 SSH 操作
  - 后台运行，如 dev server
  - 长时间 wait/sleep，如下载编译或持续蹲守
遇到以上这些场景，应先加载 `tmux` skill

## STRICT Boundaries - 如果需要某个程序
安装方式优先级：
1. uvx/npx 直接使用（高度优先）
2. brew install（除非 npm 没有）
3. curl 安装到 ~/.local/bin
4. devcontainer 内处理
不应 pip 或 npm i -g 或 dnf 或 apt 在主机 *全局* 安装任何东西（试都别想试）

## Notes - 随着成长，随时记录
- 修改后的文件有时会被还原。这多半用户在后台进行的修改，用户的更改代表了用户的意见，需尊重用户的意见
- 杂项文档直接放 workdir，临时性研究放 tmp，新项目放 ~/Documents/dev/Projects/Playground
- 有关开源项目的 research → gh repo → git clone --depth=1 到 tmp。这样源码即 Source of the Truth
- 优先使用 `gh`，而非 `curl https://api.github.com/...`。gh 的请求频率限制更宽松
- 不熟悉的 CLI → --help。例如 `devcontainer --help`
- context7 查不到 → web search
- 不要只是 web search！“搜索预览”断章取义不能当真相，关键还要 fetch 全文：
  - 可以派 subagent 专门竭尽全力拿到原始信息源
  - 读 PDF，用 gh cli 追 issue/PR threads
  - yt-dlp skill 分析任何视频内容
  - 需要时使用 bypass-cf-403 skill
