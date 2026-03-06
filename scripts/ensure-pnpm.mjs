import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const nodeModulesPath = path.join(root, 'node_modules')
const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const turboBin = path.join(
  nodeModulesPath,
  '.bin',
  process.platform === 'win32' ? 'turbo.cmd' : 'turbo',
)
const tscBin = path.join(
  nodeModulesPath,
  '.bin',
  process.platform === 'win32' ? 'tsc.cmd' : 'tsc',
)
const viteBin = path.join(
  nodeModulesPath,
  '.bin',
  process.platform === 'win32' ? 'vite.cmd' : 'vite',
)
const apiTscBin = path.join(
  root,
  'apps',
  'api',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsc.cmd' : 'tsc',
)
const webViteBin = path.join(
  root,
  'apps',
  'web',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vite.cmd' : 'vite',
)
const webViteModule = path.join(
  root,
  'apps',
  'web',
  'node_modules',
  'vite',
  'bin',
  'vite.js',
)
const apiTscModule = path.join(
  root,
  'apps',
  'api',
  'node_modules',
  'typescript',
  'bin',
  'tsc',
)
const webNodeModulesPath = path.join(root, 'apps', 'web', 'node_modules')
const apiNodeModulesPath = path.join(root, 'apps', 'api', 'node_modules')
const workspaceFile = path.join(root, 'pnpm-workspace.yaml')
const workspacePackages = getWorkspacePackages()
const workspacePackagesWithDeps = workspacePackages.filter((pkg) =>
  packageHasDependencies(pkg),
)
const workspaceNodeModules = workspacePackages.map((pkg) =>
  path.join(pkg, 'node_modules'),
)
const workspaceNodeModulesWithDeps = workspacePackagesWithDeps.map((pkg) =>
  path.join(pkg, 'node_modules'),
)
const missingWorkspaceNodeModules = () =>
  workspaceNodeModulesWithDeps.filter(
    (nodeModules) => !fs.existsSync(nodeModules),
  )

function log(message) {
  console.log(`[preflight] ${message}`)
}

function repairPermissions(targetPath) {
  if (process.platform !== 'win32') return
  if (!fs.existsSync(targetPath)) return
  const user = process.env.USERNAME || process.env.USER || 'Users'
  const cmd = `takeown /F "${targetPath}" /R /D Y && icacls "${targetPath}" /grant "${user}":F /T`
  spawnSync('cmd', ['/c', cmd], {
    stdio: 'inherit',
    shell: false,
  })
}

function normalizeWindowsAttributes(targetPath) {
  if (process.platform !== 'win32') return
  if (!fs.existsSync(targetPath)) return
  const safePath = targetPath.replace(/'/g, "''")
  spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `if (Test-Path -LiteralPath '${safePath}') { Get-ChildItem -LiteralPath '${safePath}' -Force -Recurse | ForEach-Object { $_.Attributes = 'Normal' } }`,
    ],
    {
      stdio: 'inherit',
      shell: false,
    },
  )
}

