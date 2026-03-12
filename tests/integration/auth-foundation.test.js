const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('auth local-first foundation wiring @eval(EVAL-AUTH-LOCAL-001,EVAL-AUTH-LOCAL-002,EVAL-AUTH-LOCAL-003)', () => {
  const webAuthRoute = read('apps/web/src/routes/auth.tsx')
  const webAuthProvider = read('apps/web/src/features/auth/AuthProvider.tsx')
  const webRouteGuard = read('apps/web/src/features/auth/route-guard.ts')
  const webRoot = read('apps/web/src/routes/__root.tsx')
  const mobileAuthProvider = read(
    'apps/learners-mobile/src/features/auth/MobileAuthProvider.tsx',
  )
  const mobileAppRoot = read('apps/learners-mobile/src/App.tsx')
  const supabaseConfig = read('supabase/config.toml')
  const profileSyncMigration = read(
    'supabase/migrations/0002_auth_profile_sync.sql',
  )
  const envExample = read('.env.example')

  assert.ok(webAuthRoute.includes("createFileRoute('/auth')"))
  assert.ok(webAuthProvider.includes('signInWithOAuth'))
  assert.ok(webAuthProvider.includes('signInWithOtp'))
  assert.ok(webRouteGuard.includes("to: '/auth'"))
  assert.ok(webRoot.includes('WebAuthProvider'))
  assert.ok(mobileAuthProvider.includes('MobileAuthContext'))
  assert.ok(mobileAuthProvider.includes('openAuthSessionAsync'))
  assert.ok(mobileAuthProvider.includes('signInWithOtp'))
  assert.ok(mobileAppRoot.includes('MobileAuthProvider'))

  assert.ok(supabaseConfig.includes('[auth.external.google]'))
  assert.ok(supabaseConfig.includes('learners-mobile://auth/callback'))

  assert.ok(profileSyncMigration.includes('sync_profile_from_auth_user'))
  assert.ok(profileSyncMigration.includes('on_auth_user_created_sync_profile'))
  assert.ok(
    profileSyncMigration.includes('add column if not exists email text'),
  )

  assert.ok(envExample.includes('VITE_SUPABASE_URL'))
  assert.ok(envExample.includes('EXPO_PUBLIC_SUPABASE_URL'))
  assert.ok(envExample.includes('SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID'))

  assert.ok(envExample.includes('VITE_SUPABASE_PUBLISHABLE_KEY'))
  assert.ok(envExample.includes('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'))
  assert.ok(envExample.includes('SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET'))
})
