import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const packageJsonPath = path.join(root, 'package.json')
const lockfilePath = path.join(root, 'pnpm-lock.yaml')

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!fs.existsSync(packageJsonPath)) {
  fail('[validate-pnpm-lockfile-major] package.json not found')
}

if (!fs.existsSync(lockfilePath)) {
  fail('[validate-pnpm-lockfile-major] pnpm-lock.yaml not found')
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const packageManager = String(packageJson.packageManager ?? '')
const packageManagerMatch = packageManager.match(/pnpm@(\d+)/)
const expectedMajor = packageManagerMatch ? packageManagerMatch[1] : ''

const lockfileText = fs.readFileSync(lockfilePath, 'utf8')
const lockfileMatch = lockfileText.match(/^lockfileVersion:\s*'?(\d+)/m)
const lockfileMajor = lockfileMatch ? lockfileMatch[1] : ''

console.log(`Expected pnpm major from packageManager: ${expectedMajor}`)
console.log(`Detected lockfile major: ${lockfileMajor}`)

if (!expectedMajor || !lockfileMajor) {
  fail(
    '[validate-pnpm-lockfile-major] Unable to determine pnpm major or lockfile major.',
  )
}

if (expectedMajor !== lockfileMajor) {
  fail(
    `pnpm major and lockfile major mismatch. Regenerate pnpm-lock.yaml with pnpm ${expectedMajor}.`,
  )
}

console.log('pnpm major and lockfile major are aligned.')
