import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import { fileURLToPath } from 'node:url'

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const routeTreeScript = fileURLToPath(
  new URL('./verify-route-tree.mjs', import.meta.url),
)
const webAppDir = fileURLToPath(new URL('../apps/web', import.meta.url))

function normalizeDatabaseUrlForDevcontainer(connectionString) {
  if (!connectionString || !fs.existsSync('/.dockerenv')) {
    return connectionString
  }

  try {
    const parsed = new URL(connectionString)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.hostname = 'host.docker.internal'
      console.warn(
        '[dev-stack] DATABASE_URL used localhost in devcontainer; using host.docker.internal',
      )
      return parsed.toString()
    }
  } catch {
    return connectionString
  }

  return connectionString
}

function run(command, args, options = {}) {
  return spawn(command, args, { stdio: 'inherit', ...options })
}

const criticalRuntimePatterns = [
  /Cannot read properties of undefined \(reading 'fetch'\)/,
  /@tanstack\/start-plugin-core\/dist\/esm\/dev-server-plugin\/plugin\.js/,
]

function matchesCriticalRuntimeError(message) {
  return criticalRuntimePatterns.some((pattern) => pattern.test(message))
}

function startMonitoredProcess(name, command, args, options = {}) {
  const proc = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    ...options,
  })

  let recentOutput = ''

  const onData = (chunk, writer) => {
    const text = chunk.toString()
    writer.write(text)
    recentOutput = `${recentOutput}${text}`.slice(-8000)
  }

  if (proc.stdout) {
    proc.stdout.on('data', (chunk) => onData(chunk, process.stdout))
  }

  if (proc.stderr) {
    proc.stderr.on('data', (chunk) => onData(chunk, process.stderr))
  }

  return {
    name,
    proc,
    criticalError: null,
    hasCriticalError() {
      return matchesCriticalRuntimeError(recentOutput)
    },
    recordCriticalError() {
      if (!this.criticalError && this.hasCriticalError()) {
        this.criticalError = formatRecentOutput(recentOutput)
      }
      return this.criticalError
    },
    getRecentOutput() {
      return recentOutput
    },
  }
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

