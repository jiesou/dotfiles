## Problem

`defineTool` 二次编译走不通：`agent.ctx.tools.get()` 拿到的全局定义其
`parameters` 已是编译后的 JSON Schema（`properties`/`required` 形态），而
`defineTool` 吃的是作者侧 DSL（`{description: {type, required: true}}`
隐式对象形态）。实测编译器对已编译形态不完全兼容（如 `required: [...]`
数组、`const` 等键会被 `assertAuthorKeys` 拒绝），且 output 的 oneOf/const
走 value 编译同样有走样风险。

## Decision

Raw 透传：shadow = `{...global, description, parameters, execute}` 普通对象，
直接 `agent.ctx.tools.register()`，不经过 `defineTool`：

- `parameters`：深拷贝后删 `properties.run_in_background` 键（编译形态只认
  这一处；DSL 形态的 `required: true` 内嵌写法在编译产物里已不存在）。
- `output` / `isConcurrencySafe` / `presentCall` 等回调：引用透传（`toBe`）。
- `execute`：唯一改写的字段，注入 `run_in_background: true` 后调全局原 body。
- 副作用：`dsh-tools` 的 import 与 peer 依赖一并摘掉，插件零官方依赖。
- 幂等：`get()` 读到无参数定义即跳过，`tools/change` 可安全做 top-up；
  preset 重挂全局定义后下次 change 事件重新盖住。

## Alternatives considered

- `defineTool` 重建：编译器对已编译形态不兼容，放弃。
- 只删 DSL 形态：全局定义恒为编译形态，无需双形态兼容（strip 函数保留
  else 分支做防御）。

## Consequences

- shadow 与全局除参数/description/execute 外全等：并发分类、渲染、超时
  等行为不可能漂移。
- package.spec 加回归断言：entry 不得出现 `defineTool(` 调用与官方包 import。
