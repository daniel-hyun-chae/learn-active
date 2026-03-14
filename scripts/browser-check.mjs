import { chromium } from 'playwright'

const HYDRATION_PATTERNS = [
  /hydration/i,
  /did not match/i,
  /text content does not match/i,
]

function assertNoCriticalBrowserErrors(messages) {
  const critical = messages.filter((message) => {
    if (message.type !== 'error' && message.type !== 'pageerror') {
      return false
    }

    if (message.text.includes('Failed to load resource')) {
      return false
    }

    return true
  })

  if (critical.length > 0) {
    const details = critical.map((entry) => entry.text).join(' | ')
    throw new Error(`Critical browser errors detected: ${details}`)
  }

  const hydration = messages.filter((entry) =>
    HYDRATION_PATTERNS.some((pattern) => pattern.test(entry.text)),
  )

  if (hydration.length > 0) {
    const details = hydration.map((entry) => entry.text).join(' | ')
    throw new Error(`Hydration warnings/errors detected: ${details}`)
  }
}

export async function runBrowserChecks({
  baseUrl,
  unknownPath = '/__missing_route_for_check__',
  timeoutMs = 30000,
} = {}) {
  if (!baseUrl) {
    throw new Error('runBrowserChecks requires baseUrl')
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  const messages = []
  page.on('console', (msg) => {
    messages.push({ type: msg.type(), text: msg.text() })
  })
  page.on('pageerror', (error) => {
    messages.push({ type: 'error', text: String(error?.message ?? error) })
  })

  try {
    await page.goto(new URL('/learn', baseUrl).toString(), {
      waitUntil: 'networkidle',
      timeout: timeoutMs,
    })

    await Promise.any([
      page.waitForSelector('[data-test="api-health"]', {
        timeout: timeoutMs,
        state: 'attached',
      }),
      page.waitForSelector('[data-test="auth-entry-page"]', {
        timeout: timeoutMs,
        state: 'attached',
      }),
    ])

    await page.goto(new URL(unknownPath, baseUrl).toString(), {
      waitUntil: 'networkidle',
      timeout: timeoutMs,
    })
    await page.waitForSelector('[data-test="router-not-found"]', {
      timeout: timeoutMs,
      state: 'attached',
    })

    assertNoCriticalBrowserErrors(messages)
  } finally {
    await page.close()
    await browser.close()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseUrl =
    process.env.BASE_URL ?? process.argv[2] ?? 'http://localhost:4100'
  runBrowserChecks({ baseUrl })
    .then(() => {
      console.log(`[browser-check] Browser checks passed for ${baseUrl}`)
    })
    .catch((error) => {
      console.error('[browser-check] Failed:', error?.message ?? error)
      process.exitCode = 1
    })
}
