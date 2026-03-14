import 'reflect-metadata'
import { createYoga } from 'graphql-yoga'
import { createSchema } from './graphql/schema.js'
import { createContextFactory } from './graphql/context.js'
import type { RuntimeServices } from './runtime/services.js'
import { runtimeLogger } from './runtime/logger.js'

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

async function handleStripeWebhook(
  request: Request,
  services: RuntimeServices,
) {
  if (!services.stripe) {
    return jsonResponse(503, {
      error: 'Stripe webhook handling is not configured.',
    })
  }

  const stripeSignature = request.headers.get('stripe-signature')
  if (!stripeSignature) {
    return jsonResponse(400, { error: 'Missing Stripe signature header.' })
  }

  const payload = await request.text()
  try {
    const event = await services.stripe.parseCheckoutCompletedEvent({
      payload,
      stripeSignature,
    })

    if (!event) {
      return jsonResponse(200, { received: true, ignored: true })
    }

    if (event.paymentStatus !== 'paid') {
      return jsonResponse(200, {
        received: true,
        ignored: true,
        reason: 'payment_not_paid',
      })
    }

    if (!event.userId || !event.courseId) {
      throw new Error('Missing required checkout metadata (user_id/course_id).')
    }

    if (typeof event.amountTotal !== 'number' || event.amountTotal <= 0) {
      throw new Error('Missing or invalid checkout amount.')
    }

    const currency = event.currency ?? 'eur'

    await services.courseRepository.recordStripePayment({
      userId: event.userId,
      courseId: event.courseId,
      stripeSessionId: event.id,
      stripePaymentIntentId: event.paymentIntentId,
      amountCents: event.amountTotal,
      currency,
      status: event.paymentStatus,
    })

    await services.courseRepository.ensureEnrollmentForPaidCourse({
      userId: event.userId,
      courseId: event.courseId,
    })

    return jsonResponse(200, {
      received: true,
      sessionId: event.id,
    })
  } catch (error) {
    runtimeLogger.error(
      `[api] Stripe webhook processing failed: ${error instanceof Error ? error.message : String(error)}`,
    )
    return jsonResponse(500, {
      error: 'Stripe webhook processing failed.',
    })
  }
}

export function isStripeWebhookRequest(
  request: { method?: string; url?: string } | null | undefined,
  services: RuntimeServices,
) {
  if (!request || typeof request.url !== 'string') {
    return false
  }

  try {
    const url = new URL(request.url)
    return (
      request.method === 'POST' &&
      (url.pathname === services.env.stripeWebhookEndpoint ||
        url.pathname.endsWith('/webhooks/stripe'))
    )
  } catch {
    return false
  }
}

export function handleStripeWebhookRequest(
  request: Request,
  services: RuntimeServices,
) {
  return handleStripeWebhook(request, services)
}

function isRequestObject(value: string | URL | Request): value is Request {
  return value instanceof Request
}

export async function createApiApp(services: RuntimeServices) {
  const schema = await createSchema()

  const yoga = createYoga({
    schema,
    context: createContextFactory(services),
    graphqlEndpoint: services.env.graphqlEndpoint,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  })

  const originalFetch = yoga.fetch.bind(yoga)
  const wrappedFetch = ((...args: unknown[]) => {
    const request = args[0] as string | URL | Request

    if (isRequestObject(request) && isStripeWebhookRequest(request, services)) {
      return handleStripeWebhookRequest(request, services)
    }

    if (request instanceof URL) {
      return originalFetch(request, ...(args.slice(1) as []))
    }

    if (typeof request === 'string') {
      return originalFetch(request, ...(args.slice(1) as []))
    }

    return originalFetch(request as Request, ...(args.slice(1) as []))
  }) as typeof yoga.fetch
  yoga.fetch = wrappedFetch

  return yoga
}
