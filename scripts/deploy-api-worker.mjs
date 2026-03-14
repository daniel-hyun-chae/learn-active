import { spawnSync } from 'node:child_process'

function parseArgs(argv) {
  const args = {
    env: null,
    name: null,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--env') {
      args.env = argv[index + 1] ?? null
      index += 1
      continue
    }

    if (value.startsWith('--env=')) {
      args.env = value.slice('--env='.length)
      continue
    }

    if (value === '--name') {
      args.name = argv[index + 1] ?? null
      index += 1
      continue
    }

    if (value.startsWith('--name=')) {
      args.name = value.slice('--name='.length)
    }
  }

  return args
}

function fail(message) {
  console.error(`[deploy-api-worker] ${message}`)
  process.exit(1)
}

function requiredEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    fail(`Missing required environment variable ${name}.`)
  }
  return value
}

const { env, name } = parseArgs(process.argv.slice(2))

if (!env || !name || (env !== 'staging' && env !== 'production')) {
  fail(
    'Usage: node scripts/deploy-api-worker.mjs --env <staging|production> --name <worker-name>',
  )
}

const appEnv = env === 'production' ? 'production' : 'staging'
const supabaseUrl = requiredEnv('SUPABASE_URL')
const stripePublishableKey = requiredEnv('STRIPE_PUBLISHABLE_KEY')

const result = spawnSync(
  'pnpm',
  [
    '--filter',
    '@app/api',
    'exec',
    'wrangler',
    'deploy',
    '--config',
    'wrangler.jsonc',
    '--name',
    name,
    '--var',
    `APP_ENV:${appEnv}`,
    '--var',
    `SUPABASE_URL:${supabaseUrl}`,
    '--var',
    `STRIPE_PUBLISHABLE_KEY:${stripePublishableKey}`,
    '--keep-vars',
  ],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  },
)

if (typeof result.status === 'number' && result.status !== 0) {
  process.exit(result.status)
}

if (result.error) {
  throw result.error
}
