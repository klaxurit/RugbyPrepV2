/**
 * Google Play Billing — product ID mapping & purchase verification.
 *
 * Product IDs must match those created in Google Play Console.
 * Convention: reverse-domain style, e.g. "fr.rugbyforge.premium.monthly"
 */

const PLAY_PRODUCT_CONFIG = {
  monthly: 'fr.rugbyforge.premium.monthly',
  yearly: 'fr.rugbyforge.premium.yearly',
} as const

export const getPlayProductIdForPlan = (planId: string): string | null => {
  if (planId === 'premium_monthly') return PLAY_PRODUCT_CONFIG.monthly
  if (planId === 'premium_yearly') return PLAY_PRODUCT_CONFIG.yearly
  return null
}

export const getPlanIdForPlayProduct = (productId: string): string | null => {
  if (productId === PLAY_PRODUCT_CONFIG.monthly) return 'premium_monthly'
  if (productId === PLAY_PRODUCT_CONFIG.yearly) return 'premium_yearly'
  return null
}

/**
 * Get a Google OAuth2 access token from a service account key.
 * Required scope: https://www.googleapis.com/auth/androidpublisher
 */
const getGoogleAccessToken = async (serviceAccountKey: {
  client_email: string
  private_key: string
  token_uri: string
}): Promise<string> => {
  const now = Math.floor(Date.now() / 1000)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      iss: serviceAccountKey.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: serviceAccountKey.token_uri,
      iat: now,
      exp: now + 3600,
    }),
  )

  const signingInput = `${header}.${payload}`

  // Import the RSA private key (PEM → CryptoKey)
  const pemBody = serviceAccountKey.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  )
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const jwt = `${header}.${payload}.${signature}`

  const res = await fetch(serviceAccountKey.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google OAuth2 token request failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

type PlaySubscriptionResource = {
  kind: string
  startTimeMillis?: string
  expiryTimeMillis?: string
  autoRenewing?: boolean
  cancelReason?: number
  paymentState?: number
  orderId?: string
}

export type VerifyResult = {
  valid: boolean
  planId: string | null
  expiresAt: string | null
  startedAt: string | null
  autoRenewing: boolean
  orderId: string | null
  error?: string
}

/**
 * Verify a Google Play subscription purchase token via the Android Publisher API.
 */
export const verifyPlayPurchase = async (
  packageName: string,
  productId: string,
  purchaseToken: string,
): Promise<VerifyResult> => {
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
  if (!serviceAccountJson) {
    return { valid: false, planId: null, expiresAt: null, startedAt: null, autoRenewing: false, orderId: null, error: 'GOOGLE_SERVICE_ACCOUNT_KEY not configured' }
  }

  const serviceAccountKey = JSON.parse(serviceAccountJson) as {
    client_email: string
    private_key: string
    token_uri: string
  }

  const accessToken = await getGoogleAccessToken(serviceAccountKey)

  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    return { valid: false, planId: null, expiresAt: null, startedAt: null, autoRenewing: false, orderId: null, error: `Play API ${res.status}: ${text}` }
  }

  const sub = (await res.json()) as PlaySubscriptionResource
  const planId = getPlanIdForPlayProduct(productId)
  const expiryMs = sub.expiryTimeMillis ? Number(sub.expiryTimeMillis) : 0
  const isActive = expiryMs > Date.now()

  return {
    valid: isActive,
    planId,
    expiresAt: expiryMs ? new Date(expiryMs).toISOString() : null,
    startedAt: sub.startTimeMillis ? new Date(Number(sub.startTimeMillis)).toISOString() : null,
    autoRenewing: sub.autoRenewing ?? false,
    orderId: sub.orderId ?? null,
  }
}
