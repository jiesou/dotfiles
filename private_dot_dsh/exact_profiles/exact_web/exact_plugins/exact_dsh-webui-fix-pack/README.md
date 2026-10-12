# dsh-webui-fix-pack

修复 Web UI 的各种小 bug 和不合理的地方

[English](README.en.md)

本着 **不重复造轮子** 的原则，这个 plugin 聚合包是在 dsh 本身的 webui 上做优化，修复 PWA，修复响应式问题等等

而且，**每个 fixup 都作为独立 plugin 提供** 可以逐个独立安装独立卸载

我不希望：

- 自造 webui
- 从头实现自己的原生“desktop”
- 丢弃现有的插件生态
- 做“All in One”一堆功能的一体化 plugin

设计目标是让每个 plugin 的作用域尽可能的小，代码尽可能少且干净。绝大多数 plugin 是纯前端、纯 client-half 的

但因为只能注入前端 JS 之类的，因此有些实现会有点 hacky。毕竟官方来修这些问题会容易很多！希望最终 dsh web 需要“fix”的越来越少，这个 fix pack 不再被需要！

---

这是搭配 [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile) 之后，能获得的完美移动端 PWA 体验：

https://github.com/user-attachments/assets/f11f9447-d6be-47ea-a9c6-bd2bb9041936

- 消息换行
- 消息 steering
- 子代理面板

都非常优雅

## 安装

建议先安装 [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile) 获得更好的移动端体验！

### 安装整个 dsh-webui-fix-pack 聚合包

从 npm 安装（预构建产物，推荐）：

```sh
dsh plugin --profile web add @jiesou/dsh-webui-fix-pack
```

或从 GitHub 安装：

```sh
dsh plugin --profile web add "github:jiesou/dsh-webui-fix-pack#main&path:/bundles/dsh-webui-fix-pack"
```

安装后需要 **重启 web** 生效

如需在 pack 中单独禁用某插件，在 profile 的 `cordis.patch.yml` 按 `id` 覆盖即可

### 单独安装单个插件

所有子插件都已发布到 npm，包名对应仓库 `plugins/` 下的目录名，例如：

```sh
dsh plugin --profile web add @jiesou/dsh-webui-fix-composer-focus-restore
```

## Plugins

### pwa

[plugins/dsh-webui-fix-pwa](plugins/dsh-webui-fix-pwa/)

手机全屏 PWA 默认全屏展示，会隐藏顶部状态栏和底部导航栏，必须划拉一下才能拉出来：

https://github.com/user-attachments/assets/433a9dfe-202e-4e25-a784-9bccf6243c2a

现在把 PWA 改为 `standalone` 而不是 `fullscreen` 模式，并注入 `background-color`（上游 manifest 不带这个字段）

<img height="400" src="https://github.com/user-attachments/assets/ae2d5e9b-a774-4818-9b80-8026de07f412" /><img height="400" src="https://github.com/user-attachments/assets/7cbaf353-a184-4520-9782-b14ae4863927" />
<img height="300" src="https://github.com/user-attachments/assets/7579df75-cca5-474c-8f5c-7c56e6c6ed60" />

PWA 图标也单独生成：避免和黑色背景混在一起

iOS 那一半也一并补齐（上游既没有 `apple-mobile-web-app-*`，也没有 `viewport-fit=cover`）：standalone 所需的 meta + 刘海屏安全的 viewport

> 上游进展：页面侧的 `theme-color` meta 已由上游本体实现——`dsh-client-ui-layout` 的 `ThemePresenter` 自己持有唯一一个 `<meta name="theme-color">`，每次 `theme/change` 按渲染后的 body 背景重刷。因此本插件不再注入一个竞争的 meta（它以前会把上游那个摘掉），客户端只剩给 manifest 报 scheme 的 cookie。

`start_url` 依旧不覆盖，沿用上游的 `./`。但「装出来的 App 和浏览器共用同一份会话 Cookie」这个前提是错的：
上游 `dsh-client-connection` 发的会话 Cookie 是 `HttpOnly; SameSite=Strict`，而从桌面／启动器冷启动 PWA 时，
Chromium 会给这次顶级导航塞一个 opaque initiator，Strict Cookie 因此不发 —— 这是有意为之，为了堵住
crbug 40061152 那个用 `intent://` 绕过 `SameSite=Strict` 的漏洞，上游明确拒绝改。于是装出来的 App 永远拿不到
会话，只会看到 `dsh web authentication required`，刷新和重装都没用（重装只是把同一次坏掉的冷启动重演一遍）。

