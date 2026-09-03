# dsh-opencode-zen-free-provider

OpenCode Zen Free provider for dsh.

[English](README.en.md)

<img height="650" alt="image" src="https://github.com/user-attachments/assets/8cc57d90-76b8-4a7d-a9fe-1ebb39c4f51c" />

本插件可以将 OpenCode Zen 的免费模型接入 dsh 使用。插件启动时从 OpenCode Zen 和 models.dev 同步模型目录与所有元数据，**仅抓取一次**，不轮循。哪怕启动时拉取失败，插件也能正常挂载，路由以空目录提供服务。

~~其中 DeepSeek V4 Flash 额外支持到 1M 上下文。~~

> 更新：现在没有 DeepSeek V4 Flash 了 😭

现在 MiMo V2.5 后端额外支持到 1M 上下文。

## 安装

从 npm 安装（预构建产物，推荐）：

```sh
dsh plugin --profile web add @jiesou/dsh-opencode-zen-free-provider
```

或从 GitHub 安装：

```sh
dsh plugin --profile web add github:jiesou/dsh-opencode-zen-free-provider
```

## 安装之后

模型列表**无需任何配置**，插件启动时会自动从远程同步并过滤所有免费模型。在 Web Models 页面选择 OpenCode Zen Free 和模型后即可开始使用。

## 推理深度（Reasoning effort）

模型只暴露上游接受的档位，不造档位。**Default** 表示"不发送 `reasoning_effort`"字段，由上游自行决定深度。**Off** 是真开关——发送上游的关闭字面值（`none`、`off` 等）。effort 配置为空或只有 toggle 的模型干脆不显示档位选择器。

## 错误提示

OpenCode Zen 把非凭证类拒绝（免费额度到期、区域限制等）以 HTTP 401/403 返回，dssharness 会把这些状态码归类为"API Key 无效"。本插件在终端错误事件里保留真实原因，让真因显示出来；真正的鉴权失败仍按 AUTH 走。无法解析的内容原样透传。

提示：OpenCode 的 Free 模型会被基于 IP 限流。

对于 Ox Alpha 等经常遇到"network errors"等问题的模型，建议手动设置：

```yaml
- id: opencode-zen-free-provider
  name: '@jiesou/dsh-opencode-zen-free-provider'
  config:
    retryPolicy:
      mode: always
```

## License

[MIT](LICENSE)
