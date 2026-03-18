const { before, after, test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const { spawn, spawnSync } = require('node:child_process')
const http = require('node:http')
const https = require('node:https')
const net = require('node:net')
const { chromium, selectors } = require('playwright')
const { createAuthStorageState } = require('./auth-storage-state')

selectors.setTestIdAttribute('data-test')

const repoRoot = path.resolve(__dirname, '..', '..')

function loadLocalRuntimeEnv(rootDir) {
  const loaded = {}

  for (const fileName of ['.env', '.env.local']) {
    const filePath = path.join(rootDir, fileName)
    if (!fs.existsSync(filePath)) {
      continue
    }

    Object.assign(
      loaded,
      parseEnvAssignments(fs.readFileSync(filePath, 'utf8')),
    )
  }

  return {
    ...loaded,
    ...process.env,
  }
}

const localRuntimeEnv = loadLocalRuntimeEnv(repoRoot)
const stripeSecretKey = localRuntimeEnv.STRIPE_SECRET_KEY?.trim() ?? ''
const stripePublishableKey =
  localRuntimeEnv.STRIPE_PUBLISHABLE_KEY?.trim() ?? ''
let stripeWebhookSecret = localRuntimeEnv.STRIPE_WEBHOOK_SECRET?.trim() ?? ''
let hasStripeE2EConfig = Boolean(stripeSecretKey && stripeWebhookSecret)
let stripeListener = null

function run(command, args, options = {}) {
  return spawn(command, args, {
    stdio: 'inherit',
    detached: process.platform !== 'win32',
    ...options,
  })
}

function shouldAutoStartStripeListener() {
  const autostart = (localRuntimeEnv.STRIPE_CLI_WEBHOOK_AUTOSTART ?? '1')
    .trim()
    .toLowerCase()

  if (autostart === '0' || autostart === 'false' || autostart === 'no') {
    return false
  }

  return Boolean(stripeSecretKey)
}

function extractStripeWebhookSecret(rawText) {
  const match = rawText.match(/\bwhsec_[A-Za-z0-9]+\b/)
  return match?.[0] ?? null
}

function startStripeListener(forwardUrl) {
  const stripeCmd = process.platform === 'win32' ? 'stripe.cmd' : 'stripe'
  const output = []
  const proc = spawn(
    stripeCmd,
    ['--api-key', stripeSecretKey, 'listen', '--forward-to', forwardUrl],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        ...localRuntimeEnv,
        STRIPE_API_KEY: stripeSecretKey,
      },
    },
  )

  const capture = (chunk) => {
    output.push(String(chunk))
    if (output.length > 200) {
      output.shift()
    }
  }

  proc.stdout?.on('data', capture)
  proc.stderr?.on('data', capture)

  return {
    proc,
    getRecentOutput() {
      return output.join('')
    },
  }
}

async function waitForStripeWebhookSecret(listener, timeoutMs = 15000) {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const secret = extractStripeWebhookSecret(listener.getRecentOutput())
    if (secret) {
      return secret
    }

    if (listener.proc.exitCode !== null) {
      break
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  const details = listener.getRecentOutput().trim()
  throw new Error(
    `Stripe CLI did not provide a webhook secret for e2e startup.${details ? ` Output: ${details}` : ''}`,
  )
}

function forceStopDevProcesses() {
  const patterns = [
    '[n]ode scripts/dev.mjs',
    '[w]rangler.*dev',
    '[v]ite.*dev',
    '[v]ite.*preview',
  ]

  for (const pattern of patterns) {
    spawnSync('pkill', ['-f', pattern], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
      env: { ...process.env },
    })
  }
}

function parseEnvAssignments(rawText) {
  const values = {}
  for (const line of rawText.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes('=')) {
      continue
    }
    const separatorIndex = trimmed.indexOf('=')
    const key = trimmed.slice(0, separatorIndex).trim()
    if (!/^[A-Z0-9_]+$/.test(key)) {
      continue
    }

    let value = trimmed.slice(separatorIndex + 1).trim()
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }

    values[key] = value
  }
  return values
}

function extractAccessTokenFromStorageState(storageStatePath) {
  const raw = fs.readFileSync(storageStatePath, 'utf8')
  const state = JSON.parse(raw)
  const origins = Array.isArray(state.origins) ? state.origins : []

  for (const origin of origins) {
    const entries = Array.isArray(origin.localStorage)
      ? origin.localStorage
      : []
    for (const entry of entries) {
      if (!entry?.name?.toLowerCase?.().includes('auth-token')) {
        continue
      }

      try {
        const parsed = JSON.parse(entry.value)
        if (typeof parsed?.access_token === 'string' && parsed.access_token) {
          return parsed.access_token
        }
        if (
          typeof parsed?.currentSession?.access_token === 'string' &&
          parsed.currentSession.access_token
        ) {
          return parsed.currentSession.access_token
        }
      } catch {
        // ignore parse errors and continue scanning
      }
    }
  }

  return null
}

function decodeJwtPayload(token) {
  const [, payload = ''] = token.split('.')
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'))
}

async function graphqlRequest({
  token,
  query,
  variables,
  origin = stack.baseUrl,
}) {
  const response = await httpRequest(
    `http://localhost:${stack.apiPort}/graphql`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        origin,
      },
      body: JSON.stringify({ query, variables }),
    },
  )

  assert.equal(response.statusCode, 200, response.body)
  const payload = JSON.parse(response.body)
  assert.equal(
    Array.isArray(payload.errors),
    false,
    payload.errors
      ? JSON.stringify(payload.errors)
      : 'unexpected GraphQL error array',
  )
  return payload.data
}

async function graphqlRequestRaw({
  token,
  query,
  variables,
  origin = stack.baseUrl,
}) {
  const response = await httpRequest(
    `http://localhost:${stack.apiPort}/graphql`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        origin,
      },
      body: JSON.stringify({ query, variables }),
    },
  )

  assert.equal(response.statusCode, 200, response.body)
  const payload = JSON.parse(response.body)

  return payload
}

async function graphqlRequestExpectError({
  token,
  query,
  variables,
  origin = stack.baseUrl,
}) {
  const payload = await graphqlRequestRaw({ token, query, variables, origin })
  assert.equal(
    Array.isArray(payload.errors),
    true,
    'expected GraphQL errors but none were returned',
  )
  return payload.errors
}

function futureCardExpiry() {
  const now = new Date()
  const month = String(((now.getMonth() + 1) % 12) + 1).padStart(2, '0')
  const year = String((now.getFullYear() + 2) % 100).padStart(2, '0')
  return `${month} / ${year}`
}

function stripeCheckoutScopes(page) {
  return page.frames()
}

