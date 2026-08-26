/** Pure-host helper sanity: PWA manifest/SW source and session-title folding. */
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { manifestSource, sessionTitleFromEvents, swSource } from '../src/notify-host.ts'
import { urlBase64ToUint8Array } from '../src/client/push.ts'

describe('notify-host helpers', () => {
  it('sessionTitleFromEvents folds session/title last-wins', () => {
    expect(sessionTitleFromEvents([
      { type: 'user/message', data: { content: [{ type: 'text', text: 'first prompt' }] } },
      { type: 'session/title', data: { title: 'chosen title' } },
      { type: 'session/title', data: { title: 'final title' } },
    ])).toBe('final title')
  })

  it('sessionTitleFromEvents falls back to the first user message and truncates', () => {
    const long = 'x'.repeat(30)
    expect(sessionTitleFromEvents([
      { type: 'user/message', data: { content: [{ type: 'text', text: long }] } },
    ])).toBe(`${'x'.repeat(20)}…`)
    expect(sessionTitleFromEvents(undefined)).toBe('')
  })

  it('manifestSource advertises PNG icons and standalone display', () => {
    const manifest = JSON.parse(manifestSource()) as {
      display: string
      icons: Array<{ src: string; sizes: string }>
    }
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.some(icon => icon.src.includes('icon-512.png') && icon.sizes === '512x512')).toBe(true)
  })

  it('swSource registers push + notificationclick and the plugin icon', () => {
    const sw = swSource()
    expect(sw).toContain("self.addEventListener('push'")
    expect(sw).toContain("self.addEventListener('notificationclick'")
    expect(sw).toContain('/plugins/web-ui-notify/icon-180.png')
  })
})

describe('push helpers', () => {
  it('urlBase64ToUint8Array decodes base64url', () => {
    const bytes = urlBase64ToUint8Array('AQID')
    expect([...bytes]).toEqual([1, 2, 3])
  })
})