本插件因此把会话 Cookie 的 `SameSite` 放宽为 `Lax`：`Lax` 仍然随顶级 GET 导航发送，而 `start_url` 正是这样一次
导航。Cookie 仍是 `HttpOnly`、仍按 authority 绑定、仍带 HMAC 签名，值和有效期都没动。`/api` 不靠 Cookie 的
SameSite 防跨站，`isTrustedApiRequest()` 另有 `Sec-Fetch-Site` 与 Origin 围栏兜底。

注意：已安装的 PWA 不会因为 manifest 更新而改变 `display`，需要重新添加／安装。

manifest **不注入 `theme_color`**，这是刻意的：安装版 PWA 的底部系统导航栏从 Chromium 153 起就按这个字段上色（`WebAppNavigationBarThemeColor`），而 `WebappIntentDataProvider.getColorProvider()` 只有在深色 provider 也有自定义颜色时才会挑它 —— 那个深色伴随字段（`dark_theme_color`）在 blink 的 `manifest.mojom` 里已被标成 obsolete、解析器根本不读，于是深浅两色都会落回同一个 `theme_color`，必然有一种模式反色；再加上这个值在安装/更新那一刻就烘死，就成了「深色里白条、浅色里黑条」那种飘忽的反色。不写 `theme_color` 时 Chromium 把这条栏交回平台默认（跟随系统 night mode）。状态栏不受影响：安装版 Web App 的状态栏由页面侧 `theme-color`（上游 `ThemePresenter`）驱动。已安装的 App 要等 WebAPK 更新或重新添加才会清掉烘死的颜色。

### mobile-enter-newline

[plugins/dsh-webui-fix-mobile-enter-newline](plugins/dsh-webui-fix-mobile-enter-newline/)

https://github.com/user-attachments/assets/f322ad94-5ba2-4cda-a10e-51902a9331db

需要搭配 [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile) 使用

原来的 webui 在移动端完全无法通过软键盘实现换行，这个扩展让移动端软键盘下 Enter 能够换行

> 上游进展：运行中主按钮的「点击即 queue / steering」已由本体实现——`primaryStops` 只在输入框为空（或 blocked）时才变停止键，有文字时按钮本就是发送键，按 `busyEnter` 偏好 queue 或 steer，图标也随之切成发送箭头。因此本插件原来的 sendify（换图标 + 拦 click 回放一个合成 Enter）已删除，只剩软键盘 Enter 换行这一半。

### mobile-hide-h-scroll

[plugins/dsh-webui-fix-mobile-hide-h-scroll](plugins/dsh-webui-fix-mobile-hide-h-scroll/)

需要搭配 [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile) 使用

这个 plugin 在手机 WebView 里左右滑动打开侧边栏时，能看到横向滚动条，现在将它隐藏了

<img height="600" src="https://github.com/user-attachments/assets/bb0c963b-8cc8-4a9a-baff-db661a8b2e1c" />