async function findVisibleStripeLocator(page, candidates, timeoutMs = 30000) {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    for (const scope of stripeCheckoutScopes(page)) {
      for (const candidate of candidates) {
        const locator =
          candidate.kind === 'placeholder'
            ? scope.getByPlaceholder(candidate.value).first()
            : candidate.kind === 'role'
              ? scope.getByRole(candidate.role, candidate.options).first()
              : scope.locator(candidate.value).first()

        const count = await locator.count().catch(() => 0)
        if (count < 1) {
          continue
        }

        const visible = await locator.isVisible().catch(() => false)
        if (!visible) {
          continue
        }

        return locator
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  const frameUrls = stripeCheckoutScopes(page)
    .map((frame) => frame.url())
    .filter(Boolean)
    .join(', ')

  throw new Error(
    `Unable to locate Stripe Checkout field. Frames seen: ${frameUrls || 'none'}`,
  )
}

async function fillStripeField(page, candidates, value, timeoutMs = 30000) {
  const locator = await findVisibleStripeLocator(page, candidates, timeoutMs)
  await locator.click().catch(() => undefined)
  await locator.fill(value)
}

async function completeStripeHostedCheckout(page, options = {}) {
  const { email = 'e2e-learner@example.test' } = options

  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60000 })

  await page.waitForLoadState('domcontentloaded')

  const emailField = await findVisibleStripeLocator(
    page,
    [
      { kind: 'selector', value: 'input[autocomplete="email"]' },
      { kind: 'selector', value: 'input[name="email"]' },
      { kind: 'placeholder', value: /email@example\.com/i },
    ],
    10000,
  ).catch(() => null)
  if (emailField) {
    const currentValue = await emailField.inputValue().catch(() => '')
    if (!currentValue) {
      await emailField.click().catch(() => undefined)
      await emailField.fill(email)
    }
  }

  const cardAccordionButton = await findVisibleStripeLocator(
    page,
    [
      { kind: 'selector', value: '[data-testid="card-accordion-item-button"]' },
      {
        kind: 'role',
        role: 'button',
        options: { name: /pay with card|card/i },
      },
    ],
    10000,
  ).catch(() => null)
  if (cardAccordionButton) {
    await cardAccordionButton.click().catch(() => undefined)
  }

  await new Promise((resolve) => setTimeout(resolve, 1000))

  await fillStripeField(
    page,
    [
      { kind: 'selector', value: 'input[autocomplete="cc-number"]' },
      { kind: 'selector', value: 'input[name="cardNumber"]' },
      { kind: 'selector', value: 'input[name="number"]' },
      { kind: 'placeholder', value: /1234 1234 1234 1234/i },
    ],
    '4242424242424242',
  )

  await fillStripeField(
    page,
    [
      { kind: 'selector', value: 'input[autocomplete="cc-exp"]' },
      { kind: 'selector', value: 'input[name="cardExpiry"]' },
      { kind: 'selector', value: 'input[name="expiry"]' },
      { kind: 'placeholder', value: /MM\s*\/\s*YY/i },
    ],
    futureCardExpiry(),
  )

  await fillStripeField(
    page,
    [
      { kind: 'selector', value: 'input[autocomplete="cc-csc"]' },
      { kind: 'selector', value: 'input[name="cardCvc"]' },
      { kind: 'selector', value: 'input[name="cvc"]' },
      { kind: 'placeholder', value: /^CVC$/i },
    ],
    '123',
  )

  const nameField = await findVisibleStripeLocator(
    page,
    [
      { kind: 'selector', value: 'input[autocomplete="cc-name"]' },
      { kind: 'selector', value: 'input[name="name"]' },
      { kind: 'placeholder', value: /Full name on card/i },
      { kind: 'placeholder', value: /Name on card/i },
    ],
    5000,
  ).catch(() => null)
  if (nameField) {
    await nameField.click().catch(() => undefined)
    await nameField.fill('E2E Learner')
  }

  const payButton = await findVisibleStripeLocator(page, [
    {
      kind: 'selector',
      value:
        '[data-testid="hosted-payment-submit-button"], [data-test="hosted-payment-submit-button"], button[type="submit"]',
    },
    {
      kind: 'role',
      role: 'button',
      options: { name: /pay|subscribe|complete|purchase/i },
    },
  ])
  await payButton.click()
}

function signStripeWebhook(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex')
  return `t=${timestamp},v1=${signature}`
}

function resolveSupabaseRuntime() {
  const status = spawnSync(
    'npx',
    ['-y', 'supabase@latest', 'status', '-o', 'env'],
    {
      encoding: 'utf8',
      shell: process.platform === 'win32',
      env: { ...process.env },
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    },
  )

  if (status.error) {
    throw status.error
  }

  if (status.status !== 0) {
    const details = `${status.stdout ?? ''}${status.stderr ?? ''}`.trim()
    throw new Error(
      `Unable to resolve local Supabase runtime from supabase status: ${details}`,
    )
  }

  const parsed = parseEnvAssignments(
    `${status.stdout ?? ''}\n${status.stderr ?? ''}`,
  )
  const supabaseUrl = parsed.API_URL?.trim()
  const publishableKey = parsed.ANON_KEY?.trim()
  const serviceRoleKey = parsed.SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    throw new Error(
      'Supabase local runtime is missing API_URL, ANON_KEY, or SERVICE_ROLE_KEY values',
    )
  }

  return {
    supabaseUrl,
    publishableKey,
    serviceRoleKey,
  }
}

