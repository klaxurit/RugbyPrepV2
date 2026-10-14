/**
 * Landing attribution (UTM + referrer) for the activation funnel.
 * Persists once per browser tab session — no profile DB migration.
 */

export const ATTRIBUTION_STORAGE_KEY = 'rf_landing_attribution_v1'

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const

export type UtmKey = (typeof UTM_KEYS)[number]

export interface LandingAttribution {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  referrer?: string
  landing_path?: string
  captured_at?: string
}

function readSessionStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSessionStorage(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* private mode / quota */
  }
}

export function parseAttributionFromSearch(
  search: string,
  referrer = '',
  landingPath = '/',
): LandingAttribution {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  )
  const out: LandingAttribution = {
    captured_at: new Date().toISOString(),
    landing_path: landingPath || '/',
  }

  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim()
    if (value) out[key] = value
  }

  const ref = referrer.trim()
  if (ref) out.referrer = ref

  return out
}

export function hasAttributionSignal(attr: LandingAttribution): boolean {
  return UTM_KEYS.some((k) => Boolean(attr[k])) || Boolean(attr.referrer)
}

/** Capture current URL attribution once per tab session (keeps first touch). */
export function captureLandingAttributionOnce(
  input: {
    search?: string
    referrer?: string
    pathname?: string
  } = {},
): LandingAttribution {
  const existing = getAttribution()
  if (existing && hasAttributionSignal(existing)) return existing

  const search =
    input.search ??
    (typeof window !== 'undefined' ? window.location.search : '')
  const referrer =
    input.referrer ??
    (typeof document !== 'undefined' ? document.referrer : '')
  const pathname =
    input.pathname ??
    (typeof window !== 'undefined' ? window.location.pathname : '/')

  const next = parseAttributionFromSearch(search, referrer, pathname)
  if (hasAttributionSignal(next) || !existing) {
    writeSessionStorage(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next))
  }
  return getAttribution() ?? next
}

export function getAttribution(): LandingAttribution | null {
  const raw = readSessionStorage(ATTRIBUTION_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as LandingAttribution
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

/** Flat props safe to spread into PostHog capture / identify. */
export function attributionAsEventProps(
  attr: LandingAttribution | null = getAttribution(),
): Record<string, string> {
  if (!attr) return {}
  const props: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const value = attr[key]
    if (value) props[key] = value
  }
  if (attr.referrer) props.referrer = attr.referrer
  if (attr.landing_path) props.landing_path = attr.landing_path
  return props
}
