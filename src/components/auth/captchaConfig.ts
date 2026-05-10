// WS2 — hCaptcha env configuration. Split out from CaptchaGate.tsx so that
// the constant export co-exists with a component without breaking the React
// fast-refresh "components only" rule.

const SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITEKEY as string | undefined

export const captchaSiteKey: string | undefined = SITE_KEY
export const captchaIsRequired: boolean = Boolean(SITE_KEY)