function spawnSyncChecked(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with ${result.status}`)
  }
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
      const response = await httpRequest(url, options)
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return
      }
    } catch {
      // ignore and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 750))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

function httpRequest(urlString, options = {}) {
  const url = new URL(urlString)
  const transport = url.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const request = transport.request(
      {
        method: options.method ?? 'GET',
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        headers: options.headers ?? {},
        agent: false,
      },
      (response) => {
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => {
          resolve({ statusCode: response.statusCode ?? 0, body })
        })
      },
    )

    request.on('error', reject)
    if (options.body) {
      request.write(options.body)
    }
    request.end()
  })
}

async function supabaseRestRequest({
  supabaseUrl,
  serviceRoleKey,
  path,
  method = 'GET',
  body,
}) {
  const response = await httpRequest(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      ...(method === 'GET' ? {} : { prefer: 'return=representation' }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  let parsed = null
  try {
    parsed = response.body ? JSON.parse(response.body) : null
  } catch {
    parsed = null
  }

  return {
    ...response,
    json: parsed,
  }
}

function waitForExit(proc, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let done = false
    const timer = setTimeout(() => {
      if (done) {
        return
      }
      done = true
      resolve(false)
    }, timeoutMs)

    proc.once('exit', () => {
      if (done) {
        return
      }
      done = true
      clearTimeout(timer)
      resolve(true)
    })
  })
}

async function stopProcess(proc) {
  if (!proc || proc.exitCode !== null) {
    if (debugE2eShutdown) {
      console.error('[e2e:shutdown] skip process', {
        pid: proc?.pid,
        exitCode: proc?.exitCode,
      })
    }
    return
  }

  if (debugE2eShutdown) {
    console.error('[e2e:shutdown] stopping process', {
      pid: proc.pid,
      exitCode: proc.exitCode,
    })
  }

  const kill = (signal) => {
    if (process.platform !== 'win32' && proc.pid) {
      try {
        process.kill(-proc.pid, signal)
        return
      } catch {
        // fall through and kill direct process
      }
    }
    proc.kill(signal)
  }

  kill('SIGINT')
  if (await waitForExit(proc)) {
    if (debugE2eShutdown) {
      console.error('[e2e:shutdown] exited on SIGINT', { pid: proc.pid })
    }
    return
  }

  kill('SIGTERM')
  if (await waitForExit(proc, 3000)) {
    if (debugE2eShutdown) {
      console.error('[e2e:shutdown] exited on SIGTERM', { pid: proc.pid })
    }
    return
  }

  kill('SIGKILL')
  await waitForExit(proc, 2000)
  if (debugE2eShutdown) {
    console.error('[e2e:shutdown] waited after SIGKILL', {
      pid: proc.pid,
      exitCode: proc.exitCode,
    })
  }
}

async function shutdown(processes) {
  await Promise.all(processes.map((proc) => stopProcess(proc)))
}

async function waitForVisible(page, testId, timeoutMs = 30000) {
  await page.getByTestId(testId).first().waitFor({
    state: 'visible',
    timeout: timeoutMs,
  })
}

async function openPublisherLanding(page, baseUrl, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await page.goto(`${baseUrl}/publish`, { waitUntil: 'networkidle' })

    try {
      await waitForVisible(page, 'publisher-landing', 30000)
      return
    } catch (error) {
      if (attempt >= attempts) {
        const currentUrl = page.url()
        const authEntryCount = await page.getByTestId('auth-entry-page').count()
        const authUserCount = await page.getByTestId('auth-user-email').count()
        const authErrorCount = await page.getByTestId('auth-error').count()
        const notFoundCount = await page.getByTestId('router-not-found').count()
        const showErrorButtons = page.getByText('Show Error')
        if ((await showErrorButtons.count()) > 0) {
          await showErrorButtons
            .first()
            .click()
            .catch(() => {})
        }
        const bodyText = await page
          .locator('body')
          .innerText()
          .catch(() => '')
        throw new Error(
          `Publisher landing not visible after ${attempts} attempts. url=${currentUrl} authEntry=${authEntryCount} authUser=${authUserCount} authError=${authErrorCount} notFound=${notFoundCount} body=${bodyText.slice(0, 500)}`,
        )
      }

      await page.goto(`${baseUrl}/learn`, { waitUntil: 'networkidle' })
      await waitForVisible(page, 'auth-user-email', 60000)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}

async function readValues(locator) {
  return locator.evaluateAll((nodes) =>
    nodes.map((node) => String(node.getAttribute('data-id') ?? '')),
  )
}

async function firstValue(locator) {
  return locator.first().getAttribute('data-id')
}

async function indexOfValue(locator, value) {
  const values = await readValues(locator)
  return values.indexOf(String(value))
}

async function selectByVisibleText(page, testId, text) {
  const value = await page.getByTestId(testId).evaluate((select, expected) => {
    const option = Array.from(select.options).find(
      (item) => item.textContent?.trim() === expected,
    )
    return option ? option.value : ''
  }, text)
  assert.ok(value, `Expected option "${text}" in ${testId}`)
  await page.getByTestId(testId).selectOption(value)
}

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const stopE2eLocalStackAfterTest = process.env.STOP_E2E_LOCAL_STACK !== 'false'
const debugE2eShutdown = process.env.DEBUG_E2E_SHUTDOWN === '1'
const stack = {
  apiPort: 0,
  webPort: 0,
  baseUrl: '',
  processes: [],
  authStorageDir: '',
  authStoragePath: '',
}

let stackStopPromise

async function ensureStackStopped() {
  if (stackStopPromise) {
    return stackStopPromise
  }

  stackStopPromise = shutdown(stack.processes)
  await stackStopPromise
}

before(async () => {
  forceStopDevProcesses()

  spawnSyncChecked(process.execPath, ['scripts/dev-db.mjs', 'up'], {
    shell: process.platform === 'win32',
    env: {
      ...process.env,
    },
  })

  spawnSyncChecked(process.execPath, ['scripts/dev-db.mjs', 'push'], {
    shell: process.platform === 'win32',
    env: {
      ...process.env,
    },
  })

  const supabaseRuntime = resolveSupabaseRuntime()
  const reserved = new Set()
  stack.apiPort = await findAvailablePort(4000, reserved)
  reserved.add(stack.apiPort)
  stack.webPort = 4100
  const webPortAvailable = await canListen(stack.webPort, '127.0.0.1')
  if (webPortAvailable === false) {
    throw new Error(
      'Web port 4100 must be available for magic-link redirect in e2e auth fixture',
    )
  }
  stack.baseUrl = `http://localhost:${stack.webPort}`
  stack.authStorageDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'learn-active-publisher-auth-'),
  )
  stack.authStoragePath = path.join(stack.authStorageDir, 'storage-state.json')

  if (shouldAutoStartStripeListener()) {
    stripeListener = startStripeListener(
      `http://127.0.0.1:${stack.apiPort}/api/webhooks/stripe`,
    )
    stripeWebhookSecret = await waitForStripeWebhookSecret(stripeListener)
    hasStripeE2EConfig = Boolean(stripeSecretKey && stripeWebhookSecret)
  }

  spawnSyncChecked(pnpmCmd, ['build'], {
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      VITE_GRAPHQL_ENDPOINT: `http://localhost:${stack.apiPort}/graphql`,
      VITE_SUPABASE_URL: supabaseRuntime.supabaseUrl,
      VITE_SUPABASE_PUBLISHABLE_KEY: supabaseRuntime.publishableKey,
    },
  })

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
      String(stack.apiPort),
      '--var',
      `SUPABASE_URL:${supabaseRuntime.supabaseUrl}`,
      '--var',
      `SUPABASE_SERVICE_ROLE_KEY:${supabaseRuntime.serviceRoleKey}`,
      ...(stripeSecretKey
        ? ['--var', `STRIPE_SECRET_KEY:${stripeSecretKey}`]
        : []),
      ...(stripePublishableKey
        ? ['--var', `STRIPE_PUBLISHABLE_KEY:${stripePublishableKey}`]
        : []),
      ...(stripeWebhookSecret
        ? ['--var', `STRIPE_WEBHOOK_SECRET:${stripeWebhookSecret}`]
        : []),
    ],
    {
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        ...localRuntimeEnv,
        PORT: String(stack.apiPort),
        APP_ENV: 'local',
        SUPABASE_URL: supabaseRuntime.supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: supabaseRuntime.serviceRoleKey,
        ...(stripeSecretKey ? { STRIPE_SECRET_KEY: stripeSecretKey } : {}),
        ...(stripePublishableKey
          ? { STRIPE_PUBLISHABLE_KEY: stripePublishableKey }
          : {}),
        ...(stripeWebhookSecret
          ? { STRIPE_WEBHOOK_SECRET: stripeWebhookSecret }
          : {}),
      },
    },
  )
  const web = run(
    pnpmCmd,
    [
      '--filter',
      '@app/web',
      'exec',
      'vite',
      'preview',
      '--port',
      String(stack.webPort),
      '--host',
      '0.0.0.0',
    ],
    {
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        ...localRuntimeEnv,
        PORT: String(stack.webPort),
        GRAPHQL_ENDPOINT: `http://localhost:${stack.apiPort}/graphql`,
        VITE_GRAPHQL_ENDPOINT: `http://localhost:${stack.apiPort}/graphql`,
        EXPO_PUBLIC_GRAPHQL_ENDPOINT: `http://localhost:${stack.apiPort}/graphql`,
        VITE_SUPABASE_URL: supabaseRuntime.supabaseUrl,
        VITE_SUPABASE_PUBLISHABLE_KEY: supabaseRuntime.publishableKey,
      },
    },
  )

  stack.processes.push(api, web)

  await waitFor(`http://localhost:${stack.apiPort}/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '{ health }' }),
  })
  await waitFor(`${stack.baseUrl}/auth`)

  await createAuthStorageState({
    chromium,
    baseUrl: stack.baseUrl,
    storageStatePath: stack.authStoragePath,
    email: `publisher-${Date.now().toString(36)}@example.test`,
    returnToPath: '/learn',
    waitForTestId: 'auth-user-email',
    waitForTestIdTimeoutMs: 90000,
  })

  await waitFor(`${stack.baseUrl}/publish`)
})

after(async () => {
  if (!stopE2eLocalStackAfterTest) {
    return
  }

  if (debugE2eShutdown) {
    console.error('[e2e:shutdown] begin', {
      count: stack.processes.length,
      pids: stack.processes.map((proc) => proc?.pid ?? null),
    })
  }
  await ensureStackStopped()
  if (debugE2eShutdown) {
    console.error('[e2e:shutdown] end')
  }

  if (stack.authStorageDir) {
    fs.rmSync(stack.authStorageDir, { recursive: true, force: true })
  }

  if (stripeListener?.proc) {
    await stopProcess(stripeListener.proc)
  }

  forceStopDevProcesses()
})

test(
  'publisher auth fixture stores reusable magic-link session',
  { timeout: 60000 },
  async () => {
    assert.equal(
      fs.existsSync(stack.authStoragePath),
      true,
      'auth storage-state file should exist',
    )
    const contents = fs.readFileSync(stack.authStoragePath, 'utf8')
    assert.ok(contents.includes('cookies') || contents.includes('origins'))

    const accessToken = extractAccessTokenFromStorageState(
      stack.authStoragePath,
    )
    assert.ok(
      accessToken,
      'storage-state should contain a Supabase access token',
    )

    const response = await httpRequest(
      `http://localhost:${stack.apiPort}/graphql`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query: '{ learnerCourses { id } }' }),
      },
    )
    assert.equal(response.statusCode, 200)

    const payload = JSON.parse(response.body)
    assert.equal(
      Array.isArray(payload.errors),
      false,
      payload.errors
        ? JSON.stringify(payload.errors)
        : 'unexpected GraphQL error array',
    )
    assert.ok(
      Array.isArray(payload?.data?.learnerCourses),
      'learnerCourses query should return data',
    )
  },
)

