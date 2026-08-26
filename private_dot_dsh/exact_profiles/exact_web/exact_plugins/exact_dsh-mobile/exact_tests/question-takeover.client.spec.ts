// @vitest-environment jsdom
/**
 * dsh-mobile question-takeover contract: the ui-user-questions
 * QuestionComposer card caps at min(60vh, 520px) with the body scrolling,
 * but the question text (the header's h2 title, a non-shrinking row) and
 * the option list compete for the same fixed card height — a long question
 * pushes the options and the custom-answer input below the fold on phones.
 * The mobile sheet caps the title (and the optional MarkdownText detail
 * div) in their own self-scrolling windows with a bottom fade, and lets
 * the option group absorb the remaining body height, keeping answers in
 * view and the input row near the bottom. Selectors key off the stable
 * seats only — [data-question-scroll], its :has() parent section, the
 * header's h2, the option group's role (radiogroup / group), the detail
 * div being the body's only non-role direct div — never hashed class names.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(process.cwd(), 'src/client/mobile.css'), 'utf8')

describe('mobile.css question-takeover contract', () => {
  it('caps the question title in its own scrolling window', () => {
    // The question text renders as the header's h2 inside the card section
    // (the body's :has() parent). A long title otherwise inflates the
    // non-shrinking header and pushes the options below the fold. Same
    // behavior as the option list: capped height, internal scroll.
    expect(css).toContain(`[data-dsh-mobile] section:has(> [data-question-scroll]) > header h2`)
    expect(css).toContain(`max-height: min(24vh, 160px)`)
    expect(css).toContain(`overflow-y: auto`)
  })

  it('caps the optional detail div the same way', () => {
    // The detail div is the body's only non-role direct div: the option
    // group always carries role=radiogroup/group, the detail never does.
    expect(css).toContain(`[data-dsh-mobile] [data-question-scroll] > div:not([role])`)
    expect(css).toContain(`max-height: min(24vh, 160px)`)
  })

  it('lets the option group absorb the remaining body height', () => {
    // Single-select (radiogroup) and multi-select (group) both keep the
    // answers in view and settle the custom-answer row near the bottom.
    expect(css).toContain(`[data-dsh-mobile] [data-question-scroll] > [role='radiogroup']`)
    expect(css).toContain(`[data-dsh-mobile] [data-question-scroll] > [role='group']`)
    expect(css).toContain(`flex: 1 1 auto`)
  })
})
