## 总体 Working Style
**工作的下一步：自己动**
> 吾日三省吾身

- 动手前，自省：
  - 用户需求明确吗？需要追问吗？
  - 需求可能涉及到的 Skill 的确 Loaded、做好准备了吗？
- 汇报前，自省：
  - 报告是否包含完整信息？
  - 根因解释 + 相关 Source 链接 + 证据链 + 验证结果 + 成效副作用
- ...

**代码美学：不overengineered**
> Less is more
> 少即是美，简即是效

- 以从众为荣，以自专为耻
信框架默认值，不造自己的配置 override
- 以直给为荣，以设防为耻
避免防御性代码，“it just work”才重要
- 以微调为荣，以重写为耻
分步迭代，优先 edit，少用 write；改动越小越好

> Code is cheap, show me your deliverables
> 执行落地写代码是最简单的苦力。可交付的整洁方案，一千行代码也换不来

## STRICT Boundaries - 关于开发环境
- pip 场景务必使用 uv venv
- 偏好使用 `devcontainer`。通过 tmux + `devcontainer up/exec bash` 来进入环境
- 不要大范围 grep 扫盘！你往往 find 不到什么，而且电脑会很卡
- 区分清楚 SSH 远程主机与本机。write/edit 写入的是本机路径，tmux SSH 操作的才是远程，切勿混淆
- **长程事务一律用 tmux 执行**，不要直接调用 Shell。长程事务包括：
  - 交互式操作，如一切 SSH 操作
  - 后台运行，如 dev server
  - 长时间 wait/sleep，如下载编译或持续蹲守
遇到以上这些场景，先加载 `tmux` skill

## STRICT Boundaries - 如果需要某个程序
安装方式优先级：
1. uvx/npx 直接使用（高度优先）
2. brew install（除非 npm 没有）
3. curl 安装到 ~/.local/bin
4. devcontainer 内处理
不要用 pip 或 npm i -g 或 dnf 或 apt 在主机 *全局* 安装任何东西（试都别想试）
**任何时候都不要全局安装**

## Notes - 随着成长，随时记录
- 修改后的文件有时会被还原。这多半用户在后台进行的修改，用户的更改代表了用户的意见，需尊重用户的意见
- 杂项文档直接放当前工作目录，临时性研究放 tmp，新项目放 ~/Documents/dev/Projects/Playground
- 有关开源项目的 research，先找到 gh repo，然后在 tmp 路径中 `git clone --depth=1` 得到项目源码，这样源码即 Source of the Truth。官方文档不一定准确
- 优先使用 `gh`，而非 `curl https://api.github.com/...`。gh 的请求频率限制更宽松
- 调用 subagent 执行任务时，应引导其自行 load 所需 skill！它不会继承你已加载的 skill
- 不熟悉某个 CLI 工具时，直接 `--help` 查看用法。例如使用 `devcontainer --help`
- 若 context7 查不到，优先进行 web search
- 不要只是 web search！搜索摘要断章取义不能当真相，关键还要 fetch 全文：
  - 可以派 subagent 专门竭尽全力拿到原始信息源
  - 读 PDF，用 gh cli 追 issue/PR threads, yt-dlp skill 分析任何视频内容等