async function assertPortAvailable(port, label) {
  const ipv4 = await canListen(port, '127.0.0.1')
  const ipv6 = await canListen(port, '::')

  if (ipv4 === false || ipv6 === false) {
    throw new Error(
      `${label} port ${port} is already in use. Stop the existing process or run with DYNAMIC_DEV_PORTS=1 to allow fallback ports.`,
    )
  }
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

function withHtmlHeaders(options = {}) {
  return {
    ...options,
    headers: {
      accept: 'text/html,application/xhtml+xml',
      ...(options.headers ?? {}),
    },
  }
}

async function assertLanding(url) {
  const response = await fetch(url, withHtmlHeaders())
  if (!response.ok) {
    throw new Error(`Landing page returned ${response.status}`)
  }
  const html = await response.text()
  if (html.includes('data-test="api-health"')) {
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
    if (cssMatch) {
      const cssUrl = cssMatch[1].startsWith('http')
        ? cssMatch[1]
        : new URL(cssMatch[1], url).toString()
      const cssResponse = await fetch(cssUrl)
      if (!cssResponse.ok) {
        throw new Error(`Stylesheet request failed with ${cssResponse.status}`)
      }
      return
    }

    const cssResponse = await fetch(new URL('/src/styles.css', url).toString())
    if (!cssResponse.ok) {
      throw new Error(
        `Dev stylesheet request failed with ${cssResponse.status}`,
      )
    }

    return
  }

  const cssResponse = await fetch(new URL('/src/styles.css', url).toString())
  if (!cssResponse.ok) {
    throw new Error(`Dev stylesheet request failed with ${cssResponse.status}`)
  }
}

function shutdown(processes) {
  for (const proc of processes) {
    if (!proc.killed) {
      proc.kill('SIGINT')
    }
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatRecentOutput(output) {
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.slice(-6).join(' | ')
}

console.log('[dev-stack] Starting API + web dev servers...')
const reserved = new Set()
const preferredApiPort = Number(process.env.API_PORT ?? 4000)
const preferredWebPort = Number(process.env.WEB_PORT ?? 4100)
const dynamicDevPorts = process.env.DYNAMIC_DEV_PORTS === '1'

let apiPort
let webPort

if (dynamicDevPorts) {
  apiPort = await findAvailablePort(preferredApiPort, reserved)
  reserved.add(apiPort)
  webPort = await findAvailablePort(preferredWebPort, reserved)
  reserved.add(webPort)
} else {
  if (preferredApiPort === preferredWebPort) {
    throw new Error('API_PORT and WEB_PORT must be different values')
  }
  await assertPortAvailable(preferredApiPort, 'API')
  await assertPortAvailable(preferredWebPort, 'Web')
  apiPort = preferredApiPort
  webPort = preferredWebPort
}

console.log(`[dev-stack] Ports: api=${apiPort}, web=${webPort}`)
const processes = []
const apiEndpoint = `http://localhost:${apiPort}/graphql`
let failed = false

function failAndExit(message) {
  if (failed) {
    return
  }
  failed = true
  console.error(`[dev-stack] Failed: ${message}`)
  shutdown(processes)
  process.exit(1)
}

console.log('[dev-stack] Verifying route tree imports...')
await runAndWait(process.execPath, [routeTreeScript], {
  shell: process.platform === 'win32',
  env: { ...process.env },
})

const effectiveDatabaseUrl = normalizeDatabaseUrlForDevcontainer(
  process.env.DATABASE_URL,
)

const apiProcess = startMonitoredProcess(
  'api',
  pnpmCmd,
  ['--filter', '@app/api', 'dev'],
  {
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      PORT: String(apiPort),
      ...(effectiveDatabaseUrl ? { DATABASE_URL: effectiveDatabaseUrl } : {}),
    },
  },
)
processes.push(apiProcess.proc)

const webProcess = startMonitoredProcess(
  'web',
  pnpmCmd,
  ['exec', 'vite', 'dev', '--host', '0.0.0.0', '--port', String(webPort)],
  {
    cwd: webAppDir,
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      PORT: String(webPort),
      GRAPHQL_ENDPOINT: apiEndpoint,
      VITE_GRAPHQL_ENDPOINT: apiEndpoint,
    },
  },
)
processes.push(webProcess.proc)

for (const monitored of [apiProcess, webProcess]) {
  monitored.proc.on('error', (error) => {
    failAndExit(`${monitored.name} process failed to start: ${error.message}`)
  })

  monitored.proc.on('close', (code, signal) => {
    if (failed) {
      return
    }
    if (code === 0 && !signal) {
      return
    }
    failAndExit(
      `${monitored.name} process exited unexpectedly (code=${code ?? 'null'}, signal=${signal ?? 'none'})`,
    )
  })
}

const criticalErrorWatcher = setInterval(() => {
  for (const monitored of [apiProcess, webProcess]) {
    const critical = monitored.recordCriticalError()
    if (critical) {
      failAndExit(
        `${monitored.name} runtime emitted a critical TanStack Start error: ${critical}`,
      )
      return
    }
  }
}, 500)

try {
  await waitFor(apiEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '{ health }' }),
  })
  await waitFor(`http://localhost:${webPort}/learn`, withHtmlHeaders())
  await assertLanding(`http://localhost:${webPort}/learn`)
  console.log(
    '[dev-stack] Checking for critical runtime SSR middleware errors...',
  )
  await wait(2500)

  if (apiProcess.hasCriticalError()) {
    throw new Error(
      `API runtime emitted a critical TanStack Start error: ${formatRecentOutput(apiProcess.getRecentOutput())}`,
    )
  }

  if (webProcess.hasCriticalError()) {
    throw new Error(
      `Web runtime emitted a critical TanStack Start error: ${formatRecentOutput(webProcess.getRecentOutput())}`,
    )
  }

  console.log('[dev-stack] Services are responding')
} catch (error) {
  failAndExit(error.message)
}

process.on('SIGINT', () => shutdown(processes))
process.on('SIGTERM', () => shutdown(processes))
process.on('exit', () => clearInterval(criticalErrorWatcher))
