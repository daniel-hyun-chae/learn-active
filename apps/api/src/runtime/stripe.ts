type StripeCheckoutChannel = 'WEB' | 'MOBILE'

type CreateCoursePriceArgs = {
  courseId: string
  courseTitle: string
  amountCents: number
  currency: string
  existingPriceId: string | null
}

type CreateCheckoutSessionArgs = {
  stripePriceId: string
  userId: string
  courseId: string
  courseSlug: string
  channel: StripeCheckoutChannel
  requestOrigin: string
}

type StripeWebhookEvent = {
  id: string
  type: string
  data?: {
    object?: {
      id?: string
      payment_intent?: string | { id?: string } | null
      payment_status?: string
      status?: string
      amount_total?: number
      currency?: string
      metadata?: {
        user_id?: string
        course_id?: string
      }
    }
  }
}

export type StripeWebhookSessionCompleted = {
  eventType: string
  id: string
  paymentIntentId: string | null
  paymentStatus: string
  status: string | null
  amountTotal: number | null
  currency: string | null
  userId: string | null
  courseId: string | null
}

export type StripeService = {
  createOrUpdateCoursePrice: (
    args: CreateCoursePriceArgs,
  ) => Promise<{ stripePriceId: string }>
  createCheckoutSession: (
    args: CreateCheckoutSessionArgs,
  ) => Promise<{ sessionId: string; url: string }>
  parseCheckoutCompletedEvent: (args: {
    payload: string
    stripeSignature: string
  }) => Promise<StripeWebhookSessionCompleted | null>
}

const STRIPE_API_BASE = 'https://api.stripe.com/v1'
const WEBHOOK_TOLERANCE_SECONDS = 300

function assertStripeSecret(secretKey: string | null): string {
  if (!secretKey) {
    throw new Error('Stripe secret key is not configured.')
  }
  return secretKey
}

function toLowerTrimmed(value: string) {
  return value.trim().toLowerCase()
}

function encodeFormBody(entries: Array<[string, string | number | undefined]>) {
  const params = new URLSearchParams()
  entries.forEach(([key, value]) => {
    if (value === undefined) {
      return
    }
    params.append(key, String(value))
  })
  return params
}

async function hmacSha256Hex(secret: string, payload: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload),
  )
  return Array.from(new Uint8Array(signature))
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('')
}

function parseStripeSignatureHeader(signatureHeader: string) {
  const parts = signatureHeader.split(',').map((part) => part.trim())
  let timestamp: number | null = null
  const signatures: string[] = []

  parts.forEach((part) => {
    const [key, value] = part.split('=')
    if (!key || !value) {
      return
    }
    if (key === 't') {
      const parsed = Number(value)
      timestamp = Number.isFinite(parsed) ? parsed : null
      return
    }
    if (key === 'v1') {
      signatures.push(value)
    }
  })

  return { timestamp, signatures }
}

function toIsoNowSeconds() {
  return Math.floor(Date.now() / 1000)
}

