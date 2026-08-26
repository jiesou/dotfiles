/**
 * timeout-auto-reject for dsh — migrates the opencode plugin of the
 * same name: any permission (approval) request left unanswered for a period of
 * time is rejected automatically, so the agent changes direction instead of
 * hanging or bypassing the permission.
 *
 * dsh's approval seam is a waterfall (`approval/request`): the api-proxy
 * answerer presents the question to the browser and returns a promise that
 * settles only when the human answers. This plugin prepends to that waterfall:
 * it calls the downstream `next()` and races its promise against a timer. If
 * the human answers in time the downstream outcome wins; otherwise the request
 * steers a model-visible explanation and settles `'rejected'` (fail-closed).
 *
 * Reference: the opencode original (remorses/kimaki --permission-timeout-minutes
 * pattern), ported to dsh's synchronous decision model.
 */

import type { Context } from '@deepseek-ai/cordis'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import type { ApprovalOutcome } from '@deepseek-ai/dsh-user-approval'

export const name = 'timeout-auto-reject'

const TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes, matching the opencode plugin
const DEADLINE_REASON_PREFIX = 'dsh-timeout:'
const TIMEOUT_MESSAGE =
  'SYSTEM: This specific tool call was auto-rejected, ' +
  'because the user is off-screen now. ' +
  'Follow SAFETY & BOUNDARIES guidelines; break your large commands down into multiple auditable actions; or try a different approach.'

export function apply(ctx: Context): void {
  // Prepend so this answerer runs before the human (api-proxy) answerer.
  ctx.on('approval/request', (req: unknown, next: () => unknown) => {
    const deadline = Date.now() + TIMEOUT_MS
    const request = req as {
      agent?: { steer?: (message: unknown) => void }
      reason?: string
      signal?: AbortSignal
    }
    const originalSignal = request.signal
    const controller = new AbortController()
    const onAbort = () => controller.abort()
    originalSignal?.addEventListener('abort', onAbort, { once: true })
    Object.defineProperty(request, 'reason', {
      configurable: true,
      enumerable: true,
      value: `${request.reason ?? ''}${DEADLINE_REASON_PREFIX}${deadline}`,
    })
    Object.defineProperty(request, 'signal', {
      configurable: true,
      enumerable: true,
      value: controller.signal,
    })

    return new Promise<ApprovalOutcome>((resolve) => {
      let settled = false
      let timedOut = false
      const finish = (outcome: ApprovalOutcome) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        originalSignal?.removeEventListener('abort', onAbort)
        resolve(outcome)
      }
      const finishFromDownstream = (outcome: ApprovalOutcome) => {
        finish(timedOut ? 'rejected' : outcome)
      }
      const timer = setTimeout(() => {
        timedOut = true
        controller.abort()
        try {
          request.agent?.steer?.(
            createUserMessage({
              content: [{ type: 'text', text: TIMEOUT_MESSAGE }],
              source: { kind: 'plugin', plugin: name },
            }),
          )
        } catch {}
      }, TIMEOUT_MS)
      timer.unref?.()

      let downstream: unknown
      try {
        downstream = next()
      } catch {
        finish('unavailable')
        return
      }

      if (downstream && typeof (downstream as Promise<unknown>).then === 'function') {
        ;(downstream as Promise<unknown>).then(
          (outcome) => finishFromDownstream(outcome as ApprovalOutcome),
          () => finish(timedOut ? 'rejected' : 'unavailable'),
        )
      } else {
        finish('unavailable')
      }
    })
  }, true)
}
