// Node half: inject theme-color metas, patch manifest to standalone, serve PWA icon
// and the token hand-off entry an installed app's start_url points at.
import { createRequire } from 'node:module'
import { appendFileSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_PREFERENCE, THEME_PREFERENCE_FIELD, THEME_SETTINGS_NAMESPACE } from '@deepseek-ai/dsh-client-ui-theme'

const META_ATTR = 'data-dsh-webui-fix-pwa'
const FALLBACK_LIGHT = 'rgb(255, 255, 255)'
const FALLBACK_DARK = 'rgb(21, 21, 23)'
const ICON_PATH = '/dsh-webui-fix-pwa/icon.svg'
const AUTH_PATH = '/dsh-webui-fix-pwa/auth'
const LOG_PATH = join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'pwa-auth.log')
const ICON_SIZE = 512
const ICON_SCALE = 6.5
const ICON_PAD_X = 92
const ICON_PAD_Y = 92
const require = createRequire(import.meta.url)

function readAsset(specifier) {
  try {
    return readFileSync(require.resolve(specifier), 'utf8')
  } catch {
    return null
  }
}

function designTokens() {
  const fallback = { light: FALLBACK_LIGHT, dark: FALLBACK_DARK }
  const css = readAsset('@deepseek-ai/dsh-client-ui-theme/styles/design-platform.css')
  if (css === null) return fallback
  const token = (name) => {
    const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`))
    return match === null ? null : match[1].trim()
  }
  const light = token('dsw-static-neutral-bluish-00')
  const dark = token('dsw-static-neutral-bluish-950')
  return light === null || dark === null ? fallback : { light, dark }
}

function manifestBase() {
  const source = readAsset('@deepseek-ai/dsh-web-frontend/dist/manifest.webmanifest')
  if (source === null) throw new Error('dsh-webui-fix-pwa: cannot resolve @deepseek-ai/dsh-web-frontend/dist/manifest.webmanifest')
  return JSON.parse(source)
}

function pwaIconSvg() {
  const source = readAsset('@deepseek-ai/dsh-web-frontend/dist/favicon.svg')
  if (source === null) return null
  const path = source.match(/<path\b[^>]*\/>/)
  if (path === null) return null
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}"><circle cx="256" cy="256" r="256" fill="#ffffff"/><g transform="translate(${ICON_PAD_X} ${ICON_PAD_Y}) scale(${ICON_SCALE})">${path[0]}</g></svg>`
}

function injectThemeColorMetas(html, light, dark, preference) {
  const apple = '<meta name="mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />'
  let metas = ''
  if (preference === 'light') {
    metas = `<meta name="theme-color" ${META_ATTR} content="${light}" />`
  } else if (preference === 'dark') {
    metas = `<meta name="theme-color" ${META_ATTR} content="${dark}" />`
  } else {
    metas = `<meta name="theme-color" ${META_ATTR} media="(prefers-color-scheme: light)" content="${light}" /><meta name="theme-color" ${META_ATTR} media="(prefers-color-scheme: dark)" content="${dark}" />`
  }
  const style = preference === 'light'
    ? `<style ${META_ATTR}>html{background:${light};color-scheme:light}</style>`
    : preference === 'dark'
      ? `<style ${META_ATTR}>html{background:${dark};color-scheme:dark}</style>`
      : `<style ${META_ATTR}>html{background:${light}}@media (prefers-color-scheme: dark){html{background:${dark}}}html{color-scheme:light dark}</style>`
  const injection = `${metas}${apple}${style}`
  let out = html.includes('</head>')
    ? html.replace('</head>', `${injection}</head>`)
    : `${html}${injection}`
  // iOS notch: without viewport-fit=cover the status-bar area stays white.
  if (!/viewport-fit\s*=\s*cover/.test(out)) {
    out = out.replace(
      /<meta\s+name="viewport"\s+content="([^"]*)"\s*\/?>/,
      (_, content) => `<meta name="viewport" content="${content}, viewport-fit=cover" />`,
    )
  }
  // Chromium fetches the manifest with credentials omitted unless the link is
  // credentialed, which would drop the scheme cookie the manifest color needs.
  return out.replace(
    /<link\b[^>]*\brel="manifest"[^>]*>/,
    (tag) => (/\bcrossorigin\b/.test(tag) ? tag : tag.replace(/\s*\/?>$/, (end) => ` crossorigin="use-credentials"${end}`)),
  )
}

function currentPreference(ctx) {
  try {
    return ctx.get('settings')?.get?.(THEME_SETTINGS_NAMESPACE)?.[THEME_PREFERENCE_FIELD] ?? DEFAULT_PREFERENCE
  } catch {
    return DEFAULT_PREFERENCE
  }
}

