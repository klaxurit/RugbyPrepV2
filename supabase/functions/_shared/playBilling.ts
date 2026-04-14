/**
 * Google Play Billing — product ID mapping & purchase verification.
 *
 * Product IDs must match those created in Google Play Console.
 * Convention: reverse-domain style, e.g. "fr.rugbyforge.premium.monthly"
 */

const PLAY_PRODUCT_CONFIG = {
  monthly: 'premium.monthly',
  yearly: 'premium.yearly',
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
  startTime?: string
  subscriptionState?: string
  latestOrderId?: string
  acknowledgementState?: string
  lineItems?: Array<{
    productId?: string
    expiryTime?: string
    autoRenewingPlan?: {
      autoRenewEnabled?: boolean
    }
  }>
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

  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${purchaseToken}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    return { valid: false, planId: null, expiresAt: null, startedAt: null, autoRenewing: false, orderId: null, error: `Play API ${res.status}: ${text}` }
  }

  const sub = (await res.json()) as PlaySubscriptionResource
  const planId = getPlanIdForPlayProduct(productId)
  const matchingLineItem =
    sub.lineItems?.find((lineItem) => lineItem.productId === productId) ??
    sub.lineItems?.[0] ??
    null

  const expiresAt = matchingLineItem?.expiryTime ?? null
  const expiryMs = expiresAt ? new Date(expiresAt).getTime() : 0
  const subscriptionState = sub.subscriptionState ?? ''
  const isEntitledState =
    subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' ||
    subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' ||
    (subscriptionState === 'SUBSCRIPTION_STATE_CANCELED' && expiryMs > Date.now())
  const isActive = expiryMs > Date.now() && isEntitledState

  return {
    valid: isActive,
    planId,
    expiresAt,
    startedAt: sub.startTime ?? null,
    autoRenewing: matchingLineItem?.autoRenewingPlan?.autoRenewEnabled ?? false,
    orderId: sub.latestOrderId ?? null,
  }
}
