import { useRef } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { captchaSiteKey } from './captchaConfig'

interface CaptchaGateProps {
  onVerify: (token: string) => void
  onExpire?: () => void
}

export interface CaptchaGateHandle {
  reset: () => void
}

/**
 * WS2 — hCaptcha widget gate for auth forms (signup/login/forgot).
 *
 * - When `VITE_HCAPTCHA_SITEKEY` is set : renders the real hCaptcha widget.
 *   The user must solve it before the form's onVerify fires with a token.
 *   The form must include this token in the auth call (`options.captchaToken`).
 *
 * - When `VITE_HCAPTCHA_SITEKEY` is unset (dev / preview without captcha) :
 *   renders nothing and the page should NOT gate submit on token presence.
 *   This lets local dev flows work without a captcha account.
 */
export function CaptchaGate({ onVerify, onExpire }: CaptchaGateProps) {
  const ref = useRef<HCaptcha>(null)

  if (!captchaSiteKey) return null

  return (
    <div className="flex justify-center">
      <HCaptcha
        ref={ref}
        sitekey={captchaSiteKey}
        onVerify={(token) => onVerify(token)}
        onExpire={() => {
          onExpire?.()
        }}
        theme="light"
      />
    </div>
  )
}
