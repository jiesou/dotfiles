// @vitest-environment jsdom
/** dsh-mobile registration: mounts the controller; returns to chat on session change. */
import { Context } from 'cordis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { apply, inject } from '../src/client/index.ts'

/** A MediaQueryList stub (jsdom has none) with a controllable fire(). */
function stubMatchMedia(matches: boolean): { fire: (next: boolean) => void } {
  const listeners = new Set<(e: MediaQueryListEvent) => void>()
  const mql = {
    matches,
    media: '(max-width: 768px)',
    onchange: null,
    addEventListener: (_t: string, fn: () => void) => { listeners.add(fn) },
    removeEventListener: (_t: string, fn: () => void) => { listeners.delete(fn) },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList
  vi.stubGlobal('matchMedia', vi.fn(() => mql))
  return {
    fire: (next: boolean): void => {
      ;(mql as unknown as { matches: boolean }).matches = next
      for (const fn of listeners) fn({ matches: next } as MediaQueryListEvent)
    },
  }
}

interface ListCapture {
  getSnapshot: () => { current: string | undefined; byId: Record<string, unknown> }
  subscribe: (fn: () => void) => () => void
}

beforeEach(() => {
  stubMatchMedia(false)
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  vi.unstubAllGlobals()
})

async function bench(layout?: unknown, list?: ListCapture) {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  ctx.provide('locale', new LocaleRuntime(ctx))
  ctx.provide('layout', layout ?? {
    toggleSidebar: vi.fn(),
    openDetails: vi.fn(),
    closeDetails: vi.fn(),
  })
  ctx.provide('sessions', {
    list: list ?? {
      getSnapshot: () => ({ current: undefined, byId: {} }),
      subscribe: () => () => {},
    },
  })
  return { ctx }
}

describe('dsh-mobile apply', () => {
  it('declares only the services it uses', () => {
    expect(inject).toEqual(['layout', 'sessions'])
  })

  it('mounts the controller and tags <html>', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    expect(document.documentElement.dataset.dshMobile).toBe('')
  })

  it('returns to the chat page when the current session changes', async () => {
    const listeners: Array<() => void> = []
    let current: string | undefined = undefined
    const list: ListCapture = {
      getSnapshot: () => ({ current, byId: {} }),
      subscribe: (fn) => { listeners.push(fn); return () => { } },
    }
    const b = await bench(undefined, list)
    const mql = stubMatchMedia(false)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    // Narrow viewport with a frame: the pager starts on the chat page, then
    // the user swipes to the sidebar page.
    mql.fire(true)
    const root = document.createElement('div')
    root.id = 'root'
    const frame = document.createElement('div')
    frame.setAttribute('data-sidebar-collapsed', '')
    frame.setAttribute('data-details-collapsed', '')
    const sidebar = document.createElement('div')
    Object.defineProperty(sidebar, 'offsetWidth', { configurable: true, value: 300 })
    frame.append(sidebar)
    frame.append(document.createElement('div'))
    frame.scrollTo = ((opts: ScrollToOptions): void => { frame.scrollLeft = opts.left ?? 0 }) as never
    root.append(frame)
    document.body.prepend(root)
    frame.scrollLeft = 0 // the user swiped to the sidebar page
    // A session is picked in the sidebar: the pager returns to the chat page.
    current = 's1'
    for (const fn of listeners) fn()
    expect(frame.scrollLeft).toBe(300)
  })
})
