import { URL } from 'node:url'

function parseArgs(argv) {
  const args = {
    url: null,
    env: null,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--url') {
      args.url = argv[index + 1] ?? null
      index += 1
      continue
    }

    if (value.startsWith('--url=')) {
      args.url = value.slice('--url='.length)
      continue
    }

    if (value === '--env') {
      args.env = argv[index + 1] ?? null
      index += 1
      continue
    }

    if (value.startsWith('--env=')) {
      args.env = value.slice('--env='.length)
    }
  }

  return args
}

function fail(message) {
  console.error(`[verify-hosted-api-health] ${message}`)
  process.exit(1)
}

async function run() {
  const { url, env } = parseArgs(process.argv.slice(2))

  if (!url || !env) {
    fail(
      'Usage: node scripts/verify-hosted-api-health.mjs --url <https://.../graphql> --env <staging|production>',
    )
  }

  let endpoint
  try {
    endpoint = new URL(url)
  } catch {
    fail(`Invalid API URL: ${url}`)
  }

  const response = await fetch(endpoint, {
    method: 'OPTIONS',
    headers: {
      Origin: `https://verify-${env}.example.invalid`,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,authorization',
    },
  }).catch((error) => {
    fail(
      `Request to ${endpoint.toString()} failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  })

  console.log(
    `[verify-hosted-api-health] ${env} preflight status ${response.status} for ${endpoint.toString()}`,
  )

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    fail(
      `${env} API health verification failed with status ${response.status}.${body ? ` Response body: ${body}` : ''}`,
    )
  }

  const allowOrigin = response.headers.get('access-control-allow-origin')
  if (!allowOrigin) {
    fail(
      `${env} API health verification expected Access-Control-Allow-Origin header.`,
    )
  }

  console.log(
    `[verify-hosted-api-health] ${env} API preflight succeeded with Access-Control-Allow-Origin: ${allowOrigin}`,
  )
}

await run()
