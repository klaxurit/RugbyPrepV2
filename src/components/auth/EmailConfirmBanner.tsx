import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useHintVisibility } from '../../hooks/useHintVisibility'
import { useProfile } from '../../hooks/useProfile'
import { tr, type Lang } from '../../i18n/appLabels'
import {
  resendSignupConfirmation,
  shouldPromptEmailConfirmation,
} from '../../services/auth/emailConfirmation'
import { InlineNotice } from '../ui/InlineNotice'

const HINT_ID = 'email_confirm_banner'

export function EmailConfirmBanner() {
  const { authState } = useAuth()
  const { profile } = useProfile()
  const hint = useHintVisibility(HINT_ID, { cooldownDays: 21 })
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sent' | 'rate_limit' | 'failed'>('idle')

  const user = authState.status === 'authenticated' ? authState.user : null
  const lang: Lang = profile.preferredLanguage === 'en' ? 'en' : 'fr'
  const show =
    Boolean(user) &&
    shouldPromptEmailConfirmation({
      emailConfirmed: user?.emailConfirmed,
      email: user?.email,
    }) &&
    hint.visible &&
    !hint.loading

  if (!show || !user) return null

  const handleResend = async () => {
    setSending(true)
    const result = await resendSignupConfirmation(user.email)
    setSending(false)
    if (result.ok) {
      setStatus('sent')
      return
    }
    setStatus(result.error)
  }

  const statusMessage =
    status === 'sent'
      ? tr('email_confirm_sent', lang)
      : status === 'rate_limit'
        ? tr('email_confirm_rate', lang)
        : status === 'failed'
          ? tr('email_confirm_failed', lang)
          : null

  return (
    <div className="px-4 pt-3">
      <InlineNotice
        tone="info"
        title={tr('email_confirm_title', lang)}
        onDismiss={hint.dismiss}
        dismissLabel={tr('email_confirm_later', lang)}
        data-testid="email-confirm-banner"
      >
        <p>{tr('email_confirm_body', lang)}</p>
        {statusMessage ? <p className="mt-1 font-semibold">{statusMessage}</p> : null}
        {status !== 'sent' ? (
          <button
            type="button"
            onClick={() => { void handleResend() }}
            disabled={sending}
            className="mt-2 text-[0.75rem] font-semibold underline underline-offset-2 text-info rf-focus-ring disabled:opacity-50"
          >
            {tr('email_confirm_resend', lang)}
          </button>
        ) : null}
      </InlineNotice>
    </div>
  )
}
