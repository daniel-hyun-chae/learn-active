import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import { fileURLToPath } from 'node:url'
import {
  extractStripeWebhookSecret,
  loadLocalRuntimeEnv,
  parseEnvAssignments,
  shouldAutoStartStripeListener,
} from './lib/local-runtime-env.mjs'

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const routeTreeScript = fileURLToPath(
  new URL('./verify-route-tree.mjs', import.meta.url),
)
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const apiAppDir = fileURLToPath(new URL('../apps/api', import.meta.url))
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

function pickConfiguredValue(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') {
      continue
    }
    const value = candidate.trim()
    if (value) {
      return value
    }
  }
  return ''
}

function resolveSupabaseWebRuntime() {
  const runtimeEnv = loadLocalRuntimeEnv(repoRoot, process.env)
  const configuredUrl = pickConfiguredValue(
    runtimeEnv.VITE_SUPABASE_URL,
    runtimeEnv.SUPABASE_URL,
  )
  const configuredPublishableKey = pickConfiguredValue(
    runtimeEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
  )

  if (configuredUrl && configuredPublishableKey) {
    return {
      source: 'environment',
      url: configuredUrl,
      publishableKey: configuredPublishableKey,
    }
  }

  const status = spawnSync(
    'npx',
    ['-y', 'supabase@latest', 'status', '-o', 'env'],
    {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 1024 * 1024,
      shell: process.platform === 'win32',
      env: { ...runtimeEnv },
    },
  )

  if (status.status !== 0) {
    const details = `${status.stdout ?? ''}${status.stderr ?? ''}`.trim()
    const reason = details ? ` (${details})` : ''
    console.warn(
      `[dev-stack] Could not resolve local Supabase runtime settings from supabase status${reason}`,
    )
    return null
  }

  const parsed = parseEnvAssignments(
    `${status.stdout ?? ''}\n${status.stderr ?? ''}`,
  )
  const derivedUrl = pickConfiguredValue(configuredUrl, parsed.API_URL)
  const derivedPublishableKey = pickConfiguredValue(
    configuredPublishableKey,
    parsed.ANON_KEY,
  )

  if (!derivedUrl || !derivedPublishableKey) {
    console.warn(
      '[dev-stack] Local Supabase runtime settings are incomplete; auth UI may remain unconfigured',
    )
    return null
  }

  return {
    source: 'supabase status',
    url: derivedUrl,
    publishableKey: derivedPublishableKey,
  }
}

