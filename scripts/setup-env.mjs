import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const envPath = path.join(root, '.env')
const examplePath = path.join(root, '.env.example')

if (fs.existsSync(envPath)) {
  console.log('[setup] .env already exists')
  process.exit(0)
}

if (!fs.existsSync(examplePath)) {
  console.error('[setup] .env.example is missing')
  process.exit(1)
}

fs.copyFileSync(examplePath, envPath)
console.log('[setup] Created .env from .env.example')
