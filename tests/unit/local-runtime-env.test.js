const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

test('local runtime env loader merges .env, .env.local, and process env @eval(EVAL-PLATFORM-DOCKER-002)', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-active-env-'))

  try {
    fs.writeFileSync(
      path.join(tempRoot, '.env'),
      [
        'APP_ENV=local',
        'STRIPE_SECRET_KEY=sk_test_from_env',
        'API_PORT=4000',
      ].join('\n'),
      'utf8',
    )
    fs.writeFileSync(
      path.join(tempRoot, '.env.local'),
      ['API_PORT=4010', 'STRIPE_CLI_WEBHOOK_AUTOSTART=0'].join('\n'),
      'utf8',
    )

    const mod = await import('../../scripts/lib/local-runtime-env.mjs')
    const env = mod.loadLocalRuntimeEnv(tempRoot, { API_PORT: '4020' })

    assert.equal(env.APP_ENV, 'local')
    assert.equal(env.STRIPE_SECRET_KEY, 'sk_test_from_env')
    assert.equal(env.STRIPE_CLI_WEBHOOK_AUTOSTART, '0')
    assert.equal(env.API_PORT, '4020')
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('local Stripe CLI auto-start decision and secret extraction @eval(EVAL-PUBLISHERS-COURSE-007)', async () => {
  const mod = await import('../../scripts/lib/local-runtime-env.mjs')

  assert.equal(
    mod.shouldAutoStartStripeListener({
      APP_ENV: 'local',
      STRIPE_SECRET_KEY: 'sk_test_123',
    }),
    true,
  )
  assert.equal(
    mod.shouldAutoStartStripeListener({
      APP_ENV: 'local',
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_WEBHOOK_SECRET: 'whsec_existing',
    }),
    true,
  )
  assert.equal(
    mod.shouldAutoStartStripeListener({
      APP_ENV: 'staging',
      STRIPE_SECRET_KEY: 'sk_test_123',
    }),
    false,
  )
  assert.equal(
    mod.extractStripeWebhookSecret(
      'Ready! Your webhook signing secret is whsec_abc123.',
    ),
    'whsec_abc123',
  )
})
