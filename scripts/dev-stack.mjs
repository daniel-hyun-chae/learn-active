import { spawn } from 'node:child_process'
import net from 'node:net'
import { fileURLToPath } from 'node:url'

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const routeTreeScript = fileURLToPath(
  new URL('./verify-route-tree.mjs', import.meta.url),
)

function run(command, args, options = {}) {
  return spawn(command, args, { stdio: 'inherit', ...options })
}

function runAndWait(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = run(command, args, options)
    proc.on('error', (error) => reject(error))
    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))
    })
  })
}

async function canListen(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', (error) => {
      if (error?.code === 'EADDRNOTAVAIL' || error?.code === 'EAFNOSUPPORT') {
        resolve(null)
        return
      }
      resolve(false)
    })
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port, host)
  })
}

async function findAvailablePort(startPort, reserved = new Set()) {
  for (let port = startPort; port < startPort + 100; port += 1) {
    if (reserved.has(port)) {
      continue
    }

    const ipv4 = await canListen(port, '127.0.0.1')
    if (ipv4 === false) {
      continue
    }

    const ipv6 = await canListen(port, '::')
    if (ipv6 === false) {
      continue
    }

    if (ipv4 === true || ipv6 === true) {
      return port
    }
  }

  throw new Error(`No available port starting at ${startPort}`)
}

async function waitFor(url, options = {}, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, options)
      if (response.ok) {
        return true
      }
    } catch {
      // ignore and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

async function assertLanding(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Landing page returned ${response.status}`)
  }
  const html = await response.text()
  if (!html.includes('data-test="api-health"')) {
    throw new Error('Landing page missing api-health marker')
  }
  const statusMatch = html.match(
    /data-test=["']api-health["'][^>]*data-status=["']([^"']+)["']/i,
  )
  const status = statusMatch?.[1]
  if (!status) {
    throw new Error('Landing page missing api-health status')
  }
  if (status !== 'ok') {
    throw new Error(`Landing page reported API status ${status}`)
  }

  const cssMatch = html.match(
    /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/i,
  )
  if (!cssMatch) {
    throw new Error('Landing page missing stylesheet link')
  }
  const cssUrl = cssMatch[1].startsWith('http')
    ? cssMatch[1]
    : new URL(cssMatch[1], url).toString()
  const cssResponse = await fetch(cssUrl)
  if (!cssResponse.ok) {
    throw new Error(`Stylesheet request failed with ${cssResponse.status}`)
  }
}

function shutdown(processes) {
  for (const proc of processes) {
    if (!proc.killed) {
      proc.kill('SIGINT')
    }
  }
}

console.log('[dev-stack] Starting API + web dev servers...')
const reserved = new Set()
const apiPort = await findAvailablePort(
  Number(process.env.API_PORT ?? 4000),
  reserved,
)
reserved.add(apiPort)
const webPort = await findAvailablePort(
  Number(process.env.WEB_PORT ?? 4100),
  reserved,
)
reserved.add(webPort)

console.log(`[dev-stack] Ports: api=${apiPort}, web=${webPort}`)
const processes = []
const apiEndpoint = `http://localhost:${apiPort}/graphql`

console.log('[dev-stack] Verifying route tree imports...')
await runAndWait(process.execPath, [routeTreeScript], {
  shell: process.platform === 'win32',
  env: { ...process.env },
})

if (process.env.DATABASE_URL) {
  try {
    console.log('[dev-stack] Applying database migrations...')
    await runAndWait(pnpmCmd, ['--filter', '@app/api', 'db:migrate'], {
      shell: process.platform === 'win32',
      env: { ...process.env },
    })
    console.log('[dev-stack] Database migrations complete')
  } catch (error) {
    console.error('[dev-stack] Migration failed:', error.message)
    process.exit(1)
  }
} else {
  console.log('[dev-stack] DATABASE_URL not set; skipping migrations')
}

processes.push(
  run(pnpmCmd, ['--filter', '@app/api', 'dev'], {
    shell: process.platform === 'win32',
    env: { ...process.env, PORT: String(apiPort) },
  }),
)

processes.push(
  run(
    pnpmCmd,
    [
      '--filter',
      '@app/web',
      'dev',
      '--',
      '--host',
      '0.0.0.0',
      '--port',
      String(webPort),
    ],
    {
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        PORT: String(webPort),
        GRAPHQL_ENDPOINT: apiEndpoint,
        VITE_GRAPHQL_ENDPOINT: apiEndpoint,
      },
    },
  ),
)

try {
  await waitFor(apiEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '{ health }' }),
  })
  await waitFor(`http://localhost:${webPort}/learn`)
  await assertLanding(`http://localhost:${webPort}/learn`)
  await waitFor(`http://localhost:${webPort}/publish`)
  console.log('[dev-stack] Services are responding')
} catch (error) {
  console.error('[dev-stack] Failed:', error.message)
  shutdown(processes)
  process.exit(1)
}

process.on('SIGINT', () => shutdown(processes))
process.on('SIGTERM', () => shutdown(processes))