test(
  'personal ownership provisioning and invariants are enforced end-to-end',
  { timeout: 120000 },
  async () => {
    const publisherToken = extractAccessTokenFromStorageState(
      stack.authStoragePath,
    )
    const publisherClaims = decodeJwtPayload(publisherToken)
    const publisherUserId = String(publisherClaims.sub ?? '')
    assert.ok(
      publisherUserId,
      'publisher access token should contain sub claim',
    )

    const supabaseRuntime = resolveSupabaseRuntime()

    const firstPublisherCourses = await graphqlRequest({
      token: publisherToken,
      query: `query PublisherCourses {
        publisherCourses {
          id
          title
        }
      }`,
    })

    const secondPublisherCourses = await graphqlRequest({
      token: publisherToken,
      query: `query PublisherCourses {
        publisherCourses {
          id
          title
        }
      }`,
    })

    assert.deepEqual(
      secondPublisherCourses.publisherCourses,
      firstPublisherCourses.publisherCourses,
      'publisher owner provisioning should be idempotent across repeated calls',
    )

    const ownerLookup = await supabaseRestRequest({
      supabaseUrl: supabaseRuntime.supabaseUrl,
      serviceRoleKey: supabaseRuntime.serviceRoleKey,
      path: `owners?select=id,type,personal_user_id&personal_user_id=eq.${publisherUserId}&type=eq.user`,
    })
    assert.equal(ownerLookup.statusCode, 200, ownerLookup.body)
    assert.equal(Array.isArray(ownerLookup.json), true)
    assert.equal(ownerLookup.json.length, 1)

    const personalOwnerId = String(ownerLookup.json[0].id)
    assert.ok(personalOwnerId, 'personal owner id should be persisted')

    const ownerMembershipLookup = await supabaseRestRequest({
      supabaseUrl: supabaseRuntime.supabaseUrl,
      serviceRoleKey: supabaseRuntime.serviceRoleKey,
      path: `owner_members?select=id,owner_id,user_id,role&owner_id=eq.${personalOwnerId}&user_id=eq.${publisherUserId}`,
    })
    assert.equal(
      ownerMembershipLookup.statusCode,
      200,
      ownerMembershipLookup.body,
    )
    assert.equal(Array.isArray(ownerMembershipLookup.json), true)
    assert.equal(ownerMembershipLookup.json.length, 1)
    assert.equal(ownerMembershipLookup.json[0].role, 'owner')

    const invalidRoleUpdate = await supabaseRestRequest({
      supabaseUrl: supabaseRuntime.supabaseUrl,
      serviceRoleKey: supabaseRuntime.serviceRoleKey,
      method: 'PATCH',
      path: `owner_members?owner_id=eq.${personalOwnerId}&user_id=eq.${publisherUserId}`,
      body: { role: 'editor' },
    })
    assert.equal(
      invalidRoleUpdate.statusCode >= 400,
      true,
      invalidRoleUpdate.body,
    )
    assert.equal(
      invalidRoleUpdate.body.includes('Personal owner invariant violation'),
      true,
      invalidRoleUpdate.body,
    )

    const invalidDelete = await supabaseRestRequest({
      supabaseUrl: supabaseRuntime.supabaseUrl,
      serviceRoleKey: supabaseRuntime.serviceRoleKey,
      method: 'DELETE',
      path: `owner_members?owner_id=eq.${personalOwnerId}&user_id=eq.${publisherUserId}`,
    })
    assert.equal(invalidDelete.statusCode >= 400, true, invalidDelete.body)
    assert.equal(
      invalidDelete.body.includes('Personal owner invariant violation'),
      true,
      invalidDelete.body,
    )

    const ownerMembershipAfterInvalidMutations = await supabaseRestRequest({
      supabaseUrl: supabaseRuntime.supabaseUrl,
      serviceRoleKey: supabaseRuntime.serviceRoleKey,
      path: `owner_members?select=id,owner_id,user_id,role&owner_id=eq.${personalOwnerId}&user_id=eq.${publisherUserId}`,
    })
    assert.equal(
      ownerMembershipAfterInvalidMutations.statusCode,
      200,
      ownerMembershipAfterInvalidMutations.body,
    )
    assert.equal(Array.isArray(ownerMembershipAfterInvalidMutations.json), true)
    assert.equal(ownerMembershipAfterInvalidMutations.json.length, 1)
    assert.equal(ownerMembershipAfterInvalidMutations.json[0].role, 'owner')

    const systemOwnerLookup = await supabaseRestRequest({
      supabaseUrl: supabaseRuntime.supabaseUrl,
      serviceRoleKey: supabaseRuntime.serviceRoleKey,
      path: 'owners?select=id&type=eq.system',
    })
    assert.equal(systemOwnerLookup.statusCode, 200, systemOwnerLookup.body)
    assert.equal(Array.isArray(systemOwnerLookup.json), true)
    assert.equal(systemOwnerLookup.json.length >= 1, true)
    const systemOwnerId = String(systemOwnerLookup.json[0].id)

    const systemCoursesLookup = await supabaseRestRequest({
      supabaseUrl: supabaseRuntime.supabaseUrl,
      serviceRoleKey: supabaseRuntime.serviceRoleKey,
      path: `courses?select=id&owner_id=eq.${systemOwnerId}`,
    })
    assert.equal(systemCoursesLookup.statusCode, 200, systemCoursesLookup.body)
    assert.equal(Array.isArray(systemCoursesLookup.json), true)

    const systemCourseIds = new Set(
      systemCoursesLookup.json.map((row) => String(row.id)),
    )

    const finalPublisherCourses = await graphqlRequest({
      token: publisherToken,
      query: `query PublisherCourses {
        publisherCourses {
          id
        }
      }`,
    })
    assert.equal(
      finalPublisherCourses.publisherCourses.some((course) =>
        systemCourseIds.has(course.id),
      ),
      false,
      'legacy system-owner courses must not be editable via personal publisher queries',
    )
  },
)

