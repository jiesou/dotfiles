// @vitest-environment jsdom
/** MobileController: always-open sidebar + pager flip/settle, chrome, keyboard inset, teardown. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MobileController, PAGE_ATTR, type MobileControllerOptions } from '../src/client/controller.ts'

/** A MediaQueryList stub (jsdom has none) that records its change listener.
 *  The prefers-reduced-motion query always reports false (marquee enabled);
 *  every other query reports the given `matches`. */
function stubMatchMedia(matches: boolean): { fire: (next: boolean) => void } {
  const listeners = new Set<(e: MediaQueryListEvent) => void>()
  const mql = {
    matches,
    media: '(max-width: 768px)',
    onchange: null,
    addEventListener: (_type: string, fn: () => void) => { listeners.add(fn) },
    removeEventListener: (_type: string, fn: () => void) => { listeners.delete(fn) },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList
  vi.stubGlobal('matchMedia', vi.fn((query: string) => {
    if (query.includes('prefers-reduced-motion')) return { matches: false } as MediaQueryList
    return mql
  }))
  return {
    fire: (next: boolean): void => {
      ;(mql as unknown as { matches: boolean }).matches = next
      for (const fn of listeners) fn({ matches: next } as MediaQueryListEvent)
    },
  }
}

/**
 * Build the AppFrame-shaped frame: a scrollable grid whose first child is the
 * half-open sidebar page (offsetWidth 300 = the chat page's snap position).
 * scrollTo is stubbed onto the instance so tests can read the requested
 * position. The frame starts collapsed (rail).
 */
function makeFrame(): HTMLElement {
  const root = document.createElement('div')
  root.id = 'root'
  const frame = document.createElement('div')
  frame.setAttribute('data-sidebar-collapsed', '')
  frame.setAttribute('data-details-collapsed', '')
  const sidebar = document.createElement('div')
  Object.defineProperty(sidebar, 'offsetWidth', { configurable: true, value: 300 })
  frame.append(sidebar)
  const center = document.createElement('div')
  frame.append(center)
  frame.scrollTo = ((opts: ScrollToOptions): void => { frame.scrollLeft = opts.left ?? 0 }) as never
  root.append(frame)
  document.body.append(root)
  return frame
}

function toggleSidebarSpy() { return vi.fn() }

/** Track every mounted controller so afterEach can dispose it. */
const liveControllers: MobileController[] = []
function makeController(options: MobileControllerOptions): MobileController {
  const controller = new MobileController(options)
  liveControllers.push(controller)
  return controller
}

async function flushTimers(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

afterEach(() => {
  for (const controller of liveControllers.splice(0)) controller.dispose()
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('MobileController mount/dispose', () => {
  it('tags <html> and upgrades the viewport meta', () => {
    stubMatchMedia(false)
    makeFrame()
    const controller = makeController({ toggleSidebar: toggleSidebarSpy() })
    controller.mount()
    expect(document.documentElement.dataset.dshMobile).toBe('')
    const meta = document.querySelector('meta[name="viewport"]')
    expect(meta?.getAttribute('content')).toContain('viewport-fit=cover')
    expect(meta?.getAttribute('content')).toContain('maximum-scale=1')
    controller.dispose()
    expect(document.documentElement.hasAttribute('data-dsh-mobile')).toBe(false)
  })

  it('restores the pre-existing viewport meta content on dispose', () => {
    stubMatchMedia(false)
    const meta = document.createElement('meta')
    meta.name = 'viewport'
    meta.content = 'width=device-width, initial-scale=1'
    document.head.append(meta)
    const controller = makeController({ toggleSidebar: toggleSidebarSpy() })
    controller.mount()
    expect(meta.content).toContain('maximum-scale=1')
    controller.dispose()
    expect(meta.content).toBe('width=device-width, initial-scale=1')
  })
})

describe('MobileController always-open sidebar + pager', () => {
  it('expands the collapsed sidebar on mount and starts on the CHAT page', () => {
    stubMatchMedia(true)
    const frame = makeFrame()
    // The real toggle flips the frame's collapsed attribute (AppFrame
    // re-renders from the layout store); the spy simulates that reaction.
    const toggle = vi.fn(() => { frame.removeAttribute('data-sidebar-collapsed') })
    const controller = makeController({ toggleSidebar: toggle })
    controller.mount()
    expect(toggle).toHaveBeenCalledTimes(1)
    expect(controller.isSidebarOpen()).toBe(true)
    expect(frame.scrollLeft).toBe(300) // starts on the chat page
    expect(document.documentElement.getAttribute(PAGE_ATTR)).toBe('chat')
  })

  it('does not expand on wide viewports', () => {
    stubMatchMedia(false)
    makeFrame()
    const toggle = toggleSidebarSpy()
    const controller = makeController({ toggleSidebar: toggle })
    controller.mount()
    expect(toggle).not.toHaveBeenCalled()
    expect(controller.isSidebarOpen()).toBe(false)
  })

  it('state changes do NOT flip the pager (the page is user-driven)', async () => {
    stubMatchMedia(true)
    const frame = makeFrame()
    const toggle = vi.fn(() => { frame.removeAttribute('data-sidebar-collapsed') })
    const controller = makeController({ toggleSidebar: toggle })
    controller.mount()
    expect(frame.scrollLeft).toBe(300)
    // The sidebar collapses (rail): the pager stays put — the page follows
    // the user, not the state.
    frame.setAttribute('data-sidebar-collapsed', '')
    await new Promise(resolve => setTimeout(resolve, 0)) // mutation observer delivers
    expect(frame.scrollLeft).toBe(300)
    expect(document.documentElement.getAttribute(PAGE_ATTR)).toBe('chat')
  })

  it('picks up the frame when it mounts after the controller', async () => {
    stubMatchMedia(true)
    const root = document.createElement('div')
    root.id = 'root'
    document.body.append(root)
    let frame: HTMLElement | null = null
    const toggle = vi.fn(() => { frame?.removeAttribute('data-sidebar-collapsed') })
    const controller = makeController({ toggleSidebar: toggle })
    controller.mount()
    const frameEl = document.createElement('div')
    frame = frameEl
    frameEl.setAttribute('data-sidebar-collapsed', '')
    frameEl.setAttribute('data-details-collapsed', '')
    const sidebar = document.createElement('div')
    Object.defineProperty(sidebar, 'offsetWidth', { configurable: true, value: 300 })
    frameEl.append(sidebar)
    frameEl.scrollTo = ((opts: ScrollToOptions): void => { frameEl.scrollLeft = opts.left ?? 0 }) as never
    root.append(frameEl)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(toggle).toHaveBeenCalledTimes(1) // always-open expand
    expect(frameEl.scrollLeft).toBe(300) // starts on the chat page
  })

  it('clicking the exposed chat card returns to the chat page', () => {
    stubMatchMedia(true)
    const frame = makeFrame()
    const toggle = toggleSidebarSpy()
    const controller = makeController({ toggleSidebar: toggle })
    controller.mount()
    expect(toggle).toHaveBeenCalledTimes(1) // the mount-time always-open expand
    expect(frame.scrollLeft).toBe(300)
    // The user swiped to the sidebar page; the exposed chat card is the
    // frame's second child. Clicking it flips back to the chat page.
    frame.scrollLeft = 0
    const chatCard = frame.children[1] as HTMLElement
    chatCard.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(frame.scrollLeft).toBe(300)
    expect(toggle).toHaveBeenCalledTimes(1) // pure scroll, state untouched
  })

  it('the sidebar collapse toggle flips to chat instead of collapsing to the rail', () => {
    stubMatchMedia(true)
    const frame = makeFrame()
    const toggle = vi.fn(() => { frame.removeAttribute('data-sidebar-collapsed') })
    const controller = makeController({ toggleSidebar: toggle })
    controller.mount()
    expect(toggle).toHaveBeenCalledTimes(1) // the mount-time always-open expand
    // The user swiped to the sidebar page and taps the shell's collapse
    // button (aria-label 收起侧边栏): the rail collapse is stopped and the
    // pager returns to chat — the state stays expanded, content stays
    // rendered.
    frame.scrollLeft = 0
    const sidebarCol = frame.firstElementChild as HTMLElement
    const collapseBtn = document.createElement('button')
    collapseBtn.setAttribute('aria-label', '收起侧边栏')
    sidebarCol.append(collapseBtn)
    collapseBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(frame.scrollLeft).toBe(300)
    expect(toggle).toHaveBeenCalledTimes(1) // no extra toggle
    expect(controller.isSidebarOpen()).toBe(true)
  })

  it('returnToChat scrolls back to the chat page (session picked in the sidebar)', () => {
    stubMatchMedia(true)
    const frame = makeFrame()
    const controller = makeController({ toggleSidebar: toggleSidebarSpy() })
    controller.mount()
    frame.scrollLeft = 0
    controller.returnToChat()
    expect(frame.scrollLeft).toBe(300)
  })
})

describe('MobileController pager settle (re-snap without state sync)', () => {
  /** Mount with a synchronous rAF so the mount-time re-sync cannot race the
   *  manual scrollLeft the tests set afterwards. */
  function mountSync(frame: HTMLElement, toggle: ReturnType<typeof toggleSidebarSpy>) {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })
    const controller = makeController({ toggleSidebar: toggle })
    controller.mount()
    return controller
  }

  it('parks on the chat page after a past-midpoint swipe WITHOUT syncing state', async () => {
    stubMatchMedia(true)
    const frame = makeFrame()
    const toggle = vi.fn(() => { frame.removeAttribute('data-sidebar-collapsed') })
    mountSync(frame, toggle)
    expect(toggle).toHaveBeenCalledTimes(1) // the mount-time always-open expand
    // Let the mutation observer deliver the mount-time expand before the
    // test drives the scroll.
    await new Promise(resolve => setTimeout(resolve, 0))
    // Swipe from the chat page (300) toward the sidebar, stopping past the
    // midpoint: the settle re-snaps to the chat page, and the state stays
    // expanded — the sidebar column keeps its full rendering (PiUI).
    frame.scrollLeft = 200 // chatLeft 300, midpoint 150
    frame.dispatchEvent(new Event('scroll'))
    await flushTimers(250)
    expect(frame.scrollLeft).toBe(300)
    expect(toggle).toHaveBeenCalledTimes(1) // no state flip from the swipe
    expect(document.documentElement.getAttribute(PAGE_ATTR)).toBe('chat')
    expect(controllerIsOpen()).toBe(true)
    function controllerIsOpen(): boolean {
      return !frame.hasAttribute('data-sidebar-collapsed')
    }
  })

  it('nudges a stop just short of a page back to the whole page', async () => {
    stubMatchMedia(true)
    const frame = makeFrame()
    const toggle = toggleSidebarSpy()
    mountSync(frame, toggle)
    expect(toggle).toHaveBeenCalledTimes(1) // the mount-time always-open expand
    // Stops just short of the chat page: the settle nudges the scroll.
    frame.scrollLeft = 290 // chatLeft 300, nearest chat
    frame.dispatchEvent(new Event('scroll'))
    await flushTimers(250)
    expect(toggle).toHaveBeenCalledTimes(1) // no new flip
    expect(frame.scrollLeft).toBe(300)
  })
})

describe('MobileController keyboard inset', () => {
  it('writes the visual-viewport deficit as --dshm-keyboard-inset', () => {
    stubMatchMedia(false)
    makeFrame()
    const resizeHandlers: Array<() => void> = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        height: 320,
        offsetTop: 0,
        width: 375,
        addEventListener: (_t: string, fn: () => void) => { resizeHandlers.push(fn) },
        removeEventListener: vi.fn(),
      },
    })
    const controller = makeController({ toggleSidebar: toggleSidebarSpy() })
    controller.mount()
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 })
    Object.defineProperty(window.visualViewport, 'height', { configurable: true, value: 300 })
    resizeHandlers[0]?.()
    expect(document.documentElement.style.getPropertyValue('--dshm-keyboard-inset')).toBe('300px')
    controller.dispose()
  })
})

