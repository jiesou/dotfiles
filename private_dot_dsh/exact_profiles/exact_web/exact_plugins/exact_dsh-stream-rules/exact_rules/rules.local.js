// Local rules. Gitignored as `*.local.ts` — not published with the plugin.

const wildcard = (pattern) => (v) => {
  let escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".")
  if (escaped.endsWith(" .*")) {
    escaped = escaped.slice(0, -3) + "( .*)?"
  }
  return new RegExp("^" + escaped + "$", "s").test(v)
}

const isTmpSubPath = (command) => {
  const idx = command.indexOf("/tmp")
  if (idx === -1) return false
  if (idx > 0 && /[a-zA-Z0-9]/.test(command[idx - 1])) return false
  const rest = command.slice(idx + 4)
  return rest.length > 1 && rest.startsWith("/")
}

const isBlockedTmp = (command) => {
  const idx = command.indexOf("/tmp")
  if (idx === -1) return false
  if (idx > 0 && /[a-zA-Z0-9]/.test(command[idx - 1])) return false
  const rest = command.slice(idx + 4)
  const subPath = rest.length > 1 && rest.startsWith("/")
  if (subPath) {
    // git clone may only target /tmp/agent/...
    return command.includes("git clone") && !command.includes("/tmp/agent")
  }
  // bare "/tmp" (or /tmp/ with nothing after) is off-limits
  return true
}

export default [
  {
    match: isBlockedTmp,
    reject: true,
    prompt: "Regardless of file policy: Not allowed to access /tmp, use /tmp/agents/...\" instead.",
  },
  {
    match: (v) =>
      (wildcard("rm *")(v) || wildcard("\"rm *")(v) || wildcard("* rm *")(v) || wildcard("* -?-delete *")(v)) &&
      !wildcard("rm */tmp/*"),
    reject: true,
    prompt: "Use `gio trash` or `mv` instead of rm except in tmpdir",
  },
  {
    match: (v) => /\bgh\s+(?:issue|pr)\s+create\b|mcp__gh__create_(?:issue|pull_request)\b/.test(v),
    reject: true,
    prompt:
      "Users must explicitly confirm before publishing public content. Public issue/PR create is irreversible. If user's confirmation is given, call the same command again.",
  },
  {
    match: (v) => v.includes("git reset --hard "),
    reject: true,
    prompt:
      "Users must explicitly confirm before `git reset --hard`. Is it irreversible? If user's confirmation is given, call the same command again.",
  },
  {
    match: (v) => v.includes("git push --force "),
    reject: true,
    prompt:
      "Users must explicitly confirm before `git push --force`. Is it irreversible? If user's confirmation is given, call the same command again.",
  },
  {
    match: (v) => +v.match(/\bsleep\s+(\d+)/)?.[1] > 9,
    reject: true,
    prompt: `Correctly await via script/target matching—instead of using \`sleep [long duration]\` to poll (invalid). Tip: Don't "poll" the subagent settle, just return and it will notify`,
  },
  {
    match: (v) =>
      !(
        v.includes("tmux") ||
        v.includes("ssh") ||
        v.includes("devcontainer") ||
        v.includes("docker exec") ||
        v.includes("podman exec")
      ) &&
      ((v.includes(" install") && v.includes(" -g")) ||
        v.includes(" install --global") ||
        v.includes(" i -g") ||
        v.includes("yarn global") ||
        v.includes("sudo dnf install") ||
        v.includes("sudo apt install") ||
        v.includes("sudo apt-get install")),
    reject: true,
    prompt: `安装方式优先级：
1. uvx/npx 直接使用（高度优先）
2. brew install（npm 没有的情况下优先）
3. curl 一个静态链接二进制到 ~/.local/bin
4. devcontainer 内处理
你也许应该派子任务去研究，这个软件可以以哪种方式安装
不应 pip 或 npm i -g 或 dnf 或 apt 在主机 *全局* 安装任何东西（试都别想试）`,
  },
  {
    match: (v) =>
      v.includes("pip ") && v.includes(" install") && !v.includes("uv pip") && !v.includes("uvx"),
    reject: true,
    prompt: "Use `uvx` or `uv venv` + `uv pip` instead of `pip install` directly",
  },
  {
    match: (v) =>
      v.includes("dsh "),
    prompt: `关于 DeepSeek Harness 开发，着重参考 dsh 本身的实现：
- https://github.com/deepseek-ai/deepseek-harness
- CLI: /var/home/linuxbrew/.linuxbrew/lib/node_modules/@deepseek-ai/dsh/
- WebUI: /var/home/linuxbrew/.linuxbrew/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/
- 所有“我们自己做的” dsh plugin: ~/.dsh/profiles/web/plugins/
- 然后通过 link 形式安装`,
  },
//   {
//     match: (v) => v.includes(".claude") || v.includes("CLAUDE.md"),
//     prompt: `You are DeepSeek Harness, not Claude Code, don't access claude's directory.
// Here is your directory:
// - ~/.agents/skills (agent skills)
// - ~/.dsh
// - ~/.dsh/profiles/web`,
//   },
  {
    match: (v) => v.includes("opencode-ai/opencode"),
    prompt:
      "The GitHub repository for opencode.ai is anomalyco/opencode (formerly sst/opencode), NOT opencode-ai/opencode (it is a standalone, old, go-implemented agent, now archived).",
  },
  {
    match: (v) => v.includes("curl") && v.includes("api.github.com"),
    prompt:
      "Prefer using `gh` cli over `curl https://api.github.com/...`. gh offers more requests limits.",
  },
  {
    match: (v) => v.includes("context7__query-docs"),
    prompt: "Use web search when Context7 can't find something",
  },
  {
    match: (v) => v.includes("web_search"),
    prompt: `The future is now—don't go back to 2025. And your knowledge is SUPER OUTDATED.
Use broad search keywords instead of searching for outdated products.
"You reap what you sow. Seek new, get new; Seek old, get old.`,
  },
  {
    match: (v) => v.includes("pdf"),
    prompt: "Use the `markitdown` skill to read PDF files.",
  },
]