// The browser half reports the scheme it actually resolved (which is the only
// place `system` is resolvable) back in this cookie.
function cookieScheme(req) {
  const header = req.headers?.cookie
  if (typeof header !== 'string') return null
  const match = header.match(/(?:^|;\s*)dsh-color-scheme=(light|dark)(?:;|$)/)
  return match === null ? null : match[1]
}

function serveManifest(ctx, tokens, base, icon) {
  return (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405)
      res.end()
      return
    }
    const preference = currentPreference(ctx)
    // Manifest has no per-scheme colors. Explicit prefs are exact; `system`
    // resolves through the scheme the browser reported in the cookie, then the
    // Sec-CH-Prefers-Color-Scheme client hint when it is sent, else light.
    const reported = cookieScheme(req) ?? req.headers?.['sec-ch-prefers-color-scheme']
    const color = preference === 'dark' || (preference !== 'light' && reported === 'dark')
      ? tokens.dark
      : tokens.light
    const icons = icon === null
      ? base.icons
      : [{ src: ICON_PATH, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
    // Only embed the token for authenticated requests. `connection` exists only
    // on dsh >= 0.1.2-alpha.1; it is read defensively (not injected) so that
    // 0.1.1-rc2, where the service is absent, still loads and serves the plain
    // start_url.
    let startUrl = base.start_url
    const conn = connectionOf(ctx)
    if (conn !== null) {
      startUrl = AUTH_PATH
      if (conn.requestRejection?.(req) === undefined) {
        const token = new URL(conn.authenticatedUrl('http://localhost')).searchParams.get('token')
        if (typeof token === 'string') startUrl = `${AUTH_PATH}?token=${token}`
      } else {
        logPwa('manifest-unauthenticated', req, {})
      }
    }
    const body = JSON.stringify({
      ...base,
      // The app identity must not ride on `start_url`: that carries a per-process
      // token, and a shifting id makes every reinstall a different app.
      id: '/',
      display: 'standalone',
      theme_color: color,
      background_color: color,
      start_url: startUrl,
      icons,
    }, null, 2)
    res.writeHead(200, {
      'content-type': 'application/manifest+json; charset=utf-8',
      'cache-control': 'no-cache',
    })
    res.end(body)
  }
}

function serveIcon(svg) {
  return (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405)
      res.end()
      return
    }
    res.writeHead(200, {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'no-cache',
    })
    res.end(svg)
  }
}

// `connection` (and its one-time launch token) only exists on dsh >= 0.1.2-alpha.1.
// It is intentionally not injected: a required inject would stop this plugin from
// loading on 0.1.1-rc2, where the service is absent. Read it defensively so an
// absent service degrades to "no token" instead of throwing. `ctx.get` is the
// inject-free service read: the `ctx.connection` property accessor throws
// "cannot get property ... without inject", which a try/catch would silently
// turn into a permanent "no token" for every request.
function connectionOf(ctx) {
  try { return ctx.get('connection') } catch { return null }
}

// Diagnostic trail for "the installed app cannot authenticate" reports: one JSON
// line per event in ~/.dsh/pwa-auth.log, never a cookie value.
function logPwa(event, req, extra) {
  try {
    appendFileSync(LOG_PATH, `${JSON.stringify({
      time: new Date().toISOString(),
      event,
      host: req.headers?.host ?? null,
      url: req.url ?? null,
      userAgent: req.headers?.['user-agent'] ?? null,
      cookieNames: (req.headers?.cookie ?? '').split(';').map((part) => part.split('=')[0].trim()).filter((name) => name !== ''),
      secFetchSite: req.headers?.['sec-fetch-site'] ?? null,
      secFetchMode: req.headers?.['sec-fetch-mode'] ?? null,
      secFetchDest: req.headers?.['sec-fetch-dest'] ?? null,
      ...extra,
    })}\n`)
  } catch {}
}

// The gate owns cookie signing, so the token exchange is the only way to mint a
// session. Probe it on a throwaway response: a stale or foreign token has to
// fall through to the paste page instead of the gate's plain-text 401.
function gateOutcome(conn, req, token) {
  let status = 0
  const probe = {
    writeHead: (code) => { status = code },
    setHeader: () => {},
    getHeader: () => undefined,
    end: () => {},
  }
  const url = token === null ? '/' : `/?token=${encodeURIComponent(token)}`
  try {
    if (conn.authorizeIndex({ method: 'GET', url, headers: req.headers }, probe)) return 'session'
  } catch {
    return 'denied'
  }
  return status === 303 ? 'token' : 'denied'
}

