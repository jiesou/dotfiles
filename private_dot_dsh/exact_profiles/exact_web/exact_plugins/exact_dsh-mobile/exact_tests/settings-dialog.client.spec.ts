// @vitest-environment jsdom
/**
 * dsh-mobile settings-dialog contract: the mobile sheet must restructure the
 * stock 800px two-column settings modal into a centered dialog card with a
 * top horizontal tab strip, keeping the dialog affordance (margins, radius),
 * lifting the actions + close buttons onto the title line, and keying every
 * rule off stable role/data-slot hooks scoped under [data-dsh-mobile] so
 * desktop and uninstalled runs stay byte-identical.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(process.cwd(), 'src/client/mobile.css'), 'utf8')

describe('mobile.css settings-dialog contract', () => {
  it('targets the dialog through stable hooks only', () => {
    // The panel is the [role=dialog] element; the nav rail is its <nav>
    // child; the content column is the dialog's last child. The parent
    // rules are scoped to :has(> nav) so the composer's context-ring
    // dialog (no nav) keeps its own geometry. No hashed class.
    expect(css).toContain(`[role='dialog']`)
    expect(css).toContain(`[role='dialog'] > nav`)
    expect(css).toContain(`[role='dialog']:has(> nav) > div:last-child`)
    expect(css).toContain(`[role='dialog']:has(> nav) > div:last-child > div:last-child`)
    expect(css).toContain(`[role='dialog']:has(> nav) > div:last-child > div:first-child`)
  })

  it('keeps the panel a centered dialog card, not a full-screen sheet', () => {
    // The stock modal is a dialog; mobile must keep the affordance — capped
    // width/height with a viewport margin and a rounded radius — while
    // switching to a single column.
    expect(css).toContain(`flex-direction: column`)
    expect(css).toContain(`width: min(560px, calc(100vw - 32px))`)
    expect(css).toContain(`height: min(720px, calc(100vh - 32px))`)
    expect(css).toContain(`border-radius: 20px`)
    // The dialog card itself must not be full-bleed: no zero-radius or
    // viewport-filling width on the [role=dialog] rule body.
    const dialogRule = css.match(/\[role='dialog'\]:has\(> nav\)\s*\{[^}]*\}/)?.[0] ?? ''
    expect(dialogRule).not.toContain(`border-radius: 0`)
    expect(dialogRule).not.toContain(`width: 100%`)
    expect(dialogRule).not.toContain(`height: 100%`)
  })

  it('turns the nav rail into a top horizontal tab strip', () => {
    // The rail loses its fixed 188px width, the cell list flows horizontally
    // and scrolls, and cells become pill tabs.
    expect(css).toContain(`[role='dialog'] > nav > div:nth-child(2)`)
    expect(css).toContain(`flex-direction: row`)
    expect(css).toContain(`overflow-x: auto`)
    expect(css).toContain(`border-radius: 999px`)
    expect(css).toContain(`width: auto`)
  })

  it('lifts the actions + close onto the dialog title line', () => {
    // The content column's header row (actions + close) is absolutely
    // positioned at the card's top-right so it sits on the same line as the
    // nav title (top-left), instead of its own row below the tabs.
    expect(css).toContain(`[role='dialog']:has(> nav) > div:last-child > div:first-child`)
    expect(css).toContain(`position: absolute`)
    expect(css).toContain(`top: 10px`)
    expect(css).toContain(`right: 14px`)
  })

  it('keeps the content column full width and internally scrollable', () => {
    expect(css).toContain(`flex: 1`)
    expect(css).toContain(`min-height: 0`)
    expect(css).toContain(`overflow-y: auto`)
  })

  it('fixes the shared Modal footer box model on mobile', () => {
    // The ui-primitives Modal footer sizes content-box width + 24px side
    // padding, spilling out of the card on phones. The border-box rule is
    // pinned to the dialog's last child whose direct children are buttons,
    // so it cannot hit the settings dialog's content column.
    expect(css).toContain(`[role='dialog'] > :last-child:has(> button)`)
    expect(css).toContain(`box-sizing: border-box`)
    expect(css).toContain(`width: 100%`)
    expect(css).toContain(`min-width: 0`)
  })

  it('scopes every rule under the mobile attribute', () => {
    // Pull the rule bodies and ensure each starts with a [data-dsh-mobile]
    // scoped selector chain. At-rules (@media/@supports/@keyframes/@container)
    // are skipped — their nested declarations carry their own selectors.
    // The composer row is the plugin's @container target (its container-type
    // is the stock InputBar row), and every rule nested under it is still
    // [data-dsh-mobile]-scoped.
    const bodies = css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split(/\n\s*}/)
      .map(part => part.trim())
      .filter(part => part.length > 0)
    for (const body of bodies) {
      const selector = body.split(/\{/)[0]?.trim() ?? ''
      if (selector === '' || /^@(media|supports|keyframes|font-face|container)/.test(selector)) continue
      expect(selector, `unscoped selector: ${selector}`).toContain(`[data-dsh-mobile]`)
    }
  })
})
