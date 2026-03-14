#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const isWindows = process.platform === 'win32'
const currentPid = String(process.pid)
const parentPid = String(process.ppid)
const defaultPorts = ['4000', '4100']
const requestedPorts = new Set(
  [process.env.API_PORT, process.env.WEB_PORT, ...defaultPorts].filter(Boolean),
)

const patterns = [
  'wrangler dev',
  'vite preview',
  'vite --host 0.0.0.0 --port',
  'vite dev',
  'node scripts/dev.mjs',
  'node scripts/dev-stack.mjs',
  'stripe listen --forward-to',
]

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    shell: isWindows,
    encoding: 'utf8',
  })

  if (result.error) {
    throw result.error
  }

  return result
}

function runIgnoreFailure(command, args) {
  try {
    return run(command, args)
  } catch {
    return null
  }
}

function collectUnixChildPids(rootPid, seen = new Set()) {
  if (!rootPid || seen.has(rootPid)) {
    return seen
  }

  seen.add(rootPid)
  const children = runIgnoreFailure('pgrep', ['-P', String(rootPid)])
  if (!children?.stdout) {
    return seen
  }

  for (const line of children.stdout.split(/\r?\n/)) {
    const pid = line.trim()
    if (!pid || seen.has(pid)) {
      continue
    }
    collectUnixChildPids(pid, seen)
  }

  return seen
}

function killPid(pid) {
  if (!pid) {
    return
  }

  const normalizedPid = String(pid)
  if (normalizedPid === currentPid || normalizedPid === parentPid) {
    return
  }

  if (isWindows) {
    runIgnoreFailure('taskkill', ['/PID', normalizedPid, '/T', '/F'])
    return
  }

  const pidTree = Array.from(collectUnixChildPids(normalizedPid)).reverse()
  for (const treePid of pidTree) {
    if (treePid === currentPid || treePid === parentPid) {
      continue
    }
    runIgnoreFailure('kill', ['-TERM', treePid])
  }

  runIgnoreFailure('kill', ['-TERM', normalizedPid])
  runIgnoreFailure('kill', ['-KILL', normalizedPid])
}

function collectUnixPortPids(port) {
  const pids = new Set()
  const lsof = runIgnoreFailure('lsof', ['-ti', `TCP:${port}`])
  if (lsof?.stdout) {
    for (const line of lsof.stdout.split(/\r?\n/)) {
      const pid = line.trim()
      if (pid) {
        pids.add(pid)
      }
    }
  }

  const fuser = runIgnoreFailure('fuser', ['-n', 'tcp', port])
  const combined = `${fuser?.stdout ?? ''} ${fuser?.stderr ?? ''}`
  for (const token of combined.split(/\s+/)) {
    const pid = token.trim()
    if (/^\d+$/.test(pid)) {
      pids.add(pid)
    }
  }

  return pids
}

function cleanupPorts() {
  if (isWindows) {
    for (const port of requestedPorts) {
      runIgnoreFailure('powershell.exe', [
        '-NoProfile',
        '-Command',
        `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }`,
      ])
    }
    return
  }

  for (const port of requestedPorts) {
    for (const pid of collectUnixPortPids(port)) {
      killPid(pid)
    }
  }
}

if (isWindows) {
  for (const pattern of patterns) {
    runIgnoreFailure('powershell.exe', [
      '-NoProfile',
      '-Command',
      `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${pattern}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`,
    ])
  }
} else {
  for (const pattern of patterns) {
    runIgnoreFailure('pkill', ['-f', pattern])
  }
}

cleanupPorts()

console.log(
  `[cleanup-dev-stack] Requested shutdown for local dev-stack processes and port owners (${Array.from(requestedPorts).join(', ')}).`,
)