function authEntryPage(expired) {
  return `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>DeepSeek Harness · 需要认证</title>
<style>
  :root { color-scheme: light dark }
  body { margin: 0; padding: 24px; font: 15px/1.6 system-ui, sans-serif; background: Canvas; color: CanvasText }
  main { max-width: 32rem; margin: 10vh auto 0 }
  h1 { font-size: 1.15rem; margin: 0 0 .75rem }
  p { margin: 0 0 1rem; opacity: .75 }
  textarea { width: 100%; box-sizing: border-box; min-height: 5.5rem; padding: .6rem; font: inherit; border: 1px solid; border-color: color-mix(in srgb, CanvasText 25%, Canvas); border-radius: .5rem; background: Canvas; color: CanvasText }
  button { margin-top: .75rem; width: 100%; padding: .7rem; font: inherit; font-weight: 600; border: 0; border-radius: .5rem; background: CanvasText; color: Canvas }
  #error { color: #d94a4a; min-height: 1.6em; margin: .5rem 0 0 }
</style>
</head>
<body>
<main>
  <h1>这个 PWA 还没有会话</h1>
  <p>${expired ? '这个地址里的 token 已经失效。' : ''}在运行 <code>dsh web</code> 的终端里复制它打印的带 <code>token</code> 的地址，粘贴到这里：</p>
  <textarea id="url" rows="3" autofocus autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="http://…/?token=…"></textarea>
  <button id="go">认证</button>
  <p id="error"></p>
</main>
<script>
const AUTH_PATH = ${JSON.stringify(AUTH_PATH)}
const input = document.getElementById('url')
const error = document.getElementById('error')
const tokenOf = (text) => {
  if (text === '') return null
  if (!/[/?:]/.test(text)) return text
  try { return new URL(text, location.origin).searchParams.get('token') } catch { return null }
}
const submit = () => {
  const token = tokenOf(input.value.trim())
  if (token === null) {
    error.textContent = '没认出 token，请粘贴完整地址'
    return
  }
  location.replace(AUTH_PATH + '?token=' + encodeURIComponent(token))
}
document.getElementById('go').addEventListener('click', submit)
input.addEventListener('keydown', (event) => { if (event.key === 'Enter') submit() })
</script>
</body>
</html>`
}

// An installed app has its own cookie jar (iOS never shares Safari's), and its
// manifest fetch may be unauthenticated, so `start_url` cannot be the only way
// in. This route is that start_url: a valid token or an existing cookie walks
// straight through, everything else gets a paste box for the URL `dsh web`
// prints — the token stays a secret only the operator has.
function serveAuthEntry(ctx) {
  return (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405)
      res.end()
      return
    }
    const url = new URL(req.url ?? AUTH_PATH, 'http://dsh.invalid')
    const token = url.searchParams.get('token')
    const conn = connectionOf(ctx)
    const outcome = conn === null ? 'denied' : gateOutcome(conn, req, token)
    if (outcome !== 'denied') {
      // Hand the token back to the root path: that is where the gate's own
      // relative `./` redirect resolves to the application root.
      res.writeHead(303, {
        'cache-control': 'no-store',
        'referrer-policy': 'no-referrer',
        location: outcome === 'session' ? '/' : `/?token=${encodeURIComponent(token)}`,
      })
      res.end()
      return
    }
    logPwa('auth-entry-denied', req, { hasToken: token !== null })
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    })
    res.end(req.method === 'HEAD' ? undefined : authEntryPage(token !== null))
  }
}

export const name = '@jiesou/dsh-webui-fix-pwa'
export const inject = ['settings', 'webServer']

// DSH only mints the session cookie via the one-time token URL (`GET /?token=…`),
// so the token gate stays. `start_url` therefore points at this plugin's own
// auth entry: it forwards a known token, and otherwise asks the operator for the
// URL `dsh web` printed. Unauthenticated LAN clients get neither the token nor a
// session. On 0.1.1-rc2 `connection` is absent, so the plain `start_url` is
// served and the PWA relies on the older auth flow.

export function apply(ctx) {
  const tokens = designTokens()
  const base = manifestBase()
  const icon = pwaIconSvg()
  ctx.effect(
    () => ctx.webServer.tapIndex((html) => injectThemeColorMetas(html, tokens.light, tokens.dark, currentPreference(ctx))),
    'dsh-webui-fix-pwa: theme-color meta injection',
  )
  ctx.effect(
    () => ctx.webServer.register({
      kind: 'exact',
      path: AUTH_PATH,
      handler: serveAuthEntry(ctx),
    }),
    'dsh-webui-fix-pwa: PWA auth entry route',
  )
  ctx.effect(
    () => ctx.webServer.register({
      kind: 'exact',
      path: '/manifest.webmanifest',
      handler: serveManifest(ctx, tokens, base, icon),
    }),
    'dsh-webui-fix-pwa: patched manifest route',
  )
  if (icon !== null) {
    ctx.effect(
      () => ctx.webServer.register({
        kind: 'exact',
        path: ICON_PATH,
        handler: serveIcon(icon),
      }),
      'dsh-webui-fix-pwa: PWA icon route',
    )
  }
}