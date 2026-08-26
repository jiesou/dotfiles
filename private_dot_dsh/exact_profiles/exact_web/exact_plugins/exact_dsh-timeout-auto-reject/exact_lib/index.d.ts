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
import type { Context } from '@deepseek-ai/cordis';
export declare const name = "timeout-auto-reject";
export declare function apply(ctx: Context): void;
