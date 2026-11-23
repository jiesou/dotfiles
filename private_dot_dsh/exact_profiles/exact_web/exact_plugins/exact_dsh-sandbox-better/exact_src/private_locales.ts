/** Approval-card copy for a writable-directory request; the audit reason stays English. */

/** English approval text. */
const en = {
  grant: (directory: string): string => `Allow writes under ${directory} for this session?`,
}

/** Chinese approval text. */
const zh = {
  grant: (directory: string): string => `允许本会话写入 ${directory}？`,
} satisfies typeof en

/**
 * Build the approval's localized presentation text for the Client's locale resolver.
 * @param directory - absolute directory the session would gain write access to.
 * @returns one entry per supported locale; the Client falls back to `en`.
 */
export function grantDisplayReason(directory: string): Record<'en' | 'zh', string> {
  return {
    en: en.grant(directory),
    zh: zh.grant(directory),
  }
}
