import fs from 'node:fs'
import net from 'node:net'
import { spawn } from 'node:child_process'

const defaultDatabaseUrl =
  'postgresql://postgres:postgres@localhost:54322/postgres'

function parseDatabaseTarget(connectionString) {
  try {
    const parsed = new URL(connectionString)
    const host = parsed.hostname
    const port = Number(parsed.port || 5432)
    if (!host || Number.isNaN(port)) {
      return null
    }
    return { host, port }
  } catch {
    return null
  }
}

function normalizeDatabaseUrlForDevcontainer(connectionString) {
  if (!fs.existsSync('/.dockerenv')) {
    return [connectionString]
  }

  try {
    const parsed = new URL(connectionString)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      console.warn(
        '[setup:local] DATABASE_URL used localhost in devcontainer; switching host to host.docker.internal as fallback if needed',
      )
      const hostGatewayUrl = new URL(connectionString)
      hostGatewayUrl.hostname = 'host.docker.internal'
      return [connectionString, hostGatewayUrl.toString()]
    }

    if (parsed.hostname === 'host.docker.internal') {
      console.warn(
        '[setup:local] DATABASE_URL uses host.docker.internal in devcontainer; falling back to localhost if needed',
      )
      const localhostUrl = new URL(connectionString)
      localhostUrl.hostname = 'localhost'
      return [connectionString, localhostUrl.toString()]
    }

    return [connectionString]
  } catch {
    return [connectionString]
  }
}

async function waitForPort(host, port, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const socket = new net.Socket()
      let settled = false

      const finish = (value) => {
        if (settled) {
          return
        }
        settled = true
        socket.destroy()
        resolve(value)
      }

      socket.setTimeout(1500)
      socket.once('connect', () => finish(true))
      socket.once('timeout', () => finish(false))
      socket.once('error', () => finish(false))
      socket.connect(port, host)
    })

    if (ok) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(
    `Database not reachable at ${host}:${port} after ${Math.floor(timeoutMs / 1000)}s`,
  )
}

async function runAndWait(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit', ...options })
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

const rawDatabaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl
const candidateDatabaseUrls =
  normalizeDatabaseUrlForDevcontainer(rawDatabaseUrl)

if (!fs.existsSync('supabase/config.toml')) {
  console.error(
    '[setup:local] Missing supabase/config.toml. Run `pnpm db:up` first.',
  )
  process.exit(1)
}

if (candidateDatabaseUrls.length === 0) {
  console.error('[setup:local] DATABASE_URL is invalid')
  process.exit(1)
}

console.log('[setup:local] Waiting for database readiness...')
let databaseUrl = null
let target = null
let lastError = null

for (const candidateUrl of candidateDatabaseUrls) {
  const candidateTarget = parseDatabaseTarget(candidateUrl)
  if (!candidateTarget) {
    continue
  }

  try {
    await waitForPort(candidateTarget.host, candidateTarget.port)
    databaseUrl = candidateUrl
    target = candidateTarget
    break
  } catch (error) {
    lastError = error
  }
}

if (!databaseUrl || !target) {
  throw lastError ?? new Error('[setup:local] Database not reachable')
}

console.log(
  `[setup:local] Database is reachable at ${target.host}:${target.port}`,
)

console.log('[setup:local] Applying Supabase migrations (fail hard)...')
await runAndWait(process.execPath, ['scripts/dev-db.mjs', 'push'], {
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
})

console.log('[setup:local] Local setup complete')
