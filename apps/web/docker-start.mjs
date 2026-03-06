import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const port = Number(process.env.PORT ?? 4100)
const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT
const theme = process.env.APP_THEME

if (graphqlEndpoint) {
  globalThis.__GRAPHQL_ENDPOINT__ = graphqlEndpoint
}

if (theme) {
  globalThis.__APP_THEME__ = theme
}
const distServerEntry = path.join(__dirname, 'dist', 'server', 'server.js')
const nitroEntry = path.join(__dirname, '.output', 'server', 'index.mjs')

const entry = fs.existsSync(distServerEntry)
  ? distServerEntry
  : fs.existsSync(nitroEntry)
    ? nitroEntry
    : null

if (!entry) {
  console.error('[web] Server build output not found')
  process.exit(1)
}

const moduleUrl = pathToFileURL(entry).href
const mod = await import(moduleUrl)
const fetchHandler =
  typeof mod.default === 'function'
    ? mod.default
    : typeof mod.default?.fetch === 'function'
      ? mod.default.fetch.bind(mod.default)
      : null

if (!fetchHandler) {
  console.error('[web] Could not resolve server fetch handler')
  process.exit(1)
}

const contentTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

const clientDir = path.join(__dirname, 'dist', 'client')

async function resolveApiHealth() {
  if (!graphqlEndpoint) {
    return 'unreachable'
  }

  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ health }' }),
    })

    if (!response.ok) {
      return 'unreachable'
    }

    const payload = await response.json()
    return payload?.data?.health ?? 'unknown'
  } catch {
    return 'unreachable'
  }
}

globalThis.__API_HEALTH__ = await resolveApiHealth()

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(
      req.url ?? '/',
      `http://${req.headers.host ?? 'localhost'}`,
    )
    if (fs.existsSync(clientDir)) {
      const pathname = decodeURIComponent(url.pathname)
      const relativePath = pathname.startsWith('/')
        ? pathname.slice(1)
        : pathname
      const filePath = path.normalize(path.join(clientDir, relativePath))
      if (
        filePath.startsWith(clientDir) &&
        fs.existsSync(filePath) &&
        fs.statSync(filePath).isFile()
      ) {
        const ext = path.extname(filePath)
        res.statusCode = 200
        res.setHeader(
          'Content-Type',
          contentTypes[ext] ?? 'application/octet-stream',
        )
        fs.createReadStream(filePath).pipe(res)
        return
      }
    }

    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        headers.set(key, value.join(','))
      } else if (value) {
        headers.set(key, value)
      }
    }

    const body = await new Promise((resolve) => {
      const chunks = []
      req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      req.on('end', () => resolve(Buffer.concat(chunks)))
    })

    const init = {
      method: req.method,
      headers,
    }

    if (req.method !== 'GET' && req.method !== 'HEAD' && body.length) {
      init.body = body
    }

    const response = await fetchHandler(new Request(url, init))
    res.statusCode = response.status
    response.headers.forEach((value, key) => res.setHeader(key, value))
    const buffer = Buffer.from(await response.arrayBuffer())
    res.end(buffer)
  } catch (error) {
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

server.listen(port, () => {
  console.log(`[web] server running on http://localhost:${port}`)
})
