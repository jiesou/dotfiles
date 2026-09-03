/**
 * Browser half for the hardcoded DSH WebUI keyboard shortcuts.
 *
 * DSH alpha1 compatibility notes (the reason this file looks defensive):
 *
 * 1. `dsh.client.inject` is a HARD activation gate. Cordis only runs a client
 *    plugin's `apply` once every injected service is present. alpha1 deleted
 *    `@deepseek-ai/dsh-client-runtime`, `@deepseek-ai/dsh-client-ui-primitives`
 *    and `@deepseek-ai/dsh-client-ui-slots` as standalone installable packages,
 *    so any plugin still naming them never mounts at all — every shortcut
 *    silently dies. Never list a package here that is not guaranteed to resolve.
 * 2. New session moved from `workspaces.startSession()` (the pure controller)
 *    to the `uiWorkspace` service, which owns navigation + the "reuse the blank
 *    session" policy. Both names are probed so older hosts keep working.
 * 3. The composer is now a Lexical contenteditable (`[data-composer-input]`),
 *    not a `<textarea>`, and menu rows mark the current entry with a check
 *    SVG instead of `aria-checked` / `aria-selected`.
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

interface ShortcutScope {
  workspaces?: {
    startSession?(workspaceId?: string): unknown
  }
  uiWorkspace?: {
    startSession?(workspaceId?: string): unknown
  }
  sessions: {
    list: {
      getSnapshot(): SessionListSnapshot
    }
  }
  modelDirectories?: {
    directoryFor(sessionId: string): ModelDirectory
  }
  effect(callback: () => void | (() => void), name?: string): unknown
}

interface ClientContext extends ShortcutScope {
  inject(
    services: readonly string[],
    callback: (scope: ShortcutScope) => void,
  ): unknown
}

export const name = 'dsh-ya-simple-shortcuts'

/**
 * Keep this list to packages that still exist as installable client bundles.
 * `@deepseek-ai/dsh-client-runtime` was removed in alpha1 — listing it here is
 * what broke every shortcut.
 */
export const inject = [
  'sessions',
  'modelDirectories',
  'uiWorkspace',
  'workspaces',
] as const

/**
 * Composer input hosts. alpha1 renders a Lexical contenteditable
 * (`[data-composer-input]`); pre-alpha rendered a `<textarea>` inside the input
 * scroller. Both are matched, plus the generic contenteditable form so a future
 * shell that drops the data attribute still resolves.
 */
const COMPOSER_INPUT_SELECTOR = [
  '[data-composer-input]',
  '[data-input-scroll] textarea',
  'textarea[data-phase]',
  '[contenteditable="true"]',
  '[contenteditable][data-phase]',
].join(', ')

/** Access-mode (permission) trigger: the composer chip carries this aria-label. */
const ACCESS_MODE_ARIA_PREFIXES = ['访问模式', 'Access mode']

/** Session-search trigger aria-labels (zh + en). */
const SESSION_SEARCH_ARIA = ['搜索会话', 'Search sessions']

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

/**
 * Index of the menu row DSH marks as current.
 *
 * alpha1's primitive draws a check-mark SVG for the selected row and sets no
 * `aria-checked` / `aria-selected`. Pre-alpha shells used those attributes.
 * Both spellings are probed, and a trailing check icon counts as well.
 */
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

  // Last resort: the marked row is the one carrying a trailing check icon.
  return items.findIndex((item) => item.querySelectorAll('svg').length > 1)
}

/**
 * Click the next row of the menu attached to `anchor`.
 *
 * @param anchor - the trigger button that opens the menu.
 * @param direction - +1 for next, -1 for previous.
 * @param fallbackLabel - text of the current row, used when the menu marks
 *   nothing (keeps cycle position sane across locales).
 * @returns whether the anchor was clicked.
 */
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

/**
 * Full-access is gated behind a `RiskConfirmation` dialog. It auto-focuses its
 * acknowledge checkbox on open, so after the click the user is already one
 * Space + Enter away from confirming — no extra focus juggling required.
 */

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

  // The chip reads "访问模式，当前：X" / "Access mode, current: X" — X is the live value.
  const label = (button.getAttribute('aria-label') ?? '')
    .replace(/^[^：:]*[：:]\s*/, '')
    .trim()
  return cycleMenu(button, 1, label)
}

