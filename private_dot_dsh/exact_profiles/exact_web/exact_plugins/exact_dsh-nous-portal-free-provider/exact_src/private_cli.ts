#!/usr/bin/env node
/**
 * nous-portal-free-provider login CLI.
 *
 * The harness authorization seam (`ctx.authorization`) has no surface in this
 * dsh build — nothing calls `begin()`, so a registered flow cannot be started
 * from the webui or the CLI. This wrapper runs the same device-code dance that
 * flow would and commits the grant straight into the credentials document the
 * host watches, so the provider route picks it up without a restart.
 *
 * @module nous-portal-free-provider/cli
 */

import { homedir } from 'node:os'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { credentialKey } from '@deepseek-ai/dsh-credentials'
import { parseDocument } from 'yaml'
import { DEFAULT_CLIENT_ID, DEFAULT_PORTAL_URL, DEFAULT_SCOPE, deviceCodeLogin } from './oauth.js'

const PLUGIN = 'nous-portal-free-provider'
/** The one record this plugin owns; mirrors index.ts's RECORD_KEY. */
const RECORD_KEY = credentialKey(PLUGIN, 'portal')

function usage(): string {
  return [
    'Usage: dsh-nous-login [options]',
    '',
    'Sign in to Nous Portal through the device-code flow and store the grant',
    'in the dsh credentials document (~/.dsh/.credentials.yaml).',
    '',
    'Options:',
    `  --portal-url <url>   Portal base URL (default ${DEFAULT_PORTAL_URL})`,
    `  --client-id <id>     OAuth client id (default ${DEFAULT_CLIENT_ID})`,
    `  --scope <scope>      Requested scope (default ${DEFAULT_SCOPE})`,
    '  --dsh-home <dir>     Harness home holding .credentials.yaml (default $DSH_HOME or ~/.dsh)',
    '  --path <file>        Credentials document path; wins over --dsh-home',
    '  -h, --help           Show this help',
  ].join('\n')
}

function resolveStorePath(args: { path?: string, dshHome?: string }): string {
  if (args.path !== undefined) return args.path
  const home = args.dshHome ?? process.env.DSH_HOME ?? `${homedir()}/.dsh`
  return `${home.replace(/\/+$/, '')}/.credentials.yaml`
}

/**
 * Render the next document text with this plugin's grant record written,
 * preserving comments and formatting of everything else. Mirrors
 * credentials-local's own edit style: replace the whole record node.
 */
export function renderRecord(text: string | undefined, key: string, record: unknown): string {
  const empty = text === undefined || text.trim().length === 0
  const doc = parseDocument(empty ? '' : text)
  if (!empty) {
    const version = doc.get('version')
    if (version !== 1) {
      throw new Error(`unsupported credentials document at version ${JSON.stringify(version) ?? 'absent'}; only version 1 can be edited here`)
    }
  } else {
    doc.set('version', 1)
  }
  doc.setIn(['records', key], record)
  const rendered = String(doc)
  return rendered.endsWith('\n') ? rendered : `${rendered}\n`
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      'portal-url': { type: 'string' },
      'client-id': { type: 'string' },
      scope: { type: 'string' },
      'dsh-home': { type: 'string' },
      path: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  })
  if (values.help === true) {
    console.log(usage())
    return
  }
  const portalUrl = values['portal-url'] ?? DEFAULT_PORTAL_URL
  const clientId = values['client-id'] ?? DEFAULT_CLIENT_ID
  const scope = values.scope ?? DEFAULT_SCOPE

  console.log(`Nous Portal sign-in (device code, client ${clientId})`)
  const grant = await deviceCodeLogin({
    portalUrl,
    clientId,
    scope,
    onChallenge: ({ verificationUrl, userCode }) => {
      console.log('\n1. Open this page in any browser signed into the Portal:')
      console.log(`     ${verificationUrl}`)
      if (userCode.length > 0) console.log(`   User code (should be pre-filled): ${userCode}`)
      console.log('2. Approve the sign-in there. Waiting for approval ')
    },
    onPending: () => {
      process.stdout.write('.')
    },
  })

  const storePath = resolveStorePath({ path: values.path, dshHome: values['dsh-home'] })
  const existing = existsSync(storePath)
  const text = existing ? readFileSync(storePath, 'utf8') : undefined
  if (text !== undefined && text.includes(RECORD_KEY)) {
    console.log(`\nReplacing an existing grant at "${RECORD_KEY}".`)
  }
  const rendered = renderRecord(text, RECORD_KEY, { kind: 'grant', payload: grant })
  const tmpPath = `${storePath}.tmp-${process.pid}`
  writeFileSync(tmpPath, rendered, { encoding: 'utf8', mode: 0o600 })
  renameSync(tmpPath, storePath)

  console.log(`\n✓ Signed in. Grant stored under "${RECORD_KEY}" in ${storePath}`)
  console.log('The nous-portal route resolves it on its next request — no restart needed.')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  if (/abort|cancelled/i.test(message)) {
    console.error('\nSign-in cancelled.')
  } else {
    console.error(`dsh-nous-login: ${message}`)
  }
  process.exit(1)
})