test(
  'publisher landing and block authoring flow',
  { timeout: 300000 },
  async () => {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const context = await browser.newContext({
      storageState: stack.authStoragePath,
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()

    const unique = Date.now().toString(36)
    const courseTitle = `E2E Course ${unique}`
    const description = `Block editor flow ${unique}`
    const moduleA = `Module A ${unique}`
    const moduleB = `Module B ${unique}`
    const lessonA1 = `Lesson A1 ${unique}`
    const lessonA2 = `Lesson A2 ${unique}`
    const lessonB1 = `Lesson B1 ${unique}`
    const contentPageTitle = `Content Page ${unique}`
    const exerciseA = `Exercise A ${unique}`

    try {
      await page.goto(`${stack.baseUrl}/learn`, { waitUntil: 'networkidle' })
      await waitForVisible(page, 'auth-user-email', 90000)

      await openPublisherLanding(page, stack.baseUrl)
      await page.getByTestId('publisher-create-course').click()
      await waitForVisible(page, 'publisher-home')

      const layout = page.locator('.publisher-layout').first()
      const initialLayoutClass = await layout.getAttribute('class')
      assert.ok(
        initialLayoutClass?.includes('publisher-layout-parallel'),
        'publisher layout should always be parallel',
      )
      assert.equal(
        initialLayoutClass?.includes('publisher-layout-three'),
        false,
        'legacy three layout class should not exist',
      )
      assert.equal(
        initialLayoutClass?.includes('publisher-layout-stack'),
        false,
        'legacy stack layout class should not exist',
      )
      assert.equal(
        await page.getByTestId('publisher-parallel-toggle').count(),
        0,
        'global full-parallel toggle should be removed',
      )

      await page.getByTestId('publisher-course-node').click()
      await page.getByTestId('publisher-course-title').fill(courseTitle)
      await page.getByTestId('publisher-course-description').fill(description)
      assert.equal(
        await page.getByTestId('publisher-course-language').count(),
        0,
        'course language field should be removed',
      )

      await page.getByTestId('publisher-add-module').click()
      await page.getByTestId('publisher-add-module').click()

      const moduleIds = (
        await readValues(page.getByTestId('publisher-module-node'))
      ).filter(Boolean)
      assert.ok(moduleIds.length >= 2)
      const moduleAId = moduleIds[moduleIds.length - 2]
      const moduleBId = moduleIds[moduleIds.length - 1]

      await page
        .locator(
          `[data-test="publisher-module-select"][data-id="${moduleAId}"]`,
        )
        .click()
      await page.getByTestId('publisher-module-title').fill(moduleA)

      await page
        .locator(
          `[data-test="publisher-module-select"][data-id="${moduleBId}"]`,
        )
        .click()
      await page.getByTestId('publisher-module-title').fill(moduleB)

      await page
        .locator(
          `[data-test="publisher-module-add-lesson"][data-id="${moduleAId}"]`,
        )
        .click()
      await page
        .locator(
          `[data-test="publisher-module-add-lesson"][data-id="${moduleAId}"]`,
        )
        .click()
      await page
        .locator(
          `[data-test="publisher-module-add-lesson"][data-id="${moduleBId}"]`,
        )
        .click()

      const lessonAIds = (
        await readValues(
          page.locator(
            `[data-test="publisher-lesson-node"][data-module-id="${moduleAId}"]`,
          ),
        )
      ).filter(Boolean)
      assert.ok(lessonAIds.length >= 2)
      const lessonA1Id = lessonAIds[lessonAIds.length - 2]
      const lessonA2Id = lessonAIds[lessonAIds.length - 1]

      const lessonB1Id = await firstValue(
        page.locator(
          `[data-test="publisher-lesson-node"][data-module-id="${moduleBId}"]`,
        ),
      )
      assert.ok(lessonB1Id)

      await page
        .locator(
          `[data-test="publisher-lesson-select"][data-id="${lessonA1Id}"][data-module-id="${moduleAId}"]`,
        )
        .click()
      await page.getByTestId('publisher-lesson-title').fill(lessonA1)

      await page
        .locator(
          `[data-test="publisher-lesson-select"][data-id="${lessonA2Id}"][data-module-id="${moduleAId}"]`,
        )
        .click()
      await page.getByTestId('publisher-lesson-title').fill(lessonA2)

      await page
        .locator(
          `[data-test="publisher-lesson-select"][data-id="${lessonB1Id}"][data-module-id="${moduleBId}"]`,
        )
        .click()
      await page.getByTestId('publisher-lesson-title').fill(lessonB1)

      await page
        .locator(
          `[data-test="publisher-lesson-add-content-page"][data-id="${lessonA1Id}"][data-module-id="${moduleAId}"]`,
        )
        .first()
        .click()

      const contentPageId = await firstValue(
        page.locator(
          `[data-test="publisher-content-page-node"][data-module-id="${moduleAId}"][data-lesson-id="${lessonA1Id}"]`,
        ),
      )
      assert.ok(contentPageId)

      await page
        .locator(
          `[data-test="publisher-content-page-select"][data-id="${contentPageId}"][data-module-id="${moduleAId}"][data-lesson-id="${lessonA1Id}"]`,
        )
        .click()
      await page
        .getByTestId('publisher-content-page-title')
        .fill(contentPageTitle)
      await page.getByTestId('publisher-content-page-add-text').click()
      await waitForVisible(page, 'publisher-preview-root')
      assert.equal(
        (await page.getByText(contentPageTitle).count()) > 0,
        true,
        'content page selection should render in preview',
      )

      await page
        .locator(
          `[data-test="publisher-lesson-add-exercise-tree"][data-id="${lessonA1Id}"][data-module-id="${moduleAId}"]`,
        )
        .click()
      await page.getByTestId('publisher-exercise-title').fill(exerciseA)
      await page
        .getByTestId('publisher-exercise-instructions')
        .fill('Fill the missing word')
      await page
        .getByTestId('publisher-step-prompt')
        .fill('Choose the right word')
      await page
        .getByTestId('publisher-step-template')
        .fill('The sky is [blank].')
      await page.getByTestId('publisher-blank-variant').selectOption('OPTIONS')
      await page.getByTestId('publisher-blank-correct').fill('blue')
      await page.getByTestId('publisher-blank-options').fill('blue, green, red')

      const exerciseId = await firstValue(
        page.locator(
          `[data-test="publisher-exercise-node"][data-module-id="${moduleAId}"][data-lesson-id="${lessonA1Id}"]`,
        ),
      )
      assert.ok(exerciseId)

      await page
        .locator(
          `[data-test="publisher-exercise-move-down"][data-id="${exerciseId}"][data-module-id="${moduleAId}"][data-lesson-id="${lessonA1Id}"]`,
        )
        .click()
      assert.equal(
        await page
          .locator(
            `[data-test="publisher-exercise-node"][data-id="${exerciseId}"][data-module-id="${moduleAId}"][data-lesson-id="${lessonA2Id}"]`,
          )
          .count(),
        1,
        'exercise move-down should cross lesson boundary',
      )

      await page
        .locator(
          `[data-test="publisher-exercise-move-up"][data-id="${exerciseId}"][data-module-id="${moduleAId}"][data-lesson-id="${lessonA2Id}"]`,
        )
        .click()
      assert.equal(
        await page
          .locator(
            `[data-test="publisher-exercise-node"][data-id="${exerciseId}"][data-module-id="${moduleAId}"][data-lesson-id="${lessonA1Id}"]`,
          )
          .count(),
        1,
        'exercise move-up should cross lesson boundary',
      )

      await page
        .locator(
          `[data-test="publisher-lesson-move-down"][data-id="${lessonA2Id}"][data-module-id="${moduleAId}"]`,
        )
        .click()
      assert.equal(
        await page
          .locator(
            `[data-test="publisher-lesson-node"][data-id="${lessonA2Id}"][data-module-id="${moduleBId}"]`,
          )
          .count(),
        1,
        'lesson move-down should cross module boundary',
      )

      await page
        .locator(
          `[data-test="publisher-lesson-move-up"][data-id="${lessonA2Id}"][data-module-id="${moduleBId}"]`,
        )
        .click()
      assert.equal(
        await page
          .locator(
            `[data-test="publisher-lesson-node"][data-id="${lessonA2Id}"][data-module-id="${moduleAId}"]`,
          )
          .count(),
        1,
        'lesson move-up should cross module boundary',
      )

      await page.getByTestId('publisher-column-structure-toggle').click()
      let layoutClass = await layout.getAttribute('class')
      assert.ok(layoutClass?.includes('publisher-layout-structure-collapsed'))
      const structureWidth = await page
        .locator('.publisher-column-structure')
        .evaluate((el) => Number.parseFloat(getComputedStyle(el).width))
      assert.ok(structureWidth <= 56)
      await page.getByTestId('publisher-column-structure-toggle').click()

      await page.getByTestId('publisher-column-designer-toggle').click()
      layoutClass = await layout.getAttribute('class')
      assert.ok(layoutClass?.includes('publisher-layout-designer-collapsed'))
      const designerWidth = await page
        .locator('.publisher-workspace')
        .evaluate((el) => Number.parseFloat(getComputedStyle(el).width))
      assert.ok(designerWidth <= 56)
      await page.getByTestId('publisher-column-designer-toggle').click()

      await page.getByTestId('publisher-column-preview-toggle').click()
      layoutClass = await layout.getAttribute('class')
      assert.ok(layoutClass?.includes('publisher-layout-preview-collapsed'))
      const previewWidth = await page
        .locator('.publisher-column-preview')
        .evaluate((el) => Number.parseFloat(getComputedStyle(el).width))
      assert.ok(previewWidth <= 56)
      await page.getByTestId('publisher-column-preview-toggle').click()
      layoutClass = await layout.getAttribute('class')
      assert.equal(
        Boolean(layoutClass?.includes('publisher-layout-preview-collapsed')),
        false,
        'preview column should re-expand when toggled again',
      )

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 2,
      )
      assert.equal(
        hasHorizontalOverflow,
        false,
        'publisher workspace should avoid normal horizontal scrolling',
      )

      await page.getByTestId('publisher-save').click()
      await page
        .locator('[data-test="publisher-status"][data-status="saved"]')
        .waitFor({ timeout: 30000 })

      await page.getByTestId('publisher-back').click()
      await waitForVisible(page, 'publisher-landing')
      await page.waitForLoadState('networkidle').catch(() => undefined)
      await page
        .waitForResponse(
          (response) =>
            response.url().includes('/graphql') &&
            response.request().method() === 'POST',
          { timeout: 30000 },
        )
        .catch(() => undefined)
      const matchingCourseCard = page
        .locator('[data-test="publisher-course-card"]')
        .filter({ hasText: courseTitle })
        .first()
      await matchingCourseCard.waitFor({ state: 'visible', timeout: 30000 })
      await matchingCourseCard.getByTestId('publisher-enter-course').click()

      await waitForVisible(page, 'publisher-home')
      await page.waitForFunction(
        (expectedTitle) => {
          const input = document.querySelector(
            '[data-test="publisher-course-title"]',
          )
          return input?.value === expectedTitle
        },
        courseTitle,
        { timeout: 30000 },
      )
      assert.equal(
        await page.getByTestId('publisher-course-title').inputValue(),
        courseTitle,
      )
      assert.equal(
        await page.getByTestId('publisher-course-description').inputValue(),
        description,
      )
      assert.equal(
        await page.getByTestId('publisher-course-language').count(),
        0,
      )
      assert.equal(
        await page
          .locator(
            `[data-test="publisher-content-page-node"][data-id="${contentPageId}"][data-module-id="${moduleAId}"][data-lesson-id="${lessonA1Id}"]`,
          )
          .count(),
        1,
        'content page should persist after returning through landing route',
      )
      assert.equal(
        await page
          .locator(
            `[data-test="publisher-exercise-node"][data-id="${exerciseId}"][data-module-id="${moduleAId}"][data-lesson-id="${lessonA1Id}"]`,
          )
          .count(),
        1,
        'exercise position should persist after return',
      )
    } finally {
      await context.close()
      await browser.close()
    }
  },
)

test(
  'paid course publication and enrollment flow',
  { timeout: 240000 },
  async (t) => {
    if (!hasStripeE2EConfig) {
      t.skip(
        'Stripe test credentials and webhook secret are not configured for e2e',
      )
      return
    }

    const publisherToken = extractAccessTokenFromStorageState(
      stack.authStoragePath,
    )
    const unique = Date.now().toString(36)
    const learnerStoragePath = path.join(
      stack.authStorageDir,
      `learner-${unique}-storage-state.json`,
    )
    const learnerEmail = `learner-${unique}@example.test`

    await createAuthStorageState({
      chromium,
      baseUrl: stack.baseUrl,
      storageStatePath: learnerStoragePath,
      email: learnerEmail,
      returnToPath: '/learn',
      waitForTestId: 'auth-user-email',
      waitForTestIdTimeoutMs: 90000,
    })

    const learnerToken = extractAccessTokenFromStorageState(learnerStoragePath)
    const learnerClaims = decodeJwtPayload(learnerToken)
    const learnerUserId = learnerClaims.sub
    assert.ok(learnerUserId, 'learner access token should contain sub claim')

    const saveData = await graphqlRequest({
      token: publisherToken,
      query: `mutation SaveCourse($input: CourseInput!) {
        upsertCourse(input: $input) {
          id
          title
          status
          stripePriceId
          priceCents
          currency
        }
      }`,
      variables: {
        input: {
          id: `course-${unique}`,
          title: `Paid E2E ${unique}`,
          description: `Paid publish and enroll flow ${unique}`,
          priceCents: 50,
          currency: 'eur',
          modules: [
            {
              id: `module-${unique}`,
              title: `Module ${unique}`,
              order: 1,
              lessons: [
                {
                  id: `lesson-${unique}`,
                  title: `Lesson ${unique}`,
                  order: 1,
                  contents: [],
                  contentPages: [],
                  exercises: [],
                },
              ],
            },
          ],
        },
      },
    })

    const savedCourse = saveData.upsertCourse
    assert.equal(savedCourse.priceCents, 50)
    assert.equal(savedCourse.currency, 'eur')
    assert.ok(
      savedCourse.stripePriceId,
      'paid course should have stripe price id',
    )

    const publishData = await graphqlRequest({
      token: publisherToken,
      query: `mutation PublishCourse($courseId: String!) {
        publishCourseDraft(courseId: $courseId) {
          id
          status
          publishedAt
        }
      }`,
      variables: { courseId: savedCourse.id },
    })

    assert.equal(publishData.publishCourseDraft.status, 'published')
    assert.ok(publishData.publishCourseDraft.publishedAt)

    const checkoutData = await graphqlRequest({
      token: learnerToken,
      query: `mutation CreateCourseCheckoutSession($courseId: String!, $channel: CheckoutChannel!) {
        createCourseCheckoutSession(courseId: $courseId, channel: $channel) {
          url
          sessionId
        }
      }`,
      variables: {
        courseId: savedCourse.id,
        channel: 'WEB',
      },
    })

    const checkoutSession = checkoutData.createCourseCheckoutSession
    assert.ok(checkoutSession.sessionId)
    assert.ok(checkoutSession.url.startsWith('https://checkout.stripe.com/'))

    const webhookPayload = JSON.stringify({
      id: `evt_${unique}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: checkoutSession.sessionId,
          payment_intent: `pi_${unique}`,
          payment_status: 'paid',
          status: 'complete',
          amount_total: 50,
          currency: 'eur',
          metadata: {
            user_id: learnerUserId,
            course_id: savedCourse.id,
          },
        },
      },
    })

    const webhookResponse = await httpRequest(
      `http://localhost:${stack.apiPort}/api/webhooks/stripe`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': signStripeWebhook(
            webhookPayload,
            stripeWebhookSecret,
          ),
        },
        body: webhookPayload,
      },
    )

    assert.equal(webhookResponse.statusCode, 200, webhookResponse.body)

    const enrollmentData = await graphqlRequest({
      token: learnerToken,
      query: `query EnrollmentStatus($courseId: String!) {
        courseEnrollmentStatus(courseId: $courseId) {
          enrolled
          status
        }
        myPayments {
          stripeSessionId
          amountCents
          currency
          status
          courseId
        }
      }`,
      variables: { courseId: savedCourse.id },
    })

    assert.equal(enrollmentData.courseEnrollmentStatus.enrolled, true)
    assert.equal(enrollmentData.courseEnrollmentStatus.status, 'active')
    assert.equal(
      enrollmentData.myPayments.some(
        (payment) =>
          payment.stripeSessionId === checkoutSession.sessionId &&
          payment.courseId === savedCourse.id &&
          payment.amountCents === 50 &&
          payment.currency === 'eur' &&
          payment.status === 'paid',
      ),
      true,
    )
  },
)