export function createStripeService(config: {
  secretKey: string
  webhookSecret: string
}): StripeService {
  const secretKey = assertStripeSecret(config.secretKey)
  const webhookSecret = config.webhookSecret

  async function stripeRequest<T>(args: {
    method: 'GET' | 'POST'
    path: string
    body?: URLSearchParams
  }): Promise<T> {
    const response = await fetch(`${STRIPE_API_BASE}${args.path}`, {
      method: args.method,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        ...(args.body
          ? {
              'Content-Type': 'application/x-www-form-urlencoded',
            }
          : {}),
      },
      body: args.body,
    })

    const payload = (await response.json()) as
      | (T & { error?: { message?: string } })
      | { error?: { message?: string } }

    if (!response.ok) {
      const message =
        payload && typeof payload === 'object' && 'error' in payload
          ? payload.error?.message
          : null
      throw new Error(message ?? `Stripe request failed (${response.status}).`)
    }

    return payload as T
  }

  async function getProductIdForPrice(stripePriceId: string) {
    const price = await stripeRequest<{
      id: string
      product: string | { id?: string }
    }>({
      method: 'GET',
      path: `/prices/${encodeURIComponent(stripePriceId)}`,
    })
    if (typeof price.product === 'string') {
      return price.product
    }
    return price.product?.id ?? null
  }

  async function createProduct(courseId: string, courseTitle: string) {
    const product = await stripeRequest<{ id: string }>({
      method: 'POST',
      path: '/products',
      body: encodeFormBody([
        ['name', courseTitle],
        ['metadata[course_id]', courseId],
      ]),
    })
    return product.id
  }

  async function createPrice(args: {
    productId: string
    amountCents: number
    currency: string
    courseId: string
  }) {
    const price = await stripeRequest<{ id: string }>({
      method: 'POST',
      path: '/prices',
      body: encodeFormBody([
        ['product', args.productId],
        ['unit_amount', args.amountCents],
        ['currency', args.currency],
        ['metadata[course_id]', args.courseId],
      ]),
    })
    return price.id
  }

  return {
    async createOrUpdateCoursePrice(args) {
      const normalizedCurrency = toLowerTrimmed(args.currency)
      const productId = args.existingPriceId
        ? await getProductIdForPrice(args.existingPriceId).catch(() => null)
        : null

      const ensuredProductId =
        productId ?? (await createProduct(args.courseId, args.courseTitle))

      const stripePriceId = await createPrice({
        productId: ensuredProductId,
        amountCents: args.amountCents,
        currency: normalizedCurrency,
        courseId: args.courseId,
      })

      return { stripePriceId }
    },

    async createCheckoutSession(args) {
      const isMobile = args.channel === 'MOBILE'
      const successUrl = isMobile
        ? `learners-mobile://purchase/success?courseId=${encodeURIComponent(args.courseId)}`
        : `${args.requestOrigin}/purchase/success?courseId=${encodeURIComponent(args.courseId)}`
      const cancelUrl = isMobile
        ? `learners-mobile://purchase/cancel?courseId=${encodeURIComponent(args.courseId)}`
        : `${args.requestOrigin}/courses/${encodeURIComponent(args.courseSlug)}`

      const session = await stripeRequest<{ id: string; url: string }>({
        method: 'POST',
        path: '/checkout/sessions',
        body: encodeFormBody([
          ['mode', 'payment'],
          ['payment_method_types[0]', 'card'],
          ['line_items[0][price]', args.stripePriceId],
          ['line_items[0][quantity]', 1],
          ['success_url', successUrl],
          ['cancel_url', cancelUrl],
          ['metadata[user_id]', args.userId],
          ['metadata[course_id]', args.courseId],
          ['client_reference_id', args.userId],
        ]),
      })

      return {
        sessionId: session.id,
        url: session.url,
      }
    },

    async parseCheckoutCompletedEvent({ payload, stripeSignature }) {
      const { timestamp, signatures } =
        parseStripeSignatureHeader(stripeSignature)
      if (!timestamp || signatures.length === 0) {
        throw new Error('Invalid Stripe signature header.')
      }

      const now = toIsoNowSeconds()
      if (Math.abs(now - timestamp) > WEBHOOK_TOLERANCE_SECONDS) {
        throw new Error('Stripe webhook timestamp outside tolerance window.')
      }

      const signedPayload = `${timestamp}.${payload}`
      const expected = await hmacSha256Hex(webhookSecret, signedPayload)
      const valid = signatures.some((signature) => signature === expected)
      if (!valid) {
        throw new Error('Stripe webhook signature verification failed.')
      }

      const event = JSON.parse(payload) as StripeWebhookEvent
      if (
        event.type !== 'checkout.session.completed' &&
        event.type !== 'checkout.session.async_payment_succeeded'
      ) {
        return null
      }

      const object = event.data?.object
      if (!object?.id) {
        throw new Error('Stripe checkout session payload missing id.')
      }

      const paymentIntentId =
        typeof object.payment_intent === 'string'
          ? object.payment_intent
          : (object.payment_intent?.id ?? null)

      return {
        eventType: event.type,
        id: object.id,
        paymentIntentId,
        paymentStatus: object.payment_status ?? 'unknown',
        status: object.status ?? null,
        amountTotal:
          typeof object.amount_total === 'number' ? object.amount_total : null,
        currency: object.currency ? toLowerTrimmed(object.currency) : null,
        userId: object.metadata?.user_id ?? null,
        courseId: object.metadata?.course_id ?? null,
      }
    },
  }
}
