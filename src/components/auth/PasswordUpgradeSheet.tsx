import { useState } from 'react'
import type { FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { tr, type Lang } from '../../i18n/appLabels'
import { MIN_PASSWORD_LENGTH, isPasswordMeetingPolicy, passwordTooWeakMessage } from '../../services/auth/passwordPolicy'

interface PasswordUpgradeSheetProps {
  open: boolean
  lang?: Lang
  isLoading?: boolean
  error?: string | null
  onSubmit: (password: string) => void | Promise<void>
}

export function PasswordUpgradeSheet({
  open,
  lang = 'fr',
  isLoading = false,
  error = null,
  onSubmit,
}: PasswordUpgradeSheetProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)

    if (!isPasswordMeetingPolicy(password)) {
      setLocalError(passwordTooWeakMessage())
      return
    }
    if (password !== confirmPassword) {
      setLocalError(tr('password_upgrade_mismatch', lang))
      return
    }

    void onSubmit(password)
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => undefined}
      ariaLabel={tr('password_upgrade_aria', lang)}
      eyebrow={tr('password_upgrade_eyebrow', lang)}
      title={tr('password_upgrade_title', lang)}
      disableBackdropDismiss
      disableSwipeDismiss
      showClose={false}
    >
      <form className="space-y-5 pb-2" onSubmit={handleSubmit} noValidate>
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
            <Lock className="h-8 w-8" strokeWidth={2.2} />
          </div>
        </div>

        <p className="text-center text-sm leading-relaxed text-fg-muted [text-wrap:balance]">
          {tr('password_upgrade_body', lang)}
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="upgrade-password" className="text-xs font-bold text-fg-soft uppercase tracking-wider">
              {tr('password_upgrade_new', lang)}
            </label>
            <input
              id="upgrade-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full h-12 rounded-2xl border-2 border-border-app bg-layer-5 px-4 text-fg placeholder:text-fg-faint rf-focus-ring text-sm"
              placeholder={tr('password_min_placeholder', lang)}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="upgrade-password-confirm" className="text-xs font-bold text-fg-soft uppercase tracking-wider">
              {tr('password_upgrade_confirm', lang)}
            </label>
            <input
              id="upgrade-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full h-12 rounded-2xl border-2 border-border-app bg-layer-5 px-4 text-fg placeholder:text-fg-faint rf-focus-ring text-sm"
              placeholder={tr('password_upgrade_confirm_placeholder', lang)}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </div>
        </div>

        {(localError || error) && (
          <div className="p-3.5 bg-danger-bg border border-danger-bd rounded-2xl">
            <p className="text-xs text-danger font-medium">{localError || error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-black text-on-brand shadow-brand-float transition-colors hover:bg-brand-hover disabled:opacity-60 rf-focus-ring"
        >
          {isLoading ? tr('password_upgrade_saving', lang) : tr('password_upgrade_cta', lang)}
        </button>
      </form>
    </BottomSheet>
  )
}