test(
  'paid course enrollment also succeeds for async Stripe success webhook',
  { timeout: 240000 },
  async (t) => {
    if (!hasStripeE2EConfig) {
      t.skip(
        'Stripe test credentials and webhook secret are not configured for e2e',
      )
      return
    }

    const publisherToken = extractAccessTokenFromStorageState(
      stack.authStoragePath,
    )
    const unique = `${Date.now().toString(36)}-async`
    const learnerStoragePath = path.join(
      stack.authStorageDir,
      `learner-${unique}-storage-state.json`,
    )
    const learnerEmail = `learner-${unique}@example.test`

    await createAuthStorageState({
      chromium,
      baseUrl: stack.baseUrl,
      storageStatePath: learnerStoragePath,
      email: learnerEmail,
      returnToPath: '/learn',
      waitForTestId: 'auth-user-email',
      waitForTestIdTimeoutMs: 90000,
    })

    const learnerToken = extractAccessTokenFromStorageState(learnerStoragePath)
    const learnerClaims = decodeJwtPayload(learnerToken)
    const learnerUserId = learnerClaims.sub
    assert.ok(learnerUserId)

    const saveData = await graphqlRequest({
      token: publisherToken,
      query: `mutation SaveCourse($input: CourseInput!) {
        upsertCourse(input: $input) {
          id
          stripePriceId
        }
      }`,
      variables: {
        input: {
          id: `course-${unique}`,
          title: `Paid Async E2E ${unique}`,
          description: `Paid async publish and enroll flow ${unique}`,
          priceCents: 50,
          currency: 'eur',
          modules: [
            {
              id: `module-${unique}`,
              title: `Module ${unique}`,
              order: 1,
              lessons: [
                {
                  id: `lesson-${unique}`,
                  title: `Lesson ${unique}`,
                  order: 1,
                  contents: [],
                  contentPages: [],
                  exercises: [],
                },
              ],
            },
          ],
        },
      },
    })

    const savedCourse = saveData.upsertCourse
    assert.ok(savedCourse.stripePriceId)

    await graphqlRequest({
      token: publisherToken,
      query: `mutation PublishCourse($courseId: String!) {
        publishCourseDraft(courseId: $courseId) {
          id
        }
      }`,
      variables: { courseId: savedCourse.id },
    })

    const checkoutData = await graphqlRequest({
      token: learnerToken,
      query: `mutation CreateCourseCheckoutSession($courseId: String!, $channel: CheckoutChannel!) {
        createCourseCheckoutSession(courseId: $courseId, channel: $channel) {
          sessionId
        }
      }`,
      variables: {
        courseId: savedCourse.id,
        channel: 'WEB',
      },
    })

    const checkoutSessionId = checkoutData.createCourseCheckoutSession.sessionId

    const webhookPayload = JSON.stringify({
      id: `evt_${unique}`,
      type: 'checkout.session.async_payment_succeeded',
      data: {
        object: {
          id: checkoutSessionId,
          payment_intent: `pi_${unique}`,
          payment_status: 'paid',
          status: 'complete',
          amount_total: 50,
          currency: 'eur',
          metadata: {
            user_id: learnerUserId,
            course_id: savedCourse.id,
          },
        },
      },
    })

    const webhookResponse = await httpRequest(
      `http://localhost:${stack.apiPort}/api/webhooks/stripe`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': signStripeWebhook(
            webhookPayload,
            stripeWebhookSecret,
          ),
        },
        body: webhookPayload,
      },
    )

    assert.equal(webhookResponse.statusCode, 200, webhookResponse.body)

    const enrollmentData = await graphqlRequest({
      token: learnerToken,
      query: `query EnrollmentStatus($courseId: String!) {
        courseEnrollmentStatus(courseId: $courseId) {
          enrolled
          status
        }
      }`,
      variables: { courseId: savedCourse.id },
    })

    assert.equal(enrollmentData.courseEnrollmentStatus.enrolled, true)
    assert.equal(enrollmentData.courseEnrollmentStatus.status, 'active')
  },
)