> 此功能已提交 PR 给 dsh-mobile 并被合并，由 dsh-mobile 在 2026-08-24 的 commit [`49f904c`](https://github.com/lehhair/dsh-mobile/commit/49f904cacdc2979f9d2b186bde7a00e79b1db8a7) 中实现。聚合包默认不再包含此插件，旧版本用户可单独安装 `@jiesou/dsh-webui-fix-mobile-hide-h-scroll`。

### mobile-stats-line

[plugins/dsh-webui-fix-mobile-stats-line](plugins/dsh-webui-fix-mobile-stats-line/)

需要搭配 [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile) 使用

底部显示统计信息的的 stats line 在移动端会被截断且没有 tooltip，现在可以点它跳出 tooltip 看完整信息了

上游 tooltip 只挂了 hover（还要等 500ms）和 focus 两条触发路径，而 stats line 是个不可聚焦的 div，触摸下只能靠时灵时不灵的模拟鼠标事件。现在触摸设备上点击即显、再点即收，桌面 hover 行为不变

<img height="600" src="https://github.com/user-attachments/assets/194204e3-59ca-434f-a558-8044c072ae45" />

> 此功能已由 dsh-mobile 在 2026-09-01 的 commit [`5c6a90e`](https://github.com/lehhair/dsh-mobile/commit/5c6a90e0878fb7bf827269196279d2ea87b40efb)（随 v0.1.4 发布）以另一种方式实现：stats line 被放进一个 `mask-image` 钳制的显示窗口里，左右滑动即可看到完整读数，触摸下不再需要点击弹 tooltip。现在仅适用于尚未包含该实现的旧版本，聚合包默认不再包含此插件，旧版本用户可单独安装 `@jiesou/dsh-webui-fix-mobile-stats-line`

### session-row-context-menu

[plugins/dsh-webui-fix-session-row-context-menu](plugins/dsh-webui-fix-session-row-context-menu/)

<img height="200" src="https://github.com/user-attachments/assets/b91a7d54-6bca-47f7-bfb9-47a1fefc4833" />

会话列表中，必须要鼠标瞄准小小的“三个点”，左键才能打开菜单，很麻烦

现在可以在任意位置右键打开

### hide-like-dislike

[plugins/dsh-webui-fix-hide-like-dislike](plugins/dsh-webui-fix-hide-like-dislike/)

每个 agent 回复下面的“好的回答 / 有问题的回答”两个反馈按钮没有任何作用

这个插件直接隐藏它们；纯 CSS 实现，只注入一个 style 标签

### hide-session-log

[plugins/dsh-webui-fix-hide-session-log-btn](plugins/dsh-webui-fix-hide-session-log-btn/)

<img height="500" src="https://github.com/user-attachments/assets/e0fe81c2-4cb6-4c14-8779-c3fb573514a0" />

右上角的 save Session log 按钮很少用到，却占很大的屏幕空间。尤其是在移动设备上很难受

真的需要的时候也可以通过 `/export` 命令，不需要这个按钮
 
因此隐藏这个按钮，同时回收它占用的标题栏空间

### composer-focus-restore

[plugins/dsh-webui-fix-composer-focus-restore](plugins/dsh-webui-fix-composer-focus-restore/)

https://github.com/user-attachments/assets/9d39a220-7933-4902-8f64-38c9ec7978b4

`/models` 等命令选择后，popup 框关闭，消息框焦点会跑走的，必须再点一下消息框，才能接着打字

修复了这个问题

> 此功能已由 DSH 本体的 [`@deepseek-ai/dsh-client-ui-commands`](https://github.com/deepseek-ai/deepseek-harness/commit/a2d0f7f41121ee81911dd1badbf248edd3f2ab70) 在 2026-08-12 的 commit [`a2d0f7f`](https://github.com/deepseek-ai/deepseek-harness/commit/a2d0f7f41121ee81911dd1badbf248edd3f2ab70) 中实现。现在仅适用于尚未包含该实现的旧版本，聚合包默认不再包含此插件，旧版本用户可单独安装 `@jiesou/dsh-webui-fix-composer-focus-restore`。

### subagent-panel

[plugins/dsh-webui-fix-subagent-panel](plugins/dsh-webui-fix-subagent-panel/)

顶部“N 个子代理”下拉框没有绑定点击事件，只能靠 hover 停留 150ms 展开；而菜单和按钮之间留了 5px 缝隙，hover 移开 120ms 就自动收起，导致经常“点了没反应”、“还没点到就缩回去”

现在点击即可展开/收起（hover 展开保持不变）；面包屑里的祖先切换器点击跳转语义不受影响

同时，在窄屏 / touch 布局下标题栏子代理会话列表会从 `left: 0` 溢出屏幕，本插件在 coarse-pointer UI 上把它钳制到视口内（搭配 [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile) 使用）

before/after:

<img height="600" src="https://github.com/user-attachments/assets/635d56ac-5a92-4174-9927-f556413f24f9" /><img height="600" src="https://github.com/user-attachments/assets/50e75b9a-5115-4da7-b353-c9f40c85f586" />

<img height="600" src="https://github.com/user-attachments/assets/6e4448f2-12e1-493b-a575-8428b5b4a530" /><img height="600" src="https://github.com/user-attachments/assets/6b86fb2c-4086-42ce-a6df-d17644c09180" />

> 上游进展：上下文面板那一半已被 [lehhair/dsh-mobile@22bcdbf](https://github.com/lehhair/dsh-mobile/commit/22bcdbfc37798e6efd7660194a6a846b8eb18204) 修复——通用 `[role='dialog']` 设置弹窗规则收窄为 `:has(> nav)`，并给 context 面板单独保留了 `min(264px, calc(100vw - 32px))` 几何。搭配该提交之后的 dsh-mobile 时，本插件只剩标题栏子代理会话列表这一半还在生效；那个弹层是核心 ui-subagent 的固定定位（`.menu { position: fixed; width: 336px }`，无视口钳制），属 deepseek-harness 固有问题，不是 dsh-mobile 引起的。

> 上游进展：DSH 本体在 2026-08-20 的 commit [`de572dd`](https://github.com/deepseek-ai/deepseek-harness/commit/de572dd9102a938b7f0f82de935118a604bafa0b) 只收了「弹层钳制到视口」那一半（menu 改 `position: fixed` + `createPortal` 到 body + `catalogMenuPosition`）；而且恰恰是这次提交把触发器的 `onClick={() => changeOpen(!open)}` 改成了 hover-only——顶部「N 个子代理」不再绑定 click，只剩 hover 150ms 展开 / 120ms 收起，上游 e2e 也同步把 `.click()` 换成了 `.hover()`。本机 dsh `0.1.2-alpha.3` 已含该提交，实测触摸下依然点不开。点击展开/收起、祖先切换器让路、hover grace 绕开 5px 缝隙竞态这一半仍只有本插件覆盖，本插件继续保留；`fitPanel` 那半现在与上游重复

### double-enter-to-steer

[plugins/dsh-webui-fix-double-enter-to-steer](plugins/dsh-webui-fix-double-enter-to-steer/)

有 queue 消息时，再按一次 Enter 直接把 queue 消息写入 steering 消息

实现“单击回车 queue”，“双击回车 steering”

> 此功能已由 DSH 本体在 2026-08-02 的 commit [`dffe955`](https://github.com/deepseek-ai/deepseek-harness/commit/dffe955ed203b85c324fbf3ad77d1996b01e27b0) 中实现。现在仅适用于尚未包含该实现的旧版本。

### mobile-keyboard-blur

[plugins/dsh-webui-fix-mobile-keyboard-blur](plugins/dsh-webui-fix-mobile-keyboard-blur/)

需要搭配 [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile) 使用

https://github.com/user-attachments/assets/55f1ab47-6b16-4946-842c-fcd3ff97143f

焦点停留在消息框时打开侧边栏切换 session， 会导致 WebView 把键盘收起后又弹回来，界面鬼畜

修复了这个问题

模型选择也一并按住：模型菜单在「模型」列表上方新加了搜索框，进入列表时会 `searchRef.current?.focus()` 自动聚焦，手机上只是想换个模型，软键盘却先弹出来。触摸设备现在不再抢这个焦点，手点搜索框照旧能打字（原生聚焦不经过本补丁）

> 上游并未实现：此处此前误记为 DSH 本体在 2026-08-20 的 commit [`e06625d`](https://github.com/deepseek-ai/deepseek-harness/commit/e06625d202ba53836a16865e0f779a44a85ec167) 中实现，但那个 commit 是「运行中草稿改用 Send」（`primaryStops = running && subagent === null && (empty || blocked !== undefined)`），只动了 `InputBar` 的主按钮，与本插件无关。本机 dsh `0.2.0-rc.2` 的 `InputBar` 仍在 `useEffect([locked, sessionId, editor])` 里无条件 `focusDraftEditor(editor)`，换 session 依旧自动聚焦、把软键盘弹起来。因此本插件继续保留，聚合包默认安装。

### ime-multiline-commit

[plugins/dsh-webui-fix-ime-multiline-commit](plugins/dsh-webui-fix-ime-multiline-commit/)

输入法一次性提交多行文本时（Wayland text-input-v3 的 `commit_string`、IBus 的 `CommitText`，例如 fcitx5-vinput、听写工具），只有第一行留下来，后面几行全丢

原因是 Blink 把整段多行文本当成**一个** `beforeinput`（`inputType: "insertText"`、`data: "A\nB\nC"`）送进来，而 lexical 的纯文本插入只在光标位于空段落时才接管；光标停在已有文字的段落里时它交还给浏览器逐段插入，浏览器每插一段触发一次 `input`，lexical 从第一段回读重建模型并重渲染，把还在插入的段落冲掉

现在由本插件接管这次多行插入，按行重放：每行一次可信的 `insertText`，行与行之间补一个合成的 `insertLineBreak`，等同于逐行输入再按 Shift+Enter。组合中的文本（`insertCompositionText`）、粘贴（`insertFromPaste`）和单行插入都不动

## 依赖策略

聚合包 `package.json` 的 `dependencies` 永远写 `latest`，不做本地路径替换

本地开发由 web profile 的 `devDependencies` link 覆盖：所有子插件指向本仓库 `plugins/` 目录，改源码即时生效，且不进入 `dependencies`，`dsh plugin` reconcile 不会把它们加回 bundles