function removeIgnoredEntries(targetPath) {
  if (!fs.existsSync(targetPath)) return
  repairPermissions(targetPath)
  normalizeWindowsAttributes(targetPath)
  if (process.platform === 'win32') {
    normalizeWindowsAttributes(targetPath)
    const safePath = targetPath.replace(/'/g, "''")
    spawnSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Get-ChildItem -LiteralPath '${safePath}' -Filter '.ignored*' -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue`,
      ],
      {
        stdio: 'inherit',
        shell: false,
      },
    )
  }

  if (hasIgnoredEntries(targetPath)) {
    removeNodeModules(targetPath)
  }

  if (hasIgnoredEntries(targetPath)) {
    console.error(
      '[preflight] Failed to remove .ignored_* entries in',
      targetPath,
    )
    process.exit(1)
  }
}

function cleanupIgnoredArtifacts(targetPath) {
  if (process.platform !== 'win32') return
  if (!fs.existsSync(targetPath)) return
  repairPermissions(targetPath)
  normalizeWindowsAttributes(targetPath)
  const safePath = targetPath.replace(/'/g, "''")
  const user = process.env.USERNAME || process.env.USER || 'Users'
  const command = `Get-ChildItem -LiteralPath '${safePath}' -Filter '.ignored*' -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object { try { $_.Attributes = 'Normal' } catch {}; try { & icacls $_.FullName /grant '${user}:F' /T /C | Out-Null } catch {}; Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }`
  spawnSync('powershell', ['-NoProfile', '-Command', command], {
    stdio: 'inherit',
    shell: false,
  })
}

function cleanupRepoIgnoredArtifacts() {
  if (process.platform !== 'win32') return
  repairPermissions(root)
  normalizeWindowsAttributes(root)
  const safePath = root.replace(/'/g, "''")
  const user = process.env.USERNAME || process.env.USER || 'Users'
  const command = `Get-ChildItem -LiteralPath '${safePath}' -Filter '.ignored*' -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object { try { $_.Attributes = 'Normal' } catch {}; try { & icacls $_.FullName /grant '${user}:F' /T /C | Out-Null } catch {}; Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }`
  spawnSync('powershell', ['-NoProfile', '-Command', command], {
    stdio: 'inherit',
    shell: false,
  })
}

function repairRepoPermissions() {
  if (process.platform !== 'win32') return
  log('Repairing repository permissions...')
  repairPermissions(root)
  normalizeWindowsAttributes(root)
}

function outputHasPermissionError(output) {
  return /EACCES|EPERM|permission denied/i.test(output)
}

function removeWorkspaceNodeModules() {
  workspacePackages.forEach((pkg) =>
    removeNodeModules(path.join(pkg, 'node_modules')),
  )
}

function removeScopedLinks(targetPath) {
  const scopedPath = path.join(targetPath, '@app')
  if (fs.existsSync(scopedPath)) {
    removeNodeModules(scopedPath)
  }
}

function cleanupWorkspaceArtifacts() {
  cleanupRepoIgnoredArtifacts()
  removeScopedLinks(nodeModulesPath)
  workspaceNodeModules.forEach(removeScopedLinks)
  removeIgnoredEntries(nodeModulesPath)
  workspaceNodeModules.forEach(removeIgnoredEntries)
}

function extractIgnoredPaths(output) {
  const windowsMatches =
    output.match(/[A-Za-z]:\\[^\s"']+?node_modules\\.*?\.ignored[^\s"']+/g) ??
    []
  const posixMatches =
    output.match(/\/[\w\-./]+?\/node_modules\/.*?\/\.ignored[^\s"']+/g) ?? []
  return Array.from(new Set([...windowsMatches, ...posixMatches]))
}

function removeIgnoredPath(ignoredPath) {
  const parentDir = path.dirname(ignoredPath)
  repairPermissions(parentDir)
  normalizeWindowsAttributes(parentDir)

  if (process.platform === 'win32') {
    const safePath = ignoredPath.replace(/'/g, "''")
    spawnSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Remove-Item -LiteralPath '${safePath}' -Recurse -Force -ErrorAction SilentlyContinue`,
      ],
      {
        stdio: 'inherit',
        shell: false,
      },
    )
  } else {
    spawnSync('rm', ['-rf', ignoredPath], { stdio: 'inherit', shell: false })
  }
}

function nodeModulesRootFor(ignoredPath) {
  const parts = ignoredPath.split(/[\\/]+/)
  const nodeModulesIndex = parts.lastIndexOf('node_modules')
  if (nodeModulesIndex === -1) return null
  const rootParts = parts.slice(0, nodeModulesIndex + 1)
  return rootParts.join(path.sep)
}

function removeNodeModulesForIgnoredPath(ignoredPath) {
  const nodeModulesRoot = nodeModulesRootFor(ignoredPath)
  if (nodeModulesRoot) {
    removeNodeModules(nodeModulesRoot)
    return
  }
  removeIgnoredPath(ignoredPath)
}

function runInstall({ cleanRoot, cleanWorkspace, attempt = 0 } = {}) {
  if (cleanRoot || cleanWorkspace) {
    log('Cleaning existing node_modules before install')
    if (cleanRoot) {
      removeNodeModules(nodeModulesPath)
    }
    if (cleanWorkspace) {
      removeWorkspaceNodeModules()
    }
  }
  cleanupWorkspaceArtifacts()
  log('Running pnpm install...')
  const install = spawnSync(pnpmCmd, ['install', '--prod=false'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 1024 * 1024 * 20,
  })

  if (install.stdout) process.stdout.write(install.stdout)
  if (install.stderr) process.stderr.write(install.stderr)

  if (install.error) {
    console.error('[preflight] pnpm install failed to start', install.error)
    process.exit(1)
  }

  if (install.status !== 0) {
    console.error(`[preflight] pnpm install failed with ${install.status}`)
    const output = `${install.stdout ?? ''}\n${install.stderr ?? ''}`
    const ignoredPaths = extractIgnoredPaths(output)
    const detectedIgnored = collectIgnoredEntries([
      nodeModulesPath,
      ...workspaceNodeModules,
    ])
    const allIgnored = Array.from(
      new Set([...ignoredPaths, ...detectedIgnored]),
    )

    if (outputHasPermissionError(output) && attempt < 5) {
      repairRepoPermissions()
      cleanupRepoIgnoredArtifacts()
      return runInstall({
        cleanRoot: true,
        cleanWorkspace: true,
        attempt: attempt + 1,
      })
    }

    if (allIgnored.length && attempt < 5) {
      log('Cleaning .ignored_* artifacts detected during install')
      allIgnored.forEach(removeNodeModulesForIgnoredPath)
      cleanupWorkspaceArtifacts()
      return runInstall({
        cleanRoot: false,
        cleanWorkspace: false,
        attempt: attempt + 1,
      })
    }

    if (attempt < 5) {
      log('Retrying pnpm install after cleanup...')
      return runInstall({
        cleanRoot: true,
        cleanWorkspace: true,
        attempt: attempt + 1,
      })
    }

    process.exit(install.status ?? 1)
  }

  return true
}