test(
  'real Stripe hosted checkout updates purchase success UI to enrolled',
  { timeout: 360000 },
  async (t) => {
    if (!hasStripeE2EConfig) {
      t.skip(
        'Stripe test credentials and webhook secret are not configured for e2e',
      )
      return
    }

    const publisherToken = extractAccessTokenFromStorageState(
      stack.authStoragePath,
    )
    const unique = `${Date.now().toString(36)}-ui`
    const learnerStoragePath = path.join(
      stack.authStorageDir,
      `learner-${unique}-storage-state.json`,
    )
    const learnerEmail = `learner-${unique}@example.test`

    await createAuthStorageState({
      chromium,
      baseUrl: stack.baseUrl,
      storageStatePath: learnerStoragePath,
      email: learnerEmail,
      returnToPath: '/learn',
      waitForTestId: 'auth-user-email',
      waitForTestIdTimeoutMs: 90000,
    })

    const saveData = await graphqlRequest({
      token: publisherToken,
      query: `mutation SaveCourse($input: CourseInput!) {
        upsertCourse(input: $input) {
          id
          title
          stripePriceId
        }
      }`,
      variables: {
        input: {
          id: `course-${unique}`,
          title: `Paid UI E2E ${unique}`,
          description: `Real Stripe hosted checkout flow ${unique}`,
          priceCents: 50,
          currency: 'eur',
          modules: [
            {
              id: `module-${unique}`,
              title: `Module ${unique}`,
              order: 1,
              lessons: [
                {
                  id: `lesson-${unique}`,
                  title: `Lesson ${unique}`,
                  order: 1,
                  contents: [],
                  contentPages: [],
                  exercises: [],
                },
              ],
            },
          ],
        },
      },
    })

    const savedCourse = saveData.upsertCourse
    assert.ok(savedCourse.stripePriceId)

    await graphqlRequest({
      token: publisherToken,
      query: `mutation PublishCourse($courseId: String!) {
        publishCourseDraft(courseId: $courseId) {
          id
          title
        }
      }`,
      variables: { courseId: savedCourse.id },
    })

    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      storageState: learnerStoragePath,
    })
    const page = await context.newPage()

    try {
      await page.goto(`${stack.baseUrl}/learn`, { waitUntil: 'networkidle' })
      await page.goto(`${stack.baseUrl}/courses`, { waitUntil: 'networkidle' })

      const courseCard = page
        .locator('.course-card')
        .filter({ hasText: savedCourse.title })
        .first()
      await courseCard.waitFor({ state: 'visible', timeout: 60000 })
      await courseCard.getByRole('button', { name: /buy/i }).click()

      await completeStripeHostedCheckout(page, { email: learnerEmail })

      await page.waitForURL(/\/purchase\/success\?courseId=/, {
        timeout: 120000,
      })

      await page
        .getByText(
          'Please wait while we confirm payment and activate enrollment.',
        )
        .waitFor({
          state: 'visible',
          timeout: 30000,
        })

      await page
        .getByText(
          'Payment received. Enrollment is syncing. This can take a few seconds.',
        )
        .waitFor({
          state: 'visible',
          timeout: 30000,
        })

      await page
        .getByText('Enrollment confirmed. Your course is ready.')
        .waitFor({
          state: 'visible',
          timeout: 120000,
        })
      await page.getByRole('button', { name: /open my courses/i }).waitFor({
        state: 'visible',
        timeout: 120000,
      })
    } finally {
      await context.close()
      await browser.close()
    }
  },
)

