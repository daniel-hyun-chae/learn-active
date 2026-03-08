import { createRemoteJWKSet, jwtVerify } from 'jose'

export type AuthenticatedUser = {
  id: string
  email: string | null
}

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null
let cachedIssuer: string | null = null

function getSupabaseIssuer() {
  const url = process.env.SUPABASE_URL?.trim()
  if (!url) {
    return null
  }

  return `${url.replace(/\/$/, '')}/auth/v1`
}

function getJwks(issuer: string) {
  if (cachedJwks && cachedIssuer === issuer) {
    return cachedJwks
  }

  cachedIssuer = issuer
  cachedJwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))
  return cachedJwks
}

export function getBearerToken(request: Request) {
  const header = request.headers.get('authorization')
  if (!header) {
    return null
  }

  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token.trim() || null
}

export async function verifyAccessToken(
  token: string,
): Promise<AuthenticatedUser> {
  if (process.env.API_AUTH_BYPASS_FOR_E2E === 'true') {
    return {
      id: 'e2e-user',
      email: 'e2e@example.local',
    }
  }

  const issuer = getSupabaseIssuer()
  if (!issuer) {
    throw new Error('SUPABASE_URL is required for bearer token verification.')
  }

  const jwks = getJwks(issuer)

  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience: 'authenticated',
  })

  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new Error('Access token is missing a user subject claim.')
  }

  return {
    id: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : null,
  }
}