function openSessionSearch(): void {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    .find((candidate) => {
      const label = candidate.getAttribute('aria-label') ?? ''
      return SESSION_SEARCH_ARIA.some((text) => label === text)
    })
  if (button === undefined) return

  button.click()
  requestAnimationFrame(() => {
    const input = document.querySelector<HTMLInputElement>(
      'input[placeholder="搜索会话…"], input[placeholder="Search sessions..."]',
    )
    input?.focus({ preventScroll: true })
  })
}

/**
 * Page the conversation between user messages.
 *
 * Two traps in alpha1's transcript DOM that the naive version fell into:
 * 1. `[data-chat-anchor-key]` rows are NOT in visual order (turn-process and
 *    subagent groups interleave), so "last matching row" must be picked by
 *    measured offset, not by DOM index.
 * 2. After a jump the target row's top lands exactly on the marker, so a plain
 *    `< marker` / `> marker` test keeps re-selecting that same row and every
 *    repeat press stalls. The comparison is anchored on the row's top with a
 *    one-pixel epsilon so the parked row is excluded.
 *
 * @param direction - -1 to page up, +1 to page down.
 */
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
    // Nearest row strictly above the marker, excluding the one parked on it.
    let best: { row: HTMLElement; top: number } | undefined
    for (const entry of offsets) {
      if (entry.top >= marker - epsilon) continue
      if (best === undefined || entry.top > best.top) best = entry
    }
    target = best?.row
  } else {
    // Nearest row strictly below the marker, excluding the one parked on it.
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

/**
 * Whether the key press belongs to the composer.
 *
 * Lexical keeps focus on the contenteditable root itself, so `event.target` is
 * the input — but popup shells and some mobile keyboards blur it, leaving
 * `document.activeElement` as the only witness. Both are checked.
 */
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

/**
 * Start a new session, preferring the alpha1 `uiWorkspace` service (which owns
 * navigation and blank-session reuse) and falling back to the pre-alpha
 * controller method so older hosts keep working unchanged.
 */
function startSession(scope: ShortcutScope): void {
  const ui = scope.uiWorkspace?.startSession
  if (typeof ui === 'function') {
    ui.call(scope.uiWorkspace)
    return
  }
  const legacy = scope.workspaces?.startSession
  if (typeof legacy === 'function') legacy.call(scope.workspaces)
}

function onKeyDown(scope: ShortcutScope, event: KeyboardEvent): void {
  if (event.isComposing || event.keyCode === 229 || event.repeat) return

  const key = (event.key || event.code).toLowerCase()
  const alt = event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
  const ctrl = event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey

  if (alt && key === 'a') {
    if (cyclePermission()) event.preventDefault()
    return
  }
  if (alt && key === 'x') {
    event.preventDefault()
    startSession(scope)
    return
  }
  if (ctrl && key === 'k') {
    event.preventDefault()
    openSessionSearch()
    return
  }
  if (alt && (key === 'arrowup' || key === 'arrowdown')) {
    event.preventDefault()
    scrollToUser(key === 'arrowup' ? -1 : 1)
    return
  }
  if (alt && key === 'arrowright') {
    event.preventDefault()
    cycleEffort(scope, 1)
    return
  }
  if (alt && key === 'arrowleft') {
    event.preventDefault()
    cycleEffort(scope, -1)
    return
  }
  if (key === 'tab' && isComposerTarget(event.target)) {
    if (cyclePreset(event.shiftKey ? -1 : 1)) event.preventDefault()
  }
}

export function apply(ctx: ClientContext): void {
  ctx.inject(inject, (scope) => {
    scope.effect(() => {
      const handler = (event: KeyboardEvent) => onKeyDown(scope, event)
      document.addEventListener('keydown', handler, true)
      return () => document.removeEventListener('keydown', handler, true)
    }, 'dsh-ya-simple-shortcuts: keydown')
  })
}