test(
  'learner progression submission and enrollment gating behave correctly',
  { timeout: 180000 },
  async () => {
    const publisherToken = extractAccessTokenFromStorageState(
      stack.authStoragePath,
    )

    const enrolledUnique = `${Date.now().toString(36)}-progress-enrolled`
    const unenrolledUnique = `${Date.now().toString(36)}-progress-unenrolled`

    const enrolledStoragePath = path.join(
      stack.authStorageDir,
      `learner-${enrolledUnique}-storage-state.json`,
    )
    const unenrolledStoragePath = path.join(
      stack.authStorageDir,
      `learner-${unenrolledUnique}-storage-state.json`,
    )

    await createAuthStorageState({
      chromium,
      baseUrl: stack.baseUrl,
      storageStatePath: enrolledStoragePath,
      email: `learner-${enrolledUnique}@example.test`,
      returnToPath: '/learn',
      waitForTestId: 'auth-user-email',
      waitForTestIdTimeoutMs: 90000,
    })

    await createAuthStorageState({
      chromium,
      baseUrl: stack.baseUrl,
      storageStatePath: unenrolledStoragePath,
      email: `learner-${unenrolledUnique}@example.test`,
      returnToPath: '/learn',
      waitForTestId: 'auth-user-email',
      waitForTestIdTimeoutMs: 90000,
    })

    const enrolledToken =
      extractAccessTokenFromStorageState(enrolledStoragePath)
    const unenrolledToken = extractAccessTokenFromStorageState(
      unenrolledStoragePath,
    )

    const seedCourseId = 'course-german-b1-alltagskommunikation'

    const enrolledCourseBefore = await graphqlRequest({
      token: enrolledToken,
      query: `query LearnerCourseBefore($id: String!) {
        learnerCourse(id: $id) {
          id
          versionId
          modules {
            id
            lessons {
              id
              exercises {
                id
                type
                fillInBlank {
                  steps {
                    blanks {
                      id
                      correct
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      variables: { id: seedCourseId },
    })

    assert.equal(
      enrolledCourseBefore.learnerCourse,
      null,
      'unenrolled learner should not access learnerCourse before enrollment',
    )

    const unenrolledErrors = await graphqlRequestExpectError({
      token: unenrolledToken,
      query: `mutation UpsertAttemptWithoutEnrollment($input: LearnerExerciseAttemptInput!) {
        upsertLearnerExerciseAttempt(input: $input) {
          id
        }
      }`,
      variables: {
        input: {
          courseId: seedCourseId,
          courseVersionId: '00000000-0000-0000-0000-000000000000',
          lessonId: 'lesson-b1-alltag-einstieg',
          exerciseId: 'exercise-b1-einkauf-fib',
          answers: [{ key: 'blank-b1-einkauf-fib-1', value: 'mit' }],
        },
      },
    })

    assert.equal(
      unenrolledErrors.some((error) =>
        String(error.message ?? '').includes(
          'Course is not available to this learner.',
        ),
      ),
      true,
      JSON.stringify(unenrolledErrors),
    )

    await graphqlRequest({
      token: enrolledToken,
      query: `mutation EnrollInSeed($courseId: String!) {
        enrollInCourse(courseId: $courseId) {
          id
        }
      }`,
      variables: { courseId: seedCourseId },
    })

    const enrolledCourse = await graphqlRequest({
      token: enrolledToken,
      query: `query LearnerCourseAfter($id: String!) {
        learnerCourse(id: $id) {
          id
          versionId
          modules {
            id
            lessons {
              id
              exercises {
                id
                type
                fillInBlank {
                  steps {
                    blanks {
                      id
                      correct
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      variables: { id: seedCourseId },
    })

    assert.ok(enrolledCourse.learnerCourse)

    const firstLessonWithExercise = enrolledCourse.learnerCourse.modules
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === 'lesson-b1-terminplanung')
    assert.ok(firstLessonWithExercise, 'seed lesson should be available')

    const fillExercise = firstLessonWithExercise.exercises.find(
      (exercise) => exercise.id === 'exercise-b1-termin-fib-1',
    )
    assert.ok(
      fillExercise,
      'seed course should have fill-in-the-blank exercise',
    )

    const multipleChoiceExercise = firstLessonWithExercise.exercises.find(
      (exercise) => exercise.id === 'exercise-b1-termin-mc-1',
    )
    assert.ok(
      multipleChoiceExercise,
      'seed course should have the reported multiple-choice exercise',
    )

    const answers = {}
    for (const step of fillExercise.fillInBlank.steps) {
      for (const blank of step.blanks) {
        answers[blank.id] = blank.correct
      }
    }

    const submit = await graphqlRequest({
      token: enrolledToken,
      query: `mutation UpsertAttempt($input: LearnerExerciseAttemptInput!) {
        upsertLearnerExerciseAttempt(input: $input) {
          id
          isCorrect
        }
      }`,
      variables: {
        input: {
          courseId: seedCourseId,
          courseVersionId: enrolledCourse.learnerCourse.versionId,
          lessonId: firstLessonWithExercise.id,
          exerciseId: fillExercise.id,
          answers: Object.entries(answers).map(([key, value]) => ({
            key,
            value,
          })),
        },
      },
    })

    assert.equal(submit.upsertLearnerExerciseAttempt.isCorrect, true)

    const submitMc = await graphqlRequest({
      token: enrolledToken,
      query: `mutation UpsertAttempt($input: LearnerExerciseAttemptInput!) {
        upsertLearnerExerciseAttempt(input: $input) {
          id
          isCorrect
        }
      }`,
      variables: {
        input: {
          courseId: seedCourseId,
          courseVersionId: enrolledCourse.learnerCourse.versionId,
          lessonId: firstLessonWithExercise.id,
          exerciseId: multipleChoiceExercise.id,
          answers: [{ key: 'choice-b1-termin-mc-1', value: 'true' }],
        },
      },
    })

    assert.equal(submitMc.upsertLearnerExerciseAttempt.isCorrect, true)

    const progress = await graphqlRequest({
      token: enrolledToken,
      query: `query LearnerProgress($courseId: String!) {
        learnerCourseProgress(courseId: $courseId) {
          completedExercises
          totalExercises
          modules {
            lessons {
              lessonId
              completedExercises
              totalExercises
              exerciseAttempts {
                exerciseId
                attempted
                isCorrect
              }
            }
          }
        }
      }`,
      variables: { courseId: seedCourseId },
    })

    assert.ok(progress.learnerCourseProgress)
    assert.equal(
      progress.learnerCourseProgress.completedExercises > 0,
      true,
      'completed exercises should increase after successful submission',
    )

    const lessonAttemptEntry = progress.learnerCourseProgress.modules
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.lessonId === firstLessonWithExercise.id)
      ?.exerciseAttempts.find((entry) => entry.exerciseId === fillExercise.id)

    assert.ok(lessonAttemptEntry)
    assert.equal(lessonAttemptEntry.attempted, true)
    assert.equal(lessonAttemptEntry.isCorrect, true)

    const mcAttemptEntry = progress.learnerCourseProgress.modules
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.lessonId === firstLessonWithExercise.id)
      ?.exerciseAttempts.find(
        (entry) => entry.exerciseId === multipleChoiceExercise.id,
      )

    assert.ok(mcAttemptEntry)
    assert.equal(mcAttemptEntry.attempted, true)
    assert.equal(mcAttemptEntry.isCorrect, true)

    const lessonProgressEntry = progress.learnerCourseProgress.modules
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.lessonId === firstLessonWithExercise.id)

    assert.ok(lessonProgressEntry)
    assert.equal(
      lessonProgressEntry.completedExercises >= 2,
      true,
      'lesson progress should include both reported submitted exercises',
    )
    assert.equal(
      lessonProgressEntry.totalExercises >= 3,
      true,
      'reported lesson should expose expected total exercise count',
    )

    const history = await graphqlRequest({
      token: enrolledToken,
      query: `query AttemptHistory(
        $courseId: String!
        $courseVersionId: String!
        $lessonId: String!
        $exerciseId: String!
      ) {
        learnerExerciseAttemptHistory(
          courseId: $courseId
          courseVersionId: $courseVersionId
          lessonId: $lessonId
          exerciseId: $exerciseId
        ) {
          id
          isCorrect
          answers {
            key
            value
          }
        }
      }`,
      variables: {
        courseId: seedCourseId,
        courseVersionId: enrolledCourse.learnerCourse.versionId,
        lessonId: firstLessonWithExercise.id,
        exerciseId: fillExercise.id,
      },
    })

    assert.equal(
      history.learnerExerciseAttemptHistory.length >= 1,
      true,
      'attempt history should include at least one recorded submission',
    )

    const latest =
      history.learnerExerciseAttemptHistory[
        history.learnerExerciseAttemptHistory.length - 1
      ]
    assert.equal(latest.isCorrect, true)

    const mcHistory = await graphqlRequest({
      token: enrolledToken,
      query: `query AttemptHistory(
        $courseId: String!
        $courseVersionId: String!
        $lessonId: String!
        $exerciseId: String!
      ) {
        learnerExerciseAttemptHistory(
          courseId: $courseId
          courseVersionId: $courseVersionId
          lessonId: $lessonId
          exerciseId: $exerciseId
        ) {
          id
          isCorrect
        }
      }`,
      variables: {
        courseId: seedCourseId,
        courseVersionId: enrolledCourse.learnerCourse.versionId,
        lessonId: firstLessonWithExercise.id,
        exerciseId: multipleChoiceExercise.id,
      },
    })

    assert.equal(
      mcHistory.learnerExerciseAttemptHistory.length >= 1,
      true,
      'multiple-choice attempt history should be recorded',
    )
  },
)
