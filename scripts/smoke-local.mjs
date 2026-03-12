import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import net from 'node:net'
import { runBrowserChecks } from './browser-check.mjs'

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const ensureScript = path.join(process.cwd(), 'scripts', 'ensure-pnpm.mjs')
const routeTreeScript = path.join(
  process.cwd(),
  'scripts',
  'verify-route-tree.mjs',
)
const preflight = spawnSync(process.execPath, [ensureScript], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (preflight.error) {
  console.error('[smoke] pnpm preflight failed to start', preflight.error)
  process.exit(1)
}

if (preflight.status !== 0) {
  console.error(`[smoke] pnpm preflight failed with ${preflight.status}`)
  process.exit(preflight.status ?? 1)
}

const routeCheck = spawnSync(process.execPath, [routeTreeScript], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (routeCheck.error) {
  console.error('[smoke] route tree check failed to start', routeCheck.error)
  process.exit(1)
}

if (routeCheck.status !== 0) {
  console.error(`[smoke] route tree check failed with ${routeCheck.status}`)
  process.exit(routeCheck.status ?? 1)
}

function run(command, args, options = {}) {
  return spawn(command, args, { stdio: 'inherit', ...options })
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
      `${label} port ${port} is already in use. Stop the existing process or run with DYNAMIC_SMOKE_PORTS=1 to allow fallback ports.`,
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

async function assertLanding(url) {
  const response = await fetch(url)
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

  const preloadMatch = html.match(
    /<link[^>]+rel=["']modulepreload["'][^>]*href=["']([^"']+\.js[^"']*)["'][^>]*>/i,
  )
  if (!preloadMatch) {
    throw new Error('Landing page missing stylesheet or modulepreload asset')
  }

  const preloadUrl = preloadMatch[1].startsWith('http')
    ? preloadMatch[1]
    : new URL(preloadMatch[1], url).toString()
  const preloadResponse = await fetch(preloadUrl)
  if (!preloadResponse.ok) {
    throw new Error(
      `Modulepreload request failed with ${preloadResponse.status}`,
    )
  }
}

async function waitForLanding(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      await assertLanding(url)
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  throw new Error('Landing page did not become ready')
}

async function fetchLessonPath(apiPort) {
  const endpoint = `http://localhost:${apiPort}/graphql`

  async function queryCourses() {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `query SmokeCourse {
          courses {
            id
            modules { lessons { id } }
          }
        }`,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch courses for lesson path')
    }

    return response.json()
  }

  async function seedSampleCourse() {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation SmokeSeed { seedSampleCourse { id } }',
      }),
    })
  }

  let payload = await queryCourses()
  let course = payload?.data?.courses?.[0]
  let lesson = course?.modules?.[0]?.lessons?.[0]

  if (!course?.id || !lesson?.id) {
    await seedSampleCourse()
    payload = await queryCourses()
    course = payload?.data?.courses?.[0]
    lesson = course?.modules?.[0]?.lessons?.[0]
  }

  if (!course?.id || !lesson?.id) {
    throw new Error('No course/lesson available for smoke check')
  }

  return `/courses/${course.id}/lessons/${lesson.id}`
}

async function assertMobileApiHealth(apiPort) {
  const endpoint =
    process.env.EXPO_PUBLIC_GRAPHQL_ENDPOINT ??
    `http://localhost:${apiPort}/graphql`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '{ health }' }),
  })

  if (!response.ok) {
    throw new Error(
      `Mobile GraphQL endpoint ${endpoint} returned ${response.status}`,
    )
  }

  const payload = await response.json()
  if (payload?.data?.health !== 'ok') {
    throw new Error('Mobile GraphQL health check did not return ok')
  }
}

async function assertLesson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Lesson page returned ${response.status}`)
  }
  const html = await response.text()
  if (!html.includes('<div id="app"></div>')) {
    throw new Error('Lesson route missing app root container')
  }
}

function shutdown(processes) {
  for (const proc of processes) {
    if (!proc.killed) {
      proc.kill('SIGINT')
    }
  }
}

console.log('[smoke] Building apps...')
const reserved = new Set()
const preferredApiPort = Number(process.env.API_PORT ?? 4000)
const preferredWebPort = Number(process.env.WEB_PORT ?? 4100)
const dynamicSmokePorts =
  process.env.DYNAMIC_SMOKE_PORTS === '1' ||
  process.env.DYNAMIC_DEV_PORTS === '1'

let apiPort
let webPort

if (dynamicSmokePorts) {
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

const build = run(pnpmCmd, ['build'], {
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    VITE_GRAPHQL_ENDPOINT: `http://localhost:${apiPort}/graphql`,
  },
})

build.on('exit', async (code) => {
  if (code !== 0) {
    process.exit(code ?? 1)
  }

  console.log('[smoke] Starting API and web servers...')
  console.log(`[smoke] Ports: api=${apiPort}, web=${webPort}`)

  const processes = []

  const api = run(
    pnpmCmd,
    [
      '--filter',
      '@app/api',
      'exec',
      'wrangler',
      'dev',
      '--config',
      'wrangler.jsonc',
      '--port',
      String(apiPort),
      '--var',
      `SUPABASE_URL:${process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'}`,
    ],
    {
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        PORT: String(apiPort),
        APP_ENV: process.env.APP_ENV ?? 'local',
      },
    },
  )
  processes.push(api)

  const web = run(
    pnpmCmd,
    [
      '--filter',
      '@app/web',
      'exec',
      'vite',
      'preview',
      '--port',
      String(webPort),
      '--host',
      '0.0.0.0',
    ],
    {
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        PORT: String(webPort),
        GRAPHQL_ENDPOINT: `http://localhost:${apiPort}/graphql`,
        VITE_GRAPHQL_ENDPOINT: `http://localhost:${apiPort}/graphql`,
        EXPO_PUBLIC_GRAPHQL_ENDPOINT: `http://localhost:${apiPort}/graphql`,
      },
    },
  )
  processes.push(web)

  try {
    await waitFor(`http://localhost:${apiPort}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ health }' }),
    })
    await waitFor(`http://localhost:${webPort}/learn`)
    await waitForLanding(`http://localhost:${webPort}/learn`)
    await assertMobileApiHealth(apiPort)
    await runBrowserChecks({ baseUrl: `http://localhost:${webPort}` })
    const lessonPath = await fetchLessonPath(apiPort)
    await assertLesson(`http://localhost:${webPort}${lessonPath}`)
    await waitFor(`http://localhost:${webPort}/publish`)
    console.log('[smoke] All services responded successfully')
  } catch (error) {
    console.error('[smoke] Failed:', error.message)
    shutdown(processes)
    process.exit(1)
  }

  shutdown(processes)
  process.exit(0)
})
