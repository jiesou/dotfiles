/**
 * Tolerant reading of the escalation arguments models get wrong most often.
 *
 * The stock tools validate `sandbox_permissions` / `justification` strictly and
 * throw before anything runs: a stray justification, a missing one, a target
 * that is not strictly wider. None of those errors protect anything — the call
 * would simply have run under the current mode — so this plugin rewrites the
 * two permission fields and lets the call proceed.
 */

/** Tools whose schema carries the escalation pair. */
const ESCALATION_TOOLS = new Set(['bash', 'pwsh', 'write', 'edit'])

/** The closed sandbox-mode vocabulary; anything else stays the model's error. */
const KNOWN_MODES = new Set(['read-only', 'workspace-write', 'danger-full-access'])

/** Strictly wider targets per effective mode, mirroring the harness table. */
const WIDER_MODES: Record<string, readonly string[]> = {
  'read-only': ['workspace-write', 'danger-full-access'],
  'workspace-write': ['danger-full-access'],
}

/** Stand-in reason for a widening request that carried none. */
export const DEFAULT_JUSTIFICATION = 'Agent did not attach a justification.'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Rewrite the permission fields of one tool call.
 * @param name - tool name.
 * @param raw - parsed arguments, untouched.
 * @param mode - the call's effective sandbox mode.
 * @returns replacement arguments, or undefined when nothing needs rewriting.
 */
export function normalizePermissionArgs(
  name: string,
  raw: unknown,
  mode: string,
): Record<string, unknown> | undefined {
  if (!ESCALATION_TOOLS.has(name) || !isRecord(raw)) return undefined
  const hasMode = typeof raw.sandbox_permissions === 'string' && raw.sandbox_permissions.length > 0
  const hasJustification = typeof raw.justification === 'string' && raw.justification.trim().length > 0
  if (!hasMode) {
    if (raw.justification === undefined) return undefined
    const { justification: _drop, ...rest } = raw
    return rest
  }
  const target = raw.sandbox_permissions as string
  if (!KNOWN_MODES.has(target)) return undefined
  if (!(WIDER_MODES[mode] ?? []).includes(target)) {
    const { sandbox_permissions: _mode, justification: _reason, ...rest } = raw
    return rest
  }
  if (hasJustification) return undefined
  return { ...raw, justification: DEFAULT_JUSTIFICATION }
}
