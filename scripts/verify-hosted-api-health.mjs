import { URL } from 'node:url'

function parseArgs(argv) {
  const args = {
    url: null,
    env: null,
    maxAttempts: 5,
    retryDelayMs: 3000,
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
      continue
    }

    if (value === '--max-attempts') {
      args.maxAttempts = Number.parseInt(argv[index + 1] ?? '', 10)
      index += 1
      continue
    }

    if (value.startsWith('--max-attempts=')) {
      args.maxAttempts = Number.parseInt(
        value.slice('--max-attempts='.length),
        10,
      )
      continue
    }

    if (value === '--retry-delay-ms') {
      args.retryDelayMs = Number.parseInt(argv[index + 1] ?? '', 10)
      index += 1
      continue
    }

    if (value.startsWith('--retry-delay-ms=')) {
      args.retryDelayMs = Number.parseInt(
        value.slice('--retry-delay-ms='.length),
        10,
      )
    }
  }

  return args
}

function fail(message) {
  console.error(`[verify-hosted-api-health] ${message}`)
  process.exit(1)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldRetryStatus(status) {
  return status >= 500 || status === 429
}

function safeSnippet(text) {
  const trimmed = text.trim()
  if (!trimmed) {
    return ''
  }
  return trimmed.length > 400 ? `${trimmed.slice(0, 400)}...` : trimmed
}

async function run() {
  const { url, env, maxAttempts, retryDelayMs } = parseArgs(
    process.argv.slice(2),
  )

  if (!url || !env) {
    fail(
      'Usage: node scripts/verify-hosted-api-health.mjs --url <https://.../graphql> --env <staging|production> [--max-attempts <n>] [--retry-delay-ms <ms>]',
    )
  }

  if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
    fail(`--max-attempts must be a positive integer. Received: ${maxAttempts}`)
  }

  if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
    fail(
      `--retry-delay-ms must be a non-negative integer. Received: ${retryDelayMs}`,
    )
  }

  let endpoint
  try {
    endpoint = new URL(url)
  } catch {
    fail(`Invalid API URL: ${url}`)
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response
    try {
      response = await fetch(endpoint, {
        method: 'OPTIONS',
        headers: {
          Origin: `https://verify-${env}.example.invalid`,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,authorization',
        },
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      console.log(
        `[verify-hosted-api-health] ${env} preflight request failed on attempt ${attempt}/${maxAttempts}: ${reason}`,
      )

      if (attempt >= maxAttempts) {
        fail(
          `Request to ${endpoint.toString()} failed after ${attempt} attempt(s): ${reason}`,
        )
      }

      await sleep(retryDelayMs * attempt)
      continue
    }

    console.log(
      `[verify-hosted-api-health] ${env} preflight status ${response.status} for ${endpoint.toString()} (attempt ${attempt}/${maxAttempts})`,
    )

    if (response.ok) {
      const allowOrigin = response.headers.get('access-control-allow-origin')
      if (!allowOrigin) {
        if (attempt >= maxAttempts) {
          fail(
            `${env} API health verification expected Access-Control-Allow-Origin header.`,
          )
        }
        await sleep(retryDelayMs * attempt)
        continue
      }

      console.log(
        `[verify-hosted-api-health] ${env} API preflight succeeded with Access-Control-Allow-Origin: ${allowOrigin}`,
      )
      return
    }

    const body = await response.text().catch(() => '')
    const snippet = safeSnippet(body)
    const canRetry = shouldRetryStatus(response.status) && attempt < maxAttempts
    if (canRetry) {
      console.log(
        `[verify-hosted-api-health] retrying after non-2xx status ${response.status} on attempt ${attempt}/${maxAttempts}.${snippet ? ` Response snippet: ${snippet}` : ''}`,
      )
      await sleep(retryDelayMs * attempt)
      continue
    }

    fail(
      `${env} API health verification failed with status ${response.status} after ${attempt} attempt(s).${snippet ? ` Response body: ${snippet}` : ''}`,
    )
  }
}

await run()
