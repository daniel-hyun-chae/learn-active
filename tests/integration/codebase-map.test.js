const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('codebase map references valid paths', () => {
  const content = read('architecture/codebase-map.md')

  // Extract paths from markdown table cells (second column is Purpose, first is Path)
  // Pattern: | `some/path` | or | `some/path/` |
  const backtickPaths = []
  const matches = content.matchAll(/\|\s*`([^`]+)`\s*\|/g)
  for (const match of matches) {
    const candidate = match[1].trim()
    // Skip non-path values (table headers, descriptions, commands)
    if (
      candidate.includes(' ') ||
      candidate.startsWith('pnpm') ||
      candidate === '---' ||
      candidate === 'Path' ||
      candidate === 'Package' ||
      candidate === 'Purpose'
    ) {
      continue
    }
    backtickPaths.push(candidate)
  }

  assert.ok(
    backtickPaths.length > 0,
    'codebase map should reference at least one path',
  )

  const missing = []
  for (const p of backtickPaths) {
    const resolved = path.join(root, p)
    if (!fs.existsSync(resolved)) {
      missing.push(p)
    }
  }

  assert.deepStrictEqual(
    missing,
    [],
    `codebase map references paths that do not exist:\n  ${missing.join('\n  ')}`,
  )
})

test('codebase map code block paths exist', () => {
  const content = read('architecture/codebase-map.md')

  // Extract paths from the root structure code block
  // Lines like: apps/           # deployable applications
  const codeBlockMatch = content.match(/```\n([\s\S]*?)```/)
  assert.ok(codeBlockMatch, 'codebase map should have a code block')

  const lines = codeBlockMatch[1].split('\n').filter((l) => l.trim())
  const codeBlockPaths = []
  for (const line of lines) {
    const dirMatch = line.match(/^(\S+?)\s/)
    if (dirMatch) {
      // Remove trailing slash
      const dirPath = dirMatch[1].replace(/\/$/, '')
      if (dirPath && !dirPath.startsWith('#')) {
        codeBlockPaths.push(dirPath)
      }
    }
  }

  assert.ok(
    codeBlockPaths.length > 0,
    'code block should contain directory references',
  )

  const missing = []
  for (const p of codeBlockPaths) {
    const resolved = path.join(root, p)
    if (!fs.existsSync(resolved)) {
      missing.push(p)
    }
  }

  assert.deepStrictEqual(
    missing,
    [],
    `code block references directories that do not exist:\n  ${missing.join('\n  ')}`,
  )
})

test('domain glossary exists with required sections', () => {
  const content = read('architecture/domain-glossary.md')

  // Check major sections exist
  assert.ok(content.includes('# Domain Glossary'))
  assert.ok(content.includes('## Identity and Access'))
  assert.ok(content.includes('## Course Structure'))
  assert.ok(content.includes('## Exercises'))
  assert.ok(content.includes('## Learner Progress'))

  // Check key terms are defined
  const requiredTerms = [
    'Profile',
    'Owner',
    'OwnerMember',
    'Publisher',
    'Learner',
    'Course',
    'CourseVersion',
    'CoursePublication',
    'Module',
    'Lesson',
    'Exercise',
    'Enrollment',
  ]
  for (const term of requiredTerms) {
    assert.ok(
      content.includes(`### ${term}`),
      `glossary should define term: ${term}`,
    )
  }

  // Check that role-based concepts are distinguished from table-backed entities
  assert.ok(
    content.includes('A role, not a database table'),
    'glossary should distinguish role-based concepts from table-backed entities',
  )
})

test('session bootstrap rule lists required reads', () => {
  const content = read('.opencode/rules/session-bootstrap.md')

  assert.ok(content.includes('# Session Bootstrap'))
  assert.ok(content.includes('architecture/codebase-map.md'))
  assert.ok(content.includes('architecture/domain-glossary.md'))
  assert.ok(content.includes('architecture/overview.md'))
  assert.ok(content.includes('AGENTS.md'))
  assert.ok(content.includes('backlog/README.md'))
  assert.ok(content.includes('## When to Re-read'))
})
