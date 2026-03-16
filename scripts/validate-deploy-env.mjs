import { URL } from 'node:url'

const localhostHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

function parseArgs(argv) {
  const args = {
    target: null,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--target') {
      args.target = argv[index + 1] ?? null
      index += 1
      continue
    }

    if (value.startsWith('--target=')) {
      args.target = value.slice('--target='.length)
    }
  }

  return args
}

function getSuffix(target) {
  if (target === 'staging') {
    return 'STAGING'
  }

  if (target === 'production') {
    return 'PROD'
  }

  return null
}

function fail(message) {
  console.error(`[validate:deploy-env] ${message}`)
  process.exit(1)
}

function assertHostedHttpsUrl(name, rawValue) {
  let parsed
  try {
    parsed = new URL(rawValue)
  } catch {
    fail(`${name} must be a valid absolute URL. Received: ${rawValue}`)
  }

  if (parsed.protocol !== 'https:') {
    fail(`${name} must use https in hosted environments. Received: ${rawValue}`)
  }

  if (localhostHosts.has(parsed.hostname.toLowerCase())) {
    fail(
      `${name} must not target localhost in hosted environments. Received: ${rawValue}`,
    )
  }

  return parsed
}

function normalizeOrigin(url) {
  return `${url.protocol}//${url.host}`
}

function run() {
  const { target } = parseArgs(process.argv.slice(2))
  if (!target || (target !== 'staging' && target !== 'production')) {
    fail('Usage: pnpm validate:deploy-env -- --target <staging|production>')
  }

  const suffix = getSuffix(target)
  if (!suffix) {
    fail(`Unsupported target: ${target}`)
  }

  const requiredKeys = [
    `SUPABASE_PROJECT_URL_${suffix}`,
    `SUPABASE_PUBLISHABLE_KEY_${suffix}`,
    `SUPABASE_SERVICE_ROLE_KEY_${suffix}`,
    `API_URL_${suffix}`,
    `WEB_URL_${suffix}`,
    `STRIPE_SECRET_KEY_${suffix}`,
    `STRIPE_PUBLISHABLE_KEY_${suffix}`,
    `STRIPE_WEBHOOK_SECRET_${suffix}`,
  ]

  const missing = requiredKeys.filter((key) => {
    const value = process.env[key]
    return !value || !value.trim()
  })

  if (missing.length > 0) {
    fail(
      `Missing required ${target} secret(s): ${missing.join(', ')}. Configure these in GitHub environment secrets.`,
    )
  }

  const supabaseUrl = assertHostedHttpsUrl(
    `SUPABASE_PROJECT_URL_${suffix}`,
    process.env[`SUPABASE_PROJECT_URL_${suffix}`],
  )
  assertHostedHttpsUrl(`API_URL_${suffix}`, process.env[`API_URL_${suffix}`])
  const webUrl = assertHostedHttpsUrl(
    `WEB_URL_${suffix}`,
    process.env[`WEB_URL_${suffix}`],
  )

  const expectedAuthRedirect = `${normalizeOrigin(webUrl)}/auth`
  console.log(
    `[validate:deploy-env] ${target} environment contract is valid. Expected Supabase hosted auth callback: ${expectedAuthRedirect}`,
  )
  console.log(
    `[validate:deploy-env] Confirm hosted Supabase ${target} Auth settings use site URL ${expectedAuthRedirect} and do not include localhost redirect targets.`,
  )
  console.log(
    `[validate:deploy-env] Using Supabase project host: ${supabaseUrl.host}`,
  )
}

run()
