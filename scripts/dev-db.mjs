import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const command = process.argv[2]
const force = process.argv.includes('--yes')
const includeEdgeRuntime =
  process.argv.includes('--with-edge-runtime') ||
  process.env.SUPABASE_INCLUDE_EDGE_RUNTIME === 'true'
const defaultDatabaseUrl =
  'postgresql://postgres:postgres@localhost:54322/postgres'

function run(commandName, args, options = {}) {
  const result = spawnSync(commandName, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: process.env.CI ?? 'true',
      npm_config_yes: process.env.npm_config_yes ?? 'true',
    },
    ...options,
  })

  if (result.error) {
    throw result.error
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status)
  }
}

function ensureSupabaseProject() {
  if (!fs.existsSync('supabase/config.toml')) {
    console.error(
      '[db] Missing supabase/config.toml. Run `supabase init` first.',
    )
    process.exit(1)
  }
}

function normalizeDatabaseUrlForDevcontainer(connectionString) {
  if (!fs.existsSync('/.dockerenv')) {
    return connectionString
  }

  try {
    const parsed = new URL(connectionString)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.hostname = 'host.docker.internal'
      return parsed.toString()
    }
  } catch {
    return connectionString
  }

  return connectionString
}

function runSupabase(args) {
  run('npx', ['-y', 'supabase@latest', ...args])
}

function showHelp() {
  console.log('Usage: node scripts/dev-db.mjs <command> [--yes]')
  console.log('')
  console.log('Commands:')
  console.log('  up       Start Supabase local stack')
  console.log('  status   Show Supabase local status')
  console.log('  logs     Show status and log guidance')
  console.log('  push     Apply migrations to local Supabase database')
  console.log('  reset    Reset local Supabase database (requires --yes)')
  console.log('')
  console.log('Flags:')
  console.log(
    '  --with-edge-runtime  Include edge runtime when starting local stack',
  )
}

ensureSupabaseProject()

const rawDatabaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl
const databaseUrl = normalizeDatabaseUrlForDevcontainer(rawDatabaseUrl)

switch (command) {
  case 'up': {
    console.log('[db] Starting Supabase local stack...')
    const startArgs = ['start']
    if (!includeEdgeRuntime) {
      startArgs.push('--exclude', 'edge-runtime')
      console.log(
        '[db] Edge runtime excluded by default for offline/TLS-restricted environments.',
      )
      console.log(
        '[db] Pass --with-edge-runtime or set SUPABASE_INCLUDE_EDGE_RUNTIME=true to include it.',
      )
    }
    runSupabase(startArgs)
    console.log('[db] Supabase local stack is up.')
    break
  }
  case 'status': {
    runSupabase(['status'])
    console.log(`[db] Effective DATABASE_URL: ${databaseUrl}`)
    break
  }
  case 'logs': {
    console.log('[db] Supabase CLI does not provide a generic `logs` command.')
    console.log('[db] Showing current local stack status instead:')
    runSupabase(['status'])
    break
  }
  case 'push': {
    console.log('[db] Applying local Supabase migrations...')
    runSupabase(['db', 'push', '--local'])
    console.log('[db] Local migration push complete.')
    break
  }
  case 'reset': {
    if (!force) {
      console.error('[db] Refusing to reset without --yes')
      console.error('[db] Run: pnpm db:reset -- --yes')
      process.exit(1)
    }
    console.log('[db] Resetting local Supabase database...')
    runSupabase(['db', 'reset', '--local', '--yes'])
    console.log('[db] Local Supabase database reset complete.')
    break
  }
  default: {
    showHelp()
    process.exit(command ? 1 : 0)
  }
}
