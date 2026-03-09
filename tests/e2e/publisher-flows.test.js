const { before, after, test } = require('node:test')
const assert = require('node:assert/strict')
const { spawn, spawnSync } = require('node:child_process')
const net = require('node:net')
const { chromium, selectors } = require('playwright')

selectors.setTestIdAttribute('data-test')

function run(command, args, options = {}) {
  return spawn(command, args, {
    stdio: 'inherit',
    ...options,
  })
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
      const response = await fetch(url, options)
      if (response.ok) {
        return
      }
    } catch {
      // ignore and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 750))
  }
  throw new Error(`Timed out waiting for ${url}`)
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

async function waitForVisible(page, testId) {
  await page.getByTestId(testId).first().waitFor({
    state: 'visible',
    timeout: 30000,
  })
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
  const reserved = new Set()
  stack.apiPort = await findAvailablePort(4000, reserved)
  reserved.add(stack.apiPort)
  stack.webPort = await findAvailablePort(4100, reserved)
  stack.baseUrl = `http://localhost:${stack.webPort}`

  spawnSyncChecked(pnpmCmd, ['build'], {
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      VITE_GRAPHQL_ENDPOINT: `http://localhost:${stack.apiPort}/graphql`,
      VITE_AUTH_BYPASS_FOR_E2E: 'true',
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
      'API_AUTH_BYPASS_FOR_E2E:true',
    ],
    {
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        PORT: String(stack.apiPort),
        API_AUTH_BYPASS_FOR_E2E: 'true',
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
        AUTH_BYPASS_FOR_E2E: 'true',
        VITE_AUTH_BYPASS_FOR_E2E: 'true',
        API_AUTH_BYPASS_FOR_E2E: 'true',
      },
    },
  )

  stack.processes.push(api, web)

  await waitFor(`http://localhost:${stack.apiPort}/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '{ health }' }),
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
})

test(
  'publisher landing and block authoring flow @eval(EVAL-PUBLISHERS-COURSE-001,EVAL-PUBLISHERS-COURSE-002,EVAL-PUBLISHERS-COURSE-003,EVAL-PUBLISHERS-COURSE-004)',
  { timeout: 300000 },
  async () => {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })

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
      await page.goto(`${stack.baseUrl}/publish`, { waitUntil: 'networkidle' })
      await waitForVisible(page, 'publisher-landing')
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
      await browser.close()
      await ensureStackStopped()
    }
  },
)