function resolveSupabaseServiceRoleKey(runtimeEnv) {
  const configured = pickConfiguredValue(runtimeEnv.SUPABASE_SERVICE_ROLE_KEY)
  if (configured) {
    return configured
  }

  const status = spawnSync(
    'npx',
    ['-y', 'supabase@latest', 'status', '-o', 'env'],
    {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 1024 * 1024,
      shell: process.platform === 'win32',
      env: { ...runtimeEnv },
    },
  )

  if (status.status !== 0) {
    const details = `${status.stdout ?? ''}${status.stderr ?? ''}`.trim()
    const reason = details ? ` (${details})` : ''
    throw new Error(
      `[dev-stack] Could not resolve SUPABASE_SERVICE_ROLE_KEY from environment or local supabase status${reason}`,
    )
  }

  const parsed = parseEnvAssignments(
    `${status.stdout ?? ''}\n${status.stderr ?? ''}`,
  )
  const key = pickConfiguredValue(parsed.SERVICE_ROLE_KEY)
  if (!key) {
    throw new Error(
      '[dev-stack] Local supabase status output did not include SERVICE_ROLE_KEY',
    )
  }
  return key
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
  if (!html.includes('<div id="app"></div>')) {
    throw new Error('Landing page missing app root container')
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

async function waitForStripeWebhookSecret(monitored, timeoutMs = 15000) {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const webhookSecret = extractStripeWebhookSecret(
      monitored.getRecentOutput(),
    )
    if (webhookSecret) {
      return webhookSecret
    }

    if (monitored.proc.exitCode !== null) {
      break
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  const details = monitored.getRecentOutput().trim()
  const reason = details ? ` Output: ${details}` : ''
  throw new Error(
    `Stripe CLI did not provide a webhook secret in time.${reason}`,
  )
}

console.log('[dev-stack] Starting API + web dev servers...')
const runtimeEnv = loadLocalRuntimeEnv(repoRoot, process.env)
const reserved = new Set()
const preferredApiPort = Number(runtimeEnv.API_PORT ?? 4000)
const preferredWebPort = Number(runtimeEnv.WEB_PORT ?? 4100)
const dynamicDevPorts = runtimeEnv.DYNAMIC_DEV_PORTS === '1'

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
  runtimeEnv.DATABASE_URL,
)
const supabaseWebRuntime = resolveSupabaseWebRuntime()
const apiSupabaseUrl = pickConfiguredValue(
  runtimeEnv.SUPABASE_URL,
  supabaseWebRuntime?.url,
)
const apiSupabaseServiceRoleKey = resolveSupabaseServiceRoleKey(runtimeEnv)

if (supabaseWebRuntime) {
  console.log(
    `[dev-stack] Supabase auth runtime source: ${supabaseWebRuntime.source}`,
  )
}

if (shouldAutoStartStripeListener(runtimeEnv)) {
  const stripeForwardUrl = `http://127.0.0.1:${apiPort}/api/webhooks/stripe`
  console.log(
    `[dev-stack] Starting Stripe CLI webhook forwarder for ${stripeForwardUrl}`,
  )

  const stripeProcess = startMonitoredProcess(
    'stripe',
    'stripe',
    [
      '--api-key',
      runtimeEnv.STRIPE_SECRET_KEY,
      'listen',
      '--forward-to',
      stripeForwardUrl,
    ],
    {
      shell: process.platform === 'win32',
      env: {
        ...runtimeEnv,
        STRIPE_API_KEY: runtimeEnv.STRIPE_SECRET_KEY,
      },
    },
  )
  processes.push(stripeProcess.proc)

  runtimeEnv.STRIPE_WEBHOOK_SECRET =
    await waitForStripeWebhookSecret(stripeProcess)
  console.log(
    '[dev-stack] Stripe webhook secret auto-configured from Stripe CLI',
  )
}

const apiProcess = startMonitoredProcess(
  'api',
  pnpmCmd,
  [
    '--filter',
    '@app/api',
    'exec',
    'wrangler',
    'dev',
    '--config',
    'wrangler.jsonc',
    '--ip',
    '0.0.0.0',
    '--port',
    String(apiPort),
    ...(apiSupabaseUrl ? ['--var', `SUPABASE_URL:${apiSupabaseUrl}`] : []),
    ...(apiSupabaseServiceRoleKey
      ? ['--var', `SUPABASE_SERVICE_ROLE_KEY:${apiSupabaseServiceRoleKey}`]
      : []),
    ...(runtimeEnv.STRIPE_SECRET_KEY
      ? ['--var', `STRIPE_SECRET_KEY:${runtimeEnv.STRIPE_SECRET_KEY}`]
      : []),
    ...(runtimeEnv.STRIPE_PUBLISHABLE_KEY
      ? ['--var', `STRIPE_PUBLISHABLE_KEY:${runtimeEnv.STRIPE_PUBLISHABLE_KEY}`]
      : []),
    ...(runtimeEnv.STRIPE_WEBHOOK_SECRET
      ? ['--var', `STRIPE_WEBHOOK_SECRET:${runtimeEnv.STRIPE_WEBHOOK_SECRET}`]
      : []),
  ],
  {
    cwd: apiAppDir,
    shell: process.platform === 'win32',
    env: {
      ...runtimeEnv,
      PORT: String(apiPort),
      APP_ENV: runtimeEnv.APP_ENV ?? 'local',
      ...(effectiveDatabaseUrl ? { DATABASE_URL: effectiveDatabaseUrl } : {}),
      ...(apiSupabaseServiceRoleKey
        ? { SUPABASE_SERVICE_ROLE_KEY: apiSupabaseServiceRoleKey }
        : {}),
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
      ...runtimeEnv,
      PORT: String(webPort),
      GRAPHQL_ENDPOINT: apiEndpoint,
      VITE_GRAPHQL_ENDPOINT: apiEndpoint,
      ...(supabaseWebRuntime
        ? {
            SUPABASE_URL: runtimeEnv.SUPABASE_URL ?? supabaseWebRuntime.url,
            VITE_SUPABASE_URL:
              runtimeEnv.VITE_SUPABASE_URL ?? supabaseWebRuntime.url,
            VITE_SUPABASE_FORWARD_PORT:
              runtimeEnv.VITE_SUPABASE_FORWARD_PORT ?? '15421',
            VITE_GRAPHQL_FORWARD_PORT:
              runtimeEnv.VITE_GRAPHQL_FORWARD_PORT ?? String(apiPort),
            VITE_SUPABASE_PUBLISHABLE_KEY:
              runtimeEnv.VITE_SUPABASE_PUBLISHABLE_KEY ??
              supabaseWebRuntime.publishableKey,
          }
        : {}),
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

try {
  await waitFor(apiEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '{ health }' }),
  })
  await waitFor(`http://localhost:${webPort}/learn`, withHtmlHeaders())
  await assertLanding(`http://localhost:${webPort}/learn`)

  console.log('[dev-stack] Services are responding')
} catch (error) {
  failAndExit(error.message)
}

process.on('SIGINT', () => shutdown(processes))
process.on('SIGTERM', () => shutdown(processes))