function canRunPackageBin(filter, bin, args = ['--version']) {
  log(`Verifying ${filter} ${bin} via pnpm exec`)
  const result = spawnSync(
    pnpmCmd,
    ['--filter', filter, 'exec', bin, ...args],
    {
      encoding: 'utf8',
      shell: process.platform === 'win32',
    },
  )

  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  if (result.error) {
    console.error(
      `[preflight] pnpm exec ${bin} failed to start for ${filter}`,
      result.error,
    )
    return false
  }

  return result.status === 0
}

function packageBinaryAvailable({ filter, bin, modulePath }) {
  if (fs.existsSync(modulePath)) return true
  return canRunPackageBin(filter, bin)
}

function getMissingPackageBins() {
  const bins = [
    {
      name: 'vite',
      filter: '@app/web',
      bin: 'vite',
      modulePath: webViteModule,
    },
    {
      name: 'tsc',
      filter: '@app/api',
      bin: 'tsc',
      modulePath: apiTscModule,
    },
  ]

  return bins.filter((bin) => !packageBinaryAvailable(bin))
}

function getPackageNodeModulesPath(filter) {
  if (filter === '@app/web') return webNodeModulesPath
  if (filter === '@app/api') return apiNodeModulesPath
  return null
}

function getWorkspacePackages() {
  if (!fs.existsSync(workspaceFile)) return []
  const contents = fs.readFileSync(workspaceFile, 'utf8')
  const patterns = contents
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())

  const packages = []
  for (const pattern of patterns) {
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2)
      const basePath = path.join(root, base)
      if (!fs.existsSync(basePath)) continue
      const dirs = fs.readdirSync(basePath, { withFileTypes: true })
      dirs
        .filter((dir) => dir.isDirectory())
        .forEach((dir) => packages.push(path.join(basePath, dir.name)))
      continue
    }

    packages.push(path.join(root, pattern))
  }

  return packages
}

function packageHasDependencies(packagePath) {
  const manifestPath = path.join(packagePath, 'package.json')
  if (!fs.existsSync(manifestPath)) return false
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const dependencyCount =
      Object.keys(manifest.dependencies ?? {}).length +
      Object.keys(manifest.devDependencies ?? {}).length +
      Object.keys(manifest.optionalDependencies ?? {}).length
    return dependencyCount > 0
  } catch (error) {
    console.warn(
      `[preflight] Failed to parse ${manifestPath}; assuming dependencies`,
      error,
    )
    return true
  }
}

function hasIgnoredEntries(targetPath) {
  if (!fs.existsSync(targetPath)) return false
  try {
    const entries = fs.readdirSync(targetPath)
    return entries.some((entry) => entry.startsWith('.ignored'))
  } catch (error) {
    console.error('[preflight] Failed to read', targetPath, error)
    repairPermissions(targetPath)
    try {
      const entries = fs.readdirSync(targetPath)
      return entries.some((entry) => entry.startsWith('.ignored'))
    } catch (retryError) {
      console.error('[preflight] Failed to read after repair', targetPath)
      return true
    }
  }
}

function collectIgnoredEntries(targetPaths) {
  const ignored = []
  for (const targetPath of targetPaths) {
    if (!fs.existsSync(targetPath)) continue
    try {
      const entries = fs.readdirSync(targetPath)
      entries
        .filter((entry) => entry.startsWith('.ignored'))
        .forEach((entry) => ignored.push(path.join(targetPath, entry)))
    } catch (error) {
      console.error(
        '[preflight] Failed to scan for ignored entries',
        targetPath,
      )
      ignored.push(targetPath)
    }
  }
  return ignored
}

