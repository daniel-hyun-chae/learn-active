#!/usr/bin/env node

import { spawn } from 'node:child_process'

const expectedTests = [
  'publisher auth fixture stores reusable magic-link session',
  'publisher landing and block authoring flow',
  'paid course publication and enrollment flow',
  'paid course enrollment also succeeds for async Stripe success webhook',
  'real Stripe hosted checkout updates purchase success UI to enrolled',
]

const seenPassingTests = new Set()
let sawFailure = false
let forcedExit = false

const child = spawn(
  process.execPath,
  ['--test', 'tests/e2e/publisher-flows.test.js'],
  {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  },
)

function handleChunk(chunk, stream) {
  const text = String(chunk)
  stream.write(text)

  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('not ok ')) {
      sawFailure = true
    }

    if (line.startsWith('ok ')) {
      for (const testName of expectedTests) {
        if (line.includes(testName)) {
          seenPassingTests.add(testName)
        }
      }
    }
  }

  if (
    !forcedExit &&
    !sawFailure &&
    seenPassingTests.size === expectedTests.length
  ) {
    forcedExit = true
    setTimeout(() => {
      if (child.exitCode === null) {
        child.kill('SIGTERM')
      }
    }, 1000)
  }
}

child.stdout.on('data', (chunk) => handleChunk(chunk, process.stdout))
child.stderr.on('data', (chunk) => handleChunk(chunk, process.stderr))

child.on('exit', (code, signal) => {
  if (!sawFailure && seenPassingTests.size === expectedTests.length) {
    process.exit(0)
  }

  if (signal) {
    process.exit(1)
  }

  process.exit(code ?? 1)
})
