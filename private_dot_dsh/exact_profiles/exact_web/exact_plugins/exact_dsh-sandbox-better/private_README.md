# dsh-sandbox-better

给 DSH 加上文件系统目录级沙箱。

[English](README.en.md)

默认的 「工作区内修改」`workspace-write` 只允许写 workspace，其它地方只读。

以前，如果Agent要访问某个目录，只能直接进入full access模式。现在可以单独授予他某个目录的权限！

推荐搭配 Landlock 后端使用：[dsh-sandbox-landlock](https://github.com/jiesou/dsh-sandbox-landlock)。

## 安装

从 npm 安装（预构建产物，推荐）：

```sh
dsh plugin --profile web add dsh-sandbox-better
```

或从 GitHub 安装：

```sh
dsh plugin --profile web add github:jiesou/dsh-sandbox-better
```

装完重启 web。要求 DSH `>=0.2.2-rc.2`（`SandboxPolicyService.registerWritableRoot` 从该版本提供）。

## 原理

模型调用新的 `request_write_access` 工具申请一个目录，用户在审批卡上批准后，该目录对本会话后续的 bash 与文件工具都可写；会话结束即失效。

```
tool: request_write_access { path: "~/Documents/dev/other-repo" }

┌ 等待审批
│ 允许本会话写入 /var/home/chen/Documents/dev/other-repo？
│                                                     [允许一次]   [拒绝]
```

- 只有一个参数 `path`：绝对路径，或相对 workspace，`~` 会展开；目录必须存在。
- 审批卡由官方 `dsh-client-ui-approval` 渲染，本插件只发一次 `approval.request`；按钮与快捷键属于宿主，审批标题由本插件随请求带上 `displayReason`（en / zh，按当前界面语言选）。
- 批准走官方 `registerWritableRoot`，所以与后端无关：bwrap、Landlock、Seatbelt 都认。
- `danger-full-access` 下这个工具整体不注册进该步（`when` 条件），模型不会看到一个已经无意义的入口。

## 其他优化

### 1 精简上下文注入

DSH 官方默认情况 `dsh-sandbox-policy` 的 `additionalWritableRoots` 写进每一步的运行时上下文（`Additional writable directories: [...]`）。

大多数情况，模型不需要知道哪些目录可写。

宿主每一步都会在 `refreshContext()` 里重新渲染这行（`system-prompt/assemble` 的改写会被它丢掉），本插件就挂在这里，把清单摘掉：模式与 workspace 保留。

### 2 缺失目录不拖垮写入

配置里列了但已经不存在的可写目录，会让所有写入一起报 `Invalid additional writable directory`。本插件挂载时把不可达的目录从清单里摘掉并打一条警告，写入照常。

### 3 宽容的权限参数

模型经常搞不清自己处在哪个模式，把提权参数写歪。官方配置过于严格。

| 原本会报的错 | 现在 |
| --- | --- |
| `invalid escalation: justification is only valid together with sandbox_permissions` | 删掉没有配对的 `justification`，照常执行 |
| `invalid escalation: sandbox_permissions requires a justification` | 补一句 `Agent did not attach a justification.` |
| `invalid justification: expected a non-empty sentence` | 空白理由同样按缺省理由补上，照常进入审批 |
| `sandbox escalation to "X" is not strictly wider than this call's current "Y" mode` | 两个字段都删掉，按当前模式执行 |

只改写 `sandbox_permissions` / `justification`，`command`、`path`、`content` 一律不动，所以调用卡片与审计日志仍是模型原始参数。真正该由模型自己改的错仍然报出来：`sandbox_permissions` 写出词表（`full`、`workspace_write`…）时，交给宿主的 `invalid arguments`。

## 限制

- 授权只在运行时：不写入会话日志，resume 或 fork 后要重新申请，已经在跑的进程保持原权限。
- 没有撤销入口：结束会话，或切换权限预设。
- 不提供沙箱后端，也不管部署级目录——那是 `sandbox-policy.additionalWritableRoots`。

## 开发

```sh
pnpm install
pnpm run check   # typecheck + build + test
```

`lib/` 是分发产物，随仓库提交，供 `github:` 一行安装。

## License

[MIT](LICENSE)
