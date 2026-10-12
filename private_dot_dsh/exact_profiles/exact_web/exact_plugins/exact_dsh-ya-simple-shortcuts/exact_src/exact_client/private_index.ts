/**
 * Browser half for the DSH WebUI gap shortcuts.
 *
 * The official @deepseek-ai/dsh-client-shortcuts system (ctx.shortcuts)
 * covers new session, session search, and other core actions. This plugin
 * contributes the actions the official system is missing:
 *
 * - Alt+A: cycle permission/access mode
 * - Alt+X: start a new session
 * - Alt+Up/Down: page the conversation between user messages
 * - Alt+Left/Right: cycle reasoning effort
 *
 * These are registered as fixed inputs (registerFixed + observeFixedInput)
 * so they appear in the shortcut cheatsheet and participate in conflict
 * validation. Fixed inputs are required for arrow keys and Alt+A because
 * the official system reserves them from configurable commands, and Alt+X
 * because the official web default (Ctrl+Alt+N) is refused on Linux.
 *
 * Tab/Shift+Tab preset cycling stays as a local DOM handler: the official
 * system reserves Tab for focus navigation, so it cannot be registered
 * without breaking focus traversal. The handler is capture-phase and only
 * fires inside the composer, so it does not conflict with official
 * shortcut dispatch (which is bubble-phase and has no Tab binding).
 *
 * Fixed ids must not reuse an official command id: registerFixed throws on a
 * duplicate id, and that throw aborts every later registration in this
 * effect, which silently kills all of these shortcuts.
 */

interface ModelEffort {
  id: string
}

interface ModelInfo {
  id: string
  reasoning?: {
    efforts?: readonly ModelEffort[]
  }
}

interface ModelGroup {
  id: string
  models?: readonly ModelInfo[]
}

interface ModelDirectoryState {
  current: {
    provider: string
    model: string
    reasoningEffort?: string
  } | null
  groups?: readonly ModelGroup[]
}

interface ModelDirectory {
  store: {
    getSnapshot(): ModelDirectoryState
  }
  select(selection: {
    provider: string
    model: string
    reasoningEffort?: string
  }): Promise<void>
}

interface SessionListSnapshot {
  current?: string | null
}

interface ShortcutGesture {
  code: string
  control: boolean
  alt: boolean
  shift: boolean
  meta: boolean
  repeat: boolean
  composing: boolean
  defaultPrevented: boolean
}

interface ShortcutContext {
  region: 'page' | 'editable' | 'terminal'
  modal: string | null
  target: Element | null
}

type ShortcutFixedInput =
  | { type: 'keydown'; gesture: ShortcutGesture; context: ShortcutContext; consume(): void }
  | { type: 'reset' }

interface ShortcutFixedCommand {
  id: string
  label: () => string
  keys: readonly string[]
  bindings: readonly { code: string; modifiers: readonly string[] }[]
  group: 'application' | 'input' | 'menus' | 'approval'
}

interface Shortcuts {
  registerFixed(command: ShortcutFixedCommand): () => void
  observeFixedInput(listener: (input: ShortcutFixedInput) => void): () => void
}

interface ShortcutScope {
  shortcuts: Shortcuts
  sessions: {
    list: {
      getSnapshot(): SessionListSnapshot
    }
  }
  modelDirectories?: {
    directoryFor(sessionId: string): ModelDirectory
  }
  uiWorkspace?: {
    startSession(workspaceId?: string): void
  }
  effect(callback: () => void | (() => void), name?: string): unknown
}

interface ClientContext {
  inject(
    services: readonly string[],
    callback: (scope: ShortcutScope) => void,
  ): unknown
}

export const name = 'dsh-ya-simple-shortcuts'

export const inject = [
  'shortcuts',
  'sessions',
  'modelDirectories',
  'uiWorkspace',
] as const

const COMPOSER_INPUT_SELECTOR = [
  '[data-composer-input]',
  '[data-input-scroll] textarea',
  'textarea[data-phase]',
  '[contenteditable="true"]',
  '[contenteditable][data-phase]',
].join(', ')

const ACCESS_MODE_ARIA_PREFIXES = ['访问模式', 'Access mode']

function flatModelList(groups: readonly ModelGroup[]): Array<{ provider: string; model: ModelInfo }> {
  const flat: Array<{ provider: string; model: ModelInfo }> = []
  for (const group of groups) {
    if (group.models === undefined) continue
    for (const model of group.models) flat.push({ provider: group.id, model })
  }
  return flat
}

