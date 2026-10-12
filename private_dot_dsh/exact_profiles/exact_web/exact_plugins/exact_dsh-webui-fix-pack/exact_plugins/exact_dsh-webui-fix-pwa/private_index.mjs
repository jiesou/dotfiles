// Node half: iOS standalone head tags, patch manifest to standalone, serve PWA icon.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const tokens = {
  light: 'rgb(255, 255, 255)',
  dark: 'rgb(21, 21, 23)',
}
const ICON_PATH = '/dsh-webui-fix-pwa/icon.svg'
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

function injectStandaloneHead(html) {
  // First-paint canvas colour and color-scheme belong to the upstream theme
  // plugin's boot rows; the iOS-only tags are ours alone.
  const apple = '<meta name="mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />'
  let out = html.includes('</head>')
    ? html.replace('</head>', `${apple}</head>`)
    : `${html}${apple}`
  // iOS notch: without viewport-fit=cover the status-bar area stays white.
  if (!/viewport-fit\s*=\s*cover/.test(out)) {
    out = out.replace(
      /<meta\s+name="viewport"\s+content="([^"]*)"\s*\/?>/,
      (_, content) => `<meta name="viewport" content="${content}, viewport-fit=cover" />`,
    )
  }
  // Chromium fetches the manifest with credentials omitted unless the link is
  // credentialed, which would drop the scheme cookie the manifest colour needs.
  return out.replace(
    /<link\b[^>]*\brel="manifest"[^>]*>/,
    (tag) => (/\bcrossorigin\b/.test(tag) ? tag : tag.replace(/\s*\/?>$/, (end) => ` crossorigin="use-credentials"${end}`)),
  )
}

function serveManifest(tokens, base, icon) {
  return (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405)
      res.end()
      return
    }
    const icons = icon === null
      ? base.icons
      : [{ src: ICON_PATH, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
    // A manifest carries one colour, so it cannot follow the scheme itself. The
    // browser half reports the scheme it resolved in this cookie — no host
    // negotiates Sec-CH-Prefers-Color-Scheme, so it is the only channel.
    const header = req.headers?.cookie
    const match = typeof header === 'string'
      ? header.match(/(?:^|;\s*)dsh-color-scheme=(light|dark)(?:;|$)/)
      : null
    const color = match?.[1] === 'dark' ? tokens.dark : tokens.light
    const body = JSON.stringify({
      ...base,
      display: 'standalone',
      theme_color: color,
      background_color: color,
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

const AUTH_COOKIE = /^dsh-auth-/
const STRICT = /;\s*SameSite=Strict\b/i

function relaxAuthCookie(headers) {
  if (headers === null || typeof headers !== 'object') return
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() !== 'set-cookie') continue
    const relax = (one) => (AUTH_COOKIE.test(one) ? one.replace(STRICT, '; SameSite=Lax') : one)
    headers[name] = Array.isArray(value) ? value.map(relax) : relax(String(value))
  }
}

// A launcher cold start is a top-level navigation Chromium deliberately gives an
// opaque initiator, so a SameSite=Strict session cookie is withheld (crbug
// 40061152 keeps it that way on purpose). Lax still rides top-level GET, which is
// the start_url request, and /api keeps its Host/Origin/Sec-Fetch-Site fence.
// Scoped to the one response this call owns — no prototype, no disk.
function withLaxSessionCookie(res, run) {
  const writeHead = res.writeHead
  res.writeHead = function (...args) {
    const at = args.findIndex((arg) => arg !== null && typeof arg === 'object' && !Array.isArray(arg))
    if (at !== -1) relaxAuthCookie(args[at])
    return writeHead.apply(this, args)
  }
  try {
    return run()
  } finally {
    res.writeHead = writeHead
  }
}

function relaxBrowserSession(ctx) {
  const auth = ctx.connection.browserAuth
  const original = auth.authorizeIndex
  auth.authorizeIndex = function authorizeIndex(req, res) {
    return withLaxSessionCookie(res, () => original.call(this, req, res))
  }
  return () => {
    delete auth.authorizeIndex
  }
}

export const name = '@jiesou/dsh-webui-fix-pwa'
export const inject = ['webServer', 'connection']

export function apply(ctx) {
  const base = manifestBase()
  const icon = pwaIconSvg()
  ctx.effect(
    () => relaxBrowserSession(ctx),
    'dsh-webui-fix-pwa: Lax browser-session cookie',
  )
  ctx.effect(
    () => ctx.webServer.tapIndex(injectStandaloneHead),
    'dsh-webui-fix-pwa: iOS standalone head injection',
  )
  ctx.effect(
    () => ctx.webServer.register({
      kind: 'exact',
      path: '/manifest.webmanifest',
      handler: serveManifest(tokens, base, icon),
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