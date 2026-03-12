const assert = require('node:assert/strict')
const http = require('node:http')
const https = require('node:https')

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

async function waitFor(url, options = {}, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await httpRequest(url, options)
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response
      }
    } catch {
      // ignore and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 750))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

function containsTextDeep(value, expectedLower) {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === 'string') {
    return value.toLowerCase().includes(expectedLower)
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsTextDeep(item, expectedLower))
  }

  if (typeof value === 'object') {
    return Object.values(value).some((entry) =>
      containsTextDeep(entry, expectedLower),
    )
  }

  return false
}

async function waitForMailpitMessage(email, timeoutMs = 90000) {
  const expectedLower = email.toLowerCase()
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const response = await httpRequest('http://127.0.0.1:54324/api/v1/messages')
    if (response.statusCode < 200 || response.statusCode >= 300) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      continue
    }

    const payload = JSON.parse(response.body)
    const messages = Array.isArray(payload.messages) ? payload.messages : []
    const match = messages.find((message) =>
      containsTextDeep(message, expectedLower),
    )

    if (match) {
      return match
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(`Timed out waiting for Mailpit message for ${email}`)
}

function extractUrl(text) {
  if (!text) {
    return null
  }

  const match = text.match(/https?:\/\/[^\s"'<>]+/)
  return match ? match[0] : null
}

async function extractMagicLink(messageId) {
  const response = await httpRequest(
    `http://127.0.0.1:54324/api/v1/message/${messageId}`,
  )
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`Unable to load Mailpit message details for ${messageId}`)
  }

  const payload = JSON.parse(response.body)
  const candidate =
    extractUrl(payload.Text) ??
    extractUrl(payload.HTML) ??
    extractUrl(payload.Snippet) ??
    extractUrl(JSON.stringify(payload))

  if (!candidate) {
    throw new Error(`No magic-link URL found in Mailpit message ${messageId}`)
  }

  return candidate
}

async function createAuthStorageState({
  chromium,
  baseUrl,
  storageStatePath,
  email,
  returnToPath = '/learn',
  waitForTestId,
  waitForTestIdTimeoutMs = 90000,
}) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
  })
  const page = await context.newPage()

  try {
    await waitFor('http://127.0.0.1:54324/api/v1/messages', {}, 60000)

    const authUrl = new URL('/auth', baseUrl)
    authUrl.searchParams.set('returnTo', returnToPath)

    await page.goto(authUrl.toString(), { waitUntil: 'domcontentloaded' })
    await page.getByTestId('auth-magic-link-email').fill(email)
    await page.getByTestId('auth-magic-link-send').click()
    await page.getByTestId('auth-magic-link-sent').waitFor({
      state: 'visible',
      timeout: 30000,
    })

    const message = await waitForMailpitMessage(email)
    assert.ok(message?.ID, 'Mailpit message should include an ID')
    const magicLink = await extractMagicLink(message.ID)

    await page.goto(magicLink, { waitUntil: 'networkidle' })
    const expectedOrigin = new URL(baseUrl).origin
    await page.waitForFunction(
      (origin) => window.location.origin === origin,
      expectedOrigin,
      { timeout: 60000 },
    )
    await page.waitForFunction(
      (pathName) => window.location.pathname === pathName,
      returnToPath,
      { timeout: 60000 },
    )

    await page.waitForFunction(
      () => {
        const keys = Object.keys(window.localStorage)
        return keys.some((key) => key.toLowerCase().includes('auth-token'))
      },
      { timeout: 60000 },
    )

    if (waitForTestId) {
      await page.getByTestId(waitForTestId).waitFor({
        state: 'visible',
        timeout: waitForTestIdTimeoutMs,
      })
    }

    await context.storageState({ path: storageStatePath })
  } finally {
    await context.close()
    await browser.close()
  }
}

module.exports = {
  createAuthStorageState,
  waitFor,
  waitForMailpitMessage,
}
