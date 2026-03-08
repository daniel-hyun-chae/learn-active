import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const setupScript = fileURLToPath(new URL('./setup-local.mjs', import.meta.url))
const devStackScript = fileURLToPath(
  new URL('./dev-stack.mjs', import.meta.url),
)

function runAndWait(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit', ...options })
    proc.on('error', (error) => reject(error))
    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))
    })
  })
}

console.log('[dev] Running fail-hard local setup...')
await runAndWait(process.execPath, [setupScript], {
  shell: process.platform === 'win32',
  env: { ...process.env },
})

console.log('[dev] Starting development stack...')
const devStack = spawn(process.execPath, [devStackScript], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env },
})

const forwardSignal = (signal) => {
  if (!devStack.killed) {
    devStack.kill(signal)
  }
}

process.on('SIGINT', () => forwardSignal('SIGINT'))
process.on('SIGTERM', () => forwardSignal('SIGTERM'))

devStack.on('close', (code) => {
  process.exit(code ?? 1)
})