describe('MobileController model-name marquee', () => {
  /** Stub ResizeObserver (jsdom has none) capturing its callback. */
  function stubResizeObserver(): { fire: () => void } {
    let callback: ResizeObserverCallback | null = null
    class FakeRO {
      constructor(cb: ResizeObserverCallback) { callback = cb }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', FakeRO)
    return { fire: () => callback?.([], {} as ResizeObserver) }
  }

  /** Mount the composer-shaped model trigger under #root: slot wrapper ->
   *  root div -> trigger button -> label span (first) + effort span. */
  function makeModelTrigger(): HTMLElement {
    const card = document.createElement('div')
    card.setAttribute('data-composer-card', '')
    const row = document.createElement('div')
    const trailing = document.createElement('div')
    const slot = document.createElement('div')
    slot.setAttribute('data-slot', 'conversation.input.model')
    const seat = document.createElement('div')
    const button = document.createElement('button')
    // Matches the real ModelSelect trigger: the controller pins the label
    // via aria-haspopup='menu' so the open picker's option rows (whose
    // first span is an optionCopy) are never mistaken for it.
    button.setAttribute('aria-haspopup', 'menu')
    const label = document.createElement('span')
    label.textContent = 'DeepSeek-V4-Flash'
    const effort = document.createElement('span')
    effort.textContent = 'High'
    button.append(label, effort)
    seat.append(button)
    slot.append(seat)
    trailing.append(slot)
    row.append(trailing)
    card.append(row)
    document.getElementById('root')?.append(card)
    return label
  }

  it('tags the overflowing label, wraps the text in the transform layer and paces the slide', () => {
    stubMatchMedia(true)
    const ro = stubResizeObserver()
    // Sync rAF that leaves no frame id behind: the controller gates on
    // #marqueeFrame !== null, and a numeric return would re-arm the gate
    // after the callback already ran (the browser's async rAF returns a
    // real id, so this is purely a stub-shape concern).
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return null as unknown as number
    })
    makeFrame()
    const label = makeModelTrigger()
    Object.defineProperty(label, 'scrollWidth', { configurable: true, value: 200 })
    Object.defineProperty(label, 'clientWidth', { configurable: true, value: 112 })
    const controller = makeController({ toggleSidebar: toggleSidebarSpy() })
    controller.mount()
    expect(label.dataset.dshmMarquee).toBe('')
    expect(label.style.getPropertyValue('--dshm-marquee-duration')).toBe('5s')
    // The label's text lives in the transform layer as TWO item spans (text
    // + clone, each trailing a gap) — the -50% loop is a one-way SPACED
    // ticker: tail exits, gap passes, head re-enters.
    const runner = label.firstElementChild
    expect(runner?.getAttribute('data-dshm-marquee-runner')).toBe('')
    expect(runner?.textContent).toBe('DeepSeek-V4-FlashDeepSeek-V4-Flash')
    expect(runner?.children.length).toBe(2)
    for (const item of Array.from(runner?.children ?? [])) {
      expect(item.getAttribute('data-dshm-marquee-item')).toBe('')
    }
    // The name shortens (or the row widens): the layout change clears the
    // marquee, unwraps the runner (original nodes back, clone dropped) and
    // restores the stock ellipsis render.
    Object.defineProperty(label, 'scrollWidth', { configurable: true, value: 90 })
    ro.fire()
    expect(label.hasAttribute('data-dshm-marquee')).toBe(false)
    expect(label.style.getPropertyValue('--dshm-marquee-duration')).toBe('')
    expect((label.firstElementChild?.hasAttribute('data-dshm-marquee-runner') ?? false)).toBe(false)
    expect(label.textContent).toBe('DeepSeek-V4-Flash')
    controller.dispose()
  })

  it('picks up a composer that mounts after the controller', () => {
    stubMatchMedia(true)
    stubResizeObserver()
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return null as unknown as number
    })
    const frame = makeFrame()
    const controller = makeController({ toggleSidebar: toggleSidebarSpy() })
    controller.mount()
    expect(document.querySelector('[data-dshm-marquee]')).toBeNull()
    const label = makeModelTrigger()
    Object.defineProperty(label, 'scrollWidth', { configurable: true, value: 200 })
    Object.defineProperty(label, 'clientWidth', { configurable: true, value: 112 })
    // The composer mutation is delivered async by the MutationObserver
    // (microtask), then the throttled sync runs on the stub rAF.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(label.dataset.dshmMarquee).toBe('')
        expect(label.firstElementChild?.getAttribute('data-dshm-marquee-runner')).toBe('')
        expect(frame.scrollLeft).toBe(300)
        resolve()
      }, 0)
    })
  })

  it('removes every marquee marker and unwraps the runner on dispose', () => {
    stubMatchMedia(true)
    stubResizeObserver()
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return null as unknown as number
    })
    makeFrame()
    const label = makeModelTrigger()
    Object.defineProperty(label, 'scrollWidth', { configurable: true, value: 200 })
    Object.defineProperty(label, 'clientWidth', { configurable: true, value: 112 })
    const controller = makeController({ toggleSidebar: toggleSidebarSpy() })
    controller.mount()
    expect(label.dataset.dshmMarquee).toBe('')
    controller.dispose()
    expect(label.hasAttribute('data-dshm-marquee')).toBe(false)
    expect(label.style.getPropertyValue('--dshm-marquee-duration')).toBe('')
    expect((label.firstElementChild?.hasAttribute('data-dshm-marquee-runner') ?? false)).toBe(false)
    expect(label.textContent).toBe('DeepSeek-V4-Flash')
  })
})
