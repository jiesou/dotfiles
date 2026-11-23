/**
 * Keep the model's runtime context free of the deployment's directory list.
 *
 * `dsh-sandbox-policy` writes `Additional writable directories: [...]` into the
 * per-step policy line. That list is machine configuration, not a decision the
 * model has to make, and it repeats every step. The policy line itself
 * (mode + workspace) stays.
 *
 * The removal is anchored, not a bare `indexOf`:
 * - the text must be the workspace-write policy line this plugin knows;
 * - the marker must directly follow the JSON workspace string (`".`), so a
 *   directory whose name contains the marker cannot hijack it;
 * - the clause must start a JSON array, must end in the known tail sentence at
 *   the very end of the line, and must stay under a size bound;
 * - anything unexpected leaves the text untouched, so a rewording upstream
 *   keeps the list rather than cutting the wrong bytes.
 */

const PREFIX = 'Current DSH file policy: workspace-write. '
const MARKER = ' Additional writable directories: '
const TAIL = ' Some platform temporary areas may also be writable.'
const MAX_CLAUSE_BYTES = 8192

/**
 * Remove the additional-directories clause from one policy line.
 * @param text - the rendered `sandbox:policy` context.
 * @returns the line without the clause; unchanged when any anchor fails.
 */
export function stripAdditionalRoots(text: string): string {
  if (!text.startsWith(PREFIX) || !text.endsWith(TAIL)) return text
  let start = text.indexOf(MARKER)
  while (start >= 0) {
    if (text.slice(0, start).endsWith('".') && text[start + MARKER.length] === '[') break
    start = text.indexOf(MARKER, start + 1)
  }
  if (start < 0) return text
  const tailStart = text.lastIndexOf(TAIL)
  if (tailStart <= start || tailStart - start > MAX_CLAUSE_BYTES) return text
  return `${text.slice(0, start)}${text.slice(tailStart)}`
}