function removeNodeModules(targetPath) {
  if (!fs.existsSync(targetPath)) return
  repairPermissions(targetPath)
  normalizeWindowsAttributes(targetPath)
  try {
    fs.rmSync(targetPath, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    })
    if (!fs.existsSync(targetPath)) return
  } catch (error) {
    console.error('[preflight] Failed to remove', targetPath, error)
  }

  if (process.platform === 'win32') {
    const safePath = targetPath.replace(/'/g, "''")
    normalizeWindowsAttributes(targetPath)
    spawnSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Remove-Item -LiteralPath '${safePath}' -Recurse -Force -ErrorAction SilentlyContinue`,
      ],
      {
        stdio: 'inherit',
        shell: false,
      },
    )

    if (fs.existsSync(targetPath)) {
      repairPermissions(targetPath)
      normalizeWindowsAttributes(targetPath)
      const remove = spawnSync('cmd', ['/c', `rmdir /S /Q "${targetPath}"`], {
        stdio: 'inherit',
        shell: false,
      })

      if (remove.error) {
        console.error('[preflight] Failed to remove with fallback', targetPath)
        if (!fs.existsSync(targetPath)) return
        process.exit(1)
      }

      if (remove.status !== 0) {
        if (!fs.existsSync(targetPath)) {
          console.warn(
            `[preflight] Fallback remove reported error but path is gone: ${targetPath}`,
          )
          return
        }
        console.error(`[preflight] Fallback remove failed: ${targetPath}`)
        process.exit(remove.status ?? 1)
      }
    }
  } else {
    const remove = spawnSync('rm', ['-rf', targetPath], {
      stdio: 'inherit',
      shell: false,
    })

    if (remove.error) {
      console.error('[preflight] Failed to remove with fallback', targetPath)
      if (!fs.existsSync(targetPath)) return
      process.exit(1)
    }

    if (remove.status !== 0) {
      if (!fs.existsSync(targetPath)) {
        console.warn(
          `[preflight] Fallback remove reported error but path is gone: ${targetPath}`,
        )
        return
      }
      console.error(`[preflight] Fallback remove failed: ${targetPath}`)
      process.exit(remove.status ?? 1)
    }
  }

  if (fs.existsSync(targetPath)) {
    const stalePath = `${targetPath}.stale-${Date.now()}`
    try {
      fs.renameSync(targetPath, stalePath)
      console.warn(
        `[preflight] Renamed locked node_modules to ${stalePath} (will be ignored)`,
      )
      return
    } catch (error) {
      console.error(`[preflight] Unable to remove ${targetPath}`)
      process.exit(1)
    }
  }
}

if (!fs.existsSync(nodeModulesPath)) {
  log('node_modules missing; cleaning workspace node_modules')
  removeWorkspaceNodeModules()
  log('Installing dependencies')
  runInstall({ cleanRoot: false, cleanWorkspace: false, attempt: 0 })
}

const entries = fs.readdirSync(nodeModulesPath)
const hasPnpmStore = fs.existsSync(path.join(nodeModulesPath, '.pnpm'))
const hasIgnored = entries.some((entry) => entry.startsWith('.ignored'))
const workspaceHasIgnored = workspaceNodeModules.some((dir) =>
  hasIgnoredEntries(dir),
)

if (!hasPnpmStore || hasIgnored || workspaceHasIgnored) {
  log('Detected mixed package manager artifacts; removing node_modules')
  runInstall({
    cleanRoot: !hasPnpmStore || hasIgnored,
    cleanWorkspace: true,
    attempt: 0,
  })
}

let missingWorkspace = missingWorkspaceNodeModules()
if (missingWorkspace.length) {
  log(
    `Missing workspace node_modules in ${missingWorkspace.length} packages; reinstalling dependencies`,
  )
  runInstall({ cleanRoot: false, cleanWorkspace: false, attempt: 0 })
  missingWorkspace = missingWorkspaceNodeModules()
  if (missingWorkspace.length) {
    log('Workspace node_modules still missing; forcing clean reinstall')
    runInstall({ cleanRoot: false, cleanWorkspace: true, attempt: 1 })
    missingWorkspace = missingWorkspaceNodeModules()
    if (missingWorkspace.length) {
      console.error(
        `[preflight] Workspace node_modules still missing in ${missingWorkspace.length} packages`,
      )
      process.exit(1)
    }
  }
}

function getMissingBins() {
  const bins = [
    { name: 'tsc', paths: [tscBin, apiTscBin] },
    { name: 'vite', paths: [viteBin, webViteBin] },
  ]

  return bins.filter(
    (bin) => !bin.paths.some((binPath) => fs.existsSync(binPath)),
  )
}

if (!fs.existsSync(turboBin)) {
  log('Missing turbo binary; reinstalling dependencies')
  runInstall({ cleanRoot: false, cleanWorkspace: true, attempt: 0 })
  if (!fs.existsSync(turboBin)) {
    log('Turbo still missing; forcing clean reinstall')
    runInstall({ cleanRoot: true, cleanWorkspace: true, attempt: 1 })
  }
  if (!fs.existsSync(turboBin)) {
    console.error('[preflight] Turbo still missing after reinstall')
    process.exit(1)
  }
}

let missingBins = getMissingBins()

if (missingBins.length) {
  log(
    `Missing build tools (${missingBins.map((bin) => bin.name).join(', ')}); reinstalling dependencies`,
  )
  runInstall({ cleanRoot: true, cleanWorkspace: true, attempt: 0 })

  missingBins = getMissingBins()
  if (missingBins.length) {
    console.error(
      `[preflight] Missing build tools after reinstall: ${missingBins
        .map((bin) => bin.name)
        .join(', ')}`,
    )
    process.exit(1)
  }
}

let missingPackageBins = getMissingPackageBins()

if (missingPackageBins.length) {
  log(
    `Missing package executables (${missingPackageBins
      .map((bin) => bin.name)
      .join(', ')}); installing package dependencies`,
  )
  for (const bin of missingPackageBins) {
    log(`Installing ${bin.filter} dependencies`)
    ensureWorkspaceInstall(bin.filter)
  }
  missingPackageBins = getMissingPackageBins()
  if (missingPackageBins.length) {
    log('Package executables still missing; reinstalling dependencies')
    runInstall({ cleanRoot: true, cleanWorkspace: true, attempt: 0 })
    missingPackageBins = getMissingPackageBins()
    for (const bin of missingPackageBins) {
      log(`Reinstalling ${bin.filter} dependencies`)
      ensureWorkspaceInstall(bin.filter, { force: true })
    }
    missingPackageBins = getMissingPackageBins()
    if (missingPackageBins.length) {
      console.error(
        `[preflight] Package executables still missing after reinstall: ${missingPackageBins
          .map((bin) => `${bin.filter}:${bin.name}`)
          .join(', ')}`,
      )
      process.exit(1)
    }
  }
}

log('pnpm dependencies look consistent')
function ensureWorkspaceInstall(filter, options = {}) {
  const dependencyFilter = `${filter}...`
  const args = ['--filter', dependencyFilter, 'install', '--prod=false']
  if (options.force) {
    args.push('--force')
  }
  const targetNodeModules = getPackageNodeModulesPath(filter)
  const maxAttempts = options.attempts ?? 3
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (targetNodeModules) {
      log(`Cleaning ignored artifacts for ${filter} before install`)
      cleanupIgnoredArtifacts(targetNodeModules)
      removeIgnoredEntries(targetNodeModules)
    }

    const install = spawnSync(pnpmCmd, args, {
      encoding: 'utf8',
      shell: process.platform === 'win32',
      maxBuffer: 1024 * 1024 * 20,
    })

    if (install.stdout) process.stdout.write(install.stdout)
    if (install.stderr) process.stderr.write(install.stderr)

    if (install.error) {
      console.error('[preflight] pnpm install failed to start', install.error)
      process.exit(1)
    }

    if (install.status === 0) return

    console.error(`[preflight] pnpm install failed with ${install.status}`)
    const output = `${install.stdout ?? ''}
${install.stderr ?? ''}`
    const ignoredPaths = extractIgnoredPaths(output)
    const detectedIgnored = targetNodeModules
      ? collectIgnoredEntries([targetNodeModules])
      : []
    const allIgnored = Array.from(
      new Set([...ignoredPaths, ...detectedIgnored]),
    )

    if (outputHasPermissionError(output) && attempt < maxAttempts - 1) {
      repairRepoPermissions()
      cleanupRepoIgnoredArtifacts()
      if (targetNodeModules) {
        log(`Removing ${filter} node_modules after permission error`)
        removeNodeModules(targetNodeModules)
      }
    }

    if (allIgnored.length && attempt < maxAttempts - 1) {
      log('Cleaning .ignored_* artifacts detected during package install')
      allIgnored.forEach(removeNodeModulesForIgnoredPath)
    }

    if (attempt < maxAttempts - 1) {
      log('Retrying pnpm install after cleanup...')
      continue
    }

    process.exit(install.status ?? 1)
  }
}
