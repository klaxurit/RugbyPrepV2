import { useState } from 'react'
import type { FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { PasswordField } from './PasswordField'
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
          <PasswordField
            id="upgrade-password"
            label={tr('password_upgrade_new', lang)}
            value={password}
            onChange={setPassword}
            lang={lang}
            fieldSize="md"
            placeholder={tr('password_min_placeholder', lang)}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
          <PasswordField
            id="upgrade-password-confirm"
            label={tr('password_upgrade_confirm', lang)}
            value={confirmPassword}
            onChange={setConfirmPassword}
            lang={lang}
            fieldSize="md"
            placeholder={tr('password_upgrade_confirm_placeholder', lang)}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
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
