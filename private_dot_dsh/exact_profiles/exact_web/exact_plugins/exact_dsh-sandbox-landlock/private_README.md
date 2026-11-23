# dsh-sandbox-landlock

DSH 在 Linux 的 Landlock 沙箱后端。

方便挂载可写的文件系统路径。

[English](README.en.md)

DSH 默认的 Linux 后端是 bwrap：它靠 namespace 与只读 bind 造出「另一个文件系统视图」，代价是沙箱内的 uid、`/proc`、设备节点与主机不一致，git、ssh、串口工具经常因此出问题。

本插件只用 [`landlock-run`](https://github.com/Zouuup/landrun) 的 DSH 封装：内核在每次打开文件时裁决，不换视图。路径被拒时报 `EACCES`，而不是 bwrap 的 `EROFS`。

## 安装

从 npm 安装（预构建产物，推荐）：

```sh
dsh plugin --profile web add dsh-sandbox-landlock
```

或从 GitHub 安装：

```sh
dsh plugin --profile web add github:jiesou/dsh-sandbox-landlock
```

装完重启 web。

## 它能写哪里

和官方 `sandbox-policy` 完全一致，插件不自带目录清单：

- `read-only`：只有 `/dev/null`；
- `workspace-write`：会话 workspace、`/tmp`、`sandbox-policy.additionalWritableRoots`，以及会话内通过 `registerWritableRoot` 授予的目录（即 `request_write_access` 这类工具批准后的授权）；
- `danger-full-access`：消费方直接 spawn，不经过本 provider。

## 配置

包本身不带配置：`cordis.patch.yml` 只做「Linux 上停掉官方的进程后端、挂上本插件」两件事；文件工具仍用官方 `fs-sandbox`。

所有配置写在**你自己的 profile 层**，它在本包这一层之后叠加：

```
~/.dsh/profiles/<profile>/cordis.patch.yml
```

### 额外可写目录

可写目录属于 `sandbox-policy`，不是本插件的配置项。在 `~/.dsh/profiles/<profile>/cordis.patch.yml` 重写它的 `config`：

```yaml
- id: sandbox-policy
  config:
    mode: !!js process.env.DSH_PERMISSION_MODE ?? 'workspace-write'
    workspaceRoot: !!js process.cwd()
    additionalWritableRoots:
      - /var/home/me/.ssh
      - /var/home/me/Downloads
```

- **后层对同一个 id 的 `config` 是整体替换，不是合并**。只写 `additionalWritableRoots` 会把 `mode` 打回默认的 `read-only`、`workspaceRoot` 落回服务进程的 cwd，还顺手抹掉你自己原来的清单——所以整块照着上面重写。
- 路径必须是**绝对路径**，`~` 不展开。
- 目录不存在不报错：授权面在每条命令 confine 时展开，不存在的目录被剔除不会报错。

### 设备节点

默认一个设备都不授。要串口、pty 或 GPU 时：

```yaml
- id: sandbox-landlock
  config:
    devicePaths:
      - /dev/ttyUSB*
      - /dev/ttyACM*
      - /dev/hidraw*
      - /dev/ptmx
      - /dev/pts/*
      - /dev/dri/renderD*
```

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `devicePaths` | `string[]` | `[]` | 需要读写的设备节点，支持通配符 |
| `launcherPath` | `string` | 自动探测 | 显式指定 `landlock-run` 二进制 |

通配符在**每条命令 confine 时**展开，而不是挂载时快照，所以拔插设备、新建目录不需要再动配置。

命中的目录与不存在的设备都会被剔除，不存在的目录被剔除不会报错。

同一个 id 的 `config` 同样是整体替换：`devicePaths` 与 `launcherPath` 要写在同一个块里。

## 常见逃逸点

- `docker run`
- `flatpak-spawn`
- `systemctl --user start`
- 已经建好的 tmux server（agent 新建的仍在沙箱内）
- dbus, 网络, 三方 MCP 等更多

应当通过别的手段予以规避，机制性问题，不是沙箱缺陷。

## 开发

```sh
pnpm install
git config core.hooksPath .githooks   # 推版本 tag 前自动 build 并校验版本一致
pnpm run check                        # typecheck + build + test
```

`lib/` 是构建产物，随仓库提交，供 `github:` 一行安装。

## License

[MIT](LICENSE)