function cycleEffort(scope: ShortcutScope, direction: number): void {
  const sessionId = scope.sessions.list.getSnapshot().current
  if (sessionId === undefined || sessionId === null) return

  let directory: ModelDirectory
  try {
    if (scope.modelDirectories === undefined) return
    directory = scope.modelDirectories.directoryFor(sessionId)
  } catch {
    return
  }

  const snapshot = directory.store.getSnapshot()
  const current = snapshot.current
  if (current === null) return

  const entry = flatModelList(snapshot.groups ?? []).find((item) => (
    item.provider === current.provider && item.model.id === current.model
  ))
  const efforts = entry?.model.reasoning?.efforts
  if (efforts === undefined || efforts.length === 0) return

  const choices: Array<string | undefined> = [undefined, ...efforts.map((effort) => effort.id)]
  let index = choices.findIndex((effort) => effort === current.reasoningEffort)
  if (index < 0) index = 0
  const next = choices[(index + direction + choices.length) % choices.length]
  const selection: { provider: string; model: string; reasoningEffort?: string } = {
    provider: current.provider,
    model: current.model,
  }
  if (next !== undefined) selection.reasoningEffort = next

  try {
    void directory.select(selection).catch(() => {})
  } catch {
    // The directory can disappear while a session is being switched.
  }
}

function markedIndex(items: readonly HTMLElement[]): number {
  const byAria = items.findIndex((item) => (
    item.getAttribute('aria-checked') === 'true'
    || item.getAttribute('aria-selected') === 'true'
  ))
  if (byAria >= 0) return byAria

  const byClass = items.findIndex((item) => Array.from(item.classList).some((name) => (
    /selected|checked|active|current/i.test(name)
  )))
  if (byClass >= 0) return byClass

  return items.findIndex((item) => item.querySelectorAll('svg').length > 1)
}

function cycleMenu(anchor: HTMLButtonElement, direction: number, fallbackLabel: string): boolean {
  anchor.click()

  requestAnimationFrame(() => {
    const menus = document.querySelectorAll<HTMLElement>('[role="menu"], [role="listbox"]')
    const menu = menus.item(menus.length - 1)
    if (menu === null) return

    const items = Array.from(
      menu.querySelectorAll<HTMLElement>('[role="menuitem"], [role="option"]'),
    )
    if (items.length === 0) return

    let index = markedIndex(items)
    if (index < 0 && fallbackLabel !== '') {
      index = items.findIndex((item) => item.textContent?.includes(fallbackLabel) === true)
    }
    if (index < 0) index = 0
    items[(index + direction + items.length) % items.length].click()
  })
  return true
}

function accessModeButton(): HTMLButtonElement | null {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-composer-card] button'),
  )
  return buttons.find((button) => {
    const label = button.getAttribute('aria-label') ?? ''
    return ACCESS_MODE_ARIA_PREFIXES.some((prefix) => label.startsWith(prefix))
  }) ?? null
}

function cyclePermission(): boolean {
  const button = accessModeButton()
  if (button === null) return false

  const label = (button.getAttribute('aria-label') ?? '')
    .replace(/^[^：:]*[：:]\s*/, '')
    .trim()
  return cycleMenu(button, 1, label)
}

function scrollToUser(direction: number): void {
  const scrollport = document.querySelector<HTMLElement>('[data-conversation-scroll]')
  if (scrollport === null) return

  const scrollportRect = scrollport.getBoundingClientRect()
  const offsets = Array.from(scrollport.querySelectorAll<HTMLElement>('[data-chat-anchor-key]'))
    .filter((row) => {
      if (row.hasAttribute('hidden')) return false
      const kind = row.dataset.chatFlowKind
      return kind === 'user' || kind === 'steering'
    })
    .map((row) => {
      const rect = row.getBoundingClientRect()
      return { row, top: rect.top - scrollportRect.top }
    })
  if (offsets.length === 0) return

  const marker = 80
  const epsilon = 1
  let target: HTMLElement | undefined
  if (direction < 0) {
    let best: { row: HTMLElement; top: number } | undefined
    for (const entry of offsets) {
      if (entry.top >= marker - epsilon) continue
      if (best === undefined || entry.top > best.top) best = entry
    }
    target = best?.row
  } else {
    let best: { row: HTMLElement; top: number } | undefined
    for (const entry of offsets) {
      if (entry.top <= marker + epsilon) continue
      if (best === undefined || entry.top < best.top) best = entry
    }
    target = best?.row
  }

  let newTop: number
  if (target === undefined) {
    newTop = direction < 0 ? 0 : scrollport.scrollHeight
  } else {
    newTop = scrollport.scrollTop + target.getBoundingClientRect().top - scrollportRect.top
  }
  if (typeof scrollport.scrollTo === 'function') scrollport.scrollTo({ top: newTop })
  else scrollport.scrollTop = newTop
}

