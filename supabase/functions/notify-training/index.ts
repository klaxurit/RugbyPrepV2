/**
 * notify-training — Envoie les rappels d'entraînement du jour
 * Implémente le protocole Web Push (RFC 8030 + RFC 8188 + RFC 8291 + RFC 8292)
 * via les API WebCrypto natives de Deno — aucune dépendance externe.
 *
 * Variables d'environnement requises (Supabase secrets) :
 *   VAPID_PUBLIC_KEY   — clé publique VAPID (base64url, 65 bytes P-256)
 *   VAPID_PRIVATE_KEY  — clé privée VAPID (base64url, 32 bytes scalar)
 *   VAPID_CONTACT      — mailto:... ou URL de contact
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

// ─── Utilitaires base64url ─────────────────────────────────────

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromB64url(str: string): Uint8Array {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = s.padEnd(s.length + (4 - s.length % 4) % 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) { result.set(a, offset); offset += a.length }
  return result
}

// ─── HKDF-SHA-256 ─────────────────────────────────────────────

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const keyMat = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    keyMat,
    length * 8,
  )
  return new Uint8Array(bits)
}

// ─── VAPID JWT (ES256, RFC 8292) ───────────────────────────────

async function createVapidToken(
  audience: string,
  subject: string,
  vapidPublicKeyBytes: Uint8Array,  // 65 bytes — uncompressed P-256 point
  vapidPrivateKeyBytes: Uint8Array, // 32 bytes — raw EC scalar
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

  const te = new TextEncoder()
  const header = b64url(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = b64url(te.encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  })))

  const input = `${header}.${claims}`
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    te.encode(input),
  )

  return `${input}.${b64url(sig)}`
}

// ─── Chiffrement payload (RFC 8188 aes128gcm + RFC 8291) ────────

async function encryptPayload(
  payload: string,
  p256dh: string,  // clé publique de l'abonné (base64url, 65 bytes)
  auth: string,    // secret d'authentification (base64url, 16 bytes)
): Promise<Uint8Array> {
  const te = new TextEncoder()
  const payloadBytes = te.encode(payload)

  // 1. Clé publique du client
  const clientPublicKeyBytes = fromB64url(p256dh)
  const clientPublicKey = await crypto.subtle.importKey(
    'raw', clientPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, [],
  )

  // 2. Paire de clés éphémères du serveur
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, ['deriveBits'],
  )
  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', serverKeyPair.publicKey),
  )

  // 3. Secret partagé ECDH
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeyPair.privateKey,
    256,
  )
  const sharedSecret = new Uint8Array(sharedBits)

  // 4. Salt aléatoire (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // 5. IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info\0" || client_pub || server_pub, 32)
  const keyInfo = concat(
    te.encode('WebPush: info\x00'),
    clientPublicKeyBytes,
    serverPublicKeyRaw,
  )
  const ikm = await hkdf(fromB64url(auth), sharedSecret, keyInfo, 32)

  // 6. CEK = HKDF(salt, IKM, "Content-Encoding: aes128gcm\0", 16)
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\x00'), 16)

  // 7. Nonce = HKDF(salt, IKM, "Content-Encoding: nonce\0", 12)
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\x00'), 12)

  // 8. Chiffrement AES-128-GCM (payload + délimiteur 0x02)
  const padded = concat(payloadBytes, new Uint8Array([2]))
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt'])
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded),
  )

  // 9. En-tête RFC 8188 : salt (16) + rs (4, BE) + idlen (1) + server_pub (65) + ciphertext
  const rs = new Uint8Array(4)
  new DataView(rs.buffer).setUint32(0, 4096, false)

  return concat(salt, rs, new Uint8Array([serverPublicKeyRaw.length]), serverPublicKeyRaw, ciphertext)
}

// ─── Envoi Web Push ────────────────────────────────────────────

async function sendWebPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidContact: string,
): Promise<{ status: number }> {
  const vapidPublicKeyBytes = fromB64url(vapidPublicKey)
  const vapidPrivateKeyBytes = fromB64url(vapidPrivateKey)

  const url = new URL(endpoint)
  const token = await createVapidToken(
    url.origin,
    vapidContact,
    vapidPublicKeyBytes,
    vapidPrivateKeyBytes,
  )

  const body = await encryptPayload(payload, p256dh, auth)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${token},k=${vapidPublicKey}`,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Urgency': 'normal',
    },
    body,
  })

  return { status: response.status }
}

// ─── Handler ───────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    const VAPID_CONTACT = Deno.env.get('VAPID_CONTACT') ?? 'mailto:coach@rugbyprep.app'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Jour de la semaine en Europe/Paris (0=Dim, 1=Lun, ..., 6=Sam)
    const nowParis = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
    const todayDow = nowParis.getDay()

    // Abonnements du jour (URL-encode les accolades pour PostgREST)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?training_days=cs.%7B${todayDow}%7D&select=endpoint,p256dh_key,auth_key`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    )

    if (!res.ok) {
      const body = await res.text()
      return new Response(
        JSON.stringify({ error: `Supabase query error: ${body}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    interface SubRow { endpoint: string; p256dh_key: string; auth_key: string }
    const subscriptions: SubRow[] = await res.json()

    if (subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, expired_removed: 0, total: 0, note: `Aucun abonné pour le jour ${todayDow}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const payload = JSON.stringify({
      title: '🏉 Jour de séance !',
      body: "Ton programme t'attend. C'est le moment de performer.",
      url: '/week',
      tag: 'training-reminder',
    })

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendWebPush(
          sub.endpoint,
          sub.p256dh_key,
          sub.auth_key,
          payload,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY,
          VAPID_CONTACT,
        )
      ),
    )

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as { status: number }).status < 300,
    ).length
    const failed = results.filter((r) => r.status === 'rejected').length

    // Supprime les abonnements expirés (410 Gone)
    const expiredEndpoints = subscriptions
      .filter((_, i) => {
        const r = results[i]
        return r.status === 'fulfilled' && (r.value as { status: number }).status === 410
      })
      .map((sub) => sub.endpoint)

    if (expiredEndpoints.length > 0) {
      await Promise.all(
        expiredEndpoints.map((endpoint) =>
          fetch(
            `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
            {
              method: 'DELETE',
              headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
            },
          )
        ),
      )
    }

    return new Response(
      JSON.stringify({ sent, failed, expired_removed: expiredEndpoints.length, total: subscriptions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
