const { before, after, test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn, spawnSync } = require('node:child_process')
const http = require('node:http')
const https = require('node:https')
const net = require('node:net')
const { chromium, selectors } = require('playwright')
const { createAuthStorageState } = require('./auth-storage-state')

selectors.setTestIdAttribute('data-test')

function run(command, args, options = {}) {
  return spawn(command, args, {
    stdio: 'inherit',
    detached: process.platform !== 'win32',
    ...options,
  })
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

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      'Supabase local runtime is missing API_URL or ANON_KEY values',
    )
  }

  return {
    supabaseUrl,
    publishableKey,
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
    ],
    {
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        PORT: String(stack.apiPort),
        APP_ENV: 'local',
        SUPABASE_URL: supabaseRuntime.supabaseUrl,
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
})

test(
  'publisher auth fixture stores reusable magic-link session @eval(EVAL-AUTH-LOCAL-005)',
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
        body: JSON.stringify({ query: '{ courses { id } }' }),
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
      Array.isArray(payload?.data?.courses),
      'courses query should return data',
    )
  },
)

test(
  'publisher landing and block authoring flow @eval(EVAL-PUBLISHERS-COURSE-001,EVAL-PUBLISHERS-COURSE-002,EVAL-PUBLISHERS-COURSE-003,EVAL-PUBLISHERS-COURSE-004)',
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
      await ensureStackStopped()
    }
  },
)