function cyclePreset(direction: number): boolean {
  const seat = document.querySelector<HTMLButtonElement>(
    '[data-slot="conversation.hero.agentPreset"] button[aria-haspopup="menu"]',
  )
  if (seat === null) return false
  return cycleMenu(seat, direction, seat.textContent?.trim() ?? '')
}

function isComposerTarget(target: EventTarget | null): boolean {
  const candidates = [
    target instanceof Element ? target : null,
    document.activeElement instanceof Element ? document.activeElement : null,
  ]
  return candidates.some((candidate) => {
    if (candidate === null) return false
    const input = candidate.closest(COMPOSER_INPUT_SELECTOR)
    return input !== null && input.closest('[data-composer-card]') !== null
  })
}

function isAltOnly(gesture: ShortcutGesture): boolean {
  return gesture.alt && !gesture.control && !gesture.shift && !gesture.meta
}

function startSession(scope: ShortcutScope): boolean {
  if (scope.uiWorkspace === undefined) return false
  try {
    scope.uiWorkspace.startSession()
    return true
  } catch {
    return false
  }
}

interface GapShortcutStatus {
  fixed: string[]
  last: string
  calls: number
}

declare global {
  var __dshGapShortcuts: GapShortcutStatus | undefined
}

function status(): GapShortcutStatus {
  return globalThis.__dshGapShortcuts
    ?? (globalThis.__dshGapShortcuts = { fixed: [], last: '', calls: 0 })
}

function onFixedInput(scope: ShortcutScope, input: ShortcutFixedInput): void {
  if (input.type === 'reset') return
  const { gesture, context } = input
  status().calls += 1
  status().last = gesture.code
  if (gesture.defaultPrevented || gesture.composing || gesture.repeat) return
  if (context.modal !== null || context.region === 'terminal') return

  if (!isAltOnly(gesture)) return

  if (gesture.code === 'KeyA') {
    if (cyclePermission()) input.consume()
  } else if (gesture.code === 'KeyX') {
    if (startSession(scope)) input.consume()
  } else if (gesture.code === 'ArrowUp') {
    input.consume()
    scrollToUser(-1)
  } else if (gesture.code === 'ArrowDown') {
    input.consume()
    scrollToUser(1)
  } else if (gesture.code === 'ArrowLeft') {
    input.consume()
    cycleEffort(scope, -1)
  } else if (gesture.code === 'ArrowRight') {
    input.consume()
    cycleEffort(scope, 1)
  }
}

function onKeyDown(scope: ShortcutScope, event: KeyboardEvent): void {
  if (event.isComposing || event.keyCode === 229 || event.repeat) return

  const key = (event.key || event.code).toLowerCase()

  if (key === 'tab' && isComposerTarget(event.target)) {
    if (cyclePreset(event.shiftKey ? -1 : 1)) event.preventDefault()
  }
}

export function apply(ctx: ClientContext): void {
  ctx.inject(inject, (scope) => {
    scope.effect(() => {
      const fixed = (id: string, label: string, keys: string[], bindings: ShortcutFixedCommand['bindings']): (() => void) => {
        const dispose = scope.shortcuts.registerFixed({
          id,
          label: () => label,
          keys,
          bindings,
          group: 'application',
        })
        status().fixed.push(id)
        return dispose
      }

      const disposePermission = fixed('permission.cycle', '切换访问模式', ['Alt+A'], [
        { code: 'KeyA', modifiers: ['alt'] },
      ])
      const disposeSession = fixed('gap.session.new', '新建会话', ['Alt+X'], [
        { code: 'KeyX', modifiers: ['alt'] },
      ])
      const disposePaging = fixed('conversation.page', '按用户消息翻页', ['Alt+↑', 'Alt+↓'], [
        { code: 'ArrowUp', modifiers: ['alt'] },
        { code: 'ArrowDown', modifiers: ['alt'] },
      ])
      const disposeEffort = fixed('reasoning-effort.cycle', '切换推理强度', ['Alt+←', 'Alt+→'], [
        { code: 'ArrowLeft', modifiers: ['alt'] },
        { code: 'ArrowRight', modifiers: ['alt'] },
      ])

      const offFixed = scope.shortcuts.observeFixedInput((input) => {
        onFixedInput(scope, input)
      })

      const handler = (event: KeyboardEvent) => onKeyDown(scope, event)
      document.addEventListener('keydown', handler, true)

      return () => {
        disposePermission()
        disposeSession()
        disposePaging()
        disposeEffort()
        offFixed()
        document.removeEventListener('keydown', handler, true)
      }
    }, 'dsh-ya-simple-shortcuts: gap shortcuts')
  })
}
