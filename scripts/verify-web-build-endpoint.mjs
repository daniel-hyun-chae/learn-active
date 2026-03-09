import fs from 'node:fs'
import path from 'node:path'

function parseArgs(argv) {
  const args = {
    dist: null,
    expected: null,
    env: 'unknown',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--dist') {
      args.dist = argv[index + 1] ?? null
      index += 1
      continue
    }
    if (value.startsWith('--dist=')) {
      args.dist = value.slice('--dist='.length)
      continue
    }

    if (value === '--expected') {
      args.expected = argv[index + 1] ?? null
      index += 1
      continue
    }
    if (value.startsWith('--expected=')) {
      args.expected = value.slice('--expected='.length)
      continue
    }

    if (value === '--env') {
      args.env = argv[index + 1] ?? args.env
      index += 1
      continue
    }
    if (value.startsWith('--env=')) {
      args.env = value.slice('--env='.length)
    }
  }

  return args
}

function fail(message) {
  console.error(`[verify-web-build-endpoint] ${message}`)
  process.exit(1)
}

function collectFiles(rootDirectory) {
  const pending = [rootDirectory]
  const files = []

  while (pending.length > 0) {
    const current = pending.pop()
    const entries = fs.readdirSync(current, { withFileTypes: true })

    for (const entry of entries) {
      const absolute = path.join(current, entry.name)
      if (entry.isDirectory()) {
        pending.push(absolute)
      } else if (/\.(js|html|txt|map)$/i.test(entry.name)) {
        files.push(absolute)
      }
    }
  }

  return files
}

function toRelative(paths) {
  return paths.map((filePath) => path.relative(process.cwd(), filePath))
}

function summarizeCandidateUrls(content) {
  const matches = content.match(
    /https?:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+/g,
  )
  if (!matches) {
    return []
  }

  return matches.filter((url) => {
    return url.includes('workers.dev') || url.includes('/graphql')
  })
}

function run() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.dist || !args.expected) {
    fail(
      'Usage: node scripts/verify-web-build-endpoint.mjs --dist <path> --expected <url> [--env <name>]',
    )
  }

  const distDirectory = path.resolve(process.cwd(), args.dist)
  if (
    !fs.existsSync(distDirectory) ||
    !fs.statSync(distDirectory).isDirectory()
  ) {
    fail(`Dist directory not found: ${distDirectory}`)
  }

  const files = collectFiles(distDirectory)
  if (files.length === 0) {
    fail(`No build artifacts found in ${distDirectory}`)
  }

  const matchedFiles = []
  const candidateUrls = new Set()
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8')
    for (const url of summarizeCandidateUrls(content)) {
      candidateUrls.add(url)
    }

    if (content.includes(args.expected)) {
      matchedFiles.push(filePath)
    }
  }

  console.log(
    `[verify-web-build-endpoint] Environment: ${args.env}. Expected GraphQL endpoint: ${args.expected}`,
  )
  if (candidateUrls.size > 0) {
    console.log('[verify-web-build-endpoint] Candidate embedded URLs:')
    for (const value of [...candidateUrls].sort()) {
      console.log(`- ${value}`)
    }
  }

  if (matchedFiles.length === 0) {
    fail(`Expected endpoint was not found in built assets under ${args.dist}.`)
  }

  console.log('[verify-web-build-endpoint] Endpoint found in artifact(s):')
  for (const filePath of toRelative(matchedFiles)) {
    console.log(`- ${filePath}`)
  }
}

run()
