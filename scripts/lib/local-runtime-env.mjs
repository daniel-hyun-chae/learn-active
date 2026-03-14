import fs from 'node:fs'
import path from 'node:path'

export function parseEnvAssignments(rawText) {
  const values = {}
  for (const line of rawText.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
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

export function loadLocalRuntimeEnv(rootDir, baseEnv = process.env) {
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
    ...baseEnv,
  }
}

export function isLocalStage(env) {
  const stage = (env.APP_ENV ?? env.NODE_ENV ?? 'local').trim().toLowerCase()
  return !stage || stage === 'local'
}

export function shouldAutoStartStripeListener(env) {
  if (!isLocalStage(env)) {
    return false
  }

  const autostart = (env.STRIPE_CLI_WEBHOOK_AUTOSTART ?? '1')
    .trim()
    .toLowerCase()
  if (autostart === '0' || autostart === 'false' || autostart === 'no') {
    return false
  }

  const secretKey = env.STRIPE_SECRET_KEY?.trim()
  return Boolean(secretKey)
}

export function extractStripeWebhookSecret(rawText) {
  const match = rawText.match(/\bwhsec_[A-Za-z0-9]+\b/)
  return match?.[0] ?? null
}
