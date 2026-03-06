const STRIPE_API_BASE_URL = 'https://api.stripe.com'

type StripePriceConfig = {
  monthly: string
  yearly: string
}

const DEFAULT_PRICE_CONFIG: StripePriceConfig = {
  monthly: 'price_1T7d7SA0Tj8d0YU9wdm1h3pO',
  yearly: 'price_1T7d8uA0Tj8d0YU9R2xW5ZcG',
}

const toHex = (bytes: Uint8Array): string =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')

const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false

  let out = 0
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return out === 0
}

const getPriceConfig = (): StripePriceConfig => ({
  monthly: Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY') ?? DEFAULT_PRICE_CONFIG.monthly,
  yearly: Deno.env.get('STRIPE_PRICE_PREMIUM_YEARLY') ?? DEFAULT_PRICE_CONFIG.yearly,
})

export const getStripePriceIdForPlan = (planId: string): string | null => {
  const config = getPriceConfig()
  if (planId === 'premium_monthly') return config.monthly
  if (planId === 'premium_yearly') return config.yearly
  return null
}

export const getPlanIdForStripePrice = (priceId: string | null | undefined): string | null => {
  if (!priceId) return null
  const config = getPriceConfig()
  if (priceId === config.monthly) return 'premium_monthly'
  if (priceId === config.yearly) return 'premium_yearly'
  return null
}

export const stripeRequest = async (
  secretKey: string,
  path: string,
  init?: {
    method?: 'GET' | 'POST' | 'DELETE'
    body?: URLSearchParams
  },
) => {
  const response = await fetch(`${STRIPE_API_BASE_URL}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(init?.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: init?.body?.toString(),
  })

  const text = await response.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  }
}

export const verifyStripeWebhookSignature = async (
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
): Promise<boolean> => {
  if (!signatureHeader) return false

  const parts = signatureHeader.split(',').map((part) => part.trim())
  const timestampPart = parts.find((part) => part.startsWith('t='))
  const v1Parts = parts.filter((part) => part.startsWith('v1='))

  if (!timestampPart || v1Parts.length === 0) return false

  const timestamp = timestampPart.slice(2)
  const timestampMs = Number(timestamp) * 1000
  if (!Number.isFinite(timestampMs)) return false

  const toleranceMs = 5 * 60 * 1000
  if (Math.abs(Date.now() - timestampMs) > toleranceMs) return false

  const signedPayload = `${timestamp}.${rawBody}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const expected = toHex(new Uint8Array(signatureBuffer))

  return v1Parts.some((part) => timingSafeEqual(part.slice(3), expected))
}
