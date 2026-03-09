const textEncoder = new TextEncoder()

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function normalizeBase64UrlInput(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

function fromB64url(str: string, label: string): Uint8Array {
  const normalized = normalizeBase64UrlInput(str).replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '=')
  try {
    const binary = atob(padded)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
  } catch {
    throw new Error(`Invalid base64url value for ${label}`)
  }
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, array) => sum + array.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const array of arrays) {
    result.set(array, offset)
    offset += array.length
  }
  return result
}

function derToJoseSignature(signature: ArrayBuffer | Uint8Array, partLength = 32): Uint8Array {
  const bytes = signature instanceof Uint8Array ? signature : new Uint8Array(signature)

  // Some runtimes already return IEEE-P1363 (r||s) for ECDSA. Keep it as-is.
  if (bytes.length === partLength * 2) {
    return bytes
  }

  if (bytes.length < 8 || bytes[0] !== 0x30) {
    throw new Error('Unsupported ECDSA signature format')
  }

  let offset = 1
  const sequenceLength = bytes[offset++]
  if (sequenceLength & 0x80) {
    const lengthBytes = sequenceLength & 0x7f
    offset += lengthBytes
  }

  const readInteger = (): Uint8Array => {
    if (bytes[offset++] !== 0x02) {
      throw new Error('Invalid DER signature integer marker')
    }

    const length = bytes[offset++]
    const value = bytes.slice(offset, offset + length)
    offset += length

    let normalized = value
    while (normalized.length > 0 && normalized[0] === 0x00) {
      normalized = normalized.slice(1)
    }

    if (normalized.length > partLength) {
      normalized = normalized.slice(normalized.length - partLength)
    }

    const out = new Uint8Array(partLength)
    out.set(normalized, partLength - normalized.length)
    return out
  }

  const r = readInteger()
  const s = readInteger()
  return concat(r, s)
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    keyMaterial,
    length * 8,
  )
  return new Uint8Array(bits)
}

async function createVapidToken(
  audience: string,
  subject: string,
  vapidPublicKeyBytes: Uint8Array,
  vapidPrivateKeyBytes: Uint8Array,
): Promise<string> {
  const x = b64url(vapidPublicKeyBytes.slice(1, 33))
  const y = b64url(vapidPublicKeyBytes.slice(33, 65))
  const d = b64url(vapidPrivateKeyBytes)

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x, y, d, key_ops: ['sign'] },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )

  const header = b64url(textEncoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = b64url(textEncoder.encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  })))

  const input = `${header}.${claims}`
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    textEncoder.encode(input),
  )

  return `${input}.${b64url(derToJoseSignature(signature))}`
}

async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string,
): Promise<Uint8Array> {
  const payloadBytes = textEncoder.encode(payload)
  const clientPublicKeyBytes = fromB64url(p256dh, 'push subscription p256dh key')
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )

  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  )
  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', serverKeyPair.publicKey),
  )

  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeyPair.privateKey,
    256,
  )
  const sharedSecret = new Uint8Array(sharedBits)

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyInfo = concat(
    textEncoder.encode('WebPush: info\x00'),
    clientPublicKeyBytes,
    serverPublicKeyRaw,
  )
  const ikm = await hkdf(fromB64url(auth, 'push subscription auth key'), sharedSecret, keyInfo, 32)
  const cek = await hkdf(salt, ikm, textEncoder.encode('Content-Encoding: aes128gcm\x00'), 16)
  const nonce = await hkdf(salt, ikm, textEncoder.encode('Content-Encoding: nonce\x00'), 12)

  const padded = concat(payloadBytes, new Uint8Array([2]))
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt'])
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded),
  )

  const rs = new Uint8Array(4)
  new DataView(rs.buffer).setUint32(0, 4096, false)

  return concat(salt, rs, new Uint8Array([serverPublicKeyRaw.length]), serverPublicKeyRaw, ciphertext)
}

export interface WebPushConfig {
  publicKey: string
  privateKey: string
  subject: string
}

export interface WebPushPayload {
  title?: string
  body?: string
  url?: string
  tag?: string
}

export const getWebPushConfig = (): WebPushConfig | null => {
  const publicKey = normalizeBase64UrlInput(Deno.env.get('VAPID_PUBLIC_KEY') ?? '')
  const privateKey = normalizeBase64UrlInput(Deno.env.get('VAPID_PRIVATE_KEY') ?? '')
  const subject =
    Deno.env.get('VAPID_SUBJECT') ??
    Deno.env.get('VAPID_CONTACT') ??
    'mailto:bonjour@rugbyforge.fr'

  if (!publicKey || !privateKey) return null

  return { publicKey, privateKey, subject }
}

export const sendWebPush = async (
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: WebPushPayload,
  config: WebPushConfig,
): Promise<{ status: number; body: string }> => {
  const vapidPublicKeyBytes = fromB64url(config.publicKey, 'VAPID_PUBLIC_KEY')
  const vapidPrivateKeyBytes = fromB64url(config.privateKey, 'VAPID_PRIVATE_KEY')

  const url = new URL(endpoint)
  const token = await createVapidToken(
    url.origin,
    config.subject,
    vapidPublicKeyBytes,
    vapidPrivateKeyBytes,
  )

  const encryptedBody = await encryptPayload(JSON.stringify(payload), p256dh, auth)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${token},k=${config.publicKey}`,
      'Crypto-Key': `p256ecdsa=${config.publicKey}`,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '86400',
      Urgency: 'normal',
    },
    body: encryptedBody,
  })

  return {
    status: response.status,
    body: await response.text(),
  }
}
